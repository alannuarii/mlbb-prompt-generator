import { GoogleGenAI } from "@google/genai";
import {
  createGeminiClient,
  getAvailableKey,
  isRateLimitError,
  markKeyBlockedAndGetFallback,
} from "./gemini-keys";
import {
  buildCacheKey,
  getOrCreateCache,
  extractResponseText,
  cleanResponseText,
} from "./gemini-cache";
import type { CacheImagePart } from "./gemini-cache";

const DEFAULT_MODEL = "gemini-2.5-flash";

interface HeroImage {
  heroName: string;
  base64Data: string;
  mimeType: string;
}

interface GenerateVideoPromptParams {
  narrative: string;
  heroes: HeroImage[];
  aspectRatio: string;
  duration: string;
  cameraMovement: string;
  motionIntensity: string;
  videoStyle: string;
  mood: string;
  soundDesign: string;
  singleMode: "frame" | "ingredient";
  modelName?: string;
}

const SYSTEM_INSTRUCTION_VIDEO = `You are an expert prompt engineer specializing in AI video generation from still images. Your task is to create a highly detailed, structured JSON prompt that will be used to animate a PHOTOREALISTIC still image into a cinematic video clip.

CRITICAL CONTEXT:
- The user has ALREADY generated a photorealistic image of MLBB heroes using a previous prompt.
- They will upload this generated image to Google Flow alongside your JSON prompt.
- Your job is to describe HOW the still image should come to LIFE as a video — movement, camera work, environmental animation, character actions, and atmosphere.

CORE OBJECTIVE — IMAGE TO VIDEO ANIMATION:
Describe precisely how the still image should be animated. Think of the image as a frozen frame from a movie — your prompt unfreezes it.

INSTRUCTIONS:
1. ANALYZE the uploaded reference image (the generated photorealistic still).
2. IDENTIFY all elements that can be animated:
   - Character movements (breathing, blinking, turning head, gestures, walking, fighting)
   - Hair and clothing physics (wind, gravity, movement flow)
   - Environmental elements (clouds, leaves, fire, water, dust, smoke, light rays)
   - Camera movements (pan, zoom, dolly, orbit, crane, tracking)
   - Lighting changes (sun movement, flickering, shadows shifting)
   - Atmospheric effects (fog rolling, rain falling, sparks floating)
3. COMPOSE a cinematic sequence that feels natural and dynamic.
4. OUTPUT a single valid JSON object with the following structure:

{
  "video_prompt": "THE MOST IMPORTANT FIELD. A single comprehensive paragraph describing the complete video animation: what moves, how the camera behaves, environmental animations, character motion, transitions in lighting, and atmospheric effects. This must read like a film director's shot description — precise, visual, and cinematic. Include the duration and style.",
  "negative_prompt": "static image, freeze frame, slideshow, morphing, distorted faces, unnatural movement, glitchy, low framerate, blurry motion, text overlay, watermark",
  "camera_movement": {
    "type": "The camera movement type",
    "description": "Detailed description of how the camera moves throughout the clip"
  },
  "character_animation": [
    {
      "name": "Hero name",
      "motion": "Detailed description of character's movements — facial expressions, body movement, gestures, hair/clothing physics"
    }
  ],
  "environment_animation": "Description of how background and environmental elements animate — weather, particles, lighting shifts",
  "duration": "8 seconds",
  "motion_intensity": "Level of motion/action in the clip",
  "mood": "Emotional atmosphere and how it evolves during the clip",
  "sound_design_suggestion": "Suggested sound effects and ambient audio to complement the video",
  "quality_tags": ["cinematic motion", "smooth animation", "natural movement", "film-quality", "60fps", "seamless loop potential"],
  "aspect_ratio": "The specified aspect ratio",
  "style": "cinematic video animation"
}

IMPORTANT RULES:
- The "video_prompt" field is the PRIMARY output used by the video generator. It must be a complete, self-contained description.
- Movements must feel NATURAL and PHYSICALLY ACCURATE — hair sways with wind, fabric follows body movement, lighting shifts gradually.
- Camera movements should be SMOOTH and CINEMATIC — avoid abrupt cuts or jerky motion.
- Character expressions and movements should MATCH the narrative mood.
- Environmental animation adds LIFE — always include at least subtle atmospheric elements (dust particles, light rays, gentle breeze).
- All video clips are exactly 8 SECONDS — design all movements and pacing for this fixed duration.
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;

const SYSTEM_INSTRUCTION_INGREDIENT = `You are an expert prompt engineer specializing in AI video generation. Your task is to create a highly detailed JSON prompt for generating a cinematic video clip using a reference image as VISUAL INGREDIENT (style/character reference), NOT as the starting frame.

CRITICAL CONTEXT — INGREDIENT MODE:
- The user provides reference image(s) of MLBB heroes as VISUAL INGREDIENTS — meaning style guide, character appearance reference, color palette, and mood reference.
- The video is generated FROM SCRATCH based on your text prompt — the image is NOT the first frame.
- You have FULL FREEDOM over camera angle, character pose, composition, and environment.
- The reference image ensures the AI video generator knows what the character LOOKS LIKE, but you decide what they DO and WHERE they are.

CORE OBJECTIVE — INGREDIENT-BASED VIDEO:
Create a complete video scene description that uses the reference image(s) for visual consistency but describes an ENTIRELY NEW composition, pose, and action.

INSTRUCTIONS:
1. ANALYZE the reference image to understand: character appearance (face, hair, clothing, weapons, armor colors), art style, and visual identity.
2. CREATE a new scene that is DIFFERENT from the reference image's composition:
   - New camera angle (you're free to choose any angle)
   - New character pose and action
   - New or enhanced environment
   - New lighting and atmosphere
3. DESCRIBE the character in FULL DETAIL in the prompt (since the video is generated from scratch, the AI needs complete visual description).
4. OUTPUT a single valid JSON object:

{
  "video_prompt": "THE MOST IMPORTANT FIELD. Full paragraph: COMPLETE character visual description (face, hair, clothing, weapons, armor — reference the ingredient image) + environment setup + character action/pose + camera movement + lighting + atmospheric effects. Must be fully self-contained as the AI generates from scratch.",
  "negative_prompt": "static image, freeze frame, slideshow, morphing, distorted faces, unnatural movement, glitchy, low framerate, blurry motion, text overlay, watermark",
  "camera_movement": {
    "type": "The camera movement type (fully free — any angle possible)",
    "description": "Detailed camera movement description"
  },
  "character_animation": [
    {
      "name": "Hero name",
      "appearance": "FULL visual description of the character based on the ingredient image",
      "motion": "Detailed description of character's movements and actions"
    }
  ],
  "environment_animation": "Complete environment description + how it animates",
  "duration": "8 seconds",
  "motion_intensity": "Level of motion/action",
  "mood": "Emotional atmosphere",
  "sound_design_suggestion": "Suggested sound effects",
  "quality_tags": ["cinematic motion", "smooth animation", "natural movement", "film-quality", "60fps"],
  "aspect_ratio": "The specified aspect ratio",
  "style": "cinematic video animation"
}

IMPORTANT RULES:
- The video_prompt MUST include COMPLETE character appearance description (the AI generates from scratch)
- You have FULL FREEDOM over composition, angle, and pose — don't be limited by the reference image's composition
- Make the scene DYNAMIC — since you're not constrained by a starting frame, create more dramatic and cinematic compositions
- Character appearance must MATCH the reference image (same clothes, hair, weapons, features)
- All video clips are exactly 8 SECONDS
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;


export async function generateVideoPrompt(params: GenerateVideoPromptParams): Promise<string> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();
  const MODEL_NAME = params.modelName || DEFAULT_MODEL;

  // ── Bangun image parts dan labels ──
  const heroNames = params.heroes.map(h => h.heroName);
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];

  const isFrame = params.singleMode === "frame";
  const systemInstruction = isFrame ? SYSTEM_INSTRUCTION_VIDEO : SYSTEM_INSTRUCTION_INGREDIENT;

  for (const hero of params.heroes) {
    imageParts.push({ inlineData: { mimeType: hero.mimeType, data: hero.base64Data } });
    imageLabels.push(
      isFrame
        ? `[Generated photorealistic image containing ${hero.heroName} — analyze the scene, character pose, lighting, and environment for animation]`
        : `[Visual ingredient: reference image of ${hero.heroName} — use for character appearance, style, and visual identity. The video will be generated from scratch based on this reference.]`
    );
  }

  // ── Context Caching: cache system instruction + gambar hero ──
  const cacheKey = buildCacheKey(`gemini::video::${params.singleMode}`, heroNames, MODEL_NAME);
  const cachedContentName = await getOrCreateCache({
    ai,
    model: MODEL_NAME,
    cacheKey,
    systemInstruction,
    imageParts,
    imageLabels,
  });

  // ── Bangun user prompt (hanya teks) ──
  const userPrompt = isFrame
    ? `VIDEO SCENE NARRATIVE:
${params.narrative}

HEROES IN THIS SCENE:
${params.heroes.map(h => `- ${h.heroName}`).join("\n")}

VIDEO CONFIGURATION:
- Aspect Ratio: ${params.aspectRatio}
- Target Duration: ${params.duration}
- Camera Movement: ${params.cameraMovement}
- Motion Intensity: ${params.motionIntensity}
- Video Style: ${params.videoStyle}
- Mood/Atmosphere: ${params.mood || "cinematic dramatic"}
- Sound Design Direction: ${params.soundDesign || "cinematic ambient"}

Please analyze the reference images and generate a detailed video animation prompt that brings this still image to life as a cinematic video clip.`
    : `VIDEO SCENE NARRATIVE:
${params.narrative}

HEROES IN THIS SCENE:
${params.heroes.map(h => `- ${h.heroName}`).join("\n")}

VIDEO CONFIGURATION:
- Aspect Ratio: ${params.aspectRatio}
- Target Duration: ${params.duration}
- Camera Movement: ${params.cameraMovement}
- Motion Intensity: ${params.motionIntensity}
- Video Style: ${params.videoStyle}
- Mood/Atmosphere: ${params.mood || "cinematic dramatic"}
- Sound Design Direction: ${params.soundDesign || "cinematic ambient"}

IMPORTANT: Use the reference images as VISUAL INGREDIENTS (character appearance guide). Create a completely new scene composition, pose, and camera angle based on the narrative. The character must look identical to the reference but in a NEW dynamic scene.`;

  // ── Generate content ──
  let contents: object[];
  if (cachedContentName) {
    contents = [{ role: "user", parts: [{ text: userPrompt }] }];
  } else {
    const parts: object[] = [];
    for (let i = 0; i < imageParts.length; i++) {
      parts.push(imageParts[i]);
      parts.push({ text: imageLabels[i] });
    }
    parts.push({ text: userPrompt });
    contents = [{ role: "user", parts }];
  }

  // ── Generate content dengan fallback ──
  const executeGenerate = async (aiClient: GoogleGenAI) => {
    return await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        ...(cachedContentName
          ? { cachedContent: cachedContentName }
          : { systemInstruction }
        ),
        temperature: 1,
        maxOutputTokens: 8192,
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      console.warn(`[Gemini Video] Rate limit hit — attempting key fallback...`);
      const fallbackAi = markKeyBlockedAndGetFallback(currentKey);
      if (fallbackAi) {
        ai = fallbackAi;
        response = await executeGenerate(ai);
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const raw = extractResponseText(response);

  if (!raw) {
    console.error("[Gemini Video] Empty response. Usage:", response.usageMetadata);
    throw new Error("Model returned an empty response. Please try again.");
  }

  const cleaned = cleanResponseText(raw);

  // Validasi JSON
  try {
    JSON.parse(cleaned);
  } catch {
    console.error("[Gemini Video] JSON parse failed. Raw (first 500):", raw.substring(0, 500));
    throw new Error("The AI response was not valid JSON. Please try again.");
  }

  return cleaned;
}


// =============================================================================
// MULTI-SCENE VIDEO — System Instruction
// =============================================================================

const SYSTEM_INSTRUCTION_MULTI_SCENE = `You are an expert prompt engineer specializing in multi-scene cinematic AI video generation using Google Flow's Image-to-Video and Extend features.

CRITICAL CONTEXT — EXTEND WORKFLOW:
- The user has a GENERATED reference image of an MLBB hero (not the basic hero art — this is an AI-generated image with specific pose, environment, and lighting).
- Scene 1 uses IMAGE-TO-VIDEO: the reference image is the starting frame, and the prompt describes how it comes alive.
- Scene 2 onwards uses EXTEND: each prompt describes the CONTINUATION from where the previous scene left off. The last frame of the previous video becomes the starting point.
- This creates one continuous video by chaining: Image-to-Video → Extend → Extend → ...

CORE OBJECTIVE — EXTEND-BASED MULTI-SCENE VIDEO:
Generate a JSON object with a "scenes" array. Each scene has its own video prompt designed for the specific generation mode:
- Scene 1: Image-to-Video prompt (animate the reference image)
- Scene 2+: Extend prompt (continue from where the previous scene ended)

SCENE 1 RULES (Image-to-Video):
- The prompt MUST describe how the reference image comes alive
- Start from the EXACT pose/position shown in the reference image
- Describe initial subtle movements first, then build to the scene's action
- Include full character description based on the reference image
- The ending of Scene 1 must naturally lead into Scene 2

SCENE 2+ RULES (Extend):
- The prompt MUST describe what happens NEXT — as a continuation, not a restart
- Begin by referencing the character's state at the end of the previous scene
- DO NOT describe the character's appearance from scratch — the video already shows them
- Focus on NEW actions, camera changes, and emotional progression
- Use phrasing like: "The hero continues...", "As the moment progresses...", "The camera now...", "Transitioning from the previous motion..."

CONTINUITY RULES:
- Character appearance remains consistent (maintained automatically by Extend feature)
- Environment changes must be gradual and logical
- Emotional arc flows naturally: setup → development → climax → resolution
- Lighting and color grading evolve coherently
- Motion should feel continuous — no abrupt resets

TRANSITION HANDLING (how each scene ENDS to set up the next Extend):
- "smooth crossfade": End with a held moment, slight pause — Extend picks up from this stillness
- "hard cut": End with decisive action — Extend starts from this frozen motion
- "whip pan": End with camera moving — Extend continues the camera motion
- "fade to black": Dim lighting gradually — Extend fades back in
- "match cut": End on a specific visual element — Extend continues from that element
- "zoom transition": End with camera zooming into a detail — Extend reveals what's beyond

OUTPUT FORMAT — a single valid JSON object:
{
  "overall_narrative": "Brief summary of the entire video sequence",
  "total_estimated_duration": "Total duration (number of scenes × 8 seconds)",
  "scenes": [
    {
      "scene_number": 1,
      "scene_type": "image-to-video",
      "video_prompt": "Scene 1: Describe how the reference image comes alive. Start from the exact pose in the image. Include full character description + environment + initial movements + camera work. Must work as a standalone Image-to-Video prompt.",
      "negative_prompt": "static image, freeze frame, glitchy, morphing, low framerate",
      "duration": "8 seconds",
      "camera_movement": "Detailed camera movement",
      "character_animation": "What the character does",
      "environment_animation": "Background animation",
      "motion_intensity": "Level of motion",
      "mood": "Scene mood",
      "transition_to_next": "How this scene ends (sets up the Extend)",
      "continuity_notes": "What the ending state looks like for the next Extend"
    },
    {
      "scene_number": 2,
      "scene_type": "extend",
      "video_prompt": "Scene 2 (Extend): Describe what happens NEXT after Scene 1. Reference the ending state. Focus on new actions and progression. Do NOT re-describe character appearance.",
      "negative_prompt": "...",
      "duration": "8 seconds",
      "camera_movement": "...",
      "character_animation": "...",
      "environment_animation": "...",
      "motion_intensity": "...",
      "mood": "...",
      "transition_to_next": "...",
      "continuity_notes": "..."
    }
  ],
  "sound_design": "Overall sound design suggestion",
  "aspect_ratio": "Consistent aspect ratio",
  "style": "multi-scene cinematic video sequence (Image-to-Video + Extend)",
  "quality_tags": ["cinematic motion", "smooth animation", "natural movement", "scene continuity", "extend-friendly"]
}

IMPORTANT RULES:
- Scene 1 video_prompt is for Image-to-Video — MUST describe the reference image coming alive
- Scene 2+ video_prompts are for Extend — MUST describe continuation, NOT restart
- All scenes are exactly 8 SECONDS
- Extend prompts should NOT fully re-describe character appearance (it's already visible)
- Each scene's ending state MUST be described in continuity_notes for the next Extend to work
- Movements must be physically natural and continuous across scenes
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;



// =============================================================================
// MULTI-SCENE VIDEO — Generate Function
// =============================================================================

interface SceneInput {
  sceneNumber: number;
  narrative: string;
  duration: string;
  cameraMovement: string;
  motionIntensity: string;
  transition: string;
}

interface GenerateMultiSceneParams {
  heroes: HeroImage[];
  overallNarrative: string;
  scenes: SceneInput[];
  aspectRatio: string;
  videoStyle: string;
  mood: string;
  soundDesign: string;
  modelName?: string;
}

export async function generateMultiSceneVideoPrompt(params: GenerateMultiSceneParams): Promise<string> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();
  const MODEL_NAME = params.modelName || DEFAULT_MODEL;

  // ── Bangun image parts dan labels ──
  const heroNames = params.heroes.map(h => h.heroName);
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];

  for (const hero of params.heroes) {
    imageParts.push({ inlineData: { mimeType: hero.mimeType, data: hero.base64Data } });
    imageLabels.push(
      `[Generated photorealistic image of ${hero.heroName} — analyze character appearance for consistency across all scenes]`
    );
  }

  // ── Context Caching ──
  const cacheKey = buildCacheKey("gemini::video-multiscene", heroNames, MODEL_NAME);
  const cachedContentName = await getOrCreateCache({
    ai,
    model: MODEL_NAME,
    cacheKey,
    systemInstruction: SYSTEM_INSTRUCTION_MULTI_SCENE,
    imageParts,
    imageLabels,
  });

  // ── Bangun scene descriptions ──
  const scenesText = params.scenes.map((s, idx) => {
    const isLast = idx === params.scenes.length - 1;
    return `SCENE ${s.sceneNumber}:
- Narrative: ${s.narrative}
- Duration: ${s.duration}
- Camera Movement: ${s.cameraMovement}
- Motion Intensity: ${s.motionIntensity}
- Transition to Next: ${isLast ? "N/A (final scene)" : s.transition}`;
  }).join("\n\n");

  const userPrompt = `${params.overallNarrative ? `OVERALL STORY:\n${params.overallNarrative}\n\n` : ""}HEROES IN THIS VIDEO:
${params.heroes.map(h => `- ${h.heroName}`).join("\n")}

SCENE BREAKDOWN (${params.scenes.length} scenes):

${scenesText}

GLOBAL CONFIGURATION:
- Aspect Ratio: ${params.aspectRatio}
- Video Style: ${params.videoStyle}
- Overall Mood: ${params.mood}
- Sound Design: ${params.soundDesign}

Please analyze the reference images and generate a complete multi-scene video prompt JSON. Each scene's video_prompt must be self-contained with full character descriptions.`;

  // ── Generate content ──
  let contents: object[];
  if (cachedContentName) {
    contents = [{ role: "user", parts: [{ text: userPrompt }] }];
  } else {
    const parts: object[] = [];
    for (let i = 0; i < imageParts.length; i++) {
      parts.push(imageParts[i]);
      parts.push({ text: imageLabels[i] });
    }
    parts.push({ text: userPrompt });
    contents = [{ role: "user", parts }];
  }

  // ── Execute with key fallback ──
  const executeGenerate = async (aiClient: GoogleGenAI) => {
    return await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        ...(cachedContentName
          ? { cachedContent: cachedContentName }
          : { systemInstruction: SYSTEM_INSTRUCTION_MULTI_SCENE }
        ),
        temperature: 1,
        maxOutputTokens: 16384, // Larger output for multi-scene
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      console.warn(`[Gemini Video Multi] Rate limit hit — attempting key fallback...`);
      const fallbackAi = markKeyBlockedAndGetFallback(currentKey);
      if (fallbackAi) {
        ai = fallbackAi;
        response = await executeGenerate(ai);
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const raw = extractResponseText(response);

  if (!raw) {
    console.error("[Gemini Video Multi] Empty response. Usage:", response.usageMetadata);
    throw new Error("Model returned an empty response. Please try again.");
  }

  const cleaned = cleanResponseText(raw);

  // Validasi JSON
  try {
    JSON.parse(cleaned);
  } catch {
    console.error("[Gemini Video Multi] JSON parse failed. Raw (first 500):", raw.substring(0, 500));
    throw new Error("The AI response was not valid JSON. Please try again.");
  }

  return cleaned;
}

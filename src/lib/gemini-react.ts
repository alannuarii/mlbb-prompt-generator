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

// =============================================================================
// TYPES
// =============================================================================

export interface DetectedCharacter {
  id: string;
  label: string;
  description: string;
  role: string;
}

export interface DetectedScene {
  sceneNumber: number;
  timestamp: string;
  narrative: string;
  cameraMovement: string;
  motionIntensity: string;
  mood: string;
  characters: string[];
}

export interface VideoAnalysisResult {
  summary: string;
  characters: DetectedCharacter[];
  scenes: DetectedScene[];
  detectedConfig: {
    aspectRatio: string;
    videoStyle: string;
    mood: string;
    soundDesign: string;
  };
  totalDuration: string;
}

export type AppearanceMode = "full-hero" | "adapt-outfit" | "face-only";

export interface CharacterMapping {
  characterId: string;
  characterLabel: string;
  heroName: string;
  heroBase64Data: string;
  heroMimeType: string;
  appearanceMode: AppearanceMode;
}

export interface GenerateReActPromptParams {
  videoAnalysis: VideoAnalysisResult;
  characterMappings: CharacterMapping[];
  configOverrides: {
    aspectRatio: string;
    videoStyle: string;
    mood: string;
    soundDesign: string;
  };
  modelName?: string;
}

// =============================================================================
// SYSTEM INSTRUCTIONS
// =============================================================================

const SYSTEM_INSTRUCTION_ANALYZE = `You are an expert video analyst specializing in cinematic breakdown. Your task is to analyze a reference video and produce a structured JSON breakdown.

INSTRUCTIONS:
1. Watch the entire video carefully.
2. IDENTIFY all distinct characters/people in the video. For each character, provide:
   - A short label (e.g. "Man in black suit", "Woman with red hair")
   - A detailed visual description (face, hair, clothing, accessories, body type)
   - Their role in the video (protagonist, antagonist, supporting, background)
3. BREAK DOWN the video into distinct scenes/shots. For each scene:
   - Approximate timestamp
   - What happens (narrative description)
   - Camera movement used
   - Motion intensity level
   - Mood/atmosphere
   - Which characters appear
4. DETECT the overall video configuration:
   - Aspect ratio (closest to: "16:9", "9:16", "1:1", "4:5")
   - Video style (closest to: "cinematic film", "slow motion dramatic", "music video aesthetic", "documentary style", "dream sequence", "action sequence", "timelapse effect", "portrait living photo")
   - Mood (closest to: "cinematic dramatic", "dark and moody", "epic and intense", "serene and peaceful", "mysterious and suspenseful", "heroic and triumphant", "romantic and dreamy", "casual and relaxed", "melancholic and emotional", "energetic and vibrant")
   - Sound design direction (closest to: "cinematic ambient", "epic orchestral swell", "nature and wind", "rain and thunder", "combat and metal clashing", "heartbeat and tension", "urban city sounds", "silence with subtle ambiance", "lo-fi and dreamy", "dramatic bass and drums")

OUTPUT a single valid JSON object:
{
  "summary": "Brief overall summary of the video",
  "characters": [
    {
      "id": "char_1",
      "label": "Short label for the character",
      "description": "Detailed visual description",
      "role": "protagonist/antagonist/supporting/background"
    }
  ],
  "scenes": [
    {
      "sceneNumber": 1,
      "timestamp": "0:00 - 0:03",
      "narrative": "What happens in this scene",
      "cameraMovement": "slow push in",
      "motionIntensity": "moderate",
      "mood": "tense",
      "characters": ["char_1", "char_2"]
    }
  ],
  "detectedConfig": {
    "aspectRatio": "16:9",
    "videoStyle": "cinematic film",
    "mood": "cinematic dramatic",
    "soundDesign": "cinematic ambient"
  },
  "totalDuration": "approximate total duration"
}

RULES:
- Be thorough in character descriptions — they will be used for character replacement.
- Scene narratives should be action-oriented (describe WHAT HAPPENS, not just the visuals).
- Camera movement values should use: "static with subtle drift", "slow push in", "slow pull out", "slow pan left to right", "slow pan right to left", "orbit around subject", "crane shot upward", "crane shot downward", "dolly tracking shot", "handheld cinematic", "zoom into face", "parallax depth effect"
- Motion intensity values: "subtle", "moderate", "dynamic", "intense"
- Character IDs should be consistent across scenes.
- ONLY output the JSON object. No markdown, no code fences, no explanations.
- Output in Indonesian for the narrative and description fields.`;


const APPEARANCE_INSTRUCTIONS: Record<AppearanceMode, string> = {
  "full-hero": `APPEARANCE MODE — FULL HERO:
The hero appears with their COMPLETE original MLBB appearance:
- Full original armor, outfit, and clothing from the game
- Original weapons and equipment
- Original visual effects (glows, auras, energy effects)
- Original accessories and details
The hero should look EXACTLY as they appear in Mobile Legends, placed into the reference video's scene context.`,

  "adapt-outfit": `APPEARANCE MODE — ADAPT OUTFIT:
Keep the hero's facial features, hairstyle, and physical identity (body type, skin tone), but REPLACE their outfit:
- Clothing should MATCH what the original character wears in the reference video
- Remove game-specific weapons UNLESS they fit naturally in the video's context
- Remove fantasy visual effects (glows, auras) — keep it grounded and realistic
- The hero should look like THEMSELVES but dressed appropriately for the scene
- Adapt accessories to match the video's style (modern, historical, fantasy, etc.)`,

  "face-only": `APPEARANCE MODE — FACE ONLY:
Only preserve the hero's FACIAL FEATURES and HAIRSTYLE. Everything else matches the original video character:
- Clothing: EXACTLY matches the original character's outfit
- Accessories: EXACTLY matches the original character's props
- Weapons/items: EXACTLY matches what the original character holds/uses
- Body language: Follows the original character's mannerisms
The hero should be virtually indistinguishable from the original character EXCEPT for their face and hair.`,
};


function buildReActSystemInstruction(mappings: CharacterMapping[]): string {
  // Group by appearance mode to generate instructions
  const modeGroups = new Map<AppearanceMode, CharacterMapping[]>();
  for (const m of mappings) {
    const group = modeGroups.get(m.appearanceMode) || [];
    group.push(m);
    modeGroups.set(m.appearanceMode, group);
  }

  let appearanceSection = "";
  for (const [mode, chars] of modeGroups.entries()) {
    const charList = chars.map(c => `  - "${c.characterLabel}" → ${c.heroName}`).join("\n");
    appearanceSection += `\n${APPEARANCE_INSTRUCTIONS[mode]}\nApplies to:\n${charList}\n`;
  }

  return `You are an expert prompt engineer specializing in AI video generation. Your task is to RE-CREATE a reference video scene but with MLBB (Mobile Legends: Bang Bang) heroes replacing the original characters.

CRITICAL CONTEXT — RE-ACT MODE:
- The user has uploaded a reference video and it has been analyzed.
- Characters in the video have been mapped to MLBB heroes.
- You will receive: hero reference images, video analysis breakdown, and character mappings.
- Your job: generate a detailed JSON video prompt that recreates the reference video's scenes but with MLBB heroes as the actors.

CHARACTER APPEARANCE MODES:
${appearanceSection}

INSTRUCTIONS:
1. STUDY the video analysis breakdown (scenes, camera movements, actions, mood).
2. STUDY each hero's reference image to understand their visual appearance.
3. For each scene in the breakdown, RE-WRITE the narrative replacing original characters with the mapped MLBB heroes.
4. Apply the correct APPEARANCE MODE for each hero-character pair.
5. Maintain the SAME:
   - Camera movements from the original video
   - Scene timing and pacing
   - Mood and atmosphere progression
   - Action choreography and blocking
   - Environmental context
6. OUTPUT a single valid JSON object with scenes that can be used to generate a video.

OUTPUT FORMAT:
{
  "overall_narrative": "Summary of the re-created video with MLBB heroes",
  "total_estimated_duration": "Total duration",
  "scenes": [
    {
      "scene_number": 1,
      "video_prompt": "COMPLETE scene description: environment + character appearances (based on appearance mode) + actions + camera movement + lighting + atmosphere. Must be self-contained and detailed enough for an AI video generator.",
      "negative_prompt": "static image, freeze frame, morphing, distorted faces, unnatural movement, glitchy, low framerate",
      "duration": "8 seconds",
      "camera_movement": "Camera movement matching the reference",
      "character_animation": "What characters do in this scene",
      "environment_animation": "Background and environmental elements",
      "motion_intensity": "Level of motion",
      "mood": "Scene mood",
      "transition_to_next": "How this scene ends",
      "continuity_notes": "Visual state at end of scene"
    }
  ],
  "sound_design": "Sound design suggestion matching the reference video's audio style",
  "aspect_ratio": "Aspect ratio",
  "style": "re-act cinematic video",
  "quality_tags": ["cinematic motion", "smooth animation", "character consistency", "scene accurate"]
}

IMPORTANT RULES:
- Each scene's video_prompt MUST include full character appearance descriptions based on the chosen appearance mode.
- Maintain action choreography faithfully — the goal is to RE-CREATE the same actions with different characters.
- Camera movements should closely match the reference video.
- All scenes are 8 SECONDS each.
- For "full-hero" mode: describe full MLBB gear, weapons, and visual effects.
- For "adapt-outfit" mode: describe hero's face/hair but with the original character's clothing style.
- For "face-only" mode: describe ONLY the hero's face, everything else matches the original character exactly.
- Generate the prompt in English for maximum compatibility with video generation AI.
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;
}


// =============================================================================
// ANALYZE VIDEO
// =============================================================================

export async function analyzeReferenceVideo(params: {
  videoBase64: string;
  videoMimeType: string;
  modelName?: string;
}): Promise<VideoAnalysisResult> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();
  const MODEL_NAME = params.modelName || DEFAULT_MODEL;

  const contents = [
    {
      role: "user" as const,
      parts: [
        {
          inlineData: {
            mimeType: params.videoMimeType,
            data: params.videoBase64,
          },
        },
        {
          text: "Analyze this reference video thoroughly. Break it down into characters, scenes, camera movements, and overall configuration. Output a structured JSON analysis.",
        },
      ],
    },
  ];

  const executeGenerate = async (aiClient: GoogleGenAI) => {
    return await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_ANALYZE,
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      console.warn(`[Gemini Re-Act Analyze] Rate limit hit — attempting key fallback...`);
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
    console.error("[Gemini Re-Act Analyze] Empty response. Usage:", response.usageMetadata);
    throw new Error("Model returned an empty response. Please try again.");
  }

  const cleaned = cleanResponseText(raw);

  try {
    const parsed = JSON.parse(cleaned);
    return parsed as VideoAnalysisResult;
  } catch {
    console.error("[Gemini Re-Act Analyze] JSON parse failed. Raw (first 500):", raw.substring(0, 500));
    throw new Error("The AI response was not valid JSON. Please try again.");
  }
}


// =============================================================================
// GENERATE RE-ACT PROMPT
// =============================================================================

export async function generateReActPrompt(params: GenerateReActPromptParams): Promise<string> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();
  const MODEL_NAME = params.modelName || DEFAULT_MODEL;

  const systemInstruction = buildReActSystemInstruction(params.characterMappings);

  // Build image parts from hero references
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];
  const heroNames: string[] = [];

  for (const mapping of params.characterMappings) {
    if (mapping.heroBase64Data && mapping.heroMimeType) {
      imageParts.push({
        inlineData: {
          mimeType: mapping.heroMimeType,
          data: mapping.heroBase64Data,
        },
      });
      imageLabels.push(
        `[Reference image of ${mapping.heroName} (MLBB hero) — replacing "${mapping.characterLabel}" with appearance mode: ${mapping.appearanceMode}. Analyze face, hair, build, and ${mapping.appearanceMode === "full-hero" ? "full MLBB outfit/weapons/effects" : "facial features for character replacement"
        }]`
      );
      heroNames.push(mapping.heroName);
    }
  }

  // Try caching
  const cacheKey = buildCacheKey("gemini::video-react", heroNames, MODEL_NAME);
  const cachedContentName = await getOrCreateCache({
    ai,
    model: MODEL_NAME,
    cacheKey,
    systemInstruction,
    imageParts,
    imageLabels,
  });

  // Build user prompt with analysis data
  const mappingText = params.characterMappings.map(m =>
    `- "${m.characterLabel}" (${m.characterId}) → ${m.heroName} [Appearance: ${m.appearanceMode}]`
  ).join("\n");

  const scenesText = params.videoAnalysis.scenes.map(s => {
    return `SCENE ${s.sceneNumber} (${s.timestamp}):
- Narrative: ${s.narrative}
- Camera: ${s.cameraMovement}
- Motion: ${s.motionIntensity}
- Mood: ${s.mood}
- Characters: ${s.characters.join(", ")}`;
  }).join("\n\n");

  const userPrompt = `VIDEO ANALYSIS SUMMARY:
${params.videoAnalysis.summary}

CHARACTER MAPPINGS:
${mappingText}

SCENE BREAKDOWN:
${scenesText}

VIDEO CONFIGURATION:
- Aspect Ratio: ${params.configOverrides.aspectRatio}
- Video Style: ${params.configOverrides.videoStyle}
- Mood: ${params.configOverrides.mood}
- Sound Design: ${params.configOverrides.soundDesign}

Please generate a complete Re-Act video prompt JSON that recreates these scenes with the mapped MLBB heroes. Each scene's video_prompt must be self-contained with full character descriptions following the specified appearance modes.`;

  // Build contents
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

  // Generate
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
        maxOutputTokens: 16384,
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      console.warn(`[Gemini Re-Act Generate] Rate limit hit — attempting key fallback...`);
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
    console.error("[Gemini Re-Act Generate] Empty response. Usage:", response.usageMetadata);
    throw new Error("Model returned an empty response. Please try again.");
  }

  const cleaned = cleanResponseText(raw);

  try {
    JSON.parse(cleaned);
  } catch {
    console.error("[Gemini Re-Act Generate] JSON parse failed. Raw (first 500):", raw.substring(0, 500));
    throw new Error("The AI response was not valid JSON. Please try again.");
  }

  return cleaned;
}

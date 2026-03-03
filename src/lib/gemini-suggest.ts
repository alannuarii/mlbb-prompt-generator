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

const MODEL_NAME = "gemini-2.5-flash";

interface HeroImage {
  heroName: string;
  base64Data: string;
  mimeType: string;
}

interface SuggestParams {
  heroes: HeroImage[];
  mode: "realistic" | "cinematic" | "video";
  config: Record<string, string>;
}

// ---- System Instructions per mode (sama seperti sebelumnya) ----

const SUGGEST_REALISTIC = `You are a creative scenario writer for MLBB (Mobile Legends) hero photoshoots. Your task is to generate unique, vivid scenario ideas that place animated game heroes into REALISTIC, real-world situations.

Given:
- One or more MLBB hero reference images (analyze their appearance, personality, and vibe)
- User's selected configuration (mood, lighting, camera angle, attribute mode, etc.)

Generate exactly 3 creative scenario suggestions. Each scenario should:
1. Be written in Bahasa Indonesia (Indonesian)
2. Be 2-4 sentences long — vivid, specific, and immediately usable as a prompt
3. Place the hero(es) in a REAL-WORLD setting (café, sekolah, kota, alam, dll.)
4. Match the selected mood/lighting/camera style
5. If attribute mode is "custom-outfit", describe specific real-world clothing
6. If attribute mode is "full-attribute", describe the hero's original costume in a real-world context
7. Each scenario should be distinctly DIFFERENT in theme (e.g., one casual, one dramatic, one romantic)
8. Include specific details: time of day, weather, props, expressions, body language

OUTPUT FORMAT — return ONLY a valid JSON array of exactly 3 objects:
[
  { "title": "Short catchy title (2-4 words, Indonesian)", "scenario": "Full scenario text in Indonesian" },
  { "title": "...", "scenario": "..." },
  { "title": "...", "scenario": "..." }
]

ONLY output the JSON array. No markdown, no code fences, no explanations.`;

const SUGGEST_CINEMATIC = `You are a creative scenario writer for MLBB (Mobile Legends) cinematic scenes. Your task is to generate epic, fantasy-style scenario ideas that showcase heroes in their GAME UNIVERSE — with full armor, weapons, and magical abilities.

Given:
- One or more MLBB hero reference images (analyze their appearance, weapons, armor, aura)
- User's selected configuration (mood, lighting, camera angle, etc.)

Generate exactly 3 creative scenario suggestions. Each scenario should:
1. Be written in Bahasa Indonesia (Indonesian)
2. Be 2-4 sentences long — epic, dramatic, and cinematic
3. Feature the hero(es) in a FANTASY/GAME setting (battlefield, mystical realm, ancient temple, etc.)
4. Include their weapons, armor, abilities, and magical effects
5. Match the selected mood/lighting/camera style
6. Each scenario should be distinctly DIFFERENT in theme (e.g., one battle, one mystical, one heroic pose)
7. Include specific details: environment effects, particle/magic effects, epic moments

OUTPUT FORMAT — return ONLY a valid JSON array of exactly 3 objects:
[
  { "title": "Short catchy title (2-4 words, Indonesian)", "scenario": "Full scenario text in Indonesian" },
  { "title": "...", "scenario": "..." },
  { "title": "...", "scenario": "..." }
]

ONLY output the JSON array. No markdown, no code fences, no explanations.`;

const SUGGEST_VIDEO = `You are a creative scenario writer for MLBB (Mobile Legends) animated video scenes. Your task is to generate dynamic, motion-focused scenario ideas that describe how a STILL IMAGE of a hero should come alive as a short VIDEO CLIP.

Given:
- One or more MLBB hero reference images (analyze their pose, environment, expression)
- User's selected video configuration (duration, camera movement, motion intensity, style, mood)

Generate exactly 3 creative scenario suggestions. Each scenario should:
1. Be written in Bahasa Indonesia (Indonesian)
2. Be 2-4 sentences long — focused on MOTION and ANIMATION
3. Describe what MOVES in the scene: character body language, hair, clothing, environment, particles
4. Include camera movement descriptions that match the selected camera movement style
5. Match the selected mood, duration, and motion intensity
6. Each scenario should be distinctly DIFFERENT in energy level (e.g., one subtle/calm, one moderate, one intense/action)
7. Include specific motion details: wind effects, lighting changes, emotional beats

OUTPUT FORMAT — return ONLY a valid JSON array of exactly 3 objects:
[
  { "title": "Short catchy title (2-4 words, Indonesian)", "scenario": "Full scenario text in Indonesian" },
  { "title": "...", "scenario": "..." },
  { "title": "...", "scenario": "..." }
]

ONLY output the JSON array. No markdown, no code fences, no explanations.`;

function getInstruction(mode: "realistic" | "cinematic" | "video"): string {
  switch (mode) {
    case "realistic": return SUGGEST_REALISTIC;
    case "cinematic": return SUGGEST_CINEMATIC;
    case "video": return SUGGEST_VIDEO;
  }
}

export async function suggestScenarios(params: SuggestParams): Promise<{ title: string; scenario: string }[]> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();
  const instruction = getInstruction(params.mode);

  // ── Bangun image parts untuk cache ──
  const heroNames = params.heroes.map(h => h.heroName);
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];

  for (const hero of params.heroes) {
    imageParts.push({ inlineData: { mimeType: hero.mimeType, data: hero.base64Data } });
    imageLabels.push(`[Reference image for ${hero.heroName}]`);
  }

  // ── Context Caching: cache system instruction + gambar hero ──
  // Cache key unik per mode + kombinasi hero
  const cacheKey = buildCacheKey(`suggest::${params.mode}`, heroNames);
  const cachedContentName = await getOrCreateCache({
    ai,
    model: MODEL_NAME,
    cacheKey,
    systemInstruction: instruction,
    imageParts,
    imageLabels,
  });

  // ── Bangun user prompt (HANYA teks — gambar sudah di-cache) ──
  const configLines = Object.entries(params.config)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const heroNameList = [...new Set(heroNames)];

  const userPrompt = `HEROES: ${heroNameList.join(", ")}

SELECTED CONFIGURATION:
${configLines}

Please generate 3 creative and diverse scenario suggestions for these hero(es) based on the reference images and configuration above.`;

  // ── Generate content ──
  // Jika cache tersedia → gambar sudah di-cache, kirim teks saja
  // Jika tidak → kirim gambar + teks bersama di contents
  let contents: object[];
  if (cachedContentName) {
    // Cached mode: gambar sudah di-cache, kirim teks prompt saja
    contents = [{ role: "user", parts: [{ text: userPrompt }] }];
  } else {
    // Non-cached fallback: gambar + teks digabung dalam satu user turn
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
          : { systemInstruction: instruction }
        ),
        temperature: 1.2,
        maxOutputTokens: 2048,
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      console.warn(`[Gemini Suggest] Rate limit hit — attempting key fallback...`);
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

  // Ekstrak teks secara robust
  const raw = extractResponseText(response);

  if (!raw) {
    console.error("[Gemini Suggest] Empty response. Usage:", response.usageMetadata);
    throw new Error("Model returned an empty response. Please try again.");
  }

  const cleaned = cleanResponseText(raw);

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    // Log untuk debug
    console.error("[Gemini Suggest] JSON parse failed. Raw text (first 500 chars):", raw.substring(0, 500));
    console.error("[Gemini Suggest] Parse error:", parseErr);
    throw new Error("AI response was not valid JSON. Please try again.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid response format from AI");
  }

  return parsed.map((item: any) => ({
    title: item.title || "Skenario",
    scenario: item.scenario || "",
  }));
}


// =============================================================================
// MULTI-SCENE STORY SUGGESTIONS
// =============================================================================

const SUGGEST_MULTI_SCENE_STORY = `You are a creative storytelling expert for MLBB (Mobile Legends) multi-scene cinematic videos using Google Flow's Image-to-Video + Extend workflow.

WORKFLOW CONTEXT:
- The user has a GENERATED reference image of an MLBB hero (AI-generated image with specific pose, environment, lighting)
- Scene 1 = Image-to-Video: animate the reference image
- Scene 2+ = Extend: continue from where the previous scene ended
- This creates one continuous video

Given:
- One or more MLBB hero reference images (analyze their appearance, pose, environment)
- Number of scenes to generate
- Video configuration (style, mood, sound design)

Generate a COMPLETE video story with:
1. An overall story summary (2-3 sentences in Indonesian)
2. Individual scene narratives + technical parameters that form a COHERENT story arc

STORY ARC RULES:
- The overall story must have a clear beginning, middle, and end
- Scene 1 narrative should describe how the reference image comes alive (what starts moving first)
- Scene 2+ narratives should describe CONTINUATION — what happens NEXT after the previous scene
- Scenes should have an emotional progression (setup → development → climax → resolution)
- Each scene narrative should be 2-3 sentences in Indonesian
- Describe MOTION and ANIMATION: what moves, what changes, what the character does
- Include environmental details: weather, lighting shifts, particle effects

TECHNICAL PARAMETER RULES:
- Camera movement should match the scene emotion and action
- Motion intensity should follow the story arc: subtle for calm/opening, intense for climax
- Transitions set up how the Extend will continue: "smooth crossfade" for held moments, "hard cut" for decisive actions, "whip pan" for energy

AVAILABLE VALUES FOR TECHNICAL PARAMETERS:
- cameraMovement: "static with subtle drift", "slow push in", "slow pull out", "slow pan left to right", "slow pan right to left", "orbit around subject", "crane shot upward", "dolly tracking shot", "zoom into face", "parallax depth effect"
- motionIntensity: "subtle", "moderate", "dynamic", "intense"
- transition: "smooth crossfade", "hard cut", "whip pan", "fade to black", "match cut", "zoom transition"

OUTPUT FORMAT — return ONLY a single valid JSON object:
{
  "overall_story": "Complete overall story summary in Indonesian (2-3 sentences)",
  "scenes": [
    {
      "narrative": "Scene 1 narrative: describe how the reference image comes alive...",
      "cameraMovement": "slow push in",
      "motionIntensity": "subtle",
      "transition": "smooth crossfade"
    },
    {
      "narrative": "Scene 2 narrative: describe what happens NEXT, continuing from Scene 1...",
      "cameraMovement": "orbit around subject",
      "motionIntensity": "moderate",
      "transition": "hard cut"
    }
  ]
}

IMPORTANT:
- Number of scenes in the output MUST match the requested scene count exactly
- Overall story and scene narratives MUST be in Bahasa Indonesia
- Scene 1 narrative must reference the starting image (how it comes alive)
- Scene 2+ narratives must describe continuation (not restart)
- Technical parameters MUST use EXACT values from the available values list above
- The LAST scene should NOT have a transition (set to "smooth crossfade" as placeholder)
- Focus on MOTION and VISUAL storytelling (this is for video generation)
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;

const SUGGEST_SINGLE_SCENE_NARRATIVE = `You are a creative storytelling expert for MLBB (Mobile Legends) multi-scene cinematic videos. Your task is to generate or regenerate a SINGLE scene's narrative AND technical parameters that fit within an existing story arc.

Given:
- MLBB hero reference images
- The overall story summary
- Existing scene narratives (for context)
- The scene number to generate/regenerate
- Video configuration

Generate content for the specified scene that:
1. Narrative is written in Bahasa Indonesia (Indonesian), 2-3 sentences
2. PERFECTLY fits the overall story arc
3. Maintains continuity with adjacent scenes
4. Describes MOTION and ANIMATION: what moves, changes, character actions
5. Technical parameters match the scene's role in the story (establishing, climax, resolution, etc.)

AVAILABLE VALUES FOR TECHNICAL PARAMETERS:
- cameraMovement: "static with subtle drift", "slow push in", "slow pull out", "slow pan left to right", "slow pan right to left", "orbit around subject", "crane shot upward", "dolly tracking shot", "zoom into face", "parallax depth effect"
- motionIntensity: "subtle", "moderate", "dynamic", "intense"
- transition: "smooth crossfade", "hard cut", "whip pan", "fade to black", "match cut", "zoom transition"

OUTPUT FORMAT — return ONLY a single valid JSON object:
{
  "narrative": "The generated scene narrative in Indonesian",
  "cameraMovement": "slow push in",
  "motionIntensity": "moderate",
  "transition": "smooth crossfade"
}

IMPORTANT: Use EXACT values from the available values list. ONLY output the JSON object. No markdown, no code fences, no explanations.`;

// --- Multi-Scene Suggestion Params ---
interface MultiSceneSuggestParams {
  heroes: HeroImage[];
  sceneCount: number;
  config: Record<string, string>;
}

interface SingleSceneSuggestParams {
  heroes: HeroImage[];
  overallStory: string;
  existingScenes: { sceneNumber: number; narrative: string }[];
  targetSceneNumber: number;
  config: Record<string, string>;
}

interface SceneSuggestion {
  narrative: string;
  cameraMovement: string;
  motionIntensity: string;
  transition: string;
}

/**
 * Generate overall story + all scene narratives + technical params in ONE call.
 */
export async function suggestMultiSceneStory(
  params: MultiSceneSuggestParams
): Promise<{ overall_story: string; scenes: SceneSuggestion[] }> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();

  const heroNames = params.heroes.map(h => h.heroName);
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];

  for (const hero of params.heroes) {
    imageParts.push({ inlineData: { mimeType: hero.mimeType, data: hero.base64Data } });
    imageLabels.push(`[Reference image for ${hero.heroName}]`);
  }

  const cacheKey = buildCacheKey(`suggest::multi-scene`, heroNames);
  const cachedContentName = await getOrCreateCache({
    ai, model: MODEL_NAME, cacheKey,
    systemInstruction: SUGGEST_MULTI_SCENE_STORY,
    imageParts, imageLabels,
  });

  const configLines = Object.entries(params.config)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const heroNameList = [...new Set(heroNames)];

  const userPrompt = `HEROES: ${heroNameList.join(", ")}

NUMBER OF SCENES: ${params.sceneCount}

VIDEO CONFIGURATION:
${configLines}

Generate a cohesive multi-scene story with exactly ${params.sceneCount} scene narratives. The story should be compelling and cinematic, with a clear narrative arc from beginning to end.`;

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

  const executeGenerate = async (aiClient: GoogleGenAI) => {
    return await aiClient.models.generateContent({
      model: MODEL_NAME, contents,
      config: {
        ...(cachedContentName
          ? { cachedContent: cachedContentName }
          : { systemInstruction: SUGGEST_MULTI_SCENE_STORY }
        ),
        temperature: 1.2,
        maxOutputTokens: 4096,
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      const fallbackAi = markKeyBlockedAndGetFallback(currentKey);
      if (fallbackAi) { ai = fallbackAi; response = await executeGenerate(ai); }
      else throw err;
    } else throw err;
  }

  const raw = extractResponseText(response);
  if (!raw) throw new Error("Model returned an empty response. Please try again.");

  const cleaned = cleanResponseText(raw);
  let parsed: any;
  try { parsed = JSON.parse(cleaned); }
  catch { throw new Error("AI response was not valid JSON. Please try again."); }

  return {
    overall_story: parsed.overall_story || "",
    scenes: Array.isArray(parsed.scenes) ? parsed.scenes.map((s: any) => ({
      narrative: s.narrative || "",
      cameraMovement: s.cameraMovement || "slow push in",
      motionIntensity: s.motionIntensity || "moderate",
      transition: s.transition || "smooth crossfade",
    })) : [],
  };
}

/**
 * Generate/regenerate a SINGLE scene's narrative + technical params.
 */
export async function suggestSceneNarrative(
  params: SingleSceneSuggestParams
): Promise<SceneSuggestion> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();

  const heroNames = params.heroes.map(h => h.heroName);
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];

  for (const hero of params.heroes) {
    imageParts.push({ inlineData: { mimeType: hero.mimeType, data: hero.base64Data } });
    imageLabels.push(`[Reference image for ${hero.heroName}]`);
  }

  const cacheKey = buildCacheKey(`suggest::scene-single`, heroNames);
  const cachedContentName = await getOrCreateCache({
    ai, model: MODEL_NAME, cacheKey,
    systemInstruction: SUGGEST_SINGLE_SCENE_NARRATIVE,
    imageParts, imageLabels,
  });

  const existingScenesText = params.existingScenes
    .map(s => `Scene ${s.sceneNumber}: ${s.narrative || "(empty)"}`)
    .join("\n");

  const configLines = Object.entries(params.config)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const userPrompt = `HEROES: ${[...new Set(heroNames)].join(", ")}

OVERALL STORY:
${params.overallStory}

EXISTING SCENES:
${existingScenesText}

SCENE TO GENERATE: Scene ${params.targetSceneNumber} (out of ${params.existingScenes.length} total scenes)

VIDEO CONFIGURATION:
${configLines}

Generate a narrative for Scene ${params.targetSceneNumber} that fits perfectly within the overall story and is consistent with adjacent scenes.`;

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

  const executeGenerate = async (aiClient: GoogleGenAI) => {
    return await aiClient.models.generateContent({
      model: MODEL_NAME, contents,
      config: {
        ...(cachedContentName
          ? { cachedContent: cachedContentName }
          : { systemInstruction: SUGGEST_SINGLE_SCENE_NARRATIVE }
        ),
        temperature: 1.1,
        maxOutputTokens: 1024,
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      const fallbackAi = markKeyBlockedAndGetFallback(currentKey);
      if (fallbackAi) { ai = fallbackAi; response = await executeGenerate(ai); }
      else throw err;
    } else throw err;
  }

  const raw = extractResponseText(response);
  if (!raw) throw new Error("Model returned an empty response. Please try again.");

  const cleaned = cleanResponseText(raw);
  let parsed: any;
  try { parsed = JSON.parse(cleaned); }
  catch { throw new Error("AI response was not valid JSON. Please try again."); }

  return {
    narrative: parsed.narrative || "",
    cameraMovement: parsed.cameraMovement || "slow push in",
    motionIntensity: parsed.motionIntensity || "moderate",
    transition: parsed.transition || "smooth crossfade",
  };
}


// =============================================================================
// CASCADE SCENE SUGGESTION — regenerate from scene N onwards
// =============================================================================

const SUGGEST_CASCADE_SCENES = `You are a creative storytelling expert for MLBB (Mobile Legends) multi-scene cinematic videos using Google Flow's Image-to-Video + Extend workflow.

WORKFLOW CONTEXT:
- Scene 1 = Image-to-Video (animates reference image)
- Scene 2+ = Extend (continues from previous scene)
- You are regenerating scenes from a SPECIFIC scene number onwards (cascade regeneration)

Given:
- MLBB hero reference images
- The overall story summary
- LOCKED scenes (earlier scenes that MUST NOT change — use them as established context)
- The starting scene number and how many scenes to generate
- Video configuration

Generate content for the requested scenes that:
1. Narratives are written in Bahasa Indonesia (Indonesian), 2-3 sentences each
2. PERFECTLY continue from the locked scenes' established story
3. Each scene's narrative describes what happens NEXT (Extend prompt style — continuation, not restart)
4. Maintain the overall story arc — if locked scenes set up a conflict, new scenes must resolve it
5. Each scene advances the story naturally toward the ending
6. Technical parameters match each scene's dramatic role
7. The emotional arc should progress naturally through the regenerated scenes

EXTEND RULES:
- All regenerated scenes are Extend prompts (they continue from the previous scene)
- DO NOT describe the character from scratch — focus on new ACTIONS and PROGRESSION
- Reference the ending state of the previous scene (locked or previously generated)
- Motion should be continuous — no abrupt resets

AVAILABLE VALUES FOR TECHNICAL PARAMETERS:
- cameraMovement: "static with subtle drift", "slow push in", "slow pull out", "slow pan left to right", "slow pan right to left", "orbit around subject", "crane shot upward", "dolly tracking shot", "zoom into face", "parallax depth effect"
- motionIntensity: "subtle", "moderate", "dynamic", "intense"
- transition: "smooth crossfade", "hard cut", "whip pan", "fade to black", "match cut", "zoom transition"

OUTPUT FORMAT — return ONLY a single valid JSON object:
{
  "scenes": [
    {
      "narrative": "Scene narrative in Indonesian — describe continuation from previous scene...",
      "cameraMovement": "slow push in",
      "motionIntensity": "moderate",
      "transition": "smooth crossfade"
    }
  ]
}

IMPORTANT:
- Number of scenes in output MUST match the requested count exactly
- Scenes are ordered sequentially starting from the requested starting scene
- Each narrative must describe CONTINUATION (Extend), not a fresh start
- Use EXACT values from the available values list
- The LAST scene should use "smooth crossfade" as transition placeholder
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;

interface CascadeSuggestParams {
  heroes: HeroImage[];
  overallStory: string;
  lockedScenes: { sceneNumber: number; narrative: string }[];
  startFromScene: number;
  totalScenes: number;
  scenesToGenerate: number;
  config: Record<string, string>;
}

/**
 * Regenerate scenes from startFromScene onwards in a single AI call (cascade).
 * Locked scenes (before startFromScene) are kept as context.
 */
export async function suggestCascadeScenes(
  params: CascadeSuggestParams
): Promise<SceneSuggestion[]> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();

  const heroNames = params.heroes.map(h => h.heroName);
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];

  for (const hero of params.heroes) {
    imageParts.push({ inlineData: { mimeType: hero.mimeType, data: hero.base64Data } });
    imageLabels.push(`[Reference image for ${hero.heroName}]`);
  }

  const cacheKey = buildCacheKey(`suggest::cascade`, heroNames);
  const cachedContentName = await getOrCreateCache({
    ai, model: MODEL_NAME, cacheKey,
    systemInstruction: SUGGEST_CASCADE_SCENES,
    imageParts, imageLabels,
  });

  const lockedText = params.lockedScenes.length > 0
    ? params.lockedScenes.map(s => `Scene ${s.sceneNumber}: ${s.narrative}`).join("\n")
    : "(no locked scenes)";

  const configLines = Object.entries(params.config)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const userPrompt = `HEROES: ${[...new Set(heroNames)].join(", ")}

OVERALL STORY:
${params.overallStory}

LOCKED SCENES (DO NOT CHANGE — use as established context):
${lockedText}

GENERATE: Scenes ${params.startFromScene} through ${params.totalScenes} (${params.scenesToGenerate} scenes total)
Total scenes in video: ${params.totalScenes}

VIDEO CONFIGURATION:
${configLines}

Generate ${params.scenesToGenerate} scene(s) starting from Scene ${params.startFromScene}. These scenes must naturally continue from the locked scenes and complete the overall story arc.`;

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

  const executeGenerate = async (aiClient: GoogleGenAI) => {
    return await aiClient.models.generateContent({
      model: MODEL_NAME, contents,
      config: {
        ...(cachedContentName
          ? { cachedContent: cachedContentName }
          : { systemInstruction: SUGGEST_CASCADE_SCENES }
        ),
        temperature: 1.1,
        maxOutputTokens: 4096,
      },
    });
  };

  let response;
  try {
    response = await executeGenerate(ai);
  } catch (err: any) {
    if (isRateLimitError(err)) {
      const fallbackAi = markKeyBlockedAndGetFallback(currentKey);
      if (fallbackAi) { ai = fallbackAi; response = await executeGenerate(ai); }
      else throw err;
    } else throw err;
  }

  const raw = extractResponseText(response);
  if (!raw) throw new Error("Model returned an empty response. Please try again.");

  const cleaned = cleanResponseText(raw);
  let parsed: any;
  try { parsed = JSON.parse(cleaned); }
  catch { throw new Error("AI response was not valid JSON. Please try again."); }

  const scenesArr = Array.isArray(parsed.scenes) ? parsed.scenes : [];
  return scenesArr.map((s: any) => ({
    narrative: s.narrative || "",
    cameraMovement: s.cameraMovement || "slow push in",
    motionIntensity: s.motionIntensity || "moderate",
    transition: s.transition || "smooth crossfade",
  }));
}

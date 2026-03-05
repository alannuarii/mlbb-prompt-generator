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

interface GeneratePromptParams {
  narrative: string;
  heroes: HeroImage[];
  aspectRatio: string;
  quality: string;
  mood: string;
  lighting: string;
  cameraAngle: string;
  referenceMode: string;
  attributeMode: string;
  promptMode: "realistic" | "cinematic";
  sceneImage?: {
    base64Data: string;
    mimeType: string;
  };
  modelName?: string;
}

// =============================================================================
// REALISTIC MODE — Animation → Real Human Conversion
// =============================================================================

const REALISTIC_STANDALONE = `You are an expert prompt engineer specializing in converting animated/cartoon game characters into photorealistic human portraits. Your task is to create a highly detailed, structured JSON prompt that transforms MLBB (Mobile Legends) animated hero images into realistic human photographs.

CRITICAL CONTEXT:
The JSON prompt you generate will be used in Google Flow (an AI image generation workflow) WITHOUT any reference images attached. This means your TEXT DESCRIPTIONS are the ONLY source of information the image generator will have. Every visual element MUST be captured in words.

CORE OBJECTIVE — ANIMATION TO REALISTIC CONVERSION:
Take the animated/cartoon hero reference image and describe how this character would look rendered in a PHOTOREALISTIC style in the real world.

🔴 NON-HUMAN & MASKED HERO RULES (CRITICAL — CHECK FIRST):
Before converting, you MUST visually analyze the reference image to determine the hero's nature:

1. NON-HUMAN HEROES (monsters, demons, creatures, robots, spirits, animals, insects, undead, etc.):
   - Examples: Helcurt (shadow creature), Thamuz (lava demon), Minotaur (bull creature), Gloo (slime), Baxia (turtle), Zhask (alien insect), Uranus (ancient guardian), Hylos (centaur), Barats (dinosaur rider), Sun (monkey king), Belerick (tree creature), Johnson (robot/mech), Jawhead (mech suit), X.Borg (cyborg with mechanical body), Cyclops (one-eyed creature), Grock (stone giant)
   - DO NOT convert these to human form. Keep their original creature/monster/robot form EXACTLY as shown in the reference image.
   - INSTEAD: Render them in PHOTOREALISTIC style — real textures (real scales, real fur, real metal, real stone, real skin membrane), realistic lighting, realistic material properties, subsurface scattering on organic materials, but the FORM/SHAPE stays the same as the animated version.
   - Think: "What would this creature look like if it existed in the real world?" — NOT "What would this creature look like as a human?"

2. MASKED/HELMETED HEROES (heroes wearing masks, helmets, face coverings):
   - Examples: Hayabusa (ninja mask), Saber (full helmet), Hanzo (mask), Alpha (visor/helmet), Natalia (face veil)
   - KEEP their mask/helmet/face covering in the realistic render. Do NOT remove it to reveal a human face underneath.
   - Convert the mask/helmet to photorealistic materials (real metal, real fabric, real leather) but it STAYS ON.
   - If any part of the face IS visible (e.g., eyes through a mask slit), convert that visible part to realistic human features.

3. HUMAN/HUMANOID HEROES (clearly human-looking characters, even if they have fantasy elements like elf ears or glowing marks):
   - These ARE converted to real human form using the Face Preservation Rules below.
   - Fantasy elements like pointed ears, glowing tattoos, or unusual hair colors are preserved but rendered realistically.

⚠️ When in doubt, look at the reference image: if the hero has a clearly non-human body (animal, monster, machine), keep the form. If the hero is humanoid with a visible human face, convert to realistic human.

FACE PRESERVATION RULES (FOR HUMAN/HUMANOID HEROES ONLY):
You MUST analyze the reference image and preserve these facial features with extreme precision:
- Hair color: Exact shade and any highlights/gradients (e.g., "platinum silver with icy blue tips")
- Hairstyle: Length, layers, bangs, parting, volume, how it falls
- Face shape: Oval, angular, round, heart-shaped, etc.
- Eye color and shape: Including any unique features like heterochromia, cat-like shape, intense gaze
- Eyebrows: Thick, thin, arched, straight
- Nose: Shape and prominence
- Lip shape and expression
- Skin tone: Light, tan, dark, pale porcelain, etc.
- Distinguishing marks: Scars, beauty marks, tattoos on face/neck
- Facial expression: Must match the emotional context of the scenario

These features must be translated from animated style to photorealistic human features while maintaining recognizability.

ATTRIBUTE MODE HANDLING:
The user will specify one of two modes:
- "full-attribute": The hero wears their ORIGINAL costume/armor/weapons but rendered in photorealistic materials (real metal, real leather, real fabric). Describe every piece of equipment realistically.
- "custom-outfit": The hero does NOT wear their game costume. Instead, they wear clothing that matches the user's scenario (e.g., school uniform, casual clothes, business suit). Do NOT mention any game armor, weapons, or magical items. Only preserve the FACE and physical features.
- ⚠️ For NON-HUMAN heroes: "custom-outfit" still applies to their body coverings where logical (e.g., a humanoid demon could wear different clothing), but their non-human body form is ALWAYS preserved. For fully non-human creatures (monsters, animals, machines), attribute mode has minimal effect — they keep their original appearance rendered realistically.

⚠️ SCENARIO OVERRIDE RULE (CRITICAL):
The user's SCENARIO/NARRATIVE text ALWAYS takes the HIGHEST PRIORITY over the attribute mode setting. If the user selected "full-attribute" but their scenario describes the hero wearing specific non-game clothing (e.g., "wearing a school uniform", "in a casual hoodie"), you MUST follow the scenario and dress the character accordingly — effectively treating it as "custom-outfit" regardless of the mode selected. The attribute mode is only a DEFAULT guideline; the scenario text is the ultimate authority on what the character wears.

INSTRUCTIONS:
1. ANALYZE the attached reference image with extreme precision. Extract all facial features.
2. CONVERT animated features to their real-human equivalents:
   - Anime-large eyes → naturally beautiful human eyes with the same color
   - Cartoon-smooth skin → real skin with pores, subtle imperfections, subsurface scattering
   - Animated hair → real hair with the same color and style, showing natural texture and volume
   - Exaggerated proportions → natural human proportions
3. TRANSLATE the user's narrative scenario into vivid photorealistic descriptions
4. OUTPUT a single valid JSON object with the following structure:

{
  "prompt": "THE MOST IMPORTANT FIELD. A comprehensive paragraph describing the photorealistic human version of the character: their face (hair color, hairstyle, face shape, eye color, skin tone, expression), what they are wearing (based on attribute mode), the scene, environment, lighting, camera angle, mood, and all quality tags. Entirely self-contained since NO reference images will be provided.",
  "negative_prompt": "cartoon, anime, animated, 3D render, CGI, game art, illustrated, flat shading, cel shading, digital painting, blurry, low quality, deformed anatomy, extra limbs, bad proportions, watermark, text, unrealistic skin, plastic skin, doll-like",
  "face_preservation": {
    "hair_color": "Exact hair color from reference",
    "hairstyle": "Exact hairstyle description",
    "face_shape": "Face shape",
    "eye_color": "Eye color",
    "skin_tone": "Skin tone",
    "distinguishing_features": "Scars, marks, unique features"
  },
  "attribute_mode": "full-attribute or custom-outfit",
  "characters": [
    {
      "name": "Hero name",
      "realistic_description": "Complete photorealistic description of this character as a real human"
    }
  ],
  "scene": "Detailed real-world environment description",
  "lighting": "Detailed lighting setup description",
  "camera_angle": "Camera perspective and composition",
  "mood": "Emotional atmosphere",
  "quality_tags": ["8k resolution", "sharp focus", "raw photography", "photorealistic", "real human skin texture", "pore detail", "subsurface scattering"],
  "aspect_ratio": "The specified aspect ratio",
  "style": "photorealistic portrait photography"
}

IMPORTANT RULES:
- The "prompt" field is the PRIMARY output. It MUST contain the full inline realistic description.
- For HUMAN heroes: describe as a REAL HUMAN, never as animated. Preserve identity through facial features.
- For NON-HUMAN heroes: describe their creature/monster/robot form rendered in PHOTOREALISTIC style with real-world materials and textures. Do NOT humanize them.
- For MASKED heroes: keep the mask/helmet ON, rendered in realistic materials.
- Quality boosters: "photorealistic", "real skin texture with visible pores" (for humans) or "photorealistic creature/material textures" (for non-humans), "subsurface scattering", "8k resolution", "sharp focus", "raw photography".
- Anti-animation keywords MUST be in negative prompt: "cartoon, anime, animated, 3D render, CGI, game art, illustrated".
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;

const REALISTIC_WITH_REF = `You are an expert prompt engineer specializing in converting animated/cartoon game characters into photorealistic human portraits. Your task is to create a highly detailed, structured JSON prompt that transforms MLBB (Mobile Legends) animated hero images into realistic human photographs.

CRITICAL CONTEXT:
The JSON prompt you generate will be used in Google Flow TOGETHER with the original reference images attached. Your text should COMPLEMENT the reference images while focusing on the REALISTIC HUMAN CONVERSION aspect.

CORE OBJECTIVE — ANIMATION TO REALISTIC CONVERSION:
Convert the animated hero into a PHOTOREALISTIC version while preserving their recognizable identity.

🔴 NON-HUMAN & MASKED HERO RULES (CRITICAL — CHECK FIRST):
Before converting, VISUALLY ANALYZE the reference image:

1. NON-HUMAN HEROES (monsters, demons, creatures, robots, spirits, animals, insects, undead):
   - DO NOT convert to human form. Keep their original creature/monster/robot form.
   - Instruct the image generator to render them in photorealistic style — real textures (scales, fur, metal, stone), realistic lighting, but the FORM stays the same.

2. MASKED/HELMETED HEROES (wearing masks, helmets, face coverings):
   - KEEP the mask/helmet ON. Convert to realistic materials but do not remove it.
   - Only convert visible face parts (e.g., eyes through mask slits) to realistic.

3. HUMAN/HUMANOID HEROES → Use Face Preservation Rules below for full animated→human conversion.

FACE PRESERVATION RULES (FOR HUMAN/HUMANOID HEROES):
The reference image shows the animated version. Instruct the image generator to:
- KEEP the same hair color and hairstyle but render as REAL hair with natural texture
- KEEP the same eye color but as natural human eyes
- KEEP the same face shape translated to human proportions
- KEEP any distinguishing facial features (scars, marks, etc.)
- CONVERT cartoon skin to real human skin with pores, imperfections, natural subsurface scattering
- Match the facial expression to the scenario context

ATTRIBUTE MODE HANDLING:
- "full-attribute": Keep hero's original costume/armor but render in photorealistic materials.
- "custom-outfit": IGNORE the hero's game costume. Dress in scenario-appropriate clothing. Only preserve the FACE.
- For NON-HUMAN heroes: attribute mode has minimal effect — they keep their original form rendered realistically.

⚠️ SCENARIO OVERRIDE RULE (CRITICAL):
The user's SCENARIO/NARRATIVE text ALWAYS takes HIGHEST PRIORITY over attribute mode. If the scenario describes specific non-game clothing, follow the scenario.

INSTRUCTIONS:
1. ANALYZE each reference image — determine if hero is human, non-human, or masked.
2. FOCUS ON CONVERSION INSTRUCTIONS: For humans, convert animated → realistic human. For non-humans, convert animated → photorealistic creature/machine. For masked, keep mask, convert materials.
3. DESCRIBE the scenario composition: poses, expressions, interactions, environment.
4. OUTPUT a single valid JSON object with the same structure as standalone mode.

IMPORTANT RULES:
- For HUMAN heroes: focus on animated → real human conversion instructions.
- For NON-HUMAN heroes: focus on animated → photorealistic creature/material conversion. Do NOT humanize.
- For MASKED heroes: keep mask ON, instruct realistic material rendering.
- The reference images handle visual detail — your text handles the realistic conversion instructions.
- Anti-animation keywords in negative prompt are MANDATORY.
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;

// =============================================================================
// CINEMATIC MODE — Hyper-Realistic AI Image (Non-Realistic / Game-Style)
// =============================================================================

const CINEMATIC_STANDALONE = `You are an expert prompt engineer specializing in cinematic hyper-realistic AI image generation. Your task is to create a highly detailed, structured JSON prompt.

CRITICAL CONTEXT:
The JSON prompt you generate will be used in Google Flow (an AI image generation workflow) WITHOUT any reference images attached. This means your TEXT DESCRIPTIONS are the ONLY source of information the image generator will have about the characters. If a detail is not written in the text, it will not appear in the final image. Every visual element MUST be captured in words.

INSTRUCTIONS:
1. ANALYZE each attached reference image with extreme precision. For each character, extract and describe in full sentences:
   - Hair: exact color, length, texture, style, highlights, accessories
   - Eyes: color, shape, expression, any supernatural features (glowing, slit pupils, etc.)
   - Skin: tone, texture, any markings, tattoos, war paint, or glowing effects
   - Face: facial structure, notable features, expression, makeup
   - Body: build, height impression, posture
   - Costume/Armor: every piece — material (leather, metal, cloth, crystal), color, pattern, trim, engravings, damage, glow effects
   - Weapons/Props: type, material, size, any magical/energy effects
   - Accessories: jewelry, belts, capes, wings, tails, chains, etc.
   - Aura/Magic Effects: any glow, particles, energy field around the character

2. TRANSLATE the user's narrative scenario into vivid cinematic visual descriptions:
   - Photorealistic human skin textures (pores, subsurface scattering)
   - Cinematic lighting (volumetric, rim light, ambient occlusion)
   - Environmental storytelling
   - Dynamic composition and camera work

3. INCORPORATE the specified technical parameters (aspect ratio, quality, mood, lighting, camera angle).

4. OUTPUT a single valid JSON object with the following structure:

{
  "prompt": "THE MOST IMPORTANT FIELD. A single comprehensive paragraph that FULLY DESCRIBES everything: each character's complete appearance (as described above) woven naturally into the scene description, environment, lighting, camera angle, mood, and all quality tags. This paragraph must be entirely self-contained — reading it alone must give the image generator everything needed to recreate the scene accurately, since NO reference images will be provided.",
  "negative_prompt": "blurry, low quality, deformed anatomy, extra limbs, bad proportions, watermark, text, cartoon, anime, illustrated, flat shading",
  "characters": [
    {
      "name": "Hero name",
      "description": "Complete standalone physical and costume description — every visual detail necessary to identify and recreate this character accurately without any reference image"
    }
  ],
  "scene": "Detailed environment and background description",
  "lighting": "Detailed lighting setup description",
  "camera_angle": "Camera perspective and composition",
  "mood": "Emotional atmosphere",
  "quality_tags": ["8k resolution", "sharp focus", "raw photography", "hyper-realistic", "ultra detailed"],
  "aspect_ratio": "The specified aspect ratio",
  "style": "cinematic hyper-realistic photography"
}

IMPORTANT RULES:
- The "prompt" field is the PRIMARY output used by the image generator. It MUST contain the full inline character description for each hero — do not just reference "the character" or use vague terms.
- Always include quality boosters: "8k resolution", "sharp focus", "raw photography", "hyper-realistic skin texture", "pore detail", "subsurface scattering".
- Descriptions must work perfectly WITHOUT the reference images being present.
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;

const CINEMATIC_WITH_REF = `You are an expert prompt engineer specializing in cinematic hyper-realistic AI image generation. Your task is to create a highly detailed, structured JSON prompt.

CRITICAL CONTEXT:
The JSON prompt you generate will be used in Google Flow TOGETHER with the original reference images attached. The reference images will be uploaded alongside this prompt, so the image generator can see the characters directly. Your text descriptions should COMPLEMENT the reference images by focusing on:
- The SCENE and NARRATIVE composition
- How the characters are POSED and POSITIONED in the scene
- The INTERACTION between characters and their environment
- LIGHTING, MOOD, and ATMOSPHERE details
- TECHNICAL quality parameters

You still need to mention each character by name and basic identifying features, but you do NOT need to exhaustively describe every costume detail since the reference images will handle visual accuracy.

INSTRUCTIONS:
1. ANALYZE each attached reference image to understand character identity, key recognizable features, and visual style.
2. FOCUS ON SCENE COMPOSITION: how characters are placed in the narrative, their poses, expressions, and interactions.
3. INCORPORATE the specified technical parameters (aspect ratio, quality, mood, lighting, camera angle).
4. OUTPUT a single valid JSON object with the following structure:

{
  "prompt": "A comprehensive paragraph describing the scene composition with character names and key identifying features, woven into the narrative scenario, environment, lighting, camera angle, mood, and quality tags. Reference images will provide the visual details.",
  "negative_prompt": "blurry, low quality, deformed anatomy, extra limbs, bad proportions, watermark, text, cartoon, anime, illustrated, flat shading",
  "characters": [
    {
      "name": "Hero name",
      "description": "Key identifying features and role in the scene — reference image provides full visual detail"
    }
  ],
  "scene": "Detailed environment and background description",
  "lighting": "Detailed lighting setup description",
  "camera_angle": "Camera perspective and composition",
  "mood": "Emotional atmosphere",
  "quality_tags": ["8k resolution", "sharp focus", "raw photography", "hyper-realistic", "ultra detailed"],
  "aspect_ratio": "The specified aspect ratio",
  "style": "cinematic hyper-realistic photography"
}

IMPORTANT RULES:
- The "prompt" field must be a flowing, natural paragraph combining scene, characters, and technical details.
- Always include quality boosters: "8k resolution", "sharp focus", "raw photography", "hyper-realistic skin texture".
- Focus on WHAT the characters are DOING, not exhaustively describing their appearance.
- The reference images will be uploaded alongside this prompt — lean on them for visual accuracy.
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;


// =============================================================================
// SCENE IMAGE MODE — Realistic: Place hero into a reference scene
// =============================================================================

const REALISTIC_SCENE_STANDALONE = `You are an expert prompt engineer specializing in converting animated/cartoon game characters into photorealistic human portraits AND compositing them into reference scene images. Your task is to create a highly detailed, structured JSON prompt.

CRITICAL CONTEXT:
The user has provided TWO types of reference images:
1. HERO REFERENCE IMAGE(S) — animated/cartoon MLBB hero images showing their appearance
2. SCENE REFERENCE IMAGE — a real-world photo/image showing the desired SCENE/SETTING/BACKGROUND

The JSON prompt will be used in Google Flow WITHOUT any reference images attached. Your text must be entirely self-contained.

CORE OBJECTIVE — HERO IN SCENE COMPOSITING:
Take the animated hero, convert them to a PHOTOREALISTIC version, and describe them AS IF they are physically present in the scene shown in the scene reference image. The hero should look natural and integrated into that specific setting.

🔴 NON-HUMAN & MASKED HERO RULES (CRITICAL — CHECK FIRST):
1. NON-HUMAN HEROES (monsters, demons, creatures, robots, spirits, animals, etc.): DO NOT convert to human form. Keep their creature/monster/robot form rendered in photorealistic style with real-world textures, and place them naturally into the scene.
2. MASKED/HELMETED HEROES: KEEP the mask/helmet ON, rendered in realistic materials. Do not remove to reveal a human face.
3. HUMAN/HUMANOID HEROES: Convert to realistic human using Face Preservation Rules below.

FACE PRESERVATION RULES (FOR HUMAN/HUMANOID HEROES):
You MUST analyze the hero reference image and preserve these facial features with extreme precision:
- Hair color, hairstyle, face shape, eye color, skin tone, distinguishing marks
- These features must be translated from animated style to photorealistic human features

SCENE INTEGRATION RULES:
- ANALYZE the scene reference image thoroughly: location, environment, objects, atmosphere, lighting conditions, time of day, weather
- The hero must be described as NATURALLY EXISTING in that scene — not just pasted on top
- Match the scene's lighting, shadows, and color grading to the hero's appearance
- The hero's pose, expression, and body language should feel organic to the scene context
- If the user provides a narrative/description, use it to guide HOW the hero interacts with the scene

ATTRIBUTE MODE HANDLING:
- "full-attribute": Hero wears their original costume/armor rendered in photorealistic materials within the scene context
- "custom-outfit": Hero wears clothing appropriate to the scene (ignore game costume)

⚠️ SCENARIO OVERRIDE RULE (CRITICAL):
The user's SCENARIO/NARRATIVE text ALWAYS takes the HIGHEST PRIORITY. If the narrative describes specific poses, clothing, or actions, follow the narrative over other defaults.

OUTPUT: A single valid JSON object with:
{
  "prompt": "Complete self-contained paragraph: realistic human version of the hero integrated into the scene from the reference image. Include full face description, clothing, scene environment (FROM THE SCENE IMAGE), lighting, camera angle, mood, quality tags.",
  "negative_prompt": "cartoon, anime, animated, 3D render, CGI, game art, illustrated, flat shading, composited, pasted, unnatural placement, mismatched lighting",
  "face_preservation": { "hair_color": "...", "hairstyle": "...", "face_shape": "...", "eye_color": "...", "skin_tone": "...", "distinguishing_features": "..." },
  "attribute_mode": "full-attribute or custom-outfit",
  "characters": [{ "name": "...", "realistic_description": "..."}],
  "scene": "Detailed description of the scene FROM the scene reference image",
  "scene_integration": "How the hero is integrated into the scene naturally",
  "lighting": "Lighting that matches the scene reference",
  "camera_angle": "...",
  "mood": "...",
  "quality_tags": ["8k resolution", "sharp focus", "raw photography", "photorealistic", "natural scene integration", "matched lighting"],
  "aspect_ratio": "...",
  "style": "photorealistic scene compositing"
}

IMPORTANT: The "prompt" field must describe the SCENE from the scene reference in vivid detail, with the hero naturally placed within it. ONLY output the JSON object.`;

const REALISTIC_SCENE_WITH_REF = `You are an expert prompt engineer specializing in converting animated/cartoon game characters into photorealistic human portraits AND compositing them into reference scene images.

CRITICAL CONTEXT:
The user has provided TWO types of reference images:
1. HERO REFERENCE IMAGE(S) — animated/cartoon MLBB hero images
2. SCENE REFERENCE IMAGE — a photo/image showing the desired SCENE/SETTING

The JSON prompt will be used in Google Flow TOGETHER with the reference images attached.

CORE OBJECTIVE:
Convert the animated hero to a PHOTOREALISTIC version and instruct the image generator to place them naturally into the scene shown in the scene reference image.

🔴 NON-HUMAN & MASKED HERO RULES:
1. NON-HUMAN HEROES: DO NOT convert to human. Keep their creature/monster/robot form rendered photorealistically.
2. MASKED HEROES: Keep mask/helmet ON, render in realistic materials.
3. HUMAN/HUMANOID HEROES: Convert to realistic human using face preservation below.

FACE PRESERVATION (HUMAN/HUMANOID ONLY): Keep same hair color, hairstyle, eye color, face shape, skin tone — converted to realistic.

SCENE INTEGRATION:
- The scene reference image provides the environment/background
- Instruct the generator to match the hero's lighting, shadows, and color grading to the scene
- Describe HOW the hero exists naturally in that specific scene
- If narrative is provided, it guides the hero's interaction with the scene

ATTRIBUTE MODE: Same as standard realistic mode with scenario override rule.

OUTPUT: Same JSON structure as standalone mode but focused on INTEGRATION INSTRUCTIONS.
ONLY output the JSON object. No markdown, no code fences.`;

// =============================================================================
// SCENE IMAGE MODE — Cinematic: Place hero into a reference scene
// =============================================================================

const CINEMATIC_SCENE_STANDALONE = `You are an expert prompt engineer specializing in cinematic hyper-realistic AI image generation with SCENE COMPOSITING.

CRITICAL CONTEXT:
The user has provided TWO types of reference images:
1. HERO REFERENCE IMAGE(S) — MLBB hero images showing their full appearance, armor, weapons
2. SCENE REFERENCE IMAGE — an image showing the desired SCENE/SETTING/BACKGROUND

The JSON prompt will be used WITHOUT any reference images attached. Your text must be entirely self-contained.

CORE OBJECTIVE — HERO IN SCENE COMPOSITING:
Analyze the hero's complete appearance (armor, weapons, magical effects) and describe them as if they are physically present in the scene from the scene reference image. The integration should feel natural and cinematic.

SCENE INTEGRATION RULES:
- ANALYZE the scene reference image: location, architecture, landscape, atmosphere, lighting, weather, time of day
- Describe every visual detail of the hero (from hero reference)
- Place the hero within the scene naturally with appropriate scale, perspective, and lighting match
- The hero's pose and expression should feel organic to the scene
- If narrative is provided, it takes the HIGHEST PRIORITY for how the hero interacts with the scene

INSTRUCTIONS:
1. ANALYZE hero reference images — extract complete visual details (hair, eyes, skin, armor, weapons, aura)
2. ANALYZE scene reference image — extract environment details
3. COMPOSE them together in the prompt description
4. OUTPUT a single valid JSON object:

{
  "prompt": "Complete paragraph: hero with FULL visual description naturally placed within the scene from the reference image. Include hero appearance, armor/weapons, environment from scene image, lighting, mood, quality tags. Entirely self-contained.",
  "negative_prompt": "blurry, low quality, deformed, composited look, pasted, mismatched lighting, unnatural placement",
  "characters": [{ "name": "...", "description": "Complete standalone visual description" }],
  "scene": "Detailed description of the environment FROM the scene reference image",
  "scene_integration": "How the hero is integrated into the scene",
  "lighting": "...",
  "camera_angle": "...",
  "mood": "...",
  "quality_tags": ["8k resolution", "sharp focus", "raw photography", "hyper-realistic", "natural scene integration"],
  "aspect_ratio": "...",
  "style": "cinematic hyper-realistic scene compositing"
}

ONLY output the JSON object. No markdown, no code fences.`;

const CINEMATIC_SCENE_WITH_REF = `You are an expert prompt engineer specializing in cinematic hyper-realistic AI image generation with SCENE COMPOSITING.

CRITICAL CONTEXT:
The user has provided TWO types of reference images:
1. HERO REFERENCE IMAGE(S) — MLBB hero images
2. SCENE REFERENCE IMAGE — an image showing the desired SCENE/SETTING

The JSON prompt will be used TOGETHER with the reference images attached.

CORE OBJECTIVE:
Instruct the image generator to place the hero (from hero reference) naturally into the scene (from scene reference). The integration should feel cinematic and natural.

SCENE INTEGRATION:
- The scene reference provides the environment — instruct matching lighting, shadows, perspective
- Describe HOW the hero should be positioned, posed, and interacting with the scene
- If narrative is provided, it takes HIGHEST PRIORITY

OUTPUT: Same JSON structure as standalone mode but focused on composition instructions.
ONLY output the JSON object. No markdown, no code fences.`;


// =============================================================================
// INSTRUCTION SELECTOR
// =============================================================================

function getSystemInstruction(promptMode: "realistic" | "cinematic", referenceMode: string, hasSceneImage: boolean): string {
  if (hasSceneImage) {
    if (promptMode === "realistic") {
      return referenceMode === "with-reference" ? REALISTIC_SCENE_WITH_REF : REALISTIC_SCENE_STANDALONE;
    }
    return referenceMode === "with-reference" ? CINEMATIC_SCENE_WITH_REF : CINEMATIC_SCENE_STANDALONE;
  }
  if (promptMode === "realistic") {
    return referenceMode === "with-reference" ? REALISTIC_WITH_REF : REALISTIC_STANDALONE;
  }
  return referenceMode === "with-reference" ? CINEMATIC_WITH_REF : CINEMATIC_STANDALONE;
}


// =============================================================================
// PROMPT GENERATION (dengan Context Caching)
// =============================================================================

export async function generatePrompt(params: GeneratePromptParams): Promise<string> {
  let ai = createGeminiClient();
  let currentKey = getAvailableKey();
  const MODEL_NAME = params.modelName || DEFAULT_MODEL;
  const hasSceneImage = !!params.sceneImage;
  const instruction = getSystemInstruction(params.promptMode, params.referenceMode, hasSceneImage);

  // ── Bangun image parts dan labels ──
  const heroCounts = new Map<string, number>();
  const heroIndexes = new Map<string, number>();
  for (const hero of params.heroes) {
    heroCounts.set(hero.heroName, (heroCounts.get(hero.heroName) || 0) + 1);
    heroIndexes.set(hero.heroName, 0);
  }

  const heroNames = params.heroes.map(h => h.heroName);
  const imageParts: CacheImagePart[] = [];
  const imageLabels: string[] = [];

  for (const hero of params.heroes) {
    imageParts.push({ inlineData: { mimeType: hero.mimeType, data: hero.base64Data } });

    const total = heroCounts.get(hero.heroName) || 1;
    const idx = (heroIndexes.get(hero.heroName) || 0) + 1;
    heroIndexes.set(hero.heroName, idx);

    let label: string;
    if (total > 1) {
      label = params.promptMode === "realistic"
        ? `[Reference image ${idx} of ${total} for ${hero.heroName} — analyze facial features from this angle: hair color, hairstyle, face shape, eye color, skin tone, distinguishing marks]`
        : `[Reference image ${idx} of ${total} for ${hero.heroName}]`;
    } else {
      label = params.promptMode === "realistic"
        ? `[Reference image for ${hero.heroName} — analyze facial features: hair color, hairstyle, face shape, eye color, skin tone, distinguishing marks]`
        : `[Reference image for ${hero.heroName}]`;
    }
    imageLabels.push(label);
  }

  // ── Context Caching: cache system instruction + gambar hero ──
  const sceneKey = hasSceneImage ? '::scene' : '';
  const cacheKey = buildCacheKey(`gemini::${params.promptMode}::${params.referenceMode}${sceneKey}`, heroNames);
  const cachedContentName = await getOrCreateCache({
    ai,
    model: MODEL_NAME,
    cacheKey,
    systemInstruction: instruction,
    imageParts,
    imageLabels,
  });

  // ── Bangun user prompt (hanya teks) ──
  const uniqueHeroNames = [...new Set(heroNames)];
  const heroListWithCounts = uniqueHeroNames.map(name => {
    const count = heroCounts.get(name) || 1;
    return count > 1 ? `- ${name} (${count} reference images from different angles)` : `- ${name}`;
  }).join("\n");

  let userPrompt: string;

  if (params.promptMode === "realistic") {
    const attributeModeDesc = params.attributeMode === "full-attribute"
      ? "FULL ATTRIBUTE MODE — Keep the hero's original costume/armor/weapons but render them in photorealistic materials (real metal, leather, fabric). The character should look like a real cosplayer or movie character wearing realistic versions of their game outfit. ⚠️ HOWEVER: If the scenario/narrative above explicitly mentions specific clothing (e.g. school uniform, casual wear, etc.), ALWAYS prioritize the scenario — dress the character as described in the narrative instead of using game costume."
      : "CUSTOM OUTFIT MODE — IGNORE all hero game costumes, armor, and weapons. Dress the character in real-world clothing that matches the scenario described above. Only preserve the character's FACE (hair color, hairstyle, eye color, face shape, skin tone).";

    userPrompt = `
SCENARIO/NARRATIVE:
${params.narrative}
${hasSceneImage ? '\n⚠️ SCENE IMAGE PROVIDED: A scene reference image has been attached. Analyze it thoroughly and use it as the PRIMARY ENVIRONMENT/SETTING. Place the hero(es) NATURALLY into that scene. The narrative above provides additional context for how the hero should interact with the scene.\n' : ''}
HEROES TO CONVERT TO REALISTIC HUMAN:
${heroListWithCounts}

ATTRIBUTE MODE:
${attributeModeDesc}

TECHNICAL CONFIGURATION:
- Aspect Ratio: ${params.aspectRatio}
- Quality Level: ${params.quality}
- Mood/Atmosphere: ${params.mood || "cinematic dramatic"}
- Lighting Style: ${params.lighting || "volumetric cinematic"}
- Camera Angle: ${params.cameraAngle || "dynamic wide shot"}

Please analyze the reference images${hasSceneImage ? ' and the scene image' : ''}, extract facial features, and generate a photorealistic ${hasSceneImage ? 'scene compositing' : 'conversion'} prompt.`;
  } else {
    userPrompt = `
SCENARIO/NARRATIVE:
${params.narrative}
${hasSceneImage ? '\n⚠️ SCENE IMAGE PROVIDED: A scene reference image has been attached. Analyze it thoroughly and use it as the PRIMARY ENVIRONMENT/SETTING. Place the hero(es) NATURALLY into that scene. The narrative above provides additional context for how the hero should interact with the scene.\n' : ''}
HEROES IN THIS SCENE:
${heroListWithCounts}

TECHNICAL CONFIGURATION:
- Aspect Ratio: ${params.aspectRatio}
- Quality Level: ${params.quality}
- Mood/Atmosphere: ${params.mood || "cinematic dramatic"}
- Lighting Style: ${params.lighting || "volumetric cinematic"}
- Camera Angle: ${params.cameraAngle || "dynamic wide shot"}

Please analyze the reference images${hasSceneImage ? ' and the scene image' : ''} and generate the cinematic hyper-realistic ${hasSceneImage ? 'scene compositing' : ''} JSON prompt.`;
  }

  // ── Jika ada scene image, tambahkan sebagai image part ──
  const sceneImagePart = params.sceneImage
    ? { inlineData: { mimeType: params.sceneImage.mimeType, data: params.sceneImage.base64Data } }
    : null;

  // ── Generate content ──
  let contents: object[];
  if (cachedContentName) {
    // Cached: gambar hero sudah di-cache, kirim teks saja (+ scene image jika ada)
    const parts: object[] = [];
    if (sceneImagePart) {
      parts.push(sceneImagePart);
      parts.push({ text: "[SCENE REFERENCE IMAGE — This is the target scene/setting. Place the hero(es) naturally into this scene]" });
    }
    parts.push({ text: userPrompt });
    contents = [{ role: "user", parts }];
  } else {
    // Non-cached fallback: gambar + teks dalam satu user turn
    const parts: object[] = [];
    for (let i = 0; i < imageParts.length; i++) {
      parts.push(imageParts[i]);
      parts.push({ text: imageLabels[i] });
    }
    if (sceneImagePart) {
      parts.push(sceneImagePart);
      parts.push({ text: "[SCENE REFERENCE IMAGE — This is the target scene/setting. Place the hero(es) naturally into this scene]" });
    }
    parts.push({ text: userPrompt });
    contents = [{ role: "user", parts }];
  }

  // ── Helper: jalankan generateContent (bisa dipanggil ulang dengan key berbeda) ──
  const executeGenerate = async (aiClient: GoogleGenAI) => {
    return await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: {
        ...(cachedContentName
          ? { cachedContent: cachedContentName }
          : { systemInstruction: instruction }
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
      console.warn(`[Gemini Generate] Rate limit hit — attempting key fallback...`);
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
    console.error("[Gemini Generate] Empty response. Usage:", response.usageMetadata);
    throw new Error("Model returned an empty response. Please try again.");
  }

  const cleaned = cleanResponseText(raw);

  try {
    JSON.parse(cleaned);
  } catch {
    console.error("[Gemini Generate] JSON parse failed. Raw (first 500):", raw.substring(0, 500));
    throw new Error("The AI response was not valid JSON. Please try again.");
  }

  return cleaned;
}

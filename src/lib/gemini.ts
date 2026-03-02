import { GoogleGenAI } from "@google/genai";
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
}

// =============================================================================
// REALISTIC MODE — Animation → Real Human Conversion
// =============================================================================

const REALISTIC_STANDALONE = `You are an expert prompt engineer specializing in converting animated/cartoon game characters into photorealistic human portraits. Your task is to create a highly detailed, structured JSON prompt that transforms MLBB (Mobile Legends) animated hero images into realistic human photographs.

CRITICAL CONTEXT:
The JSON prompt you generate will be used in Google Flow (an AI image generation workflow) WITHOUT any reference images attached. This means your TEXT DESCRIPTIONS are the ONLY source of information the image generator will have. Every visual element MUST be captured in words.

CORE OBJECTIVE — ANIMATION TO REALISTIC CONVERSION:
Take the animated/cartoon hero reference image and describe how this character would look as a REAL HUMAN BEING in the real world.

FACE PRESERVATION RULES (HIGHEST PRIORITY):
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
- The "prompt" field is the PRIMARY output. It MUST contain the full inline realistic human description.
- ALWAYS describe the character as a REAL HUMAN, never as an animated or game character.
- Preserve CHARACTER IDENTITY through facial features (hair, eyes, face shape, skin tone).
- Quality boosters: "photorealistic", "real human skin texture with visible pores", "subsurface scattering", "natural hair texture", "8k resolution", "sharp focus", "raw photography".
- Anti-animation keywords MUST be in negative prompt: "cartoon, anime, animated, 3D render, CGI, game art, illustrated".
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;

const REALISTIC_WITH_REF = `You are an expert prompt engineer specializing in converting animated/cartoon game characters into photorealistic human portraits. Your task is to create a highly detailed, structured JSON prompt that transforms MLBB (Mobile Legends) animated hero images into realistic human photographs.

CRITICAL CONTEXT:
The JSON prompt you generate will be used in Google Flow TOGETHER with the original reference images attached. Your text should COMPLEMENT the reference images while focusing on the REALISTIC HUMAN CONVERSION aspect.

CORE OBJECTIVE — ANIMATION TO REALISTIC CONVERSION:
Convert the animated hero into a REAL HUMAN while preserving their recognizable identity.

FACE PRESERVATION RULES (HIGHEST PRIORITY):
The reference image shows the animated version. Instruct the image generator to:
- KEEP the same hair color and hairstyle but render as REAL hair with natural texture
- KEEP the same eye color but as natural human eyes
- KEEP the same face shape translated to human proportions
- KEEP any distinguishing facial features (scars, marks, etc.)
- CONVERT cartoon skin to real human skin with pores, imperfections, natural subsurface scattering
- Match the facial expression to the scenario context

ATTRIBUTE MODE HANDLING:
- "full-attribute": Keep hero's original costume/armor but render in photorealistic materials. The reference image provides detail — just instruct realistic material conversion.
- "custom-outfit": IGNORE the hero's game costume. Dress in scenario-appropriate real-world clothing. Only preserve the FACE.

⚠️ SCENARIO OVERRIDE RULE (CRITICAL):
The user's SCENARIO/NARRATIVE text ALWAYS takes HIGHEST PRIORITY over attribute mode. If the scenario describes specific non-game clothing, follow the scenario.

INSTRUCTIONS:
1. ANALYZE each reference image for key facial features and identity.
2. FOCUS ON CONVERSION INSTRUCTIONS: Tell the image generator HOW to convert animated → realistic.
3. DESCRIBE the scenario composition: poses, expressions, interactions, environment.
4. OUTPUT a single valid JSON object with the same structure as standalone mode.

IMPORTANT RULES:
- Focus on CONVERSION INSTRUCTIONS — how to turn the animated reference into a real human.
- Always preserve CHARACTER IDENTITY through facial features.
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
// INSTRUCTION SELECTOR
// =============================================================================

function getSystemInstruction(promptMode: "realistic" | "cinematic", referenceMode: string): string {
  if (promptMode === "realistic") {
    return referenceMode === "with-reference" ? REALISTIC_WITH_REF : REALISTIC_STANDALONE;
  }
  return referenceMode === "with-reference" ? CINEMATIC_WITH_REF : CINEMATIC_STANDALONE;
}


// =============================================================================
// PROMPT GENERATION (dengan Context Caching)
// =============================================================================

export async function generatePrompt(params: GeneratePromptParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const ai = new GoogleGenAI({ apiKey });
  const instruction = getSystemInstruction(params.promptMode, params.referenceMode);

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
  const cacheKey = buildCacheKey(`gemini::${params.promptMode}::${params.referenceMode}`, heroNames);
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

Please analyze the reference images, extract facial features, and generate a photorealistic conversion prompt.`;
  } else {
    userPrompt = `
SCENARIO/NARRATIVE:
${params.narrative}

HEROES IN THIS SCENE:
${heroListWithCounts}

TECHNICAL CONFIGURATION:
- Aspect Ratio: ${params.aspectRatio}
- Quality Level: ${params.quality}
- Mood/Atmosphere: ${params.mood || "cinematic dramatic"}
- Lighting Style: ${params.lighting || "volumetric cinematic"}
- Camera Angle: ${params.cameraAngle || "dynamic wide shot"}

Please analyze the reference images and generate the cinematic hyper-realistic JSON prompt.`;
  }

  // ── Generate content ──
  let contents: object[];
  if (cachedContentName) {
    // Cached: gambar sudah di-cache, kirim teks saja
    contents = [{ role: "user", parts: [{ text: userPrompt }] }];
  } else {
    // Non-cached fallback: gambar + teks dalam satu user turn
    const parts: object[] = [];
    for (let i = 0; i < imageParts.length; i++) {
      parts.push(imageParts[i]);
      parts.push({ text: imageLabels[i] });
    }
    parts.push({ text: userPrompt });
    contents = [{ role: "user", parts }];
  }

  const response = await ai.models.generateContent({
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

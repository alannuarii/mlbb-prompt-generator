import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

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

// ---- System Instructions per mode ----

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: getInstruction(params.mode),
  });

  const parts: Part[] = [];

  // Add hero images
  for (const hero of params.heroes) {
    parts.push({
      inlineData: {
        mimeType: hero.mimeType,
        data: hero.base64Data,
      },
    });
    parts.push({ text: `[Reference image for ${hero.heroName}]` });
  }

  // Build config summary
  const configLines = Object.entries(params.config)
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  const heroNames = [...new Set(params.heroes.map(h => h.heroName))];

  parts.push({
    text: `HEROES: ${heroNames.join(", ")}

SELECTED CONFIGURATION:
${configLines}

Please generate 3 creative and diverse scenario suggestions for these hero(es) based on the reference images and configuration above.`,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 1.2,
      maxOutputTokens: 2048,
    },
  });

  const text = result.response.text().trim();

  // Clean response
  let cleaned = text;
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid response format from AI");
  }

  return parsed.map((item: any) => ({
    title: item.title || "Skenario",
    scenario: item.scenario || "",
  }));
}

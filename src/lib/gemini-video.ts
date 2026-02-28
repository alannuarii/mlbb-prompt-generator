import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const MODEL_NAME = "gemini-2.5-flash";

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
  "duration": "Target duration of the video clip",
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
- Keep movements proportional to the duration — a 4-second clip should have subtle, focused motion; a 16-second clip can have more complex sequences.
- ONLY output the JSON object. No markdown, no code fences, no explanations.`;


export async function generateVideoPrompt(params: GenerateVideoPromptParams): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: SYSTEM_INSTRUCTION_VIDEO,
  });

  // Build parts array
  const parts: Part[] = [];

  // Add reference images (the generated photorealistic still images)
  for (const hero of params.heroes) {
    parts.push({
      inlineData: {
        mimeType: hero.mimeType,
        data: hero.base64Data,
      },
    });
    parts.push({
      text: `[Generated photorealistic image containing ${hero.heroName} — analyze the scene, character pose, lighting, and environment for animation]`,
    });
  }

  // Add the user's narrative and configuration
  const userPrompt = `
VIDEO SCENE NARRATIVE:
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

Please analyze the uploaded reference image(s) and generate a detailed video animation prompt that brings this still image to life as a cinematic video clip.`;

  parts.push({ text: userPrompt });

  const result = await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 1,
      maxOutputTokens: 8192,
    },
  });

  const response = result.response;
  const text = response.text();

  // Clean the response
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }

  // Validate JSON
  try {
    JSON.parse(cleaned);
  } catch {
    throw new Error("The AI response was not valid JSON. Raw response: " + text.substring(0, 500));
  }

  return cleaned;
}

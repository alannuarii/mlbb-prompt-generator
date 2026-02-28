import type { APIEvent } from "@solidjs/start/server";
import { generateVideoPrompt } from "../../lib/gemini-video";

export async function POST(event: APIEvent) {
  try {
    const body = await new Response(event.request.body).json();

    const { narrative, heroes, aspectRatio, duration, cameraMovement, motionIntensity, videoStyle, mood, soundDesign } = body;

    // Validate required fields
    if (!narrative || !narrative.trim()) {
      return new Response(
        JSON.stringify({ error: "Video scene narrative is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!heroes || !Array.isArray(heroes) || heroes.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one hero must be selected" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const heroesWithImages = heroes.filter(
      (h: any) => h.base64Data && h.mimeType
    );

    if (heroesWithImages.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one hero must have a reference image uploaded" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await generateVideoPrompt({
      narrative,
      heroes: heroes.map((h: any) => ({
        heroName: h.heroName,
        base64Data: h.base64Data,
        mimeType: h.mimeType,
      })),
      aspectRatio: aspectRatio || "16:9",
      duration: duration || "8 seconds",
      cameraMovement: cameraMovement || "slow push in",
      motionIntensity: motionIntensity || "moderate",
      videoStyle: videoStyle || "cinematic film",
      mood: mood || "cinematic dramatic",
      soundDesign: soundDesign || "cinematic ambient",
    });

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Generate Video API error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Failed to generate video prompt. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

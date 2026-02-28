import type { APIEvent } from "@solidjs/start/server";
import { generatePrompt } from "../../lib/gemini";

export async function POST(event: APIEvent) {
  try {
    const body = await new Response(event.request.body).json();

    const { narrative, heroes, aspectRatio, quality, mood, lighting, cameraAngle, referenceMode, attributeMode, promptMode } = body;

    // Validate required fields
    if (!narrative || !narrative.trim()) {
      return new Response(
        JSON.stringify({ error: "Narrative/scenario is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!heroes || !Array.isArray(heroes) || heroes.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one hero must be selected" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check that at least one hero has an image uploaded
    const heroesWithImages = heroes.filter(
      (h: any) => h.base64Data && h.mimeType
    );

    if (heroesWithImages.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one hero must have a reference image uploaded" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await generatePrompt({
      narrative,
      heroes: heroes.map((h: any) => ({
        heroName: h.heroName,
        base64Data: h.base64Data,
        mimeType: h.mimeType,
      })),
      aspectRatio: aspectRatio || "9:16",
      quality: quality || "ultra",
      mood: mood || "cinematic dramatic",
      lighting: lighting || "volumetric cinematic",
      cameraAngle: cameraAngle || "dynamic wide shot",
      referenceMode: referenceMode || "with-reference",
      attributeMode: attributeMode || "full-attribute",
      promptMode: promptMode || "realistic",
    });

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Generate API error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Failed to generate prompt. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

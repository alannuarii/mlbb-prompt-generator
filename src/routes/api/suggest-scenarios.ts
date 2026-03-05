import type { APIEvent } from "@solidjs/start/server";
import { suggestScenarios } from "../../lib/gemini-suggest";

export async function POST(event: APIEvent) {
  try {
    const body = await new Response(event.request.body).json();

    const { heroes, mode, config, modelName } = body;

    if (!heroes || !Array.isArray(heroes) || heroes.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one hero with an image is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const heroesWithImages = heroes.filter(
      (h: any) => h.base64Data && h.mimeType
    );

    if (heroesWithImages.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one hero must have a reference image" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validMode = ["realistic", "cinematic", "video"].includes(mode) ? mode : "realistic";

    const suggestions = await suggestScenarios({
      heroes: heroesWithImages.map((h: any) => ({
        heroName: h.heroName,
        base64Data: h.base64Data,
        mimeType: h.mimeType,
      })),
      mode: validMode,
      config: config || {},
      modelName: modelName || undefined,
    });

    return new Response(
      JSON.stringify({ suggestions }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Suggest scenarios error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Failed to generate scenario suggestions.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

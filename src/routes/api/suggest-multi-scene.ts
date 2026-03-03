import type { APIEvent } from "@solidjs/start/server";
import { suggestMultiSceneStory, suggestSceneNarrative, suggestCascadeScenes } from "../../lib/gemini-suggest";

export async function POST(event: APIEvent) {
  try {
    const body = await new Response(event.request.body).json();

    const { heroes, action } = body;

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

    const mappedHeroes = heroesWithImages.map((h: any) => ({
      heroName: h.heroName,
      base64Data: h.base64Data,
      mimeType: h.mimeType,
    }));

    if (action === "full-story") {
      // Generate overall story + all scene narratives
      const { sceneCount, config } = body;

      if (!sceneCount || sceneCount < 2) {
        return new Response(
          JSON.stringify({ error: "Scene count must be at least 2" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await suggestMultiSceneStory({
        heroes: mappedHeroes,
        sceneCount,
        config: config || {},
      });

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } else if (action === "single-scene") {
      // Generate/regenerate a single scene narrative
      const { overallStory, existingScenes, targetSceneNumber, config } = body;

      if (!overallStory || !overallStory.trim()) {
        return new Response(
          JSON.stringify({ error: "Overall story is required for single scene generation" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const sceneData = await suggestSceneNarrative({
        heroes: mappedHeroes,
        overallStory,
        existingScenes: existingScenes || [],
        targetSceneNumber: targetSceneNumber || 1,
        config: config || {},
      });

      return new Response(
        JSON.stringify(sceneData),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } else if (action === "cascade-from-scene") {
      // Regenerate scenes from a specific index onwards (cascade)
      const { overallStory, lockedScenes, startFromScene, totalScenes, scenesToGenerate, config } = body;

      if (!overallStory || !overallStory.trim()) {
        return new Response(
          JSON.stringify({ error: "Overall story is required for cascade generation" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const cascadeScenes = await suggestCascadeScenes({
        heroes: mappedHeroes,
        overallStory,
        lockedScenes: lockedScenes || [],
        startFromScene: startFromScene || 1,
        totalScenes: totalScenes || 2,
        scenesToGenerate: scenesToGenerate || 1,
        config: config || {},
      });

      return new Response(
        JSON.stringify({ scenes: cascadeScenes }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );

    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'full-story', 'single-scene', or 'cascade-from-scene'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    console.error("Suggest multi-scene error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Failed to generate story suggestions.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

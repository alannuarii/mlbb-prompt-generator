import type { APIEvent } from "@solidjs/start/server";
import { generateVideoPrompt, generateMultiSceneVideoPrompt } from "../../lib/gemini-video";
import { generateReActPrompt } from "../../lib/gemini-react";

export async function POST(event: APIEvent) {
  try {
    const body = await new Response(event.request.body).json();

    const { videoMode, modelName } = body;

    // === RE-ACT MODE (no hero selector — uses character mappings) ===
    if (videoMode === "re-act") {
      const { videoAnalysis, characterMappings, configOverrides } = body;

      if (!videoAnalysis || !characterMappings || characterMappings.length === 0) {
        return new Response(
          JSON.stringify({ error: "Video analysis and character mappings are required for Re-Act mode" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await generateReActPrompt({
        videoAnalysis,
        characterMappings,
        configOverrides: configOverrides || {
          aspectRatio: "16:9",
          videoStyle: "cinematic film",
          mood: "cinematic dramatic",
          soundDesign: "cinematic ambient",
        },
        modelName: modelName || undefined,
      });

      return new Response(
        JSON.stringify({ result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // === STANDARD MODES (single / multi-scene) ===
    const { heroes } = body;

    // Validate heroes
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

    const mappedHeroes = heroesWithImages.map((h: any) => ({
      heroName: h.heroName,
      base64Data: h.base64Data,
      mimeType: h.mimeType,
    }));

    let result: string;

    if (videoMode === "multi-scene") {
      // === MULTI-SCENE MODE ===
      const { scenes, overallNarrative, aspectRatio, videoStyle, mood, soundDesign } = body;

      if (!scenes || !Array.isArray(scenes) || scenes.length < 2) {
        return new Response(
          JSON.stringify({ error: "Multi-scene mode requires at least 2 scenes" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      result = await generateMultiSceneVideoPrompt({
        heroes: mappedHeroes,
        overallNarrative: overallNarrative || "",
        scenes: scenes.map((s: any) => ({
          sceneNumber: s.sceneNumber,
          narrative: s.narrative,
          duration: s.duration || "4 seconds",
          cameraMovement: s.cameraMovement || "slow push in",
          motionIntensity: s.motionIntensity || "moderate",
          transition: s.transition || "smooth crossfade",
        })),
        aspectRatio: aspectRatio || "16:9",
        videoStyle: videoStyle || "cinematic film",
        mood: mood || "cinematic dramatic",
        soundDesign: soundDesign || "cinematic ambient",
        modelName: modelName || undefined,
      });
    } else {
      // === SINGLE MODE ===
      const { narrative, aspectRatio, duration, cameraMovement, motionIntensity, videoStyle, mood, soundDesign, singleMode } = body;

      if (!narrative || !narrative.trim()) {
        return new Response(
          JSON.stringify({ error: "Video scene narrative is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      result = await generateVideoPrompt({
        narrative,
        heroes: mappedHeroes,
        aspectRatio: aspectRatio || "16:9",
        duration: duration || "8 seconds",
        cameraMovement: cameraMovement || "slow push in",
        motionIntensity: motionIntensity || "moderate",
        videoStyle: videoStyle || "cinematic film",
        mood: mood || "cinematic dramatic",
        soundDesign: soundDesign || "cinematic ambient",
        singleMode: singleMode || "frame",
        modelName: modelName || undefined,
      });
    }

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

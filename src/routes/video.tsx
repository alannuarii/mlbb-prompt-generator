import { createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import HeroSelector, { heroHasImage } from "../components/HeroSelector";
import type { SelectedHero } from "../components/HeroSelector";
import NarrativeInput from "../components/NarrativeInput";
import type { ScenarioSuggestion } from "../components/NarrativeInput";
import VideoConfigOptions from "../components/VideoConfigOptions";
import ResultDisplay from "../components/ResultDisplay";
import { selectedModel } from "../lib/model-store";
import { fileToBase64 } from "../lib/utils";
import { HEROES } from "../lib/heroes";
import type { Hero } from "../lib/heroes";
import type {
  VideoAnalysisResult,
  DetectedCharacter,
  AppearanceMode,
  CharacterMapping,
} from "../lib/gemini-react";

export interface SceneEntry {
  id: number;
  narrative: string;
  cameraMovement: string;
  motionIntensity: string;
  transition: string;
}

const DEFAULT_SCENE = (): SceneEntry => ({
  id: Date.now(),
  narrative: "",
  cameraMovement: "slow push in",
  motionIntensity: "moderate",
  transition: "smooth crossfade",
});

export default function VideoPage() {
  // Mode: single (existing) or multi-scene or re-act
  const [videoMode, setVideoMode] = createSignal<"single" | "multi-scene" | "re-act">("single");
  // Single sub-mode: frame (Image-to-Video) or ingredient (visual reference)
  const [singleMode, setSingleMode] = createSignal<"frame" | "ingredient">("frame");

  // === SHARED STATE ===
  const [selectedHeroes, setSelectedHeroes] = createSignal<SelectedHero[]>([]);
  const [aspectRatio, setAspectRatio] = createSignal("16:9");
  const [videoStyle, setVideoStyle] = createSignal("cinematic film");
  const [mood, setMood] = createSignal("cinematic dramatic");
  const [soundDesign, setSoundDesign] = createSignal("cinematic ambient");

  // === SINGLE MODE STATE ===
  const [narrative, setNarrative] = createSignal("");
  const [cameraMovement, setCameraMovement] = createSignal("slow push in");
  const [motionIntensity, setMotionIntensity] = createSignal("moderate");

  // === MULTI-SCENE STATE ===
  const [scenes, setScenes] = createSignal<SceneEntry[]>([DEFAULT_SCENE()]);
  const [overallNarrative, setOverallNarrative] = createSignal("");

  // Results
  const [result, setResult] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Suggestion state (single mode)
  const [suggestions, setSuggestions] = createSignal<ScenarioSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = createSignal(false);
  const canSuggest = () => selectedHeroes().some(heroHasImage);

  // Multi-scene suggest state
  const [storyLoading, setStoryLoading] = createSignal(false);
  const [sceneSuggestLoading, setSceneSuggestLoading] = createSignal<Set<number>>(new Set<number>()); // scene ids being suggested

  // === RE-ACT STATE ===
  const [reactVideoFile, setReactVideoFile] = createSignal<File | null>(null);
  const [reactVideoPreview, setReactVideoPreview] = createSignal("");
  const [reactVideoBase64, setReactVideoBase64] = createSignal("");
  const [reactVideoMimeType, setReactVideoMimeType] = createSignal("");
  const [reactAnalyzing, setReactAnalyzing] = createSignal(false);
  const [reactAnalysis, setReactAnalysis] = createSignal<VideoAnalysisResult | null>(null);
  const [reactAnalysisError, setReactAnalysisError] = createSignal("");
  // Character mapping: characterId → { heroName, heroImage, appearanceMode }
  const [reactMappings, setReactMappings] = createSignal<Record<string, {
    hero: Hero | null;
    heroBase64: string;
    heroMimeType: string;
    appearanceMode: AppearanceMode;
  }>>({});
  // Config auto-detected vs custom
  const [reactConfigModified, setReactConfigModified] = createSignal<Set<string>>(new Set());
  const [reactOriginalConfig, setReactOriginalConfig] = createSignal<Record<string, string>>({});

  // Validation
  const canGenerate = () => {
    if (videoMode() === "re-act") {
      // Re-Act: need analysis + at least 1 mapping with hero image
      const analysis = reactAnalysis();
      if (!analysis) return false;
      const mappings = reactMappings();
      const hasMappedHeroes = Object.values(mappings).some(m => m.hero && m.heroBase64);
      return hasMappedHeroes;
    }

    if (selectedHeroes().length === 0) return false;
    if (!selectedHeroes().some(heroHasImage)) return false;

    if (videoMode() === "single") {
      return !!narrative().trim();
    } else {
      // Multi-scene: at least 2 scenes with narrative
      const filledScenes = scenes().filter(s => s.narrative.trim());
      return filledScenes.length >= 2;
    }
  };

  // === SCENE MANAGEMENT ===
  const addScene = () => {
    if (scenes().length >= 8) return;
    setScenes([...scenes(), DEFAULT_SCENE()]);
  };

  const removeScene = (id: number) => {
    if (scenes().length <= 2) return;
    setScenes(scenes().filter(s => s.id !== id));
  };

  const updateScene = (id: number, updates: Partial<SceneEntry>) => {
    setScenes(scenes().map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // === GENERATE (SINGLE) ===
  const handleGenerateSingle = async () => {
    if (!canGenerate() || loading()) return;
    setLoading(true); setError(""); setResult("");
    try {
      const heroes = selectedHeroes().filter(heroHasImage)
        .flatMap(sh => sh.images.map(img => ({ heroName: sh.hero.name, base64Data: img.base64Data, mimeType: img.mimeType })));

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoMode: "single",
          singleMode: singleMode(),
          narrative: narrative(),
          heroes,
          aspectRatio: aspectRatio(),
          duration: "8 seconds",
          cameraMovement: cameraMovement(),
          motionIntensity: motionIntensity(),
          videoStyle: videoStyle(),
          mood: mood(),
          soundDesign: soundDesign(),
          modelName: selectedModel(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate video prompt");
      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // === GENERATE (MULTI-SCENE) ===
  const handleGenerateMultiScene = async () => {
    if (!canGenerate() || loading()) return;
    setLoading(true); setError(""); setResult("");
    try {
      const heroes = selectedHeroes().filter(heroHasImage)
        .flatMap(sh => sh.images.map(img => ({ heroName: sh.hero.name, base64Data: img.base64Data, mimeType: img.mimeType })));

      const sceneData = scenes().filter(s => s.narrative.trim()).map((s, idx) => ({
        sceneNumber: idx + 1,
        narrative: s.narrative,
        duration: "8 seconds",
        cameraMovement: s.cameraMovement,
        motionIntensity: s.motionIntensity,
        transition: s.transition,
      }));

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoMode: "multi-scene",
          heroes,
          overallNarrative: overallNarrative(),
          scenes: sceneData,
          aspectRatio: aspectRatio(),
          videoStyle: videoStyle(),
          mood: mood(),
          soundDesign: soundDesign(),
          modelName: selectedModel(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate multi-scene prompt");
      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    if (videoMode() === "re-act") handleGenerateReAct();
    else if (videoMode() === "single") handleGenerateSingle();
    else handleGenerateMultiScene();
  };

  // Suggest scenarios (single mode)
  const handleSuggest = async () => {
    if (!canSuggest() || suggestLoading()) return;
    setSuggestLoading(true); setSuggestions([]);
    try {
      const heroes = selectedHeroes().filter(heroHasImage)
        .flatMap(sh => sh.images.map(img => ({ heroName: sh.hero.name, base64Data: img.base64Data, mimeType: img.mimeType })));
      const response = await fetch("/api/suggest-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroes, mode: "video",
          config: {
            "Aspect Ratio": aspectRatio(),
            "Camera Movement": cameraMovement(), "Motion Intensity": motionIntensity(),
            "Video Style": videoStyle(), "Mood": mood(), "Sound Design": soundDesign(),
          },
          modelName: selectedModel(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSuggestions(data.suggestions || []);
    } catch (err: any) { console.error("Suggest error:", err); }
    finally { setSuggestLoading(false); }
  };

  // Helper: build hero payload
  const getHeroPayload = () =>
    selectedHeroes().filter(heroHasImage)
      .flatMap(sh => sh.images.map(img => ({ heroName: sh.hero.name, base64Data: img.base64Data, mimeType: img.mimeType })));

  const getVideoConfig = () => ({
    "Aspect Ratio": aspectRatio(),
    "Video Style": videoStyle(),
    "Mood": mood(),
    "Sound Design": soundDesign(),
  });

  // === SUGGEST FULL STORY (overall + all scenes) ===
  const handleSuggestFullStory = async () => {
    if (!canSuggest() || storyLoading()) return;
    setStoryLoading(true);
    try {
      const response = await fetch("/api/suggest-multi-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "full-story",
          heroes: getHeroPayload(),
          sceneCount: scenes().length,
          config: getVideoConfig(),
          modelName: selectedModel(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Fill overall story
      if (data.overall_story) setOverallNarrative(data.overall_story);

      // Fill all scene narratives + technical params
      if (Array.isArray(data.scenes)) {
        const currentScenes = scenes();
        const updated = currentScenes.map((s, idx) => {
          const ai = data.scenes[idx];
          if (!ai) return s;
          return {
            ...s,
            narrative: ai.narrative || s.narrative,
            cameraMovement: ai.cameraMovement || s.cameraMovement,
            motionIntensity: ai.motionIntensity || s.motionIntensity,
            transition: ai.transition || s.transition,
          };
        });
        setScenes(updated);
      }
    } catch (err: any) {
      console.error("Suggest full story error:", err);
    } finally {
      setStoryLoading(false);
    }
  };

  // === SUGGEST SCENE WITH CASCADE ===
  // When user clicks ✨ on scene N, regenerate scene N + all scenes after it
  const handleSuggestScene = async (sceneId: number, sceneIndex: number) => {
    if (!canSuggest() || sceneSuggestLoading().size > 0) return;
    if (!overallNarrative().trim()) return;

    const allScenes = scenes();
    const affectedIds = new Set(allScenes.slice(sceneIndex).map(s => s.id));
    setSceneSuggestLoading(affectedIds);

    try {
      // Locked scenes = scenes BEFORE the clicked one
      const lockedScenes = allScenes.slice(0, sceneIndex).map((s, idx) => ({
        sceneNumber: idx + 1,
        narrative: s.narrative,
      }));

      const scenesToGenerate = allScenes.length - sceneIndex;

      const response = await fetch("/api/suggest-multi-scene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cascade-from-scene",
          heroes: getHeroPayload(),
          overallStory: overallNarrative(),
          lockedScenes,
          startFromScene: sceneIndex + 1,
          totalScenes: allScenes.length,
          scenesToGenerate,
          config: getVideoConfig(),
          modelName: selectedModel(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Apply cascade results to scenes from sceneIndex onwards
      if (Array.isArray(data.scenes)) {
        const updated = allScenes.map((s, idx) => {
          if (idx < sceneIndex) return s; // locked
          const ai = data.scenes[idx - sceneIndex];
          if (!ai) return s;
          return {
            ...s,
            narrative: ai.narrative || s.narrative,
            cameraMovement: ai.cameraMovement || s.cameraMovement,
            motionIntensity: ai.motionIntensity || s.motionIntensity,
            transition: ai.transition || s.transition,
          };
        });
        setScenes(updated);
      }
    } catch (err: any) {
      console.error("Suggest cascade error:", err);
    } finally {
      setSceneSuggestLoading(new Set<number>());
    }
  };

  // === RE-ACT HANDLERS ===
  const handleReactVideoUpload = async (files: FileList) => {
    const file = files[0];
    if (!file) return;

    // Validate
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      setReactAnalysisError(`Video terlalu besar (${(file.size / 1024 / 1024).toFixed(1)}MB). Maks 20MB.`);
      return;
    }

    const mime = file.type || 'video/mp4';
    if (!['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'].includes(mime)) {
      setReactAnalysisError(`Format video tidak didukung: ${mime}. Gunakan MP4, WebM, MOV, atau MKV.`);
      return;
    }

    setReactVideoFile(file);
    setReactVideoPreview(URL.createObjectURL(file));
    setReactAnalysisError("");
    setReactAnalysis(null);
    setReactMappings({});

    // Convert to base64
    const base64 = await fileToBase64(file);
    setReactVideoBase64(base64);
    setReactVideoMimeType(mime);
  };

  const handleReactRemoveVideo = () => {
    setReactVideoFile(null);
    setReactVideoPreview("");
    setReactVideoBase64("");
    setReactVideoMimeType("");
    setReactAnalysis(null);
    setReactAnalysisError("");
    setReactMappings({});
    setReactConfigModified(new Set<string>());
    setReactOriginalConfig({});
  };

  const handleReactAnalyze = async () => {
    if (!reactVideoBase64() || reactAnalyzing()) return;
    setReactAnalyzing(true);
    setReactAnalysisError("");
    setReactAnalysis(null);
    setReactMappings({});
    try {
      const response = await fetch("/api/analyze-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoBase64: reactVideoBase64(),
          videoMimeType: reactVideoMimeType(),
          modelName: selectedModel(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to analyze video");

      const analysis: VideoAnalysisResult = data.result;
      setReactAnalysis(analysis);

      // Auto-fill config from detected values
      if (analysis.detectedConfig) {
        setAspectRatio(analysis.detectedConfig.aspectRatio || "16:9");
        setVideoStyle(analysis.detectedConfig.videoStyle || "cinematic film");
        setMood(analysis.detectedConfig.mood || "cinematic dramatic");
        setSoundDesign(analysis.detectedConfig.soundDesign || "cinematic ambient");
        setReactOriginalConfig({
          aspectRatio: analysis.detectedConfig.aspectRatio || "16:9",
          videoStyle: analysis.detectedConfig.videoStyle || "cinematic film",
          mood: analysis.detectedConfig.mood || "cinematic dramatic",
          soundDesign: analysis.detectedConfig.soundDesign || "cinematic ambient",
        });
        setReactConfigModified(new Set<string>());
      }

      // Initialize empty mappings for each character
      const mappings: Record<string, { hero: Hero | null; heroBase64: string; heroMimeType: string; appearanceMode: AppearanceMode }> = {};
      for (const char of analysis.characters) {
        mappings[char.id] = { hero: null, heroBase64: "", heroMimeType: "", appearanceMode: "full-hero" };
      }
      setReactMappings(mappings);
    } catch (err: any) {
      setReactAnalysisError(err.message || "An unexpected error occurred");
    } finally {
      setReactAnalyzing(false);
    }
  };

  const handleReactMapHero = (charId: string, hero: Hero | null) => {
    const current = { ...reactMappings() };
    current[charId] = { ...current[charId], hero, heroBase64: "", heroMimeType: "" };
    setReactMappings(current);
  };

  const handleReactHeroImageUpload = async (charId: string, files: FileList) => {
    const file = files[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const mime = file.type || 'image/png';
    const current = { ...reactMappings() };
    current[charId] = { ...current[charId], heroBase64: base64, heroMimeType: mime };
    setReactMappings(current);
  };

  const handleReactAppearanceMode = (charId: string, mode: AppearanceMode) => {
    const current = { ...reactMappings() };
    current[charId] = { ...current[charId], appearanceMode: mode };
    setReactMappings(current);
  };

  const handleReactResetConfig = () => {
    const orig = reactOriginalConfig();
    if (orig.aspectRatio) setAspectRatio(orig.aspectRatio);
    if (orig.videoStyle) setVideoStyle(orig.videoStyle);
    if (orig.mood) setMood(orig.mood);
    if (orig.soundDesign) setSoundDesign(orig.soundDesign);
    setReactConfigModified(new Set<string>());
  };

  const handleGenerateReAct = async () => {
    if (!canGenerate() || loading()) return;
    setLoading(true); setError(""); setResult("");
    try {
      const analysis = reactAnalysis()!;
      const mappings = reactMappings();

      const characterMappings: CharacterMapping[] = [];
      for (const char of analysis.characters) {
        const m = mappings[char.id];
        if (m && m.hero && m.heroBase64) {
          characterMappings.push({
            characterId: char.id,
            characterLabel: char.label,
            heroName: m.hero.name,
            heroBase64Data: m.heroBase64,
            heroMimeType: m.heroMimeType,
            appearanceMode: m.appearanceMode,
          });
        }
      }

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoMode: "re-act",
          videoAnalysis: analysis,
          characterMappings,
          configOverrides: {
            aspectRatio: aspectRatio(),
            videoStyle: videoStyle(),
            mood: mood(),
            soundDesign: soundDesign(),
          },
          modelName: selectedModel(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate Re-Act prompt");
      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Dynamic text
  const headerTitle = () => {
    if (videoMode() === "re-act") return "🎬 Re-Act Video Prompt";
    return videoMode() === "single" ? "🎬 Video Scene Prompt" : "🎬 Multi-Scene Video Prompt";
  };

  const headerDesc = () => {
    if (videoMode() === "re-act")
      return "Upload video referensi → AI analisis adegan → Ganti pemeran dengan hero MLBB → Generate prompt video.";
    return videoMode() === "single"
      ? "Ubah gambar realistic yang sudah di-generate menjadi video sinematik. Upload hasil generate, deskripsikan gerakan, dan dapatkan prompt video."
      : "Buat prompt video multi-scene — setiap scene memiliki narasi, durasi, dan kamera sendiri. Cocok untuk video dengan alur cerita berurutan.";
  };

  const generateLabel = () => {
    if (videoMode() === "re-act") return "🎬 Generate Re-Act Prompt";
    return videoMode() === "single" ? "🎥 Generate Video Scene Prompt" : "🎬 Generate Multi-Scene Prompt";
  };

  // Camera movement options for inline scene editor
  const CAMERA_OPTS = [
    { value: "static with subtle drift", label: "Static" },
    { value: "slow push in", label: "Push In" },
    { value: "slow pull out", label: "Pull Out" },
    { value: "slow pan left to right", label: "Pan L→R" },
    { value: "slow pan right to left", label: "Pan R→L" },
    { value: "orbit around subject", label: "Orbit" },
    { value: "crane shot upward", label: "Crane Up" },
    { value: "dolly tracking shot", label: "Dolly" },
    { value: "zoom into face", label: "Zoom Face" },
    { value: "parallax depth effect", label: "Parallax" },
  ];


  const INTENSITY_OPTS = [
    { value: "subtle", label: "🌿" },
    { value: "moderate", label: "🌊" },
    { value: "dynamic", label: "⚡" },
    { value: "intense", label: "🔥" },
  ];

  const TRANSITION_OPTS = [
    { value: "smooth crossfade", label: "Crossfade" },
    { value: "hard cut", label: "Hard Cut" },
    { value: "whip pan", label: "Whip Pan" },
    { value: "fade to black", label: "Fade Black" },
    { value: "match cut", label: "Match Cut" },
    { value: "zoom transition", label: "Zoom" },
  ];

  return (
    <div class="app-container">
      {/* Header */}
      <header class="app-header fade-in">
        <h1>{headerTitle()}</h1>
        <p>{headerDesc()}</p>

        {/* Mode Tabs */}
        <div class="mode-tabs mode-tabs-3">
          <button
            class={`mode-tab ${videoMode() === "single" ? "active" : ""}`}
            onClick={() => setVideoMode("single")}
          >
            <span class="tab-icon">🎥</span>
            Single Video
            <span class="tab-desc">Satu Scene</span>
          </button>
          <button
            class={`mode-tab ${videoMode() === "multi-scene" ? "active" : ""}`}
            onClick={() => {
              setVideoMode("multi-scene");
              if (scenes().length < 2) setScenes([DEFAULT_SCENE(), DEFAULT_SCENE()]);
            }}
          >
            <span class="tab-icon">🎞️</span>
            Multi-Scene
            <span class="tab-desc">Extend</span>
          </button>
          <button
            class={`mode-tab react-tab ${videoMode() === "re-act" ? "active" : ""}`}
            onClick={() => setVideoMode("re-act")}
          >
            <span class="tab-icon">🔄</span>
            Re-Act
            <span class="tab-desc">Ganti Pemeran</span>
          </button>
        </div>

        {/* Sub-mode toggle for Single Video */}
        <Show when={videoMode() === "single"}>
          <div class="sub-mode-tabs">
            <button
              class={`sub-mode-tab ${singleMode() === "frame" ? "active" : ""}`}
              onClick={() => setSingleMode("frame")}
            >
              <span class="sub-tab-icon">🖼️</span>
              Frame
              <span class="sub-tab-hint">Hidupkan gambar</span>
            </button>
            <button
              class={`sub-mode-tab ${singleMode() === "ingredient" ? "active" : ""}`}
              onClick={() => setSingleMode("ingredient")}
            >
              <span class="sub-tab-icon">🧩</span>
              Ingredient
              <span class="sub-tab-hint">Referensi visual</span>
            </button>
          </div>
        </Show>

        <A href="/docs/video" class="docs-link-btn video">
          📖 Dokumentasi Konfigurasi Video
        </A>
      </header>

      {/* Info Banner */}
      <div class="video-info-banner glass-panel fade-in fade-in-delay-1">
        <span class="info-icon">💡</span>
        <div>
          <Show when={videoMode() === "single" && singleMode() === "frame"}>
            <strong>🖼️ Frame Mode:</strong> Upload gambar hasil generate → AI membuat prompt untuk menghidupkan gambar tersebut menjadi video. Gambar adalah frame pertama video.
          </Show>
          <Show when={videoMode() === "single" && singleMode() === "ingredient"}>
            <strong>🧩 Ingredient Mode:</strong> Upload gambar hero sebagai referensi visual → AI membuat prompt video dari nol dengan karakter yang sama. Komposisi, pose, dan sudut kamera bebas ditentukan.
          </Show>
          <Show when={videoMode() === "multi-scene"}>
            <strong>Multi-Scene (Extend Mode):</strong> Upload gambar hasil generate sebagai referensi → Scene 1 dibuat dari gambar tersebut (Image-to-Video) → Scene 2 dst. menggunakan Extend dari scene sebelumnya. Prompt setiap scene dirancang untuk menjaga kontinuitas visual.
          </Show>
          <Show when={videoMode() === "re-act"}>
            <strong>🔄 Re-Act Mode:</strong> Upload video referensi → AI analisis adegan & karakter → Pilih hero MLBB untuk menggantikan setiap pemeran → Pilih <em>Appearance Mode</em> (Full Hero / Adapt Outfit / Face Only) → Generate prompt video yang me-recreate adegan dengan hero MLBB.
          </Show>
        </div>
      </div>

      {/* Main Grid */}
      <div class="main-grid">
        {/* Left Column: Hero Selection + Config (or Re-Act video upload) */}
        <div class="left-col">
          {/* === RE-ACT LEFT COLUMN === */}
          <Show when={videoMode() === "re-act"}>
            {/* Video Upload */}
            <div class="fade-in fade-in-delay-1">
              <div class="react-upload-section glass-panel">
                <div class="section-title">
                  <span class="icon">📹</span>
                  Upload Video Referensi
                </div>

                <Show when={!reactVideoPreview()}>
                  <label class="react-dropzone">
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                      style={{ display: "none" }}
                      onChange={(e) => e.currentTarget.files && handleReactVideoUpload(e.currentTarget.files)}
                    />
                    <div class="react-dropzone-content">
                      <span class="react-dropzone-icon">📹</span>
                      <span class="react-dropzone-text">Klik atau drag video ke sini</span>
                      <span class="react-dropzone-hint">MP4, WebM, MOV · Max 20MB · Max 30 detik</span>
                    </div>
                  </label>
                </Show>

                <Show when={reactVideoPreview()}>
                  <div class="react-video-preview">
                    <video
                      src={reactVideoPreview()}
                      controls
                      class="react-video-player"
                    />
                    <div class="react-video-actions">
                      <span class="react-video-filename">{reactVideoFile()?.name}</span>
                      <button class="react-video-remove" onClick={handleReactRemoveVideo}>✕ Hapus</button>
                    </div>
                  </div>

                  <Show when={!reactAnalysis() && !reactAnalyzing()}>
                    <button
                      class="react-analyze-btn"
                      onClick={handleReactAnalyze}
                      disabled={reactAnalyzing()}
                    >
                      🤖 Analisis Video dengan AI
                    </button>
                  </Show>

                  <Show when={reactAnalyzing()}>
                    <div class="react-analyzing">
                      <span class="suggest-spinner" />
                      <span>Menganalisis video... Ini bisa memakan waktu beberapa detik.</span>
                    </div>
                  </Show>
                </Show>

                <Show when={reactAnalysisError()}>
                  <div class="react-error">
                    <span>⚠️</span> {reactAnalysisError()}
                  </div>
                </Show>
              </div>
            </div>

            {/* Analysis Result + Character Mapping */}
            <Show when={reactAnalysis()}>
              <div class="fade-in fade-in-delay-2">
                <div class="react-analysis-section glass-panel">
                  <div class="section-title">
                    <span class="icon">🤖</span>
                    Hasil Analisis
                    <span class="badge" style={{ background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399" }}>
                      {reactAnalysis()!.characters.length} karakter · {reactAnalysis()!.scenes.length} scene
                    </span>
                  </div>

                  <div class="react-summary">
                    <p>{reactAnalysis()!.summary}</p>
                  </div>

                  {/* Character Mapping Cards */}
                  <div class="react-mapping-title">
                    <span>🦸</span> Mapping Karakter → Hero MLBB
                  </div>

                  <div class="react-mapping-cards">
                    <For each={reactAnalysis()!.characters}>
                      {(char) => {
                        const mapping = () => reactMappings()[char.id];
                        return (
                          <div class="react-mapping-card">
                            <div class="react-char-info">
                              <div class="react-char-label">{char.label}</div>
                              <div class="react-char-desc">{char.description}</div>
                              <div class="react-char-role">{char.role}</div>
                            </div>

                            <div class="react-char-arrow">→</div>

                            <div class="react-hero-select">
                              {/* Hero dropdown */}
                              <select
                                class="config-select"
                                value={mapping()?.hero?.id || ""}
                                onChange={(e) => {
                                  const heroId = e.currentTarget.value;
                                  const hero = heroId ? HEROES.find(h => h.id === heroId) || null : null;
                                  handleReactMapHero(char.id, hero);
                                }}
                              >
                                <option value="">— Pilih Hero —</option>
                                <For each={HEROES}>
                                  {(h) => <option value={h.id}>{h.name}</option>}
                                </For>
                              </select>

                              {/* Hero image upload */}
                              <Show when={mapping()?.hero}>
                                <div class="react-hero-image-row">
                                  <Show when={mapping()?.heroBase64}>
                                    <div class="react-hero-thumb">
                                      <img src={`data:${mapping()!.heroMimeType};base64,${mapping()!.heroBase64}`} alt={mapping()!.hero!.name} />
                                      <span class="react-hero-check">✓</span>
                                    </div>
                                  </Show>
                                  <label class="react-hero-upload-btn">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: "none" }}
                                      onChange={(e) => e.currentTarget.files && handleReactHeroImageUpload(char.id, e.currentTarget.files)}
                                    />
                                    📷 {mapping()?.heroBase64 ? "Ganti" : "Upload"} Gambar
                                  </label>
                                </div>

                                {/* Appearance Mode Toggle */}
                                <div class="react-appearance-mode">
                                  <label class="react-appearance-label">Appearance:</label>
                                  <div class="react-appearance-toggle">
                                    <button
                                      class={`react-appearance-btn ${mapping()?.appearanceMode === "full-hero" ? "active full" : ""}`}
                                      onClick={() => handleReactAppearanceMode(char.id, "full-hero")}
                                      title="Full original MLBB appearance — armor, weapons, effects"
                                    >
                                      🎮 Full Hero
                                    </button>
                                    <button
                                      class={`react-appearance-btn ${mapping()?.appearanceMode === "adapt-outfit" ? "active adapt" : ""}`}
                                      onClick={() => handleReactAppearanceMode(char.id, "adapt-outfit")}
                                      title="Hero's face + outfit from video character"
                                    >
                                      👔 Adapt
                                    </button>
                                    <button
                                      class={`react-appearance-btn ${mapping()?.appearanceMode === "face-only" ? "active face" : ""}`}
                                      onClick={() => handleReactAppearanceMode(char.id, "face-only")}
                                      title="Only face — everything else from video character"
                                    >
                                      🎭 Face Only
                                    </button>
                                  </div>
                                </div>
                              </Show>
                            </div>
                          </div>
                        );
                      }}
                    </For>
                  </div>
                </div>
              </div>

              {/* Config — Auto-detected with override */}
              <div class="fade-in fade-in-delay-3">
                <div class="config-section glass-panel" style={{ padding: "var(--space-lg)" }}>
                  <div class="section-title">
                    <span class="icon">⚙️</span>
                    Configuration
                    <span class="react-config-badge">🔄 Auto-detected</span>
                    <Show when={reactConfigModified().size > 0}>
                      <button class="react-reset-btn" onClick={handleReactResetConfig}>↩ Reset</button>
                    </Show>
                  </div>
                  <VideoConfigOptions
                    videoMode={"multi-scene" as any}
                    aspectRatio={aspectRatio()}
                    cameraMovement={cameraMovement()}
                    motionIntensity={motionIntensity()}
                    videoStyle={videoStyle()}
                    mood={mood()}
                    soundDesign={soundDesign()}
                    onAspectRatioChange={(v) => { setAspectRatio(v); setReactConfigModified(prev => new Set([...prev, "aspectRatio"])); }}
                    onCameraMovementChange={setCameraMovement}
                    onMotionIntensityChange={setMotionIntensity}
                    onVideoStyleChange={(v) => { setVideoStyle(v); setReactConfigModified(prev => new Set([...prev, "videoStyle"])); }}
                    onMoodChange={(v) => { setMood(v); setReactConfigModified(prev => new Set([...prev, "mood"])); }}
                    onSoundDesignChange={(v) => { setSoundDesign(v); setReactConfigModified(prev => new Set([...prev, "soundDesign"])); }}
                  />
                </div>
              </div>

              {/* Scene Preview */}
              <div class="fade-in fade-in-delay-3">
                <div class="react-scenes-preview glass-panel">
                  <div class="section-title">
                    <span class="icon">🎞️</span>
                    Scene Breakdown
                    <span class="badge" style={{ background: "rgba(52, 211, 153, 0.15)", border: "1px solid rgba(52, 211, 153, 0.3)", color: "#34d399" }}>
                      {reactAnalysis()!.scenes.length} scenes
                    </span>
                  </div>
                  <div class="react-scenes-list">
                    <For each={reactAnalysis()!.scenes}>
                      {(scene) => (
                        <div class="react-scene-item">
                          <div class="react-scene-header">
                            <span class="scene-number">Scene {scene.sceneNumber}</span>
                            <span class="react-scene-time">{scene.timestamp}</span>
                          </div>
                          <p class="react-scene-narrative">{scene.narrative}</p>
                          <div class="react-scene-tags">
                            <span class="react-scene-tag">🎥 {scene.cameraMovement}</span>
                            <span class="react-scene-tag">💨 {scene.motionIntensity}</span>
                            <span class="react-scene-tag">🎭 {scene.mood}</span>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </div>
            </Show>
          </Show>

          {/* === STANDARD LEFT COLUMN (Single / Multi-Scene) === */}
          <Show when={videoMode() !== "re-act"}>
            <div class="fade-in fade-in-delay-1">
              <HeroSelector
                selectedHeroes={selectedHeroes()}
                onSelectionChange={setSelectedHeroes}
              />
              <Show when={videoMode() === "single" && singleMode() === "frame"}>
                <div class="scene-mode-hint" style={{ "margin-top": "8px" }}>
                  <span class="scene-hint-icon">🖼️</span>
                  <span>Upload <strong>gambar hasil generate</strong>. Gambar ini akan menjadi frame pertama video di Google Flow.</span>
                </div>
              </Show>
              <Show when={videoMode() === "single" && singleMode() === "ingredient"}>
                <div class="scene-mode-hint" style={{ "margin-top": "8px" }}>
                  <span class="scene-hint-icon">🧩</span>
                  <span>Upload gambar hero sebagai <strong>referensi visual</strong>. Video akan dibuat dari nol — pose dan sudut kamera bebas.</span>
                </div>
              </Show>
              <Show when={videoMode() === "multi-scene"}>
                <div class="scene-mode-hint" style={{ "margin-top": "8px" }}>
                  <span class="scene-hint-icon">🖼️</span>
                  <span>Upload <strong>gambar hasil generate</strong> (bukan gambar hero basic). Gambar ini akan menjadi frame awal Scene 1 di Google Flow.</span>
                </div>
              </Show>
            </div>

            <div class="fade-in fade-in-delay-2">
              <VideoConfigOptions
                videoMode={videoMode() as "single" | "multi-scene"}
                singleMode={singleMode()}
                aspectRatio={aspectRatio()}
                cameraMovement={cameraMovement()}
                motionIntensity={motionIntensity()}
                videoStyle={videoStyle()}
                mood={mood()}
                soundDesign={soundDesign()}
                onAspectRatioChange={setAspectRatio}
                onCameraMovementChange={setCameraMovement}
                onMotionIntensityChange={setMotionIntensity}
                onVideoStyleChange={setVideoStyle}
                onMoodChange={setMood}
                onSoundDesignChange={setSoundDesign}
              />
            </div>
          </Show>
        </div>

        {/* Right Column */}
        <div class="right-col">
          {/* === SINGLE MODE === */}
          <Show when={videoMode() === "single"}>
            <div class="fade-in fade-in-delay-2">
              <NarrativeInput
                value={narrative()}
                onChange={setNarrative}
                promptMode="video"
                onRequestSuggestions={handleSuggest}
                suggestions={suggestions()}
                suggestionsLoading={suggestLoading()}
                canSuggest={canSuggest()}
              />
            </div>
          </Show>

          {/* === MULTI-SCENE MODE === */}
          <Show when={videoMode() === "multi-scene"}>
            {/* Overall narrative + Full Story Suggest */}
            <div class="fade-in fade-in-delay-2">
              <div class="narrative-section glass-panel">
                <div class="section-title">
                  <span class="icon">📝</span>
                  Overall Story / Ringkasan Cerita
                </div>
                <textarea
                  class="narrative-textarea"
                  placeholder="Deskripsikan alur cerita keseluruhan... contoh: 'Video ini menceritakan perjalanan Layla dari kegelapan menuju cahaya, dimulai dari kesedihan dan berakhir dengan harapan baru'"
                  value={overallNarrative()}
                  onInput={(e) => setOverallNarrative(e.currentTarget.value)}
                  rows={3}
                />
                <div class="narrative-footer">
                  <div class="char-count">{overallNarrative().length} characters</div>
                  <button
                    class={`suggest-btn ${storyLoading() ? "loading" : ""}`}
                    onClick={handleSuggestFullStory}
                    disabled={!canSuggest() || storyLoading()}
                    title="Generate cerita keseluruhan + narasi semua scene secara konsisten"
                  >
                    <Show when={!storyLoading()} fallback={<><span class="suggest-spinner" /> Generating...</>}>
                      ✨ Rekomendasi Full Story
                    </Show>
                  </button>
                </div>
                <Show when={canSuggest()}>
                  <div class="scene-mode-hint" style={{ "margin-top": "12px", "margin-bottom": "0" }}>
                    <span class="scene-hint-icon">💡</span>
                    <span>Klik "Rekomendasi Full Story" untuk generate overall story + narasi semua scene ({scenes().length} scene) dalam satu panggilan AI — menjamin konsistensi alur cerita.</span>
                  </div>
                </Show>
              </div>
            </div>

            {/* Scene Cards */}
            <div class="fade-in fade-in-delay-3">
              <div class="scene-editor-section glass-panel">
                <div class="section-title">
                  <span class="icon">🎞️</span>
                  Scenes
                  <span class="badge">{scenes().length} scene{scenes().length > 1 ? "s" : ""}</span>
                </div>

                <div class="scene-cards">
                  <For each={scenes()}>
                    {(scene, idx) => (
                      <div class="scene-card">
                        <div class="scene-card-header">
                          <span class="scene-number">Scene {idx() + 1}</span>
                          <div class="scene-card-actions">
                            {/* Per-scene suggest button */}
                            <button
                              class={`scene-suggest-btn ${sceneSuggestLoading().has(scene.id) ? "loading" : ""}`}
                              onClick={() => handleSuggestScene(scene.id, idx())}
                              disabled={!canSuggest() || sceneSuggestLoading().size > 0 || !overallNarrative().trim()}
                              title={overallNarrative().trim() ? `Generate narasi scene ${idx() + 1} berdasarkan overall story` : "Isi overall story dulu atau gunakan Rekomendasi Full Story"}
                            >
                              <Show when={!sceneSuggestLoading().has(scene.id)} fallback={<><span class="suggest-spinner" style={{ width: "10px", height: "10px" }} /></>}>
                                ✨
                              </Show>
                            </button>
                            <Show when={scenes().length > 2}>
                              <button class="scene-remove-btn" onClick={() => removeScene(scene.id)} title="Hapus scene">×</button>
                            </Show>
                          </div>
                        </div>

                        {/* Scene Narrative */}
                        <textarea
                          class={`scene-narrative ${sceneSuggestLoading().has(scene.id) ? "suggesting" : ""}`}
                          placeholder={`Deskripsikan apa yang terjadi di scene ${idx() + 1}...`}
                          value={scene.narrative}
                          onInput={(e) => updateScene(scene.id, { narrative: e.currentTarget.value })}
                          rows={3}
                          disabled={sceneSuggestLoading().has(scene.id)}
                        />

                        {/* Scene Config Row */}
                        <div class="scene-config-row">
                          <div class="scene-config-item">
                            <label>🎥 Kamera</label>
                            <select
                              class="scene-select"
                              value={scene.cameraMovement}
                              onChange={(e) => updateScene(scene.id, { cameraMovement: e.currentTarget.value })}
                            >
                              <For each={CAMERA_OPTS}>
                                {(c) => <option value={c.value}>{c.label}</option>}
                              </For>
                            </select>
                          </div>

                          <div class="scene-config-item">
                            <label>💨 Intensitas</label>
                            <div class="scene-mini-toggle">
                              <For each={INTENSITY_OPTS}>
                                {(i) => (
                                  <button
                                    class={`scene-mini-btn ${scene.motionIntensity === i.value ? "active" : ""}`}
                                    onClick={() => updateScene(scene.id, { motionIntensity: i.value })}
                                    title={i.value}
                                  >{i.label}</button>
                                )}
                              </For>
                            </div>
                          </div>

                          <Show when={idx() < scenes().length - 1}>
                            <div class="scene-config-item">
                              <label>🔗 Transisi</label>
                              <select
                                class="scene-select"
                                value={scene.transition}
                                onChange={(e) => updateScene(scene.id, { transition: e.currentTarget.value })}
                              >
                                <For each={TRANSITION_OPTS}>
                                  {(t) => <option value={t.value}>{t.label}</option>}
                                </For>
                              </select>
                            </div>
                          </Show>
                        </div>
                      </div>
                    )}
                  </For>
                </div>

                {/* Add Scene Button */}
                <Show when={scenes().length < 8}>
                  <button class="add-scene-btn" onClick={addScene}>
                    <span>+</span> Tambah Scene
                  </button>
                </Show>
              </div>
            </div>
          </Show>

          {/* Generate Button */}
          <div class="fade-in fade-in-delay-3">
            <div class="generate-section glass-panel" style={{ padding: "24px" }}>
              <button
                class={`generate-btn video-btn ${videoMode() === "re-act" ? "react-btn" : ""} ${loading() ? "loading" : ""}`}
                onClick={handleGenerate}
                disabled={!canGenerate() || loading()}
              >
                <Show when={!loading()} fallback={`⏳ Generating ${videoMode() === "re-act" ? "Re-Act" : videoMode() === "single" ? "Video" : "Multi-Scene"} Prompt...`}>
                  {generateLabel()}
                </Show>
              </button>

              {/* Validation hints */}
              <Show when={!canGenerate() && !loading()}>
                <div style={{
                  "margin-top": "12px",
                  "font-size": "0.78rem",
                  color: "var(--text-muted)",
                  "text-align": "center",
                }}>
                  <Show when={videoMode() === "re-act"}>
                    <Show when={!reactAnalysis()}>
                      Upload dan analisis video referensi terlebih dahulu
                    </Show>
                    <Show when={reactAnalysis() && !Object.values(reactMappings()).some(m => m.hero && m.heroBase64)}>
                       Pilih hero dan upload gambar untuk minimal 1 karakter
                    </Show>
                  </Show>
                  <Show when={videoMode() !== "re-act"}>
                    <Show when={selectedHeroes().length === 0}>
                      Select at least one hero ·{" "}
                    </Show>
                    <Show when={selectedHeroes().length > 0 && !selectedHeroes().some(heroHasImage)}>
                      Upload the generated image ·{" "}
                    </Show>
                    <Show when={videoMode() === "single" && !narrative().trim()}>
                      Describe the video scene
                    </Show>
                    <Show when={videoMode() === "multi-scene" && scenes().filter(s => s.narrative.trim()).length < 2}>
                      Isi narasi minimal 2 scene
                    </Show>
                  </Show>
                </div>
              </Show>
            </div>
          </div>

          <div class="fade-in fade-in-delay-4">
            <ResultDisplay
              result={result()}
              loading={loading()}
              error={error()}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        "text-align": "center",
        padding: "48px 0 24px",
        color: "var(--text-muted)",
        "font-size": "0.75rem",
      }}>
        MLBB Prompt Generator · {videoMode() === "re-act" ? "Re-Act Video" : videoMode() === "single" ? "Video Scene" : "Multi-Scene Video"} · Powered by Gemini AI
      </footer>
    </div>
  );
}

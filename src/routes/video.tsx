import { createSignal, For, Show } from "solid-js";
import { A } from "@solidjs/router";
import HeroSelector, { heroHasImage } from "../components/HeroSelector";
import type { SelectedHero } from "../components/HeroSelector";
import NarrativeInput from "../components/NarrativeInput";
import type { ScenarioSuggestion } from "../components/NarrativeInput";
import VideoConfigOptions from "../components/VideoConfigOptions";
import ResultDisplay from "../components/ResultDisplay";
import { selectedModel } from "../lib/model-store";

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
  // Mode: single (existing) or multi-scene
  const [videoMode, setVideoMode] = createSignal<"single" | "multi-scene">("single");
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

  // Validation
  const canGenerate = () => {
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
    if (videoMode() === "single") handleGenerateSingle();
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

  // Dynamic text
  const headerTitle = () =>
    videoMode() === "single" ? "🎬 Video Scene Prompt" : "🎬 Multi-Scene Video Prompt";

  const headerDesc = () =>
    videoMode() === "single"
      ? "Ubah gambar realistic yang sudah di-generate menjadi video sinematik. Upload hasil generate, deskripsikan gerakan, dan dapatkan prompt video."
      : "Buat prompt video multi-scene — setiap scene memiliki narasi, durasi, dan kamera sendiri. Cocok untuk video dengan alur cerita berurutan.";

  const generateLabel = () =>
    videoMode() === "single" ? "🎥 Generate Video Scene Prompt" : "🎬 Generate Multi-Scene Prompt";

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
        <div class="mode-tabs">
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
        </div>
      </div>

      {/* Main Grid */}
      <div class="main-grid">
        {/* Left Column: Hero Selection + Config */}
        <div class="left-col">
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
              videoMode={videoMode()}
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
                class={`generate-btn video-btn ${loading() ? "loading" : ""}`}
                onClick={handleGenerate}
                disabled={!canGenerate() || loading()}
              >
                <Show when={!loading()} fallback={`⏳ Generating ${videoMode() === "single" ? "Video" : "Multi-Scene"} Prompt...`}>
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
        MLBB Prompt Generator · {videoMode() === "single" ? "Video Scene" : "Multi-Scene Video"} · Powered by Gemini AI
      </footer>
    </div>
  );
}

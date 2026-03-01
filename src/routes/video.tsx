import { createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import HeroSelector, { heroHasImage } from "../components/HeroSelector";
import type { SelectedHero } from "../components/HeroSelector";
import NarrativeInput from "../components/NarrativeInput";
import type { ScenarioSuggestion } from "../components/NarrativeInput";
import VideoConfigOptions from "../components/VideoConfigOptions";
import ResultDisplay from "../components/ResultDisplay";

export default function VideoPage() {
  // State
  const [selectedHeroes, setSelectedHeroes] = createSignal<SelectedHero[]>([]);
  const [narrative, setNarrative] = createSignal("");
  const [aspectRatio, setAspectRatio] = createSignal("16:9");
  const [duration, setDuration] = createSignal("8 seconds");
  const [cameraMovement, setCameraMovement] = createSignal("slow push in");
  const [motionIntensity, setMotionIntensity] = createSignal("moderate");
  const [videoStyle, setVideoStyle] = createSignal("cinematic film");
  const [mood, setMood] = createSignal("cinematic dramatic");
  const [soundDesign, setSoundDesign] = createSignal("cinematic ambient");

  const [result, setResult] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Suggestion state
  const [suggestions, setSuggestions] = createSignal<ScenarioSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = createSignal(false);
  const canSuggest = () => selectedHeroes().some(heroHasImage);

  // Validation
  const canGenerate = () => {
    if (!narrative().trim()) return false;
    if (selectedHeroes().length === 0) return false;
    return selectedHeroes().some(heroHasImage);
  };

  // Generate video prompt
  const handleGenerate = async () => {
    if (!canGenerate() || loading()) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const heroes = selectedHeroes()
        .filter(heroHasImage)
        .flatMap(sh =>
          sh.images.map(img => ({
            heroName: sh.hero.name,
            base64Data: img.base64Data,
            mimeType: img.mimeType,
          }))
        );

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative: narrative(),
          heroes,
          aspectRatio: aspectRatio(),
          duration: duration(),
          cameraMovement: cameraMovement(),
          motionIntensity: motionIntensity(),
          videoStyle: videoStyle(),
          mood: mood(),
          soundDesign: soundDesign(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate video prompt");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Suggest scenarios
  const handleSuggest = async () => {
    if (!canSuggest() || suggestLoading()) return;

    setSuggestLoading(true);
    setSuggestions([]);

    try {
      const heroes = selectedHeroes()
        .filter(heroHasImage)
        .flatMap(sh =>
          sh.images.map(img => ({
            heroName: sh.hero.name,
            base64Data: img.base64Data,
            mimeType: img.mimeType,
          }))
        );

      const response = await fetch("/api/suggest-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroes,
          mode: "video",
          config: {
            "Aspect Ratio": aspectRatio(),
            "Duration": duration(),
            "Camera Movement": cameraMovement(),
            "Motion Intensity": motionIntensity(),
            "Video Style": videoStyle(),
            "Mood": mood(),
            "Sound Design": soundDesign(),
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuggestions(data.suggestions || []);
    } catch (err: any) {
      console.error("Suggest error:", err);
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div class="app-container">
      {/* Header */}
      <header class="app-header fade-in">
        <h1>🎬 Video Scene Prompt</h1>
        <p>
          Ubah gambar realistic yang sudah di-generate menjadi video sinematik.
          {" "}Upload hasil generate, deskripsikan gerakan, dan dapatkan prompt video.
        </p>
        <A href="/docs/video" class="docs-link-btn video">
          📖 Dokumentasi Konfigurasi Video
        </A>
      </header>

      {/* Info Banner */}
      <div class="video-info-banner glass-panel fade-in fade-in-delay-1">
        <span class="info-icon">💡</span>
        <div>
          <strong>Alur Kerja:</strong> Generate gambar di halaman utama → Upload ke Google Flow → Hasil gambar di-upload di sini → Dapatkan prompt video → Upload gambar + prompt ke Google Flow untuk generate video.
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
          </div>

          <div class="fade-in fade-in-delay-2">
            <VideoConfigOptions
              aspectRatio={aspectRatio()}
              duration={duration()}
              cameraMovement={cameraMovement()}
              motionIntensity={motionIntensity()}
              videoStyle={videoStyle()}
              mood={mood()}
              soundDesign={soundDesign()}
              onAspectRatioChange={setAspectRatio}
              onDurationChange={setDuration}
              onCameraMovementChange={setCameraMovement}
              onMotionIntensityChange={setMotionIntensity}
              onVideoStyleChange={setVideoStyle}
              onMoodChange={setMood}
              onSoundDesignChange={setSoundDesign}
            />
          </div>
        </div>

        {/* Right Column: Narrative + Generate + Result */}
        <div class="right-col">
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

          {/* Generate Button */}
          <div class="fade-in fade-in-delay-3">
            <div class="generate-section glass-panel" style={{ padding: "24px" }}>
              <button
                class={`generate-btn video-btn ${loading() ? "loading" : ""}`}
                onClick={handleGenerate}
                disabled={!canGenerate() || loading()}
              >
                <Show when={!loading()} fallback="⏳ Generating Video Prompt...">
                  🎥 Generate Video Scene Prompt
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
                  <Show when={!narrative().trim()}>
                    Describe the video scene
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
        MLBB Realistic Prompt · Video Scene Generator · Powered by Gemini AI
      </footer>
    </div>
  );
}

import { createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import HeroSelector from "../components/HeroSelector";
import type { SelectedHero } from "../components/HeroSelector";
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

  // Validation
  const canGenerate = () => {
    if (!narrative().trim()) return false;
    if (selectedHeroes().length === 0) return false;
    return selectedHeroes().some(sh => sh.base64Data);
  };

  // Generate video prompt
  const handleGenerate = async () => {
    if (!canGenerate() || loading()) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      const heroes = selectedHeroes()
        .filter(sh => sh.base64Data)
        .map(sh => ({
          heroName: sh.hero.name,
          base64Data: sh.base64Data,
          mimeType: sh.mimeType || "image/webp",
        }));

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

  const [focused, setFocused] = createSignal(false);

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
            <div class="narrative-section glass-panel">
              <div class="section-title">
                <span class="icon">📝</span>
                Video Scene Narrative
              </div>
              <textarea
                class="narrative-textarea"
                placeholder="Deskripsikan bagaimana gambar ini harus bergerak... contoh: 'Kamera slowly push in ke wajah hero, rambut tertiup angin pelan, mata berkedip sekali, partikel cahaya mengambang di udara, bayangan bergerak seiring matahari terbenam' atau 'Hero berjalan maju perlahan, jubah berkibar, kamera orbit 180 derajat memperlihatkan lingkungan sekitar'"
                value={narrative()}
                onInput={(e) => setNarrative(e.currentTarget.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                rows={6}
              />
              <div class="char-count">
                {narrative().length} characters
              </div>
            </div>
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
                  <Show when={selectedHeroes().length > 0 && !selectedHeroes().some(sh => sh.base64Data)}>
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

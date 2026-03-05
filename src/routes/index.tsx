import { createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import HeroSelector, { heroHasImage } from "../components/HeroSelector";
import type { SelectedHero } from "../components/HeroSelector";
import NarrativeInput from "../components/NarrativeInput";
import type { ScenarioSuggestion } from "../components/NarrativeInput";
import ConfigOptions from "../components/ConfigOptions";
import type { SceneImageData } from "../components/ConfigOptions";
import ResultDisplay from "../components/ResultDisplay";
import { selectedModel } from "../lib/model-store";

export default function Home() {
  // Prompt mode: realistic (animation → real human) or cinematic (hyper-realistic game style)
  const [promptMode, setPromptMode] = createSignal<"realistic" | "cinematic">("realistic");

  // Shared state
  const [selectedHeroes, setSelectedHeroes] = createSignal<SelectedHero[]>([]);
  const [narrative, setNarrative] = createSignal("");
  const [aspectRatio, setAspectRatio] = createSignal("9:16");
  const [quality, setQuality] = createSignal("ultra");
  const [mood, setMood] = createSignal("cinematic dramatic");
  const [lighting, setLighting] = createSignal("volumetric cinematic");
  const [cameraAngle, setCameraAngle] = createSignal("dynamic wide shot");
  const [referenceMode, setReferenceMode] = createSignal("with-reference");
  const [attributeMode, setAttributeMode] = createSignal("full-attribute");
  const [useSceneImage, setUseSceneImage] = createSignal(false);
  const [sceneImage, setSceneImage] = createSignal<SceneImageData | null>(null);

  const [result, setResult] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  // Suggestion state
  const [suggestions, setSuggestions] = createSignal<ScenarioSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = createSignal(false);

  // Can we request suggestions? Need at least 1 hero with image
  const canSuggest = () => selectedHeroes().some(heroHasImage);

  // Validation
  const canGenerate = () => {
    if (!narrative().trim()) return false;
    if (selectedHeroes().length === 0) return false;
    return selectedHeroes().some(heroHasImage);
  };

  // Generate prompt
  const handleGenerate = async () => {
    if (!canGenerate() || loading()) return;

    setLoading(true);
    setError("");
    setResult("");

    try {
      // Flatten: each image becomes a separate HeroImage entry
      const heroes = selectedHeroes()
        .filter(heroHasImage)
        .flatMap(sh =>
          sh.images.map(img => ({
            heroName: sh.hero.name,
            base64Data: img.base64Data,
            mimeType: img.mimeType,
          }))
        );

      // Build scene image payload if present
      const sceneImagePayload = useSceneImage() && sceneImage()
        ? { base64Data: sceneImage()!.base64Data, mimeType: sceneImage()!.mimeType }
        : null;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrative: narrative(),
          heroes,
          aspectRatio: aspectRatio(),
          quality: quality(),
          mood: mood(),
          lighting: lighting(),
          cameraAngle: cameraAngle(),
          referenceMode: referenceMode(),
          attributeMode: attributeMode(),
          promptMode: promptMode(),
          sceneImage: sceneImagePayload,
          modelName: selectedModel(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate prompt");
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
          mode: promptMode(),
          config: {
            "Aspect Ratio": aspectRatio(),
            "Quality": quality(),
            "Mood/Atmosphere": mood(),
            "Lighting": lighting(),
            "Camera Angle": cameraAngle(),
            "Attribute Mode": promptMode() === "realistic" ? attributeMode() : "N/A (cinematic)",
          },
          modelName: selectedModel(),
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

  // Mode-specific text
  const headerTitle = () =>
    promptMode() === "realistic" ? "MLBB Realistic Prompt" : "MLBB Cinematic Prompt";

  const headerDesc = () =>
    promptMode() === "realistic"
      ? "Ubah hero animasi MLBB menjadi manusia realistic — powered by Gemini AI. Wajah tetap mirip, dunia jadi nyata."
      : "Generate cinematic hyper-realistic JSON prompts — powered by Gemini AI. Hero tetap fantasi, dunia jadi sinematik.";

  const docsLink = () =>
    promptMode() === "realistic" ? "/docs" : "/docs/cinematic";

  const docsLabel = () =>
    promptMode() === "realistic" ? "📖 Dokumentasi Konfigurasi Realistic" : "📖 Dokumentasi Konfigurasi Cinematic";

  const generateLabel = () =>
    promptMode() === "realistic" ? "🎬 Generate Realistic Prompt" : "🎬 Generate Cinematic Prompt";

  return (
    <div class="app-container">
      {/* Header */}
      <header class="app-header fade-in">
        <h1>{headerTitle()}</h1>
        <p>{headerDesc()}</p>

        {/* Mode Tabs */}
        <div class="mode-tabs">
          <button
            class={`mode-tab ${promptMode() === "realistic" ? "active" : ""}`}
            onClick={() => setPromptMode("realistic")}
          >
            <span class="tab-icon">🧑</span>
            Realistic
            <span class="tab-desc">Animasi → Manusia</span>
          </button>
          <button
            class={`mode-tab ${promptMode() === "cinematic" ? "active" : ""}`}
            onClick={() => setPromptMode("cinematic")}
          >
            <span class="tab-icon">⚔️</span>
            Cinematic
            <span class="tab-desc">Hyper-Realistic Fantasy</span>
          </button>
        </div>

        <A href={docsLink()} class="docs-link-btn">
          {docsLabel()}
        </A>
      </header>

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
            <ConfigOptions
              promptMode={promptMode()}
              aspectRatio={aspectRatio()}
              quality={quality()}
              mood={mood()}
              lighting={lighting()}
              cameraAngle={cameraAngle()}
              referenceMode={referenceMode()}
              attributeMode={attributeMode()}
              useSceneImage={useSceneImage()}
              sceneImage={sceneImage()}
              onAspectRatioChange={setAspectRatio}
              onQualityChange={setQuality}
              onMoodChange={setMood}
              onLightingChange={setLighting}
              onCameraAngleChange={setCameraAngle}
              onReferenceModeChange={setReferenceMode}
              onAttributeModeChange={setAttributeMode}
              onUseSceneImageChange={setUseSceneImage}
              onSceneImageChange={setSceneImage}
            />
          </div>
        </div>

        {/* Right Column: Narrative + Generate + Result */}
        <div class="right-col">
          <div class="fade-in fade-in-delay-2">
            <NarrativeInput
              value={narrative()}
              onChange={setNarrative}
              promptMode={promptMode()}
              onRequestSuggestions={useSceneImage() ? undefined : handleSuggest}
              suggestions={suggestions()}
              suggestionsLoading={suggestLoading()}
              canSuggest={canSuggest()}
              useSceneImage={useSceneImage()}
            />
          </div>

          {/* Generate Button */}
          <div class="fade-in fade-in-delay-3">
            <div class="generate-section glass-panel" style={{ padding: "24px" }}>
              <button
                class={`generate-btn ${promptMode() === "cinematic" ? "cinematic-btn" : ""} ${loading() ? "loading" : ""}`}
                onClick={handleGenerate}
                disabled={!canGenerate() || loading()}
              >
                <Show when={!loading()} fallback={`⏳ Generating ${promptMode() === "realistic" ? "Realistic" : "Cinematic"} Prompt...`}>
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
                    Upload at least one reference image ·{" "}
                  </Show>
                  <Show when={!narrative().trim()}>
                    Write a scenario
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
        MLBB Prompt Generator · {promptMode() === "realistic" ? "Animasi → Realistic" : "Cinematic Hyper-Realistic"} · Powered by Gemini AI
      </footer>
    </div>
  );
}

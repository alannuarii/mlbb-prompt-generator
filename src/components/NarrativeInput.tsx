import { createSignal, For, Show } from "solid-js";

export interface ScenarioSuggestion {
  title: string;
  scenario: string;
}

interface NarrativeInputProps {
  value: string;
  onChange: (value: string) => void;
  promptMode?: "realistic" | "cinematic" | "video";
  // Suggestion props
  onRequestSuggestions?: () => void;
  suggestions?: ScenarioSuggestion[];
  suggestionsLoading?: boolean;
  canSuggest?: boolean;
  useSceneImage?: boolean;
}

const PLACEHOLDERS = {
  realistic:
    "Deskripsikan skenario realistic... contoh: 'Layla sedang duduk di warung kopi pinggir jalan saat golden hour, mengenakan jaket denim dan kaos putih, tersenyum sambil memegang cangkir kopi' atau 'Gusion berjalan di koridor sekolah mengenakan seragam SMA, membawa tas ransel'",
  cinematic:
    "Describe your cinematic scene... e.g., 'Two warriors facing each other on a crumbling ancient bridge during a blood-red sunset, sparks flying from their clashing weapons, wind blowing their capes dramatically' atau 'Layla berdiri di puncak menara kristal, menatap lautan gelap dengan aura ungu menyelimutinya'",
  video:
    "Deskripsikan scene video... contoh: 'Kamera perlahan mendekati wajah hero saat angin menerbangkan rambut dan jubahnya, partikel cahaya berterbangan di sekitarnya, lalu hero membuka mata dengan tatapan tajam'",
  scene_realistic:
    "Jelaskan adegan dari gambar referensi — contoh: 'Hero berdiri di balkon apartemen menghadap kota malam hari, ekspresi tenang, angin meniup rambutnya' atau 'Hero sedang duduk di meja restoran mewah sambil tersenyum'",
  scene_cinematic:
    "Jelaskan adegan dari gambar referensi — contoh: 'Hero berdiri di tengah reruntuhan kastil kuno dengan pedang tertancap di tanah, cahaya bulan menyinari dari belakang' atau 'Hero terbang di atas awan badai dengan sayap terbentang'",
};

export default function NarrativeInput(props: NarrativeInputProps) {
  const [focused, setFocused] = createSignal(false);
  const [showSuggestions, setShowSuggestions] = createSignal(false);

  const handleSuggest = () => {
    if (props.onRequestSuggestions) {
      setShowSuggestions(true);
      props.onRequestSuggestions();
    }
  };

  const selectSuggestion = (scenario: string) => {
    props.onChange(scenario);
    setShowSuggestions(false);
  };

  const mode = () => props.promptMode || "realistic";

  const currentPlaceholder = () => {
    if (props.useSceneImage) {
      return mode() === "realistic"
        ? (PLACEHOLDERS as any).scene_realistic
        : (PLACEHOLDERS as any).scene_cinematic;
    }
    return PLACEHOLDERS[mode()];
  };

  return (
    <div class="narrative-section glass-panel">
      <div class="section-title">
        <span class="icon">📝</span>
        {props.useSceneImage ? "Scene Description / Keterangan Adegan" : "Scenario / Narrative"}
        <Show when={props.useSceneImage}>
          <span style={{ "font-size": "0.7rem", color: "var(--accent-primary)", "font-weight": "400", "margin-left": "8px" }}>
            🖼️ Mode Adegan
          </span>
        </Show>
      </div>

      <Show when={props.useSceneImage}>
        <div class="scene-mode-hint">
          <span class="scene-hint-icon">💡</span>
          <span>Jelaskan adegan/scene dari gambar referensi yang sudah di-upload. Prompt akan fokus menempatkan hero seolah-olah berada di adegan tersebut. Rekomendasi skenario tidak tersedia dalam mode ini.</span>
        </div>
      </Show>

      <textarea
        class="narrative-textarea"
        placeholder={currentPlaceholder()}
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={6}
      />

      <div class="narrative-footer">
        <div class="char-count">
          {props.value.length} characters
        </div>

        {/* Suggest button */}
        <Show when={props.onRequestSuggestions}>
          <button
            class={`suggest-btn ${props.suggestionsLoading ? "loading" : ""}`}
            onClick={handleSuggest}
            disabled={!props.canSuggest || props.suggestionsLoading}
            title={!props.canSuggest ? "Upload minimal 1 gambar hero terlebih dahulu" : "Generate rekomendasi skenario dari AI"}
          >
            <Show when={!props.suggestionsLoading} fallback={
              <>
                <span class="suggest-spinner"></span>
                Generating...
              </>
            }>
              ✨ Rekomendasi
            </Show>
          </button>
        </Show>
      </div>

      {/* Suggestion cards */}
      <Show when={showSuggestions() && (props.suggestionsLoading || (props.suggestions && props.suggestions.length > 0))}>
        <div class="suggestions-container">
          <div class="suggestions-header">
            <span>✨ Rekomendasi Skenario</span>
            <button
              class="suggestions-close"
              onClick={() => setShowSuggestions(false)}
            >
              ×
            </button>
          </div>

          <Show when={props.suggestionsLoading}>
            <div class="suggestions-loading">
              <div class="suggest-loading-dots">
                <span></span><span></span><span></span>
              </div>
              <p>AI sedang menganalisis hero dan membuat rekomendasi skenario...</p>
            </div>
          </Show>

          <Show when={!props.suggestionsLoading && props.suggestions && props.suggestions.length > 0}>
            <div class="suggestions-grid">
              <For each={props.suggestions}>
                {(suggestion, index) => (
                  <button
                    class="suggestion-card"
                    onClick={() => selectSuggestion(suggestion.scenario)}
                  >
                    <div class="suggestion-number">{index() + 1}</div>
                    <div class="suggestion-content">
                      <h4 class="suggestion-title">{suggestion.title}</h4>
                      <p class="suggestion-text">{suggestion.scenario}</p>
                    </div>
                    <span class="suggestion-use">Gunakan →</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

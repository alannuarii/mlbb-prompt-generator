import { createSignal, Show } from "solid-js";

export interface SceneImageData {
  file: File;
  preview: string;
  base64Data: string;
  mimeType: string;
}

interface ConfigOptionsProps {
  promptMode: "realistic" | "cinematic";
  aspectRatio: string;
  quality: string;
  mood: string;
  lighting: string;
  cameraAngle: string;
  referenceMode: string;
  attributeMode: string;
  useSceneImage: boolean;
  sceneImage: SceneImageData | null;
  onAspectRatioChange: (v: string) => void;
  onQualityChange: (v: string) => void;
  onMoodChange: (v: string) => void;
  onLightingChange: (v: string) => void;
  onCameraAngleChange: (v: string) => void;
  onReferenceModeChange: (v: string) => void;
  onAttributeModeChange: (v: string) => void;
  onUseSceneImageChange: (v: boolean) => void;
  onSceneImageChange: (v: SceneImageData | null) => void;
}

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16 Portrait" },
  { value: "16:9", label: "16:9 Landscape" },
  { value: "1:1", label: "1:1 Square" },
  { value: "4:5", label: "4:5 Social" },
  { value: "3:4", label: "3:4 Classic" },
];

const QUALITY_PRESETS = [
  { value: "standard", label: "Standard" },
  { value: "high", label: "High" },
  { value: "ultra", label: "Ultra" },
  { value: "cinematic", label: "Cinematic Max" },
];

// Mood options — shared core + mode-specific extras
const MOOD_CORE = [
  { value: "cinematic dramatic", label: "Cinematic Dramatic" },
  { value: "dark and moody", label: "Dark & Moody" },
  { value: "epic battle", label: "Epic Battle" },
  { value: "serene and mystical", label: "Serene & Mystical" },
  { value: "heroic and triumphant", label: "Heroic & Triumphant" },
  { value: "romantic and ethereal", label: "Romantic & Ethereal" },
  { value: "cyberpunk neon", label: "Cyberpunk Neon" },
];

const MOOD_CINEMATIC_EXTRA = [
  { value: "horror and ominous", label: "Horror & Ominous" },
  { value: "ancient mythological", label: "Ancient Mythological" },
  { value: "post-apocalyptic", label: "Post-Apocalyptic" },
];

const MOOD_REALISTIC_EXTRA = [
  { value: "casual everyday", label: "Casual Everyday" },
  { value: "warm and cozy", label: "Warm & Cozy" },
];

// Lighting options — shared core + mode-specific extras
const LIGHTING_CORE = [
  { value: "volumetric cinematic", label: "Volumetric Cinematic" },
  { value: "golden hour", label: "Golden Hour" },
  { value: "neon rim lighting", label: "Neon Rim Lighting" },
  { value: "dramatic chiaroscuro", label: "Dramatic Chiaroscuro" },
  { value: "moonlit ambient", label: "Moonlit Ambient" },
  { value: "studio three-point", label: "Studio Three-Point" },
];

const LIGHTING_CINEMATIC_EXTRA = [
  { value: "backlit silhouette", label: "Backlit Silhouette" },
  { value: "fire and ember glow", label: "Fire & Ember Glow" },
  { value: "underwater caustics", label: "Underwater Caustics" },
  { value: "storm lightning flash", label: "Storm Lightning Flash" },
];

const LIGHTING_REALISTIC_EXTRA = [
  { value: "natural daylight", label: "Natural Daylight" },
  { value: "soft window light", label: "Soft Window Light" },
];

const CAMERA_OPTIONS = [
  { value: "dynamic wide shot", label: "Dynamic Wide Shot" },
  { value: "close-up portrait", label: "Close-Up Portrait" },
  { value: "low angle hero shot", label: "Low Angle Hero Shot" },
  { value: "high angle dramatic", label: "High Angle Dramatic" },
  { value: "dutch angle action", label: "Dutch Angle Action" },
  { value: "over the shoulder", label: "Over The Shoulder" },
  { value: "extreme wide establishing", label: "Extreme Wide Establishing" },
  { value: "medium shot conversational", label: "Medium Shot" },
  { value: "bird eye aerial", label: "Bird's Eye Aerial" },
  { value: "macro detail shot", label: "Macro Detail Shot" },
];

export default function ConfigOptions(props: ConfigOptionsProps) {
  const [dragOver, setDragOver] = createSignal(false);

  const moodOptions = () =>
    props.promptMode === "realistic"
      ? [...MOOD_CORE, ...MOOD_REALISTIC_EXTRA]
      : [...MOOD_CORE, ...MOOD_CINEMATIC_EXTRA];

  const lightingOptions = () =>
    props.promptMode === "realistic"
      ? [...LIGHTING_CORE, ...LIGHTING_REALISTIC_EXTRA]
      : [...LIGHTING_CORE, ...LIGHTING_CINEMATIC_EXTRA];

  const handleSceneImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64Full = reader.result as string;
      const base64Data = base64Full.split(",")[1];
      const preview = URL.createObjectURL(file);
      props.onSceneImageChange({
        file,
        preview,
        base64Data,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeSceneImage = () => {
    if (props.sceneImage?.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(props.sceneImage.preview);
    }
    props.onSceneImageChange(null);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleSceneImageUpload(file);
  };

  return (
    <div class="config-section glass-panel">
      <div class="section-title">
        <span class="icon">⚙️</span>
        Configuration
      </div>

      {/* Attribute Mode — Only shown in Realistic mode */}
      <Show when={props.promptMode === "realistic"}>
        <div class="config-group" style={{ "margin-bottom": "16px" }}>
          <label class="config-label">Attribute Mode</label>
          <div class="toggle-group">
            <button
              class={`toggle-btn ${props.attributeMode === "full-attribute" ? "active" : ""}`}
              onClick={() => props.onAttributeModeChange("full-attribute")}
            >
              🛡️ Full Attribute
            </button>
            <button
              class={`toggle-btn ${props.attributeMode === "custom-outfit" ? "active" : ""}`}
              onClick={() => props.onAttributeModeChange("custom-outfit")}
            >
              👕 Custom Outfit
            </button>
          </div>
          <span style={{ "font-size": "0.72rem", color: "var(--text-muted)", "margin-top": "4px" }}>
            {props.attributeMode === "full-attribute"
              ? "Hero tetap menggunakan armor/kostum asli tapi diubah jadi realistic (metal asli, leather asli)"
              : "Hero tidak menggunakan atribut game — pakaian menyesuaikan skenario (seragam, casual, dll). Hanya wajah yang dipertahankan."}
          </span>
        </div>
      </Show>

      {/* Scene Image Mode — Toggle */}
      <div class="config-group" style={{ "margin-bottom": "16px" }}>
        <label class="config-label">Scene Image (Gambar Adegan)</label>
        <div class="toggle-group">
          <button
            class={`toggle-btn ${!props.useSceneImage ? "active" : ""}`}
            onClick={() => {
              props.onUseSceneImageChange(false);
              removeSceneImage();
            }}
          >
            🚫 Tanpa Adegan
          </button>
          <button
            class={`toggle-btn ${props.useSceneImage ? "active" : ""}`}
            onClick={() => props.onUseSceneImageChange(true)}
          >
            🖼️ Gunakan Gambar Adegan
          </button>
        </div>
        <span style={{ "font-size": "0.72rem", color: "var(--text-muted)", "margin-top": "4px" }}>
          {props.useSceneImage
            ? "Upload gambar adegan/scene — hero akan ditempatkan seolah-olah berada di skenario dalam gambar tersebut"
            : "Tidak menggunakan gambar adegan, skenario ditentukan dari teks narasi dan konfigurasi"}
        </span>
      </div>

      {/* Scene Image Upload Area */}
      <Show when={props.useSceneImage}>
        <div class="config-group" style={{ "margin-bottom": "16px" }}>
          <Show when={!props.sceneImage}>
            <label
              class={`scene-image-dropzone ${dragOver() ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div class="scene-dropzone-content">
                <span class="scene-dropzone-icon">🖼️</span>
                <span class="scene-dropzone-text">Drop gambar adegan di sini atau klik untuk upload</span>
                <span class="scene-dropzone-hint">Gambar ini akan menjadi referensi adegan/scene untuk hero</span>
              </div>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) handleSceneImageUpload(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
          </Show>

          <Show when={props.sceneImage}>
            <div class="scene-image-preview">
              <img src={props.sceneImage!.preview} alt="Scene reference" class="scene-preview-img" />
              <div class="scene-preview-overlay">
                <span class="scene-preview-label">📍 Gambar Adegan</span>
                <button class="scene-preview-remove" onClick={removeSceneImage} title="Hapus gambar adegan">
                  ×
                </button>
              </div>
            </div>
          </Show>
        </div>
      </Show>

      {/* Reference Mode — Toggle */}
      <div class="config-group" style={{ "margin-bottom": "16px" }}>
        <label class="config-label">Reference Mode</label>
        <div class="toggle-group">
          <button
            class={`toggle-btn ${props.referenceMode === "with-reference" ? "active" : ""}`}
            onClick={() => props.onReferenceModeChange("with-reference")}
          >
            📎 With Reference
          </button>
          <button
            class={`toggle-btn ${props.referenceMode === "standalone" ? "active" : ""}`}
            onClick={() => props.onReferenceModeChange("standalone")}
          >
            📄 Standalone
          </button>
        </div>
        <span style={{ "font-size": "0.72rem", color: "var(--text-muted)", "margin-top": "4px" }}>
          {props.referenceMode === "with-reference"
            ? "Prompt akan digunakan bersama gambar referensi di Google Flow"
            : "Prompt berdiri sendiri tanpa upload gambar referensi tambahan"}
        </span>
      </div>

      {/* Aspect Ratio — Toggle buttons */}
      <div class="config-group" style={{ "margin-bottom": "16px" }}>
        <label class="config-label">Aspect Ratio</label>
        <div class="toggle-group">
          {ASPECT_RATIOS.map(ar => (
            <button
              class={`toggle-btn ${props.aspectRatio === ar.value ? "active" : ""}`}
              onClick={() => props.onAspectRatioChange(ar.value)}
            >
              {ar.label}
            </button>
          ))}
        </div>
      </div>

      {/* Remaining options in a grid */}
      <div class="config-grid">
        <div class="config-group">
          <label class="config-label">Quality</label>
          <select
            class="config-select"
            value={props.quality}
            onChange={(e) => props.onQualityChange(e.currentTarget.value)}
          >
            {QUALITY_PRESETS.map(q => (
              <option value={q.value}>{q.label}</option>
            ))}
          </select>
        </div>

        <div class="config-group">
          <label class="config-label">Mood / Atmosphere</label>
          <select
            class="config-select"
            value={props.mood}
            onChange={(e) => props.onMoodChange(e.currentTarget.value)}
          >
            {moodOptions().map(m => (
              <option value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div class="config-group">
          <label class="config-label">Lighting Style</label>
          <select
            class="config-select"
            value={props.lighting}
            onChange={(e) => props.onLightingChange(e.currentTarget.value)}
          >
            {lightingOptions().map(l => (
              <option value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>

        <div class="config-group">
          <label class="config-label">Camera Angle</label>
          <select
            class="config-select"
            value={props.cameraAngle}
            onChange={(e) => props.onCameraAngleChange(e.currentTarget.value)}
          >
            {CAMERA_OPTIONS.map(c => (
              <option value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

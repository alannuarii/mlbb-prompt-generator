import { Show } from "solid-js";

interface VideoConfigOptionsProps {
  videoMode: "single" | "multi-scene";
  singleMode?: "frame" | "ingredient";
  aspectRatio: string;
  cameraMovement: string;
  motionIntensity: string;
  videoStyle: string;
  mood: string;
  soundDesign: string;
  onAspectRatioChange: (v: string) => void;
  onCameraMovementChange: (v: string) => void;
  onMotionIntensityChange: (v: string) => void;
  onVideoStyleChange: (v: string) => void;
  onMoodChange: (v: string) => void;
  onSoundDesignChange: (v: string) => void;
}

const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16 Portrait" },
  { value: "16:9", label: "16:9 Landscape" },
  { value: "1:1", label: "1:1 Square" },
  { value: "4:5", label: "4:5 Social" },
];


const CAMERA_MOVEMENTS = [
  { value: "static with subtle drift", label: "Static (Subtle Drift)" },
  { value: "slow push in", label: "Slow Push In" },
  { value: "slow pull out", label: "Slow Pull Out" },
  { value: "slow pan left to right", label: "Pan Left → Right" },
  { value: "slow pan right to left", label: "Pan Right → Left" },
  { value: "orbit around subject", label: "Orbit Around" },
  { value: "crane shot upward", label: "Crane Up" },
  { value: "crane shot downward", label: "Crane Down" },
  { value: "dolly tracking shot", label: "Dolly Track" },
  { value: "handheld cinematic", label: "Handheld Cinematic" },
  { value: "zoom into face", label: "Zoom Into Face" },
  { value: "parallax depth effect", label: "Parallax Depth" },
];

const MOTION_INTENSITIES = [
  { value: "subtle", label: "🌿 Subtle" },
  { value: "moderate", label: "🌊 Moderate" },
  { value: "dynamic", label: "⚡ Dynamic" },
  { value: "intense", label: "🔥 Intense" },
];

const VIDEO_STYLES = [
  { value: "cinematic film", label: "Cinematic Film" },
  { value: "slow motion dramatic", label: "Slow Motion" },
  { value: "music video aesthetic", label: "Music Video" },
  { value: "documentary style", label: "Documentary" },
  { value: "dream sequence", label: "Dream Sequence" },
  { value: "action sequence", label: "Action Sequence" },
  { value: "timelapse effect", label: "Timelapse" },
  { value: "portrait living photo", label: "Living Portrait" },
];

const MOOD_OPTIONS = [
  { value: "cinematic dramatic", label: "Cinematic Dramatic" },
  { value: "dark and moody", label: "Dark & Moody" },
  { value: "epic and intense", label: "Epic & Intense" },
  { value: "serene and peaceful", label: "Serene & Peaceful" },
  { value: "mysterious and suspenseful", label: "Mysterious" },
  { value: "heroic and triumphant", label: "Heroic & Triumphant" },
  { value: "romantic and dreamy", label: "Romantic & Dreamy" },
  { value: "casual and relaxed", label: "Casual & Relaxed" },
  { value: "melancholic and emotional", label: "Melancholic" },
  { value: "energetic and vibrant", label: "Energetic & Vibrant" },
];

const SOUND_DESIGNS = [
  { value: "cinematic ambient", label: "Cinematic Ambient" },
  { value: "epic orchestral swell", label: "Epic Orchestral" },
  { value: "nature and wind", label: "Nature & Wind" },
  { value: "rain and thunder", label: "Rain & Thunder" },
  { value: "combat and metal clashing", label: "Combat SFX" },
  { value: "heartbeat and tension", label: "Heartbeat Tension" },
  { value: "urban city sounds", label: "Urban City" },
  { value: "silence with subtle ambiance", label: "Near Silence" },
  { value: "lo-fi and dreamy", label: "Lo-fi Dreamy" },
  { value: "dramatic bass and drums", label: "Dramatic Percussion" },
];

export default function VideoConfigOptions(props: VideoConfigOptionsProps) {
  const configTitle = () => {
    if (props.videoMode === "multi-scene") return "Global Video Configuration";
    if (props.singleMode === "ingredient") return "Video Configuration — Ingredient";
    return "Video Configuration — Frame";
  };

  return (
    <div class="config-section glass-panel">
      <div class="section-title">
        <span class="icon">🎬</span>
        {configTitle()}
        <Show when={props.videoMode === "multi-scene"}>
          <span style={{ "font-size": "0.68rem", color: "var(--text-muted)", "font-weight": "400", "margin-left": "8px" }}>
            (berlaku untuk semua scene)
          </span>
        </Show>
      </div>

      {/* Motion Intensity — Only in single mode */}
      <Show when={props.videoMode === "single"}>
        <div class="config-group" style={{ "margin-bottom": "16px" }}>
          <label class="config-label">Motion Intensity</label>
          <div class="toggle-group">
            {MOTION_INTENSITIES.map(mi => (
              <button
                class={`toggle-btn ${props.motionIntensity === mi.value ? "active" : ""}`}
                onClick={() => props.onMotionIntensityChange(mi.value)}
              >
                {mi.label}
              </button>
            ))}
          </div>
        </div>
      </Show>

      {/* Aspect Ratio — Always shown */}
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
        {/* Camera Movement — Only in single mode */}
        <Show when={props.videoMode === "single"}>
          <div class="config-group">
            <label class="config-label">Camera Movement</label>
            <select
              class="config-select"
              value={props.cameraMovement}
              onChange={(e) => props.onCameraMovementChange(e.currentTarget.value)}
            >
              {CAMERA_MOVEMENTS.map(cm => (
                <option value={cm.value}>{cm.label}</option>
              ))}
            </select>
          </div>
        </Show>

        <div class="config-group">
          <label class="config-label">Video Style</label>
          <select
            class="config-select"
            value={props.videoStyle}
            onChange={(e) => props.onVideoStyleChange(e.currentTarget.value)}
          >
            {VIDEO_STYLES.map(vs => (
              <option value={vs.value}>{vs.label}</option>
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
            {MOOD_OPTIONS.map(m => (
              <option value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div class="config-group">
          <label class="config-label">Sound Design</label>
          <select
            class="config-select"
            value={props.soundDesign}
            onChange={(e) => props.onSoundDesignChange(e.currentTarget.value)}
          >
            {SOUND_DESIGNS.map(sd => (
              <option value={sd.value}>{sd.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

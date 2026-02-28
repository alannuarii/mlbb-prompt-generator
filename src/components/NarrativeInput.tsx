import { createSignal } from "solid-js";

interface NarrativeInputProps {
  value: string;
  onChange: (value: string) => void;
  promptMode?: "realistic" | "cinematic";
}

const PLACEHOLDERS = {
  realistic:
    "Deskripsikan skenario realistic... contoh: 'Layla sedang duduk di warung kopi pinggir jalan saat golden hour, mengenakan jaket denim dan kaos putih, tersenyum sambil memegang cangkir kopi' atau 'Gusion berjalan di koridor sekolah mengenakan seragam SMA, membawa tas ransel'",
  cinematic:
    "Describe your cinematic scene... e.g., 'Two warriors facing each other on a crumbling ancient bridge during a blood-red sunset, sparks flying from their clashing weapons, wind blowing their capes dramatically' atau 'Layla berdiri di puncak menara kristal, menatap lautan gelap dengan aura ungu menyelimutinya'",
};

export default function NarrativeInput(props: NarrativeInputProps) {
  const [focused, setFocused] = createSignal(false);

  return (
    <div class="narrative-section glass-panel">
      <div class="section-title">
        <span class="icon">📝</span>
        Scenario / Narrative
      </div>
      <textarea
        class="narrative-textarea"
        placeholder={PLACEHOLDERS[props.promptMode || "realistic"]}
        value={props.value}
        onInput={(e) => props.onChange(e.currentTarget.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        rows={6}
      />
      <div class="char-count">
        {props.value.length} characters
      </div>
    </div>
  );
}

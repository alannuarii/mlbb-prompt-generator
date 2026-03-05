import { createSignal } from "solid-js";

// =============================================================================
// Global Model Store — shared across all pages
// =============================================================================

export interface GeminiModel {
  value: string;
  label: string;
  badge: string;
  tier: "flagship" | "standard" | "lite";
  desc: string;
}

export const GEMINI_MODELS: GeminiModel[] = [
  // Flagship
  { value: "gemini-3-flash",       label: "Gemini 3 Flash",      badge: "🔥 Newest",   tier: "flagship", desc: "Model terbaru, performa terbaik" },
  { value: "gemini-2.5-pro",       label: "Gemini 2.5 Pro",      badge: "🧠 Powerful", tier: "flagship", desc: "Paling cerdas, reasoning kompleks" },
  // Standard
  { value: "gemini-2.5-flash",     label: "Gemini 2.5 Flash",    badge: "⚡ Balanced", tier: "standard", desc: "Keseimbangan kecepatan & kualitas" },
  { value: "gemini-2.0-flash",     label: "Gemini 2.0 Flash",    badge: "🚀 Fast",     tier: "standard", desc: "Cepat, stabil, teruji" },
  // Lite
  { value: "gemini-3.1-flash-lite",label: "Gemini 3.1 Flash Lite",badge: "🪶 Lite",    tier: "lite",     desc: "Ringan, hemat token" },
  { value: "gemini-2.5-flash-lite",label: "Gemini 2.5 Flash Lite",badge: "🪶 Lite",    tier: "lite",     desc: "Ringan, hemat token" },
];

const DEFAULT_MODEL = "gemini-2.5-flash";

function getStoredModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem("gemini_model") ?? DEFAULT_MODEL;
}

const [_selectedModel, _setSelectedModel] = createSignal(getStoredModel());

export const selectedModel = _selectedModel;

export function setSelectedModel(model: string) {
  _setSelectedModel(model);
  if (typeof window !== "undefined") {
    localStorage.setItem("gemini_model", model);
  }
}

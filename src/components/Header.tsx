import { A, useLocation } from "@solidjs/router";
import { createSignal, For, Show, createEffect, onCleanup } from "solid-js";
import { isServer } from "solid-js/web";
import { selectedModel, setSelectedModel, GEMINI_MODELS } from "../lib/model-store";
import type { GeminiModel } from "../lib/model-store";

export default function Header() {
  const location = useLocation();
  const [open, setOpen] = createSignal(false);
  let dropdownRef: HTMLDivElement | undefined;

  const isActive = (path: string) =>
    location.pathname === path ? "nav-link active" : "nav-link";

  const currentModel = (): GeminiModel =>
    GEMINI_MODELS.find(m => m.value === selectedModel()) ?? GEMINI_MODELS[0];

  const selectModel = (model: GeminiModel) => {
    setSelectedModel(model.value);
    setOpen(false);
  };

  // Close on click outside (client-only)
  if (!isServer) {
    createEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      onCleanup(() => document.removeEventListener("mousedown", handleClickOutside));
    });
  }

  const TIER_LABELS: Record<string, string> = {
    flagship: "Flagship",
    standard: "Standard",
    lite: "Lite",
  };

  const tierGroups = () => {
    const grouped: { tier: string; models: GeminiModel[] }[] = [];
    const seen = new Set<string>();
    for (const m of GEMINI_MODELS) {
      if (!seen.has(m.tier)) {
        seen.add(m.tier);
        grouped.push({ tier: m.tier, models: GEMINI_MODELS.filter(x => x.tier === m.tier) });
      }
    }
    return grouped;
  };

  return (
    <header class="site-header">
      <div class="header-inner">
        <A href="/" class="header-logo">
          <span class="logo-icon">🎬</span>
          <span class="logo-text">MLBB Prompt</span>
        </A>

        <div class="header-right">
          <nav class="header-nav">
            <A href="/" class={isActive("/")}>
              <span class="nav-icon">📸</span>
              Image
            </A>
            <A href="/video" class={isActive("/video")}>
              <span class="nav-icon">🎥</span>
              Video
            </A>
          </nav>

          {/* Custom Model Dropdown */}
          <div class="model-dropdown" ref={dropdownRef}>
            <button
              class={`model-dropdown-trigger ${open() ? "open" : ""}`}
              onClick={() => setOpen(!open())}
              aria-expanded={open()}
              aria-haspopup="listbox"
            >
              <span class="model-trigger-badge">{currentModel().badge.split(" ")[0]}</span>
              <span class="model-trigger-name">{currentModel().label}</span>
              <svg class="model-trigger-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            <Show when={open()}>
              <div class="model-dropdown-panel" role="listbox">
                <For each={tierGroups()}>
                  {(group) => (
                    <>
                      <div class="model-tier-label">{TIER_LABELS[group.tier]}</div>
                      <For each={group.models}>
                        {(m) => (
                          <button
                            class={`model-option ${m.value === selectedModel() ? "selected" : ""}`}
                            onClick={() => selectModel(m)}
                            role="option"
                            aria-selected={m.value === selectedModel()}
                          >
                            <div class="model-option-left">
                              <span class="model-option-name">{m.label}</span>
                              <span class="model-option-desc">{m.desc}</span>
                            </div>
                            <span class={`model-option-badge tier-${m.tier}`}>{m.badge}</span>
                          </button>
                        )}
                      </For>
                    </>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </header>
  );
}

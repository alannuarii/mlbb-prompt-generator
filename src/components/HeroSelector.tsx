import { createSignal, For, Show, createMemo } from "solid-js";
import type { Hero } from "../lib/heroes";
import { HEROES, ROLES } from "../lib/heroes";
import { fileToBase64, getMimeType } from "../lib/utils";

export interface SelectedHero {
  hero: Hero;
  imageFile?: File;
  imagePreview?: string;
  base64Data?: string;
  mimeType?: string;
}

interface HeroSelectorProps {
  selectedHeroes: SelectedHero[];
  onSelectionChange: (heroes: SelectedHero[]) => void;
}

export default function HeroSelector(props: HeroSelectorProps) {
  const [search, setSearch] = createSignal("");
  const [roleFilter, setRoleFilter] = createSignal("All");

  const filteredHeroes = createMemo(() => {
    const s = search().toLowerCase();
    const role = roleFilter();
    return HEROES.filter(h => {
      const matchName = h.name.toLowerCase().includes(s);
      const matchRole = role === "All" || h.role === role;
      return matchName && matchRole;
    });
  });

  const isSelected = (heroId: string) =>
    props.selectedHeroes.some(sh => sh.hero.id === heroId);

  const toggleHero = (hero: Hero) => {
    if (isSelected(hero.id)) {
      props.onSelectionChange(
        props.selectedHeroes.filter(sh => sh.hero.id !== hero.id)
      );
    } else {
      props.onSelectionChange([
        ...props.selectedHeroes,
        { hero },
      ]);
    }
  };

  const removeHero = (heroId: string) => {
    props.onSelectionChange(
      props.selectedHeroes.filter(sh => sh.hero.id !== heroId)
    );
  };

  const handleImageUpload = async (heroId: string, file: File) => {
    const base64 = await fileToBase64(file);
    const mimeType = getMimeType(file);
    const preview = URL.createObjectURL(file);

    props.onSelectionChange(
      props.selectedHeroes.map(sh =>
        sh.hero.id === heroId
          ? { ...sh, imageFile: file, imagePreview: preview, base64Data: base64, mimeType }
          : sh
      )
    );
  };

  const getInitials = (name: string) =>
    name.split(/[\s-]/).map(w => w[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div class="hero-selector glass-panel">
      <div class="section-title">
        <span class="icon">⚔️</span>
        Hero Selection
        <Show when={props.selectedHeroes.length > 0}>
          <span class="badge">{props.selectedHeroes.length} selected</span>
        </Show>
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "8px", "margin-bottom": "12px" }}>
        <input
          type="text"
          class="hero-search"
          placeholder="Search heroes..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          style={{ "margin-bottom": "0", flex: "1" }}
        />
        <select
          class="config-select"
          value={roleFilter()}
          onChange={(e) => setRoleFilter(e.currentTarget.value)}
          style={{ width: "auto", "min-width": "110px" }}
        >
          <option value="All">All Roles</option>
          <For each={ROLES}>
            {(role) => <option value={role}>{role}</option>}
          </For>
        </select>
      </div>

      {/* Hero Grid */}
      <div class="hero-grid">
        <For each={filteredHeroes()}>
          {(hero) => (
            <div
              class={`hero-card ${isSelected(hero.id) ? "selected" : ""}`}
              onClick={() => toggleHero(hero)}
            >
              <div class="hero-avatar">{getInitials(hero.name)}</div>
              <span class="hero-name">{hero.name}</span>
              <span class="hero-role">{hero.role}</span>
            </div>
          )}
        </For>
      </div>

      {/* Selected Heroes with Image Upload */}
      <Show when={props.selectedHeroes.length > 0}>
        <div class="selected-heroes">
          <div class="section-title" style={{ "margin-bottom": "8px" }}>
            <span class="icon">📸</span>
            Upload Reference Images
          </div>
          <For each={props.selectedHeroes}>
            {(sh) => (
              <div class="selected-hero-item fade-in">
                <div class="hero-avatar" style={{ width: "36px", height: "36px", "font-size": "0.8rem" }}>
                  {getInitials(sh.hero.name)}
                </div>
                <div class="selected-hero-info">
                  <h4>{sh.hero.name}</h4>
                  <span>{sh.hero.role}</span>
                </div>
                <div class="upload-area">
                  <Show when={sh.imagePreview}>
                    <img
                      src={sh.imagePreview}
                      alt={sh.hero.name}
                      class="upload-preview"
                    />
                  </Show>
                  <label class={`upload-btn ${sh.imageFile ? "has-image" : ""}`}>
                    {sh.imageFile ? "✓ Uploaded" : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) handleImageUpload(sh.hero.id, file);
                      }}
                    />
                  </label>
                </div>
                <button
                  class="remove-hero-btn"
                  onClick={() => removeHero(sh.hero.id)}
                  title="Remove hero"
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

import { createSignal, For, Show, createMemo } from "solid-js";
import type { Hero } from "../lib/heroes";
import { HEROES, ROLES } from "../lib/heroes";
import { fileToBase64, getMimeType } from "../lib/utils";

export interface HeroRefImage {
  file: File;
  preview: string;
  base64Data: string;
  mimeType: string;
}

export interface SelectedHero {
  hero: Hero;
  images: HeroRefImage[];
}

// Keep backward-compat helper: does hero have at least 1 image?
export function heroHasImage(sh: SelectedHero): boolean {
  return sh.images.length > 0;
}

interface HeroSelectorProps {
  selectedHeroes: SelectedHero[];
  onSelectionChange: (heroes: SelectedHero[]) => void;
}

const MAX_IMAGES_PER_HERO = 5;

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
      // Revoke all object URLs before removing
      const existing = props.selectedHeroes.find(sh => sh.hero.id === hero.id);
      existing?.images.forEach(img => URL.revokeObjectURL(img.preview));
      props.onSelectionChange(
        props.selectedHeroes.filter(sh => sh.hero.id !== hero.id)
      );
    } else {
      props.onSelectionChange([
        ...props.selectedHeroes,
        { hero, images: [] },
      ]);
    }
  };

  const removeHero = (heroId: string) => {
    const existing = props.selectedHeroes.find(sh => sh.hero.id === heroId);
    existing?.images.forEach(img => URL.revokeObjectURL(img.preview));
    props.onSelectionChange(
      props.selectedHeroes.filter(sh => sh.hero.id !== heroId)
    );
  };

  const handleImageUpload = async (heroId: string, files: FileList) => {
    const hero = props.selectedHeroes.find(sh => sh.hero.id === heroId);
    if (!hero) return;

    const remaining = MAX_IMAGES_PER_HERO - hero.images.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    const newImages: HeroRefImage[] = [];
    for (const file of filesToProcess) {
      const base64 = await fileToBase64(file);
      const mimeType = getMimeType(file);
      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview, base64Data: base64, mimeType });
    }

    props.onSelectionChange(
      props.selectedHeroes.map(sh =>
        sh.hero.id === heroId
          ? { ...sh, images: [...sh.images, ...newImages] }
          : sh
      )
    );
  };

  const removeImage = (heroId: string, imgIndex: number) => {
    props.onSelectionChange(
      props.selectedHeroes.map(sh => {
        if (sh.hero.id !== heroId) return sh;
        const updated = [...sh.images];
        URL.revokeObjectURL(updated[imgIndex].preview);
        updated.splice(imgIndex, 1);
        return { ...sh, images: updated };
      })
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

      {/* Selected Heroes with Multi-Image Upload */}
      <Show when={props.selectedHeroes.length > 0}>
        <div class="selected-heroes">
          <div class="section-title" style={{ "margin-bottom": "8px" }}>
            <span class="icon">📸</span>
            Upload Reference Images
            <span style={{ "font-size": "0.7rem", color: "var(--text-muted)", "font-weight": "400", "margin-left": "8px" }}>
              (maks. {MAX_IMAGES_PER_HERO} per hero)
            </span>
          </div>
          <For each={props.selectedHeroes}>
            {(sh) => (
              <div class="selected-hero-item fade-in">
                {/* Hero info row */}
                <div class="selected-hero-header">
                  <div class="hero-avatar" style={{ width: "36px", height: "36px", "font-size": "0.8rem" }}>
                    {getInitials(sh.hero.name)}
                  </div>
                  <div class="selected-hero-info">
                    <h4>{sh.hero.name}</h4>
                    <span>{sh.hero.role}</span>
                  </div>
                  <Show when={sh.images.length > 0}>
                    <span class="image-count-badge">
                      {sh.images.length} gambar
                    </span>
                  </Show>
                  <button
                    class="remove-hero-btn"
                    onClick={() => removeHero(sh.hero.id)}
                    title="Remove hero"
                  >
                    ×
                  </button>
                </div>

                {/* Multi-image gallery */}
                <div class="hero-images-gallery">
                  <For each={sh.images}>
                    {(img, index) => (
                      <div class="ref-image-thumb">
                        <img src={img.preview} alt={`${sh.hero.name} ref ${index() + 1}`} />
                        <button
                          class="ref-image-remove"
                          onClick={() => removeImage(sh.hero.id, index())}
                          title="Hapus gambar"
                        >
                          ×
                        </button>
                        <span class="ref-image-number">{index() + 1}</span>
                      </div>
                    )}
                  </For>

                  {/* Add image button */}
                  <Show when={sh.images.length < MAX_IMAGES_PER_HERO}>
                    <label class="ref-image-add">
                      <span class="add-icon">+</span>
                      <span class="add-text">
                        {sh.images.length === 0 ? "Upload" : "Tambah"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const files = e.currentTarget.files;
                          if (files && files.length > 0) {
                            handleImageUpload(sh.hero.id, files);
                          }
                          // Reset so same file can be re-uploaded
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </Show>
                </div>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}

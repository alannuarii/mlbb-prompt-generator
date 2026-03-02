import { createSignal, For, Show, createMemo } from "solid-js";
import type { Hero } from "../lib/heroes";
import { HEROES, ROLES } from "../lib/heroes";
import { fileToBase64, getMimeType } from "../lib/utils";

export interface HeroRefImage {
  file: File | null;       // null jika dari portrait default
  preview: string;
  base64Data: string;
  mimeType: string;
  isDefault?: boolean;     // flag portrait bawaan
  filename?: string;       // nama file asli (untuk display)
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

interface PortraitItem {
  filename: string;
  url: string;
}

const MAX_IMAGES_PER_HERO = 5;

export default function HeroSelector(props: HeroSelectorProps) {
  const [search, setSearch] = createSignal("");
  const [roleFilter, setRoleFilter] = createSignal("All");

  // Default portrait picker state per-hero
  const [portraitPickerOpen, setPortraitPickerOpen] = createSignal<string | null>(null);
  const [portraitList, setPortraitList] = createSignal<PortraitItem[]>([]);
  const [portraitLoading, setPortraitLoading] = createSignal(false);
  const [addingPortrait, setAddingPortrait] = createSignal<string | null>(null); // filename in progress

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
      const existing = props.selectedHeroes.find(sh => sh.hero.id === hero.id);
      existing?.images.forEach(img => { if (img.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview); });
      props.onSelectionChange(
        props.selectedHeroes.filter(sh => sh.hero.id !== hero.id)
      );
      // Close picker if open for this hero
      if (portraitPickerOpen() === hero.id) setPortraitPickerOpen(null);
    } else {
      props.onSelectionChange([
        ...props.selectedHeroes,
        { hero, images: [] },
      ]);
    }
  };

  const removeHero = (heroId: string) => {
    const existing = props.selectedHeroes.find(sh => sh.hero.id === heroId);
    existing?.images.forEach(img => { if (img.preview.startsWith("blob:")) URL.revokeObjectURL(img.preview); });
    props.onSelectionChange(
      props.selectedHeroes.filter(sh => sh.hero.id !== heroId)
    );
    if (portraitPickerOpen() === heroId) setPortraitPickerOpen(null);
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
        if (updated[imgIndex].preview.startsWith("blob:")) URL.revokeObjectURL(updated[imgIndex].preview);
        updated.splice(imgIndex, 1);
        return { ...sh, images: updated };
      })
    );
  };

  // ── Portrait Picker ──────────────────────────────────────────────────────

  const openPortraitPicker = async (heroId: string, heroName: string) => {
    if (portraitPickerOpen() === heroId) {
      setPortraitPickerOpen(null);
      return;
    }
    setPortraitPickerOpen(heroId);
    setPortraitList([]);
    setPortraitLoading(true);
    try {
      const res = await fetch(`/api/hero-portraits?hero=${encodeURIComponent(heroName)}`);
      const data = await res.json();
      setPortraitList(data.portraits ?? []);
    } finally {
      setPortraitLoading(false);
    }
  };

  const addDefaultPortrait = async (heroId: string, heroName: string, portrait: PortraitItem) => {
    const sh = props.selectedHeroes.find(h => h.hero.id === heroId);
    if (!sh) return;
    if (sh.images.length >= MAX_IMAGES_PER_HERO) return;

    // Avoid duplicates
    if (sh.images.some(img => img.filename === portrait.filename && img.isDefault)) return;

    setAddingPortrait(portrait.filename);
    try {
      const res = await fetch("/api/hero-portraits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero: heroName, filename: portrait.filename }),
      });
      const data = await res.json();
      if (!data.base64Data) return;

      const newImage: HeroRefImage = {
        file: null,
        preview: portrait.url,
        base64Data: data.base64Data,
        mimeType: data.mimeType,
        isDefault: true,
        filename: portrait.filename,
      };

      props.onSelectionChange(
        props.selectedHeroes.map(s =>
          s.hero.id === heroId
            ? { ...s, images: [...s.images, newImage] }
            : s
        )
      );
    } finally {
      setAddingPortrait(null);
    }
  };

  const isPortraitAdded = (heroId: string, filename: string) => {
    const sh = props.selectedHeroes.find(h => h.hero.id === heroId);
    return sh?.images.some(img => img.isDefault && img.filename === filename) ?? false;
  };

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
              <img class="hero-avatar" src={`/icon/${hero.name}.png`} alt={hero.name} loading="lazy" />
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
                  <img class="hero-avatar" src={`/icon/${sh.hero.name}.png`} alt={sh.hero.name} style={{ width: "36px", height: "36px", "object-fit": "cover" }} />
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
                      <div class={`ref-image-thumb ${img.isDefault ? "is-default" : ""}`}>
                        <img src={img.preview} alt={`${sh.hero.name} ref ${index() + 1}`} />
                        <Show when={img.isDefault}>
                          <span class="default-badge">DEFAULT</span>
                        </Show>
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
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </Show>
                </div>

                {/* Default Portrait Picker */}
                <div class="portrait-picker-section">
                  <button
                    class={`portrait-picker-toggle ${portraitPickerOpen() === sh.hero.id ? "active" : ""}`}
                    onClick={() => openPortraitPicker(sh.hero.id, sh.hero.name)}
                    disabled={sh.images.length >= MAX_IMAGES_PER_HERO}
                    title={sh.images.length >= MAX_IMAGES_PER_HERO ? "Slot gambar penuh" : "Gunakan gambar default"}
                  >
                    <span class="portrait-picker-icon">🖼️</span>
                    Gunakan Gambar Default
                    <span class={`portrait-picker-arrow ${portraitPickerOpen() === sh.hero.id ? "open" : ""}`}>▾</span>
                  </button>

                  <Show when={portraitPickerOpen() === sh.hero.id}>
                    <div class="portrait-picker-panel">
                      <Show when={portraitLoading()}>
                        <div class="portrait-picker-loading">
                          <div class="portrait-spinner" />
                          <span>Memuat gambar...</span>
                        </div>
                      </Show>

                      <Show when={!portraitLoading() && portraitList().length === 0}>
                        <div class="portrait-picker-empty">
                          <span>Tidak ada gambar default tersedia untuk hero ini.</span>
                        </div>
                      </Show>

                      <Show when={!portraitLoading() && portraitList().length > 0}>
                        <div class="portrait-picker-hint">
                          Klik gambar untuk menambahkan ke referensi
                        </div>
                        <div class="portrait-picker-grid">
                          <For each={portraitList()}>
                            {(portrait) => {
                              const added = () => isPortraitAdded(sh.hero.id, portrait.filename);
                              const loading = () => addingPortrait() === portrait.filename;
                              return (
                                <button
                                  class={`portrait-item ${added() ? "added" : ""}`}
                                  onClick={() => !added() && addDefaultPortrait(sh.hero.id, sh.hero.name, portrait)}
                                  disabled={added() || loading() || sh.images.length >= MAX_IMAGES_PER_HERO}
                                  title={portrait.filename}
                                >
                                  <Show when={loading()}>
                                    <div class="portrait-item-overlay">
                                      <div class="portrait-spinner small" />
                                    </div>
                                  </Show>
                                  <Show when={added()}>
                                    <div class="portrait-item-overlay added-overlay">
                                      <span class="portrait-check">✓</span>
                                    </div>
                                  </Show>
                                  <img
                                    src={portrait.url}
                                    alt={portrait.filename}
                                    loading="lazy"
                                  />
                                  <span class="portrait-item-label">
                                    {portrait.filename.replace(/\.[^.]+$/, "")}
                                  </span>
                                </button>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                    </div>
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

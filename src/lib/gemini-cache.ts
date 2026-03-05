import { GoogleGenAI } from "@google/genai";

// ─────────────────────────────────────────────────────────────────────────────
// Cache Entry
// ─────────────────────────────────────────────────────────────────────────────

interface CacheEntry {
  cacheName: string;
  expiresAt: number; // Unix ms
}

// In-memory store: cacheKey → CacheEntry
const cacheStore = new Map<string, CacheEntry>();

// TTL untuk cache: 30 menit (dalam detik)
const CACHE_TTL_SECONDS = 30 * 60;

// Sentinel: jika disimpan, berarti caching tidak tersedia untuk key ini
const CACHE_SKIP_SENTINEL = "__SKIP__";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Membuat cache key unik berdasarkan prefix, model, dan hero names (opsional).
 * Key unik per kombinasi model + hero agar tidak terjadi cache mismatch saat switch model.
 */
export function buildCacheKey(prefix: string, heroNames?: string[], model?: string): string {
  let key = prefix;
  if (model) key += `::model=${model}`;
  if (heroNames && heroNames.length > 0) {
    const sorted = [...heroNames].sort().join("|");
    key += `::${sorted}`;
  }
  return key;
}

/**
 * Mengambil cache yang masih valid dari store, atau null jika expired/tidak ada.
 */
export function getCachedEntry(key: string): string | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;

  // Periksa apakah cache masih valid (dengan buffer 60 detik)
  if (Date.now() >= entry.expiresAt - 60_000) {
    cacheStore.delete(key);
    return null;
  }

  return entry.cacheName;
}

/**
 * Menyimpan cache entry ke in-memory store.
 */
export function setCacheEntry(key: string, cacheName: string): void {
  cacheStore.set(key, {
    cacheName,
    expiresAt: Date.now() + CACHE_TTL_SECONDS * 1000,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache Creation (with images support)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bagian gambar hero yang bisa di-cache.
 */
export interface CacheImagePart {
  inlineData: { mimeType: string; data: string };
}

/**
 * Membuat CachedContent baru via Gemini API.
 *
 * Meng-cache: system_instruction + (opsional) gambar hero.
 *
 * Arsitektur conversation ketika ada gambar:
 *   Cache:   systemInstruction
 *            + contents: [
 *                { role: "user",  parts: [gambar + label] },
 *                { role: "model", parts: [{ text: "Acknowledged..." }] }
 *              ]
 *   Request: contents: [{ role: "user", parts: [{ text: prompt }] }]
 *
 * Ini menghasilkan conversation valid: user → model → user
 *
 * Returns null jika cache tidak bisa dibuat (misal: terlalu kecil).
 */
async function createGeminiCache(params: {
  ai: GoogleGenAI;
  model: string;
  systemInstruction: string;
  imageParts?: CacheImagePart[];
  imageLabels?: string[];
}): Promise<string | null> {
  const { ai, model, systemInstruction, imageParts, imageLabels } = params;

  try {
    // Bangun config untuk cache
    const cacheConfig: Record<string, any> = {
      systemInstruction,
      ttl: `${CACHE_TTL_SECONDS}s`,
    };

    // Jika ada gambar, tambahkan sebagai conversation turn yang valid
    if (imageParts && imageParts.length > 0) {
      // User turn: gambar + label
      const userParts: object[] = [];
      for (let i = 0; i < imageParts.length; i++) {
        userParts.push(imageParts[i]);
        if (imageLabels && imageLabels[i]) {
          userParts.push({ text: imageLabels[i] });
        }
      }

      // Model turn: acknowledgement (membuat conversation structure valid)
      const heroCount = imageParts.length;
      const modelAck = `I have analyzed ${heroCount} reference image(s). I can see the character details, poses, expressions, and visual styles. I'm ready to process your request based on these references.`;

      cacheConfig.contents = [
        { role: "user", parts: userParts },
        { role: "model", parts: [{ text: modelAck }] },
      ];
    }

    const cache = await ai.caches.create({
      model,
      config: cacheConfig,
    });

    if (!cache.name) {
      console.warn("[Gemini Cache] Cache creation returned no name — falling back.");
      return null;
    }

    return cache.name;
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    // Handle "too small" error gracefully
    if (msg.includes("too small") || msg.includes("min_total_token_count")) {
      console.warn(`[Gemini Cache] Content too small for caching — using non-cached mode.`);
      return null;
    }
    // Handle free-tier / quota exhausted: caching not available
    if (
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("429") ||
      msg.includes("limit exceeded") ||
      msg.includes("FreeTier")
    ) {
      console.warn(`[Gemini Cache] Caching not available (quota/free-tier limit) — using non-cached mode.`);
      return null;
    }
    // Handle model not found or not supported for createCachedContent
    // (e.g. gemini-3.1-flash-lite is valid for generation but doesn't support caching)
    if (
      msg.includes("NOT_FOUND") ||
      msg.includes("404") ||
      msg.includes("not found") ||
      msg.includes("not supported for createCachedContent") ||
      msg.includes("is not supported")
    ) {
      console.warn(`[Gemini Cache] Model does not support caching — using non-cached mode.`);
      return null;
    }
    // Rethrow unexpected errors
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coba mendapatkan atau membuat cache.
 * Returns cache name, atau null jika caching tidak tersedia.
 *
 * @param params.imageParts  - Gambar hero (opsional) untuk di-cache bersama instruction
 * @param params.imageLabels - Label deskriptif per gambar (opsional)
 * @param params.heroNames   - Nama hero, digunakan untuk cache key unik per kombinasi
 */
export async function getOrCreateCache(params: {
  ai: GoogleGenAI;
  model: string;
  cacheKey: string;
  systemInstruction: string;
  imageParts?: CacheImagePart[];
  imageLabels?: string[];
}): Promise<string | null> {
  const { ai, model, cacheKey, systemInstruction, imageParts, imageLabels } = params;

  // Cek apakah sudah ada cache (atau sentinel skip)
  const existing = getCachedEntry(cacheKey);
  if (existing === CACHE_SKIP_SENTINEL) {
    return null;
  }
  if (existing) {
    console.log(`[Gemini Cache] ✅ Reusing cache: ${existing} (key: ${cacheKey})`);
    return existing;
  }

  // Coba buat cache baru
  const cacheName = await createGeminiCache({
    ai,
    model,
    systemInstruction,
    imageParts,
    imageLabels,
  });

  if (cacheName) {
    setCacheEntry(cacheKey, cacheName);
    console.log(`[Gemini Cache] 🆕 Created cache: ${cacheName} (key: ${cacheKey})`);
    return cacheName;
  }

  // Cache gagal → simpan sentinel
  setCacheEntry(cacheKey, CACHE_SKIP_SENTINEL);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Response Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ekstrak teks dari response Gemini secara aman.
 */
export function extractResponseText(response: any): string {
  // Jalur 1: response.text (getter di @google/genai v1.x)
  if (typeof response.text === "string" && response.text.length > 0) {
    return response.text;
  }

  // Jalur 2: akses eksplisit via candidates
  try {
    const candidate = response.candidates?.[0];
    if (candidate) {
      const finishReason = candidate.finishReason;
      if (finishReason && finishReason !== "STOP" && finishReason !== "1") {
        console.warn(`[Gemini] Response finishReason: ${finishReason}`);
      }

      const parts = candidate.content?.parts;
      if (Array.isArray(parts)) {
        return parts
          .filter((p: any) => typeof p.text === "string")
          .map((p: any) => p.text)
          .join("");
      }
    }
  } catch (e) {
    console.warn("[Gemini] Could not access response.candidates:", e);
  }

  return "";
}

/**
 * Bersihkan response teks dari markdown fences dan whitespace.
 */
export function cleanResponseText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }
  return cleaned.trim();
}

/**
 * Menghapus semua cache yang tersimpan di in-memory store dan memanggil API delete.
 */
export async function deleteAllCaches(ai: GoogleGenAI): Promise<void> {
  const deletions = [...cacheStore.entries()].map(async ([key, entry]) => {
    try {
      if (entry.cacheName !== CACHE_SKIP_SENTINEL) {
        await ai.caches.delete({ name: entry.cacheName });
      }
    } catch {
      // Abaikan error jika cache sudah expired
    }
    cacheStore.delete(key);
  });
  await Promise.allSettled(deletions);
}

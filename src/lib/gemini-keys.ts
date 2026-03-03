import { GoogleGenAI } from "@google/genai";

// =============================================================================
// Gemini API Key Manager — Free Tier → Tier 1 Fallback
// =============================================================================
// Selalu utamakan free tier. Jika error/limit, fallback ke tier 1.
// Setelah cooldown period, coba kembali ke free tier.

interface KeyState {
  key: string;
  tier: "free" | "paid";
  blockedUntil: number; // Unix ms — 0 means not blocked
}

// Cooldown: setelah free tier di-block, coba lagi setelah 60 detik
const FREE_TIER_COOLDOWN_MS = 60_000;

// Track state per key
let keyStates: KeyState[] | null = null;

/**
 * Inisialisasi key states dari env vars.
 * GEMINI_API_KEY_FREE → free tier (prioritas)
 * GEMINI_API_KEY_PAID → tier 1 (fallback)
 */
function initKeys(): KeyState[] {
  if (keyStates) return keyStates;

  const freeKey = process.env.GEMINI_API_KEY_FREE;
  const paidKey = process.env.GEMINI_API_KEY_PAID;

  // Fallback ke GEMINI_API_KEY lama jika variabel baru belum diset
  const legacyKey = process.env.GEMINI_API_KEY;

  const states: KeyState[] = [];

  if (freeKey) {
    states.push({ key: freeKey, tier: "free", blockedUntil: 0 });
  }

  if (paidKey) {
    states.push({ key: paidKey, tier: "paid", blockedUntil: 0 });
  }

  // Jika tidak ada key baru, gunakan legacy key sebagai free tier
  if (states.length === 0 && legacyKey) {
    states.push({ key: legacyKey, tier: "free", blockedUntil: 0 });
  }

  if (states.length === 0) {
    throw new Error(
      "No Gemini API keys configured. Set GEMINI_API_KEY_FREE and/or GEMINI_API_KEY_PAID in .env"
    );
  }

  keyStates = states;
  return states;
}

/**
 * Mendapatkan API key yang tersedia (prioritas: free → paid).
 * Returns the key string.
 */
export function getAvailableKey(): string {
  const states = initKeys();
  const now = Date.now();

  // Coba free tier dulu — jika cooldown sudah lewat, reset blockedUntil
  for (const state of states) {
    if (state.tier === "free" && state.blockedUntil > 0 && now >= state.blockedUntil) {
      state.blockedUntil = 0; // cooldown selesai, bisa dicoba lagi
      console.log("[Gemini Keys] 🔄 Free tier cooldown ended — retrying free tier");
    }
  }

  // Prioritas: free tier yang tidak blocked, lalu paid yang tidak blocked
  for (const state of states) {
    if (state.blockedUntil === 0 || now >= state.blockedUntil) {
      console.log(`[Gemini Keys] Using ${state.tier} tier key`);
      return state.key;
    }
  }

  // Semua key blocked — force gunakan paid jika ada, atau free
  const paidState = states.find(s => s.tier === "paid");
  if (paidState) {
    console.warn("[Gemini Keys] ⚠️ All keys appear blocked — forcing paid tier");
    return paidState.key;
  }

  // Semua key blocked dan hanya ada free — force free
  console.warn("[Gemini Keys] ⚠️ All keys appear blocked — forcing free tier");
  return states[0].key;
}

/**
 * Membuat GoogleGenAI instance dengan key yang tersedia.
 */
export function createGeminiClient(): GoogleGenAI {
  const apiKey = getAvailableKey();
  return new GoogleGenAI({ apiKey });
}

/**
 * Cek apakah error merupakan rate limit / quota error.
 */
export function isRateLimitError(error: any): boolean {
  const msg = error?.message ?? String(error);
  const status = error?.status ?? error?.statusCode ?? 0;

  return (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("Rate limit") ||
    msg.includes("limit exceeded") ||
    msg.includes("too many requests") ||
    msg.includes("Too Many Requests") ||
    msg.includes("FreeTier")
  );
}

/**
 * Tandai key sebagai blocked dan coba key berikutnya.
 * Returns new GoogleGenAI instance dengan key fallback, atau null jika tidak ada fallback.
 */
export function markKeyBlockedAndGetFallback(failedKey: string): GoogleGenAI | null {
  const states = initKeys();

  // Cari key yang gagal dan block
  for (const state of states) {
    if (state.key === failedKey) {
      state.blockedUntil = Date.now() + FREE_TIER_COOLDOWN_MS;
      console.warn(
        `[Gemini Keys] 🚫 ${state.tier} tier key blocked for ${FREE_TIER_COOLDOWN_MS / 1000}s`
      );
      break;
    }
  }

  // Cari key lain yang tidak blocked
  const now = Date.now();
  for (const state of states) {
    if (state.key !== failedKey && (state.blockedUntil === 0 || now >= state.blockedUntil)) {
      console.log(`[Gemini Keys] 🔄 Falling back to ${state.tier} tier key`);
      return new GoogleGenAI({ apiKey: state.key });
    }
  }

  return null; // Tidak ada key fallback yang tersedia
}

/**
 * Higher-order function: jalankan operasi Gemini dengan auto-fallback.
 * Jika operasi gagal karena rate limit, otomatis retry dengan key berikutnya.
 */
export async function withKeyFallback<T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const ai = createGeminiClient();
  const currentKey = getAvailableKey();

  try {
    return await operation(ai);
  } catch (error: any) {
    if (isRateLimitError(error)) {
      console.warn(`[Gemini Keys] Rate limit hit — attempting fallback...`);

      const fallbackAi = markKeyBlockedAndGetFallback(currentKey);
      if (fallbackAi) {
        console.log(`[Gemini Keys] ✅ Retrying with fallback key...`);
        return await operation(fallbackAi);
      }

      console.error(`[Gemini Keys] ❌ No fallback key available`);
    }

    // Re-throw jika bukan rate limit atau tidak ada fallback
    throw error;
  }
}

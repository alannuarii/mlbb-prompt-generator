import { GoogleGenAI } from "@google/genai";

// =============================================================================
// Gemini API Key Manager — Single Key
// =============================================================================

let cachedKey: string | null = null;

/**
 * Mendapatkan API key dari environment variable MLBB_GEMINI_API_KEY.
 */
function getApiKey(): string {
  if (cachedKey) return cachedKey;

  const apiKey = process.env.MLBB_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "No Gemini API key configured. Set MLBB_GEMINI_API_KEY in .env"
    );
  }

  cachedKey = apiKey;
  return apiKey;
}

/**
 * Mendapatkan API key yang tersedia.
 * Returns the key string.
 */
export function getAvailableKey(): string {
  return getApiKey();
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
    msg.includes("Too Many Requests")
  );
}

/**
 * Tandai key sebagai blocked dan coba key berikutnya.
 * Karena hanya ada satu key, selalu return null (tidak ada fallback).
 */
export function markKeyBlockedAndGetFallback(failedKey: string): GoogleGenAI | null {
  console.warn(`[Gemini Keys] 🚫 API key rate limited — no fallback available`);
  return null;
}

/**
 * Higher-order function: jalankan operasi Gemini dengan auto-retry.
 * Karena hanya ada satu key, tidak ada fallback — langsung throw error.
 */
export async function withKeyFallback<T>(
  operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> {
  const ai = createGeminiClient();

  try {
    return await operation(ai);
  } catch (error: any) {
    if (isRateLimitError(error)) {
      console.error(`[Gemini Keys] ❌ Rate limit hit — no fallback key available`);
    }

    throw error;
  }
}

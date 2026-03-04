import type { APIEvent } from "@solidjs/start/server";
import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";

const isProd = process.env.NODE_ENV === "production";
const PORTRAIT_BASE = isProd 
  ? join(process.cwd(), ".output", "public", "portrait")
  : join(process.cwd(), "public", "portrait");
const ALLOWED_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

/**
 * GET /api/hero-portraits?hero=Layla
 * Returns list of available portrait image paths for the given hero.
 * Response: { portraits: { filename: string; url: string }[] }
 */
export async function GET(event: APIEvent) {
  const url = new URL(event.request.url);
  const heroName = url.searchParams.get("hero");

  if (!heroName) {
    return json({ error: "Missing 'hero' query param" }, 400);
  }

  const heroDir = join(PORTRAIT_BASE, heroName);

  try {
    const files = await readdir(heroDir);
    const portraits = files
      .filter((f) => ALLOWED_EXTS.has(extname(f).toLowerCase()))
      .map((filename) => ({
        filename,
        // Public URL accessible by browser
        url: `/portrait/${encodeURIComponent(heroName)}/${encodeURIComponent(filename)}`,
      }));

    return json({ portraits });
  } catch {
    // Folder doesn't exist or not accessible → no portraits available
    return json({ portraits: [] });
  }
}

/**
 * POST /api/hero-portraits
 * Body: { hero: string; filename: string }
 * Returns base64-encoded image data for the requested portrait file.
 * Response: { base64Data: string; mimeType: string }
 */
export async function POST(event: APIEvent) {
  try {
    const body = await new Response(event.request.body).json();
    const { hero, filename } = body;

    if (!hero || !filename) {
      return json({ error: "Missing 'hero' or 'filename'" }, 400);
    }

    // Security: prevent path traversal
    if (hero.includes("..") || filename.includes("..")) {
      return json({ error: "Invalid path" }, 400);
    }

    const ext = extname(filename).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      return json({ error: "File type not allowed" }, 400);
    }

    const filePath = join(PORTRAIT_BASE, hero, filename);
    const buffer = await readFile(filePath);
    const base64Data = buffer.toString("base64");

    const mimeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };

    return json({ base64Data, mimeType: mimeMap[ext] ?? "image/png" });
  } catch (err: any) {
    return json({ error: err.message ?? "Failed to read portrait" }, 500);
  }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

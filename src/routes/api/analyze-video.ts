import type { APIEvent } from "@solidjs/start/server";
import { analyzeReferenceVideo } from "../../lib/gemini-react";

export async function POST(event: APIEvent) {
  try {
    const body = await new Response(event.request.body).json();

    const { videoBase64, videoMimeType, modelName } = body;

    if (!videoBase64 || !videoMimeType) {
      return new Response(
        JSON.stringify({ error: "Video file is required (base64 + mimeType)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate mime type
    const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];
    if (!allowedTypes.includes(videoMimeType)) {
      return new Response(
        JSON.stringify({ error: `Unsupported video format: ${videoMimeType}. Allowed: MP4, WebM, MOV, MKV` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check approximate size (base64 is ~33% larger than binary)
    const approxSizeMB = (videoBase64.length * 3) / 4 / 1024 / 1024;
    if (approxSizeMB > 20) {
      return new Response(
        JSON.stringify({ error: `Video too large (~${approxSizeMB.toFixed(1)}MB). Max 20MB.` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[Analyze Video] Processing video (${approxSizeMB.toFixed(1)}MB, ${videoMimeType})`);

    const result = await analyzeReferenceVideo({
      videoBase64,
      videoMimeType,
      modelName: modelName || undefined,
    });

    return new Response(
      JSON.stringify({ result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Analyze Video API error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "Failed to analyze video. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

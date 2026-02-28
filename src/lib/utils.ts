/**
 * Convert a File object to a Base64 data string (browser-side).
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix to get raw Base64
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get the MIME type from a File object.
 */
export function getMimeType(file: File): string {
  return file.type || "image/webp";
}

/**
 * Format JSON with syntax highlighting for display (returns HTML).
 */
export function formatJsonForDisplay(json: string): string {
  try {
    const parsed = JSON.parse(json);
    const formatted = JSON.stringify(parsed, null, 2);
    return formatted;
  } catch {
    return json;
  }
}

/**
 * Generate a human-readable description from the JSON prompt output.
 */
export function jsonToDescription(jsonStr: string): string {
  try {
    const data = JSON.parse(jsonStr);

    const sections: string[] = [];

    if (data.video_prompt) {
      sections.push(`### Video Prompt\n${data.video_prompt}`);
    }

    if (data.prompt || data.main_prompt) {
      sections.push(`### Main Prompt\n${data.prompt || data.main_prompt}`);
    }

    if (data.negative_prompt) {
      sections.push(`### Negative Prompt\n${data.negative_prompt}`);
    }

    if (data.face_preservation) {
      const fp = data.face_preservation;
      const fpLines = [
        fp.hair_color ? `- **Hair Color**: ${fp.hair_color}` : null,
        fp.hairstyle ? `- **Hairstyle**: ${fp.hairstyle}` : null,
        fp.face_shape ? `- **Face Shape**: ${fp.face_shape}` : null,
        fp.eye_color ? `- **Eye Color**: ${fp.eye_color}` : null,
        fp.skin_tone ? `- **Skin Tone**: ${fp.skin_tone}` : null,
        fp.distinguishing_features ? `- **Distinguishing Features**: ${fp.distinguishing_features}` : null,
      ].filter(Boolean).join("\n");
      if (fpLines) sections.push(`### Face Preservation\n${fpLines}`);
    }

    if (data.attribute_mode) {
      const modeLabel = data.attribute_mode === "full-attribute" ? "Full Attribute (kostum/armor asli dalam bentuk realistic)" : "Custom Outfit (pakaian sesuai skenario)";
      sections.push(`### Attribute Mode\n${modeLabel}`);
    }

    if (data.characters && Array.isArray(data.characters)) {
      const charDescriptions = data.characters
        .map((c: any) => `- **${c.name || "Character"}**: ${c.realistic_description || c.description || c.appearance || "N/A"}`)
        .join("\n");
      sections.push(`### Characters\n${charDescriptions}`);
    }

    if (data.scene || data.environment || data.background) {
      sections.push(`### Scene\n${data.scene || data.environment || data.background}`);
    }

    if (data.lighting) {
      sections.push(`### Lighting\n${data.lighting}`);
    }

    if (data.camera || data.camera_angle) {
      sections.push(`### Camera\n${data.camera || data.camera_angle}`);
    }

    if (data.quality || data.quality_tags) {
      const q = Array.isArray(data.quality || data.quality_tags)
        ? (data.quality || data.quality_tags).join(", ")
        : data.quality || data.quality_tags;
      sections.push(`### Quality Parameters\n${q}`);
    }

    if (data.aspect_ratio) {
      sections.push(`### Aspect Ratio\n${data.aspect_ratio}`);
    }

    // Video-specific fields
    if (data.camera_movement) {
      const cm = data.camera_movement;
      const cmText = typeof cm === "string" ? cm : `**${cm.type || "N/A"}** — ${cm.description || ""}`;
      sections.push(`### Camera Movement\n${cmText}`);
    }

    if (data.character_animation && Array.isArray(data.character_animation)) {
      const anims = data.character_animation
        .map((a: any) => `- **${a.name || "Character"}**: ${a.motion || "N/A"}`)
        .join("\n");
      sections.push(`### Character Animation\n${anims}`);
    }

    if (data.environment_animation) {
      sections.push(`### Environment Animation\n${data.environment_animation}`);
    }

    if (data.duration) {
      sections.push(`### Duration\n${data.duration}`);
    }

    if (data.motion_intensity) {
      sections.push(`### Motion Intensity\n${data.motion_intensity}`);
    }

    if (data.sound_design_suggestion) {
      sections.push(`### Sound Design\n${data.sound_design_suggestion}`);
    }

    if (sections.length === 0) {
      // Fallback: just describe all top-level keys
      for (const [key, value] of Object.entries(data)) {
        const title = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
        const val = typeof value === "string" ? value : JSON.stringify(value, null, 2);
        sections.push(`### ${title}\n${val}`);
      }
    }

    return sections.join("\n\n");
  } catch {
    return "Unable to parse the JSON output into a description.";
  }
}

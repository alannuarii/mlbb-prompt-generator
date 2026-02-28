import { createSignal, Show } from "solid-js";
import { formatJsonForDisplay, jsonToDescription } from "../lib/utils";

interface ResultDisplayProps {
  result: string;
  loading: boolean;
  error: string;
}

export default function ResultDisplay(props: ResultDisplayProps) {
  const [activeTab, setActiveTab] = createSignal<"json" | "description">("json");
  const [copied, setCopied] = createSignal(false);

  const formattedJson = () => {
    if (!props.result) return "";
    return formatJsonForDisplay(props.result);
  };

  const description = () => {
    if (!props.result) return "";
    return jsonToDescription(props.result);
  };

  const copyToClipboard = async () => {
    try {
      const textToCopy = activeTab() === "json" ? formattedJson() : description();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div class="result-section glass-panel">
      <div class="section-title">
        <span class="icon">✨</span>
        Generated Prompt
      </div>

      {/* Tabs */}
      <div class="result-tabs">
        <button
          class={`result-tab ${activeTab() === "json" ? "active" : ""}`}
          onClick={() => setActiveTab("json")}
        >
          JSON Prompt
        </button>
        <button
          class={`result-tab ${activeTab() === "description" ? "active" : ""}`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </button>
      </div>

      {/* Content Area */}
      <div class="result-content">
        {/* Copy button */}
        <Show when={props.result && !props.loading}>
          <button
            class={`copy-btn ${copied() ? "copied" : ""}`}
            onClick={copyToClipboard}
          >
            {copied() ? "✓ Copied!" : "Copy"}
          </button>
        </Show>

        {/* Loading State */}
        <Show when={props.loading}>
          <div class="loading-indicator">
            <div class="loading-spinner" />
            <span class="loading-text">Generating cinematic prompt with Gemini AI...</span>
          </div>
        </Show>

        {/* Error State */}
        <Show when={props.error && !props.loading}>
          <div style={{ padding: "24px" }}>
            <div class="error-message">
              <span>⚠️</span>
              {props.error}
            </div>
          </div>
        </Show>

        {/* Empty State */}
        <Show when={!props.result && !props.loading && !props.error}>
          <div class="result-empty">
            <span class="icon">🎬</span>
            <p>Your cinematic prompt will appear here</p>
          </div>
        </Show>

        {/* Result: JSON tab */}
        <Show when={props.result && !props.loading && activeTab() === "json"}>
          <pre class="result-json">{formattedJson()}</pre>
        </Show>

        {/* Result: Description tab */}
        <Show when={props.result && !props.loading && activeTab() === "description"}>
          <div class="result-description" innerHTML={renderMarkdown(description())} />
        </Show>
      </div>
    </div>
  );
}

/**
 * Simple markdown renderer for h3, bold, and list items.
 * Processes headings before paragraph splits to avoid empty <p> gaps.
 */
function renderMarkdown(md: string): string {
  return md
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // List items
    .replace(/^- (.+)/gm, "<li>$1</li>")
    .replace(/(<li>[\s\S]*?<\/li>)/g, "<ul>$1</ul>")
    // Headings — strip blank lines immediately after them
    .replace(/### (.+)\n*/g, "</p><h3>$1</h3><p>")
    // Remaining double newlines become paragraph breaks
    .replace(/\n\n/g, "</p><p>")
    // Single newlines become <br>
    .replace(/\n/g, "<br/>")
    // Wrap in outer paragraph, clean up empty <p> tags
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<p>\s*<h3>/g, "<h3>")
    .replace(/<\/h3>\s*<p>/g, "</h3><p>")
    .replace(/<\/h3><p><\/p>/g, "</h3>");
}

/**
 * Plain-text serialisation of a NotesPayload.
 *
 * Used by the Notes UI for copy-to-clipboard and as the readable source for the
 * print/PDF export. Since the note-generator re-architecture the payload body is
 * already Markdown, so this simply returns it verbatim plus a sources footer.
 *
 * Intentionally free of React and icon dependencies so it stays trivially
 * testable and isomorphic. No CAIE content is authored here — everything is
 * taken verbatim from the API payload, which is grounded in the retrieved
 * knowledge base.
 */

import type { NoteCitation, NotesPayload } from "@/lib/notes/types";

function formatCitation(citation: NoteCitation, index: number): string {
  const details = [
    citation.category,
    citation.paperCode,
    citation.session,
    citation.year != null ? String(citation.year) : null,
  ].filter((part): part is string => typeof part === "string" && part.length > 0);

  const similarity =
    typeof citation.similarity === "number"
      ? ` (match ${Math.round(citation.similarity * 100)}%)`
      : "";

  const suffix = details.length > 0 ? ` — ${details.join(", ")}` : "";
  return `[${citation.id ?? `c${index + 1}`}] ${citation.title}${suffix}${similarity}`;
}

/**
 * Strip inline citation markers (e.g. [1], [c2], [c12]) and any trailing
 * whitespace left behind so the exported text is clean.
 */
function stripInlineCitations(text: string): string {
  return text
    .replace(/\[\d+\]/g, "")
    .replace(/\[c\d+\]/g, "")
    .replace(/[ \t]+$/gm, "");
}

/**
 * Render the payload as clean, copy-friendly plain text containing ONLY the
 * generated notes body — no source references, no file-path metadata, no
 * retrieved_sources arrays. Falls back to the header + notice when no grounded
 * notes could be produced.
 *
 * Both copy-to-clipboard and PDF/print export call this function, so stripping
 * here keeps all export paths clean without touching UI components.
 */
export function serialiseNotesToText(payload: NotesPayload): string {
  const lines: string[] = [];
  const markdown = payload.markdown?.trim() ?? "";

  if (payload.insufficientContext || markdown.length === 0) {
    lines.push(`${payload.subjectName} (${payload.subject}) — CAIE Revision Notes`);
    lines.push(`Paper: ${payload.paperCode} • Topic: ${payload.topicLabel}`);
    lines.push("", payload.notice?.trim() || "No grounded notes available.");
  } else {
    // Strip inline citation markers before exporting.
    lines.push(stripInlineCitations(markdown));
  }

  // Sources / citations are intentionally excluded from copy & PDF output.
  return lines.join("\n");
}

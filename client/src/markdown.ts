// A small, dependency-free markdown-lite renderer. All user content is HTML-escaped
// first, so the markup we splice in afterward is the only HTML that ever reaches the DOM.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderMarkdownLite(content: string): string {
  let html = escapeHtml(content);

  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>");
  html = html.replace(/^- (.*)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // [[wiki links]] and #tags become clickable spans, resolved against the graph by the caller.
  html = html.replace(
    /\[\[([^\]]+)\]\]/g,
    (_match, title) => `<span class="rendered-link" data-link-title="${title.trim()}">${title.trim()}</span>`
  );
  html = html.replace(
    /#([a-zA-Z][a-zA-Z0-9_-]*)/g,
    (_match, tag) => `<span class="rendered-tag" data-tag="${tag.toLowerCase()}">#${tag}</span>`
  );

  html = html.replace(/\n/g, "<br/>");
  return html;
}

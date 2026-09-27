// Small markdown helper for club posts.
// Supports the handful of bits people actually type on a wall.

function escapeHtml(src) {
  return String(src ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Only allow links we trust: http(s), mailto, and site-relative paths.
// Anything else (javascript:, data:, etc.) collapses to a harmless "#".
function safeHref(url) {
  const trimmed = String(url ?? "").trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^mailto:/i.test(trimmed)) return trimmed;
  if (/^\/[^/]/.test(trimmed)) return trimmed; // e.g. /mod, but not //evil.com
  return "#";
}

function renderMarkdown(src) {
  // Escape everything up front, so no raw HTML from the user survives.
  // Every tag below is added AFTER escaping, so those are the only real tags.
  const text = escapeHtml(src);

  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, url) =>
      `<a href="${safeHref(url)}">${label}</a>`)
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/\n/g, "<br>");
}

module.exports = { renderMarkdown };

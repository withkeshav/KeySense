

/* HTML escaping, in one place.
 *
 * These used to be declared twice: path-recovery.js had a version that escaped
 * apostrophes and tree-inspector.js had one that did not. Classic scripts share
 * a single global scope and tree-inspector loaded second, so the weaker copy
 * silently replaced the stronger one for both files. Keeping one definition in
 * a file loaded before either of them removes that load-order hazard entirely.
 *
 * Prefer building DOM nodes and setting textContent where practical. These are
 * for the places that still assemble HTML strings. */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* escapeHtml already covers the apostrophe, so this exists only so call sites
 * can say what they mean at the point of use. */
function escapeAttr(str) {
  return escapeHtml(str);
}

/**
 * Parse alternative_names_zh string into visible/hidden slices.
 * @param {string|null} altStr - comma-separated alternative names
 * @param {number} max - max visible names (default 2)
 * @returns {{ visible: string[], hidden: string[], total: number }}
 */
export function parseAltNames(altStr, max = 2) {
  if (!altStr) return { visible: [], hidden: [], total: 0 };
  const all = altStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  return {
    visible: all.slice(0, max),
    hidden: all.slice(max),
    total: all.length,
  };
}

/**
 * Format alt names as inline parenthetical text.
 * e.g. "（綿羊）" or "（綠海龜、海龜 +3）"
 * @param {string|null} altStr
 * @param {number} max
 * @returns {string} formatted string or empty
 */
export function formatAltNamesInline(altStr, max = 2) {
  const { visible, hidden } = parseAltNames(altStr, max);
  if (visible.length === 0) return '';
  let text = visible.join('、');
  if (hidden.length > 0) text += ` +${hidden.length}`;
  return `（${text}）`;
}

/**
 * Format all alt names as a full parenthetical string (no truncation).
 * e.g. "（家綿羊、綿羊、羊）"
 * @param {string|null} altStr
 * @returns {string} formatted string or empty
 */
export function formatAltNamesFull(altStr) {
  if (!altStr) return '';
  const all = altStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  if (all.length === 0) return '';
  return all.join('、');
}

/**
 * Get full alt names string for tooltip.
 * @param {string|null} altStr
 * @returns {string}
 */
export function altNamesTooltip(altStr) {
  if (!altStr) return '';
  const all = altStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  return `俗名：${all.join('、')}`;
}

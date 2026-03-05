/**
 * Flag SVG images for canvas rendering.
 * Resolves Vite-processed SVG URLs from the already-loaded flag-icons CSS,
 * then loads them as HTMLImageElement for ctx.drawImage().
 * Zero additional bundle cost — reuses the CSS that main.jsx already imports.
 */

const imageCache = new Map();

// Probe element reused across calls (hidden off-screen)
let _probe = null;
function getProbe() {
  if (!_probe) {
    _probe = document.createElement('span');
    _probe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;pointer-events:none;';
    document.body.appendChild(_probe);
  }
  return _probe;
}

/**
 * Get an HTMLImageElement for the given country code (for canvas drawImage).
 * Reads the background-image URL from flag-icons CSS via a hidden probe element.
 * @param {string} code - ISO 3166-1 alpha-2 country code (e.g. 'TW', 'jp')
 * @returns {HTMLImageElement|null}
 */
export function getFlagImage(code) {
  const lc = code.toLowerCase();
  if (imageCache.has(lc)) return imageCache.get(lc);

  const probe = getProbe();
  probe.className = `fi fi-${lc}`;

  // Force style recalc
  const bgUrl = window.getComputedStyle(probe).backgroundImage;
  const match = bgUrl?.match(/url\("([^"]+)"\)/);
  if (!match || !match[1]) {
    imageCache.set(lc, null);
    return null;
  }

  const img = new Image();
  img.src = match[1];
  imageCache.set(lc, img);
  return img;
}

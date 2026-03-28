/**
 * Flag SVG images for canvas rendering.
 * Resolves Vite-processed SVG URLs from the already-loaded flag-icons CSS,
 * then loads them as HTMLImageElement for ctx.drawImage().
 */

const imageCache = new Map<string, HTMLImageElement | null>();

let _probe: HTMLSpanElement | null = null;
function getProbe(): HTMLSpanElement {
  if (!_probe) {
    _probe = document.createElement('span');
    _probe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;pointer-events:none;';
    document.body.appendChild(_probe);
  }
  return _probe;
}

export function getFlagImage(code: string): HTMLImageElement | null {
  const lc = code.toLowerCase();
  if (imageCache.has(lc)) return imageCache.get(lc)!;

  const probe = getProbe();
  probe.className = `fi fi-${lc}`;

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

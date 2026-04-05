/**
 * Pure Canvas 2D rendering functions for the taxonomy graph.
 * No React — just ctx drawing calls.
 *
 * This file is a barrel re-export for backward compatibility.
 * Actual implementations live in ./renderers/ submodules.
 */
export {
  drawGraph,
  createStarField,
  taxonomyNodeRadius,
  collapsedRectWeight,
  hexToRgba,
  isInViewport,
  scaledFontSize,
  fontStr,
  edgeFlashAlpha,
} from './renderers/index';

export type { DrawGraphState, Viewport } from './renderers/index';

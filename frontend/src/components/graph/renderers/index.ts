/**
 * Pure Canvas 2D rendering functions for the taxonomy graph.
 * No React — just ctx drawing calls.
 *
 * Re-exports the public API from submodules.
 */

// Types
export type { DrawGraphState, Viewport } from './types';

// Main entry
export { drawGraph } from './draw-graph';

// Utilities (used by external hit-testing code)
export { taxonomyNodeRadius, collapsedRectWeight, hexToRgba, isInViewport, scaledFontSize, fontStr, edgeFlashAlpha } from './utils';

// Star field
export { createStarField } from './star-field';

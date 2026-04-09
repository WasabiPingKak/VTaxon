/**
 * Tree utilities barrel export.
 * All public API is re-exported here for consumers.
 */

export { stripAuthor } from './treeCore';
export { buildTree, buildFictionalTree } from './treeBuild';
export {
  entryToVtuberPathKey,
  computeHighlightPaths,
  collectAllPaths,
  collectPathsToDepth,
  collectFictionalPathsToDepth,
  computeFictionalHighlightPaths,
  collectAllFictionalPaths,
} from './treePaths';
export {
  BUDGET_TIER_DOT,
  BUDGET_TIER_HIDDEN,
  SPLIT_GROUP_MAX,
  hashUserId,
  getVisualTier,
  subtreeHasNormalUser,
} from './treeVisual';
export {
  autoExpandPaths,
  autoExpandPathsUnfiltered,
  extendSingleChildChains,
  expandAllSingleChildChains,
} from './treeExpand';
export { findNode } from './treeFind';
export {
  computeCloseVtubers,
  collectCloseVtuberPaths,
  computeCloseVtubersByRank,
  computeCloseEdgePaths,
  computeCloseFictionalVtubers,
  computeCloseFictionalVtubersByRank,
  computeCloseFictionalEdgePaths,
  collectCloseFictionalVtuberPaths,
} from './treeClose';

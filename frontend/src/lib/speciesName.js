/**
 * Return the preferred scientific name for display.
 *
 * If the backend provides a `display_name_override` (e.g. Otocolobus manul
 * instead of GBIF's accepted Felis manul), use that.  Otherwise fall back to
 * `canonical_name` → `scientific_name`.
 *
 * Works with both search-result dicts and nested `trait.species` objects.
 */
export function displayScientificName(sp) {
  if (!sp) return '';
  return sp.display_name_override || sp.canonical_name || sp.scientific_name || '';
}

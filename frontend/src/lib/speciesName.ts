/**
 * Return the preferred scientific name for display.
 */
export function displayScientificName(sp: { display_name_override?: string | null; canonical_name?: string; scientific_name?: string } | null): string {
  if (!sp) return '';
  return sp.display_name_override || sp.canonical_name || sp.scientific_name || '';
}

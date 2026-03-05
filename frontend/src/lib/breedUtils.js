// Shared emoji mapping for breed categories

// Family-level emoji mapping
const BREED_EMOJI_MAP = {
  'Canidae': '\uD83D\uDC15',    // dog
  'Felidae': '\uD83D\uDC08',    // cat
  'Equidae': '\uD83D\uDC34',    // horse
  'Leporidae': '\uD83D\uDC30',  // rabbit
  'Caviidae': '\uD83D\uDC39',   // guinea pig
};

// Species-level overrides (taxon_id → emoji) for same-family species
const BREED_EMOJI_TAXON = {
  2441022: '\uD83D\uDC02',  // cattle (Bos taurus)
  2441110: '\uD83D\uDC11',  // sheep (Ovis aries)
  2441056: '\uD83D\uDC10',  // goat (Capra hircus)
  7342: '\uD83D\uDC16',     // pig (Sus scrofa)
  2473921: '\uD83D\uDC14',  // chicken (Gallus gallus)
};

export function breedEmoji(category) {
  if (BREED_EMOJI_TAXON[category.taxon_id]) return BREED_EMOJI_TAXON[category.taxon_id];
  if (category.family && BREED_EMOJI_MAP[category.family]) return BREED_EMOJI_MAP[category.family];
  return '\uD83D\uDC3E'; // fallback: paw prints
}

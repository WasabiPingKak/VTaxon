const SIGNS = [
  ['摩羯座', '♑'], ['水瓶座', '♒'], ['雙魚座', '♓'],
  ['牡羊座', '♈'], ['金牛座', '♉'], ['雙子座', '♊'],
  ['巨蟹座', '♋'], ['獅子座', '♌'], ['處女座', '♍'],
  ['天秤座', '♎'], ['天蠍座', '♏'], ['射手座', '♐'],
];
const CUTOFFS = [20, 19, 21, 20, 21, 21, 23, 23, 23, 23, 22, 22];

export function getZodiacSign(month, day) {
  if (!month || !day) return null;
  const m = parseInt(month), d = parseInt(day);
  if (isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const idx = d >= CUTOFFS[m - 1] ? m % 12 : (m - 1) % 12;
  return { name: SIGNS[idx][0], emoji: SIGNS[idx][1] };
}

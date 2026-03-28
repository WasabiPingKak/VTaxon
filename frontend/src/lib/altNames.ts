interface ParsedAltNames {
  visible: string[];
  hidden: string[];
  total: number;
}

export function parseAltNames(altStr: string | null | undefined, max = 2): ParsedAltNames {
  if (!altStr) return { visible: [], hidden: [], total: 0 };
  const all = altStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  return {
    visible: all.slice(0, max),
    hidden: all.slice(max),
    total: all.length,
  };
}

export function formatAltNamesInline(altStr: string | null | undefined, max = 2): string {
  const { visible, hidden } = parseAltNames(altStr, max);
  if (visible.length === 0) return '';
  let text = visible.join('、');
  if (hidden.length > 0) text += ` +${hidden.length}`;
  return `（${text}）`;
}

export function formatAltNamesFull(altStr: string | null | undefined): string {
  if (!altStr) return '';
  const all = altStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  if (all.length === 0) return '';
  return all.join('、');
}

export function altNamesTooltip(altStr: string | null | undefined): string {
  if (!altStr) return '';
  const all = altStr.split(/[,，]/).map(s => s.trim()).filter(Boolean);
  return `俗名：${all.join('、')}`;
}

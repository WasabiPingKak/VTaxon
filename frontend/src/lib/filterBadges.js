/**
 * Filter badge configuration and helper for displaying active filter labels
 * on VtuberCard and graph vtuber nodes.
 */

export const FILTER_BADGES = {
  country: null, // handled specially — uses flag-icons CSS (React) or flag SVG images (canvas)
  gender: {
    '男':    { label: '♂男', color: '#60a5fa', bg: 'rgba(96,165,250,0.2)' },
    '女':    { label: '♀女', color: '#f472b6', bg: 'rgba(244,114,182,0.2)' },
    other:   { label: '⚧自訂', color: '#c084fc', bg: 'rgba(192,132,252,0.2)' },
    unset:   { label: '?性別', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' },
  },
  status: {
    active:    { label: '活躍', color: '#34d399', bg: 'rgba(52,211,153,0.2)' },
    hiatus:    { label: '休止', color: '#fbbf24', bg: 'rgba(251,191,36,0.2)' },
    preparing: { label: '準備', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' },
    unset:     { label: '未設定', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' },
  },
  org_type: {
    corporate: { label: '企業', color: '#fb923c', bg: 'rgba(251,146,60,0.2)' },
    indie:     { label: '個人', color: '#38bdf8', bg: 'rgba(56,189,248,0.2)' },
    club:      { label: '社團', color: '#a78bfa', bg: 'rgba(167,139,250,0.2)' },
  },
  platform: {
    youtube: { label: 'YT', color: '#FF0000', bg: 'rgba(255,0,0,0.15)', isPlatform: true, platform: 'youtube' },
    twitch:  { label: 'TW', color: '#9146FF', bg: 'rgba(145,70,255,0.15)', isPlatform: true, platform: 'twitch' },
  },
};

/**
 * Compute the entry's value for a given filter dimension.
 */
function entryValue(entry, dim) {
  switch (dim) {
    case 'gender': {
      const raw = entry.gender;
      return !raw ? 'unset' : (raw === '男' || raw === '女') ? raw : 'other';
    }
    case 'status':
      return entry.activity_status || 'unset';
    case 'org_type':
      return entry.org_type || (entry.organization ? 'corporate' : 'indie');
    case 'platform':
      return entry.platforms || [];
    default:
      return null;
  }
}

/**
 * Given an entry and the current active filters, return an array of badge objects
 * that should be displayed on this entry's card/node.
 * Only returns badges for dimensions that have active selections.
 *
 * @param {Object} entry - vtuber entry data
 * @param {Object} filters - { country: Set, gender: Set, status: Set, org_type: Set, platform: Set }
 * @returns {Array<{ label: string, color: string, bg: string }>}
 */
export function getActiveFilterBadges(entry, filters) {
  if (!filters) return [];
  const badges = [];

  for (const dim of Object.keys(filters)) {
    const selected = filters[dim];
    if (!selected || selected.size === 0) continue;

    if (dim === 'country') {
      // Country: show matching flag badges (rendered via flag-icons CSS in React, SVG images in canvas)
      const flags = (entry.country_flags || []).map(f => f.toUpperCase());
      for (const code of flags) {
        if (selected.has(code)) {
          badges.push({
            isCountry: true,
            countryCode: code,
            bg: 'rgba(255,255,255,0.1)',
          });
        }
      }
      if (selected.has('none') && flags.length === 0) {
        badges.push({
          isCountry: true,
          label: '--',
          color: 'rgba(255,255,255,0.4)',
          bg: 'rgba(255,255,255,0.08)',
        });
      }
    } else if (dim === 'platform') {
      // Platform is multi-value
      const platforms = entry.platforms || [];
      for (const p of platforms) {
        if (selected.has(p)) {
          const badge = FILTER_BADGES.platform?.[p];
          if (badge) badges.push(badge);
        }
      }
    } else {
      // Single-value dimensions
      const val = entryValue(entry, dim);
      if (val !== null && selected.has(val)) {
        const badge = FILTER_BADGES[dim]?.[val];
        if (badge) badges.push(badge);
      }
    }
  }

  return badges;
}

/**
 * Compute a sort-related badge for display when sorting by date fields.
 * - debut_date → activity duration (e.g. "1年2個月")
 * - created_at → relative time ago (e.g. "3天前", "2月前")
 *
 * @param {Object} entry - vtuber entry data
 * @param {string} sortKey - current sort key
 * @returns {{ label: string, color: string, bg: string } | null}
 */
export function getSortBadge(entry, sortKey) {
  if (sortKey === 'country') {
    const flags = entry.country_flags || [];
    if (flags.length === 0) return { label: '無國旗', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' };
    return flags.map(code => ({
      isCountry: true,
      countryCode: code.toUpperCase(),
      bg: 'rgba(255,255,255,0.1)',
    }));
  }

  if (sortKey === 'organization') {
    const ot = entry.org_type || (entry.organization ? 'corporate' : 'indie');
    const badge = FILTER_BADGES.org_type[ot];
    return badge || { label: '個人', color: '#38bdf8', bg: 'rgba(56,189,248,0.2)' };
  }

  if (sortKey === 'debut_date') {
    const raw = entry.debut_date;
    if (!raw) return { label: '未設定', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' };
    const debut = new Date(raw);
    const now = new Date();
    let years = now.getFullYear() - debut.getFullYear();
    let months = now.getMonth() - debut.getMonth();
    if (months < 0) { years--; months += 12; }
    const parts = [];
    if (years > 0) parts.push(`${years}年`);
    if (months > 0) parts.push(`${months}個月`);
    const label = parts.length > 0 ? parts.join('') : '不到1個月';
    return { label, color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' };
  }

  if (sortKey === 'created_at') {
    const raw = entry.created_at;
    if (!raw) return null;
    const created = new Date(raw);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let label, opacity;
    if (diffDays < 1)        { label = '今天';                                opacity = 1;    }
    else if (diffDays < 7)   { label = `${diffDays}天前`;                     opacity = 0.85; }
    else if (diffDays < 30)  { label = `${Math.floor(diffDays / 7)}週前`;     opacity = 0.65; }
    else if (diffDays < 180) { label = `${Math.floor(diffDays / 30)}月前`;    opacity = 0.45; }
    else if (diffDays < 365) { label = `${Math.floor(diffDays / 30)}月前`;    opacity = 0.3;  }
    else                     { label = `${Math.floor(diffDays / 365)}年前`;   opacity = 0.2;  }
    return { label, color: `rgba(103,232,249,${opacity})`, bg: `rgba(103,232,249,${opacity * 0.15})` };
  }

  return null;
}

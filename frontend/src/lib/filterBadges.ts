/**
 * Filter badge configuration and helper for displaying active filter labels
 * on VtuberCard and graph vtuber nodes.
 */

import type { TreeEntry, TreeFilters } from '../types/tree';
import type { FilterBadge, FilterBadgeConfig } from '../types/graph';

export const FILTER_BADGES: Record<string, Record<string, FilterBadgeConfig> | null> = {
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

function entryValue(entry: TreeEntry, dim: string): string | string[] | null {
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

export function getActiveFilterBadges(entry: TreeEntry, filters: TreeFilters | null): FilterBadge[] {
  if (!filters) return [];
  const badges: FilterBadge[] = [];

  for (const dim of Object.keys(filters) as Array<keyof TreeFilters>) {
    const selected = filters[dim];
    if (!selected || selected.size === 0) continue;

    if (dim === 'country') {
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
      const platforms = entry.platforms || [];
      for (const p of platforms) {
        if (selected.has(p)) {
          const badge = FILTER_BADGES.platform?.[p];
          if (badge) badges.push(badge);
        }
      }
    } else {
      const val = entryValue(entry, dim);
      if (val !== null && typeof val === 'string' && selected.has(val)) {
        const badge = FILTER_BADGES[dim]?.[val];
        if (badge) badges.push(badge);
      }
    }
  }

  return badges;
}

export function getSortBadge(entry: TreeEntry, sortKey: string, liveUserIds?: Set<string> | null): FilterBadge | FilterBadge[] | null {
  if (sortKey === 'active_first') {
    if (liveUserIds?.has(entry.user_id)) {
      return { label: '直播中', color: '#f87171', bg: 'rgba(248,113,113,0.2)' };
    }
    const raw = entry.last_live_at;
    if (!raw) return { label: '無資料', color: 'rgba(255,255,255,0.3)', bg: 'rgba(255,255,255,0.05)' };
    const diff = Date.now() - new Date(raw).getTime();
    const diffMins = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    let label: string, color: string, bg: string;
    if (diffMins < 60)        { label = `${Math.max(diffMins, 1)}分鐘前出沒`;   color = '#67e8f9'; bg = 'rgba(103,232,249,0.15)'; }
    else if (diffHours < 24)  { label = `${diffHours}小時前出沒`;              color = '#67e8f9'; bg = 'rgba(103,232,249,0.12)'; }
    else if (diffDays < 7)    { label = `${diffDays}天前出沒`;                 color = '#93c5fd'; bg = 'rgba(147,197,253,0.10)'; }
    else if (diffDays < 30)   { label = `${Math.floor(diffDays / 7)}週前出沒`; color = '#a5b4c8'; bg = 'rgba(165,180,200,0.08)'; }
    else if (diffDays < 180)  { label = `${Math.floor(diffDays / 30)}月前出沒`; color = '#7a8596'; bg = 'rgba(122,133,150,0.08)'; }
    else if (diffDays < 365)  { label = `${Math.floor(diffDays / 30)}月前出沒`; color = '#586472'; bg = 'rgba(88,100,114,0.08)'; }
    else                      { label = `${Math.floor(diffDays / 365)}年前出沒`; color = '#586472'; bg = 'rgba(88,100,114,0.08)'; }
    return { label, color, bg };
  }

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
    const badge = FILTER_BADGES.org_type?.[ot];
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
    const parts: string[] = [];
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
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    let label: string, color: string, bg: string;
    if (diffDays < 1)        { label = '今天';                              color = '#67e8f9'; bg = 'rgba(103,232,249,0.15)'; }
    else if (diffDays < 7)   { label = `${diffDays}天前`;                   color = '#67e8f9'; bg = 'rgba(103,232,249,0.12)'; }
    else if (diffDays < 30)  { label = `${Math.floor(diffDays / 7)}週前`;   color = '#93c5fd'; bg = 'rgba(147,197,253,0.10)'; }
    else if (diffDays < 180) { label = `${Math.floor(diffDays / 30)}月前`;  color = '#a5b4c8'; bg = 'rgba(165,180,200,0.08)'; }
    else if (diffDays < 365) { label = `${Math.floor(diffDays / 30)}月前`;  color = '#7a8596'; bg = 'rgba(122,133,150,0.08)'; }
    else                     { label = `${Math.floor(diffDays / 365)}年前`; color = '#586472'; bg = 'rgba(88,100,114,0.08)';  }
    return { label, color, bg };
  }

  return null;
}

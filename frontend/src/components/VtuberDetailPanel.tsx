import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import 'flag-icons/css/flag-icons.min.css';
import RankBadge from './RankBadge';
import OrgBadge from './OrgBadge';
import { YouTubeIcon, TwitchIcon, SNS_ICON_MAP, SNS_LABELS } from './SnsIcons';
import ProfileInfoCard from './ProfileInfoCard';
import { useAuth } from '../lib/AuthContext';
import { api } from '../lib/api';
import { displayScientificName } from '../lib/speciesName';
import useLiveStatus from '../hooks/useLiveStatus';
import { RANK_ORDER, RANK_TO_UPPER, SUB_SPECIES_RANKS } from '../lib/taxonomyConstants';
import type { TreeEntry, OAuthAccount, User } from '../types';

const ANIM_DURATION_IN = 300;
const ANIM_DURATION_OUT = 250;

interface LinksRowProps {
  oauthAccounts: OAuthAccount[];
  socialLinks: Record<string, string>;
  countryFlags: string[];
  loading?: boolean;
}

/** Links row: OAuth icons + SNS icons + flag icons + optional loading spinner */
function LinksRow({ oauthAccounts, socialLinks, countryFlags, loading }: LinksRowProps) {
  const flags = (countryFlags || []);
  const hasOAuth = oauthAccounts.length > 0;
  const snsEntries = Object.entries(socialLinks || {}).filter(([, url]) => url);
  const hasSns = snsEntries.length > 0;
  const hasLinks = hasOAuth || hasSns;

  if (!hasLinks && flags.length === 0 && !loading) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '8px', flexWrap: 'wrap',
    }}>
      {oauthAccounts.map(a => {
        const Icon = a.provider === 'youtube' ? YouTubeIcon
          : a.provider === 'twitch' ? TwitchIcon : null;
        if (!Icon) return null;
        return a.channel_url ? (
          <a key={a.id} href={a.channel_url} target="_blank" rel="noopener noreferrer"
            title={`${a.provider_display_name || a.provider} 頻道`}
            style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Icon size={18} />
          </a>
        ) : (
          <span key={a.id} title={a.provider_display_name || a.provider}
            style={{ display: 'inline-flex', lineHeight: 0, opacity: 0.5 }}>
            <Icon size={18} />
          </span>
        );
      })}

      {hasOAuth && hasSns && (
        <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
      )}

      {snsEntries
        .sort(([a], [b]) => Number(a === 'email') - Number(b === 'email'))
        .map(([key, url]) => {
        const Icon = SNS_ICON_MAP[key];
        if (!Icon) return null;
        const isEmail = key === 'email';
        const href = isEmail && !url.startsWith('mailto:') ? `mailto:${url}` : url;
        return (
          <a key={key} href={href} target={isEmail ? undefined : '_blank'} rel={isEmail ? undefined : 'noopener noreferrer'}
            title={SNS_LABELS[key] || key}
            style={{ display: 'inline-flex', lineHeight: 0 }}>
            <Icon size={18} />
          </a>
        );
      })}

      {flags.length > 0 && (
        <>
          {hasLinks && (
            <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 2px' }}>|</span>
          )}
          {flags.map((code, i) => (
            <span
              key={i}
              className={`fi fi-${code.toLowerCase()}`}
              title={code.toUpperCase()}
              style={{ width: 20, display: 'inline-block', borderRadius: 2 }}
            />
          ))}
        </>
      )}

      {loading && (
        <span style={{
          display: 'inline-block', width: 14, height: 14,
          border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8',
          borderRadius: '50%',
          animation: 'vtaxonSpin 0.8s linear infinite',
        }} />
      )}
    </div>
  );
}

interface TaxonomyPathProps {
  taxonPath: string;
  pathZh?: Record<string, string>;
  commonNameZh?: string | null;
  scientificName: string;
  taxonRank: string;
}

/** Indented taxonomy path */
function TaxonomyPath({ taxonPath, pathZh, commonNameZh, scientificName, taxonRank }: TaxonomyPathProps) {
  const pathParts = (taxonPath || '').split('|');
  const rankUpper = (taxonRank || '').toUpperCase();
  const isSubSpecies = SUB_SPECIES_RANKS.has(rankUpper);

  const ranks = RANK_ORDER.map((rank, i) => {
    const latin = pathParts[i];
    const zh = pathZh ? pathZh[rank] : undefined;
    return { rank, latin, zh };
  }).filter(r => r.latin);

  if (ranks.length === 0) return null;

  return (
    <div style={{ fontSize: '0.85em', lineHeight: '2' }}>
      {ranks.map((r, i) => (
        <div key={r.rank} style={{ paddingLeft: i * 12, display: 'flex', alignItems: 'center' }}>
          <RankBadge rank={RANK_TO_UPPER[r.rank]} style={{ fontSize: '0.7em' }} />
          <span>{r.zh ? `${r.zh} (${r.latin})` : r.latin}</span>
        </div>
      ))}
      {isSubSpecies && pathParts[6] ? (
        <>
          {/* Parent species row */}
          <div style={{ paddingLeft: ranks.length * 12, display: 'flex', alignItems: 'center' }}>
            <RankBadge rank="SPECIES" style={{ fontSize: '0.7em' }} />
            <span>{pathZh?.species ? `${pathZh.species} (${pathParts[6]})` : pathParts[6]}</span>
          </div>
          {/* Subspecies row */}
          <div style={{ paddingLeft: (ranks.length + 1) * 12, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <RankBadge rank={rankUpper} style={{ fontSize: '0.7em' }} />
            <span>{commonNameZh ? `${commonNameZh} (${scientificName})` : scientificName}</span>
          </div>
        </>
      ) : (
        <div style={{ paddingLeft: ranks.length * 12, fontWeight: 600 }}>
          {commonNameZh
            ? `${commonNameZh} (${scientificName})`
            : scientificName}
        </div>
      )}
    </div>
  );
}

interface DetailEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  country_flags?: string[];
  org_type?: string;
  organization?: string | null;
  scientific_name?: string;
  canonical_name?: string;
  display_name_override?: string | null;
  common_name_zh?: string;
  alternative_names_zh?: string;
  taxon_rank?: string;
  taxon_path?: string;
  path_zh?: Record<string, string>;
  fictional_name?: string;
  fictional_name_zh?: string;
  origin?: string;
  sub_origin?: string;
  fictional_species_id?: number;
  fictional_path?: string;
  breed_name?: string;
  breed_id?: number | null;
  taxon_id?: number;
}

interface FictionalPathProps {
  entry: DetailEntry;
}

/** Indented fictional species path -- supports 3-segment and 4-segment paths */
function FictionalPath({ entry }: FictionalPathProps) {
  const parts = (entry.fictional_path || '').split('|');
  const levels = parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    let rank: string, label: string;
    if (i === 0) {
      rank = 'F_ORIGIN';
      label = entry.origin || part;
    } else if (i === 1) {
      rank = 'F_SUB_ORIGIN';
      label = entry.sub_origin || part;
    } else if (isLast) {
      rank = 'F_SPECIES';
      label = entry.fictional_name_zh || entry.fictional_name || part;
    } else {
      rank = 'F_TYPE';
      label = part; // type segment is already Chinese
    }
    return { rank, label };
  });

  return (
    <div style={{ fontSize: '0.85em', lineHeight: '2' }}>
      {levels.map((lv, i) => (
        <div key={`${lv.rank}-${i}`} style={{
          paddingLeft: i * 12, display: 'flex', alignItems: 'center',
          fontWeight: i === levels.length - 1 ? 600 : 400,
        }}>
          <RankBadge rank={lv.rank} style={{ fontSize: '0.7em' }} />
          <span>{lv.label}</span>
        </div>
      ))}
    </div>
  );
}

interface ReportSectionProps {
  entry: DetailEntry;
}

/** Inline impersonation report form */
function ReportSection({ entry }: ReportSectionProps) {
  const { user: currentUser } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('impersonation');
  const [reportReason, setReportReason] = useState('');
  const [reportEvidence, setReportEvidence] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // Reset when entry changes
  useEffect(() => {
    setReportOpen(false);
    setReportType('impersonation');
    setReportReason('');
    setReportEvidence('');
    setReportLoading(false);
    setReportDone(false);
  }, [entry?.user_id]);

  // Hide if viewing own profile
  if (currentUser && str(currentUser.id) === str(entry?.user_id)) return null;

  const handleSubmit = async () => {
    if (!reportReason.trim()) return;
    setReportLoading(true);
    try {
      await api.createReport({
        reported_user_id: entry.user_id,
        report_type: reportType,
        reason: reportReason.trim(),
        evidence_url: reportEvidence.trim() || undefined,
      });
      setReportDone(true);
    } catch (err) {
      alert((err as Error).message || '提交失敗');
    } finally {
      setReportLoading(false);
    }
  };

  if (reportDone) {
    return (
      <div style={{
        marginBottom: 16, padding: '10px 14px', borderRadius: 8,
        background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
        fontSize: '0.85em', color: '#4ade80', textAlign: 'center',
      }}>
        檢舉已送出，感謝您的回報
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      {!reportOpen ? (
        <button type="button" onClick={() => setReportOpen(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '7px 16px', borderRadius: 6, fontSize: '0.82em',
          background: 'rgba(239,68,68,0.06)', color: 'rgba(239,68,68,0.6)',
          border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer',
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
            <line x1="4" y1="22" x2="4" y2="15" />
          </svg>
          檢舉此帳號
        </button>
      ) : (
        <div style={{
          padding: '12px 14px', borderRadius: 8,
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.15)',
        }}>
          <div style={{ fontSize: '0.85em', fontWeight: 500, marginBottom: 8, color: '#f87171' }}>
            檢舉此帳號
          </div>
          {/* Report type radio buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: '0.85em' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
              <input type="radio" name="reportType" value="impersonation"
                checked={reportType === 'impersonation'} onChange={() => setReportType('impersonation')} />
              偽冒帳號
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'rgba(255,255,255,0.8)' }}>
              <input type="radio" name="reportType" value="not_vtuber"
                checked={reportType === 'not_vtuber'} onChange={() => setReportType('not_vtuber')} />
              非 VTuber / ACG 相關
            </label>
          </div>
          <textarea
            value={reportReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReportReason(e.target.value)}
            placeholder={reportType === 'impersonation'
              ? '請說明為何認為此帳號為偽冒（必填）'
              : '請說明為何認為此帳號不屬於 VTuber 或 ACG 領域（必填）'}
            rows={3}
            autoComplete="new-password"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '8px 10px',
              color: '#fff', fontSize: '0.85em', resize: 'vertical',
              marginBottom: 6,
            }}
          />
          <input
            type="text"
            value={reportEvidence}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReportEvidence(e.target.value)}
            placeholder="證據連結（選填）"
            autoComplete="new-password"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '7px 10px',
              color: '#fff', fontSize: '0.85em',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" onClick={() => setReportOpen(false)} style={{
              padding: '5px 12px', borderRadius: 5, fontSize: '0.82em',
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer',
            }}>
              取消
            </button>
            <button
              type="button"
              disabled={reportLoading || !reportReason.trim()}
              onClick={handleSubmit}
              style={{
                padding: '5px 12px', borderRadius: 5, fontSize: '0.82em',
                background: 'rgba(239,68,68,0.15)', color: '#f87171',
                border: '1px solid rgba(239,68,68,0.25)', cursor: 'pointer',
                opacity: (reportLoading || !reportReason.trim()) ? 0.5 : 1,
              }}
            >
              {reportLoading ? '送出中…' : '送出檢舉'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function str(v: unknown): string { return v == null ? '' : String(v); }

interface TraitApiItem {
  species?: Record<string, unknown>;
  fictional?: Record<string, unknown>;
  breed_name?: string;
  breed_id?: number | null;
}

/** Map a trait API response item to the entry format expected by the panel */
function mapTraitToEntry(trait: TraitApiItem, baseEntry: DetailEntry): DetailEntry {
  const mapped: DetailEntry = { ...baseEntry };
  if (trait.species) {
    const s = trait.species;
    mapped.taxon_path = s.taxon_path as string;
    mapped.scientific_name = s.scientific_name as string;
    mapped.common_name_zh = s.common_name_zh as string | undefined;
    mapped.alternative_names_zh = s.alternative_names_zh as string | undefined;
    mapped.taxon_rank = s.taxon_rank as string;
    mapped.path_zh = {
      kingdom: s.kingdom_zh as string,
      phylum: s.phylum_zh as string,
      class: s.class_zh as string,
      order: s.order_zh as string,
      family: s.family_zh as string,
      genus: s.genus_zh as string,
    };
  }
  if (trait.fictional) {
    const f = trait.fictional;
    mapped.fictional_species_id = f.id as number;
    mapped.fictional_name = f.name as string;
    mapped.fictional_name_zh = f.name_zh as string;
    mapped.origin = f.origin as string;
    mapped.sub_origin = f.sub_origin as string;
    mapped.fictional_path = f.category_path as string;
  }
  mapped.breed_name = trait.breed_name;
  mapped.breed_id = trait.breed_id;
  return mapped;
}

export interface VtuberDetailPanelProps {
  entry: TreeEntry | null;
  allEntries?: TreeEntry[];
  onClose: () => void;
  onFocus?: (entry: TreeEntry) => void;
  onSwitchEntry?: (entry: TreeEntry) => void;
}

export default function VtuberDetailPanel({ entry, allEntries, onClose, onFocus, onSwitchEntry }: VtuberDetailPanelProps) {
  const [imgError, setImgError] = useState(false);
  const [closing, setClosing] = useState(false);
  const [userDetail, setUserDetail] = useState<(User & { oauth_accounts?: OAuthAccount[] }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [traitsData, setTraitsData] = useState<DetailEntry[] | null>(null);
  const [traitsLoading, setTraitsLoading] = useState(false);
  const [activeTraitIdx, setActiveTraitIdx] = useState(0);
  const { liveUserIds, liveStreams } = useLiveStatus();
  const isLive = entry != null && liveUserIds.has(entry.user_id);
  const liveInfos = isLive ? (liveStreams.get(entry!.user_id) || []) : [];

  useEffect(() => {
    if (!entry?.user_id) return;
    setImgError(false);
    setUserDetail(null);
    setDetailLoading(true);
    let cancelled = false;
    api.getUser(entry.user_id)
      .then(data => { if (!cancelled) setUserDetail(data); })
      .catch(() => { })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [entry?.user_id]);

  // Fetch traits when entry lacks species data (e.g. opened from DirectoryPage)
  useEffect(() => {
    if (!entry?.user_id) return;
    // If entry already has species data (from TaxonomyGraph), skip
    if (entry.taxon_path || entry.fictional_species_id) {
      setTraitsData(null);
      setActiveTraitIdx(0);
      return;
    }
    setTraitsLoading(true);
    setTraitsData(null);
    setActiveTraitIdx(0);
    let cancelled = false;
    api.getTraits(entry.user_id)
      .then(data => {
        if (cancelled) return;
        const traits = data as unknown as TraitApiItem[];
        if (traits.length > 0) {
          setTraitsData(traits.map(t => mapTraitToEntry(t, entry as DetailEntry)));
        }
      })
      .catch(() => { })
      .finally(() => { if (!cancelled) setTraitsLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally keyed on specific fields, not the full entry object
  }, [entry?.user_id, entry?.taxon_path, entry?.fictional_species_id]);

  // Effective entry/allEntries: use traitsData when available
  const effectiveEntry = (traitsData ? (traitsData[activeTraitIdx] || traitsData[0]) : entry) as DetailEntry;
  const effectiveAllEntries = traitsData && traitsData.length > 1 ? traitsData : allEntries;

  // Derive active tab index from current entry
  const activeIdx = traitsData
    ? activeTraitIdx
    : (allEntries && allEntries.length > 1)
      ? Math.max(0, allEntries.findIndex(e => {
          if (e.fictional_path) {
            return e.fictional_path === entry?.fictional_path
              && (e.fictional_species_id || '') === (entry?.fictional_species_id || '');
          }
          return e.taxon_path === entry?.taxon_path && (e.breed_id || '') === (entry?.breed_id || '');
        }))
      : 0;

  const handleClose = useCallback(() => setClosing(true), []);
  const handleAnimEnd = useCallback((e: React.AnimationEvent) => {
    if (e.animationName === 'vtaxonSlideOut') { setClosing(false); onClose(); }
  }, [onClose]);

  if (!entry) return null;

  const oauthAccounts = userDetail?.oauth_accounts || ([] as OAuthAccount[]);
  const socialLinks = userDetail?.social_links || {};
  const bio = userDetail?.bio;

  return createPortal(
    <>
      <style>{`
        @keyframes vtaxonSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes vtaxonSlideOut { from { transform: translateX(0); } to { transform: translateX(100%); } }
        @keyframes vtaxonFadeIn   { from { opacity: 0; } to { opacity: 1; } }
        @keyframes vtaxonFadeOut  { from { opacity: 1; } to { opacity: 0; } }
        @keyframes vtaxon-live-pulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      `}</style>

      {/* Backdrop */}
      <div onClick={handleClose}
        onAnimationEnd={(e: React.AnimationEvent) => { if (e.animationName === 'vtaxonFadeOut') e.stopPropagation(); }}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
          animation: closing
            ? `vtaxonFadeOut ${ANIM_DURATION_OUT}ms ease-in forwards`
            : `vtaxonFadeIn ${ANIM_DURATION_IN}ms ease-out forwards`,
        }}
      />

      {/* Panel */}
      <div onAnimationEnd={handleAnimEnd} style={{
        position: 'fixed', top: 44, right: 0, bottom: 0,
        width: '360px', maxWidth: '90vw',
        background: '#0d1526', zIndex: 1000,
        boxShadow: '-4px 0 30px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', color: '#e2e8f0',
        animation: closing
          ? `vtaxonSlideOut ${ANIM_DURATION_OUT}ms ease-in forwards`
          : `vtaxonSlideIn ${ANIM_DURATION_IN}ms ease-out forwards`,
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontWeight: 600, fontSize: '1.1em' }}>Vtuber 詳情</span>
          <button type="button" onClick={handleClose} style={{
            background: 'none', border: 'none', fontSize: '1.4em',
            cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '4px',
          }}>✕</button>
        </div>

        {/* Trait selector tabs */}
        {effectiveAllEntries && effectiveAllEntries.length > 1 && (
          <div style={{
            display: 'flex', gap: '6px', padding: '10px 20px 0', flexWrap: 'wrap',
          }}>
            {effectiveAllEntries.map((e, i) => {
              const de = e as DetailEntry;
              const label = de.fictional_name_zh || de.common_name_zh || displayScientificName(de) || de.display_name;
              const active = i === activeIdx;
              const tabKey = de.fictional_path
                ? `F\0${de.fictional_path}\0${de.fictional_species_id || ''}`
                : `${de.taxon_path}\0${de.breed_id || ''}`;
              return (
                <button key={tabKey} type="button"
                  onClick={() => {
                    if (active) return;
                    if (traitsData) {
                      setActiveTraitIdx(i);
                    } else if (onSwitchEntry) {
                      onSwitchEntry(e as TreeEntry);
                    }
                  }}
                  style={{
                    padding: '4px 10px', borderRadius: '4px', fontSize: '0.8em',
                    cursor: 'pointer', border: 'none',
                    background: active ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.06)',
                    color: active ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                    fontWeight: active ? 600 : 400,
                  }}>
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="vtaxon-scroll" style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '6px' }}>
            <div style={{
              position: 'relative', display: 'inline-block',
              padding: isLive ? 3 : 0,
              borderRadius: '50%',
              border: isLive ? '3px solid #ef4444' : 'none',
              boxShadow: isLive ? '0 0 12px rgba(239,68,68,0.4)' : 'none',
            }}>
              {entry.avatar_url && !imgError ? (
                <img src={entry.avatar_url} alt={entry.display_name}
                  loading="lazy"
                  style={{ width: 80, height: 80, borderRadius: '50%', display: 'block' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', color: 'rgba(255,255,255,0.4)',
                }}>?</div>
              )}
              {isLive && (
                <span style={{
                  position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
                  padding: '1px 8px', borderRadius: '4px',
                  background: '#ef4444', color: '#fff',
                  fontSize: '0.6em', fontWeight: 700, letterSpacing: '0.5px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }}>LIVE</span>
              )}
            </div>
          </div>

          {/* Display name */}
          <div style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 600, marginBottom: '4px' }}>
            {entry.display_name}
          </div>

          {/* Live stream links */}
          {isLive && liveInfos.length > 0 && (
            <div style={{ textAlign: 'center', marginBottom: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {liveInfos.map((li, i) => li.stream_url && (
                <a key={li.provider + i} href={li.stream_url} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: '5px',
                  padding: '4px 12px', borderRadius: '6px',
                  background: 'rgba(239,68,68,0.12)', color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.25)',
                  fontSize: '0.8em', fontWeight: 600, textDecoration: 'none',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'vtaxon-live-pulse 1.5s ease-in-out infinite',
                    flexShrink: 0,
                  }} />
                  {li.provider === 'youtube' ? <YouTubeIcon size={14} /> : li.provider === 'twitch' ? <TwitchIcon size={14} /> : null}
                  {li.stream_title || '正在直播'}
                </a>
              ))}
            </div>
          )}
          <OrgBadge orgType={(entry as DetailEntry).org_type} organization={(entry as DetailEntry).organization} style={{ textAlign: 'center', marginBottom: '10px' }} />

          {/* Links row */}
          <div style={{ marginBottom: '16px' }}>
            <LinksRow
              oauthAccounts={oauthAccounts as OAuthAccount[]}
              socialLinks={socialLinks}
              countryFlags={entry.country_flags || []}
              loading={detailLoading}
            />
          </div>

          {/* Public profile link */}
          <div style={{ marginBottom: 12 }}>
            <Link to={`/vtuber/${entry.user_id}`} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              width: '100%', padding: '8px 16px', borderRadius: 6,
              fontSize: '0.9em', textDecoration: 'none',
              background: 'rgba(56,189,248,0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56,189,248,0.25)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              查看公開頁面
            </Link>
          </div>

          {/* Focus button */}
          {onFocus && (
            <div style={{ marginBottom: '16px' }}>
              <button type="button" onClick={() => { onFocus(entry!); handleClose(); }} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                width: '100%', padding: '8px 16px', borderRadius: '6px',
                fontSize: '0.9em',
                background: 'rgba(212,160,23,0.1)',
                color: '#D4A017',
                border: '1px solid rgba(212,160,23,0.3)',
                cursor: 'pointer',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                </svg>
                在樹狀圖中定位
              </button>
            </div>
          )}

          {/* Report button */}
          <ReportSection entry={entry as DetailEntry} />

          {/* Bio */}
          {bio && (
            <div style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '12px 14px',
              marginBottom: '16px', fontSize: '0.9em', lineHeight: '1.6',
              color: 'rgba(255,255,255,0.7)', whiteSpace: 'pre-wrap',
            }}>
              {bio}
            </div>
          )}

          {/* Profile data */}
          <ProfileInfoCard profileData={userDetail?.profile_data} />

          {/* Species info card */}
          {traitsLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '20px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85em',
            }}>
              <span style={{
                display: 'inline-block', width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#38bdf8',
                borderRadius: '50%', marginRight: 8,
                animation: 'vtaxonSpin 0.8s linear infinite',
              }} />
              載入物種資料…
            </div>
          ) : !effectiveEntry.fictional_species_id && !effectiveEntry.taxon_path ? null : effectiveEntry.fictional_species_id ? (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>虛構物種資訊</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
                <div>
                  <span style={labelStyle}>名稱</span>
                  {effectiveEntry.fictional_name_zh || effectiveEntry.fictional_name}
                  {effectiveEntry.fictional_name_zh && effectiveEntry.fictional_name && effectiveEntry.fictional_name_zh !== effectiveEntry.fictional_name && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>({effectiveEntry.fictional_name})</span>
                  )}
                </div>
                <div>
                  <span style={labelStyle}>來源</span>
                  {effectiveEntry.origin}
                </div>
                {effectiveEntry.sub_origin && (
                  <div>
                    <span style={labelStyle}>子來源</span>
                    {effectiveEntry.sub_origin}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>物種資訊</div>
              <div style={{ fontSize: '0.9em', lineHeight: '1.8' }}>
                <div>
                  <span style={labelStyle}>學名</span>
                  {displayScientificName(effectiveEntry)}
                </div>
                {effectiveEntry.common_name_zh && (
                  <div>
                    <span style={labelStyle}>中文名</span>
                    {effectiveEntry.common_name_zh}
                  </div>
                )}
                {effectiveEntry.alternative_names_zh && (
                  <div>
                    <span style={labelStyle}>俗名</span>
                    {effectiveEntry.alternative_names_zh.split(/[,，]/).map(s => s.trim()).filter(Boolean).join('、')}
                  </div>
                )}
                {effectiveEntry.breed_name && (
                  <div>
                    <span style={labelStyle}>品種</span>
                    {effectiveEntry.breed_name}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Taxonomy / Fictional path card */}
          {traitsLoading ? null : !effectiveEntry.fictional_species_id && !effectiveEntry.taxon_path ? null : effectiveEntry.fictional_species_id ? (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
              <FictionalPath entry={effectiveEntry} />
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.06)', borderRadius: '8px', padding: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>分類路徑</div>
              <TaxonomyPath
                taxonPath={effectiveEntry.taxon_path!}
                pathZh={effectiveEntry.path_zh}
                commonNameZh={effectiveEntry.common_name_zh}
                scientificName={displayScientificName(effectiveEntry)}
                taxonRank={effectiveEntry.taxon_rank!}
              />
            </div>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}

const labelStyle: React.CSSProperties = {
  display: 'inline-block', width: '50px',
  fontWeight: 500, color: 'rgba(255,255,255,0.45)',
};

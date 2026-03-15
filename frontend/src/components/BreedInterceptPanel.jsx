import { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import RankBadge from './RankBadge';

const BREED_COLOR = '#fb923c';

const inputStyle = {
  width: '100%', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0',
};

export default function BreedInterceptPanel({ species, onSelectBreed, onSkip, onCancel, hasSearchedLatin }) {
  const breeds = species._breeds || [];
  const speciesInfo = species._speciesInfo || species;
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [form, setForm] = useState({ name_zh: '', name_en: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFilter(filter), 300);
    return () => clearTimeout(timer);
  }, [filter]);

  const filtered = useMemo(() => {
    const q = debouncedFilter.trim();
    if (!q) return breeds;
    const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(q);
    return breeds.filter(b => {
      if (isCJK) return b.name_zh && b.name_zh.includes(q);
      return b.name_en && b.name_en.toLowerCase().includes(q.toLowerCase());
    });
  }, [breeds, debouncedFilter]);

  function handleSelectBreed(breed) {
    const payload = {
      result_type: 'breed',
      taxon_id: speciesInfo.taxon_id,
      scientific_name: speciesInfo.scientific_name,
      common_name_zh: speciesInfo.common_name_zh,
      common_name_en: speciesInfo.common_name_en,
      taxon_rank: speciesInfo.taxon_rank,
      taxon_path: speciesInfo.taxon_path,
      kingdom: speciesInfo.kingdom,
      phylum: speciesInfo.phylum,
      class: speciesInfo.class,
      order: speciesInfo.order,
      family: speciesInfo.family,
      genus: speciesInfo.genus,
      kingdom_zh: speciesInfo.kingdom_zh,
      phylum_zh: speciesInfo.phylum_zh,
      class_zh: speciesInfo.class_zh,
      order_zh: speciesInfo.order_zh,
      family_zh: speciesInfo.family_zh,
      genus_zh: speciesInfo.genus_zh,
      breed: breed,
    };
    onSelectBreed(payload);
  }

  async function handleSubmitReport(e) {
    e.preventDefault();
    const nameZh = form.name_zh.trim();
    const nameEn = form.name_en.trim();
    const desc = form.description.trim();
    if (!nameZh || !nameEn || !desc) return;

    setSubmitting(true);
    try {
      await api.createBreedRequest({
        taxon_id: speciesInfo.taxon_id,
        name_zh: nameZh,
        name_en: nameEn,
        description: `[所屬物種: ${speciesInfo.common_name_zh || ''} ${speciesInfo.scientific_name} (taxon_id: ${speciesInfo.taxon_id})]\n${desc}`,
      });
      setSubmitted(true);
      setForm({ name_zh: '', name_en: '', description: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const speciesLabel = speciesInfo.common_name_zh
    ? `${speciesInfo.common_name_zh} ${speciesInfo.scientific_name}`
    : speciesInfo.scientific_name;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <button onClick={onCancel} style={{
          background: 'none', border: 'none', color: '#38bdf8',
          cursor: 'pointer', fontSize: '0.95em', padding: '4px 0',
        }}>
          &larr; 返回搜尋
        </button>
      </div>

      <div style={{
        padding: '10px 14px', marginBottom: '10px',
        background: 'rgba(52,211,153,0.06)', borderRadius: '6px',
        border: '1px solid rgba(52,211,153,0.2)',
      }}>
        <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>已選擇</div>
        <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
          {speciesInfo.common_name_zh && <span>{speciesInfo.common_name_zh} </span>}
          <i style={{ color: 'rgba(255,255,255,0.6)' }}>{speciesInfo.scientific_name}</i>
        </div>
        <div style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
          此物種有 {breeds.length} 個品種可選：
        </div>
      </div>

      <button
        onClick={onSkip}
        style={{
          width: '100%', marginBottom: '8px', padding: '10px 14px',
          background: BREED_COLOR,
          border: 'none',
          borderRadius: '6px', cursor: 'pointer',
          color: '#0d1526', fontSize: '0.9em', fontWeight: 700,
        }}
      >
        不指定品種，直接新增物種
      </button>

      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="過濾品種名稱…"
        autoComplete="new-password"
        autoFocus
        style={{
          width: '100%', padding: '8px', marginBottom: '8px', boxSizing: 'border-box',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
          background: '#1a2433', color: '#e2e8f0',
        }}
      />

      {filtered.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9em' }}>
          {filter ? '無匹配品種' : '此物種尚無品種資料'}
        </p>
      ) : (
        <div className="vtaxon-scroll" style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', maxHeight: '350px', overflow: 'auto' }}>
          {filtered.map(breed => (
            <div
              key={breed.id}
              style={{
                padding: '8px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${BREED_COLOR}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <RankBadge rank="BREED" />
                  {breed.name_zh ? (
                    <>
                      <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{breed.name_zh}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9em' }}>{breed.name_en}</span>
                    </>
                  ) : (
                    <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{breed.name_en}</span>
                  )}
                </div>
                {breed.breed_group && (
                  <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '1px' }}>
                    {breed.breed_group}
                  </div>
                )}
              </div>
              <button onClick={() => handleSelectBreed(breed)} style={{
                padding: '4px 12px', background: '#34d399', color: '#0d1526',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                marginLeft: '8px', flexShrink: 0, fontWeight: 600,
              }}>
                選擇
              </button>
            </div>
          ))}
        </div>
      )}


      {hasSearchedLatin && (
        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {submitted ? (
            <div style={{
              padding: '10px 14px', color: '#34d399', fontSize: '0.9em',
              background: 'rgba(52,211,153,0.06)', borderRadius: '6px',
              border: '1px solid rgba(52,211,153,0.2)',
            }}>
              品種回報已送出，等待管理員審核！
            </div>
          ) : !showReport ? (
            <button
              onClick={() => setShowReport(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: BREED_COLOR, fontSize: '0.85em', padding: 0,
              }}
            >
              找不到想要的品種？回報缺漏品種
            </button>
          ) : (
            <form onSubmit={handleSubmitReport} autoComplete="off">
              <input type="text" name="prevent_autofill" autoComplete="new-password" style={{ display: 'none' }} tabIndex={-1} />
              <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95em', marginBottom: '8px' }}>
                回報缺漏品種
              </div>
              <div style={{ fontSize: '0.82em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' }}>
                所屬物種：{speciesLabel}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
                    品種中文名稱 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="text" value={form.name_zh} required
                    onChange={(e) => setForm(prev => ({ ...prev, name_zh: e.target.value }))}
                    placeholder="例：柴犬、布偶貓" autoComplete="new-password" style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
                    品種英文名稱 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="text" value={form.name_en} required
                    onChange={(e) => setForm(prev => ({ ...prev, name_en: e.target.value }))}
                    placeholder="例：Shiba Inu、Ragdoll" autoComplete="new-password" style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
                    說明 / 來源連結 <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <textarea
                    value={form.description} required
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="請附上維基百科或其他可靠來源的連結"
                    rows={2} autoComplete="new-password"
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(() => {
                    const isDisabled = submitting || !form.name_zh.trim() || !form.name_en.trim() || !form.description.trim();
                    return (
                      <button type="submit" disabled={isDisabled} style={{
                        padding: '6px 14px', background: BREED_COLOR, color: '#0d1526',
                        border: 'none', borderRadius: '4px',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontSize: '0.85em', fontWeight: 600,
                        opacity: isDisabled ? 0.4 : 1,
                      }}>
                        {submitting ? '送出中…' : '送出回報'}
                      </button>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setShowReport(false)}
                    style={{
                      padding: '6px 14px', background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.6)', border: 'none',
                      borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em',
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

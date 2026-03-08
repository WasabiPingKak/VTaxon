import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useToast } from '../lib/ToastContext';
import { api } from '../lib/api';
import { breedEmoji } from '../lib/breedUtils';
import RankBadge from '../components/RankBadge';
import SEOHead from '../components/SEOHead';

const BREED_COLOR = '#fb923c';

function BreedAccordion({ section, user, addToast, navigate }) {
  const [expanded, setExpanded] = useState(false);
  const [breeds, setBreeds] = useState([]);
  const [species, setSpecies] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState('');
  const [adding, setAdding] = useState(null); // breed id being added

  function handleToggle() {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded) {
      setLoading(true);
      api.getBreeds(section.taxon_id).then(data => {
        setBreeds(data.breeds || []);
        setSpecies(data.species || null);
        setLoaded(true);
      }).catch(() => {
        setLoaded(true);
      }).finally(() => setLoading(false));
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim();
    if (!q) return breeds;
    const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(q);
    return breeds.filter(b => {
      if (isCJK) return b.name_zh && b.name_zh.includes(q);
      return b.name_en && b.name_en.toLowerCase().includes(q.toLowerCase());
    });
  }, [breeds, filter]);

  // Group by breed_group
  const grouped = useMemo(() => {
    const groups = new Map();
    for (const b of filtered) {
      const g = b.breed_group || '其他';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(b);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  async function handleAddTrait(breed) {
    if (!user) {
      navigate('/login');
      return;
    }
    setAdding(breed.id);
    try {
      const body = { taxon_id: section.taxon_id, breed_id: breed.id };
      const result = await api.createTrait(body);
      if (result.replaced) {
        addToast(`已新增，原本的「${result.replaced.replaced_display_name}」已被取代`, { type: 'success' });
      } else {
        const name = breed.name_zh || breed.name_en;
        addToast(`特徵新增成功（品種：${name}）`, { type: 'success' });
      }
    } catch (err) {
      if (err.status === 409) {
        addToast('你已經有這個物種的特徵了，可以在角色設定中修改品種', { type: 'warning' });
      } else {
        addToast(err.message, { type: 'error' });
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '6px',
      marginBottom: '8px',
      overflow: 'hidden',
    }}>
      <button
        onClick={handleToggle}
        style={{
          width: '100%', padding: '14px 16px',
          background: expanded ? 'rgba(251,146,60,0.06)' : 'transparent',
          border: 'none', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          color: '#e2e8f0', fontSize: '1em',
        }}
      >
        <span style={{ fontWeight: 700 }}>
          {breedEmoji(section)} {section.common_name_zh || section.scientific_name}
          {loaded && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: '8px', fontSize: '0.9em' }}>
              ({breeds.length} 個品種)
            </span>
          )}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {loading ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              載入中…
            </div>
          ) : (
            <>
              {breeds.length > 10 && (
                <div style={{ padding: '8px 16px' }}>
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="過濾品種名稱…"
                    style={{
                      width: '100%', padding: '6px 10px', boxSizing: 'border-box',
                      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '4px',
                      background: '#1a2433', color: '#e2e8f0', fontSize: '0.9em',
                    }}
                  />
                </div>
              )}
              {filtered.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9em' }}>
                  {filter ? '無匹配品種' : '此物種尚無品種資料'}
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {grouped.map(([groupName, groupBreeds]) => (
                    <BreedGroupSection
                      key={groupName}
                      groupName={groupName}
                      breeds={groupBreeds}
                      showAdd={!!user}
                      adding={adding}
                      onAdd={handleAddTrait}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

const breedRequestInputStyle = {
  width: '100%', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0',
};

function BreedRequestInline() {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name_zh: '', name_en: '', scientific_name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name_zh.trim() || !form.name_en.trim() || !form.scientific_name.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        description: `[所屬物種學名: ${form.scientific_name.trim()}]\n${form.description}`,
      };
      delete payload.scientific_name;
      await api.createBreedRequest(payload);
      setSubmitted(true);
      setForm({ name_zh: '', name_en: '', scientific_name: '', description: '' });
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{
        marginBottom: '16px', padding: '12px 16px', color: '#34d399', fontSize: '0.9em',
        background: 'rgba(52,211,153,0.06)', borderRadius: '6px', border: '1px solid rgba(52,211,153,0.2)',
      }}>
        已送出，等待管理員審核！
        <button
          type="button"
          onClick={() => { setSubmitted(false); setShow(false); }}
          style={{
            marginLeft: '8px', background: 'none', border: 'none',
            color: '#38bdf8', cursor: 'pointer', fontSize: '0.9em',
          }}
        >
          再送一筆
        </button>
      </div>
    );
  }

  if (!show) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setShow(true)}
          style={{
            width: '100%', padding: '10px 14px',
            background: 'rgba(251,146,60,0.08)',
            border: '1px dashed rgba(251,146,60,0.35)',
            borderRadius: '6px', cursor: 'pointer',
            color: BREED_COLOR, fontSize: '0.9em', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
        >
          <span style={{ fontSize: '1.1em' }}>+</span>
          找不到想要的品種？回報遺漏
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{
      marginBottom: '16px', padding: '14px 16px',
      background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ marginBottom: '10px' }}>
        <button
          type="button"
          onClick={() => setGuideOpen(!guideOpen)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)', fontSize: '0.85em', padding: 0,
            display: 'flex', alignItems: 'center', gap: '4px',
          }}
        >
          <span style={{ fontSize: '0.8em', transform: guideOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', display: 'inline-block' }}>▶</span>
          送出回報前，請先確認以下事項
        </button>
        {guideOpen && (
          <div style={{
            marginTop: '8px', padding: '12px 14px', fontSize: '0.82em', lineHeight: 1.7,
            color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.02)',
            borderRadius: '4px', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)' }}>1. 品種不是物種</strong><br />
              品種是物種底下人為培育的變種（例如「柴犬」是家犬的品種）。<br />
              如果你要找的是一個獨立的動物（例如「雞」「蟒蛇」「倉鼠」），那是物種而非品種，請回到角色設定頁使用物種搜尋。
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)' }}>2. 請用學名搜尋物種</strong><br />
              系統的物種搜尋使用 GBIF 全球資料庫，需要輸入拉丁文學名。<br />
              學名不是英文俗名（例如 "chicken" 搜不到，但 "Gallus gallus" 可以）。<br />
              Google 搜尋「動物中文名 + 學名」就能找到。<br />
              例如想找「雞」→ 搜尋「雞 學名」→ 得到 Gallus gallus domesticus → 回到角色設定頁輸入 "Gallus" 即可找到。
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)' }}>3. 不需要精確到種</strong><br />
              系統接受目、科、屬等較高層級的學名。例如搜尋 "Felidae"（貓科）或 "Canidae"（犬科）都能找到。
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'rgba(255,255,255,0.7)' }}>4. 找得到物種但沒有中文名？</strong><br />
              請直接在補充說明填寫：希望新增的中文名 + 對應學名 + 參考來源連結，管理員會協助補上。
            </div>
            <div style={{ padding: '8px 10px', background: 'rgba(251,146,60,0.06)', borderRadius: '4px', border: '1px solid rgba(251,146,60,0.15)' }}>
              <strong style={{ color: BREED_COLOR }}>回報受理條件</strong>（缺少以下任一項將會被退回）：<br />
              ✓ 已查過物種或分類的學名（在 Google 等搜尋引擎查到的）<br />
              ✓ 已在本站的物種搜尋中用學名搜過，確認找不到或缺少中文名<br />
              ✓ 已填寫該品種所屬物種的拉丁學名<br />
              ✓ 在補充說明中附上參考資料連結（如維基百科、學術資料庫）<br />
              <span style={{ marginTop: '4px', display: 'inline-block' }}>四個欄位皆為必填。</span>
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            品種中文名稱 <span style={{ color: '#f87171' }}>*</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>（例：柴犬、布偶貓）</span>
          </label>
          <input
            type="text" value={form.name_zh} required
            onChange={(e) => setForm(prev => ({ ...prev, name_zh: e.target.value }))}
            placeholder="品種中文名稱" style={breedRequestInputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            品種英文名稱 <span style={{ color: '#f87171' }}>*</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>（例：Shiba Inu、Ragdoll）</span>
          </label>
          <input
            type="text" value={form.name_en} required
            onChange={(e) => setForm(prev => ({ ...prev, name_en: e.target.value }))}
            placeholder="品種英文名稱" style={breedRequestInputStyle}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            所屬物種學名 <span style={{ color: '#f87171' }}>*</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>（例：Canis lupus familiaris、Felis catus）</span>
          </label>
          <input
            type="text" value={form.scientific_name} required
            onChange={(e) => setForm(prev => ({ ...prev, scientific_name: e.target.value }))}
            placeholder="該品種所屬物種的拉丁學名"
            style={{ ...breedRequestInputStyle, fontStyle: 'italic' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            補充說明 <span style={{ color: '#f87171' }}>*</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>（請附上維基百科或其他可靠來源的連結）</span>
          </label>
          <textarea
            value={form.description} required
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="補充說明（必填，請附上參考來源的連結）"
            rows={2}
            style={{ ...breedRequestInputStyle, resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" disabled={submitting || !form.name_zh.trim() || !form.name_en.trim() || !form.scientific_name.trim() || !form.description.trim()} style={{
            padding: '6px 14px', background: BREED_COLOR, color: '#0d1526',
            border: 'none', borderRadius: '4px', cursor: 'pointer',
            fontSize: '0.85em', fontWeight: 600,
          }}>
            {submitting ? '送出中…' : '送出回報'}
          </button>
          <button
            type="button"
            onClick={() => setShow(false)}
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
  );
}

function BreedGroupSection({ groupName, breeds, showAdd, adding, onAdd }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          padding: '6px 16px',
          background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '0.85em', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
          {groupName} ({breeds.length})
        </span>
        <span style={{ fontSize: '0.75em', color: 'rgba(255,255,255,0.3)' }}>
          {collapsed ? '▼' : '▲'}
        </span>
      </div>
      {!collapsed && breeds.map(breed => (
        <div
          key={breed.id}
          style={{
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            borderLeft: `3px solid ${BREED_COLOR}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
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
          {showAdd && (
            <button
              onClick={() => onAdd(breed)}
              disabled={adding === breed.id}
              style={{
                padding: '3px 10px', background: '#34d399', color: '#0d1526',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                marginLeft: '8px', flexShrink: 0, fontWeight: 600, fontSize: '0.85em',
              }}
            >
              {adding === breed.id ? '…' : '加入特徵'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function GlobalBreedSearch({ user, addToast, navigate }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [adding, setAdding] = useState(null);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setSearched(false);
    try {
      const data = await api.searchBreeds(q);
      setResults(data.breeds || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  async function handleAddTrait(breed) {
    if (!user) {
      navigate('/login');
      return;
    }
    setAdding(breed.id);
    try {
      const body = { taxon_id: breed.taxon_id, breed_id: breed.id };
      const result = await api.createTrait(body);
      if (result.replaced) {
        addToast(`已新增，原本的「${result.replaced.replaced_display_name}」已被取代`, { type: 'success' });
      } else {
        const name = breed.name_zh || breed.name_en;
        addToast(`特徵新增成功（品種：${name}）`, { type: 'success' });
      }
    } catch (err) {
      if (err.status === 409) {
        addToast('你已經有這個物種的特徵了，可以在角色設定中修改品種', { type: 'warning' });
      } else {
        addToast(err.message, { type: 'error' });
      }
    } finally {
      setAdding(null);
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); if (!e.target.value.trim()) { setResults([]); setSearched(false); } }}
          placeholder="搜尋品種名稱（如：柴犬、布偶貓、Shiba Inu）"
          style={{
            flex: 1, padding: '8px', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '4px', background: '#1a2433', color: '#e2e8f0',
          }}
        />
        <button type="submit" disabled={searching} style={{
          padding: '8px 16px', background: BREED_COLOR, color: '#0d1526',
          border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600,
        }}>
          {searching ? '搜尋中…' : '搜尋'}
        </button>
      </form>

      {searched && results.length === 0 && query.trim() && (
        <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '12px', fontSize: '0.9em' }}>
          找不到匹配的品種
        </p>
      )}

      {results.length > 0 && (
        <div style={{
          marginTop: '10px', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '4px', maxHeight: '400px', overflow: 'auto',
        }}>
          {results.map(breed => (
            <div
              key={breed.id}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `3px solid ${BREED_COLOR}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap' }}>
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
                {(breed.species_name_zh || breed.species_scientific_name) && (
                  <div style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                    {breed.species_name_zh || ''} {breed.species_scientific_name ? <i>{breed.species_scientific_name}</i> : ''}
                  </div>
                )}
              </div>
              {user && (
                <button
                  onClick={() => handleAddTrait(breed)}
                  disabled={adding === breed.id}
                  style={{
                    padding: '3px 10px', background: '#34d399', color: '#0d1526',
                    border: 'none', borderRadius: '4px', cursor: 'pointer',
                    marginLeft: '8px', flexShrink: 0, fontWeight: 600, fontSize: '0.85em',
                  }}
                >
                  {adding === breed.id ? '…' : '加入特徵'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BreedsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);

  useEffect(() => {
    api.getBreedCategories().then(data => {
      setSections(data.categories || []);
    }).catch(() => { });
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      <SEOHead
        title="品種目錄"
        description="已收錄的寵物品種目錄"
        url="/breeds"
      />
      <button
        onClick={() => navigate(-1)}
        style={{
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px',
          background: 'rgba(255,255,255,0.06)', fontSize: '0.9em',
          color: 'rgba(255,255,255,0.7)', cursor: 'pointer', marginBottom: '12px',
        }}
      >
        &larr; 上一頁
      </button>
      <h1 style={{ fontSize: '1.5em', color: '#e2e8f0', marginBottom: '6px' }}>
        已收錄的品種目錄
      </h1>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9em', marginBottom: '20px', lineHeight: 1.7 }}>
        <p style={{ margin: '0 0 8px' }}>
          <strong style={{ color: '#38bdf8' }}>物種</strong>（如狼、家貓、野兔）是生物分類學上的單位，來自 GBIF 全球資料庫，涵蓋所有已知物種。
          物種搜尋請回到<Link to="/profile" style={{ color: '#38bdf8', textDecoration: 'none' }}>角色設定頁</Link>操作。
        </p>
        <p style={{ margin: '0 0 8px' }}>
          <strong style={{ color: '#fb923c' }}>品種</strong>（如柴犬、布偶貓、荷蘭垂耳兔）是人為培育的變種，許多不同的品種實際上都是相同的物種，由管理員手動收錄在這個目錄中。
          若找不到你要的品種，歡迎在下方回報，管理員會定期審核補上。
        </p>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)' }}>
          {user
            ? '點擊「加入特徵」可直接將品種新增到你的角色。'
            : '登入後可將品種加入你的角色特徵。'}
        </p>
      </div>

      {user && <BreedRequestInline />}

      <GlobalBreedSearch user={user} addToast={addToast} navigate={navigate} />

      <div>
        {sections.map(section => (
          <BreedAccordion
            key={section.taxon_id}
            section={section}
            user={user}
            addToast={addToast}
            navigate={navigate}
          />
        ))}
      </div>
    </div>
  );
}

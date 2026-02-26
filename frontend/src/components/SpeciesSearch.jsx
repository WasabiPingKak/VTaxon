import { useState } from 'react';
import { api } from '../lib/api';

export default function SpeciesSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await api.searchSpecies(query);
      setResults(data.results || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋物種（例如：貓、狼、鷹，或輸入學名）"
          style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" disabled={searching} style={{
          padding: '8px 16px', background: '#4a90d9', color: '#fff',
          border: 'none', borderRadius: '4px', cursor: 'pointer',
        }}>
          {searching ? '搜尋中…' : '搜尋'}
        </button>
      </form>

      {results.length > 0 && (
        <div style={{ border: '1px solid #e0e0e0', borderRadius: '4px', maxHeight: '400px', overflow: 'auto' }}>
          {results.map((sp) => (
            <div key={sp.taxon_id} style={{
              padding: '10px 14px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <strong style={{ fontStyle: 'italic' }}>{sp.scientific_name}</strong>
                {sp.common_name_zh && (
                  <span style={{ marginLeft: '8px', color: '#333', fontWeight: 500 }}>{sp.common_name_zh}</span>
                )}
                {sp.common_name_en && (
                  <span style={{ marginLeft: '8px', color: '#666' }}>({sp.common_name_en})</span>
                )}
                <div style={{ fontSize: '0.85em', color: '#999' }}>
                  {[sp.kingdom, sp.phylum, sp.class, sp.order, sp.family].filter(Boolean).join(' > ')}
                </div>
              </div>
              {onSelect && (
                <button onClick={() => onSelect(sp)} style={{
                  padding: '4px 12px', background: '#27ae60', color: '#fff',
                  border: 'none', borderRadius: '4px', cursor: 'pointer',
                }}>
                  新增
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!searching && results.length === 0 && query.trim() && (
        <p style={{ color: '#999', textAlign: 'center' }}>
          找不到具體物種？請嘗試輸入學名搜尋
        </p>
      )}
    </div>
  );
}

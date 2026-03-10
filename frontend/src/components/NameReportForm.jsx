import { useState } from 'react';
import { api } from '../lib/api';

const inputStyle = {
  width: '100%', padding: '6px 10px', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '4px', fontSize: '0.9em', boxSizing: 'border-box',
  background: '#1a2433', color: '#e2e8f0',
};

export default function NameReportForm({ results, onClose }) {
  const [selectedTaxonId, setSelectedTaxonId] = useState('');
  const [reportType, setReportType] = useState('missing_zh');
  const [suggestedName, setSuggestedName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Filter to species/subspecies results only (not breeds)
  const speciesResults = (results || []).filter(r =>
    r.result_type !== 'breed' && r.taxon_id
  );

  const selected = speciesResults.find(r => String(r.taxon_id) === selectedTaxonId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTaxonId || !suggestedName.trim()) return;

    setSubmitting(true);
    try {
      await api.createNameReport({
        taxon_id: Number(selectedTaxonId),
        report_type: reportType,
        suggested_name_zh: suggestedName.trim(),
        description: description.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{
        marginTop: '12px', padding: '10px 14px',
        background: 'rgba(52,211,153,0.06)', borderRadius: '6px',
        border: '1px solid rgba(52,211,153,0.2)',
        fontSize: '0.9em', color: '#34d399',
      }}>
        名稱回報已送出，等待管理員審核！
        <button onClick={onClose} style={{
          marginLeft: '8px', background: 'none', border: 'none',
          color: '#38bdf8', cursor: 'pointer', fontSize: '0.9em',
        }}>
          關閉
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} autoComplete="off" style={{
      marginTop: '12px', padding: '14px 16px',
      background: 'rgba(255,255,255,0.02)', borderRadius: '6px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <input type="text" name="prevent_autofill" autoComplete="new-password" style={{ display: 'none' }} tabIndex={-1} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95em' }}>
          回報物種名稱問題
        </span>
        <button type="button" onClick={onClose} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer', fontSize: '0.85em',
        }}>
          關閉
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            選擇物種 <span style={{ color: '#f87171' }}>*</span>
          </label>
          <select
            value={selectedTaxonId}
            onChange={(e) => {
              setSelectedTaxonId(e.target.value);
              const sp = speciesResults.find(r => String(r.taxon_id) === e.target.value);
              if (sp?.common_name_zh) {
                setReportType('wrong_zh');
              } else {
                setReportType('missing_zh');
              }
            }}
            required
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">-- 選擇物種 --</option>
            {speciesResults.map(sp => (
              <option key={sp.taxon_id} value={sp.taxon_id}>
                {sp.common_name_zh ? `${sp.common_name_zh} ` : ''}{sp.scientific_name}
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div style={{ fontSize: '0.82em', color: 'rgba(255,255,255,0.4)' }}>
            目前中文名：{selected.common_name_zh || '（無）'}
          </div>
        )}

        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            問題類型
          </label>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.9em' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              <input type="radio" name="reportType" value="missing_zh"
                checked={reportType === 'missing_zh'} onChange={() => setReportType('missing_zh')} />
              中文名缺漏
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
              <input type="radio" name="reportType" value="wrong_zh"
                checked={reportType === 'wrong_zh'} onChange={() => setReportType('wrong_zh')} />
              中文名錯誤
            </label>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            建議的正確中文名 <span style={{ color: '#f87171' }}>*</span>
          </label>
          <input
            type="text" value={suggestedName} required
            onChange={(e) => setSuggestedName(e.target.value)}
            placeholder="輸入建議的中文名稱"
            autoComplete="new-password" style={inputStyle}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)', marginBottom: '3px', display: 'block' }}>
            補充說明（選填）
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="如有參考來源請附上連結"
            rows={2} autoComplete="new-password"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(() => {
            const isDisabled = submitting || !selectedTaxonId || !suggestedName.trim();
            return (
              <button type="submit" disabled={isDisabled} style={{
                padding: '6px 14px', background: '#38bdf8', color: '#0d1526',
                border: 'none', borderRadius: '4px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontSize: '0.85em', fontWeight: 600,
                opacity: isDisabled ? 0.4 : 1,
              }}>
                {submitting ? '送出中…' : '送出回報'}
              </button>
            );
          })()}
          <button type="button" onClick={onClose} style={{
            padding: '6px 14px', background: 'rgba(255,255,255,0.06)',
            color: 'rgba(255,255,255,0.6)', border: 'none',
            borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em',
          }}>
            取消
          </button>
        </div>
      </div>
    </form>
  );
}

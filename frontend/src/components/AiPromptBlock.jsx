import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { generateClassifyPrompt } from '../lib/classifyPrompt';

/**
 * Reusable AI classification prompt block.
 * Loads fictional species data and generates a copyable prompt.
 */
export default function AiPromptBlock() {
  const [showAI, setShowAI] = useState(false);
  const [copied, setCopied] = useState(false);
  const [allSpecies, setAllSpecies] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Lazy load: only fetch when expanded
  useEffect(() => {
    if (!showAI || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getFictionalSpecies();
        if (!cancelled) {
          setAllSpecies(data.species || []);
          setLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load fictional species for prompt:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [showAI, loaded]);

  const handleCopy = useCallback(async () => {
    const prompt = generateClassifyPrompt(allSpecies);
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [allSpecies]);

  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        type="button"
        onClick={() => setShowAI(!showAI)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#38bdf8', fontSize: '0.9em', padding: 0,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}
      >
        <span style={{ fontSize: '1.1em' }}>💡</span>
        不確定？讓 AI 幫你分類
        <span style={{ fontSize: '0.8em' }}>{showAI ? '▼' : '▶'}</span>
      </button>
      {showAI && (
        <div style={{
          marginTop: '8px', padding: '12px',
          background: 'rgba(56,189,248,0.06)', borderRadius: '6px',
          border: '1px solid rgba(56,189,248,0.15)',
        }}>
          <p style={{ fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>
            複製以下提示詞，貼到 ChatGPT 或其他 AI 聊天工具，描述你的角色，AI 會幫你找到最適合的真實物種與虛構物種分類。
          </p>
          {!loaded ? (
            <div style={{ padding: '12px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85em' }}>
              載入分類資料中…
            </div>
          ) : (
            <>
              <div style={{
                background: '#0d1526', padding: '10px', borderRadius: '4px',
                maxHeight: '200px', overflowY: 'auto', fontSize: '0.8em',
                color: 'rgba(255,255,255,0.5)', lineHeight: 1.5,
                whiteSpace: 'pre-wrap', fontFamily: 'monospace',
              }}>
                {generateClassifyPrompt(allSpecies)}
              </div>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  marginTop: '8px', padding: '6px 14px',
                  background: copied ? '#34d399' : '#38bdf8',
                  color: '#0d1526', border: 'none', borderRadius: '4px',
                  cursor: 'pointer', fontSize: '0.85em', fontWeight: 600,
                }}
              >
                {copied ? '已複製！' : '複製提示詞'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

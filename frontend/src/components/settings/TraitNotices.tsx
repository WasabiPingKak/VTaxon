/** 顯示限制警告框：特徵總數達 5 個起顯示，超過 5 個轉為紅色警告 */
export function TraitBudgetNotice({ count }: { count: number }) {
  if (count < 5) return null;
  return (
    <div style={{
      marginBottom: '12px', padding: '10px 14px', borderRadius: '8px',
      background: count >= 6 ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.08)',
      border: `1px solid ${count >= 6 ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.2)'}`,
      fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
    }}>
      <span style={{ color: count >= 6 ? '#ef4444' : '#94a3b8', fontWeight: 600 }}>
        {count >= 6 ? '⚠' : 'ℹ'} 顯示限制
      </span>
      <span style={{ marginLeft: '6px' }}>
        {count >= 6
          ? `你目前共有 ${count} 個物種標註。超過 5 個時，你在分類樹上將不會直接顯示，而是被收入「+N 位」摺疊群組中，直播狀態也不會顯示。`
          : `你目前共有 ${count} 個物種標註。第 5 個起，你在分類樹上的顯示會縮小（無頭像）。`
        }
      </span>
    </div>
  );
}

/** 代表物種說明框：擁有多個特徵時顯示 */
export function LivePrimaryNotice({ traitCount }: { traitCount: number }) {
  if (traitCount <= 1) return null;
  return (
    <div style={{
      marginBottom: '12px', padding: '10px 14px', borderRadius: '8px',
      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
      fontSize: '0.85em', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6,
    }}>
      <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ 代表物種</span>
      <span style={{ marginLeft: '6px' }}>
        代表物種會在分類樹上優先顯示，也是直播篩選時唯一顯示的節點。點擊 ★ 來選擇。
      </span>
    </div>
  );
}

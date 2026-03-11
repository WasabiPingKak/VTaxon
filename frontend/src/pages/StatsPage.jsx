import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import useIsMobile from '../hooks/useIsMobile';
import { api } from '../lib/api';
import HeroCards from '../components/stats/HeroCards';
import ChartCard from '../components/stats/ChartCard';
import HorizontalBarChart from '../components/stats/HorizontalBarChart';
import DonutChart from '../components/stats/DonutChart';
import TreemapChart from '../components/stats/TreemapChart';
import GrowthChart from '../components/stats/GrowthChart';

export default function StatsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    let cancelled = false;
    api.getStats()
      .then(d => { if (!cancelled) setData(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '60vh', color: 'rgba(255,255,255,0.3)', fontSize: '0.9em',
      }}>
        載入統計資料中…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '60vh', color: '#f87171', fontSize: '0.9em',
      }}>
        載入失敗：{error}
      </div>
    );
  }

  const ratioSegments = data?.trait_type_ratio ? [
    { label: '現實物種', value: data.trait_type_ratio.real_only, color: '#38bdf8' },
    { label: '奇幻生物', value: data.trait_type_ratio.fictional_only, color: '#a78bfa' },
    { label: '兩者皆有', value: data.trait_type_ratio.both, color: '#34d399' },
  ] : [];

  const ratioTotal = ratioSegments.reduce((s, d) => s + d.value, 0);

  const platformSegments = data?.by_platform ? [
    { label: 'YouTube', value: data.by_platform.youtube || 0, color: '#ef4444' },
    { label: 'Twitch', value: data.by_platform.twitch || 0, color: '#a78bfa' },
  ] : [];

  const orgSegments = data?.by_org_type ? [
    { label: '個人勢', value: data.by_org_type.indie || 0, color: '#38bdf8' },
    { label: '企業勢', value: data.by_org_type.corporate || 0, color: '#f472b6' },
    { label: '社團', value: data.by_org_type.club || 0, color: '#34d399' },
    ...(data.by_org_type.unknown ? [{ label: '未設定', value: data.by_org_type.unknown, color: '#64748b' }] : []),
  ] : [];

  const statusSegments = data?.by_status ? [
    { label: '活動中', value: data.by_status.active || 0, color: '#34d399' },
    { label: '準備中', value: data.by_status.preparing || 0, color: '#facc15' },
    { label: '休止中', value: data.by_status.hiatus || 0, color: '#94a3b8' },
    ...(data.by_status.unknown ? [{ label: '未設定', value: data.by_status.unknown, color: '#64748b' }] : []),
  ] : [];

  const twoCol = !isMobile;

  return (
    <div style={{
      maxWidth: 900,
      margin: '0 auto',
      padding: isMobile ? '20px 12px' : '32px 20px',
    }}>
      <Helmet>
        <title>統計 — VTaxon</title>
        <meta name="description" content="VTaxon 平台統計數據：物種分佈、VTuber 數量、分類趨勢" />
      </Helmet>

      <h1 style={{
        fontSize: '1.4em',
        fontWeight: 700,
        color: '#fff',
        marginBottom: 24,
      }}>
        統計總覽
      </h1>

      {/* Hero cards */}
      <HeroCards totals={{ ...data?.totals, avg_traits_per_user: data?.avg_traits_per_user }} />

      {/* Row: Top species + Donut */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: twoCol ? '1fr 280px' : '1fr',
        gap: 16,
        marginTop: 16,
      }}>
        <ChartCard title="最熱門物種 Top 10">
          <HorizontalBarChart data={data?.top_species} />
        </ChartCard>

        <ChartCard title="現實 vs 奇幻">
          <DonutChart
            segments={ratioSegments}
            size={isMobile ? 140 : 150}
            centerValue={ratioTotal}
            centerLabel="traits"
          />
        </ChartCard>
      </div>

      {/* Treemap */}
      <div style={{ marginTop: 16 }}>
        <ChartCard title="分類階層分佈">
          <TreemapChart data={data?.taxonomy_distribution} />
        </ChartCard>
      </div>

      {/* Growth */}
      <div style={{ marginTop: 16 }}>
        <ChartCard title="用戶成長趨勢">
          <GrowthChart data={data?.growth_monthly} />
        </ChartCard>
      </div>

      {/* Row: Top fictional + Country */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: twoCol ? '1fr 1fr' : '1fr',
        gap: 16,
        marginTop: 16,
      }}>
        <ChartCard title="最熱門奇幻物種 Top 10">
          <HorizontalBarChart data={data?.top_fictional} variant="fictional" />
        </ChartCard>

        <ChartCard title="國家/地區分佈">
          <HorizontalBarChart
            data={data?.by_country?.map(c => ({
              name: c.code,
              count: c.count,
            }))}
          />
        </ChartCard>
      </div>

      {/* Row: 3 small donuts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: twoCol ? 'repeat(3, 1fr)' : '1fr',
        gap: 16,
        marginTop: 16,
      }}>
        <ChartCard title="平台分佈">
          <DonutChart segments={platformSegments} size={120} thickness={18} />
        </ChartCard>
        <ChartCard title="組織類型">
          <DonutChart segments={orgSegments} size={120} thickness={18} />
        </ChartCard>
        <ChartCard title="活動狀態">
          <DonutChart segments={statusSegments} size={120} thickness={18} />
        </ChartCard>
      </div>

    </div>
  );
}

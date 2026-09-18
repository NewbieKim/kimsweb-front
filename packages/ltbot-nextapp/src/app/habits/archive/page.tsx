'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { HabitLoadError, HabitTopbar, habitFetch, LoadingHabitPage, ProfileRequired, useHabitProfile } from '../components/shared';

type LegacyAssets = {
  growth: { displayName: string; appearanceKey: string; growthValue: number; highestStage: number } | null;
  inventory: Array<{ cardKey: string; quantity: number; definition: { name: string } }>;
  milestones: Array<{ milestoneKey: string; unlockedAt: string }>;
  feeds: Array<{ id: number; cardKey: string; status: string; fedAt: string }>;
};

export default function HabitArchivePage() {
  const profile = useHabitProfile();
  const [assets, setAssets] = useState<LegacyAssets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!profile.selectedId) { setLoading(false); return; }
    setLoading(true);
    try { setAssets(await habitFetch<LegacyAssets>(`/api/child-profiles/${profile.selectedId}/legacy-habit-assets`)); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '旧档案加载失败'); }
    finally { setLoading(false); }
  }, [profile.selectedId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  if (profile.loading || loading) return <LoadingHabitPage />;
  if (!profile.profiles.length) return <ProfileRequired profiles={profile.profiles} />;
  if (error || !assets) return <HabitLoadError message={error || '旧档案暂不可用'} onRetry={() => void load()} />;
  const appearance = assets.growth?.appearanceKey === 'custom' ? 'rabbit' : assets.growth?.appearanceKey;
  return <main className="habit-shell">
    <HabitTopbar title="旧成长档案" subtitle="留住走过的路 · 只读" backHref="/habits" profiles={profile.profiles} selectedId={profile.selectedId} onSelect={profile.setSelectedId} />
    <section className="habit-manage-content">
      <div className="habit-manage-intro"><h1>以前的成长还在这里</h1><p>这些食物卡、成长值和里程碑不会转给新宠物，也不能再次消费。</p></div>
      {assets.growth ? <div className="habit-day-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {appearance && ['cat', 'dog', 'rabbit', 'frog', 'astronaut'].includes(appearance) ? <Image src={`/habits/companions/${appearance}.png`} width={96} height={112} alt={assets.growth.displayName} style={{ objectFit: 'contain' }} /> : <span style={{ fontSize: 52 }}>🐾</span>}
        <div><h1>{assets.growth.displayName}</h1><p>历史成长值 {assets.growth.growthValue} · 曾到达阶段 {assets.growth.highestStage}</p></div>
      </div> : <p className="habit-manage-intro">这个孩子没有旧伙伴成长记录。</p>}
      <div className="habit-section-heading"><h2>旧食物卡</h2><span>仅供回顾</span></div>
      {assets.inventory.length ? <div className="habit-album-grid">{assets.inventory.map((card) => <div className="habit-album-card" key={card.cardKey}><Image src={`/habits/foods/${card.cardKey}.png`} width={140} height={140} alt={card.definition.name} /><h2>{card.definition.name}</h2><p>保存数量：{card.quantity}</p></div>)}</div> : <p className="habit-manage-intro">暂无旧食物卡。</p>}
      <div className="habit-section-heading"><h2>历史里程碑</h2><span>{assets.milestones.length} 个</span></div>
      <div className="habit-manage-intro">{assets.milestones.length ? assets.milestones.map((item) => <p key={item.milestoneKey}>{item.milestoneKey} · {new Date(item.unlockedAt).toLocaleDateString('zh-CN')}</p>) : <p>暂无旧里程碑。</p>}</div>
      <Link className="habit-manage-link" href={`/habits/manage?childProfileId=${profile.selectedId}&tab=history`}>查看完整打卡历史</Link>
    </section>
  </main>;
}

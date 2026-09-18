'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { getFoodEducation } from '@/lib/habits/food-education';
import { HabitLoadError, HabitTopbar, habitFetch, LoadingHabitPage, ProfileRequired, useHabitProfile } from '../components/shared';

type FoodCard = {
  cardKey: string;
  name: string;
  factText: string;
  image: string;
  discovered: boolean;
  quantity: number;
  tags: string[];
};

export default function FoodAlbumPage() {
  const profile = useHabitProfile();
  const [cards, setCards] = useState<FoodCard[] | null>(null);
  const [toast, setToast] = useState('');
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    if (!profile.selectedId) return;
    setLoadError('');
    try {
      setCards(await habitFetch<FoodCard[]>(`/api/child-profiles/${profile.selectedId}/food-album`));
    } catch (error) {
      const message = error instanceof Error ? error.message : '图鉴加载失败';
      setLoadError(message);
      setToast(message);
    }
  }, [profile.selectedId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  if (profile.loading) return <LoadingHabitPage />;
  if (!profile.profiles.length) return <ProfileRequired profiles={profile.profiles} />;
  if (loadError) return <HabitLoadError message={loadError} onRetry={() => void load()} />;
  if (!cards) return <LoadingHabitPage />;

  const discovered = cards.filter((card) => card.discovered).length;
  return (
    <main className="habit-shell">
      <HabitTopbar title="食物卡图鉴" subtitle={`已经发现 ${discovered} / ${cards.length}`} backHref="/habits/companion" profiles={profile.profiles} selectedId={profile.selectedId} onSelect={profile.setSelectedId} forceChoice={profile.needsChoice} />
      <section className="habit-day-card"><small>多样食物认知游戏</small><h1>把见过的食物收进小图鉴</h1><div className="habit-progress-track"><div className="habit-progress-fill" style={{ width: `${cards.length ? discovered / cards.length * 100 : 0}%` }} /></div><div className="habit-progress-copy"><span>重复卡也可以继续喂养</span><b>{discovered} / {cards.length}</b></div></section>
      <div className="habit-album-grid">{cards.map((card) => {
        const education = getFoodEducation(card.cardKey);
        return <article className={`habit-album-card ${card.discovered ? '' : 'locked'}`} key={card.cardKey}>{card.quantity > 0 && <span className="habit-quantity">×{card.quantity}</span>}<Image src={card.image} alt={card.discovered ? card.name : '尚未发现的食物卡'} width={260} height={260} /><h2>{card.discovered ? card.name : '等待发现'}</h2>{card.discovered ? <><div className="habit-album-nutrients">{education.nutrients.slice(0, 3).map((nutrient) => <span key={nutrient}>{nutrient}</span>)}</div><p>{education.benefit}</p></> : <p>完成习惯并选中这张卡后解锁</p>}</article>;
      })}</div>
      <p className="habit-disclaimer" style={{ padding: '0 20px 30px' }}>图鉴中的属性是游戏数值，不代表真实营养含量、摄入量或医疗建议。游戏喂养不代表真实动物饮食方法。</p>
      {toast && <div className="habit-toast" role="status">{toast}</div>}
    </main>
  );
}

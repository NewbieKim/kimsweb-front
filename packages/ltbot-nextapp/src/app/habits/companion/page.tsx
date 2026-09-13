'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { preload } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Check, Sparkles, Utensils, X } from 'lucide-react';
import { NUTRIENT_LABELS, type NutrientKey, type NutrientState } from '@/lib/habits/domain';
import {
  HabitLoadError,
  HabitTopbar,
  habitFetch,
  LoadingHabitPage,
  ProfileChooser,
  ProfileRequired,
  useHabitProfile,
  uuid,
} from '../components/shared';

type Definition = { cardKey: string; name: string; emoji: string; factText: string; nutrientDeltaJson: string };
type InventoryItem = { cardKey: string; quantity: number; definition: Definition };
type PendingFeed = { id: number; selectedCardKey: string };
type PendingFood = { grant: PendingFeed; card: InventoryItem };
type Appearance = { key: string; name: string; image: string };
type Companion = {
  displayName: string;
  appearance: string;
  highestStage: number;
  stageLabel: string;
  growthValue: number;
  nutrients: NutrientState;
  inventory: InventoryItem[];
  pendingFeed: PendingFeed[];
  pendingFeedCount: number;
  dailyGrowth: number;
  dailyGrowthLimit: number;
  appearanceCatalog: Appearance[];
};

const NEXT_STAGE = [20, 60, 140, 300, 300];

export default function CompanionPage() {
  preload('/habits/garden-bg.jpg', { as: 'image', fetchPriority: 'high' });
  const profile = useHabitProfile();
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [loading, setLoading] = useState(true);
  const [feeding, setFeeding] = useState(false);
  const [growthOpen, setGrowthOpen] = useState(false);
  const [draftName, setDraftName] = useState('小芽');
  const [draftAppearance, setDraftAppearance] = useState('rabbit');
  const [toast, setToast] = useState('');
  const [loadError, setLoadError] = useState('');
  const [speech, setSpeech] = useState('我准备好尝尝新食物啦！');
  const [dragging, setDragging] = useState<{ grantId: number; x: number; y: number; startX: number; startY: number; moved: boolean; overTarget: boolean } | null>(null);
  const [feedingCard, setFeedingCard] = useState<{ cardKey: string; name: string } | null>(null);
  const [feedResult, setFeedResult] = useState<{ name: string; growth: number; rainbow: boolean } | null>(null);
  const feedKeys = useRef(new Map<number, string>());
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const suppressClickGrant = useRef<number | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2300);
  }, []);

  const refresh = useCallback(async (withLoading = true) => {
    if (!profile.selectedId) {
      setLoading(false);
      return;
    }
    if (withLoading) setLoading(true);
    setLoadError('');
    try {
      setCompanion(await habitFetch<Companion>(`/api/child-profiles/${profile.selectedId}/companion`));
    } catch (error) {
      const message = error instanceof Error ? error.message : '伙伴加载失败';
      setLoadError(message);
      showToast(message);
    } finally {
      if (withLoading) setLoading(false);
    }
  }, [profile.selectedId, showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => () => {
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
  }, []);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (companion) {
      setDraftName(companion.displayName);
      setDraftAppearance(companion.appearance);
    }
  }, [companion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const pendingCards = useMemo(() => {
    if (!companion) return [];
    return companion.pendingFeed.flatMap((grant): PendingFood[] => {
      const card = companion.inventory.find((item) => item.cardKey === grant.selectedCardKey);
      return card ? [{ grant, card }] : [];
    });
  }, [companion]);

  const capReached = Boolean(companion && companion.dailyGrowth >= companion.dailyGrowthLimit);

  const feed = async (grantId: number) => {
    if (!profile.selectedId || feeding || capReached) return;
    const pending = pendingCards.find((item) => item.grant.id === grantId);
    if (!pending) return;
    const idempotencyKey = feedKeys.current.get(grantId) || uuid();
    feedKeys.current.set(grantId, idempotencyKey);
    setFeeding(true);
    setFeedingCard({ cardKey: pending.card.cardKey, name: pending.card.definition.name });
    setFeedResult(null);
    setSpeech(`${pending.card.definition.name}飞过来啦！`);
    try {
      const result = await habitFetch<{ growthDelta: number; rainbowDelta: number }>(`/api/child-profiles/${profile.selectedId}/companion/feed`, {
        method: 'POST',
        body: JSON.stringify({ grantId, idempotencyKey }),
      });
      feedKeys.current.delete(grantId);
      setSpeech(`${pending.card.definition.name}真好吃，谢谢你！`);
      setFeedResult({ name: pending.card.definition.name, growth: result.growthDelta, rainbow: result.rainbowDelta > 0 });
      showToast(`成长值 +${result.growthDelta}${result.rainbowDelta ? '，点亮彩虹餐盘' : ''}`);
      await refresh(false);
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
      feedbackTimer.current = window.setTimeout(() => setFeedResult(null), 2200);
    } catch (error) {
      setSpeech('小卡还在背包里，等准备好再来吧。');
      showToast(error instanceof Error ? error.message : '喂养失败');
    } finally {
      window.setTimeout(() => {
        setFeeding(false);
        setFeedingCard(null);
      }, 850);
    }
  };

  const foodIsOverTarget = (x: number, y: number) => {
    const rect = dropZoneRef.current?.getBoundingClientRect();
    return Boolean(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  };

  const startFoodDrag = (event: ReactPointerEvent<HTMLButtonElement>, grantId: number) => {
    if (feeding || capReached) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging({ grantId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, overTarget: foodIsOverTarget(event.clientX, event.clientY) });
  };

  const moveFoodDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragging) return;
    event.preventDefault();
    const moved = dragging.moved || Math.hypot(event.clientX - dragging.startX, event.clientY - dragging.startY) > 6;
    setDragging({ ...dragging, x: event.clientX, y: event.clientY, moved, overTarget: foodIsOverTarget(event.clientX, event.clientY) });
  };

  const finishFoodDrag = (event: ReactPointerEvent<HTMLButtonElement>, cancelled = false) => {
    if (!dragging) return;
    const grantId = dragging.grantId;
    const shouldFeed = !cancelled && foodIsOverTarget(event.clientX, event.clientY);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(null);
    if (dragging.moved) suppressClickGrant.current = grantId;
    if (shouldFeed) {
      suppressClickGrant.current = grantId;
      void feed(grantId);
    }
  };

  const clickFood = (grantId: number) => {
    if (suppressClickGrant.current === grantId) {
      suppressClickGrant.current = null;
      return;
    }
    void feed(grantId);
  };

  const pet = () => {
    if (!profile.selectedId || !companion) return;
    setSpeech('好舒服呀，谢谢你的摸摸！');
    void fetch('/api/operation-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'habit_companion_pet', userId: null, metadata: { childProfileId: profile.selectedId, appearanceKey: companion.appearance } }),
    });
    window.setTimeout(() => setGrowthOpen(true), 450);
  };

  const saveAppearance = async () => {
    if (!profile.selectedId) return;
    try {
      await habitFetch(`/api/child-profiles/${profile.selectedId}/companion`, {
        method: 'PATCH',
        body: JSON.stringify({ displayName: draftName, appearanceKey: draftAppearance }),
      });
      showToast('伙伴档案已更新，成长记录完整保留');
      await refresh();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '伙伴更新失败');
    }
  };

  if (profile.loading || loading) return <LoadingHabitPage />;
  if (!profile.profiles.length) return <ProfileRequired profiles={profile.profiles} />;
  if (loadError || !companion) return <HabitLoadError message={loadError || '伙伴花园暂时不可用'} onRetry={() => void refresh()} />;

  const nextStage = NEXT_STAGE[Math.min(companion.highestStage - 1, NEXT_STAGE.length - 1)];
  const growthPercent = companion.highestStage === 5 ? 100 : Math.min(100, companion.growthValue / nextStage * 100);
  const petImage = companion.appearanceCatalog.find((item) => item.key === companion.appearance)?.image || '/habits/companions/rabbit.png';
  return (
    <main className="habit-garden-shell">
      <div className="habit-garden-content">
        <HabitTopbar
          title={`${companion.displayName}的浮岛花园`}
          subtitle="点击伙伴查看成长信息"
          backHref="/habits"
          profiles={profile.profiles}
          selectedId={profile.selectedId}
          onSelect={profile.setSelectedId}
          action={<div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><ProfileChooser profiles={profile.profiles} selectedId={profile.selectedId} onSelect={profile.setSelectedId} forceOpen={profile.needsChoice} /><Link className="habit-icon-button" href={`/habits/album?childProfileId=${profile.selectedId}`} aria-label="食物图鉴"><BookOpen size={20} /></Link></div>}
        />
        <div className="habit-growth-pill" style={{ position: 'absolute', top: 78, right: 13, zIndex: 4 }}>
          <b><span>{companion.stageLabel}</span><span>{companion.growthValue} / {nextStage}</span></b><div><span style={{ width: `${growthPercent}%` }} /></div>
        </div>
        <div className="habit-pet-speech">{speech}</div>
        <div ref={dropZoneRef} className={`habit-pet-zone ${dragging ? 'drag-ready' : ''} ${dragging?.overTarget ? 'drag-over' : ''}`}>
          <div className="habit-drop-label" aria-hidden="true"><Utensils size={17} />小芽的餐盘</div>
          <button type="button" className={`habit-pet stage-${companion.highestStage} ${feeding ? 'feeding' : ''}`} onClick={pet} aria-label={`摸摸${companion.displayName}并查看成长档案`}>
            <Image src={petImage} alt={companion.displayName} width={720} height={900} priority />
          </button>
          {feedingCard && <div className="habit-feeding-card" aria-hidden="true"><Image src={`/habits/foods/${feedingCard.cardKey}.png`} alt="" width={96} height={96} /></div>}
          {feedResult && <div className="habit-feed-result" role="status"><Sparkles size={18} /><b>{feedResult.name}带来成长 +{feedResult.growth}</b>{feedResult.rainbow && <span>彩虹餐盘点亮啦！</span>}</div>}
        </div>
        {pendingCards.length ? (
          <section className="habit-feed-dock habit-food-tray" aria-label="待喂食物背包">
            <div className="habit-food-tray-head"><div><b>食物背包</b><small>{capReached ? '今天吃饱啦，食物卡会保留到明天' : `待喂 ${companion.pendingFeedCount} 张`}</small></div><span>今日成长 {companion.dailyGrowth}/{companion.dailyGrowthLimit}</span></div>
            <div className="habit-food-token-row">
              {pendingCards.map(({ grant, card }) => (
                <button
                  type="button"
                  className="habit-food-token"
                  key={grant.id}
                  disabled={feeding || capReached}
                  aria-label={`将${card.definition.name}喂给${companion.displayName}`}
                  title={`拖到${companion.displayName}身边喂养，也可以点按`}
                  onPointerDown={(event) => startFoodDrag(event, grant.id)}
                  onPointerMove={moveFoodDrag}
                  onPointerUp={(event) => finishFoodDrag(event)}
                  onPointerCancel={(event) => finishFoodDrag(event, true)}
                  onClick={() => clickFood(grant.id)}
                >
                  <Image src={`/habits/foods/${card.cardKey}.png`} alt="" width={72} height={72} draggable={false} />
                  <span>{card.definition.name}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="habit-feed-dock habit-feed-empty">
            <div className="habit-feed-thumb" style={{ display: 'grid', placeItems: 'center', fontSize: 30 }}>🍽️</div>
            <div className="habit-feed-copy"><b>还没有待喂食物卡</b><span>完成打卡并选卡后会出现在这里</span><small>今日成长 {companion.dailyGrowth}/{companion.dailyGrowthLimit}</small></div>
            <Link className="habit-primary-button" href={`/habits?childProfileId=${profile.selectedId}`}>去打卡</Link>
          </section>
        )}
        {dragging && <div className={`habit-dragging-food ${dragging.overTarget ? 'over-target' : ''}`} style={{ left: dragging.x, top: dragging.y }} aria-hidden="true"><Image src={`/habits/foods/${pendingCards.find((item) => item.grant.id === dragging.grantId)?.card.cardKey || 'rice'}.png`} alt="" width={82} height={82} /></div>}
      </div>
      {growthOpen && (
        <div className="habit-overlay" role="dialog" aria-modal="true" aria-labelledby="growth-title" onClick={(event) => { if (event.target === event.currentTarget) setGrowthOpen(false); }}>
          <section className="habit-modal">
            <div className="habit-modal-head"><div><h2 id="growth-title">{companion.displayName}的成长档案</h2><p>阶段 {companion.highestStage} · {companion.stageLabel}</p></div><button type="button" className="habit-close" aria-label="关闭" onClick={() => setGrowthOpen(false)}><X size={19} /></button></div>
            <div className="habit-growth-grid">{Object.entries(NUTRIENT_LABELS).map(([key, info]) => <div className="habit-nutrient" key={key}><b><span>{info.emoji} {info.label}</span><span>{companion.nutrients[key as NutrientKey]}</span></b><div><span style={{ width: `${Math.min(100, companion.nutrients[key as NutrientKey] * 5)}%`, background: info.color }} /></div></div>)}</div>
            <div className="habit-editor">
              <div className="habit-field"><label htmlFor="companion-name">伙伴名字</label><input id="companion-name" value={draftName} maxLength={12} onChange={(event) => setDraftName(event.target.value)} /></div>
              <div className="habit-field"><label>伙伴外观</label><div className="habit-choice-grid" style={{ marginTop: 0 }}>{companion.appearanceCatalog.map((appearance) => <button type="button" key={appearance.key} className={`habit-food-choice ${draftAppearance === appearance.key ? 'active' : ''}`} onClick={() => setDraftAppearance(appearance.key)}><Image src={appearance.image} alt={appearance.name} width={120} height={140} /><b>{appearance.name}</b></button>)}</div></div>
              <button type="button" className="habit-secondary-button" onClick={() => void saveAppearance()}>保存伙伴设置</button>
            </div>
            <p className="habit-disclaimer">成长属于当前孩子档案。更换伙伴外观不会清空成长值、食物图鉴或里程碑。</p>
            <button type="button" className="habit-primary-button" style={{ width: '100%', marginTop: 14 }} onClick={() => setGrowthOpen(false)}><Check size={18} />继续陪伴</button>
          </section>
        </div>
      )}
      {toast && <div className="habit-toast" role="status">{toast}</div>}
    </main>
  );
}

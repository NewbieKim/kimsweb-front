'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Gift, Settings, Sparkles, X } from 'lucide-react';
import { getFoodEducation } from '@/lib/habits/food-education';
import {
  HabitLoadError,
  HabitTopbar,
  habitFetch,
  LoadingHabitPage,
  ProfileRequired,
  useHabitProfile,
  uuid,
} from './components/shared';

type SlotState = {
  slot: 'morning' | 'nap' | 'evening' | 'daily';
  isOpen: boolean;
  nextOpenAt: string | null;
  windowLabel: string;
  status: 'NONE' | 'COMPLETED' | 'REVOKED';
  checkInId: number | null;
};

type HabitItem = {
  id: number;
  source: 'TEMPLATE' | 'CUSTOM';
  templateKey: string | null;
  name: string;
  emoji: string;
  frequency: 'DAILY' | 'TWICE_DAILY';
  enabled: boolean;
  sortOrder: number;
  slots: SlotState[];
};

type HabitTemplate = {
  templateKey: string;
  name: string;
  emoji: string;
  sortOrder: number;
  slots: string[];
};

type Dashboard = {
  serverNow: string;
  localDate: string;
  featureEnabled: boolean;
  adoptionRequired: boolean;
  templates: HabitTemplate[];
  habits: HabitItem[];
  progress: { done: number; total: number };
  rewards: { remainingToday: number; pendingSelect: number; pendingFeed: number };
};

type FoodDefinition = {
  cardKey: string;
  name: string;
  emoji: string;
  factText: string;
  nutrientDeltaJson: string;
};

type PendingGrant = {
  id: number;
  status: 'PENDING_SELECT' | 'SELECTED';
  candidates: FoodDefinition[];
};

type Celebration = {
  message: string;
  progress: string;
};

const TASK_COLORS = ['#e9f5ff', '#fff0db', '#eee9ff', '#e8fff5', '#fff0f6', '#f2f7df'];
const SLOT_LABELS = { morning: '早上', nap: '午休', evening: '晚上', daily: '今天' };
const CONFETTI_COLORS = ['#7658cf', '#e2639f', '#f3bd4f', '#4eb894', '#63a8e8', '#ff8a65'];
const CONFETTI_PIECES = Array.from({ length: 24 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 24;
  const distance = 105 + (index % 4) * 18;
  return {
    x: Math.round(Math.cos(angle) * distance),
    y: Math.round(Math.sin(angle) * distance),
    rotation: 180 + (index % 5) * 70,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    delay: (index % 6) * 0.025,
  };
});

export default function HabitsPage() {
  const router = useRouter();
  const profile = useHabitProfile();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [activeGrant, setActiveGrant] = useState<PendingGrant | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [loadError, setLoadError] = useState('');
  const retryKeys = useRef(new Map<string, string>());
  const celebrationTimer = useRef<number | null>(null);

  const selectedFood = activeGrant?.candidates.find((card) => card.cardKey === selectedCard);
  const selectedFoodEducation = selectedFood ? getFoodEducation(selectedFood.cardKey) : null;

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  }, []);

  const refresh = useCallback(async (withLoading = true) => {
    if (!profile.selectedId) {
      setLoading(false);
      return;
    }
    if (withLoading) setLoading(true);
    setLoadError('');
    try {
      setDashboard(await habitFetch<Dashboard>(`/api/child-profiles/${profile.selectedId}/habits`));
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载失败';
      setLoadError(message);
      showToast(message);
    } finally {
      if (withLoading) setLoading(false);
    }
  }, [profile.selectedId, showToast]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => () => {
    if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current);
  }, []);
  useEffect(() => {
    if (!activeGrant || !profile.selectedId) return;
    void fetch('/api/operation-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'habit_reward_candidates_shown',
        metadata: { childProfileId: profile.selectedId, grantId: activeGrant.id },
      }),
    });
  }, [activeGrant, profile.selectedId]);

  const openOldestReward = useCallback(async () => {
    if (!profile.selectedId) return;
    try {
      const grants = await habitFetch<PendingGrant[]>(`/api/child-profiles/${profile.selectedId}/reward-grants?status=pending`);
      const pending = grants.find((grant) => grant.status === 'PENDING_SELECT');
      if (pending) {
        setActiveGrant(pending);
        setSelectedCard(pending.candidates[0]?.cardKey || null);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : '奖励加载失败');
    }
  }, [profile.selectedId, showToast]);

  const checkIn = async (habit: HabitItem, slot: SlotState) => {
    if (slot.status === 'COMPLETED') {
      showToast('这个时段已经打过卡啦');
      return;
    }
    if (!slot.isOpen) {
      showToast(slot.windowLabel ? `请在${slot.windowLabel}内完成` : '这个时段还没有开放');
      return;
    }
    const actionKey = `${habit.id}:${slot.slot}:${dashboard?.localDate}`;
    const idempotencyKey = retryKeys.current.get(actionKey) || uuid();
    retryKeys.current.set(actionKey, idempotencyKey);
    setBusySlot(actionKey);
    try {
      const result = await habitFetch<{ rewardOutcome: string }>(`/api/child-habits/${habit.id}/check-in`, {
        method: 'POST',
        body: JSON.stringify({
          expectedSlot: slot.slot,
          expectedLocalDate: dashboard?.localDate,
          idempotencyKey,
        }),
      });
      retryKeys.current.delete(actionKey);
      const hasReward = result.rewardOutcome !== 'NO_REWARD';
      setCelebration({
        message: hasReward ? '你获得了一次食物卡选择' : '今天的食物卡已领完，成长仍在继续',
        progress: `今天已完成 ${Math.min((dashboard?.progress.done || 0) + 1, dashboard?.progress.total || 1)} / ${dashboard?.progress.total || 1}`,
      });
      const celebrationDone = new Promise<void>((resolve) => {
        if (celebrationTimer.current) window.clearTimeout(celebrationTimer.current);
        celebrationTimer.current = window.setTimeout(() => {
          setCelebration(null);
          resolve();
        }, 1800);
      });
      await Promise.all([refresh(false), celebrationDone]);
      if (result.rewardOutcome !== 'NO_REWARD') await openOldestReward();
    } catch (error) {
      showToast(error instanceof Error ? error.message : '打卡失败，请重试');
    } finally {
      setBusySlot(null);
    }
  };

  const confirmSelection = async () => {
    if (!activeGrant || !selectedCard || !profile.selectedId) return;
    try {
      await habitFetch(`/api/reward-grants/${activeGrant.id}/selection`, {
        method: 'POST',
        body: JSON.stringify({ cardKey: selectedCard, idempotencyKey: uuid() }),
      });
      setActiveGrant(null);
      await refresh();
      router.push(`/habits/companion?childProfileId=${profile.selectedId}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : '选卡失败');
    }
  };

  const tasks = useMemo(() => {
    if (!dashboard) return [];
    const habitMap = new Map(dashboard.habits.filter((item) => item.templateKey).map((item) => [item.templateKey, item]));
    const templateTasks = dashboard.templates.map((template) => ({ template, habit: habitMap.get(template.templateKey) || null }));
    const customTasks = dashboard.habits.filter((item) => item.source === 'CUSTOM').map((habit) => ({
      template: { templateKey: `custom-${habit.id}`, name: habit.name, emoji: habit.emoji, sortOrder: habit.sortOrder, slots: habit.slots.map((slot) => slot.slot) },
      habit,
    }));
    return [...templateTasks, ...customTasks];
  }, [dashboard]);

  if (profile.loading || loading) return <LoadingHabitPage />;
  if (!profile.profiles.length) return <ProfileRequired profiles={profile.profiles} />;
  if (loadError || !dashboard) return <HabitLoadError message={loadError || '今日计划暂时不可用'} onRetry={() => void refresh()} />;
  if (dashboard.adoptionRequired) return <main className="habit-shell">
    <HabitTopbar title="今日成长打卡" subtitle="从领养一位新朋友开始" backHref="/" profiles={profile.profiles} selectedId={profile.selectedId} onSelect={profile.setSelectedId} forceChoice={profile.needsChoice} />
    <section className="habit-empty-page"><div className="habit-empty-illustration">🐾</div><h1>先领养一位小伙伴</h1><p>领养后开启新的成长旅程，一起打卡、收集食物卡。</p><Link className="habit-primary-button" href={`/habits/adopt?childProfileId=${profile.selectedId}`}>选择宠物</Link></section>
  </main>;

  return (
    <main className="habit-shell">
      <HabitTopbar
        title="今日成长打卡"
        subtitle="完成习惯，收集食物卡"
        backHref="/"
        profiles={profile.profiles}
        selectedId={profile.selectedId}
        onSelect={profile.setSelectedId}
        forceChoice={profile.needsChoice}
      />
      {dashboard && (
        <>
          <section className="habit-day-card">
            <small>{dashboard.localDate} · 每天 04:00 开启新计划</small>
            <h1>{dashboard.progress.total ? `和小芽一起完成 ${dashboard.progress.total} 个打卡位` : '今天想养成什么小习惯？'}</h1>
            <div className="habit-progress-track"><div className="habit-progress-fill" style={{ width: `${dashboard.progress.total ? dashboard.progress.done / dashboard.progress.total * 100 : 0}%` }} /></div>
            <div className="habit-progress-copy"><span>{dashboard.progress.done ? `已经完成 ${dashboard.progress.done} 个` : '今天刚刚开始'}</span><b>{dashboard.progress.done} / {dashboard.progress.total}</b></div>
          </section>
          {dashboard.rewards.pendingSelect > 0 && (
            <button type="button" className="habit-pending-banner" onClick={() => void openOldestReward()}>
              <Gift size={23} /><span><b>有 {dashboard.rewards.pendingSelect} 张食物卡等你选择</b><small>关闭后不会消失，跨天也会保留</small></span><strong>继续</strong>
            </button>
          )}
          {dashboard.rewards.pendingFeed > 0 && !dashboard.rewards.pendingSelect && (
            <Link className="habit-pending-banner" href={`/habits/companion?childProfileId=${profile.selectedId}`}>
              <Gift size={23} /><span><b>有 {dashboard.rewards.pendingFeed} 张食物卡等待喂养</b><small>去浮岛花园看看小芽</small></span><strong>去喂养</strong>
            </Link>
          )}
          <div className="habit-section-heading"><h2>今天要做</h2><span>轻轻一点就能打卡</span></div>
          {!dashboard.progress.total && (
            <section className="habit-empty-page" style={{ minHeight: 280 }}>
              <div className="habit-empty-illustration">🌱</div><h1>先选 1–3 个小习惯吧</h1><p>从一件容易完成的小事开始，休息后也可以随时回来。</p>
              <Link href={`/habits/manage?childProfileId=${profile.selectedId}`} className="habit-primary-button"><Settings size={18} />设置习惯</Link>
            </section>
          )}
          {dashboard.progress.total > 0 && (
            <div className="habit-grid">
              {tasks.map(({ template, habit }, index) => {
                const enabled = Boolean(habit?.enabled);
                const complete = Boolean(enabled && habit?.slots.every((slot) => slot.status === 'COMPLETED'));
                return (
                  <article key={template.templateKey} className={`habit-task ${enabled ? '' : 'disabled'} ${complete ? 'complete' : ''}`} style={{ '--task-bg': TASK_COLORS[index % TASK_COLORS.length] } as React.CSSProperties}>
                    <span className="habit-check"><Check size={16} /></span><span className="habit-task-art">{template.emoji}</span><b>{template.name}</b>
                    <small>{enabled ? (habit?.frequency === 'TWICE_DAILY' ? (habit.templateKey === 'bedtime' ? '午休和晚上分别记录，共 2 个完成位' : '早上和晚上分别记录，共 2 个完成位') : '每天完成 1 次') : '还没有加入今天计划'}</small>
                    {enabled && habit && <div className="habit-slot-row">{habit.slots.map((slot) => {
                      const key = `${habit.id}:${slot.slot}:${dashboard.localDate}`;
                      return <button key={slot.slot} type="button" disabled={busySlot === key} className={`habit-slot ${slot.status === 'COMPLETED' ? 'done' : slot.isOpen ? 'open' : 'locked'}`} title={slot.windowLabel} aria-label={`${habit.name}·${SLOT_LABELS[slot.slot]}（${slot.windowLabel}）`} onClick={() => void checkIn(habit, slot)}>{slot.status === 'COMPLETED' ? '✓ ' : ''}{SLOT_LABELS[slot.slot]}</button>;
                    })}</div>}
                  </article>
                );
              })}
            </div>
          )}
          <Link href={`/habits/manage?childProfileId=${profile.selectedId}`} className="habit-manage-link"><Settings size={18} />习惯管理与历史</Link>
          {!dashboard.featureEnabled && <div className="habit-toast">习惯打卡正在维护，已有奖励和历史仍可访问</div>}
        </>
      )}
      {activeGrant && (
        <div className="habit-overlay" role="dialog" aria-modal="true" aria-labelledby="reward-title" onClick={(event) => { if (event.target === event.currentTarget) setActiveGrant(null); }}>
          <section className="habit-modal">
            <div className="habit-modal-head"><div><h2 id="reward-title">打卡成功，选一张食物卡</h2><p>三张都很棒，选你今天最想带走的一张</p></div><button type="button" className="habit-close" aria-label="关闭" onClick={() => setActiveGrant(null)}><X size={19} /></button></div>
            <div className="habit-choice-grid">{activeGrant.candidates.map((card) => <button type="button" key={card.cardKey} className={`habit-food-choice ${selectedCard === card.cardKey ? 'active' : ''}`} onClick={() => setSelectedCard(card.cardKey)}><Image src={`/habits/foods/${card.cardKey}.png`} alt={card.name} width={160} height={160} /><b>{card.name}</b></button>)}</div>
            {selectedFood && selectedFoodEducation && (
              <div className="habit-food-detail">
                <b>{selectedFood.name}</b>
                <div className="habit-food-education-row"><strong>富含营养</strong><div>{selectedFoodEducation.nutrients.map((nutrient) => <span key={nutrient}>{nutrient}</span>)}</div></div>
                <div className="habit-food-education-row"><strong>身体帮助</strong><p>{selectedFoodEducation.benefit}</p></div>
              </div>
            )}
            <button type="button" className="habit-primary-button" style={{ width: '100%' }} onClick={() => void confirmSelection()}>放进背包并去喂养</button>
            <p className="habit-disclaimer">卡片属性是游戏数值，不代表真实摄入量或医疗建议</p>
          </section>
        </div>
      )}
      {celebration && (
        <div className="habit-celebration-layer" role="status" aria-live="polite">
          <div className="habit-confetti" aria-hidden="true">
            {CONFETTI_PIECES.map((piece, index) => (
              <span
                key={index}
                style={{
                  '--confetti-x': `${piece.x}px`,
                  '--confetti-y': `${piece.y}px`,
                  '--confetti-rotation': `${piece.rotation}deg`,
                  '--confetti-color': piece.color,
                  '--confetti-delay': `${piece.delay}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <section className="habit-celebration-card" aria-label="打卡成功">
            <div className="habit-celebration-icon"><Check size={34} strokeWidth={3} /></div>
            <div className="habit-celebration-title"><Sparkles size={18} aria-hidden="true" />打卡成功！<Sparkles size={18} aria-hidden="true" /></div>
            <p>{celebration.message}</p>
            <small>{celebration.progress}</small>
          </section>
        </div>
      )}
      {toast && <div className="habit-toast" role="status">{toast}</div>}
    </main>
  );
}

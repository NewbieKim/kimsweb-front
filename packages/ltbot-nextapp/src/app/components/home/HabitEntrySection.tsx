'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useAuthGate } from '@/app/components/AuthGateProvider';
import { habitFetch, type ChildProfileSummary } from '@/app/habits/components/shared';

type Dashboard = {
  progress: { done: number; total: number };
  rewards: { pendingSelect: number; pendingFeed: number };
};

export default function HabitEntrySection() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const { openAuthGate } = useAuthGate();
  const [child, setChild] = useState<ChildProfileSummary | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    void fetch('/api/operation-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'habit_feature_exposure',
        userId: user?.id,
        metadata: { bucket: 'all', flagVersion: 'full-v1', hasChildProfile: null },
      }),
    });
  }, [isLoaded, user?.id]);

  useEffect(() => {
    if (!isSignedIn || !user?.id) return;
    let cancelled = false;
    void habitFetch<ChildProfileSummary[]>('/api/child-profiles').then(async (profiles) => {
      if (cancelled || !profiles.length) return;
      const stored = Number(localStorage.getItem(`habits:last-child:${user.id}`));
      const selected = profiles.find((profile) => profile.id === stored) || (profiles.length === 1 ? profiles[0] : null) || profiles[0];
      setChild(selected);
      try {
        const data = await habitFetch<Dashboard>(`/api/child-profiles/${selected.id}/habits`);
        if (!cancelled) setDashboard(data);
      } catch {
        // The entry remains useful even when the progress summary is unavailable.
      }
    });
    return () => { cancelled = true; };
  }, [isSignedIn, user?.id]);

  const openHabits = () => {
    const perform = () => {
      void fetch('/api/operation-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'habit_home_entry_click',
          userId: user?.id,
          metadata: {
            childProfileId: child?.id || null,
            progressDone: dashboard?.progress.done || 0,
            progressTotal: dashboard?.progress.total || 0,
          },
        }),
      });
      router.push(child ? `/habits?childProfileId=${child.id}` : '/habits');
    };
    if (!isSignedIn) openAuthGate(perform);
    else perform();
  };

  const pending = (dashboard?.rewards.pendingSelect || 0) + (dashboard?.rewards.pendingFeed || 0);
  return (
    <button type="button" className="habit-home-entry" onClick={openHabits} aria-label="进入今日习惯打卡">
      <div className="habit-home-entry-copy">
        <span className="habit-home-entry-eyebrow">{child ? `${child.nickname}的成长小计划` : '每天一点小进步'}</span>
        <h2>今天也来打个卡吧</h2>
        <p>完成小习惯，带食物去浮岛花园看小芽</p>
        <span className="habit-home-progress">今日 {dashboard?.progress.done || 0} / {dashboard?.progress.total || 0}{pending ? ` · ${pending} 份奖励待处理` : ''}</span>
      </div>
      <Image className="habit-home-pet" src="/habits/companions/rabbit.png" alt="小兔伙伴小芽" width={220} height={260} />
    </button>
  );
}

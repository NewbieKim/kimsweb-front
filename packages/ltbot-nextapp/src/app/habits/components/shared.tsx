'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { ArrowLeft, ChevronDown } from 'lucide-react';

export interface ChildProfileSummary {
  id: number;
  nickname: string;
  ageGroup: string;
  avatarId: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errorCode?: string;
  details?: Record<string, unknown>;
}

export async function habitFetch<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json() as ApiEnvelope<T>;
  if (!response.ok || !payload.success || payload.data === undefined) {
    const error = new Error(payload.message || '请求失败') as Error & {
      errorCode?: string;
      details?: Record<string, unknown>;
    };
    error.errorCode = payload.errorCode;
    error.details = payload.details;
    throw error;
  }
  return payload.data;
}

export function uuid() {
  return crypto.randomUUID();
}

export function useHabitProfile() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<ChildProfileSummary[]>([]);
  const [selectedId, setSelectedIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsChoice, setNeedsChoice] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let cancelled = false;
    void habitFetch<ChildProfileSummary[]>('/api/child-profiles')
      .then((items) => {
        if (cancelled) return;
        setProfiles(items);
        const requested = Number(searchParams.get('childProfileId'));
        const requestedProfile = items.find((item) => item.id === requested);
        const storageKey = `habits:last-child:${userId}`;
        const stored = Number(localStorage.getItem(storageKey));
        const storedProfile = items.find((item) => item.id === stored);
        const selected = requestedProfile || storedProfile || items[0] || null;
        setSelectedIdState(selected?.id || null);
        setNeedsChoice(!requestedProfile && !storedProfile && items.length > 1);
        if (selected) localStorage.setItem(storageKey, String(selected.id));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, searchParams, userId]);

  const setSelectedId = useCallback((id: number) => {
    setSelectedIdState(id);
    setNeedsChoice(false);
    if (userId) localStorage.setItem(`habits:last-child:${userId}`, String(id));
  }, [userId]);

  return {
    profiles,
    selectedId,
    selectedProfile: profiles.find((item) => item.id === selectedId) || null,
    setSelectedId,
    loading,
    needsChoice,
  };
}

export function ProfileChooser({
  profiles,
  selectedId,
  onSelect,
  forceOpen = false,
}: {
  profiles: ChildProfileSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  forceOpen?: boolean;
}) {
  const [open, setOpen] = useState(forceOpen);
  // The chooser mirrors a parent-provided one-time open request.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(forceOpen), [forceOpen]);
  const selected = profiles.find((profile) => profile.id === selectedId);
  if (!profiles.length) return null;
  return (
    <div className="habit-profile-picker">
      <button type="button" className="habit-profile-trigger" onClick={() => setOpen((value) => !value)}>
        <span>{selected?.nickname || '选择孩子'}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div className="habit-profile-menu" role="menu" aria-label="选择孩子档案">
          {profiles.map((profile) => (
            <button
              type="button"
              role="menuitem"
              key={profile.id}
              className={profile.id === selectedId ? 'active' : ''}
              onClick={() => {
                onSelect(profile.id);
                setOpen(false);
              }}
            >
              <span className="habit-profile-avatar">{profile.avatarId === 'girl' ? '👧' : profile.avatarId === 'boy' ? '👦' : '🧒'}</span>
              <span><b>{profile.nickname}</b><small>{profile.ageGroup} 岁</small></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HabitTopbar({
  title,
  subtitle,
  backHref,
  profiles,
  selectedId,
  onSelect,
  forceChoice,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  profiles: ChildProfileSummary[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  forceChoice?: boolean;
  action?: React.ReactNode;
}) {
  const href = selectedId ? `${backHref}${backHref.includes('?') ? '&' : '?'}childProfileId=${selectedId}` : backHref;
  return (
    <header className="habit-topbar">
      <Link href={href} className="habit-icon-button" aria-label="返回">
        <ArrowLeft size={21} />
      </Link>
      <div className="habit-topbar-copy"><b>{title}</b>{subtitle && <small>{subtitle}</small>}</div>
      {action || (
        <ProfileChooser
          profiles={profiles}
          selectedId={selectedId}
          onSelect={onSelect}
          forceOpen={forceChoice}
        />
      )}
    </header>
  );
}

export function ProfileRequired({ profiles }: { profiles: ChildProfileSummary[] }) {
  const hasProfiles = useMemo(() => profiles.length > 0, [profiles]);
  if (hasProfiles) return null;
  return (
    <main className="habit-empty-page">
      <div className="habit-empty-illustration">🧒</div>
      <h1>先创建一个孩子档案</h1>
      <p>习惯、食物卡和伙伴成长都会独立保存在孩子档案中。</p>
      <Link href="/to-view-mine/child-profiles" className="habit-primary-button">创建孩子档案</Link>
    </main>
  );
}

export function LoadingHabitPage() {
  return <main className="habit-loading" aria-label="正在加载"><span /><span /><span /></main>;
}

export function HabitLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="habit-empty-page" role="alert">
      <div className="habit-empty-illustration">🌧️</div>
      <h1>这片小花园暂时没连上</h1>
      <p>{message}</p>
      <button type="button" className="habit-primary-button" onClick={onRetry}>重新加载</button>
      <Link href="/" className="habit-manage-link">返回首页</Link>
    </main>
  );
}

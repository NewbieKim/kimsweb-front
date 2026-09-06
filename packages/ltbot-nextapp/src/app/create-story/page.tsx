'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import CustomLoader from '@/app/components/CustomLoader';
import DreamPlace from '@/app/create-story/components/DreamPlace';
import {
  CHILD_AGE_GROUPS,
  CHILD_AVATARS,
  CHILD_ROLES,
  CHILD_TRAITS,
  PARTNER_PRESETS,
  TONIGHT_MATERIAL_INTENTS,
} from '@/lib/story-customization/catalog';
import { findScene } from '@/lib/story-customization/scene-catalog';
import type { ChildProfileInput, PartnerValue } from '@/lib/story-customization/types';
import { QUICK_GROWTH_THEME_CATEGORIES } from '@/constants';

type Profile = ChildProfileInput & { id: number; deletedAt: string | null; completedStoryCount: number };

const emptyDraft: ChildProfileInput = {
  avatarId: 'child',
  nickname: '',
  ageGroup: '4-6',
  role: 'custom',
  traitIds: ['curious'],
  partner: { type: 'preset', id: 'cat', name: '小猫', emoji: '🐱' },
};

function profileToDraft(profile: Profile): ChildProfileInput {
  return {
    avatarId: profile.avatarId,
    nickname: profile.nickname,
    ageGroup: profile.ageGroup,
    role: profile.role,
    traitIds: profile.traitIds,
    partner: profile.partner,
  };
}

function sameDraft(a: ChildProfileInput | null, b: ChildProfileInput | null) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getMonotonicTime() {
  return typeof window === 'undefined' ? 0 : window.performance.now();
}

function CreateStoryContent() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ChildProfileInput>(emptyDraft);
  const [step, setStep] = useState(1);
  const [dreamWorldId, setDreamWorldId] = useState<string | null>(null);
  const [growthTheme, setGrowthTheme] = useState('安静入睡');
  const [customTheme, setCustomTheme] = useState('');
  const [materialIntent, setMaterialIntent] = useState<string>(TONIGHT_MATERIAL_INTENTS[0].id);
  const [materialText, setMaterialText] = useState('');
  const [loading, setLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const idempotencyKey = useRef<string | undefined>(undefined);
  const sceneStepStartedAt = useRef(0);
  const exposedSceneCategories = useRef(new Set<string>());

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );
  const finalTheme = customTheme.trim() || growthTheme;
  const selectedSceneDefinition = dreamWorldId ? findScene(dreamWorldId) ?? null : null;
  const themes = useMemo(
    () => QUICK_GROWTH_THEME_CATEGORIES.flatMap((category) => category.themes).slice(0, 12),
    [],
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void fetch('/api/child-profiles')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || '加载档案失败');
        return result.data as Profile[];
      })
      .then((items) => {
        setProfiles(items);
        const requested = Number(searchParams.get('childProfileId'));
        const preferred = items.find((item) => item.id === requested) ?? items[0];
        if (preferred) {
          setSelectedProfileId(preferred.id);
          setDraft(profileToDraft(preferred));
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : '加载档案失败'))
      .finally(() => setProfilesLoading(false));
  }, [isLoaded, isSignedIn, searchParams]);

  const updateDraft = <K extends keyof ChildProfileInput>(field: K, value: ChildProfileInput[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    idempotencyKey.current = undefined;
  };

  const selectProfile = (profile: Profile) => {
    if (activeProfile && !sameDraft(draft, profileToDraft(activeProfile)) && !window.confirm('本次调整还没有保存，切换档案会放弃这些临时设定，确定继续吗？')) return;
    setSelectedProfileId(profile.id);
    setDraft(profileToDraft(profile));
    idempotencyKey.current = undefined;
  };

  const createProfile = async (): Promise<Profile> => {
    const response = await fetch('/api/child-profiles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
    });
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || '保存档案失败');
    const created = result.data as Profile;
    setProfiles((items) => [created, ...items]);
    setSelectedProfileId(created.id);
    setDraft(profileToDraft(created));
    return created;
  };

  const submit = async () => {
    if (!draft.nickname.trim()) return toast.error('请先填写孩子昵称');
    let profileId = selectedProfileId;
    if (!profileId) {
      try { profileId = (await createProfile()).id; } catch (error) { return toast.error(error instanceof Error ? error.message : '请先完成建档'); }
    }
    setLoading(true);
    try {
      idempotencyKey.current ??= crypto.randomUUID();
      const createResponse = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({
          mode: 'customized',
          childProfileId: profileId,
          childOverrides: draft,
          sceneId: dreamWorldId,
          growthTheme: finalTheme,
          tonightMaterial: materialText.trim() ? { intent: materialIntent, text: materialText.trim() } : null,
        }),
      });
      const createResult = await createResponse.json();
      if (!createResponse.ok || !createResult.success) throw new Error(createResult.message || '创建故事失败');
      const story = createResult.data as { id: number };
      const generateResponse = await fetch('/api/stories/generate-async', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storyId: story.id }),
      });
      if (!generateResponse.ok) throw new Error('故事已创建，但生成任务启动失败，可在结果页重试');
      router.push(`/create-story/result/${story.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成故事失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || profilesLoading) return <CustomLoader isLoading />;
  if (!isSignedIn) return <div className="flex min-h-screen items-center justify-center"><Link href="/sign-in?redirect_url=/create-story"><Button color="primary">登录后创作故事</Button></Link></div>;

  return (
    <main className="min-h-screen px-4 pb-36 pt-6 md:pb-24" style={{ background: 'var(--theme-bg-base)' }}>
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-6 flex items-center justify-between">
          <div><p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>专属睡前故事 · {step}/3</p><h1 className="text-3xl font-bold" style={{ color: 'var(--theme-accent)' }}>为 TA 定制今晚的故事</h1></div>
          {step === 2 && activeProfile ? (
            <span className="rounded-full px-3 py-2 text-sm font-semibold" style={{ color: 'var(--theme-accent)', background: 'var(--theme-bg-subtle)' }}>
              {activeProfile.nickname} · {draft.ageGroup}岁
            </span>
          ) : (
            <Link href="/to-view-mine/child-profiles" className="text-sm" style={{ color: 'var(--theme-accent)' }}>管理档案</Link>
          )}
        </div>

        {step === 1 && <section className="mx-auto max-w-3xl space-y-5 rounded-3xl p-5 shadow-sm" style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)' }}>
          <div><h2 className="text-xl font-bold">选择孩子档案</h2><p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>可以只调整本次故事，不会修改档案。</p></div>
          {profiles.length > 0 && <div className="flex flex-wrap gap-2">{profiles.map((profile) => <button key={profile.id} type="button" onClick={() => selectProfile(profile)} className="rounded-full border px-4 py-2 text-sm" style={{ borderColor: selectedProfileId === profile.id ? 'var(--theme-accent)' : 'var(--theme-border)', background: selectedProfileId === profile.id ? 'var(--theme-bg-subtle)' : undefined }}>{profile.nickname} · {profile.ageGroup}</button>)}</div>}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{CHILD_AVATARS.map((avatar) => <button key={avatar.id} type="button" onClick={() => updateDraft('avatarId', avatar.id)} className="rounded-2xl border p-3 text-center" style={{ borderColor: draft.avatarId === avatar.id ? 'var(--theme-accent)' : 'var(--theme-border)' }}><span className="text-3xl">{avatar.emoji}</span><span className="mt-1 block text-xs">{avatar.label}</span></button>)}</div>
          <Input label="孩子昵称" value={draft.nickname} maxLength={12} onValueChange={(value) => updateDraft('nickname', value)} />
          <div><p className="mb-2 text-sm font-semibold">年龄阶段</p><div className="grid grid-cols-2 gap-2">{CHILD_AGE_GROUPS.map((age) => <button key={age.id} type="button" onClick={() => updateDraft('ageGroup', age.id)} className="rounded-xl border p-3 text-left" style={{ borderColor: draft.ageGroup === age.id ? 'var(--theme-accent)' : 'var(--theme-border)' }}><b>{age.label}</b><span className="mt-1 block text-xs" style={{ color: 'var(--theme-text-muted)' }}>{age.detail}</span></button>)}</div></div>
          <div><p className="mb-2 text-sm font-semibold">主角角色</p><div className="flex gap-2">{CHILD_ROLES.map((role) => <button key={role.id} type="button" onClick={() => updateDraft('role', role.id)} className="rounded-full border px-4 py-2" style={{ borderColor: draft.role === role.id ? 'var(--theme-accent)' : 'var(--theme-border)' }}>{role.emoji} {role.label}</button>)}</div></div>
          <div><p className="mb-2 text-sm font-semibold">性格方向（1-3 个）</p><div className="flex flex-wrap gap-2">{CHILD_TRAITS.map((trait) => { const active = draft.traitIds.includes(trait.id); return <button key={trait.id} type="button" onClick={() => updateDraft('traitIds', active ? draft.traitIds.filter((id) => id !== trait.id) : [...draft.traitIds, trait.id].slice(0, 3))} className="rounded-full border px-4 py-2" style={{ borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)' }}>{trait.emoji} {trait.label}</button>; })}</div></div>
          <div><p className="mb-2 text-sm font-semibold">今晚的伙伴</p><div className="flex flex-wrap gap-2">{PARTNER_PRESETS.map((partner) => <button key={partner.id} type="button" onClick={() => updateDraft('partner', { type: 'preset', id: partner.id, name: partner.name, emoji: partner.emoji } as PartnerValue)} className="rounded-full border px-4 py-2" style={{ borderColor: draft.partner.id === partner.id ? 'var(--theme-accent)' : 'var(--theme-border)' }}>{partner.emoji} {partner.name}</button>)}</div><Input className="mt-3" label="自定义伙伴（可选）" value={draft.partner.type === 'custom' ? draft.partner.name : ''} maxLength={12} onValueChange={(value) => updateDraft('partner', { type: 'custom', name: value, emoji: '🌟' })} /></div>
        </section>}

        <div hidden={step !== 2}>
          <DreamPlace
            active={step === 2}
            ageGroup={draft.ageGroup}
            selectedSceneId={dreamWorldId}
            onChange={(sceneId) => {
              setDreamWorldId(sceneId);
              idempotencyKey.current = undefined;
            }}
            onCategoryExposed={(categoryId) => exposedSceneCategories.current.add(categoryId)}
          />
        </div>

        {step === 3 && <section className="mx-auto max-w-3xl space-y-5 rounded-3xl p-5 shadow-sm" style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)' }}><h2 className="text-xl font-bold">想告诉 TA 什么？</h2><div className="grid grid-cols-3 gap-2">{themes.map((theme) => <button key={theme.id} type="button" onClick={() => { setGrowthTheme(theme.shortLabel); setCustomTheme(''); }} className="rounded-xl border p-3 text-sm" style={{ borderColor: growthTheme === theme.shortLabel && !customTheme ? 'var(--theme-accent)' : 'var(--theme-border)' }}>{theme.icon} {theme.shortLabel}</button>)}</div><Input label="自定义成长主题（可选）" maxLength={80} value={customTheme} onValueChange={setCustomTheme} placeholder="例如：学会和小情绪做朋友" /><div><p className="mb-2 text-sm font-semibold">今晚小事（可跳过，最多 80 字）</p><div className="flex flex-wrap gap-2">{TONIGHT_MATERIAL_INTENTS.map((intent) => <button key={intent.id} type="button" onClick={() => setMaterialIntent(intent.id)} className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: materialIntent === intent.id ? 'var(--theme-accent)' : 'var(--theme-border)' }}>{intent.label}</button>)}</div><textarea value={materialText} maxLength={80} onChange={(event) => setMaterialText(event.target.value)} placeholder="写下今天想被温柔接住的一件小事" className="mt-3 min-h-28 w-full rounded-xl border p-3" /></div><p className="rounded-xl p-3 text-sm" style={{ background: 'var(--theme-bg-subtle)', color: 'var(--theme-text-muted)' }}>🔒 新故事仅自己可见。你可以在详情页继续点赞、收藏、评论和播放 TTS。</p></section>}
      </div>
      <div className="fixed inset-x-0 bottom-16 z-40 border-t p-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur md:bottom-0" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-surface)' }}><div className="mx-auto flex max-w-[1120px] gap-3">{step > 1 && <Button className="min-h-12 min-w-[120px] px-6" variant="flat" onPress={() => {
        if (step === 3) {
          sceneStepStartedAt.current = getMonotonicTime();
          exposedSceneCategories.current.clear();
        }
        setStep((value) => value - 1);
      }} isDisabled={loading}>上一步</Button>}<Button className="min-h-12 flex-1 font-semibold text-white" onPress={() => {
        if (step === 2) {
          const scene = selectedSceneDefinition;
          if (!scene) return;
          void fetch('/api/operation-events', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
            body: JSON.stringify({
              eventType: 'scene_step_completed',
              metadata: {
                sceneId: scene.id,
                categoryId: scene.categoryId,
                durationMs: Math.max(0, Math.round(getMonotonicTime() - sceneStepStartedAt.current)),
                scrollCategoryCount: exposedSceneCategories.current.size,
              },
            }),
          }).catch(() => undefined);
        }
        if (step < 3) {
          if (step === 1) {
            sceneStepStartedAt.current = getMonotonicTime();
            exposedSceneCategories.current.clear();
          }
          setStep((value) => value + 1);
        } else {
          void submit();
        }
      }} isDisabled={loading || (step === 2 && !selectedSceneDefinition)} isLoading={loading} style={{ background: step === 2 && !selectedSceneDefinition ? '#d9d3cc' : 'linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))', color: step === 2 && !selectedSceneDefinition ? '#8f8983' : '#ffffff' }}>{step === 2 ? selectedSceneDefinition ? '下一步：成长主题' : '请选择一个梦境场景' : step < 3 ? '下一步' : '生成我的私密故事'}</Button></div></div>
    </main>
  );
}

export default function CreateStoryPage() {
  return (
    <Suspense fallback={<CustomLoader isLoading />}>
      <CreateStoryContent />
    </Suspense>
  );
}

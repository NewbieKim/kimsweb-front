'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useUser } from '@clerk/nextjs';
import { toast } from 'react-toastify';
import CustomLoader from '@/app/components/CustomLoader';
import DreamPlace from '@/app/create-story/components/DreamPlace';
import {
  CHILD_AGE_GROUPS,
  CHILD_AVATARS,
  CHILD_ROLES,
  CHILD_TRAITS,
  TONIGHT_MATERIAL_INTENTS,
  defaultRoleForAvatar,
} from '@/lib/story-customization/catalog';
import { findScene } from '@/lib/story-customization/scene-catalog';
import type { ChildProfileInput } from '@/lib/story-customization/types';
import { QUICK_GROWTH_THEME_CATEGORIES, type QuickGrowthThemeItem } from '@/constants';

type Profile = ChildProfileInput & { id: number; deletedAt: string | null; completedStoryCount: number; pet?: { petKey: string; displayName: string } | null };

const THEME_BATCH_SIZE = 9;

const pickRandomThemeBatch = (
  allThemes: QuickGrowthThemeItem[],
  selectedTheme: string | null,
): QuickGrowthThemeItem[] => {
  const pool = [...allThemes];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  if (!selectedTheme) {
    return pool.slice(0, THEME_BATCH_SIZE);
  }

  const selected = allThemes.find((item) => item.shortLabel === selectedTheme);
  if (!selected) {
    return pool.slice(0, THEME_BATCH_SIZE);
  }

  const others = pool.filter((item) => item.id !== selected.id).slice(0, THEME_BATCH_SIZE - 1);
  return [selected, ...others];
};

const emptyDraft: ChildProfileInput = {
  avatarId: 'child',
  nickname: '',
  ageGroup: '4-6',
  role: 'custom',
  traitIds: ['curious'],
  partner: { type: 'preset', id: 'cat', name: '小猫', emoji: '🐱' },
};

const isCatalogRole = (role: string) => CHILD_ROLES.some((item) => item.id === role);

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
  const { isLoaded, isSignedIn, user } = useUser();
  const draftStorageKey = user?.id ? `create-story:pet-draft:${user.id}` : null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ChildProfileInput>(emptyDraft);
  const [step, setStep] = useState(1);
  const [dreamWorldId, setDreamWorldId] = useState<string | null>(null);
  const [growthTheme, setGrowthTheme] = useState<string | null>('安静入睡');
  const [customTheme, setCustomTheme] = useState('');
  const [materialIntent, setMaterialIntent] = useState<string>(TONIGHT_MATERIAL_INTENTS[0].id);
  const [materialText, setMaterialText] = useState('');
  const [includePet, setIncludePet] = useState(true);
  const [loading, setLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [customOpen, setCustomOpen] = useState(false);
  const [customRoleDraft, setCustomRoleDraft] = useState('');
  const [customError, setCustomError] = useState('');
  const idempotencyKey = useRef<string | undefined>(undefined);
  const sceneStepStartedAt = useRef(0);
  const exposedSceneCategories = useRef(new Set<string>());

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedProfileId) ?? null,
    [profiles, selectedProfileId],
  );
  const allThemes = useMemo(
    () => QUICK_GROWTH_THEME_CATEGORIES.flatMap((category) => category.themes),
    [],
  );
  const [themeOptions, setThemeOptions] = useState<QuickGrowthThemeItem[]>(() =>
    pickRandomThemeBatch(
      QUICK_GROWTH_THEME_CATEGORIES.flatMap((category) => category.themes),
      '安静入睡',
    ),
  );
  const finalTheme = customTheme.trim() || growthTheme || '';
  const selectedSceneDefinition = dreamWorldId ? findScene(dreamWorldId) ?? null : null;

  const shuffleThemes = () => {
    setThemeOptions(pickRandomThemeBatch(allThemes, growthTheme));
    idempotencyKey.current = undefined;
  };

  const toggleGrowthTheme = (shortLabel: string) => {
    setCustomTheme('');
    setGrowthTheme((current) => (current === shortLabel ? null : shortLabel));
    idempotencyKey.current = undefined;
  };

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
        if (searchParams.get('resumePet') === '1' && draftStorageKey) {
          try {
            const saved = sessionStorage.getItem(draftStorageKey);
            if (saved) {
              const state = JSON.parse(saved) as { draft: ChildProfileInput; selectedProfileId: number; step: number; dreamWorldId: string | null; growthTheme: string | null; customTheme: string; materialIntent: string; materialText: string };
              setDraft(state.draft);
              setSelectedProfileId(state.selectedProfileId);
              setStep(state.step);
              setDreamWorldId(state.dreamWorldId);
              setGrowthTheme(state.growthTheme);
              setCustomTheme(state.customTheme);
              setMaterialIntent(state.materialIntent);
              setMaterialText(state.materialText);
              sessionStorage.removeItem(draftStorageKey);
            }
          } catch { sessionStorage.removeItem(draftStorageKey); }
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : '加载档案失败'))
      .finally(() => setProfilesLoading(false));
  }, [draftStorageKey, isLoaded, isSignedIn, searchParams]);

  const updateDraft = <K extends keyof ChildProfileInput>(field: K, value: ChildProfileInput[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
    idempotencyKey.current = undefined;
  };

  const selectPresetAvatar = (avatarId: string) => {
    setDraft((current) => ({
      ...current,
      avatarId,
      role: defaultRoleForAvatar(avatarId),
    }));
    idempotencyKey.current = undefined;
  };

  const openCustomModal = () => {
    setCustomRoleDraft(draft.avatarId === 'custom' && !isCatalogRole(draft.role) ? draft.role : '');
    setCustomError('');
    setCustomOpen(true);
  };

  const confirmCustom = () => {
    const text = customRoleDraft.normalize('NFC').trim();
    const length = Array.from(text).length;
    if (length < 1 || length > 12) {
      setCustomError('请填写 1–12 字的自定义角色');
      return;
    }
    if (isCatalogRole(text)) {
      setCustomError('换个更有特色的名字吧');
      return;
    }
    setDraft((current) => ({ ...current, avatarId: 'custom', role: text }));
    idempotencyKey.current = undefined;
    setCustomOpen(false);
    setCustomError('');
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

  const saveDraftAndAdopt = async () => {
    let profileId = selectedProfileId;
    if (!profileId) {
      if (!draft.nickname.trim()) return toast.error('请先填写孩子昵称');
      try { profileId = (await createProfile()).id; }
      catch (error) { return toast.error(error instanceof Error ? error.message : '请先完成建档'); }
    }
    if (draftStorageKey) sessionStorage.setItem(draftStorageKey, JSON.stringify({ draft, selectedProfileId: profileId, step, dreamWorldId, growthTheme, customTheme, materialIntent, materialText }));
    router.push(`/habits/adopt?childProfileId=${profileId}&returnTo=story`);
  };

  const submit = async () => {
    if (!draft.nickname.trim()) return toast.error('请先填写孩子昵称');
    if (!finalTheme.trim()) return toast.error('请先选择成长主题或输入自定义主题');
    if (includePet && !activeProfile?.pet) return void saveDraftAndAdopt();
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
          includePet,
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
          <div><p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>专属睡前故事 · {step}/3</p></div>
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
          <div>
            <h3 className="mb-3 text-base font-bold">选择主角</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CHILD_AVATARS.map((avatar) => {
                if (avatar.id === 'custom') {
                  const selected = draft.avatarId === 'custom';
                  const label = selected && !isCatalogRole(draft.role) ? draft.role : '自定义';
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={openCustomModal}
                      className="rounded-2xl border border-dashed p-3 text-center"
                      style={{
                        borderColor: selected ? 'var(--theme-accent)' : 'var(--theme-border)',
                        background: selected ? 'var(--theme-bg-subtle)' : undefined,
                      }}
                    >
                      <span className="text-3xl">{avatar.emoji}</span>
                      <span className="mt-1 block truncate text-xs">{label}</span>
                    </button>
                  );
                }
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => selectPresetAvatar(avatar.id)}
                    className="rounded-2xl border p-3 text-center"
                    style={{ borderColor: draft.avatarId === avatar.id ? 'var(--theme-accent)' : 'var(--theme-border)', background: draft.avatarId === avatar.id ? 'var(--theme-bg-subtle)' : undefined }}
                  >
                    <span className="text-3xl">{avatar.emoji}</span>
                    <span className="mt-1 block text-xs">{avatar.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <Input label="孩子昵称" value={draft.nickname} maxLength={12} onValueChange={(value) => updateDraft('nickname', value)} />
          <div><p className="mb-2 text-sm font-semibold">年龄阶段</p><div className="grid grid-cols-2 gap-2">{CHILD_AGE_GROUPS.map((age) => <button key={age.id} type="button" onClick={() => updateDraft('ageGroup', age.id)} className="rounded-xl border p-3 text-left" style={{ borderColor: draft.ageGroup === age.id ? 'var(--theme-accent)' : 'var(--theme-border)' }}><b>{age.label}</b><span className="mt-1 block text-xs" style={{ color: 'var(--theme-text-muted)' }}>{age.detail}</span></button>)}</div></div>
          <div><p className="mb-2 text-sm font-semibold">性格方向（1-3 个）</p><div className="flex flex-wrap gap-2">{CHILD_TRAITS.map((trait) => { const active = draft.traitIds.includes(trait.id); return <button key={trait.id} type="button" onClick={() => updateDraft('traitIds', active ? draft.traitIds.filter((id) => id !== trait.id) : [...draft.traitIds, trait.id].slice(0, 3))} className="rounded-full border px-4 py-2" style={{ borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)' }}>{trait.emoji} {trait.label}</button>; })}</div></div>
        </section>}

        <Modal
          isOpen={customOpen}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setCustomOpen(false);
              setCustomError('');
            }
          }}
          placement="center"
          size="sm"
        >
          <ModalContent>
            <ModalHeader style={{ color: 'var(--theme-accent)' }}>自定义主角</ModalHeader>
            <ModalBody className="gap-3">
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                写一个角色称呼，确认后会选中「自定义」。
              </p>
              <Input
                label="角色名称"
                description="1–12 字，例如：小恐龙、小精灵"
                maxLength={12}
                placeholder="比如：小恐龙"
                value={customRoleDraft}
                onValueChange={(next) => {
                  setCustomRoleDraft(next);
                  if (customError) setCustomError('');
                }}
                isRequired
              />
              {customError ? <p className="text-xs text-danger-500">{customError}</p> : null}
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={() => { setCustomOpen(false); setCustomError(''); }}>取消</Button>
              <Button className="font-semibold text-white" onPress={confirmCustom} style={{ background: 'var(--theme-accent)', color: '#ffffff' }}>确认选择</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

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

        {step === 3 && (
          <section
            className="mx-auto max-w-3xl space-y-5 rounded-3xl p-5 shadow-sm"
            style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">想告诉 TA 什么？</h2>
              <button
                type="button"
                onClick={shuffleThemes}
                className="shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-accent)' }}
              >
                换一批
              </button>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-subtle)' }}>
              <label className="flex cursor-pointer items-center justify-between gap-3"><span><b>带宠物一起探索</b><small className="mt-1 block" style={{ color: 'var(--theme-text-muted)' }}>开启后，故事会记住宠物此刻的名字和成长阶段</small></span><input type="checkbox" checked={includePet} onChange={(event) => { setIncludePet(event.target.checked); idempotencyKey.current = undefined; }} aria-label="带宠物一起探索" /></label>
              {includePet && <p className="mt-3 text-sm">{activeProfile?.pet ? `本次同行：${activeProfile.pet.displayName}` : <><span>这个档案还没有宠物。</span> <button type="button" onClick={() => void saveDraftAndAdopt()} style={{ color: 'var(--theme-accent)' }}>先去领养</button>，或关闭选项继续创作。</>}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map((theme) => {
                const active = growthTheme === theme.shortLabel && !customTheme.trim();
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => toggleGrowthTheme(theme.shortLabel)}
                    className="rounded-xl border p-3 text-sm"
                    style={{
                      borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                      background: active ? 'var(--theme-bg-subtle)' : undefined,
                    }}
                    aria-pressed={active}
                  >
                    {theme.icon} {theme.shortLabel}
                  </button>
                );
              })}
            </div>
            <Input
              label="自定义成长主题（可选）"
              maxLength={80}
              value={customTheme}
              onValueChange={(value) => {
                setCustomTheme(value);
                idempotencyKey.current = undefined;
              }}
              placeholder="例如：学会和小情绪做朋友"
            />
            <div>
              <p className="mb-2 text-sm font-semibold">今晚小事（可跳过，最多 80 字）</p>
              <div className="flex flex-wrap gap-2">
                {TONIGHT_MATERIAL_INTENTS.map((intent) => (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => setMaterialIntent(intent.id)}
                    className="rounded-full border px-3 py-2 text-sm"
                    style={{
                      borderColor: materialIntent === intent.id ? 'var(--theme-accent)' : 'var(--theme-border)',
                    }}
                  >
                    {intent.label}
                  </button>
                ))}
              </div>
              <textarea
                value={materialText}
                maxLength={80}
                onChange={(event) => setMaterialText(event.target.value)}
                placeholder="写下今天想被温柔接住的一件小事"
                className="mt-3 min-h-28 w-full rounded-xl border p-3"
              />
            </div>
            <p
              className="rounded-xl p-3 text-sm"
              style={{ background: 'var(--theme-bg-subtle)', color: 'var(--theme-text-muted)' }}
            >
              🔒 新故事仅自己可见。你可以在详情页继续点赞、收藏、评论和播放 TTS。
            </p>
          </section>
        )}
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

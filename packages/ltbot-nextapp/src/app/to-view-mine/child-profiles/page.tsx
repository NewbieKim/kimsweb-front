/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useUser } from '@clerk/nextjs';
import { Pencil, Trash2 } from 'lucide-react';
import {
  CHILD_AGE_GROUPS,
  CHILD_AVATARS,
  CHILD_ROLES,
  CHILD_TRAITS,
  defaultRoleForAvatar,
  findChildAvatar,
  resolveRoleLabel,
} from '@/lib/story-customization/catalog';
import type { ChildProfileInput } from '@/lib/story-customization/types';
import { PetAdoptionRail, type PetAdoptionOption } from '@/components/pets/PetAdoptionRail';

type Profile = ChildProfileInput & {
  id: number;
  deletedAt: string | null;
  completedStoryCount: number;
  pet?: { petKey: string; displayName: string } | null;
};

const blank: ChildProfileInput = {
  avatarId: 'child',
  nickname: '',
  ageGroup: '4-6',
  role: 'custom',
  traitIds: ['curious'],
  partner: { type: 'preset', id: 'cat', name: '小猫', emoji: '🐱' },
};

const isCatalogRole = (role: string) => CHILD_ROLES.some((item) => item.id === role);

interface ProfileEditorProps {
  open: boolean;
  value: ChildProfileInput;
  editingId: number | 'new' | null;
  onChange: (value: ChildProfileInput) => void;
  onSave: (pet?: { petKey: string; petDisplayName?: string }) => void;
  onClose: () => void;
  saving: boolean;
  petCatalog: PetAdoptionOption[];
}

function ProfileEditor({
  open,
  value,
  editingId,
  onChange,
  onSave,
  onClose,
  saving,
  petCatalog,
}: ProfileEditorProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customRoleDraft, setCustomRoleDraft] = useState('');
  const [customError, setCustomError] = useState('');
  const [petKey, setPetKey] = useState('');
  const [petDisplayName, setPetDisplayName] = useState('');
  const isNew = editingId === 'new';

  useEffect(() => {
    if (!open) return;
    setPetKey('');
    setPetDisplayName('');
  }, [open, editingId]);

  const set = <K extends keyof ChildProfileInput>(key: K, next: ChildProfileInput[K]) => {
    onChange({ ...value, [key]: next });
  };

  const toggleTrait = (id: string) => {
    set(
      'traitIds',
      value.traitIds.includes(id)
        ? value.traitIds.filter((item) => item !== id)
        : [...value.traitIds, id].slice(0, 3),
    );
  };

  const selectPresetAvatar = (avatarId: string) => {
    onChange({
      ...value,
      avatarId,
      role: defaultRoleForAvatar(avatarId),
    });
  };

  const openCustomModal = () => {
    setCustomRoleDraft(value.avatarId === 'custom' && !isCatalogRole(value.role) ? value.role : '');
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
    onChange({ ...value, avatarId: 'custom', role: text });
    setCustomOpen(false);
    setCustomError('');
  };

  const customSelected = value.avatarId === 'custom';
  const customLabel =
    customSelected && !isCatalogRole(value.role) ? value.role : '自定义';

  const handleSave = () => {
    if (isNew) {
      if (!petKey) {
        window.alert('请左右滑动选择一位宠物伙伴');
        return;
      }
      onSave({ petKey, petDisplayName: petDisplayName.trim() || undefined });
      return;
    }
    onSave();
  };

  return (
    <>
    <Modal
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setCustomOpen(false);
          onClose();
        }
      }}
      placement="center"
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="text-2xl" style={{ color: 'var(--theme-accent)' }}>
          {isNew ? '新建孩子档案' : '编辑孩子档案'}
        </ModalHeader>
        <ModalBody className="gap-5 pb-4">
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            用昵称就好。保存后，下次创作可直接选择。
          </p>

          <section>
            <h3 className="mb-3 text-base font-bold">选择主角</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CHILD_AVATARS.map((item) => {
                if (item.id === 'custom') {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={openCustomModal}
                      className="rounded-2xl border border-dashed p-3 text-center"
                      style={{
                        borderColor: customSelected ? 'var(--theme-accent)' : 'var(--theme-border)',
                        background: customSelected ? 'var(--theme-bg-subtle)' : undefined,
                      }}
                    >
                      <span className="text-3xl">{item.emoji}</span>
                      <span className="mt-1 block truncate text-xs">{customLabel}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectPresetAvatar(item.id)}
                    className="rounded-2xl border p-3 text-center"
                    style={{
                      borderColor: value.avatarId === item.id ? 'var(--theme-accent)' : 'var(--theme-border)',
                      background: value.avatarId === item.id ? 'var(--theme-bg-subtle)' : undefined,
                    }}
                  >
                    <span className="text-3xl">{item.emoji}</span>
                    <span className="mt-1 block text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <Input
            label="主角昵称"
            description="1–12 字"
            maxLength={12}
            placeholder="给主角起个可爱的名字"
            value={value.nickname}
            onValueChange={(nickname) => set('nickname', nickname)}
          />

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">性格方向</h3>
              <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                选 1–3 项
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHILD_TRAITS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleTrait(item.id)}
                  className="rounded-full border px-3 py-2 text-sm"
                  style={{
                    borderColor: value.traitIds.includes(item.id)
                      ? 'var(--theme-accent)'
                      : 'var(--theme-border)',
                    background: value.traitIds.includes(item.id) ? 'var(--theme-bg-subtle)' : undefined,
                  }}
                >
                  {item.emoji} {item.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold">年龄阶段</h3>
              <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                必选
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CHILD_AGE_GROUPS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => set('ageGroup', item.id)}
                  className="rounded-xl border p-3 text-left"
                  style={{
                    borderColor: value.ageGroup === item.id ? 'var(--theme-accent)' : 'var(--theme-border)',
                    background: value.ageGroup === item.id ? 'var(--theme-bg-subtle)' : undefined,
                  }}
                >
                  <b>{item.label}</b>
                  <span className="mt-1 block text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                    {item.detail}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {isNew ? (
            <section className="space-y-3">
              <PetAdoptionRail
                pets={petCatalog}
                selectedKey={petKey}
                onSelect={(next) => {
                  setPetKey(next);
                  setPetDisplayName('');
                }}
              />
              {petKey ? (
                <Input
                  label="给宠物起名（可选）"
                  description="1–12 字，不填则使用默认名字"
                  maxLength={12}
                  placeholder={petCatalog.find((pet) => pet.petKey === petKey)?.name || '小伙伴'}
                  value={petDisplayName}
                  onValueChange={setPetDisplayName}
                />
              ) : null}
            </section>
          ) : (
            <section className="rounded-2xl p-3 text-sm" style={{ background: 'var(--theme-bg-subtle)', color: 'var(--theme-text-muted)' }}>
              已有宠物可在浮岛花园调整名字；尚未领养的档案可在打卡页完成领养。
            </section>
          )}
        </ModalBody>
        <ModalFooter
          className="sticky bottom-0 z-10 border-t"
          style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-surface)' }}
        >
          <Button variant="flat" onPress={onClose}>
            取消
          </Button>
          <Button
            className="font-semibold text-white shadow-sm"
            isLoading={saving}
            onPress={handleSave}
            style={{ background: 'var(--theme-accent)', color: '#ffffff' }}
          >
            {isNew ? '确定并领养' : '保存档案'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

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
          <Button
            variant="flat"
            onPress={() => {
              setCustomOpen(false);
              setCustomError('');
            }}
          >
            取消
          </Button>
          <Button
            className="font-semibold text-white"
            onPress={confirmCustom}
            style={{ background: 'var(--theme-accent)', color: '#ffffff' }}
          >
            确认选择
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    </>
  );
}

export default function ChildProfilesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<ChildProfileInput>(blank);
  const [saving, setSaving] = useState(false);
  const [petCatalog, setPetCatalog] = useState<PetAdoptionOption[]>([]);

  const load = async () => {
    const response = await fetch('/api/child-profiles');
    const result = await response.json();
    if (response.ok && result.success) setProfiles(result.data as Profile[]);
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) void load();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void fetch('/api/pets')
      .then(async (response) => {
        const result = await response.json();
        if (response.ok && result.success) setPetCatalog(result.data as PetAdoptionOption[]);
      })
      .catch(() => undefined);
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <main className="p-8 text-center">请先登录</main>;

  const save = async (pet?: { petKey: string; petDisplayName?: string }) => {
    if (!draft.nickname.trim()) {
      window.alert('请填写主角昵称');
      return;
    }
    if (
      draft.avatarId === 'custom' &&
      (isCatalogRole(draft.role) || Array.from(draft.role.trim()).length < 1)
    ) {
      window.alert('请先完成自定义主角填写');
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const response = await fetch(isNew ? '/api/child-profiles' : `/api/child-profiles/${editing}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isNew ? { ...draft, ...pet } : draft),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '保存失败');
      setEditing(null);
      await load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('删除档案后，历史故事仍会保留，确定删除吗？')) return;
    await fetch(`/api/child-profiles/${id}`, { method: 'DELETE' });
    await load();
  };

  const openNew = () => {
    setDraft(blank);
    setEditing('new');
  };

  const editProfile = (profile: Profile) => {
    setDraft(profile);
    setEditing(profile.id);
  };

  const liveProfiles = profiles.filter((profile) => !profile.deletedAt);

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: 'var(--theme-bg-base)' }}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/to-view-mine" className="text-sm" style={{ color: 'var(--theme-accent)' }}>
              ← 我的
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">孩子档案</h1>
          </div>
          <Button
            size="sm"
            radius="lg"
            className="font-semibold text-white"
            onPress={openNew}
            style={{ background: 'var(--theme-accent)', color: '#ffffff' }}
          >
            新建档案
          </Button>
        </header>

        {profiles.length === 0 ? (
          <section
            className="mx-auto flex min-h-[46vh] w-full max-w-xl flex-col items-center justify-center rounded-3xl border px-6 text-center"
            style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-surface)' }}
          >
            <div className="text-6xl">🧒</div>
            <h2 className="mt-4 text-2xl font-bold">先认识今晚的小主角</h2>
            <p className="mt-2 max-w-sm text-base" style={{ color: 'var(--theme-text-muted)' }}>
              保存孩子的设定，下次讲故事就不用重新填写。
            </p>
            <Button
              className="mt-5 font-semibold text-white"
              size="lg"
              onPress={openNew}
              style={{ background: 'var(--theme-accent)', color: '#ffffff' }}
            >
              ＋ 新建孩子档案
            </Button>
          </section>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {liveProfiles.map((profile) => (
              <article
                key={profile.id}
                className="relative flex h-full flex-col rounded-3xl border p-5"
                style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-surface)' }}
              >
                <div className="absolute right-4 top-4 flex gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    aria-label={`编辑${profile.nickname}的档案`}
                    title="编辑档案"
                    onPress={() => editProfile(profile)}
                    className="h-10 min-w-10"
                    style={{ background: '#F1EEFF', color: '#6246A8' }}
                  >
                    <Pencil aria-hidden="true" size={18} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    aria-label={`删除${profile.nickname}的档案`}
                    title="删除档案"
                    onPress={() => void remove(profile.id)}
                    className="h-10 min-w-10"
                    style={{ background: '#FFF0F2', color: '#B44055' }}
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </Button>
                </div>

                <div className="pr-24">
                  <span className="text-4xl">
                    {findChildAvatar(profile.avatarId)?.emoji ?? '🧒'}
                  </span>
                  <h2 className="mt-2 text-xl font-semibold">{profile.nickname}</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    {profile.ageGroup} · 已完成 {profile.completedStoryCount} 个故事
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                  <span className="rounded-full border px-3 py-1">
                    {findChildAvatar(profile.avatarId)?.emoji} {resolveRoleLabel(profile.role)}
                  </span>
                  {profile.traitIds.map((id) => (
                    <span key={id} className="rounded-full border px-3 py-1">
                      {CHILD_TRAITS.find((item) => item.id === id)?.label}
                    </span>
                  ))}
                  <Link href={profile.pet ? `/habits/companion?childProfileId=${profile.id}` : `/habits/adopt?childProfileId=${profile.id}`} className="rounded-full border px-3 py-1">{profile.pet ? `🐾 ${profile.pet.displayName}` : '🐾 暂未领养'}</Link>
                </div>

                <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
                  <Link className="min-w-0" href={`/create-story?childProfileId=${profile.id}`}>
                    <Button
                      size="sm"
                      className="w-full whitespace-nowrap px-2 font-semibold text-white"
                      style={{
                        background: 'linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))',
                        color: '#ffffff',
                      }}
                    >
                      为 TA 讲故事
                    </Button>
                  </Link>
                  <Link className="min-w-0" href={`/habits/manage?childProfileId=${profile.id}`}>
                    <Button
                      size="sm"
                      className="w-full whitespace-nowrap px-2 font-semibold"
                      style={{ background: '#EDE8FF', color: '#5E43A6' }}
                    >
                      习惯管理
                    </Button>
                  </Link>
                  <Link className="min-w-0" href={`/habits/companion?childProfileId=${profile.id}`}>
                    <Button
                      size="sm"
                      className="w-full whitespace-nowrap px-2 font-semibold"
                      style={{ background: '#E2F8EF', color: '#24745E' }}
                    >
                      成长记录
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <ProfileEditor
          open={editing !== null}
          value={draft}
          editingId={editing}
          onChange={setDraft}
          onSave={(pet) => void save(pet)}
          onClose={() => setEditing(null)}
          saving={saving}
          petCatalog={petCatalog}
        />
      </div>
    </main>
  );
}

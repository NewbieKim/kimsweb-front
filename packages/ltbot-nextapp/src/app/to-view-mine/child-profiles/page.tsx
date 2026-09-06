/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useUser } from '@clerk/nextjs';
import {
  CHILD_AGE_GROUPS,
  CHILD_AVATARS,
  CHILD_ROLES,
  CHILD_TRAITS,
  PARTNER_PRESETS,
} from '@/lib/story-customization/catalog';
import type { ChildProfileInput, PartnerValue } from '@/lib/story-customization/types';

type Profile = ChildProfileInput & {
  id: number;
  deletedAt: string | null;
  completedStoryCount: number;
};

const blank: ChildProfileInput = {
  avatarId: 'child',
  nickname: '',
  ageGroup: '4-6',
  role: 'custom',
  traitIds: ['curious'],
  partner: { type: 'preset', id: 'cat', name: '小猫', emoji: '🐱' },
};

interface ProfileEditorProps {
  open: boolean;
  value: ChildProfileInput;
  editingId: number | 'new' | null;
  onChange: (value: ChildProfileInput) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

function ProfileEditor({
  open,
  value,
  editingId,
  onChange,
  onSave,
  onClose,
  saving,
}: ProfileEditorProps) {
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

  return (
    <Modal
      isOpen={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      placement="center"
      size="2xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="text-2xl" style={{ color: 'var(--theme-accent)' }}>
          {editingId === 'new' ? '新建孩子档案' : '编辑孩子档案'}
        </ModalHeader>
        <ModalBody className="gap-5 pb-4">
          <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            用昵称就好。保存后，下次创作可直接选择。
          </p>

          <section>
            <h3 className="mb-3 text-base font-bold">选择主角</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {CHILD_AVATARS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => set('avatarId', item.id)}
                  className="rounded-2xl border p-3 text-center"
                  style={{
                    borderColor: value.avatarId === item.id ? 'var(--theme-accent)' : 'var(--theme-border)',
                    background: value.avatarId === item.id ? 'var(--theme-bg-subtle)' : undefined,
                  }}
                >
                  <span className="text-3xl">{item.emoji}</span>
                  <span className="mt-1 block text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-[1fr_1.35fr]">
            <div>
              <p className="mb-2 text-sm font-semibold">主角角色</p>
              <div className="grid grid-cols-3 gap-2">
                {CHILD_ROLES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => set('role', item.id)}
                    className="rounded-full border px-3 py-2 text-sm"
                    style={{
                      borderColor: value.role === item.id ? 'var(--theme-accent)' : 'var(--theme-border)',
                    }}
                  >
                    {item.emoji} {item.label}
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="主角昵称"
              description="1–12 字"
              maxLength={12}
              placeholder="给主角起个可爱的名字"
              value={value.nickname}
              onValueChange={(nickname) => set('nickname', nickname)}
            />
          </div>

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

          <section>
            <h3 className="mb-2 text-sm font-semibold">选个好伙伴</h3>
            <p className="mb-3 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
              最多可选 1 位，陪着主角一起睡前冒险。
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {PARTNER_PRESETS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    set('partner', {
                      type: 'preset',
                      id: item.id,
                      name: item.name,
                      emoji: item.emoji,
                    } as PartnerValue)
                  }
                  className="rounded-2xl border p-3 text-center"
                  style={{
                    borderColor: value.partner.id === item.id ? 'var(--theme-accent)' : 'var(--theme-border)',
                    background: value.partner.id === item.id ? 'var(--theme-bg-subtle)' : undefined,
                  }}
                >
                  <span className="block text-2xl">{item.emoji}</span>
                  <span className="mt-1 block text-xs">{item.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  set('partner', {
                    type: 'custom',
                    name: value.partner.type === 'custom' ? value.partner.name : '',
                    emoji: '🌟',
                  })
                }
                className="rounded-2xl border border-dashed p-3 text-center"
                style={{
                  borderColor: value.partner.type === 'custom' ? 'var(--theme-accent)' : 'var(--theme-border)',
                }}
              >
                <span className="block text-2xl">＋</span>
                <span className="mt-1 block text-xs">自定义</span>
              </button>
            </div>
            {value.partner.type === 'custom' && (
              <Input
                className="mt-3"
                label="伙伴名字"
                maxLength={12}
                value={value.partner.name}
                onValueChange={(name) => set('partner', { type: 'custom', name, emoji: '🌟' })}
              />
            )}
          </section>
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
            onPress={onSave}
            style={{ background: 'var(--theme-accent)', color: '#ffffff' }}
          >
            {editingId === 'new' ? '确定' : '保存档案'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default function ChildProfilesPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<ChildProfileInput>(blank);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const response = await fetch('/api/child-profiles?includeDeleted=true');
    const result = await response.json();
    if (response.ok && result.success) setProfiles(result.data as Profile[]);
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) void load();
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return null;
  if (!isSignedIn) return <main className="p-8 text-center">请先登录</main>;

  const save = async () => {
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const response = await fetch(isNew ? '/api/child-profiles' : `/api/child-profiles/${editing}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
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

  const restore = async (id: number) => {
    await fetch(`/api/child-profiles/${id}/restore`, { method: 'POST' });
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
  const deletedProfiles = profiles.filter((profile) => profile.deletedAt);

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
                className="flex h-full flex-col rounded-3xl border p-5"
                style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-surface)' }}
              >
                <div>
                  <span className="text-4xl">
                    {CHILD_AVATARS.find((item) => item.id === profile.avatarId)?.emoji}
                  </span>
                  <h2 className="mt-2 text-xl font-semibold">{profile.nickname}</h2>
                  <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                    {profile.ageGroup} · 已完成 {profile.completedStoryCount} 个故事
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                  <span className="rounded-full border px-3 py-1">
                    {CHILD_ROLES.find((item) => item.id === profile.role)?.emoji}{' '}
                    {CHILD_ROLES.find((item) => item.id === profile.role)?.label}
                  </span>
                  {profile.traitIds.map((id) => (
                    <span key={id} className="rounded-full border px-3 py-1">
                      {CHILD_TRAITS.find((item) => item.id === id)?.label}
                    </span>
                  ))}
                  <span className="rounded-full border px-3 py-1">
                    {profile.partner.emoji} {profile.partner.name}
                  </span>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                  <Link href={`/create-story?childProfileId=${profile.id}`}>
                    <Button
                      size="sm"
                      className="font-semibold text-white"
                      style={{
                        background: 'linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))',
                        color: '#ffffff',
                      }}
                    >
                      为 TA 讲故事
                    </Button>
                  </Link>
                  <div className="ml-auto flex gap-2">
                    <Button size="sm" variant="flat" onPress={() => editProfile(profile)}>
                      编辑
                    </Button>
                    <Button size="sm" variant="flat" onPress={() => void remove(profile.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {deletedProfiles.length > 0 && (
          <details className="mt-8 rounded-2xl border p-4" style={{ borderColor: 'var(--theme-border)' }}>
            <summary className="cursor-pointer font-semibold">已删除的档案</summary>
            <div className="mt-4 space-y-3">
              {deletedProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between">
                  <span>
                    {CHILD_AVATARS.find((item) => item.id === profile.avatarId)?.emoji} {profile.nickname}
                  </span>
                  <Button size="sm" onPress={() => void restore(profile.id)}>
                    恢复档案
                  </Button>
                </div>
              ))}
            </div>
          </details>
        )}

        <ProfileEditor
          open={editing !== null}
          value={draft}
          editingId={editing}
          onChange={setDraft}
          onSave={() => void save()}
          onClose={() => setEditing(null)}
          saving={saving}
        />
      </div>
    </main>
  );
}

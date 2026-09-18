'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PetAdoptionRail, type PetAdoptionOption } from '@/components/pets/PetAdoptionRail';
import { HabitTopbar, habitFetch, LoadingHabitPage, ProfileRequired, useHabitProfile } from '../components/shared';

export default function AdoptPetPage() {
  const profile = useHabitProfile();
  const router = useRouter();
  const params = useSearchParams();
  const [catalog, setCatalog] = useState<PetAdoptionOption[]>([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const returnTo = params.get('returnTo') === 'story' ? 'story' : 'habits';
  const load = useCallback(async () => {
    try { setCatalog(await habitFetch<PetAdoptionOption[]>('/api/pets')); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '宠物图鉴加载失败'); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const adopt = async () => {
    if (!profile.selectedId || !selectedKey || busy) return;
    setBusy(true);
    setError('');
    try {
      await habitFetch(`/api/child-profiles/${profile.selectedId}/companion`, {
        method: 'POST',
        body: JSON.stringify({ petKey: selectedKey, displayName: name.trim() || undefined }),
      });
      router.push(returnTo === 'story'
        ? `/create-story?childProfileId=${profile.selectedId}&resumePet=1`
        : `/habits?childProfileId=${profile.selectedId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '领养失败，请重试');
    } finally { setBusy(false); }
  };

  if (profile.loading) return <LoadingHabitPage />;
  if (!profile.profiles.length) return <ProfileRequired profiles={profile.profiles} />;
  return <main className="habit-shell">
    <HabitTopbar title="领养新伙伴" subtitle="从这里开始新的成长旅程" backHref={returnTo === 'story' ? '/create-story' : '/habits'} profiles={profile.profiles} selectedId={profile.selectedId} onSelect={profile.setSelectedId} forceChoice={profile.needsChoice} />
    <section className="habit-manage-content">
      <div className="habit-manage-intro"><h1>选一位一起长大的朋友</h1><p>也可以在「新建孩子档案」时一起完成领养。第一次喂养后，种类就固定啦。</p></div>
      <PetAdoptionRail
        pets={catalog}
        selectedKey={selectedKey}
        onSelect={(petKey) => {
          setSelectedKey(petKey);
          setName('');
        }}
      />
      {selectedKey && <div className="habit-field"><label htmlFor="new-pet-name">给它起个名字（可选）</label><input id="new-pet-name" value={name} maxLength={12} placeholder={catalog.find((pet) => pet.petKey === selectedKey)?.name} onChange={(event) => setName(event.target.value)} /></div>}
      {error && <p className="habit-toast" role="alert">{error}</p>}
      <button type="button" className="habit-primary-button" style={{ width: '100%', marginTop: 20 }} disabled={!selectedKey || busy} onClick={() => void adopt()}>{busy ? '正在领养…' : '确定领养，开启新旅程'}</button>
    </section>
  </main>;
}

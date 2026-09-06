'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@heroui/button';
import CustomLoader from '@/app/components/CustomLoader';

type StoryResult = {
  id: number;
  childProfileId?: number | null;
  content?: string | null;
  generationStatus?: string;
  generationError?: string | null;
  visibility?: string;
  customization?: {
    sequenceNumber: number;
    child?: { nickname?: string; avatarEmoji?: string; ageLabel?: string; roleLabel?: string; traitLabels?: string[]; partnerLabel?: string };
    dreamWorld?: { name?: string; emoji?: string };
    growthTheme?: string;
    tonightMaterial?: { text?: string; intent?: string } | null;
  } | null;
};

export default function StoryResultPage() {
  const { storyId } = useParams<{ storyId: string }>();
  const router = useRouter();
  const [story, setStory] = useState<StoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const loadStory = useCallback(async () => {
    const response = await fetch(`/api/stories/${storyId}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || '读取故事失败');
    setStory(result.data as StoryResult);
    return result.data as StoryResult;
  }, [storyId]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const current = await loadStory();
        if (cancelled) return;
        const status = current.generationStatus;
        if (status === 'pending' || status === 'generating') window.setTimeout(poll, 2500);
      } catch {
        if (!cancelled) setStory(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void poll();
    return () => { cancelled = true; };
  }, [loadStory]);

  const retry = async () => {
    setRetrying(true);
    try {
      const response = await fetch('/api/stories/generate-async', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storyId: Number(storyId) }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || '重试失败');
      await loadStory();
      window.setTimeout(() => { void loadStory(); }, 2500);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '重试失败');
    } finally { setRetrying(false); }
  };

  if (loading && !story) return <CustomLoader isLoading />;
  if (!story) return <main className="p-8 text-center">故事不存在或暂不可访问。</main>;

  const child = story.customization?.child;
  const status = story.generationStatus || (story.content ? 'completed' : 'pending');
  const completed = status === 'completed' && Boolean(story.content);
  const failed = status === 'failed';

  return <main className="min-h-screen px-4 py-10" style={{ background: 'var(--theme-bg-base)' }}><div className="mx-auto max-w-2xl rounded-3xl p-6 text-center shadow-sm" style={{ background: 'var(--theme-bg-surface)', border: '1px solid var(--theme-border)' }}>
    {!completed && !failed && <><div className="mb-4 text-5xl animate-pulse">🌙</div><h1 className="text-2xl font-bold">正在为 {child?.nickname || '小朋友'} 编织故事</h1><p className="mt-2" style={{ color: 'var(--theme-text-muted)' }}>你可以离开此页面，故事会在后台继续生成。</p><Button className="mt-6" variant="flat" onPress={() => router.push('/to-view-mine')}>先去看看我的故事</Button></>}
    {failed && <><div className="mb-4 text-5xl">🫧</div><h1 className="text-2xl font-bold">故事生成遇到一点小波折</h1><p className="mt-2" style={{ color: 'var(--theme-text-muted)' }}>{story.generationError || '请稍后重试，原本的定制内容已经保留。'}</p><div className="mt-6 flex justify-center gap-3"><Button variant="flat" onPress={() => router.back()}>返回修改</Button><Button color="primary" isLoading={retrying} onPress={() => void retry()}>用原设定重试</Button></div></>}
    {completed && <><div className="mb-4 text-5xl">✨</div><p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>这是 {child?.nickname || 'TA'} 的第 {story.customization?.sequenceNumber || '—'} 个故事</p><h1 className="mt-2 text-3xl font-bold" style={{ color: 'var(--theme-accent)' }}>专属晚安回执</h1><div className="mt-6 grid grid-cols-2 gap-3 text-left text-sm"><div className="rounded-xl p-3" style={{ background: 'var(--theme-bg-subtle)' }}>主角：{child?.avatarEmoji} {child?.nickname}</div><div className="rounded-xl p-3" style={{ background: 'var(--theme-bg-subtle)' }}>年龄：{child?.ageLabel}</div><div className="rounded-xl p-3" style={{ background: 'var(--theme-bg-subtle)' }}>角色：{child?.roleLabel}</div><div className="rounded-xl p-3" style={{ background: 'var(--theme-bg-subtle)' }}>伙伴：{child?.partnerLabel}</div><div className="rounded-xl p-3" style={{ background: 'var(--theme-bg-subtle)' }}>梦境：{story.customization?.dreamWorld?.emoji} {story.customization?.dreamWorld?.name}</div><div className="rounded-xl p-3" style={{ background: 'var(--theme-bg-subtle)' }}>主题：{story.customization?.growthTheme}</div></div><p className="mt-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>{story.customization?.tonightMaterial?.text ? `今晚也把「${story.customization.tonightMaterial.text}」轻轻放进了故事里。` : '今晚没有额外小事，故事会自然展开。'}</p><div className="mt-6 flex justify-center gap-3"><Link href={`/to-explore-story/${story.id}`}><Button color="primary">打开故事详情</Button></Link><Link href={`/create-story?childProfileId=${story.childProfileId ?? ''}`}><Button variant="flat">再讲一个</Button></Link></div></>}
  </div></main>;
}

import { StoryVisibility } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import StoryListClient from '../to-explore-story/components/StoryListClient';
import ExploreTabs from './components/ExploreTabs';

export const dynamic = 'force-dynamic';

async function getPublicStories() {
  try {
    return await prisma.story.findMany({
      where: {
        visibility: StoryVisibility.PUBLIC,
        content: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            favorites: true,
            comments: {
              where: { isDeleted: false },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } catch (error) {
    console.error('获取公开故事失败', error);
    return [];
  }
}

export default async function ExplorePage() {
  const stories = await getPublicStories();

  return (
    <main className="min-h-screen" style={{ background: 'var(--theme-bg-base)' }}>
      <ExploreTabs active="story" />

      <section className="mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ color: 'var(--theme-text)' }}>
            公开故事
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            发现大家分享的温暖儿童故事
          </p>
        </header>

        {stories.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl">📚</div>
            <h2 className="mb-2 text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>暂无公开故事</h2>
            <p style={{ color: 'var(--theme-text-muted)' }}>公开分享的故事会出现在这里。</p>
          </div>
        ) : (
          <StoryListClient initialStories={stories} />
        )}
      </section>
    </main>
  );
}

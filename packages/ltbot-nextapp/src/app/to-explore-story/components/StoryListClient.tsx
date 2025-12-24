'use client';
import { useState, useEffect } from 'react';
import StoryCard from './StoryCard';
import { Button } from '@heroui/button';

interface Story {
    id: number;
    ageGroup: string;
    themeType: string;
    classicTheme?: string | null;
    classicSubTheme?: string | null;
    customTheme?: string | null;
    characterSettings: string;
    wordLimit: number;
    content?: string | null;
    createdAt: Date;
    user: {
        id: number;
        name: string;
    };
}

interface StoryListClientProps {
    initialStories: Story[];
}

export default function StoryListClient({ initialStories }: StoryListClientProps) {
    const [stories, setStories] = useState<Story[]>(initialStories);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // 加载更多故事
    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/stories?page=${page + 1}&pageSize=20`);
            const result = await response.json();

            if (result.success && result.data.stories.length > 0) {
                setStories((prev) => [...prev, ...result.data.stories]);
                setPage((prev) => prev + 1);
                
                // 检查是否还有更多数据
                if (result.data.stories.length < 20) {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('加载更多故事失败:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {/* 瀑布流布局 - 响应式网格 */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {stories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                ))}
            </div>

            {/* 加载更多按钮 */}
            {hasMore && (
                <div className="flex justify-center mt-8 mb-4">
                    <Button
                        size="lg"
                        radius="full"
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-8"
                        onClick={loadMore}
                        isLoading={loading}
                        isDisabled={loading}
                    >
                        {loading ? '加载中...' : '加载更多'}
                    </Button>
                </div>
            )}

            {/* 已加载全部 */}
            {!hasMore && stories.length > 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-400 text-sm">已加载全部故事</p>
                </div>
            )}
        </div>
    );
}



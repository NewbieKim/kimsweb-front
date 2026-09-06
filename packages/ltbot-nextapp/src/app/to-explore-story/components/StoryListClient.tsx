'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
    coverImage?: string | null;
    illustrationStatus?: string | null;
    illustrationGeneratedFrames?: number | null;
    illustrationTargetFrames?: number | null;
    extData?: string | null;
    generationStatus?: string;
    createdAt: Date;
    user: {
        id: string;
        name: string;
        avatar?: string | null;
    };
    _count?: {
        likes: number;
        favorites: number;
        comments: number;
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

    // 检查是否有正在生成的故事
    const hasGeneratingStories = useMemo(() => {
        return stories.some((story) => {
            try {
                if (story.generationStatus) {
                    return story.generationStatus === 'pending' || story.generationStatus === 'generating';
                }
                if (story.extData) {
                    const extData = JSON.parse(story.extData);
                    const status = extData.generationStatus;
                    return status === 'pending' || status === 'generating';
                }
            } catch {
                return false;
            }
            return false;
        });
    }, [stories]);

    const hasIllustrationPendingStories = useMemo(() => {
        return stories.some((story) => {
            if (story.coverImage) {
                return false;
            }
            const status = story.illustrationStatus?.toUpperCase();
            if (status === 'PENDING' || status === 'RUNNING' || status === 'PARTIAL_SUCCESS') {
                return true;
            }
            const generated = story.illustrationGeneratedFrames ?? 0;
            const target = story.illustrationTargetFrames ?? 0;
            return target > 0 && generated < target;
        });
    }, [stories]);

    // 刷新正在生成的故事
    const refreshGeneratingStories = useCallback(async () => {
        const generatingStoryIds = stories
            .filter((story) => {
                try {
                    if (story.generationStatus) {
                        return story.generationStatus === 'pending' || story.generationStatus === 'generating';
                    }
                    if (story.extData) {
                        const extData = JSON.parse(story.extData);
                        const status = extData.generationStatus;
                        return status === 'pending' || status === 'generating';
                    }
                } catch {
                    return false;
                }
                return false;
            })
            .map((story) => story.id);

        if (generatingStoryIds.length === 0) return;

        const detailResults = await Promise.all(
            generatingStoryIds.map(async (storyId) => {
                try {
                    const response = await fetch(`/api/stories/${storyId}`);
                    const result = await response.json();
                    return result.success && result.data ? { storyId, data: result.data as Story } : null;
                } catch (error) {
                    console.error(`刷新故事 ${storyId} 失败:`, error);
                    return null;
                }
            })
        );

        const detailMap = new Map<number, Story>();
        detailResults.forEach((entry) => {
            if (entry?.data) {
                detailMap.set(entry.storyId, entry.data);
            }
        });

        if (detailMap.size === 0) {
            return;
        }

        setStories((prev) =>
            prev.map((story) => {
                const latest = detailMap.get(story.id);
                return latest ? { ...story, ...latest } : story;
            })
        );
    }, [stories]);

    const refreshIllustrationProgress = useCallback(async () => {
        const targetStories = stories.filter((story) => {
            if (story.coverImage) {
                return false;
            }
            const status = story.illustrationStatus?.toUpperCase();
            if (status === 'PENDING' || status === 'RUNNING' || status === 'PARTIAL_SUCCESS') {
                return true;
            }
            const generated = story.illustrationGeneratedFrames ?? 0;
            const target = story.illustrationTargetFrames ?? 0;
            return target > 0 && generated < target;
        });

        if (targetStories.length === 0) {
            return;
        }

        const progressResults = await Promise.all(
            targetStories.map(async (story) => {
                try {
                    const progressResponse = await fetch(`/api/stories/${story.id}/illustrations`);
                    const progressResult = await progressResponse.json();

                    if (!progressResult?.success || !progressResult?.data) {
                        return null;
                    }

                    const progressData = progressResult.data as {
                        coverReady: boolean;
                        status: string;
                        generated: number;
                        target: number;
                    };

                    if (!progressData.coverReady) {
                        return {
                            storyId: story.id,
                            patch: {
                                illustrationStatus: progressData.status,
                                illustrationGeneratedFrames: progressData.generated,
                                illustrationTargetFrames: progressData.target,
                            },
                        };
                    }

                    const storyResponse = await fetch(`/api/stories/${story.id}`);
                    const storyResult = await storyResponse.json();
                    if (storyResult?.success && storyResult?.data) {
                        return {
                            storyId: story.id,
                            patch: {
                                ...(storyResult.data as Story),
                                illustrationStatus: progressData.status,
                                illustrationGeneratedFrames: progressData.generated,
                                illustrationTargetFrames: progressData.target,
                            },
                        };
                    }

                    return {
                        storyId: story.id,
                        patch: {
                            illustrationStatus: progressData.status,
                            illustrationGeneratedFrames: progressData.generated,
                            illustrationTargetFrames: progressData.target,
                        },
                    };
                } catch (error) {
                    console.error(`刷新插画进度 ${story.id} 失败:`, error);
                    return null;
                }
            })
        );

        const patchMap = new Map<number, Partial<Story>>();
        progressResults.forEach((entry) => {
            if (entry?.patch) {
                patchMap.set(entry.storyId, entry.patch);
            }
        });

        if (patchMap.size === 0) {
            return;
        }

        setStories((prev) =>
            prev.map((story) => {
                const patch = patchMap.get(story.id);
                return patch ? { ...story, ...patch } : story;
            })
        );
    }, [stories]);

    // 轮询正在生成的故事
    useEffect(() => {
        if (!hasGeneratingStories && !hasIllustrationPendingStories) return;

        console.log('检测到故事或插画生成中，开启轮询...');
        
        const interval = setInterval(() => {
            refreshGeneratingStories();
            // 先注释：待需求设计好再开发
            // refreshIllustrationProgress();
        }, 5000); // 每5秒查询一次

        return () => {
            console.log('停止轮询');
            clearInterval(interval);
        };
    }, [hasGeneratingStories, hasIllustrationPendingStories, refreshGeneratingStories, refreshIllustrationProgress]);

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
                        className="text-white font-semibold px-8"
                        style={{
                            background:
                                "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                        }}
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
                    <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>已加载全部故事</p>
                </div>
            )}
        </div>
    );
}

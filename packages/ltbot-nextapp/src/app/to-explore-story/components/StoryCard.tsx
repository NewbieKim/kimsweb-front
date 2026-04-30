'use client';
import Image from 'next/image';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { useState } from 'react';

interface StoryCardProps {
    story: {
        id: number;
        ageGroup: string;
        themeType: string;
        classicTheme?: string | null;
        classicSubTheme?: string | null;
        customTheme?: string | null;
        characterSettings: string;
        wordLimit: number;
        content?: string | null;
        extData?: string | null;
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
    };
}

// 默认封面图片池（用于随机选择）
const defaultImages = [
    '/story-cover-1.jpg',
    '/story-cover-2.jpg',
    '/story-cover-3.jpg',
    '/story-cover-4.jpg',
    '/story-cover-5.jpg',
];

// 根据主题类型返回不同的渐变色（从全局主题变量衍生）
const getThemeGradient = (themeType: string) => {
    if (themeType === 'CLASSIC') {
        return `linear-gradient(135deg, var(--theme-gradient-from), color-mix(in srgb, var(--theme-gradient-to) 70%, #7dd3fc 30%))`;
    }
    return `linear-gradient(135deg, color-mix(in srgb, var(--theme-gradient-from) 65%, #fb7185 35%), var(--theme-gradient-to))`;
};

// 获取封面图片
const getCoverImage = (storyId: number) => {
    // 使用故事ID来选择固定的封面图片，保证每个故事的封面一致
    const index = storyId % defaultImages.length;
    return defaultImages[index];
};

export default function StoryCard({ story }: StoryCardProps) {
    const [imageError, setImageError] = useState(false);
    const coverImage = getCoverImage(story.id);
    const theme = story.themeType === 'CLASSIC' 
        ? `${story.classicTheme}${story.classicSubTheme ? ' · ' + story.classicSubTheme : ''}`
        : story.customTheme;

    // 解析人物设定
    let characterDesc = '';
    try {
        const chars = JSON.parse(story.characterSettings);
        characterDesc = chars.description || '';
    } catch {
        characterDesc = story.characterSettings;
    }

    // 解析 extData 获取生成状态
    let generationStatus = 'completed';
    let generationError = '';
    try {
        if (story.extData) {
            const extData = JSON.parse(story.extData);
            generationStatus = extData.generationStatus || 'completed';
            generationError = extData.generationError || '';
        }
    } catch {
        // 解析失败，默认为已完成
        generationStatus = 'completed';
    }

    // 判断是否正在生成
    const isGenerating = generationStatus === 'pending' || generationStatus === 'generating';
    const isFailed = generationStatus === 'failed';

    return (
        <Card 
            className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            isPressable
            onClick={() => {
                // TODO: 跳转到故事详情页
                window.location.href = `/to-explore-story/${story.id}`;
            }}
        >
            <CardBody className="p-0 overflow-hidden">
                {/* 封面图片 */}
                <div
                    className="relative w-full aspect-[3/4] overflow-hidden"
                    style={{ background: "var(--theme-bg-subtle)" }}
                >
                    {!imageError ? (
                        <Image
                            src={coverImage}
                            alt={theme || '故事封面'}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        // 降级方案：使用渐变背景和图标
                        <div className="w-full h-full flex items-center justify-center" style={{ background: getThemeGradient(story.themeType) }}>
                            <div className="text-white text-center p-4">
                                <div className="text-6xl mb-2">📖</div>
                                <p className="text-sm font-medium">{theme}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* 标签 */}
                    <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                        <span
                            className="px-2 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
                            style={{ background: getThemeGradient(story.themeType) }}
                        >
                            {story.themeType === 'CLASSIC' ? '经典' : '自定义'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700 backdrop-blur-sm">
                            {story.ageGroup}
                        </span>
                        
                        {/* 生成状态标签 */}
                        {isGenerating && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/90 text-white backdrop-blur-sm flex items-center gap-1 animate-pulse">
                                <span className="inline-block w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                生成中
                            </span>
                        )}
                        {isFailed && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/90 text-white backdrop-blur-sm">
                                生成失败
                            </span>
                        )}
                    </div>

                    {/* 字数标识 */}
                    <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
                            约{story.wordLimit}字
                        </span>
                    </div>
                </div>

                {/* 内容信息 */}
                <div className="p-3">
                    {/* 主题标题 */}
                    <h3 className="font-bold text-base mb-2 line-clamp-2 transition-colors" style={{ color: "var(--theme-text)" }}>
                        {theme}
                    </h3>

                    {/* 人物设定 */}
                    {characterDesc && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {characterDesc}
                        </p>
                    )}

                    {/* 故事内容预览 */}
                    {isGenerating ? (
                        <div className="flex items-center gap-2 py-3">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms', background: "var(--theme-accent)" }}></span>
                                <span className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '150ms', background: "var(--theme-accent)" }}></span>
                                <span className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms', background: "var(--theme-accent)" }}></span>
                            </div>
                            <span className="text-xs text-gray-500 italic">
                                AI 正在创作故事中...
                            </span>
                        </div>
                    ) : isFailed ? (
                        <div className="py-3">
                            <p className="text-xs text-red-500 mb-1">😔 故事生成失败</p>
                            {generationError && (
                                <p className="text-xs text-gray-400 line-clamp-2">{generationError}</p>
                            )}
                        </div>
                    ) : story.content ? (
                        <p className="text-xs text-gray-500 line-clamp-3 mb-3">
                            {story.content}
                        </p>
                    ) : null}
                </div>
            </CardBody>

            <CardFooter className="px-3 py-2 border-t" style={{ background: "var(--theme-bg-subtle)", borderTopColor: "var(--theme-border)" }}>
                <div className="w-full space-y-2">
                    {/* 作者信息和时间 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {story.user.avatar ? (
                                <Image
                                    src={story.user.avatar}
                                    alt={story.user.name}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                />
                            ) : (
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: getThemeGradient(story.themeType) }}
                                >
                                    {story.user.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-xs text-gray-600 font-medium">
                                {story.user.name}
                            </span>
                        </div>

                        <span className="text-xs text-gray-400">
                            {new Date(story.createdAt).toLocaleDateString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric'
                            })}
                        </span>
                    </div>

                    {/* 互动数据 */}
                    {story._count && (
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                                <span>👍</span>
                                <span>{story._count.likes}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>⭐</span>
                                <span>{story._count.favorites}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>💬</span>
                                <span>{story._count.comments}</span>
                            </div>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}



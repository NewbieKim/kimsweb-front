/* eslint-disable react-hooks/set-state-in-effect */
'use client';
import Image from 'next/image';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { useEffect, useMemo, useState } from 'react';
import { useTheme } from "@/contexts/ThemeContext";
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
        coverImage?: string | null;
        extData?: string | null;
        generationStatus?: string;
        createdAt: Date;
        user?: {
            id: string;
            name: string;
            avatar?: string | null;
        } | null;
        _count?: {
            likes: number;
            favorites: number;
            comments: number;
        };
    };
}

// 兜底封面必须实际随部署产物提供，不能依赖客户端错误回调才显示。
const DEFAULT_COVER_IMAGE = '/story-cover-default.jpg';

// 根据主题类型返回不同的渐变色（从全局主题变量衍生）
const getThemeGradient = (siteTheme: string) => {
    // 米色主题
    if (siteTheme === 'beige') {
        return `linear-gradient(135deg, rgb(238, 226, 210) 0%, rgb(243 230 212) 55%, rgb(244 221 190) 100%)`
    }
    // 紫粉主题
    if (siteTheme === 'purple') {
        return `linear-gradient(135deg, rgb(233 230 240) 0%, rgb(244 227 235) 55%, rgb(243, 232, 255) 100%)`
    }
    return `linear-gradient(135deg, rgb(189 185 180) 0%, rgb(224 216 205) 55%, rgb(234 211 183) 100%)`;
};

// 获取封面图片
const getCoverImage = () => DEFAULT_COVER_IMAGE;

export default function StoryCard({ story }: StoryCardProps) {
    const [imageError, setImageError] = useState(false);
    const { theme: siteTheme } = useTheme()
    const themeGradient = getThemeGradient(siteTheme);
    const fallbackCoverImage = useMemo(() => getCoverImage(), []);
    const displayCoverImage = story.coverImage || fallbackCoverImage;
    const theme = story.themeType === 'CLASSIC' 
        ? `${story.classicTheme}${story.classicSubTheme ? ' · ' + story.classicSubTheme : ''}`
        : story.customTheme;
    const authorName = story.user?.name?.trim() || '用户';
    const authorAvatar = story.user?.avatar || null;

    // 解析人物设定
    let characterDesc = '';
    try {
        const chars = JSON.parse(story.characterSettings);
        characterDesc = chars.description || '';
    } catch {
        characterDesc = story.characterSettings;
    }

    // 解析 extData 获取生成状态
    let generationStatus = story.generationStatus || 'completed';
    let generationError = '';
    try {
        if (!story.generationStatus && story.extData) {
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

    useEffect(() => {
        setImageError(false);
    }, [displayCoverImage]);

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
                    className="relative w-full aspect-3/4 overflow-hidden"
                    style={{ background: "var(--theme-bg-subtle)" }}
                >
                    {/* 图片失败或旧设备未 hydration 时，这层仍会由服务端直接显示。 */}
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: themeGradient }}
                    >
                        <span className="text-6xl">📖</span>
                    </div>
                    {!imageError ? (
                        // 插画 Provider 的图片域名可能变化；原生 img 不会因 Next Image 白名单抛错。
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={displayCoverImage}
                            alt={theme || '故事封面'}
                            className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                            decoding="async"
                            onError={() => setImageError(true)}
                        />
                    ) : null}
                    
                    {/* 标签 */}
                    <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
                        <span
                            className="px-2 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm"
                            style={{ background: themeGradient }}
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
                            {authorAvatar ? (
                                <Image
                                    src={authorAvatar}
                                    alt={authorName}
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                />
                            ) : (
                                <div
                                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ background: themeGradient }}
                                >
                                    {authorName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-xs text-gray-600 font-medium">
                                {authorName}
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

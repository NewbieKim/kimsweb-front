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
        createdAt: Date;
        user: {
            id: number;
            name: string;
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

// 根据主题类型返回不同的背景色
const getThemeColor = (themeType: string) => {
    return themeType === 'CLASSIC' 
        ? 'from-blue-400 to-purple-400' 
        : 'from-pink-400 to-rose-400';
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
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
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
                        <div className={`w-full h-full bg-gradient-to-br ${getThemeColor(story.themeType)} flex items-center justify-center`}>
                            <div className="text-white text-center p-4">
                                <div className="text-6xl mb-2">📖</div>
                                <p className="text-sm font-medium">{theme}</p>
                            </div>
                        </div>
                    )}
                    
                    {/* 标签 */}
                    <div className="absolute top-2 left-2 flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getThemeColor(story.themeType)} backdrop-blur-sm`}>
                            {story.themeType === 'CLASSIC' ? '经典' : '自定义'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white/90 text-gray-700 backdrop-blur-sm">
                            {story.ageGroup}
                        </span>
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
                    <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-800 group-hover:text-purple-600 transition-colors">
                        {theme}
                    </h3>

                    {/* 人物设定 */}
                    {characterDesc && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                            {characterDesc}
                        </p>
                    )}

                    {/* 故事内容预览 */}
                    {story.content && (
                        <p className="text-xs text-gray-500 line-clamp-3 mb-3">
                            {story.content}
                        </p>
                    )}
                </div>
            </CardBody>

            <CardFooter className="px-3 py-2 bg-gray-50/50 border-t border-gray-100">
                <div className="flex items-center justify-between w-full">
                    {/* 作者信息 */}
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                            {story.user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                            {story.user.name}
                        </span>
                    </div>

                    {/* 时间 */}
                    <span className="text-xs text-gray-400">
                        {new Date(story.createdAt).toLocaleDateString('zh-CN', {
                            month: 'numeric',
                            day: 'numeric'
                        })}
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}



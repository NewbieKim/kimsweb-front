'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { Button } from '@heroui/button';
import StoryCard from '../to-explore-story/components/StoryCard';
import { toast } from 'react-toastify';
import Link from 'next/link';
import { cn } from '@heroui/theme';
import { useDevice } from '@/hooks/useDevice';

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
}

export default function ViewMinePage() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { isMobile } = useDevice();
    const [activeTab, setActiveTab] = useState('stories');
    const [myStories, setMyStories] = useState<Story[]>([]);
    const [myFavorites, setMyFavorites] = useState<Story[]>([]);
    const [myLikes, setMyLikes] = useState<Story[]>([]);
    const [loading, setLoading] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);

    // 加载用户信息
    useEffect(() => {
        if (isSignedIn && user?.id) {
            loadUserInfo();
        }
    }, [isSignedIn, user?.id]);

    // 加载对应Tab的数据
    useEffect(() => {
        if (isSignedIn && user?.id) {
            loadTabData(activeTab);
        }
    }, [activeTab, isSignedIn, user?.id]);

    // 加载用户信息
    const loadUserInfo = async () => {
        try {
            const response = await fetch(`/api/users-prisma/${user?.id}`);
            const result = await response.json();
            if (result.success) {
                setUserInfo(result.data);
            }
        } catch (error) {
            console.error('加载用户信息失败:', error);
        }
    };

    // 加载Tab数据
    const loadTabData = async (tab: string) => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            switch (tab) {
                case 'stories':
                    await loadMyStories();
                    break;
                case 'favorites':
                    await loadMyFavorites();
                    break;
                case 'likes':
                    await loadMyLikes();
                    break;
            }
        } catch (error) {
            console.error('加载数据失败:', error);
            toast.error('加载数据失败');
        } finally {
            setLoading(false);
        }
    };

    // 加载我的故事
    const loadMyStories = async () => {
        try {
            const response = await fetch(`/api/stories?userId=${user?.id}`);
            const result = await response.json();
            if (result.success) {
                setMyStories(result.data.stories);
            }
        } catch (error) {
            console.error('加载我的故事失败:', error);
        }
    };

    // 加载我的收藏
    const loadMyFavorites = async () => {
        try {
            const response = await fetch(`/api/users/${user?.id}/favorites`);
            const result = await response.json();
            if (result.success) {
                setMyFavorites(result.data.favorites.map((f: any) => f.story));
            }
        } catch (error) {
            console.error('加载我的收藏失败:', error);
        }
    };

    // 加载我的点赞
    const loadMyLikes = async () => {
        try {
            const response = await fetch(`/api/users/${user?.id}/likes`);
            const result = await response.json();
            if (result.success) {
                setMyLikes(result.data.likes.map((l: any) => l.story));
            }
        } catch (error) {
            console.error('加载我的点赞失败:', error);
        }
    };

    // 未登录状态
    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="text-center mb-6">
                    <div className="text-6xl mb-4">👤</div>
                    <h2 className="text-2xl font-bold mb-2">请先登录</h2>
                    <p className="text-gray-600">登录后查看您的个人主页</p>
                </div>
            </div>
        );
    }

    // 获取当前Tab的数据
    const getCurrentTabData = () => {
        switch (activeTab) {
            case 'stories':
                return myStories;
            case 'favorites':
                return myFavorites;
            case 'likes':
                return myLikes;
            default:
                return [];
        }
    };

    return (
        <div className={`min-h-screen bg-gray-50 ${isMobile ? 'pb-[100px]' : 'pb-20'}`}>
            {/* 用户信息卡片 */}
            <div className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    {/* 顶部操作栏 */}
                    <div className="flex items-start gap-4">
                        {/* 头像 */}
                        <div className="flex-shrink-0">
                            {user?.imageUrl ? (
                                <Image
                                    src={user.imageUrl}
                                    alt={user.firstName || '用户'}
                                    width={72}
                                    height={72}
                                    className="rounded-full border-2 border-gray-100"
                                />
                            ) : (
                                <div className="w-18 h-18 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-100">
                                    {user?.firstName?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>

                        {/* 用户信息 */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold mb-1 truncate">
                                {user?.firstName || user?.username || '用户'}
                            </h1>
                            <p className="text-sm text-gray-400 mb-4">
                                AI睡眠空间号：{user?.id?.slice(-8)}
                            </p>

                            {/* 关注/粉丝数据 */}
                            <div className="flex gap-8 mb-4">
                                <button className="text-left hover:opacity-70 transition-opacity">
                                    <div className="text-base font-semibold text-gray-900">0</div>
                                    <div className="text-xs text-gray-500">关注</div>
                                </button>
                                <button className="text-left hover:opacity-70 transition-opacity">
                                    <div className="text-base font-semibold text-gray-900">0</div>
                                    <div className="text-xs text-gray-500">粉丝</div>
                                </button>
                                <div className="text-left">
                                    <div className="text-base font-semibold text-gray-900">
                                        {myStories.length}
                                    </div>
                                    <div className="text-xs text-gray-500">获赞与收藏</div>
                                </div>
                                <div className="text-left">
                                    <div className="text-base font-semibold text-purple-600">
                                        {userInfo?.userScore?.balance || 0}
                                    </div>
                                    <div className="text-xs text-gray-500">积分</div>
                                </div>
                            </div>

                            {/* 编辑资料按钮 */}
                            <Button
                                size="sm"
                                variant="bordered"
                                className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                编辑资料
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab切换 */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex justify-around">
                        {[
                            { key: 'stories', label: '笔记' },
                            { key: 'favorites', label: '收藏' },
                            { key: 'likes', label: '赞过' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    "flex-1 py-4 text-center font-medium transition-colors relative",
                                    activeTab === tab.key
                                        ? "text-gray-900"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.key && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 内容区域 */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-sm">加载中...</p>
                    </div>
                ) : getCurrentTabData().length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-4xl">
                                {activeTab === 'stories' ? '📝' : activeTab === 'favorites' ? '⭐' : '👍'}
                            </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {activeTab === 'stories' && 'TA 还没有发布笔记'}
                            {activeTab === 'favorites' && 'TA 还没有收藏'}
                            {activeTab === 'likes' && 'TA 还没有点赞'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {activeTab === 'stories' && '快去创作您的第一个故事吧'}
                            {activeTab === 'favorites' && '去探索页面收藏喜欢的故事'}
                            {activeTab === 'likes' && '去探索页面为故事点赞'}
                        </p>
                        {activeTab === 'stories' ? (
                            <Link href="/create-story">
                                <Button
                                    className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8"
                                    size="lg"
                                >
                                    创作故事
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/to-explore-story">
                                <Button
                                    className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8"
                                    size="lg"
                                >
                                    去探索
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {getCurrentTabData().map((story) => (
                            <StoryCard key={story.id} story={story} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

const MusicPlayer = dynamic(() => import('./components/MusicPlayer'), { ssr: false });

export interface MusicItem {
    id: string;
    name: string;
    duration: number;
    audioUrl: string;
    cardGradient: string;
    playerGradient: string;
    iconColor: string;
    iconType: string;
    description: string;
}

const MUSIC_LIST: MusicItem[] = [
    {
        id: '1',
        name: '细雨落叶',
        description: '雨滴轻抚叶片，沙沙入眠',
        duration: 1800,
        audioUrl: 'https://www.soundjay.com/nature/sounds/rain-01.mp3',
        cardGradient: 'from-green-200 via-emerald-100 to-teal-100',
        playerGradient: 'linear-gradient(160deg, #bbf7d0 0%, #a7f3d0 40%, #d1fae5 100%)',
        iconColor: '#059669',
        iconType: 'leaf-rain',
    },
    {
        id: '2',
        name: '雷雨屋檐',
        description: '檐雨滴答，雷声阵阵助眠',
        duration: 1800,
        audioUrl: 'https://www.soundjay.com/nature/sounds/thunder-01.mp3',
        cardGradient: 'from-blue-200 via-indigo-100 to-violet-100',
        playerGradient: 'linear-gradient(160deg, #bfdbfe 0%, #c7d2fe 40%, #ede9fe 100%)',
        iconColor: '#4f46e5',
        iconType: 'thunder-cloud',
    },
    {
        id: '3',
        name: '山涧清泉',
        description: '泉水叮咚，自然之声洗涤心灵',
        duration: 1800,
        audioUrl: 'https://www.soundjay.com/water/sounds/creek-01.mp3',
        cardGradient: 'from-cyan-200 via-sky-100 to-blue-100',
        playerGradient: 'linear-gradient(160deg, #a5f3fc 0%, #bae6fd 40%, #dbeafe 100%)',
        iconColor: '#0891b2',
        iconType: 'water-waves',
    },
    {
        id: '4',
        name: '漫步雨中',
        description: '踏雨而行，感受雨夜的宁静',
        duration: 1800,
        audioUrl: 'https://www.soundjay.com/nature/sounds/rain-02.mp3',
        cardGradient: 'from-amber-200 via-orange-100 to-rose-100',
        playerGradient: 'linear-gradient(160deg, #fde68a 0%, #fed7aa 40%, #fecdd3 100%)',
        iconColor: '#b45309',
        iconType: 'umbrella-rain',
    },
];

function MusicIcon({ type, size = 32, color = '#6b7280' }: { type: string; size?: number; color?: string }) {
    const props = {
        width: size,
        height: size,
        viewBox: '0 0 48 48',
        fill: 'none',
        stroke: color,
        strokeWidth: 2.5,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
    };

    if (type === 'leaf-rain') {
        return (
            <svg {...props}>
                <path d="M24 38 C14 28, 10 16, 20 10 C28 6, 38 10, 36 22 C34 34, 24 38, 24 38Z" />
                <path d="M24 38 L24 20" />
                <path d="M30 6 L30 10" />
                <path d="M34 10 L34 14" />
                <path d="M26 4 L26 7" />
            </svg>
        );
    }
    if (type === 'thunder-cloud') {
        return (
            <svg {...props}>
                <path d="M10 28 C10 22, 15 17, 22 17 C22 13, 26 10, 31 11 C36 12, 39 17, 38 22 C41 22, 43 25, 43 28 C43 32, 40 34, 36 34 L14 34 C11 34, 10 31, 10 28Z" />
                <path d="M26 34 L22 42 L27 42 L23 48" />
            </svg>
        );
    }
    if (type === 'water-waves') {
        return (
            <svg {...props}>
                <path d="M6 20 C10 16, 14 24, 18 20 C22 16, 26 24, 30 20 C34 16, 38 24, 42 20" />
                <path d="M6 28 C10 24, 14 32, 18 28 C22 24, 26 32, 30 28 C34 24, 38 32, 42 28" />
                <path d="M6 36 C10 32, 14 40, 18 36 C22 32, 26 40, 30 36 C34 32, 38 40, 42 36" />
            </svg>
        );
    }
    if (type === 'umbrella-rain') {
        return (
            <svg {...props}>
                <path d="M8 24 C8 14, 16 8, 24 8 C32 8, 40 14, 40 24Z" />
                <path d="M24 24 L24 36 C24 39, 22 40, 20 38" />
                <path d="M12 30 L12 34" />
                <path d="M18 32 L18 36" />
                <path d="M30 30 L30 34" />
                <path d="M36 32 L36 36" />
                <path d="M24 32 L24 36" />
            </svg>
        );
    }
    return null;
}

function formatDuration(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ToExploreMusicPage() {
    const [activeMusic, setActiveMusic] = useState<MusicItem | null>(null);
    const [playerOpen, setPlayerOpen] = useState(false);

    const handleCardClick = (music: MusicItem) => {
        setActiveMusic(music);
        setPlayerOpen(true);
    };

    const handlePlayerClose = () => {
        setPlayerOpen(false);
        setActiveMusic(null);
    };

    return (
        <div className="min-h-screen" style={{ background: "var(--theme-bg-base)" }}>
            {/* 页面标题 */}
            <div className="sticky top-0 z-10 backdrop-blur-md shadow-sm" style={{ background: "var(--theme-bg-surface)" }}>
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <h1
                        className="text-3xl font-bold bg-clip-text text-transparent"
                        style={{
                            backgroundImage:
                                "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                        }}
                    >
                        音乐广场
                    </h1>
                    <p className="mt-1" style={{ color: "var(--theme-text-muted)" }}>自然声音，安抚心灵</p>
                </div>
            </div>

            {/* 音乐卡片网格 */}
            <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
                <div className="grid grid-cols-2 gap-4">
                    {MUSIC_LIST.map((music) => (
                        <button
                            key={music.id}
                            onClick={() => handleCardClick(music)}
                            className={`relative rounded-3xl overflow-hidden aspect-square flex flex-col active:scale-95 transition-all duration-150 shadow-md hover:shadow-xl hover:-translate-y-1 bg-gradient-to-br ${music.cardGradient}`}
                            aria-label={`播放 ${music.name}`}
                        >
                            {/* 卡片图标居中 */}
                            <div className="flex-1 flex items-center justify-center pt-4">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center"
                                    style={{ background: 'rgba(255,255,255,0.5)' }}
                                >
                                    <MusicIcon type={music.iconType} size={36} color={music.iconColor} />
                                </div>
                            </div>

                            {/* 底部信息区 */}
                            <div className="px-4 pb-4 text-left">
                                <p className="font-bold text-gray-800 text-base text-center">{music.name}</p>
                                <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{music.description}</p>
                            </div>

                            {/* 正在播放标识 */}
                            {activeMusic?.id === music.id && (
                                <div className="absolute top-3 right-3 flex gap-0.5 items-end h-4">
                                    <span
                                        className="w-0.5 rounded-full animate-bounce h-2"
                                        style={{ backgroundColor: music.iconColor, animationDelay: '0ms' }}
                                    />
                                    <span
                                        className="w-0.5 rounded-full animate-bounce h-3"
                                        style={{ backgroundColor: music.iconColor, animationDelay: '100ms' }}
                                    />
                                    <span
                                        className="w-0.5 rounded-full animate-bounce h-4"
                                        style={{ backgroundColor: music.iconColor, animationDelay: '200ms' }}
                                    />
                                    <span
                                        className="w-0.5 rounded-full animate-bounce h-2"
                                        style={{ backgroundColor: music.iconColor, animationDelay: '300ms' }}
                                    />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* 说明文字 */}
                <div className="text-center mt-8 text-gray-400 text-sm">
                    <p>🎵 点击卡片开始播放，可搭配定时器使用</p>
                </div>
            </div>

            {/* 底部迷你播放器 */}
            {activeMusic && !playerOpen && (
                <div
                    className="fixed bottom-16 left-0 right-0 z-40 mx-4"
                    onClick={() => setPlayerOpen(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setPlayerOpen(true)}
                    aria-label="打开播放器"
                >
                    <div
                        className="backdrop-blur-md rounded-2xl shadow-xl overflow-hidden cursor-pointer active:scale-98 transition-transform"
                        style={{
                            background: "var(--theme-bg-surface)",
                            border: "1px solid var(--theme-border)",
                        }}
                    >
                        {/* 顶部彩色条 */}
                        <div className={`h-1 w-full bg-gradient-to-r ${activeMusic.cardGradient}`} />
                        <div className="flex items-center gap-3 px-4 py-3">
                            {/* 图标 */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${activeMusic.cardGradient}`}
                            >
                                <MusicIcon type={activeMusic.iconType} size={22} color={activeMusic.iconColor} />
                            </div>

                            {/* 信息 */}
                            <div className="flex-1 min-w-0">
                                <p className="text-gray-800 font-semibold text-sm truncate">{activeMusic.name}</p>
                                <p className="text-gray-400 text-xs">{formatDuration(activeMusic.duration)}</p>
                            </div>

                            {/* 播放图标 */}
                            <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${activeMusic.iconColor}33, ${activeMusic.iconColor}66)` }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill={activeMusic.iconColor}>
                                    <polygon points="5,3 19,12 5,21" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 全屏播放器 */}
            {playerOpen && activeMusic && (
                <MusicPlayer
                    music={activeMusic}
                    onClose={handlePlayerClose}
                />
            )}
        </div>
    );
}

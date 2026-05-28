'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { MUSIC_SQUARE_LIST, type MusicSquareItem } from '@/constants';

const MusicPlayer = dynamic(() => import('./components/MusicPlayer'), { ssr: false });

function MusicIcon({ type, size = 32, color = '#6b7280' }: { type: string; size?: number; color?: string }) {
    const props = {
        width: size,
        height: size,
        viewBox: '0 0 48 48',
        preserveAspectRatio: 'xMidYMid meet' as const,
        fill: 'none',
        stroke: color,
        strokeWidth: 2.5,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        className: 'block',
    };

    if (type === 'heartbeat') {
        return (
            <svg {...props}>
                <path d="M10 25 H17 L21 18 L26 30 L30 23 H38" />
                <path d="M24 40 C16 34, 10 29, 10 21 C10 16, 14 12, 19 12 C22 12, 24 14, 24 16 C24 14, 26 12, 29 12 C34 12, 38 16, 38 21 C38 29, 32 34, 24 40Z" />
            </svg>
        );
    }
    if (type === 'moon-cradle') {
        return (
            <svg {...props}>
                <path d="M28 8 C22 10, 19 16, 20 22 C21 28, 26 33, 32 34 C28 38, 21 40, 15 37 C8 33, 5 24, 9 16 C12 10, 19 7, 26 8" />
                <path d="M8 36 Q24 43 40 36" />
                <path d="M18 7 L18 11" />
                <path d="M14 9 L17 9" />
            </svg>
        );
    }
    if (type === 'rain-cloud') {
        return (
            <svg {...props}>
                <path d="M10 25 C10 20, 14 16, 20 16 C21 12, 25 10, 29 11 C34 12, 37 16, 37 21 C40 21, 42 24, 42 27 C42 31, 39 33, 35 33 H15 C12 33, 10 30, 10 25Z" />
                <path d="M18 36 L16 41" />
                <path d="M25 36 L23 41" />
                <path d="M32 36 L30 41" />
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
    if (type === 'forest-cricket') {
        return (
            <svg {...props}>
                <path d="M14 34 C19 29, 23 21, 23 13 C16 15, 11 20, 10 27 C9 31, 10 34, 14 34Z" />
                <path d="M23 13 C28 15, 33 20, 34 27 C35 31, 34 34, 30 34 C25 29, 23 21, 23 13Z" />
                <path d="M23 21 L23 37" />
                <path d="M18 41 L23 37 L28 41" />
                <path d="M38 18 L42 15" />
            </svg>
        );
    }
    if (type === 'wind-chime') {
        return (
            <svg {...props}>
                <path d="M24 9 L24 30" />
                <path d="M13 13 H35" />
                <path d="M16 13 L16 25" />
                <path d="M24 13 L24 28" />
                <path d="M32 13 L32 25" />
                <path d="M14 30 H34" />
                <path d="M7 18 C9 16, 11 16, 13 18" />
            </svg>
        );
    }
    if (type === 'campfire') {
        return (
            <svg {...props}>
                <path d="M24 10 C20 15, 17 19, 18 24 C19 29, 23 31, 24 35 C26 31, 30 29, 30 24 C30 19, 27 15, 24 10Z" />
                <path d="M15 36 L21 31" />
                <path d="M33 36 L27 31" />
                <path d="M12 38 H36" />
            </svg>
        );
    }
    if (type === 'music-box') {
        return (
            <svg {...props}>
                <rect x="10" y="16" width="28" height="20" rx="3" />
                <path d="M16 16 V12 H30 V16" />
                <path d="M19 23 H29" />
                <path d="M19 28 H26" />
                <path d="M38 23 H42" />
                <circle cx="42" cy="23" r="2" />
            </svg>
        );
    }
    if (type === 'lullaby') {
        return (
            <svg {...props}>
                <rect x="10" y="16" width="28" height="20" rx="3" />
                <path d="M16 16 V12 H30 V16" />
                <path d="M19 23 H29" />
                <path d="M19 28 H26" />
                <path d="M38 23 H42" />
                <circle cx="42" cy="23" r="2" />
            </svg>
        );
    }
    if (type === 'fan') {
        return (
            <svg {...props}>
                <path d="M10 25 H17 L21 18 L26 30 L30 23 H38" />
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
    const [activeMusic, setActiveMusic] = useState<MusicSquareItem | null>(null);
    const [playerOpen, setPlayerOpen] = useState(false);

    const handleCardClick = (music: MusicSquareItem) => {
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
                    <p className="mt-1" style={{ color: "var(--theme-text-muted)" }}>8类睡前声音，覆盖0-8岁入睡场景</p>
                </div>
            </div>

            {/* 音乐卡片网格 */}
            <div className="max-w-7xl mx-auto px-4 py-6 pb-32">
                <div className="grid grid-cols-2 gap-4">
                    {MUSIC_SQUARE_LIST.map((music) => (
                        <button
                            key={music.id}
                            onClick={() => handleCardClick(music)}
                            className={`relative rounded-3xl overflow-hidden aspect-square flex flex-col active:scale-95 transition-all duration-150 shadow-md hover:shadow-xl hover:-translate-y-1 bg-linear-to-br ${music.cardGradient}`}
                            aria-label={`播放 ${music.name}`}
                        >
                            {/* 卡片图标居中 */}
                            <div className="flex-1 flex items-center justify-center pt-4">
                                <div
                                    className="w-16 h-16 rounded-full grid place-items-center mx-auto"
                                    style={{ background: 'rgba(255,255,255,0.5)' }}
                                >
                                    <MusicIcon type={music.iconType} size={36} color={music.iconColor} />
                                </div>
                            </div>

                            {/* 底部信息区 */}
                            <div className="px-4 pb-4 text-left">
                                <p className="font-bold text-gray-800 text-base text-center">{music.name}</p>
                                <p className="text-gray-600 text-xs mt-0.5 line-clamp-1">{music.description}</p>
                                <p className="text-gray-400 text-[11px] mt-1 text-center">{music.ageHint} 睡前推荐</p>
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
                        <div className={`h-1 w-full bg-linear-to-r ${activeMusic.cardGradient}`} />
                        <div className="flex items-center gap-3 px-4 py-3">
                            {/* 图标 */}
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-linear-to-br ${activeMusic.cardGradient}`}
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
                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
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

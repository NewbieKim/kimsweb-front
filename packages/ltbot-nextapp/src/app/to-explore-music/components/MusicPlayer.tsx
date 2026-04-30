'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface MusicItem {
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

interface MusicPlayerProps {
    music: MusicItem;
    onClose: () => void;
}

const TIMER_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

function MusicIcon({ type, size = 48, color = '#6b7280' }: { type: string; size?: number; color?: string }) {
    const props = {
        width: size,
        height: size,
        viewBox: '0 0 48 48',
        fill: 'none',
        stroke: color,
        strokeWidth: 2,
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
                <path d="M26 34 L22 42 L27 42 L23 50" />
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

export default function MusicPlayer({ music, onClose }: MusicPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [showTimerPanel, setShowTimerPanel] = useState(false);
    const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
    const [timerRemaining, setTimerRemaining] = useState<number>(0);
    const [audioError, setAudioError] = useState(false);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback((minutes: number) => {
        stopTimer();
        setTimerMinutes(minutes);
        setTimerRemaining(minutes * 60);
        timerRef.current = setInterval(() => {
            setTimerRemaining((prev) => {
                if (prev <= 1) {
                    stopTimer();
                    audioRef.current?.pause();
                    setIsPlaying(false);
                    setTimerMinutes(null);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [stopTimer]);

    useEffect(() => {
        const audio = new Audio();
        audio.src = music.audioUrl;
        audio.loop = true;
        audio.crossOrigin = 'anonymous';
        audioRef.current = audio;

        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
        });
        audio.addEventListener('error', () => {
            setAudioError(true);
        });

        audio.play().then(() => {
            setIsPlaying(true);
        }).catch(() => {
            setIsPlaying(false);
        });

        return () => {
            audio.pause();
            audio.src = '';
            stopTimer();
        };
    }, [music.audioUrl, stopTimer]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }
    };

    const handleSetTimer = (minutes: number) => {
        startTimer(minutes);
        setShowTimerPanel(false);
    };

    const handleCancelTimer = () => {
        stopTimer();
        setTimerMinutes(null);
        setTimerRemaining(0);
        setShowTimerPanel(false);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: music.playerGradient }}
        >
            {/* 顶部操作栏 */}
            <div className="flex items-center justify-between px-5 pt-12 pb-4">
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                    aria-label="返回"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                    </svg>
                </button>

                <span className="text-gray-600 text-sm font-medium">正在播放</span>

                <button className="text-gray-500 text-sm font-medium px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm">
                    分享
                </button>
            </div>

            {/* 主体内容 */}
            <div className="flex-1 flex flex-col items-center justify-center px-8">
                {/* 圆形图标区域 */}
                <div className="relative mb-10">
                    <div
                        className="w-52 h-52 rounded-full border-2 flex items-center justify-center shadow-xl"
                        style={{
                            background: 'rgba(255,255,255,0.6)',
                            backdropFilter: 'blur(12px)',
                            borderColor: `${music.iconColor}33`,
                        }}
                    >
                        <div
                            className={`transition-all duration-300 ${isPlaying ? 'scale-100 opacity-100' : 'scale-90 opacity-60'}`}
                        >
                            <MusicIcon type={music.iconType} size={80} color={music.iconColor} />
                        </div>
                    </div>

                    {/* 外圈光晕动画 */}
                    {isPlaying && (
                        <div
                            className="absolute inset-0 rounded-full border animate-ping scale-110 opacity-20"
                            style={{ borderColor: music.iconColor }}
                        />
                    )}
                </div>

                {/* 音乐名称和描述 */}
                <h2 className="text-gray-800 text-2xl font-bold mb-1">{music.name}</h2>
                <p className="text-gray-500 text-sm mb-2">{music.description}</p>

                {/* 时间/状态 */}
                {audioError ? (
                    <p className="text-red-400 text-sm mt-1">音频加载失败，请检查网络</p>
                ) : (
                    <p className="text-gray-400 text-base">{formatTime(currentTime)}</p>
                )}

                {/* 播放/暂停按钮 */}
                <button
                    onClick={togglePlay}
                    className="mt-8 w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    style={{
                        background: `linear-gradient(135deg, ${music.iconColor}, ${music.iconColor}bb)`,
                    }}
                    aria-label={isPlaying ? '暂停' : '播放'}
                >
                    {isPlaying ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                            <polygon points="6,3 20,12 6,21" />
                        </svg>
                    )}
                </button>
            </div>

            {/* 底部定时器区域 */}
            <div className="pb-12 flex flex-col items-center gap-3 px-8">
                {timerMinutes !== null && (
                    <div className="text-gray-500 text-sm bg-white/50 rounded-full px-4 py-1.5">
                        定时剩余 {formatTime(timerRemaining)}
                    </div>
                )}
                <button
                    onClick={() => setShowTimerPanel(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border bg-white/60 backdrop-blur-sm text-gray-700 text-sm font-medium active:scale-95 transition-transform shadow-sm"
                    style={{ borderColor: `${music.iconColor}44` }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={music.iconColor} strokeWidth="2">
                        <circle cx="12" cy="13" r="8" />
                        <path d="M12 9v4l2 2" />
                        <path d="M9 3h6M12 3v2" />
                    </svg>
                    <span style={{ color: music.iconColor }}>
                        {timerMinutes ? `定时中 ${timerMinutes}分钟` : '定时器'}
                    </span>
                </button>
            </div>

            {/* 定时器面板 */}
            {showTimerPanel && (
                <div className="absolute inset-0 z-20 flex items-end">
                    <div
                        className="absolute inset-0 bg-black/20"
                        onClick={() => setShowTimerPanel(false)}
                    />
                    <div className="relative w-full bg-white/95 backdrop-blur-xl rounded-t-3xl p-6 shadow-2xl">
                        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
                        <h3 className="text-gray-800 text-lg font-bold text-center mb-1">定时停止</h3>
                        <p className="text-gray-400 text-sm text-center mb-6">选择时长后，音乐将自动停止</p>
                        <div className="grid grid-cols-4 gap-3 mb-4">
                            {TIMER_OPTIONS.map((min) => (
                                <button
                                    key={min}
                                    onClick={() => handleSetTimer(min)}
                                    className={`py-3 rounded-2xl text-sm font-medium transition-all active:scale-95 border ${
                                        timerMinutes === min
                                            ? 'text-white border-transparent'
                                            : 'bg-gray-50 text-gray-600 border-gray-100'
                                    }`}
                                    style={
                                        timerMinutes === min
                                            ? { background: `linear-gradient(135deg, ${music.iconColor}, ${music.iconColor}bb)` }
                                            : {
                                                borderColor: "var(--theme-border)",
                                                background: "var(--theme-bg-subtle)",
                                                color: "var(--theme-text-muted)",
                                            }
                                    }
                                >
                                    {min}分
                                </button>
                            ))}
                        </div>
                        {timerMinutes !== null && (
                            <button
                                onClick={handleCancelTimer}
                                className="w-full py-3 rounded-2xl text-sm font-medium text-gray-500 border border-gray-100 bg-gray-50 mt-1"
                            >
                                取消定时
                            </button>
                        )}
                        <button
                            onClick={() => setShowTimerPanel(false)}
                            className="w-full py-3 rounded-2xl text-sm font-medium mt-2 text-gray-400"
                        >
                            关闭
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

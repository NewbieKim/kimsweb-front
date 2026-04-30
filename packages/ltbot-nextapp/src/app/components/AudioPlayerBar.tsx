'use client';

import type { TTSStatus } from '@/hooks/useAzureTTS';

interface AudioPlayerBarProps {
  status: TTSStatus;
  progress: number;
  roleName?: string;
  roleEmoji?: string;
  isMobile: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export default function AudioPlayerBar({
  status,
  progress,
  roleName,
  roleEmoji,
  isMobile,
  onPause,
  onResume,
  onStop,
}: AudioPlayerBarProps) {
  if (status === 'idle') {
    return null;
  }

  const isPlaying = status === 'playing';
  const canResume = status === 'paused';

  return (
    <div className={`fixed left-0 right-0 z-50 ${isMobile ? 'bottom-[126px]' : 'bottom-[66px]'}`}>
      <div className="mx-auto max-w-[720px] rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
        <div className="h-1 rounded-t-xl bg-white/25">
          <div className="h-full rounded-t-xl bg-white transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-xl">{roleEmoji || '🔊'}</span>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold">
                {roleName ? `${roleName} 正在朗读` : '正在朗读'}
              </div>
              <div className="text-[11px] text-white/85">
                {status === 'loading' && '正在生成语音...'}
                {status === 'playing' && `播放中 ${progress}%`}
                {status === 'paused' && '已暂停'}
                {status === 'finished' && '已播放完成'}
                {status === 'error' && '播放失败，请重试'}
              </div>
            </div>
          </div>

          {isPlaying && (
            <button
              type="button"
              className="h-9 w-9 rounded-full bg-white/25 text-sm hover:bg-white/35"
              onClick={onPause}
              aria-label="暂停"
            >
              ❚❚
            </button>
          )}

          {canResume && (
            <button
              type="button"
              className="h-9 w-9 rounded-full bg-white/25 text-sm hover:bg-white/35"
              onClick={onResume}
              aria-label="继续"
            >
              ▶
            </button>
          )}

          <button
            type="button"
            className="h-9 w-9 rounded-full bg-white/25 text-sm hover:bg-white/35"
            onClick={onStop}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

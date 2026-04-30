'use client';
// TTS 分段播放核心 Hook，对外暴露 `{ status, progress, currentRole, play, pause, resume, stop }`。内部实现：
// • `play(text, role)`：自动识别普通文本/脚本，按片段串行执行
// • `speech` 段：调用 `/api/tts` 合成语音并顺序播放
// • `sfx` 段：优先播放 `public/sfx/*.mp3`；失败时自动 WebAudio 合成兜底（白噪音/音调/振荡波形）
// • `pause` 段：`[停顿:Xs]` 按真实毫秒数等待
// • 进度按片段权重累计，实时更新 `progress(0-100)`
// • 页面卸载时自动 stop 并关闭 AudioContext
import { useCallback, useEffect, useRef, useState } from 'react';
import type { VoiceRole } from '@/constants/ttsVoices';
import { isTaggedStoryScript, parseStoryScript } from '@/lib/tts/storyScript'; // isTaggedStoryScript: 判断是否为标签脚本, parseStoryScript: 将脚本解析为片段数组

export type TTSStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'finished' | 'error';

interface AzureTTSRequest {
  text: string;
  voiceName: string;
  rate: number;
  pitch: number;
}

interface UseAzureTTSReturn {
  status: TTSStatus;
  progress: number;
  currentRole: VoiceRole | null;
  play: (text: string, role: VoiceRole) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useAzureTTS(): UseAzureTTSReturn {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [currentRole, setCurrentRole] = useState<VoiceRole | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // 音频元素引用
  const objectUrlRef = useRef<string | null>(null); // 对象 URL 引用
  const audioContextRef = useRef<AudioContext | null>(null); // AudioContext 引用
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 定时器引用
  const abortRef = useRef(false); // 中断引用
  const progressUnitsRef = useRef({ total: 1, done: 0 }); // 进度单位引用

  const getAudioContext = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) {
        return null;
      }
      audioContextRef.current = new AudioCtx();
    }
    return audioContextRef.current;
  }, []);

  const updateProgress = useCallback((done: number, total: number) => {
    const safeTotal = total <= 0 ? 1 : total;
    const value = Math.max(0, Math.min(100, Math.round((done / safeTotal) * 100)));
    setProgress(value);
  }, []);

  const clearObjectUrl = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const closeAudioElement = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current = true;
    closeAudioElement();
    clearTimer();
    clearObjectUrl();
    setStatus('idle');
    setProgress(0);
    setCurrentRole(null);
    progressUnitsRef.current = { total: 1, done: 0 };
  }, [clearObjectUrl, clearTimer, closeAudioElement]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || status !== 'playing') {
      return;
    }
    audio.pause();
    setStatus('paused');
  }, [status]);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || status !== 'paused') {
      return;
    }
    audio.play().then(() => {
      setStatus('playing');
    }).catch((error) => {
      console.error('恢复播放失败:', error);
      setStatus('error');
    });
  }, [status]);

  const resolveSfxUrl = useCallback((text: string): string => {
    const lower = text.toLowerCase();
    // if (lower.includes('白噪音')) {
    //   return '/sfx/white-noise.mp3';
    // }
    // if (lower.includes('泡泡') || lower.includes('咕噜')) {
    //   return '/sfx/bubble.mp3';
    // }
    // if (lower.includes('风') || lower.includes('呼')) {
    //   return '/sfx/wind.mp3';
    // }
    // if (lower.includes('雨')) {
    //   return '/sfx/rain.mp3';
    // }
    return '/sfx/magic-chime.mp3';
  }, []);

  const playAudioSource = useCallback(async (src: string) => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.preload = 'auto';

    await new Promise<void>((resolve, reject) => {
      const onEnded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error('音频播放失败'));
      };
      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
      };

      audio.onended = onEnded;
      audio.onerror = onError;
      audio.play().catch((error) => {
        cleanup();
        reject(error);
      });
    });
  }, []);

  const playFallbackSfx = useCallback(async (text: string) => {
    const context = getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      await context.resume();
    }

    const lower = text.toLowerCase();
    const duration = lower.includes('白噪音') ? 2.8 : 0.9;

    await new Promise<void>((resolve) => {
      if (lower.includes('白噪音')) {
        const bufferSize = context.sampleRate * duration;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i += 1) {
          output[i] = Math.random() * 2 - 1;
        }

        const source = context.createBufferSource();
        const gainNode = context.createGain();
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(context.destination);
        const now = context.currentTime;
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.08, now + 1.6);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        source.start(now);
        source.stop(now + duration);
        source.onended = () => resolve();
        return;
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(460, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, context.currentTime + duration);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.onended = () => resolve();
    });
  }, [getAudioContext]);

  // 合成语音，文本转换为语音
  // 调用 `/api/tts` 合成语音并顺序播放
  const synthesizeSpeech = useCallback(async (text: string, role: VoiceRole) => {
    const payload: AzureTTSRequest = {
      text,
      voiceName: role.azureVoiceName,
      rate: role.speechRate,
      pitch: role.speechPitch,
    };

    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      throw new Error(result?.message || '语音生成失败');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    objectUrlRef.current = objectUrl;
    await playAudioSource(objectUrl);
    clearObjectUrl();
  }, [clearObjectUrl, playAudioSource]);

  const playPauseSegment = useCallback(async (ms: number) => {
    await new Promise<void>((resolve) => {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        resolve();
      }, ms);
    });
  }, []);

  const estimateSegmentUnits = useCallback((text: string) => {
    return Math.max(1, Math.round(text.length / 40));
  }, []);

  const play = useCallback(async (text: string, role: VoiceRole) => {
    const safeText = text.trim();
    if (!safeText) {
      return;
    }

    stop();
    abortRef.current = false;
    setStatus('loading');
    setCurrentRole(role);

    try {
      setStatus('playing');

      const segments = isTaggedStoryScript(safeText)
        ? parseStoryScript(safeText)
        : [{ type: 'speech' as const, text: safeText }];

      const totalUnits = segments.reduce((sum, segment) => {
        if (segment.type === 'pause') {
          return sum + Math.max(1, Math.round((segment.pauseMs || 1000) / 800));
        }
        if (segment.type === 'sfx') {
          return sum + 2;
        }
        return sum + estimateSegmentUnits(segment.text || '');
      }, 0);

      progressUnitsRef.current = { total: Math.max(1, totalUnits), done: 0 };
      updateProgress(0, progressUnitsRef.current.total);

      // 按片段顺序播放
      // 第一期：先不按照片段顺序播放，先按照文本顺序播放
      // for (const segment of segments) {
      //   if (abortRef.current) {
      //     return;
      //   }

      //   if (segment.type === 'pause') {
      //     await playPauseSegment(Math.max(200, segment.pauseMs || 1000));
      //     progressUnitsRef.current.done += Math.max(1, Math.round((segment.pauseMs || 1000) / 800));
      //     updateProgress(progressUnitsRef.current.done, progressUnitsRef.current.total);
      //     continue;
      //   }

      //   if (segment.type === 'sfx') {
      //     const sfxText = segment.text || '环境音效';
      //     const sfxUrl = resolveSfxUrl(sfxText);
      //     try {
      //       await playAudioSource(sfxUrl);
      //     } catch (error) {
      //       console.warn('SFX 文件播放失败，使用合成音效兜底:', error);
      //       await playFallbackSfx(sfxText);
      //     }

      //     progressUnitsRef.current.done += 2;
      //     updateProgress(progressUnitsRef.current.done, progressUnitsRef.current.total);
      //     continue;
      //   }

      //   if (!segment.text?.trim()) {
      //     continue;
      //   }

      //   const speechText = segment.speaker && segment.speaker !== '旁白'
      //     ? `${segment.speaker}：${segment.text}`
      //     : segment.text;

      //   await synthesizeSpeech(speechText, role); // 合成语音，文本转换为语音
      //   progressUnitsRef.current.done += estimateSegmentUnits(segment.text);
      //   updateProgress(progressUnitsRef.current.done, progressUnitsRef.current.total);
      // }
      await synthesizeSpeech(safeText, role);

      if (!abortRef.current) {
        setProgress(100);
        setStatus('finished');
      }
    } catch (error) {
      console.error('Azure TTS 播放失败:', error);
      setStatus('error');
    }
  }, [
    estimateSegmentUnits,
    playAudioSource,
    playFallbackSfx,
    playPauseSegment,
    resolveSfxUrl,
    stop,
    synthesizeSpeech,
    updateProgress,
  ]);

  useEffect(() => { // 页面卸载时自动 stop 并关闭 AudioContext
    return () => {
      stop();
      const audioContext = audioContextRef.current;
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => undefined);
      }
    };
  }, [stop]);

  return {
    status,
    progress,
    currentRole,
    play,
    pause,
    resume,
    stop,
  };
}

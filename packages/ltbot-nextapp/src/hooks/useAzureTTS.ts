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

const MAX_TTS_CHARS_PER_REQUEST = 320;
const REQUEST_TIMEOUT_MS = 35000;
const MAX_RETRY_COUNT = 2;

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
  const objectUrlsRef = useRef<Set<string>>(new Set()); // 对象 URL 集合
  const audioContextRef = useRef<AudioContext | null>(null); // AudioContext 引用
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 定时器引用
  const abortRef = useRef(false); // 中断引用
  const progressUnitsRef = useRef({ total: 1, done: 0 }); // 进度单位引用
  const fetchAbortControllerRef = useRef<AbortController | null>(null); // 接口请求中断控制器
  const playSessionRef = useRef(0); // 播放会话ID，避免关闭后旧异步任务复活播放器

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

  const trackObjectUrl = useCallback((url: string) => {
    objectUrlsRef.current.add(url);
  }, []);

  const revokeObjectUrl = useCallback((url: string) => {
    if (objectUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      objectUrlsRef.current.delete(url);
    }
  }, []);

  const clearAllObjectUrls = useCallback(() => {
    for (const url of objectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    objectUrlsRef.current.clear();
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
    playSessionRef.current += 1;
    abortRef.current = true;
    fetchAbortControllerRef.current?.abort();
    fetchAbortControllerRef.current = null;
    closeAudioElement();
    clearTimer();
    clearAllObjectUrls();
    setStatus('idle');
    setProgress(0);
    setCurrentRole(null);
    progressUnitsRef.current = { total: 1, done: 0 };
  }, [clearAllObjectUrls, clearTimer, closeAudioElement]);

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

  const playAudioSource = useCallback(async (
    src: string,
    options?: {
      onStart?: () => void;
      onProgress?: (ratio: number) => void;
    }
  ) => {
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
        audio.ontimeupdate = null;
        audio.onplaying = null;
      };

      audio.onplaying = () => {
        options?.onStart?.();
      };
      audio.ontimeupdate = () => {
        if (!audio.duration || Number.isNaN(audio.duration) || audio.duration <= 0) {
          return;
        }
        const ratio = Math.min(1, Math.max(0, audio.currentTime / audio.duration));
        options?.onProgress?.(ratio);
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

  const normalizeSpeechText = useCallback((text: string): string => {
    return text
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/`/g, '')
      .replace(/\r?\n{2,}/g, '\n')
      .trim();
  }, []);

  const getChunkLimitsByLength = useCallback((totalLength: number) => {
    // 首片更短，优先让用户尽快听到声音；后续按总长度自适应增大。
    if (totalLength >= 2200) {
      return { first: 70, normal: 200 };
    }
    if (totalLength >= 1400) {
      return { first: 85, normal: 230 };
    }
    if (totalLength >= 900) {
      return { first: 100, normal: 260 };
    }
    if (totalLength >= 500) {
      return { first: 120, normal: 290 };
    }
    return { first: 140, normal: MAX_TTS_CHARS_PER_REQUEST };
  }, []);

  const splitTextToChunks = useCallback((rawText: string): string[] => {
    const text = normalizeSpeechText(rawText);
    if (!text) {
      return [];
    }

    const { first: firstLimit, normal: normalLimit } = getChunkLimitsByLength(text.length);

    const sentences = text
      .split(/(?<=[。！？!?；;…\n])/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let current = '';
    let isFirstChunk = true;

    const pushCurrent = () => {
      if (current.trim()) {
        chunks.push(current.trim());
        current = '';
        if (isFirstChunk) {
          isFirstChunk = false;
        }
      }
    };

    for (const sentence of sentences) {
      const currentLimit = isFirstChunk ? firstLimit : normalLimit;
      if (sentence.length > currentLimit) {
        pushCurrent();
        const forceLimit = isFirstChunk ? firstLimit : normalLimit;
        for (let i = 0; i < sentence.length; i += forceLimit) {
          chunks.push(sentence.slice(i, i + forceLimit));
          if (isFirstChunk) {
            isFirstChunk = false;
          }
        }
        continue;
      }

      const activeLimit = isFirstChunk ? firstLimit : normalLimit;
      const mergedLength = current ? current.length + 1 + sentence.length : sentence.length;
      if (mergedLength > activeLimit) {
        pushCurrent();
      }
      current = current ? `${current} ${sentence}` : sentence;
    }

    pushCurrent();
    return chunks;
  }, [getChunkLimitsByLength, normalizeSpeechText]);

  const fetchWithTimeout = useCallback(async (payload: AzureTTSRequest) => {
    const controller = new AbortController();
    fetchAbortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
      if (fetchAbortControllerRef.current === controller) {
        fetchAbortControllerRef.current = null;
      }
    }
  }, []);

  const requestSpeechAudio = useCallback(async (text: string, role: VoiceRole): Promise<string> => {
    const payload: AzureTTSRequest = {
      text,
      voiceName: role.azureVoiceName,
      rate: role.speechRate,
      pitch: role.speechPitch,
    };

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= MAX_RETRY_COUNT; attempt += 1) {
      if (abortRef.current) {
        throw new Error('播放已终止');
      }

      try {
        const response = await fetchWithTimeout(payload);
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.message || `语音生成失败(${response.status})`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        trackObjectUrl(objectUrl);
        return objectUrl;
      } catch (error) {
        lastError = error;
        if (attempt >= MAX_RETRY_COUNT) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('语音生成失败');
  }, [fetchWithTimeout, trackObjectUrl]);

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
    const sessionId = playSessionRef.current + 1;
    playSessionRef.current = sessionId;
    abortRef.current = false;
    setStatus('loading');
    setCurrentRole(role);

    try {
      let hasStartedPlaying = false;
      const isSessionActive = () => !abortRef.current && playSessionRef.current === sessionId;
      const markPlaybackStarted = () => {
        if (!hasStartedPlaying && isSessionActive()) {
          hasStartedPlaying = true;
          setStatus('playing');
        }
      };

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

      for (const segment of segments) {
        if (!isSessionActive()) {
          return;
        }

        if (segment.type === 'pause') {
          markPlaybackStarted();
          await playPauseSegment(Math.max(200, segment.pauseMs || 1000));
          progressUnitsRef.current.done += Math.max(1, Math.round((segment.pauseMs || 1000) / 800));
          updateProgress(progressUnitsRef.current.done, progressUnitsRef.current.total);
          continue;
        }

        if (segment.type === 'sfx') {
          markPlaybackStarted();
          const sfxText = segment.text || '环境音效';
          const sfxUrl = resolveSfxUrl(sfxText);
          try {
            await playAudioSource(sfxUrl);
          } catch (error) {
            console.warn('SFX 文件播放失败，使用合成音效兜底:', error);
            await playFallbackSfx(sfxText);
          }

          progressUnitsRef.current.done += 2;
          updateProgress(progressUnitsRef.current.done, progressUnitsRef.current.total);
          continue;
        }

        if (!segment.text?.trim()) {
          continue;
        }

        const speechText = segment.speaker && segment.speaker !== '旁白'
          ? `${segment.speaker}：${segment.text}`
          : segment.text;
        const speechChunks = splitTextToChunks(speechText);

        if (speechChunks.length === 0) {
          continue;
        }

        let nextAudioPromise: Promise<string> | null = requestSpeechAudio(speechChunks[0], role);

        for (let chunkIndex = 0; chunkIndex < speechChunks.length; chunkIndex += 1) {
          if (!isSessionActive()) {
            return;
          }

          const currentChunk = speechChunks[chunkIndex];
          const currentAudioPromise = nextAudioPromise;
          if (!currentAudioPromise) {
            break;
          }

          if (chunkIndex + 1 < speechChunks.length) {
            nextAudioPromise = requestSpeechAudio(speechChunks[chunkIndex + 1], role);
          } else {
            nextAudioPromise = null;
          }

          const currentAudioUrl = await currentAudioPromise;
          if (!isSessionActive()) {
            revokeObjectUrl(currentAudioUrl);
            return;
          }
          const chunkUnits = estimateSegmentUnits(currentChunk);
          const baseDone = progressUnitsRef.current.done;
          try {
            await playAudioSource(currentAudioUrl, {
              onStart: markPlaybackStarted,
              onProgress: (ratio) => {
                if (!isSessionActive()) {
                  return;
                }
                updateProgress(
                  baseDone + chunkUnits * ratio,
                  progressUnitsRef.current.total
                );
              },
            });
          } finally {
            revokeObjectUrl(currentAudioUrl);
          }

          progressUnitsRef.current.done += chunkUnits;
          updateProgress(progressUnitsRef.current.done, progressUnitsRef.current.total);
        }
      }

      if (isSessionActive()) {
        setProgress(100);
        setStatus('finished');
      }
    } catch (error) {
      console.error('Azure TTS 播放失败:', error);
      if (playSessionRef.current === sessionId) {
        setStatus('error');
      }
    }
  }, [
    estimateSegmentUnits,
    playAudioSource,
    playFallbackSfx,
    playPauseSegment,
    resolveSfxUrl,
    revokeObjectUrl,
    requestSpeechAudio,
    splitTextToChunks,
    stop,
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

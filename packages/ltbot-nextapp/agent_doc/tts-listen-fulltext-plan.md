# 「听全文」语音朗读功能 - 技术方案文档

> 文档版本：v1.0  
> 创建日期：2026-04-29  
> 场景：0-8 岁儿童睡前故事朗读  
> 参考页面：`src/app/to-explore-story/[id]/page.tsx`

---

## 一、功能概述

在故事详情页新增「听全文」入口，用户点击后弹出**角色选择面板**，选定朗读角色（温柔妈妈 / 贴心爸爸等）后开始语音播放故事全文，底部常驻**迷你播放控制条**，支持暂停、继续、关闭。

效果参考截图：  
`assets/d__lls_jiangjinming_AppData_Roaming_Cursor_User_workspaceStorage_.../image-7a3d3a9f...png`

---

## 二、技术选型

### 2.1 方案对比

| 维度 | 方案 A：浏览器 Web Speech API | 方案 B：云端 TTS（Azure / 阿里云） |
|------|-------------------------------|-------------------------------------|
| 接入成本 | ★★★★★ 零成本，5 行代码 | ★★☆☆☆ 需申请 Key、写后端接口 |
| 音色质量 | ★★★☆☆ 依赖系统/浏览器 | ★★★★★ 专业神经网络音色 |
| 儿童友好度 | 一般（中文 zh-CN 语音差异大） | 高（可选儿童风格音色） |
| 费用 | 免费 | 按字数计费（Azure 免费 50 万字/月） |
| 离线支持 | ✅ | ❌ |
| 角色切换 | 有限（系统内置音色） | 丰富（数十种音色） |
| **推荐阶段** | **MVP 快速上线** | **正式版迭代** |

### 2.2 推荐策略：分阶段落地

```
阶段一（1-3天）：Web Speech API 快速验证
  → 纯前端，零后端改动，立即可用

阶段二（按需）：接入 Azure TTS / 阿里云 TTS
  → 复用同一套组件架构，仅替换音频来源
```

---

## 三、朗读角色设计

| 角色 ID | 显示名 | 描述 | Web Speech Rate | Azure 音色 |
|---------|--------|------|-----------------|-----------|
| `mom` | 温柔妈妈 | 柔和、亲切，适合睡前 | 0.85 | `zh-CN-XiaoxiaoNeural` |
| `dad` | 贴心爸爸 | 低沉、稳重，故事感强 | 0.9 | `zh-CN-YunyangNeural` |
| `kid` | 活泼宝宝 | 童趣、生动，孩子最爱 | 1.0 | `zh-CN-XiaoyouNeural` |

> 角色列表可通过配置文件 `src/constants/ttsVoices.ts` 扩展，无需改代码。

---

## 四、整体架构

```
src/
├── constants/
│   └── ttsVoices.ts          ← 新增：角色配置表
├── hooks/
│   └── useTTS.ts             ← 新增：TTS 核心 Hook
├── app/
│   ├── components/
│   │   ├── VoicePickerModal.tsx   ← 新增：角色选择弹框
│   │   └── AudioPlayerBar.tsx     ← 新增：底部播放控制条
│   └── to-explore-story/
│       └── [id]/
│           └── page.tsx      ← 改造：新增「听全文」入口（约 10 行改动）
└── app/api/
    └── tts/
        └── route.ts          ← 可选：云端 TTS 代理接口（阶段二）
```

---

## 五、核心模块详细设计

### 5.1 角色配置常量 `src/constants/ttsVoices.ts`

```typescript
export interface VoiceRole {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // Web Speech API 参数
  webSpeech: {
    lang: string;
    rate: number;    // 语速 0.1-10，推荐 0.8-1.0
    pitch: number;   // 音调 0-2，推荐 1.0-1.2
    volume: number;  // 音量 0-1
  };
  // Azure TTS 参数（阶段二）
  azure?: {
    voiceName: string;
    style?: string;
  };
}

export const TTS_VOICE_ROLES: VoiceRole[] = [
  {
    id: 'mom',
    name: '温柔妈妈',
    emoji: '👩',
    description: '轻柔温暖，最适合睡前',
    webSpeech: { lang: 'zh-CN', rate: 0.85, pitch: 1.1, volume: 1 },
    azure: { voiceName: 'zh-CN-XiaoxiaoNeural', style: 'gentle' },
  },
  {
    id: 'dad',
    name: '贴心爸爸',
    emoji: '👨',
    description: '沉稳有力，故事感十足',
    webSpeech: { lang: 'zh-CN', rate: 0.9, pitch: 0.9, volume: 1 },
    azure: { voiceName: 'zh-CN-YunyangNeural' },
  },
  {
    id: 'kid',
    name: '活泼宝宝',
    emoji: '🧒',
    description: '童真可爱，最受小朋友喜爱',
    webSpeech: { lang: 'zh-CN', rate: 1.0, pitch: 1.3, volume: 1 },
    azure: { voiceName: 'zh-CN-XiaoyouNeural' },
  },
];
```

---

### 5.2 TTS 核心 Hook `src/hooks/useTTS.ts`

```typescript
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceRole } from '@/constants/ttsVoices';

export type TTSStatus = 'idle' | 'playing' | 'paused' | 'finished' | 'error';

export interface UseTTSReturn {
  status: TTSStatus;
  progress: number;          // 0-100
  currentRole: VoiceRole | null;
  play: (text: string, role: VoiceRole) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function useTTS(): UseTTSReturn {
  const [status, setStatus] = useState<TTSStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [currentRole, setCurrentRole] = useState<VoiceRole | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textRef = useRef<string>('');
  const charIndexRef = useRef<number>(0);

  // 检查浏览器支持
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // 页面卸载时停止播放
  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel();
    };
  }, [isSupported]);

  const buildUtterance = useCallback((text: string, role: VoiceRole): SpeechSynthesisUtterance => {
    const utterance = new SpeechSynthesisUtterance(text);
    const { lang, rate, pitch, volume } = role.webSpeech;
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        charIndexRef.current = e.charIndex;
        setProgress(Math.round((e.charIndex / textRef.current.length) * 100));
      }
    };

    utterance.onend = () => {
      setStatus('finished');
      setProgress(100);
    };

    utterance.onerror = (e) => {
      // 用户主动 cancel 时忽略
      if (e.error === 'canceled' || e.error === 'interrupted') return;
      setStatus('error');
    };

    return utterance;
  }, []);

  const play = useCallback((text: string, role: VoiceRole) => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    textRef.current = text;
    charIndexRef.current = 0;
    setProgress(0);
    setCurrentRole(role);

    const utterance = buildUtterance(text, role);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setStatus('playing');
  }, [isSupported, buildUtterance]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setStatus('paused');
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setStatus('playing');
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setStatus('idle');
    setProgress(0);
    setCurrentRole(null);
  }, [isSupported]);

  return { status, progress, currentRole, play, pause, resume, stop, isSupported };
}
```

> **说明**：`useTTS` 封装了浏览器 Web Speech API，阶段二替换为云端 TTS 时，只需修改 `play` 方法内部，组件层无需任何改动。

---

### 5.3 角色选择弹框 `src/app/components/VoicePickerModal.tsx`

```typescript
'use client';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@heroui/modal';
import { TTS_VOICE_ROLES, VoiceRole } from '@/constants/ttsVoices';

interface VoicePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: VoiceRole) => void;
}

export default function VoicePickerModal({ isOpen, onClose, onSelectRole }: VoicePickerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} placement="bottom" size="sm">
      <ModalContent>
        <ModalHeader className="text-center text-base font-bold">选择朗读角色</ModalHeader>
        <ModalBody className="pb-8">
          <div className="grid grid-cols-3 gap-3">
            {TTS_VOICE_ROLES.map((role) => (
              <button
                key={role.id}
                onClick={() => { onSelectRole(role); onClose(); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-gray-100
                           hover:border-purple-400 hover:bg-purple-50 active:scale-95 transition-all"
              >
                <span className="text-4xl">{role.emoji}</span>
                <span className="text-sm font-semibold text-gray-800">{role.name}</span>
                <span className="text-[11px] text-gray-500 text-center leading-tight">{role.description}</span>
              </button>
            ))}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

---

### 5.4 底部播放控制条 `src/app/components/AudioPlayerBar.tsx`

```typescript
'use client';
import { TTSStatus, UseTTSReturn } from '@/hooks/useTTS';

interface AudioPlayerBarProps {
  tts: UseTTSReturn;
  isMobile?: boolean;
}

export default function AudioPlayerBar({ tts, isMobile }: AudioPlayerBarProps) {
  const { status, progress, currentRole, pause, resume, stop } = tts;

  if (status === 'idle') return null;

  return (
    <div className={`fixed left-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 
                    text-white shadow-lg z-50 ${isMobile ? 'bottom-[120px]' : 'bottom-[64px]'}`}>
      {/* 进度条 */}
      <div className="h-1 bg-white/30 w-full">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3 max-w-[720px] mx-auto">
        {/* 角色标识 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl flex-shrink-0">{currentRole?.emoji}</span>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate">{currentRole?.name} · 正在朗读</div>
            <div className="text-[10px] text-white/70">
              {status === 'paused' ? '已暂停' : status === 'finished' ? '播放完毕' : `${progress}%`}
            </div>
          </div>
        </div>

        {/* 播放/暂停按钮 */}
        {status === 'playing' && (
          <button
            onClick={pause}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            aria-label="暂停"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </button>
        )}
        {(status === 'paused' || status === 'finished') && (
          <button
            onClick={resume}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
            aria-label="继续播放"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
        {status === 'error' && (
          <span className="text-xs text-yellow-200">播放失败，请重试</span>
        )}

        {/* 关闭按钮 */}
        <button
          onClick={stop}
          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
          aria-label="关闭播放"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
```

---

### 5.5 改造故事详情页 `to-explore-story/[id]/page.tsx`

需要改动的地方极少（约 10 行），改动清单如下：

**① 顶部新增 3 个 import**

```typescript
import { useTTS } from '@/hooks/useTTS';
import VoicePickerModal from '@/app/components/VoicePickerModal';
import AudioPlayerBar from '@/app/components/AudioPlayerBar';
```

**② 组件内新增 2 个 state + 1 个 tts 实例**

```typescript
const tts = useTTS();
const [showVoicePicker, setShowVoicePicker] = useState(false);
```

**③ 在「标题」右侧新增「听全文」按钮**（故事内容区 h1 旁边）

```tsx
<div className="flex items-center justify-between mb-4">
  <h1 className="text-xl md:text-2xl font-bold flex-1">
    {getStoryTitle(story)}
  </h1>
  {story.content && (
    <button
      onClick={() => setShowVoicePicker(true)}
      className="flex items-center gap-1 px-3 py-1.5 rounded-full 
                 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium
                 hover:shadow-md active:scale-95 transition-all flex-shrink-0 ml-3"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
      </svg>
      听全文
    </button>
  )}
</div>
```

**④ 在 return 末尾、关闭 `</div>` 之前插入 2 个新组件**

```tsx
{/* 朗读角色选择弹框 */}
<VoicePickerModal
  isOpen={showVoicePicker}
  onClose={() => setShowVoicePicker(false)}
  onSelectRole={(role) => tts.play(story?.content || '', role)}
/>

{/* 底部播放控制条 */}
<AudioPlayerBar tts={tts} isMobile={isMobile} />
```

---

## 六、阶段二：云端 TTS 接入方案（可选）

当 Web Speech API 音色质量无法满足需求时，可接入云端 TTS。推荐 **Azure 语音服务**，每月免费 50 万字符。

### 6.1 后端代理接口 `src/app/api/tts/route.ts`

```typescript
import { NextRequest } from 'next/server';

export const runtime = 'edge'; // 使用 Edge Runtime 减少延迟

export async function POST(req: NextRequest) {
  const { text, voiceName, style } = await req.json();

  const AZURE_KEY = process.env.AZURE_TTS_KEY!;
  const AZURE_REGION = process.env.AZURE_TTS_REGION!;

  // 获取 Access Token
  const tokenRes = await fetch(
    `https://${AZURE_REGION}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    { method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': AZURE_KEY } }
  );
  const token = await tokenRes.text();

  // 构造 SSML（针对儿童场景调整语速、语调）
  const ssml = `
    <speak version="1.0" xml:lang="zh-CN">
      <voice name="${voiceName}">
        <prosody rate="-10%" pitch="+5%">
          ${text.replace(/[<>&]/g, (c: string) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] || c))}
        </prosody>
      </voice>
    </speak>`;

  const ttsRes = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
      },
      body: ssml,
    }
  );

  const audioBuffer = await ttsRes.arrayBuffer();
  return new Response(audioBuffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600', // 同文本同音色缓存 1 小时
    },
  });
}
```

### 6.2 修改 `useTTS` 支持云端音频

当阶段二启动时，在 `useTTS.ts` 中新增 `playCloud` 方法：

```typescript
const playCloud = useCallback(async (text: string, role: VoiceRole) => {
  if (!role.azure) { play(text, role); return; }
  setStatus('playing');
  setCurrentRole(role);

  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName: role.azure.voiceName, style: role.azure.style }),
  });

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.onended = () => { setStatus('finished'); setProgress(100); };
  audio.ontimeupdate = () => {
    setProgress(Math.round((audio.currentTime / audio.duration) * 100));
  };
  audio.play();
}, [play]);
```

---

## 七、环境变量配置

```bash
# .env.local（阶段二需要）
AZURE_TTS_KEY=your_azure_speech_key
AZURE_TTS_REGION=eastasia
```

---

## 八、实现计划

### 阶段一：Web Speech API（预计 1-2 天）

| 步骤 | 文件 | 工作量 |
|------|------|--------|
| 1 | 新建 `src/constants/ttsVoices.ts` | 30 分钟 |
| 2 | 新建 `src/hooks/useTTS.ts` | 1 小时 |
| 3 | 新建 `src/app/components/VoicePickerModal.tsx` | 1 小时 |
| 4 | 新建 `src/app/components/AudioPlayerBar.tsx` | 1 小时 |
| 5 | 改造 `to-explore-story/[id]/page.tsx` | 30 分钟 |

总改动量：**4 个新文件 + 1 个页面微改造（约 15 行）**

### 阶段二：云端 TTS（按需，预计 1 天）

| 步骤 | 文件 | 工作量 |
|------|------|--------|
| 1 | 申请 Azure 语音服务 Key | 30 分钟 |
| 2 | 新建 `src/app/api/tts/route.ts` | 1 小时 |
| 3 | 修改 `useTTS.ts` 的 `play` 方法 | 30 分钟 |

---

## 九、兼容性说明

| 平台 | Web Speech API | 云端 TTS |
|------|---------------|---------|
| Chrome (Android/PC) | ✅ | ✅ |
| Safari (iOS 16+) | ✅ | ✅ |
| 微信内置浏览器 | ⚠️ 部分支持 | ✅ |
| Firefox | ✅ | ✅ |

> iOS Safari 限制：必须由用户手势（点击）触发 `speechSynthesis.speak()`，本方案的弹框选角色 → 点击角色触发朗读，**天然符合**此限制。

---

## 十、后续可扩展方向

1. **断点续读**：记录 `charIndex`，下次从中断处继续（需配合 localStorage）
2. **定时关闭**：儿童睡前场景，可加「15/30 分钟后停止」功能
3. **语速调节**：在播放条新增 0.8x / 1.0x / 1.2x 切换
4. **积分消耗**：云端 TTS 调用可计入积分消耗，复用现有 `/api/scores/consume` 接口
5. **音频缓存**：同一故事相同角色的 TTS 音频存 IndexedDB，二次播放秒开

---

*方案整体改动小、可增量发布，阶段一对现有代码零侵入，推荐优先落地。*

---

## 十一、多角色/音效脚本识别与语音合成方案（新增）

### 11.1 先回答核心问题

**Q1：这种包含 `[旁白] / [音效] / [停顿] / [角色对话]` 的文本，能否被识别？**  
可以。建议不要完全依赖 TTS 引擎“自动识别”，而是先做一层**结构化解析**（Parser），把文本转成可执行的片段队列（Narration、Dialog、SFX、Pause）。

**Q2：现代大模型是否能准确识别？**  
可以，且在该格式固定时准确率很高；但工程上应采用：  
1) **规则解析器为主**（正则 + 状态机，稳定可控）  
2) **LLM 只做纠错/补全**（用户输入不规范时兜底）  
3) **Schema 校验必做**（防止漏段、标签错配）

结论：在你这个“睡前故事标签格式”场景下，完全可实现稳定生产级能力。

---

### 11.2 建议支持的脚本格式（与你提供格式一致）

```text
[旁白] 海底泡泡城，水是暖暖的。
[音效] 咕噜咕噜的水泡声
[旁白] 小抱仔和小猫咪，游过一片软软的海草。
[停顿:2s]

[旁白] 前面有好多彩色泡泡，一闪一闪的。
[音效] 啵啵啵的泡泡破裂声
[小抱仔] 小猫咪，我想摸摸那个大泡泡。
[小猫咪] 喵，我陪你。
[停顿:2s]

[旁白] 小抱仔伸出小手，碰了一下泡泡。
[音效] 轻轻的“噗”一声
[旁白] 泡泡没有破，只是晃了晃。
[小抱仔] 它好软呀。
[小猫咪] 喵，像棉花糖。
[停顿:2s]

[旁白] 小抱仔又碰了一下，泡泡轻轻弹开。
[音效] 咕噜噜的水声
[旁白] 小抱仔笑了。
[小抱仔] 我不怕了。
[小猫咪] 喵，小抱仔真棒。
[停顿:3s]

[旁白] 泡泡慢慢飘远了。
[旁白] 小抱仔闭上眼睛。
[旁白] 身体轻轻浮起来。
[旁白] 像泡泡一样。
[旁白] 好轻。
[停顿:4s]

[妈妈/爸爸的声音] 晚安，宝贝。
[停顿:4s]
[音效] 白噪音渐入
```

---

### 11.3 系统架构（推荐）

```text
原始脚本
  -> ScriptParser(规则解析)
  -> 标准片段 JSON
  -> Segment Synthesizer
      - narration/dialog -> Azure TTS
      - sfx -> SFX 库匹配或 LLM-SFX 映射
      - pause -> 静音片段生成
  -> Audio Stitcher(拼接/淡入淡出/响度标准化)
  -> 最终 MP3
  -> 前端播放器（进度、暂停、断点续播）
```

---

### 11.4 片段数据结构（标准 Schema）

```ts
type SegmentType = 'narration' | 'dialog' | 'sfx' | 'pause';

interface StoryAudioSegment {
  id: string;
  type: SegmentType;
  speaker?: string;        // narration/dialog 时使用，如 旁白/小抱仔/小猫咪
  text?: string;           // narration/dialog/sfx 描述文本
  pauseMs?: number;        // pause 时使用
  voiceName?: string;      // Azure voice
  rate?: number;           // 语速倍率
  pitch?: number;          // 音调倍率
  gainDb?: number;         // 音量微调
  startMs?: number;        // 拼接后起始时间（可选）
  durationMs?: number;     // 片段时长（可选）
}
```

---

### 11.5 解析策略（稳定版）

#### A. 规则优先解析（必须）

- 正则识别标签：
  - `^\[旁白\]\s*(.+)$`
  - `^\[音效\]\s*(.+)$`
  - `^\[停顿:(\d+)s\]\s*$`
  - `^\[([^\]]+)\]\s*(.+)$`（通用角色对话）
- 空行直接跳过。
- 未识别行归并到上一段 `text`（容错）。

#### B. LLM 纠错（可选）

当脚本输入来自用户自由编辑且格式混乱时：
- 调用 LLM 将文本规范化为固定标签格式；
- 输出必须通过 JSON Schema 校验，不通过则回退规则解析。

---

### 11.6 角色映射与声音策略（0-8 岁优化）

| 标签 | 建议声音 | Azure Voice | 参数 |
|------|----------|-------------|------|
| 旁白 | 温柔、慢速 | `zh-CN-XiaoxiaoNeural` | `rate:0.85` `pitch:1.05` |
| 小抱仔 | 童真活泼 | `zh-CN-XiaoyouNeural` | `rate:0.95` `pitch:1.2` |
| 小猫咪 | 轻快拟人 | `zh-CN-XiaochenNeural` | `rate:1.0` `pitch:1.15` |
| 妈妈/爸爸的声音 | 由用户选择 | `XiaoxiaoNeural` / `YunyangNeural` | `rate:0.8~0.9` |

建议规则：
- 睡前场景整体语速控制在 `0.82 ~ 0.95`；
- 每段末尾自动补 `200~350ms` 微停顿；
- 大于 2s 的停顿用静音片段，不用 TTS 读“停顿”二字。

---

### 11.7 音效处理（SFX）

`[音效] 咕噜咕噜的水泡声` 不建议交给 TTS 朗读，建议两种实现：

1. **SFX 资产库映射（优先）**
   - 建立字典：`水泡声 -> /public/sfx/bubble_loop.mp3`
   - 支持模糊匹配：`泡泡破裂声 -> bubble_pop.mp3`

2. **无命中回退**
   - 回退为低音量旁白读法：`（背景有咕噜咕噜的水泡声）`
   - 避免“静音缺失感”

播放混音建议：
- SFX 默认 `-12dB`；
- 人声优先，SFX 在对话片段时自动 ducking 到 `-18dB`；
- 白噪音渐入用 3~5 秒 fade-in。

---

### 11.8 Azure 端落地建议（结合现有实现）

你当前已经有 `/api/tts`，建议升级为两个接口：

1. `POST /api/tts/script-parse`
   - 输入：原始脚本文本
   - 输出：`StoryAudioSegment[]`

2. `POST /api/tts/script-render`
   - 输入：`StoryAudioSegment[]` + 用户选的妈妈/爸爸主声音
   - 处理：
     - narration/dialog 调 Azure TTS
     - sfx 查资源库
     - pause 生成静音
     - ffmpeg 拼接导出单文件 mp3
   - 输出：可直接播放的 `audioUrl`

> MVP 也可不做预渲染，前端按片段串行请求播放；但为减少卡顿，推荐服务端预渲染整段音频。

---

### 11.9 准确率与质量保障

1. **结构准确率**
   - 规则解析 + Schema 校验，结构准确率可达工程可用级（接近 100%）。

2. **朗读自然度**
   - 通过角色映射、语速语调模板、标点停顿增强自然感。

3. **可观测性**
   - 记录每个片段合成耗时、失败原因、重试次数；
   - 对 Azure 429/5xx 做指数退避重试。

4. **自动化测试**
   - 用你给出的示例脚本做 Golden Test：
     - 片段数量是否一致
     - pause 时长是否正确
     - 角色映射是否正确

---

### 11.10 最小改造清单（在你现有代码上）

新增文件建议：
- `src/lib/tts/scriptParser.ts`（标签解析）
- `src/lib/tts/voiceMapper.ts`（角色映射）
- `src/lib/tts/sfxMapper.ts`（音效映射）
- `src/app/api/tts/script-parse/route.ts`
- `src/app/api/tts/script-render/route.ts`（可放二期）

现有文件调整：
- `src/app/api/tts/route.ts`：继续保留单段 TTS；
- `src/hooks/useAzureTTS.ts`：新增 `playSegments()`；
- `src/app/to-explore-story/[id]/page.tsx`：增加“脚本模式”开关（普通全文 / 标签脚本）。

---

### 11.11 结论

对于你提供的这种脚本格式，**现代模型 + 工程化解析**完全可以稳定识别并生成高质量语音。  
真正的关键不是“模型能不能识别”，而是要把流程做成：**可解析、可校验、可回退、可拼接**。  
按本方案实施后，可以稳定支持多角色旁白、音效、停顿和睡前节奏控制。

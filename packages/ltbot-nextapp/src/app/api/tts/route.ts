import { badRequestResponse, errorResponse } from '@/lib/response';
import { isTaggedStoryScript, parseStoryScript } from '@/lib/tts/storyScript'; // 故事脚本工具库, 提供识别、解析、转换功能,输出展示文本 + TTS脚本

interface TTSRequestBody {
  text?: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
}

const escapeXml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;'); // 替换 XML 特殊字符

const clamp = (value: number, min: number, max: number) => { // 限制值在最小值和最大值之间
  return Math.min(Math.max(value, min), max);
};

// 将文本转换为 SSML 格式,什么是SSML?
// SSML是Speech Synthesis Markup Language的缩写，是一种用于合成语音的标记语言。它是一种XML语言，用于描述语音合成引擎应该如何生成语音。
// SSML可以包含以下元素：
// <speak>：根元素，包含所有的语音合成内容。
// <voice>：定义语音合成引擎应该使用哪个语音。
// <prosody>：定义语音合成引擎应该如何生成语音。
// <break>：定义语音合成引擎应该如何生成停顿。
// <p>：定义语音合成引擎应该如何生成段落。
// <s>：定义语音合成引擎应该如何生成句子。
// <sub>：定义语音合成引擎应该如何生成子元素。
// <sup>：定义语音合成引擎应该如何生成上标。
// <u>：定义语音合成引擎应该如何生成下划线。
// <i>：定义语音合成引擎应该如何生成斜体。
// <b>：定义语音合成引擎应该如何生成粗体。
// <c>：定义语音合成引擎应该如何生成颜色。
const toSsmlBodyFromText = (text: string): string => {
  if (!isTaggedStoryScript(text)) {
    return escapeXml(text).replace(/\r?\n/g, '<break time="500ms"/>');
  }

  const segments = parseStoryScript(text);
  const chunks: string[] = [];

  for (const segment of segments) {
    if (segment.type === 'pause') {
      const pauseMs = clamp(segment.pauseMs || 1000, 300, 10000);
      chunks.push(`<break time="${pauseMs}ms"/>`);
      continue;
    }

    if (segment.type === 'sfx') {
      if (segment.text?.trim()) {
        chunks.push(`${escapeXml(`（背景音：${segment.text}）`)}<break time="400ms"/>`);
      }
      continue;
    }

    if (segment.type === 'speech' && segment.text?.trim()) {
      const spokenText =
        segment.speaker && segment.speaker !== '旁白'
          ? `${segment.speaker}：${segment.text}`
          : segment.text;
      chunks.push(`${escapeXml(spokenText)}<break time="450ms"/>`);
    }
  }

  return chunks.join('');
};

// Azure TTS 代理接口: 接收文本/音色/语速/音调参数，自动识别是否为脚本格式：纯文本直接合成；脚本格式按片段转 SSML（`<break>` 停顿、音效转描述文本、对话加角色前缀），返回 `audio/mpeg` 二进制流
export async function POST(request: Request) {
  try {
    const body: TTSRequestBody = await request.json();
    const text = body.text?.trim(); // 文本
    const voiceName = body.voiceName?.trim(); // 音色
    const rate = typeof body.rate === 'number' ? body.rate : 1; // 语速
    const pitch = typeof body.pitch === 'number' ? body.pitch : 1; // 音调

    if (!text) {
      return badRequestResponse('text 不能为空');
    }
    if (!voiceName) {
      return badRequestResponse('voiceName 不能为空');
    }

    const azureKey = process.env.AZURE_TTS_KEY;
    const azureRegion = process.env.AZURE_TTS_REGION;
    if (!azureKey || !azureRegion) {
      return errorResponse('未配置 Azure TTS 环境变量');
    }

    const safeRate = clamp(rate, 0.5, 1.2);
    const safePitch = clamp(pitch, 0.7, 1.3);
    const ssmlBody = toSsmlBodyFromText(text); // 将文本转换为 SSML 格式

    const ratePercent = `${safeRate >= 1 ? '+' : ''}${Math.round((safeRate - 1) * 100)}%`;
    const pitchPercent = `${safePitch >= 1 ? '+' : ''}${Math.round((safePitch - 1) * 100)}%`;

    const ssml = `<speak version="1.0" xml:lang="zh-CN"><voice name="${voiceName}"><prosody rate="${ratePercent}" pitch="${pitchPercent}">${ssmlBody}</prosody></voice></speak>`;

    const azureResponse = await fetch(
      `https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
          'User-Agent': 'ltbot-nextapp',
        },
        body: ssml,
      }
    );

    if (!azureResponse.ok) {
      const errorText = await azureResponse.text();
      console.error('Azure TTS 请求失败:', errorText);
      return errorResponse('Azure TTS 请求失败', 500, errorText);
    }

    const audioBuffer = await azureResponse.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('TTS 接口异常:', error);
    return errorResponse('TTS 接口异常', 500, error);
  }
}

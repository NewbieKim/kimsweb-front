export type StoryScriptSegmentType = 'speech' | 'sfx' | 'pause';

export interface StoryScriptSegment {
  type: StoryScriptSegmentType;
  speaker?: string;
  text?: string;
  pauseMs?: number;
}

const TAGGED_LINE_REGEX = /^\[([^\]]+)\]\s*(.*)$/; // 标签行正则表达式
const PAUSE_LINE_REGEX = /^\[停顿:(\d+(?:\.\d+)?)s\]\s*$/i; // 停顿行正则表达式

export const isTaggedStoryScript = (input: string): boolean => { // 判断是否为标签脚本
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return false;
  }

  const taggedLines = lines.filter((line) => TAGGED_LINE_REGEX.test(line)).length;
  if (taggedLines === 0) {
    return false;
  }

  return taggedLines / lines.length >= 0.4 || lines.some((line) => PAUSE_LINE_REGEX.test(line));
};

export const normalizeModelOutput = (raw: string): string => { // 清除模型输出中的 Markdown 代码块包裹
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:text|markdown)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  return trimmed;
};

export const parseStoryScript = (input: string): StoryScriptSegment[] => { // 将脚本解析为片段数组
  const normalized = normalizeModelOutput(input);
  const lines = normalized.split(/\r?\n/);
  const segments: StoryScriptSegment[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const pauseMatch = line.match(PAUSE_LINE_REGEX);
    if (pauseMatch?.[1]) {
      const seconds = Number(pauseMatch[1]);
      if (!Number.isNaN(seconds) && seconds > 0) {
        segments.push({
          type: 'pause',
          pauseMs: Math.round(seconds * 1000),
        });
      }
      continue;
    }

    const taggedMatch = line.match(TAGGED_LINE_REGEX);
    if (taggedMatch) {
      const tag = taggedMatch[1].trim();
      const text = taggedMatch[2].trim();

      if (tag === '音效') {
        if (text) {
          segments.push({
            type: 'sfx',
            text,
          });
        }
        continue;
      }

      const pauseTagMatch = tag.match(/^停顿:(\d+(?:\.\d+)?)s$/i);
      if (pauseTagMatch?.[1]) {
        const seconds = Number(pauseTagMatch[1]);
        if (!Number.isNaN(seconds) && seconds > 0) {
          segments.push({
            type: 'pause',
            pauseMs: Math.round(seconds * 1000),
          });
        }
        continue;
      }

      if (text) {
        segments.push({
          type: 'speech',
          speaker: tag,
          text,
        });
      }
      continue;
    }

    segments.push({
      type: 'speech',
      speaker: '旁白',
      text: line,
    });
  }

  return segments;
};

export const toDisplayStoryText = (input: string): string => { // 从脚本提取纯展示文本（过滤音效/停顿标签）
  const normalized = normalizeModelOutput(input);
  if (!isTaggedStoryScript(normalized)) {
    return normalized;
  }

  const segments = parseStoryScript(normalized);
  const lines = segments
    .filter((segment) => segment.type === 'speech' && segment.text)
    .map((segment) => segment.text!.trim())
    .filter(Boolean);

  return lines.join('\n\n');
};

export const splitStoryFormats = (raw: string) => { // 一次性产出展示文本 + TTS脚本，供生成入库使用
  const normalized = normalizeModelOutput(raw);
  const isScript = isTaggedStoryScript(normalized);

  return {
    displayText: toDisplayStoryText(normalized),
    ttsScript: isScript ? normalized : null,
    sourceFormat: isScript ? 'script' : 'plain',
  } as const;
};

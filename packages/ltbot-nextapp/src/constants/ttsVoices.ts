export interface VoiceRole {
  id: string;
  name: string;
  emoji: string;
  description: string;
  speechRate: number;
  speechPitch: number;
  azureVoiceName: string;
}

export const TTS_VOICE_ROLES: VoiceRole[] = [
  {
    id: 'mom',
    name: '温柔妈妈',
    emoji: '👩',
    description: '轻柔温暖，适合睡前故事',
    speechRate: 0.85, // 语速
    speechPitch: 1.08, // 音调
    azureVoiceName: 'zh-CN-XiaoxiaoNeural',
  },
  {
    id: 'dad',
    name: '贴心爸爸',
    emoji: '👨',
    description: '沉稳安心，像在床边陪读',
    speechRate: 0.9,
    speechPitch: 0.95,
    azureVoiceName: 'zh-CN-YunyangNeural',
  },
];

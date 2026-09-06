import {
  CHILD_AGE_GROUPS,
  CHILD_AVATARS,
  CHILD_ROLES,
  CHILD_TRAITS,
  PARTNER_PRESETS,
  TONIGHT_MATERIAL_INTENTS,
  findCatalogItem,
} from './catalog';
import type { ChildProfileInput, ChildSnapshot, PartnerValue } from './types';

export type RiskCategory = 'FORMAT' | 'CONTACT' | 'SEXUAL' | 'SELF_HARM' | 'VIOLENCE' | 'MEDICAL';

export class ContentValidationError extends Error {
  constructor(
    message: string,
    readonly field: string,
    readonly category: RiskCategory,
  ) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

const CONTACT_PATTERNS = [
  /(?:1[3-9]\d{9})/,
  /(?:\d[\s-]?){7,}/,
  /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,
  /(?:https?:\/\/|www\.)/i,
  /(?:微信|vx|v信|qq|电话|手机号)\s*[:：]?\s*[\w-]{4,}/i,
];

const RISK_PATTERNS: Array<{ category: Exclude<RiskCategory, 'FORMAT' | 'CONTACT'>; pattern: RegExp }> = [
  { category: 'SEXUAL', pattern: /色情|性侵|强奸|裸照|猥亵|性行为/ },
  { category: 'SELF_HARM', pattern: /自杀|自残|割腕|不想活|结束生命/ },
  { category: 'VIOLENCE', pattern: /杀死|砍死|捅死|虐待|殴打|家暴|绑架|活埋/ },
  { category: 'MEDICAL', pattern: /(?:保证|一定|彻底)(?:治愈|康复)|替代医生|不用看医生|心理诊断/ },
];

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.normalize('NFC').trim();
}

function validateText(value: unknown, field: string, min: number, max: number, required = true): string {
  const text = cleanText(value);
  const length = Array.from(text).length;
  if ((required && length < min) || length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
    throw new ContentValidationError(`请填写 ${min}-${max} 字的内容`, field, 'FORMAT');
  }
  if (!text && !required) return '';
  if (CONTACT_PATTERNS.some((pattern) => pattern.test(text))) {
    throw new ContentValidationError('请勿填写联系方式或网址', field, 'CONTACT');
  }
  const risk = RISK_PATTERNS.find(({ pattern }) => pattern.test(text));
  if (risk) {
    throw new ContentValidationError('这段内容暂不适合放进儿童故事，请改写成日常经历或跳过', field, risk.category);
  }
  return text;
}

export function validateChildProfileInput(raw: unknown): ChildProfileInput {
  if (!raw || typeof raw !== 'object') {
    throw new ContentValidationError('孩子档案格式不正确', 'profile', 'FORMAT');
  }
  const value = raw as Record<string, unknown>;
  const avatarId = cleanText(value.avatarId);
  const ageGroup = cleanText(value.ageGroup);
  const role = cleanText(value.role);
  const traitIds = Array.isArray(value.traitIds)
    ? Array.from(new Set(value.traitIds.filter((item): item is string => typeof item === 'string')))
    : [];
  const partnerRaw = value.partner && typeof value.partner === 'object'
    ? value.partner as Record<string, unknown>
    : {};
  const partnerType = partnerRaw.type === 'custom' ? 'custom' : 'preset';
  const partnerId = cleanText(partnerRaw.id);
  const partnerName = validateText(partnerRaw.name, 'partner.name', 1, 12);
  const partnerEmoji = cleanText(partnerRaw.emoji) || '🌟';

  if (!findCatalogItem(CHILD_AVATARS, avatarId)) {
    throw new ContentValidationError('请选择预设头像', 'avatarId', 'FORMAT');
  }
  if (!findCatalogItem(CHILD_AGE_GROUPS, ageGroup)) {
    throw new ContentValidationError('请选择年龄阶段', 'ageGroup', 'FORMAT');
  }
  if (!findCatalogItem(CHILD_ROLES, role)) {
    throw new ContentValidationError('请选择角色', 'role', 'FORMAT');
  }
  if (traitIds.length < 1 || traitIds.length > 3 || traitIds.some((id) => !findCatalogItem(CHILD_TRAITS, id))) {
    throw new ContentValidationError('请选择 1-3 个性格方向', 'traitIds', 'FORMAT');
  }
  if (partnerType === 'preset') {
    const preset = findCatalogItem(PARTNER_PRESETS, partnerId);
    if (!preset || preset.name !== partnerName) {
      throw new ContentValidationError('请选择有效的预设伙伴', 'partner', 'FORMAT');
    }
  }

  return {
    avatarId,
    nickname: validateText(value.nickname, 'nickname', 1, 12),
    ageGroup,
    role,
    traitIds,
    partner: {
      type: partnerType,
      ...(partnerType === 'preset' ? { id: partnerId } : {}),
      name: partnerName,
      emoji: partnerEmoji,
    },
  };
}

export function resolveChildSnapshot(input: ChildProfileInput): ChildSnapshot {
  const avatar = findCatalogItem(CHILD_AVATARS, input.avatarId)!;
  const age = findCatalogItem(CHILD_AGE_GROUPS, input.ageGroup)!;
  const role = findCatalogItem(CHILD_ROLES, input.role)!;
  const traits = input.traitIds.map((id) => findCatalogItem(CHILD_TRAITS, id)!);
  return {
    ...input,
    avatarEmoji: avatar.emoji,
    ageLabel: age.label,
    roleLabel: role.label,
    traitLabels: traits.map((item) => item.label),
    partnerLabel: `${input.partner.emoji} ${input.partner.name}`,
  };
}

export function validateGrowthTheme(value: unknown) {
  return validateText(value, 'growthTheme', 1, 80);
}

export function validateTonightMaterial(raw: unknown) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') {
    throw new ContentValidationError('今晚小事格式不正确', 'tonightMaterial', 'FORMAT');
  }
  const value = raw as Record<string, unknown>;
  const text = validateText(value.text, 'tonightMaterial.text', 1, 80);
  const intent = cleanText(value.intent);
  if (!findCatalogItem(TONIGHT_MATERIAL_INTENTS, intent)) {
    throw new ContentValidationError('请选择今晚小事类型', 'tonightMaterial.intent', 'FORMAT');
  }
  return { intent, text };
}

export function parsePartner(value: string): PartnerValue {
  return JSON.parse(value) as PartnerValue;
}

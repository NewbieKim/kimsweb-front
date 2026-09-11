export const CHILD_AVATARS = [
  { id: 'girl', emoji: '👧', label: '女孩' },
  { id: 'boy', emoji: '👦', label: '男孩' },
  { id: 'child', emoji: '🧒', label: '小朋友' },
  { id: 'rabbit', emoji: '🐰', label: '小兔子' },
  { id: 'fox', emoji: '🦊', label: '小狐狸' },
  { id: 'custom', emoji: '✨', label: '自定义' },
] as const;

/** 历史档案可能仍保存 bear；仅用于回显与校验兼容，不再出现在选择网格。 */
export const LEGACY_CHILD_AVATARS = [
  { id: 'bear', emoji: '🐻', label: '小熊' },
] as const;

export const CHILD_ROLES = [
  { id: 'boy', emoji: '👦', label: '男孩' },
  { id: 'girl', emoji: '👧', label: '女孩' },
  { id: 'custom', emoji: '✨', label: '自定义' },
] as const;

export function findChildAvatar(id: string) {
  return findCatalogItem(CHILD_AVATARS, id) ?? findCatalogItem(LEGACY_CHILD_AVATARS, id);
}

/** 选择预设头像时同步角色：性别头像跟性别，其余默认自定义。 */
export function defaultRoleForAvatar(avatarId: string): (typeof CHILD_ROLES)[number]['id'] {
  if (avatarId === 'girl') return 'girl';
  if (avatarId === 'boy') return 'boy';
  return 'custom';
}

export function resolveRoleLabel(role: string) {
  return findCatalogItem(CHILD_ROLES, role)?.label ?? role;
}

export const CHILD_TRAITS = [
  { id: 'brave', emoji: '🦁', label: '勇敢牛牛' },
  { id: 'curious', emoji: '🔍', label: '好奇宝宝' },
  { id: 'resilient', emoji: '🐰', label: '坚韧小战士' },
  { id: 'warm', emoji: '🤎', label: '温暖小棉袄' },
  { id: 'confident', emoji: '🌟', label: '自信小明星' },
  { id: 'kind', emoji: '🤝', label: '友善好伙伴' },
  { id: 'patient', emoji: '🌱', label: '耐心小园丁' },
  { id: 'optimistic', emoji: '☀️', label: '乐观小太阳' },
] as const;

export const CHILD_AGE_GROUPS = [
  { id: '0-2', label: '0-2岁', detail: '用柔和的声音和重复音节，给宝宝熟悉的安全感。' },
  { id: '2-4', label: '2-4岁', detail: '从具体的生活小事出发，用简单、重复的情节陪伴。' },
  { id: '4-6', label: '4-6岁', detail: '展开想象与轻冒险，在温柔的结尾慢慢安静下来。' },
  { id: '6-8', label: '6-8岁', detail: '在合作、表达和探索中成长，保留被陪伴的时刻。' },
] as const;

export const PARTNER_PRESETS = [
  { id: 'cat', emoji: '🐱', name: '小猫' },
  { id: 'dog', emoji: '🐶', name: '小狗' },
  { id: 'rabbit', emoji: '🐰', name: '小兔子' },
  { id: 'barbie', emoji: '👸', name: '芭比娃娃' },
  { id: 'superhero', emoji: '🦸', name: '奥特曼' },
] as const;

export const TONIGHT_MATERIAL_INTENTS = [
  { id: 'today_event', label: '今天发生的事' },
  { id: 'tonight_concern', label: '今晚想解决的事' },
  { id: 'recent_favorite', label: '最近喜欢的东西' },
] as const;

export type AgeGroupId = (typeof CHILD_AGE_GROUPS)[number]['id'];

export {
  ACTIVE_SCENE_CARDS as DREAM_WORLDS,
  SCENE_CATALOG_VERSION,
  SCENE_CATEGORIES,
  SCENE_CARDS,
  findScene,
  getScenesByCategory,
} from './scene-catalog';

export type {
  SceneCardDefinition as DreamWorldDefinition,
  SceneCardDefinition,
  SceneCategoryDefinition,
} from './scene-catalog';

export function findCatalogItem<T extends { id: string }>(items: readonly T[], id: string) {
  return items.find((item) => item.id === id);
}

export const PET_CATALOG_VERSION = 1;

export const PET_CATALOG = [
  { petKey: 'cat', name: '小猫', personalityKey: 'observant', personality: '爱观察，总能发现温柔的小线索' },
  { petKey: 'dog', name: '小狗', personalityKey: 'reliable', personality: '热情可靠，喜欢陪朋友一起完成目标' },
  { petKey: 'rabbit', name: '小兔子', personalityKey: 'gentle', personality: '温柔敏捷，善于安静地鼓励朋友' },
  { petKey: 'hamster', name: '小仓鼠', personalityKey: 'collector', personality: '小心收藏美好，记得每件开心的小事' },
  { petKey: 'guinea_pig', name: '豚鼠', personalityKey: 'curious', personality: '安静好奇，愿意尝试新的发现' },
  { petKey: 'chinchilla', name: '龙猫', personalityKey: 'careful', personality: '谨慎细腻，关心朋友的感受' },
  { petKey: 'alpaca', name: '羊驼', personalityKey: 'guide', personality: '慢悠悠的向导，总能带大家找到方向' },
  { petKey: 'mini_pig', name: '小香猪', personalityKey: 'scent', personality: '喜欢寻找有趣气味，乐于分享发现' },
  { petKey: 'goat', name: '小山羊', personalityKey: 'brave', personality: '勇敢但不莽撞，遇事先想办法' },
  { petKey: 'sheep', name: '小绵羊', personalityKey: 'kind', personality: '柔软体贴，总愿意帮助朋友' },
  { petKey: 'pony', name: '小马', personalityKey: 'steady', personality: '稳稳前行，陪朋友慢慢探索' },
  { petKey: 'duck', name: '小鸭子', personalityKey: 'social', personality: '爱结伴探索，让每个人都能加入' },
] as const;

export type PetKey = (typeof PET_CATALOG)[number]['petKey'];

export function findPetDefinition(key: string) {
  return PET_CATALOG.find((item) => item.petKey === key);
}

export function petSpriteUrl(key: string, version = PET_CATALOG_VERSION) {
  return `/habits/pets/v${version}/${key}.png`;
}

export type FoodEducation = {
  nutrients: string[];
  benefit: string;
};

export const FOOD_EDUCATION: Record<string, FoodEducation> = {
  rice: {
    nutrients: ['碳水化合物', '维生素 B 族'],
    benefit: '为大脑和身体补充能量，帮助我们有力气学习、运动和玩耍。',
  },
  oats: {
    nutrients: ['膳食纤维', '碳水化合物', '维生素 B 族'],
    benefit: '提供比较持久的能量，膳食纤维也能帮助肠道顺畅工作。',
  },
  sweet_potato: {
    nutrients: ['β-胡萝卜素', '膳食纤维', '碳水化合物'],
    benefit: '补充能量，也有助于保护眼睛、皮肤和维持良好消化。',
  },
  egg: {
    nutrients: ['优质蛋白质', '胆碱', '维生素 B 族'],
    benefit: '为肌肉和身体生长提供材料，胆碱也有助于大脑正常发育。',
  },
  milk: {
    nutrients: ['钙', '优质蛋白质', '维生素 B2'],
    benefit: '帮助骨骼和牙齿健康成长，也为身体发育补充蛋白质。',
  },
  tofu: {
    nutrients: ['植物蛋白', '钙', '铁'],
    benefit: '为身体生长提供植物蛋白，并帮助骨骼和血液保持健康。',
  },
  fish: {
    nutrients: ['优质蛋白质', 'Omega-3 脂肪酸', '维生素 D'],
    benefit: '帮助肌肉生长，部分鱼类中的 Omega-3 也有助于大脑和眼睛发育。',
  },
  lean_meat: {
    nutrients: ['优质蛋白质', '铁', '锌'],
    benefit: '帮助肌肉生长和血液运送氧气，锌也支持身体正常发育。',
  },
  broccoli: {
    nutrients: ['维生素 C', '维生素 K', '叶酸', '膳食纤维'],
    benefit: '帮助身体保持活力，支持骨骼健康，也能帮助肠道顺畅工作。',
  },
  carrot: {
    nutrients: ['β-胡萝卜素', '膳食纤维', '钾'],
    benefit: '身体会把 β-胡萝卜素变成维生素 A，帮助眼睛和皮肤保持健康。',
  },
  orange: {
    nutrients: ['维生素 C', '膳食纤维', '叶酸', '水分'],
    benefit: '帮助身体正常防护、促进铁的吸收，还能补充清爽水分。',
  },
  water: {
    nutrients: ['水分'],
    benefit: '帮助调节体温、运送营养，让大脑和身体保持清醒与活力。',
  },
};

const FALLBACK_EDUCATION: FoodEducation = {
  nutrients: ['多样营养'],
  benefit: '和不同种类的食物做朋友，能帮助身体获得更丰富的营养。',
};

export function getFoodEducation(cardKey: string) {
  return FOOD_EDUCATION[cardKey] || FALLBACK_EDUCATION;
}

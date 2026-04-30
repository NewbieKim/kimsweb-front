'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/button';
import { cn } from '@heroui/theme';

interface DreamPlaceProps {
  ageGroup?: string;
  userSelection?: (data: { fieldName: string; fieldValue: string }) => void;
  onChange?: (value: DreamWorldCard) => void;
  onPrev?: () => void;
}

interface DreamWorldCard {
  cardId: string;
  cardName: string;
  coverImage: string;
  briefDescription: string;
  settings: Record<'0-2' | '2-4' | '4-6' | '6-8', string>;
  storySkeletons: Record<'0-2' | '2-4' | '4-6' | '6-8', string>;
  skeletonFeatures: {
    coreAtmosphere: string;
    emotionalArc: string;
    maxCharacters: Record<'0-2' | '2-4' | '4-6' | '6-8', number>;
    worldView: string;
    rolePrototypes: string[];
    ageAdaptationRules: Record<'0-2' | '2-4' | '4-6' | '6-8', string>;
    safetyGuideline: string;
  };
}

const DREAM_WORLD_LIBRARY: DreamWorldCard[] = [
  {
    cardId: 'ocean_bubble_city',
    cardName: '海底泡泡城',
    coverImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?auto=format&fit=crop&w=900&q=80',
    briefDescription: '和章鱼公交一起，去送一封发光的信。',
    settings: {
      '0-2': '一个被柔和蓝光包裹的水下摇篮，透明泡泡轻轻飘动，远处有鲸鱼哼唱的声音。',
      '2-4': '巨大的透明管道连接着会发光的泡泡房子，章鱼公交车在珊瑚站台停下，小丑鱼在窗外招手。',
      '4-6': '一座建在海底缓坡上的发光城市，有水晶穹顶的宫殿、海胆形状的摩天轮，和会说话的海蛇有轨电车。',
      '6-8': '繁荣的海底社区，泡泡城有各种功能区：海马邮局、水母剧院、鲸歌图书馆，还有正在修复的远古沉船遗迹。',
    },
    storySkeletons: {
      '0-2': '在温暖的蓝色水里，宝宝听到妈妈的心跳声。小鱼游过来蹭蹭宝宝的手，说“睡吧，睡吧”。海水轻轻摇，泡泡慢慢升，宝宝的眼睛闭上了。',
      '2-4': '宝宝乘坐章鱼公交车，遇到一只走丢的小丑鱼。宝宝帮它找妈妈，问了海星、海龟，最后在珊瑚里找到了妈妈。宝宝开心地回到泡泡房间，躺在海藻床上。',
      '4-6': '宝宝收到深海神秘包裹，寄件人写着“潮汐老人”。和小海豚沿发光水母路灯穿过海带森林，在沉船里找到收藏月光的老海龟，完成任务后带着发光鳞片回家。',
      '6-8': '泡泡城选举“一日海洋守护者”，宝宝完成送信、调查珊瑚变白、设计友好巡游路线三项任务。全城亮灯致谢，宝宝带着成就感回到海底小屋。',
    },
    skeletonFeatures: {
      coreAtmosphere: '被水波包裹的安全感，所有声音都像从远处传来。',
      emotionalArc: '从好奇到安心，结尾回归温柔的漂浮感。',
      maxCharacters: { '0-2': 2, '2-4': 4, '4-6': 5, '6-8': 6 },
      worldView: '海洋是有温度的城市，每一种生物都在协作，规则温和、秩序清晰。',
      rolePrototypes: ['章鱼公交司机', '小丑鱼向导', '月光收藏家老海龟', '海马邮递员'],
      ageAdaptationRules: {
        '0-2': '以节律重复和拟声词为主，事件极简，重点给到安全感。',
        '2-4': '突出具体任务和帮助行为，线性推进，避免复杂反转。',
        '4-6': '加入想象任务和轻冒险，结尾必须温柔收束。',
        '6-8': '加入责任与协作议题，可有多目标任务和简单推理。',
      },
      safetyGuideline: '避免惊吓性海怪描写，冲突规模小，结尾固定回到安心入睡场景。',
    },
  },
  {
    cardId: 'grandma_magic_garden',
    cardName: '外婆的魔法菜园',
    coverImage: 'https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?auto=format&fit=crop&w=900&q=80',
    briefDescription: '和会说话的豆荚，一起种下会发光的晚安种子。',
    settings: {
      '0-2': '黄昏的菜园暖暖的，风吹叶子沙沙响，南瓜灯像小月亮。',
      '2-4': '豆藤搭成拱门，萝卜会眨眼，番茄像红灯笼，外婆在花径尽头招手。',
      '4-6': '菜园里有四季轮转的小温室，昆虫邮差在叶脉桥上送信。',
      '6-8': '菜园是村庄食材实验站，孩子可参与配方、分工、照料与共享。',
    },
    storySkeletons: {
      '0-2': '宝宝牵着外婆的手走进菜园，听见“沙沙、沙沙”的晚风歌。小南瓜灯一闪一闪，宝宝靠在外婆怀里，慢慢睡着。',
      '2-4': '宝宝帮会说话的豆荚找回丢失的种子，沿着叶子小路一路问路，最后在草帽里找到。外婆奖励一碗香香汤。',
      '4-6': '菜园突然少了一种颜色，宝宝和萤火虫去温室寻找“晨光花粉”，修复彩虹花墙后，菜园再次亮起。',
      '6-8': '宝宝担任“今日小园长”，安排浇水、采收和分配任务，学会公平与合作，夜里写下菜园日志后安心入睡。',
    },
    skeletonFeatures: {
      coreAtmosphere: '泥土和植物气味带来的踏实感，像被家人照看。',
      emotionalArc: '从探索到收获，最终回归被爱包裹的平静。',
      maxCharacters: { '0-2': 2, '2-4': 4, '4-6': 5, '6-8': 6 },
      worldView: '植物会回应善意，劳动与照料可以创造温柔奇迹。',
      rolePrototypes: ['外婆园丁', '豆荚小精灵', '萤火虫巡夜员', '蜜蜂调香师'],
      ageAdaptationRules: {
        '0-2': '强调听觉、触觉和拥抱动作，减少对白密度。',
        '2-4': '任务目标单一明确，强化“帮忙—成功—被夸奖”的闭环。',
        '4-6': '可加入拟人植物和轻谜题，保留可视化线索。',
        '6-8': '加入合作分工与责任感议题，鼓励表达与复盘。',
      },
      safetyGuideline: '冲突仅限轻度迷路或物品丢失，不设置危险追逐。',
    },
  },
  {
    cardId: 'cloud_bakery',
    cardName: '云朵面包房',
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
    briefDescription: '坐上云车，把一枚热乎乎的月亮面包送到窗边。',
    settings: {
      '0-2': '软软云层像被子，空气里有淡淡奶香，钟声慢慢响。',
      '2-4': '彩虹烤箱会唱歌，面团精灵在面粉星星里翻滚。',
      '4-6': '天空街区有邮差滑索和棉花糖桥，夜空订单不断。',
      '6-8': '云端工坊分区协作：烘焙、配送、装饰与顾客反馈。',
    },
    storySkeletons: {
      '0-2': '宝宝躺在软云床上，听着“叮当”烤箱声，闻到甜甜香气。月亮面包出炉，灯光暖暖，宝宝打了个哈欠。',
      '2-4': '宝宝和面团精灵一起做星星饼干，途中掉了一颗糖珠，大家一起找回，最后把饼干送给云端小猫。',
      '4-6': '云朵面包房接到“午夜紧急订单”，宝宝和伙伴穿过风铃街按时送达，得到“勇气小围裙”奖励。',
      '6-8': '宝宝担任夜班小队长，协调配方、路线和时间，学会在压力下合作，任务结束后看着星空慢慢放松。',
    },
    skeletonFeatures: {
      coreAtmosphere: '温暖烘焙气息与柔软触感，形成稳定安抚体验。',
      emotionalArc: '从期待到完成，再到满足和放松。',
      maxCharacters: { '0-2': 2, '2-4': 4, '4-6': 5, '6-8': 6 },
      worldView: '每份食物都承载关心，团队合作让温暖被传递。',
      rolePrototypes: ['云车驾驶员', '面团精灵', '配方师猫头鹰', '夜班配送员'],
      ageAdaptationRules: {
        '0-2': '强调节律与嗅觉联想，短句重复。',
        '2-4': '突出制作流程和简单求助，减少分支。',
        '4-6': '加入时间任务和轻挑战，确保结果可预期。',
        '6-8': '加入协作与责任分配，保留温暖结尾。',
      },
      safetyGuideline: '避免火焰危险细节，烘焙过程拟人化、低风险呈现。',
    },
  },
  {
    cardId: 'dino_express_station',
    cardName: '恐龙快递站',
    coverImage: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=900&q=80',
    briefDescription: '骑着小翼龙，把一份晚安包裹送到山谷尽头。',
    settings: {
      '0-2': '温顺的小恐龙在月光草地慢慢走，脚步像摇篮节拍。',
      '2-4': '快递站像大树屋，滑索把包裹送到蘑菇站台。',
      '4-6': '山谷里有路线牌和风向塔，翼龙负责空中导航。',
      '6-8': '快递系统有调度中心、路线规划和社区服务任务。',
    },
    storySkeletons: {
      '0-2': '小恐龙“咚、咚”慢慢走，宝宝坐在软软车里听着节奏。风轻轻吹，星星眨眼，宝宝在摇晃中睡着。',
      '2-4': '宝宝帮快递员送一件“发光围巾”，途中路线牌被风吹歪，宝宝扶好后顺利送达。',
      '4-6': '宝宝接到三段式配送任务：取件、识别路线、准时投递，在伙伴协助下完成并获得勇气徽章。',
      '6-8': '快递站遭遇暴风改线，宝宝参与制定替代路线并兼顾幼小恐龙休息区，学会效率与关怀并重。',
    },
    skeletonFeatures: {
      coreAtmosphere: '有节奏的移动和明确路线带来秩序安全感。',
      emotionalArc: '从任务紧张到顺利完成，回落到平静满足。',
      maxCharacters: { '0-2': 2, '2-4': 4, '4-6': 5, '6-8': 6 },
      worldView: '远古生物与现代服务协作共存，规则明确、互助友好。',
      rolePrototypes: ['翼龙导航员', '腕龙装卸员', '路线管理员', '包裹修复师'],
      ageAdaptationRules: {
        '0-2': '强调节拍和重复拟声，剧情单线推进。',
        '2-4': '聚焦“送达”目标，加入简短求助环节。',
        '4-6': '加入路径选择和小挑战，但每步有提示。',
        '6-8': '加入多目标协作与责任权衡，突出成长。',
      },
      safetyGuideline: '恐龙均设定为温和伙伴，不出现捕食或惊吓场景。',
    },
  },
];

const ageGroupToKey = (ageGroup?: string): '0-2' | '2-4' | '4-6' | '6-8' => {
  if (!ageGroup) return '2-4';
  if (ageGroup.includes('0-2')) return '0-2';
  if (ageGroup.includes('2-4')) return '2-4';
  if (ageGroup.includes('4-6')) return '4-6';
  return '6-8';
};

export default function DreamPlace({ ageGroup, userSelection, onChange, onPrev }: DreamPlaceProps) {
  const [selectedCardId, setSelectedCardId] = useState<string>(DREAM_WORLD_LIBRARY[0].cardId);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const ageKey = useMemo(() => ageGroupToKey(ageGroup), [ageGroup]);
  const selectedCard = useMemo(
    () => DREAM_WORLD_LIBRARY.find((item) => item.cardId === selectedCardId) ?? DREAM_WORLD_LIBRARY[0],
    [selectedCardId],
  );

  useEffect(() => {
    onChange?.(selectedCard);
    userSelection?.({ fieldName: 'dreamPlaceCardId', fieldValue: selectedCard.cardId });
    userSelection?.({ fieldName: 'dreamPlace', fieldValue: selectedCard.cardName });
    userSelection?.({
      fieldName: 'dreamPlaceConfig',
      fieldValue: JSON.stringify(selectedCard),
    });
  }, [selectedCard, onChange, userSelection]);

  const scrollToCard = (cardId: string) => {
    const target = cardRefs.current[cardId];
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const onClickCard = (cardId: string) => {
    setSelectedCardId(cardId);
    scrollToCard(cardId);
  };

  const onScrollBy = (offset: number) => {
    scrollRef.current?.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section className="w-full rounded-3xl border border-primary-100 bg-white p-4 shadow-sm md:p-6">
      <header className="mb-4">
        {/* <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary-400">2 故事世界</p>
          {onPrev ? (
            <button
              type="button"
              onClick={onPrev}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-100 bg-white text-lg text-primary-700 shadow-sm"
              aria-label="返回上一步"
            >
              ‹
            </button>
          ) : null}
        </div> */}
        <h2 className="text-3xl font-extrabold text-primary-700">今晚去哪里做梦？</h2>
      </header>

      <div className="relative">
        <Button
          isIconOnly
          size="sm"
          radius="full"
          variant="flat"
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 bg-white/90 text-primary-700 shadow"
          onPress={() => onScrollBy(-280)}
        >
          ←
        </Button>
        <Button
          isIconOnly
          size="sm"
          radius="full"
          variant="flat"
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 bg-white/90 text-primary-700 shadow"
          onPress={() => onScrollBy(280)}
        >
          →
        </Button>

        <div
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-8 pb-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {DREAM_WORLD_LIBRARY.map((card) => {
            const selected = selectedCardId === card.cardId;
            return (
              <button
                key={card.cardId}
                ref={(node) => {
                  cardRefs.current[card.cardId] = node;
                }}
                type="button"
                onClick={() => onClickCard(card.cardId)}
                className={cn(
                  'relative snap-center shrink-0 overflow-hidden rounded-[28px] border text-left transition-all duration-300',
                  selected
                    ? 'h-[300px] w-[250px] scale-[1.02] border-primary-400 shadow-[0_0_0_3px_rgba(99,102,241,0.2),0_14px_30px_rgba(99,102,241,0.25)]'
                    : 'h-[280px] w-[220px] border-primary-100 opacity-85',
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.coverImage} alt={card.cardName} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/70 via-primary-700/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-3xl leading-none drop-shadow-sm">{selected ? '✨' : '🌙'}</p>
                  <p className="mt-2 text-3xl font-extrabold tracking-wide text-white drop-shadow-sm">
                    {card.cardName}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-primary-50 px-4 py-3">
        <p className="text-sm font-semibold text-primary-700">
          {selectedCard.cardName}：{selectedCard.briefDescription}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-primary-600">
          分龄提示（{ageKey}）：{selectedCard.settings[ageKey]}
        </p>
      </div>
    </section>
  );
}

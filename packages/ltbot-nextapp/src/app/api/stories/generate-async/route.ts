import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
} from '@/lib/response';
import { splitStoryFormats } from '@/lib/tts/storyScript';

/**
 * POST /api/stories/generate-async
 * 触发异步生成故事内容
 * 立即返回 202 Accepted，后台处理生成任务
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storyId, formData } = body;

    if (!storyId) {
      return errorResponse('故事ID为必填项', 400);
    }

    if (!formData) {
      return errorResponse('表单数据为必填项', 400);
    }

    // 验证故事是否存在
    const story = await prisma.story.findUnique({
      where: { id: parseInt(storyId) },
    });

    if (!story) {
      return errorResponse('故事不存在', 404);
    }

    // 在后台异步执行生成任务（不阻塞响应）
    generateStoryInBackground(parseInt(storyId), formData)
      .catch(err => {
        console.error('后台生成故事失败:', err);
      });

    // 立即返回，不等待生成完成
    return new Response(
      JSON.stringify({
        success: true,
        message: '故事生成任务已启动',
        data: { storyId },
      }),
      {
        status: 202, // 202 Accepted
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('启动异步生成任务时出错:', error);
    return errorResponse('启动生成任务失败', 500, error);
  }
}

/**
 * 在后台生成故事内容
 */
async function generateStoryInBackground(storyId: number, formData: any) {
  try {
    console.log(`[Story ${storyId}] 开始生成故事内容...`);

    // 1. 更新状态为 generating
    await updateStoryStatus(storyId, 'generating');

    // 2. 生成 prompt
    const prompt = generatePromptV2(formData);
    console.log(`[Story ${storyId}] 生成的 prompt:`, prompt);

    // 3. 调用 DeepSeek API 生成故事内容（带重试）
    const rawContent = await callAIWithRetry(prompt, 3);
    console.log(`[Story ${storyId}] 原始故事内容生成成功，长度: ${rawContent.length}`);

    const { displayText, ttsScript, sourceFormat } = splitStoryFormats(rawContent);
    console.log(
      `[Story ${storyId}] 文本格式识别结果: ${sourceFormat}, 展示文本长度: ${displayText.length}, 脚本长度: ${ttsScript?.length || 0}`
    );

    // 4. 获取当前的 extData
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { extData: true },
    });

    let extData: any = {};
    if (story?.extData) {
      try {
        extData = JSON.parse(story.extData);
      } catch (e) {
        console.error('解析 extData 失败:', e);
      }
    }

    // 5. 更新故事内容和状态
    await prisma.story.update({
      where: { id: storyId },
      data: {
        content: displayText,
        extData: JSON.stringify({
          ...extData,
          generationStatus: 'completed',
          generationCompletedAt: new Date().toISOString(),
          contentFormat: 'plain',
          ttsFormat: ttsScript ? 'script' : 'plain',
          ttsScript,
        }),
      },
    });

    console.log(`[Story ${storyId}] 故事生成完成！`);
  } catch (error: any) {
    console.error(`[Story ${storyId}] 故事生成失败:`, error);

    // 更新状态为 failed
    await updateStoryStatus(storyId, 'failed', error.message);
  }
}

/**
 * 更新故事生成状态
 */
async function updateStoryStatus(
  storyId: number,
  status: 'pending' | 'generating' | 'completed' | 'failed',
  errorMessage?: string
) {
  try {
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { extData: true },
    });

    let extData: any = {};
    if (story?.extData) {
      try {
        extData = JSON.parse(story.extData);
      } catch (e) {
        console.error('解析 extData 失败:', e);
      }
    }

    extData.generationStatus = status;
    if (errorMessage) {
      extData.generationError = errorMessage;
    }
    if (status === 'generating') {
      extData.generationStartedAt = new Date().toISOString();
    }

    await prisma.story.update({
      where: { id: storyId },
      data: {
        extData: JSON.stringify(extData),
      },
    });

    console.log(`[Story ${storyId}] 状态已更新为: ${status}`);
  } catch (error) {
    console.error(`[Story ${storyId}] 更新状态失败:`, error);
  }
}

/**
 * 调用 DeepSeek API 生成故事内容（带重试机制）
 */
async function callAIWithRetry(prompt: string, maxRetries: number = 3): Promise<string> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试调用 DeepSeek API (第 ${attempt}/${maxRetries} 次)...`);
      const content = await callDeepSeekAPI(prompt);
      return content;
    } catch (error: any) {
      lastError = error;
      console.error(`第 ${attempt} 次调用失败:`, error.message);

      if (attempt < maxRetries) {
        // 指数退避：2秒、4秒、8秒
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`等待 ${delay}ms 后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`调用 DeepSeek API 失败，已重试 ${maxRetries} 次: ${lastError.message}`);
}

/**
 * 调用 DeepSeek API
 */
async function callDeepSeekAPI(prompt: string): Promise<string> {
  // 获取环境变量失败
  const DEEPSEEK_CONFIG = {
    apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions',
    apiKey: process.env.DEEPSEEK_API_KEY || 'sk-591250370fc54f6e82b9d98af991a975',
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    maxTokens: 2000,
    temperature: 0.7,
    topP: 0.9,
  };

  console.log('DEEPSEEK_CONFIG', DEEPSEEK_CONFIG, process.env);

  if (!DEEPSEEK_CONFIG.apiKey) {
    throw new Error('DEEPSEEK_API_KEY 未配置');
  }

  const messages = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  const requestBody = {
    model: DEEPSEEK_CONFIG.model,
    messages,
    max_tokens: DEEPSEEK_CONFIG.maxTokens,
    temperature: DEEPSEEK_CONFIG.temperature,
    top_p: DEEPSEEK_CONFIG.topP,
    stream: false,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  try {
    const response = await fetch(DEEPSEEK_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `DeepSeek API Error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'DeepSeek API 返回错误');
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('DeepSeek API 返回格式错误');
    }

    return data.choices[0].message.content || '';
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('DeepSeek API 调用超时（60秒）');
    }

    throw error;
  }
}

/**
 * 生成 prompt
 */
function generatePrompt(formData: any): string {
  const theme =
    formData.storySubjectType === 'classic'
      ? `主题是${formData.storySubject}${formData.storyChildSubject ? '，故事子主题是' + formData.storyChildSubject : ''}`
      : formData.customStorySubject;

  const frontTip =
    '你是一个经验丰富的儿童故事作家，擅长根据用户的需求创作生动有趣的故事。请根据以下要求生成故事：';

  return `${frontTip}\n1. 年龄组：${formData.ageGroup}\n2. 故事主题：${theme}\n3. 人物设定：${formData.characterSetting}\n4. 字数限制：${formData.wordCountLimit}\n5. 按照文字自动划分段落，每段落不超过100字\n\n请直接输出故事内容，不要包含任何额外的说明文字。`;
}

/**
 * 生成 prompt V2版本
 *
 */
interface StoryConfig {
  ageGroup: '0-2' | '2-4' | '4-6' | '6-8';
  childName: string;
  characters: {
    main: { name: string; trait: string };
    partners: { name: string; type: string; trait: string }[];
  };
  worldConfig: {
    worldName: string;
    coreRule: string;
    emotionCurve: string;
    characterFunctions: string;
    ageAdaptRules: string;
  };
  growthTheme: string;
  flavorTags: string[];
  emotionTone: 'calm' | 'gentle' | 'warm' | 'playful';
  progressiveWindDown: boolean;
  parentGoodnight: string;
}

const AGE_CONSTRAINTS: Record<
  StoryConfig['ageGroup'],
  {
    vocabularyLevel: string;
    sentenceStructure: string;
    plotComplexity: string;
    forbiddenContent: string;
    lengthRange: string;
  }
> = {
  '0-2': {
    vocabularyLevel: '高频生活词+拟声词，避免抽象词。',
    sentenceStructure: '短句，重复句式，单句建议不超过12字。',
    plotComplexity: '单线感官情境，无任务链，无反转。',
    forbiddenContent: '惊吓、冲突、离散分离、复杂因果、角色过多。',
    lengthRange: '180-280字',
  },
  '2-4': {
    vocabularyLevel: '具象名词+简单动词，可少量情绪词。',
    sentenceStructure: '短句为主，少量并列句，单句建议不超过16字。',
    plotComplexity: '一个小目标+一次求助+温和解决。',
    forbiddenContent: '危险追逐、惩罚叙事、抽象说教、复杂时间跳跃。',
    lengthRange: '280-420字',
  },
  '4-6': {
    vocabularyLevel: '可加入想象词汇和基础因果连接词。',
    sentenceStructure: '长短句搭配，段落节奏清晰。',
    plotComplexity: '单主线冒险，可含轻谜题和一次转折。',
    forbiddenContent: '强恐惧、强对抗、价值羞辱、信息过载。',
    lengthRange: '420-650字',
  },
  '6-8': {
    vocabularyLevel: '可用更丰富词汇，但保持口语可听性。',
    sentenceStructure: '允许复句与层次递进，避免过度文学化。',
    plotComplexity: '多步骤任务，强调合作与责任，结尾回归安稳。',
    forbiddenContent: '血腥暴力、高压竞争、道德审判式表达。',
    lengthRange: '650-900字',
  },
};

function safeParseJSON<T = any>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toAgeKey(ageGroupRaw: string | undefined): StoryConfig['ageGroup'] {
  const ageGroup = ageGroupRaw || '';
  if (ageGroup.includes('0-2')) return '0-2';
  if (ageGroup.includes('2-4')) return '2-4';
  if (ageGroup.includes('4-6')) return '4-6';
  return '6-8';
}

function buildStoryConfigFromFormData(formData: any): StoryConfig {
  const ageGroup = toAgeKey(formData?.ageGroup);
  const characterAndPartner = safeParseJSON<any>(formData?.characterAndPartner, {});
  const dreamPlaceConfig = safeParseJSON<any>(formData?.dreamPlaceConfig, {});
  const todaySubjectConfig = safeParseJSON<any>(formData?.todaySubjectConfig, {});

  const childName = characterAndPartner?.nickname || '小宝贝';
  const mainTrait = Array.isArray(characterAndPartner?.traits) && characterAndPartner.traits.length > 0
    ? String(characterAndPartner.traits[0])
    : '温柔';

  const partnerName = characterAndPartner?.partner || '小伙伴';
  const worldName = dreamPlaceConfig?.cardName || formData?.dreamPlace || '奇妙梦境';

  const ageAdaptSettings =
    dreamPlaceConfig?.settings?.[ageGroup] ||
    '根据该年龄段的认知与情绪特点，使用可理解、可代入、低刺激的表达。';

  const ageSkeleton =
    dreamPlaceConfig?.storySkeletons?.[ageGroup] ||
    '主角在温柔环境中完成一个小任务，最后回到安心入睡状态。';

  const storyConfig: StoryConfig = {
    ageGroup,
    childName,
    characters: {
      main: { name: childName, trait: mainTrait },
      partners: [
        {
          name: partnerName,
          type: '伙伴',
          trait: '陪伴型',
        },
      ],
    },
    worldConfig: {
      worldName,
      coreRule:
        dreamPlaceConfig?.skeletonFeatures?.worldView ||
        `在${worldName}中，所有事件都服务于安全感和睡前安抚。`,
      emotionCurve:
        dreamPlaceConfig?.skeletonFeatures?.emotionalArc ||
        '从好奇进入故事，过程温和推进，结尾回到宁静放松。',
      characterFunctions:
        Array.isArray(dreamPlaceConfig?.skeletonFeatures?.rolePrototypes)
          ? dreamPlaceConfig.skeletonFeatures.rolePrototypes.join('、')
          : `${partnerName}（陪伴者）`,
      ageAdaptRules:
        dreamPlaceConfig?.skeletonFeatures?.ageAdaptationRules?.[ageGroup] ||
        `场景参考：${ageAdaptSettings}。建议骨架：${ageSkeleton}`,
    },
    growthTheme:
      todaySubjectConfig?.finalTheme ||
      formData?.customStorySubject ||
      '安心入睡',
    flavorTags: Array.isArray(formData?.flavorTags)
      ? formData.flavorTags
      : typeof formData?.flavorTags === 'string'
        ? formData.flavorTags.split(',').map((item: string) => item.trim()).filter(Boolean)
        : [],
    emotionTone:
      formData?.storyTone === '温柔安抚'
        ? 'gentle'
        : formData?.storyTone === '轻松有趣'
          ? 'playful'
          : formData?.storyTone === '暖心陪伴'
            ? 'warm'
            : 'gentle',
    progressiveWindDown: formData?.progressiveWindDown !== false,
    parentGoodnight: formData?.parentGoodnight || '晚安，宝贝。',
  };

  return storyConfig;
}

function generatePromptV2(formData: any): string {
  const config = buildStoryConfigFromFormData(formData);
  const ageConst = AGE_CONSTRAINTS[config.ageGroup];

  const identity = [
    '你是一位深谙儿童心理的睡眠故事作家。',
    '你的创作不是“写作文”，而是“用声音抚摸孩子的额头”。',
    '你有充分的创作自由。唯一的要求：严格遵循下方的规则。',
  ].join('\n');

  const ageRules = [
    `【年龄硬约束：${config.ageGroup}岁】`,
    `词汇：${ageConst.vocabularyLevel}`,
    `句式：${ageConst.sentenceStructure}`,
    `情节：${ageConst.plotComplexity}`,
    `禁止：${ageConst.forbiddenContent}`,
    `字数：${ageConst.lengthRange}`,
  ].join('\n');

  const worldInjection = [
    `【世界设定：${config.worldConfig.worldName}】`,
    `世界观：${config.worldConfig.coreRule}`,
    `情绪走向：${config.worldConfig.emotionCurve}`,
    `可选角色原型：${config.worldConfig.characterFunctions}`,
    `分龄适配：${config.worldConfig.ageAdaptRules}`,
  ].join('\n');

  const creativeConstraints = [
    '【创作约束】',
    '1. 开头：环境先于事件。用2-3句建立空间安全感。',
    '2. 主体：一个可完成的温和目标。主角主动，伙伴协助。',
    '3. 节奏：叙事句与环境静默句交替，比例为3:1。',
    '4. 对话：不超过全文40%，每个角色有独特的说话节奏。',
    '5. 结尾：最后5句递减能量，引导闭眼、放缓呼吸。',
    '6. 禁用启动词：“突然”“快”“小心”“危险”“别怕”。',
    '7. 成长主题必须通过情节暗示，不可直接说教。',
    `8. 本次成长主题：${config.growthTheme}。`,
    config.progressiveWindDown ? '9. 后三分之一段，每句字数递减，描述从外向内收束。' : '',
  ]
    .filter(Boolean)
    .join('\n');

  const partnerText =
    config.characters.partners.length > 0
      ? config.characters.partners.map((p) => `${p.name}(${p.trait}的${p.type})`).join('、')
      : '无';

  const characterRules = [
    '【角色】',
    `主角：${config.characters.main.name}（性格特征：${config.characters.main.trait}）`,
    `伙伴：${partnerText}`,
    `规则：主角被保护、被肯定。伙伴是陪伴者。用名字“${config.childName}”称呼主角，不用“你”。`,
  ].join('\n');

  const flavorRules =
    config.flavorTags.length > 0
      ? [
          '【风味引导】',
          ...config.flavorTags
            .map((tag) => {
              const map: Record<string, string> = {
                小百科彩蛋: '在情节中自然带出1个真实的小知识，不解释，只是角色随口一说。',
                传统智慧: '融入1个传统生活细节，如“食不言寝不语”，以行为呈现。',
                加油打气: '主角需经历一次无害的小失败，然后被鼓励再试。',
                搞笑放松: '1-2处温和幽默。对象是环境或伙伴，不针对主角。',
                魔法满天飞: '增加奇幻细节，但都必须友善、可理解。',
              };
              return map[tag] || '';
            })
            .filter(Boolean),
        ].join('\n')
      : '';

  const toneMap: Record<StoryConfig['emotionTone'], string> = {
    calm: '耳语强度。句子像轻拍。',
    gentle: '溪流般的柔和节奏。',
    warm: '包裹感的温暖。',
    playful: '允许微笑，但不允许兴奋。',
  };

  const emotionRules = [
    `【语气】：${toneMap[config.emotionTone]}`,
    config.emotionTone === 'playful' && ['2-4', '4-6', '6-8'].includes(config.ageGroup)
      ? '允许1处互动停顿，格式：【互动：等待4秒】'
      : '无互动。纯叙述。',
  ].join('\n');

  const outputFormat = [
    '【输出格式】',
    '使用以下标记：',
    '[旁白] 环境与叙述',
    '[角色名] 对话',
    '[音效] 环境音提示',
    '[停顿:Xs] 静默',
    '故事末：',
    `[妈妈/爸爸的声音] ${config.parentGoodnight || '晚安，宝贝。'}`,
    '[停顿:4s]',
    '[音效] 白噪音渐入',
    '',
    '直接输出脚本。不解释。',
  ].join('\n');

  return [
    identity,
    '---',
    ageRules,
    '---',
    worldInjection,
    '---',
    creativeConstraints,
    '---',
    characterRules,
    flavorRules,
    emotionRules,
    '---',
    outputFormat,
  ]
    .filter(Boolean)
    .join('\n\n');
}
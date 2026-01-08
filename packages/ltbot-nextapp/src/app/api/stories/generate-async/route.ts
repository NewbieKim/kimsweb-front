import { prisma } from '@/lib/prisma';
import {
  successResponse,
  errorResponse,
} from '@/lib/response';

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
    const prompt = generatePrompt(formData);
    console.log(`[Story ${storyId}] 生成的 prompt:`, prompt);

    // 3. 调用 DeepSeek API 生成故事内容（带重试）
    const content = await callAIWithRetry(prompt, 3);
    console.log(`[Story ${storyId}] 故事内容生成成功，长度: ${content.length}`);

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
        content: content,
        extData: JSON.stringify({
          ...extData,
          generationStatus: 'completed',
          generationCompletedAt: new Date().toISOString(),
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


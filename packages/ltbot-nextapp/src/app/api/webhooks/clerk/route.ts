import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/webhooks/clerk
 * Clerk Webhook 处理器
 * 用于在用户注册、更新、删除时自动同步到数据库
 */
export async function POST(req: Request) {
  // 获取 Webhook 密钥
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('请在环境变量中配置 CLERK_WEBHOOK_SECRET');
    return new Response('Webhook secret not configured', { status: 500 });
  }

  // 获取请求头
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // 验证是否有必要的请求头
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('缺少 svix 请求头', { status: 400 });
  }

  // 获取请求体
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // 创建 Svix 实例进行验证
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // 验证 Webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Webhook 验证失败:', err);
    return new Response('Webhook 验证失败', { status: 400 });
  }

  // 处理不同的事件类型
  const eventType = evt.type;
  console.log(`收到 Clerk Webhook 事件: ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        console.log(`未处理的事件类型: ${eventType}`);
    }

    return new Response('Webhook 处理成功', { status: 200 });
  } catch (error) {
    console.error('处理 Webhook 事件失败:', error);
    return new Response('处理失败', { status: 500 });
  }
}

/**
 * 处理用户创建事件
 */
async function handleUserCreated(data: any) {
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address || '';
  const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || '用户';
  const avatar = data.image_url || null;

  console.log('创建新用户:', { userId, email, name });

  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existingUser) {
      console.log('用户已存在，跳过创建');
      return;
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        avatar,
      },
    });

    // 为新用户创建积分记录，赠送初始积分
    await prisma.userScore.create({
      data: {
        userId: user.id,
        balance: 100, // 新用户赠送 100 积分
      },
    });

    // 记录赠送积分交易
    await prisma.scoreTransaction.create({
      data: {
        userId: user.id,
        transactionType: 'SYSTEM_GIFT',
        amount: 100,
        balanceBefore: 0,
        balanceAfter: 100,
        description: '新用户注册赠送积分',
      },
    });

    console.log('用户创建成功，赠送 100 积分');
  } catch (error) {
    console.error('创建用户失败:', error);
    throw error;
  }
}

/**
 * 处理用户更新事件
 */
async function handleUserUpdated(data: any) {
  const userId = data.id;
  const email = data.email_addresses[0]?.email_address || '';
  const name = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.username || '用户';
  const avatar = data.image_url || null;

  console.log('更新用户信息:', { userId, email, name });

  try {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      // 如果用户不存在，则创建（可能是 Webhook 顺序问题）
      console.log('用户不存在，先创建用户');
      await handleUserCreated(data);
      return;
    }

    // 更新用户信息
    await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        avatar,
      },
    });

    console.log('用户信息更新成功');
  } catch (error) {
    console.error('更新用户失败:', error);
    throw error;
  }
}

/**
 * 处理用户删除事件
 */
async function handleUserDeleted(data: any) {
  const userId = data.id;

  console.log('删除用户:', userId);

  try {
    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      console.log('用户不存在，跳过删除');
      return;
    }

    // 注意：由于外键关系，删除用户会级联删除相关数据
    // 包括：故事、音乐、积分交易记录、互动数据等
    // 如果需要保留这些数据，可以考虑软删除（添加 isDeleted 字段）

    await prisma.user.delete({
      where: { id: userId },
    });

    console.log('用户删除成功');
  } catch (error) {
    console.error('删除用户失败:', error);
    throw error;
  }
}


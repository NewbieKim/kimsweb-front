import { isChinaMobile, normalizeChinaPhone } from '@/lib/phone';
import { clerkEmailFromPhone } from '@/lib/phone';
import { buildFakeLoginIdentifier } from '@/lib/username';
import { prisma } from '@/lib/prisma';
import {
  badRequestResponse,
  errorResponse,
  successResponse,
} from '@/lib/response';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    if (!isChinaMobile(phone)) {
      return badRequestResponse('手机号格式错误');
    }

    const normalizedPhone = normalizeChinaPhone(phone);
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { clerkUsername: true },
    });

    if (user?.clerkUsername) {
      return successResponse(
        { kind: 'username', identifier: user.clerkUsername },
        '登录标识查询成功'
      );
    }

    if (user) {
      // 兼容早期“手机号映射邮箱标识”的存量账号
      return successResponse(
        { kind: 'email', identifier: clerkEmailFromPhone(phone) },
        '登录标识查询成功'
      );
    }

    // 未注册手机号返回随机不存在的标识，避免泄露账号是否注册。
    return successResponse(
      { kind: 'username', identifier: buildFakeLoginIdentifier() },
      '登录标识查询成功'
    );
  } catch (error: unknown) {
    console.error('查询登录标识失败:', error);
    return errorResponse('查询登录标识失败', 500);
  }
}

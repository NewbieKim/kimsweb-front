const PHONE_REGEX = /^1[3-9]\d{9}$/;

export function isChinaMobile(phone: string): boolean {
  return PHONE_REGEX.test(phone);
}

// Clerk 手机号要求 E.164 格式，统一转为 +86 开头。
export function normalizeChinaPhone(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+86') && /^\+861[3-9]\d{9}$/.test(trimmed)) {
    return trimmed;
  }
  if (PHONE_REGEX.test(trimmed)) {
    return `+86${trimmed}`;
  }
  return trimmed;
}

export function maskPhone(phone: string): string {
  // 兼容 11 位裸号与 +86 格式
  return phone.replace(/(\d{3})\d{4}(\d{4})$/, '$1****$2');
}

// Clerk 免费版不支持手机号作为登录标识，但支持邮箱+密码。
// 这里把手机号映射成内部邮箱标识，用户界面仍然只展示/输入手机号。
export function clerkEmailFromPhone(phone: string): string {
  const digits = normalizeChinaPhone(phone).replace(/\D/g, '');
  return `${digits}@phone.ltbot.top`;
}

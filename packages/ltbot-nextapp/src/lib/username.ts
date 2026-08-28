// Clerk 只接受 ASCII 用户名；用户展示名用产品特色中文名。
export const DEFAULT_USERNAME_PREFIX = 'anthony_';
export const DEFAULT_DISPLAY_NAME_PREFIX = '爱讲故事的安东尼';

export function generateTempClerkUsername(): string {
  return `${DEFAULT_USERNAME_PREFIX}tmp_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function buildDefaultUsername(userId: string): string {
  return `${DEFAULT_USERNAME_PREFIX}${userId.slice(-6)}`;
}

export function buildDefaultDisplayName(userId: string): string {
  return `${DEFAULT_DISPLAY_NAME_PREFIX}${userId.slice(-6)}`;
}

export function buildFallbackUsername(userId: string): string {
  return `${DEFAULT_USERNAME_PREFIX}${userId.slice(-6)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function buildFakeLoginIdentifier(): string {
  return `${DEFAULT_USERNAME_PREFIX}nouser_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

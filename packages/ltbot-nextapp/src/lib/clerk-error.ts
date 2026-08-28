export function extractClerkError(error: unknown): string {
  const clerkError = error as {
    status?: number;
    message?: string;
    errors?: Array<{ message?: string; longMessage?: string }>;
  };
  const details = (clerkError.errors || [])
    .map((item) => item.longMessage || item.message)
    .filter(Boolean);
  if (details.length > 0) {
    return details.join('；');
  }
  return clerkError.message || '未知错误';
}

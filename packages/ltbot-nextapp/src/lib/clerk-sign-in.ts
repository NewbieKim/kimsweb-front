export async function completeClerkSignIn(
  signIn: unknown,
  identifier: string,
  password: string
): Promise<{ status: string; createdSessionId?: string | null }> {
  const api = signIn as {
    create: (params: {
      identifier: string;
      password: string;
    }) => Promise<{ status: string; createdSessionId?: string | null }>;
    attemptFirstFactor: (params: {
      strategy: 'password';
      password: string;
    }) => Promise<{ status: string; createdSessionId?: string | null }>;
  };
  let result = await api.create({ identifier, password });
  if (result.status === 'needs_first_factor') {
    result = await api.attemptFirstFactor({ strategy: 'password', password });
  }
  if (result.status !== 'complete') {
    throw new Error('登录未完成，请重试');
  }
  return result;
}

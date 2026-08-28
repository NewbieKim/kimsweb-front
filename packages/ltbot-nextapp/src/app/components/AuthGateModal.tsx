'use client';

import { useState } from 'react';
import { useClerk, useSignIn, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import PasswordInput from './PasswordInput';
import { completeClerkSignIn } from '@/lib/clerk-sign-in';

const PHONE_REGEX = /^1[3-9]\d{9}$/;

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AuthGateModal({
  open,
  onOpenChange,
  onSuccess,
}: AuthGateModalProps) {
  const { signIn, isLoaded } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn } = useUser();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (isSignedIn) {
      onSuccess();
      return;
    }

    if (!PHONE_REGEX.test(phone)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    try {
      const lockRes = await fetch('/api/auth/login-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const lockData = await lockRes.json();
      if (lockData?.success && lockData.data?.locked) {
        setError(
          `尝试次数过多，请 ${lockData.data.lockRemainingSeconds} 秒后再试，或使用忘记密码`
        );
        return;
      }
    } catch {
      // 锁定状态查询失败不阻塞登录
    }

    if (!isLoaded || !signIn) {
      setError('登录服务未就绪，请稍后重试');
      return;
    }

    setLoading(true);
    try {
      const idRes = await fetch('/api/auth/login-identifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const idData = await idRes.json();
      const identifier = idData?.data?.identifier;
      if (!identifier) {
        setError('登录服务异常，请稍后重试');
        return;
      }
      const result = await completeClerkSignIn(signIn, identifier, password);
      if (result.createdSessionId) {
        await setActive({ session: result.createdSessionId }).catch(() => undefined);
      }
      await fetch('/api/auth/record-login-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ok: true }),
      }).catch(() => undefined);
      onSuccess();
    } catch (error: unknown) {
      await fetch('/api/auth/record-login-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, ok: false }),
      }).catch(() => undefined);
      const clerkError = error as { errors?: Array<{ message?: string }> };
      setError(clerkError?.errors?.[0]?.message || '手机号或密码错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-6 shadow-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">登录后继续</h2>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full text-lg"
            style={{ color: 'var(--theme-text-muted)' }}
            onClick={() => onOpenChange(false)}
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          新用户注册后首次登录即送 100 积分
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">手机号</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="请输入 11 位手机号"
              className="h-11 w-full rounded-lg border border-[var(--theme-border)] bg-white px-3 text-sm outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--theme-accent)' } as CSSProperties}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">密码</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              inputClassName="h-11 w-full rounded-lg border border-[var(--theme-border)] bg-white px-3 text-sm outline-none focus:ring-2"
            />
          </div>

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm hover:underline"
              onClick={() => onOpenChange(false)}
            >
              忘记密码？
            </Link>
          </div>

          {error && (
            <p
              className="rounded-lg px-3 py-2 text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#dc2626' }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-lg font-semibold text-white disabled:opacity-60"
            style={{
              background:
                'linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))',
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm" style={{ color: 'var(--theme-text-muted)' }}>
          还没有账号？
          <Link
            href="/sign-up"
            className="ml-1 font-medium hover:underline"
            onClick={() => onOpenChange(false)}
          >
            立即注册
          </Link>
        </p>
      </div>
    </div>
  );
}

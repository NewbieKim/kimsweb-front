'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { buildPasswordPayload } from '@/lib/password-crypto-client';
import PasswordInput from '@/app/components/PasswordInput';

const PHONE_REGEX = /^1[3-9]\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/;

export default function Page() {
  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (step !== 'success') {
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== 'success' || countdown > 0) {
      return;
    }
    window.location.assign('/sign-in');
  }, [step, countdown]);

  const handleSendCode = async () => {
    setError('');
    if (!PHONE_REGEX.test(phone)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, scene: 'forgot' }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || '验证码发送失败');
        return;
      }
      setCooldown(60);
      timerRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError('验证码发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!PHONE_REGEX.test(phone)) {
      setError('请输入正确的 11 位手机号');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError('请输入 6 位验证码');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, scene: 'forgot' }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || '验证码核验失败');
        return;
      }
      setToken(result.data.token);
      setStep('reset');
    } catch {
      setError('验证码核验失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!PASSWORD_REGEX.test(password)) {
      setError('密码需 8-20 位，包含字母和数字');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const passwordPayload = await buildPasswordPayload(password);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, verifyToken: token, ...passwordPayload }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || '密码重置失败');
        return;
      }

      setCountdown(5);
      window.setTimeout(() => setStep('success'), 0);
    } catch {
      setError('密码重置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg-base)] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-6 text-center shadow-sm">
          <div
            className="mx-auto grid h-12 w-12 place-items-center rounded-full text-2xl"
            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}
          >
            ✓
          </div>
          <h1 className="mt-4 text-lg font-bold">密码重置成功</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            请使用新密码登录
          </p>
          <p className="mt-4 text-sm">{countdown} 秒后自动返回登录页</p>
          <button
            onClick={() => window.location.assign('/sign-in')}
            className="mt-5 h-11 w-full rounded-lg font-semibold text-white"
            style={{
              background:
                'linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))',
            }}
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--theme-bg-base)] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-surface)] p-6 shadow-sm">
        <Link
          href="/sign-in"
          className="text-sm hover:underline"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          ← 返回登录
        </Link>

        {step === 'verify' ? (
          <form className="mt-4 space-y-4" onSubmit={handleVerify}>
            <h1 className="text-xl font-bold">找回密码</h1>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              验证通过后即可重置密码
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium">手机号</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入 11 位手机号"
                  className="h-11 flex-1 rounded-lg border border-[var(--theme-border)] bg-white px-3 text-sm outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--theme-accent)' } as CSSProperties}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || cooldown > 0}
                  className="h-11 w-28 shrink-0 rounded-lg border text-sm font-medium disabled:opacity-60"
                  style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-accent)' }}
                >
                  {cooldown > 0 ? `${cooldown}s` : '获取验证码'}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">验证码</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入 6 位验证码"
                className="h-11 w-full rounded-lg border border-[var(--theme-border)] bg-white px-3 text-sm outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--theme-accent)' } as CSSProperties}
              />
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
              {loading ? '校验中...' : '下一步'}
            </button>
          </form>
        ) : (
          <form className="mt-4 space-y-4" onSubmit={handleReset}>
            <h1 className="text-xl font-bold">重置密码</h1>
            <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              设置新密码后，请使用新密码登录
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium">新密码</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8-20 位，字母 + 数字"
                inputClassName="h-11 w-full rounded-lg border border-[var(--theme-border)] bg-white px-3 text-sm outline-none focus:ring-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">确认新密码</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                inputClassName="h-11 w-full rounded-lg border border-[var(--theme-border)] bg-white px-3 text-sm outline-none focus:ring-2"
              />
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
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

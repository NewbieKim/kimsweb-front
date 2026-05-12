'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

/**
 * 自动同步用户信息到数据库的 Hook
 * 在用户登录后自动调用同步接口
 */
export function useUserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 只在用户已登录且当前登录会话尚未自动尝试过时执行，避免失败后无限重试打爆服务
    if (isLoaded && isSignedIn && !synced && !syncing && !attempted) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, synced, syncing, attempted]);

  useEffect(() => {
    // 用户退出登录后重置同步状态，下一次登录允许再次自动尝试
    if (isLoaded && !isSignedIn) {
      setSynced(false);
      setSyncing(false);
      setAttempted(false);
      setError(null);
    }
  }, [isLoaded, isSignedIn]);

  const syncUser = async () => {
    setAttempted(true);
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        setSynced(true);
        console.log('用户信息同步成功:', result.data);
      } else {
        const nextError =
          response.status === 401 || response.status === 403
            ? '登录状态失效，请重新登录后重试'
            : result.message || '同步失败';
        setError(nextError);
        console.error('用户信息同步失败:', nextError);
      }
    } catch (err) {
      setError('同步失败，请刷新页面重试');
      console.error('用户信息同步异常:', err);
    } finally {
      setSyncing(false);
    }
  };

  return {
    synced,
    syncing,
    error,
    syncUser, // 提供手动同步方法
  };
}


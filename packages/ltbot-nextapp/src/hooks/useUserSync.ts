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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 只在用户已登录且还未同步时执行
    if (isLoaded && isSignedIn && !synced && !syncing) {
      syncUser();
    }
  }, [isLoaded, isSignedIn, synced, syncing]);

  const syncUser = async () => {
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
        setError(result.message || '同步失败');
        console.error('用户信息同步失败:', result.message);
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


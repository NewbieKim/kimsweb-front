'use client';
import { useUserSync } from '@/hooks/useUserSync';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * 用户同步提供者组件
 * 自动在用户登录后同步用户信息到数据库
 */
export default function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { synced, syncing, error } = useUserSync();

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // 可选：显示同步状态
  // useEffect(() => {
  //   if (syncing) {
  //     console.log('正在同步用户信息...');
  //   }
  //   if (synced) {
  //     console.log('用户信息同步完成');
  //   }
  // }, [syncing, synced]);

  return <>{children}</>;
}


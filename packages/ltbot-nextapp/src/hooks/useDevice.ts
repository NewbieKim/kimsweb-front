'use client';

import { useState, useEffect } from 'react';

/**
 * 检测设备类型的 Hook
 * @returns isMobile - 是否为移动设备（< 768px）
 */
export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 初始化时检测
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 首次检测
    checkDevice();

    // 监听窗口大小变化
    window.addEventListener('resize', checkDevice);

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return { isMobile };
}


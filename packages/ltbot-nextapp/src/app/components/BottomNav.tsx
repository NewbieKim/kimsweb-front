'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@heroui/theme";

interface BottomNavItem {
  name: string;
  path: string;
  isActive: (pathname: string) => boolean;
  icon: React.ReactNode;
}

const BottomNav = () => {
  const pathname = usePathname();
  
  // 定义底部导航项
  const navItems: BottomNavItem[] = [
    {
      name: "首页",
      path: "/",
      isActive: (currentPath) => currentPath === "/",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "探索",
      path: "/to-explore",
      isActive: (currentPath) =>
        currentPath === "/to-explore" ||
        currentPath.startsWith("/to-explore-story") ||
        currentPath.startsWith("/to-explore-music"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
        </svg>
      ),
    },
    {
      name: "打卡",
      path: "/habits",
      isActive: (currentPath) => currentPath === "/habits" || currentPath.startsWith("/habits/"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3 3L22 4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
    {
      name: "我的",
      path: "/to-view-mine",
      isActive: (currentPath) => currentPath === "/to-view-mine" || currentPath.startsWith("/to-view-mine/"),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];
  
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
      style={{
        background: "var(--theme-bg-surface)",
        borderTop: "1px solid var(--theme-border)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          return (
          <Link 
            key={item.path}
            href={item.path}
            className={cn(
              "flex min-h-12 w-16 flex-col items-center justify-center gap-0.5 transition-colors duration-200",
              active ? "font-semibold" : ""
            )}
            aria-current={active ? "page" : undefined}
            style={{
              color:
                active
                  ? "var(--theme-accent)"
                  : "var(--theme-text-muted)",
            }}
          >
            <div>{item.icon}</div>
            <span className="text-[11px] leading-none">{item.name}</span>
          </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

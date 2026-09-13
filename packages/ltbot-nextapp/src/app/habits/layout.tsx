import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: '今日成长打卡 | AI睡眠伙伴',
  description: '完成日常小习惯，收集食物卡，陪伴成长伙伴。',
};

export default function HabitsLayout({ children }: { children: React.ReactNode }) {
  return <div className="habit-app"><Suspense fallback={<main className="habit-loading" aria-label="正在加载"><span /><span /><span /></main>}>{children}</Suspense></div>;
}

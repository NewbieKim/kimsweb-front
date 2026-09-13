'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const immersive = pathname === '/habits' || pathname.startsWith('/habits/');

  if (immersive) {
    return (
      <>
        <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">{children}</div>
      <BottomNav />
    </>
  );
}

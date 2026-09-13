import Link from 'next/link';
import { BookOpen, Music2 } from 'lucide-react';

type ExploreTabsProps = {
  active: 'story' | 'music';
};

const tabs = [
  { key: 'story' as const, label: '探索故事', href: '/to-explore', icon: BookOpen },
  { key: 'music' as const, label: '探索音乐', href: '/to-explore-music', icon: Music2 },
];

export default function ExploreTabs({ active }: ExploreTabsProps) {
  return (
    <nav
      aria-label="探索内容类型"
      className="sticky top-0 z-30 border-b px-4 py-3 backdrop-blur-md"
      style={{ background: 'color-mix(in srgb, var(--theme-bg-surface) 92%, transparent)', borderColor: 'var(--theme-border)' }}
    >
      <div
        className="mx-auto grid w-full max-w-sm grid-cols-2 gap-1 rounded-lg p-1"
        style={{ background: 'var(--theme-bg-subtle)' }}
      >
        {tabs.map((tab) => {
          const selected = active === tab.key;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={selected ? 'page' : undefined}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors"
              style={selected ? {
                background: 'linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))',
                color: '#ffffff',
                boxShadow: '0 5px 14px var(--theme-card-shadow)',
              } : {
                color: 'var(--theme-text-muted)',
              }}
            >
              <Icon aria-hidden="true" size={18} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

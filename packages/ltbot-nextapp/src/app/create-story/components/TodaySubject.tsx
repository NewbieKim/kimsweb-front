'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@heroui/input';
import { cn } from '@heroui/theme';
import {
  QUICK_GROWTH_THEME_CATEGORIES,
  type QuickGrowthThemeItem,
} from '@/constants';

interface TodaySubjectProps {
  userSelection?: (data: { fieldName: string; fieldValue: string }) => void;
  onPrev?: () => void;
}

const THEME_BATCH_SIZE = 9;

const pickRandomThemeBatch = (
  allThemes: QuickGrowthThemeItem[],
  selectedTheme: string | null,
): QuickGrowthThemeItem[] => {
  const pool = [...allThemes];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  if (!selectedTheme) {
    return pool.slice(0, THEME_BATCH_SIZE);
  }

  const selected = allThemes.find((item) => item.shortLabel === selectedTheme);
  if (!selected) {
    return pool.slice(0, THEME_BATCH_SIZE);
  }

  const others = pool.filter((item) => item.id !== selected.id).slice(0, THEME_BATCH_SIZE - 1);
  return [selected, ...others];
};

export default function TodaySubject({ userSelection, onPrev }: TodaySubjectProps) {
  const [openCards, setOpenCards] = useState<string[]>(['growth-theme']);
  const allThemes = useMemo(
    () => QUICK_GROWTH_THEME_CATEGORIES.flatMap((category) => category.themes),
    [],
  );
  const [selectedTheme, setSelectedTheme] = useState<string | null>('安静入睡');
  const [themeOptions, setThemeOptions] = useState<QuickGrowthThemeItem[]>(() =>
    pickRandomThemeBatch(allThemes, '安静入睡'),
  );
  const [customTheme, setCustomTheme] = useState<string>('');

  const selectedThemeFullLabel = useMemo(() => {
    if (!selectedTheme) return '';
    return allThemes.find((item) => item.shortLabel === selectedTheme)?.fullLabel || selectedTheme;
  }, [allThemes, selectedTheme]);

  const finalTheme = useMemo(
    () => customTheme.trim() || selectedThemeFullLabel,
    [customTheme, selectedThemeFullLabel],
  );

  useEffect(() => {
    userSelection?.({ fieldName: 'storySubjectType', fieldValue: 'custom' });
    userSelection?.({ fieldName: 'customStorySubject', fieldValue: finalTheme });
    userSelection?.({
      fieldName: 'todaySubjectConfig',
      fieldValue: JSON.stringify({
        selectedTheme,
        selectedThemeFullLabel,
        customTheme: customTheme.trim(),
        finalTheme,
      }),
    });
  }, [userSelection, finalTheme, selectedTheme, selectedThemeFullLabel, customTheme]);

  const toggleCard = (cardId: string) => {
    setOpenCards((prev) =>
      prev.includes(cardId) ? prev.filter((item) => item !== cardId) : [...prev, cardId],
    );
  };

  const shuffleThemes = () => {
    setOpenCards(['growth-theme']);
    setThemeOptions(pickRandomThemeBatch(allThemes, selectedTheme));
  };

  return (
    <section
      className="w-full rounded-3xl p-4 shadow-sm md:p-6"
      style={{ border: "1px solid var(--theme-border)", background: "var(--theme-bg-surface)" }}
    >
      <header className="mb-4">
        <h2 className="text-3xl font-extrabold" style={{ color: "var(--theme-accent)" }}>你想告诉宝宝什么？</h2>
      </header>

      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--theme-border)" }}>
        <div className="flex flex-row justify-between items-center m-4">
          <span style={{ color: "var(--theme-accent)" }} className="text-2xl font-bold">今日成长主题</span>
          <button
            type="button"
            onClick={shuffleThemes}
            className="rounded-full border px-4 py-1 text-base font-semibold"
            style={{ borderColor: "var(--theme-border)", color: "var(--theme-accent)" }}
          >
            换一批
          </button>
        </div>  

        {openCards.includes('growth-theme') ? (
          <div className="border-t p-4" style={{ borderTopColor: "var(--theme-border)" }}>
            {/* 底部padding-bottom-4 */}
            <div className="grid grid-cols-3 gap-2 pb-4">
              {themeOptions.map((item) => {
                const active = !customTheme.trim() && selectedTheme === item.shortLabel;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setCustomTheme('');
                      setSelectedTheme((prev) => (prev === item.shortLabel ? null : item.shortLabel));
                    }}
                    className={cn(
                      'rounded-2xl border p-3 text-center transition-all',
                      active ? 'shadow-sm' : 'bg-white',
                    )}
                    style={{
                      borderColor: active ? "var(--theme-accent)" : "var(--theme-border)",
                      background: active ? "var(--theme-bg-subtle)" : "var(--theme-bg-surface)",
                    }}
                  >
                    <p className="text-4xl">{item.icon}</p>
                    <p
                      className={cn('mt-2 text-sm font-semibold')}
                      style={{ color: active ? "var(--theme-accent)" : "var(--theme-text-muted)" }}
                    >
                      {item.shortLabel}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <Input
                label="自定义主题（可选）"
                labelPlacement="outside"
                placeholder="例如：今晚学会和小情绪做朋友"
                value={customTheme}
                onValueChange={setCustomTheme}
                classNames={{
                  inputWrapper: 'bg-white border shadow-none',
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

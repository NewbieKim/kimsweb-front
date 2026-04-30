'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@heroui/input';
import { cn } from '@heroui/theme';

interface TodaySubjectProps {
  userSelection?: (data: { fieldName: string; fieldValue: string }) => void;
  onPrev?: () => void;
}

interface ThemeOption {
  id: string;
  label: string;
  icon: string;
}

const THEME_OPTIONS: ThemeOption[] = [
    { id: 'sleep-well', label: '安静入睡', icon: '💤' },
    { id: 'overcome-fear', label: '克服怕黑', icon: '🐻' },
    { id: 'brush-teeth', label: '认真刷牙', icon: '🦷' },
    { id: 'learn-share', label: '学会分享', icon: '🤝' },
    { id: 'embrace-emotion', label: '拥抱情绪', icon: '🌈' },
    { id: 'be-brave', label: '勇敢尝试', icon: '⭐' },
    { id: 'safe-home', label: '为家安心', icon: '🏠' },
    { id: 'be-thankful', label: '感恩小事', icon: '🎁' },
    { id: 'good-character', label: '优质品格', icon: '💖' },
];

export default function TodaySubject({ userSelection, onPrev }: TodaySubjectProps) {
  const [openCards, setOpenCards] = useState<string[]>(['growth-theme']);
  const [selectedTheme, setSelectedTheme] = useState<string>('安静入睡');
  const [customTheme, setCustomTheme] = useState<string>('');

  const finalTheme = useMemo(() => customTheme.trim() || selectedTheme, [customTheme, selectedTheme]);

  useEffect(() => {
    userSelection?.({ fieldName: 'storySubjectType', fieldValue: 'custom' });
    userSelection?.({ fieldName: 'customStorySubject', fieldValue: finalTheme });
    userSelection?.({
      fieldName: 'todaySubjectConfig',
      fieldValue: JSON.stringify({
        selectedTheme,
        customTheme: customTheme.trim(),
        finalTheme,
      }),
    });
  }, [userSelection, finalTheme, selectedTheme, customTheme]);

  const toggleCard = (cardId: string) => {
    setOpenCards((prev) =>
      prev.includes(cardId) ? prev.filter((item) => item !== cardId) : [...prev, cardId],
    );
  };

  const handleRefresh = () => {
    setOpenCards(['growth-theme']);
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
        <button
          type="button"
          onClick={() => toggleCard('growth-theme')}
          className="flex w-full items-center justify-between bg-white px-4 py-4 text-left"
        >
          <div>
            <p className="text-xl font-bold" style={{ color: "var(--theme-accent)" }}>今日成长主题</p>
          </div>
          {/* 换一批 */}
          <span
            className="flex h-8 w-24 items-center justify-center rounded-full border text-lg"
            style={{ borderColor: "var(--theme-border)", color: "var(--theme-accent)" }}
            onClick={() => {
            handleRefresh();
          }}
          >
            换一批
          </span>
        </button>

        {openCards.includes('growth-theme') ? (
          <div className="border-t p-4" style={{ borderTopColor: "var(--theme-border)" }}>
            {/* 底部padding-bottom-4 */}
            <div className="grid grid-cols-3 gap-2 pb-4">
              {THEME_OPTIONS.map((item) => {
                const isCustom = item.id === 'custom';
                const active = isCustom
                  ? Boolean(customTheme.trim())
                  : !customTheme.trim() && selectedTheme === item.label;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!isCustom) {
                        setCustomTheme('');
                        setSelectedTheme(item.label);
                      }
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
                      {item.label}
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

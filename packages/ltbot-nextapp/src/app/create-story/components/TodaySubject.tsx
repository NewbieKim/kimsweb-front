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
    <section className="w-full rounded-3xl border border-primary-100 bg-white p-4 shadow-sm md:p-6">
      <header className="mb-4">
        {/* <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-primary-400">3 成长主题</p>
          {onPrev ? (
            <button
              type="button"
              onClick={onPrev}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-100 bg-white text-lg text-primary-700 shadow-sm"
              aria-label="返回上一步"
            >
              ‹
            </button>
          ) : null}
        </div> */}
        <h2 className="text-3xl font-extrabold text-primary-700">你想告诉宝宝什么？</h2>
      </header>

      <div className="overflow-hidden rounded-2xl border border-primary-100">
        <button
          type="button"
          onClick={() => toggleCard('growth-theme')}
          className="flex w-full items-center justify-between bg-white px-4 py-4 text-left"
        >
          <div>
            <p className="text-xl font-bold text-primary-700">今日成长主题</p>
          </div>
          {/* 换一批 */}
          <span className="flex h-8 w-24 items-center justify-center rounded-full border border-primary-100 text-lg text-primary-500" onClick={() => {
            handleRefresh();
          }}>
            换一批
          </span>
        </button>

        {openCards.includes('growth-theme') ? (
          <div className="border-t border-primary-100 p-4">
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
                      active
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-primary-100 bg-white hover:border-primary-300',
                    )}
                  >
                    <p className="text-4xl">{item.icon}</p>
                    <p className={cn('mt-2 text-sm font-semibold', active ? 'text-primary-600' : 'text-primary-400')}>
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
                  inputWrapper: 'bg-white border border-primary-100 shadow-none',
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

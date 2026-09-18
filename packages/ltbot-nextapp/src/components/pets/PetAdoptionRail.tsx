'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { PetSprite } from '@/components/pets/PetSprite';

export type PetAdoptionOption = {
  petKey: string;
  name: string;
  personality: string;
  assetVersion?: number;
};

type PetAdoptionRailProps = {
  pets: PetAdoptionOption[];
  selectedKey: string;
  onSelect: (petKey: string) => void;
  label?: string;
  hint?: string;
};

/**
 * 宠物领养横滑轨，交互对齐故事场景卡（snap + 左右箭头 + 键盘）。
 */
export function PetAdoptionRail({
  pets,
  selectedKey,
  onSelect,
  label = '选择一位一起长大的朋友',
  hint = '左右滑动挑选，第一次喂养后种类会固定。',
}: PetAdoptionRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (!selectedKey) return;
    cardsRef.current[selectedKey]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [selectedKey]);

  const scrollRail = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.min(280, rail.clientWidth * 0.72), behavior: 'smooth' });
  };

  const moveCardFocus = (event: KeyboardEvent<HTMLButtonElement>, petKey: string) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const index = pets.findIndex((pet) => pet.petKey === petKey);
    const next = pets[index + (event.key === 'ArrowRight' ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    cardsRef.current[next.petKey]?.focus();
    cardsRef.current[next.petKey]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const selected = pets.find((pet) => pet.petKey === selectedKey) ?? null;

  return (
    <section aria-label={label}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--theme-text-muted)' }}>{hint}</p>
        </div>
        <span className="hidden shrink-0 text-xs sm:block" style={{ color: 'var(--theme-text-muted)' }}>
          {pets.length} 种宠物
        </span>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => scrollRail(-1)}
          aria-label="查看更前面的宠物"
          className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white/95 text-xl shadow-md md:grid"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-accent)' }}
        >
          ‹
        </button>

        <div
          ref={railRef}
          role="radiogroup"
          aria-label={label}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 pt-1 [overscroll-behavior-inline:contain] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pets.map((pet) => {
            const active = selectedKey === pet.petKey;
            return (
              <button
                key={pet.petKey}
                ref={(node) => { cardsRef.current[pet.petKey] = node; }}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`${pet.name}：${pet.personality}`}
                onClick={() => onSelect(pet.petKey)}
                onKeyDown={(event) => moveCardFocus(event, pet.petKey)}
                className="group relative flex min-w-[148px] max-w-[168px] basis-[42vw] snap-start flex-col items-center overflow-hidden rounded-3xl border-2 px-3 pb-3 pt-4 text-center transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 motion-reduce:transform-none"
                style={{
                  borderColor: active ? 'var(--theme-accent)' : 'var(--theme-border)',
                  background: active ? 'var(--theme-bg-subtle)' : 'var(--theme-bg-surface)',
                  boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--theme-accent) 18%, transparent)' : undefined,
                }}
              >
                {active && (
                  <span
                    className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full text-xs font-black text-white"
                    style={{ background: 'var(--theme-accent)' }}
                  >
                    ✓
                  </span>
                )}
                <PetSprite petKey={pet.petKey} assetVersion={pet.assetVersion ?? 1} pose="avatar" alt={pet.name} size={112} />
                <b className="mt-2 text-sm font-bold">{pet.name}</b>
                <small className="mt-1 line-clamp-2 text-[11px] leading-4" style={{ color: 'var(--theme-text-muted)' }}>
                  {pet.personality}
                </small>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollRail(1)}
          aria-label="查看更多宠物"
          className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border bg-white/95 text-xl shadow-md md:grid"
          style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-accent)' }}
        >
          ›
        </button>
      </div>

      {selected && (
        <div
          className="mt-3 rounded-2xl border px-4 py-3"
          style={{ borderColor: 'var(--theme-accent)', background: 'var(--theme-bg-subtle)' }}
          aria-live="polite"
        >
          <strong className="block text-sm">将领养：{selected.name}</strong>
          <p className="mt-1 text-xs leading-5" style={{ color: 'var(--theme-text-muted)' }}>{selected.personality}</p>
        </div>
      )}
    </section>
  );
}

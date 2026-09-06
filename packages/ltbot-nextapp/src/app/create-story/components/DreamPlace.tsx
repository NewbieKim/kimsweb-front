'use client';

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  ACTIVE_SCENE_CATEGORIES,
  findScene,
  getScenesByCategory,
  type SceneAgeGroupId,
  type SceneCardDefinition,
} from '@/lib/story-customization/scene-catalog';

interface DreamPlaceProps {
  active: boolean;
  ageGroup: string;
  selectedSceneId: string | null;
  onChange: (sceneId: string) => void;
  onCategoryExposed?: (categoryId: string) => void;
}

type InputType = 'touch' | 'arrow' | 'keyboard';

function normalizeAgeGroup(ageGroup: string): SceneAgeGroupId {
  if (ageGroup === '0-2' || ageGroup === '2-4' || ageGroup === '4-6' || ageGroup === '6-8') return ageGroup;
  if (ageGroup.includes('0-2')) return '0-2';
  if (ageGroup.includes('2-4')) return '2-4';
  if (ageGroup.includes('6-8')) return '6-8';
  return '4-6';
}

function trackSceneEvent(eventType: string, metadata: Record<string, unknown>) {
  void fetch('/api/operation-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, metadata }),
    keepalive: true,
  }).catch(() => undefined);
}

const DISPLAY_CATEGORIES = ACTIVE_SCENE_CATEGORIES.filter((category) => getScenesByCategory(category.id).length > 0);

export default function DreamPlace({ active, ageGroup, selectedSceneId, onChange, onCategoryExposed }: DreamPlaceProps) {
  const rails = useRef<Record<string, HTMLDivElement | null>>({});
  const cards = useRef<Record<string, HTMLButtonElement | null>>({});
  const categorySections = useRef<Record<string, HTMLElement | null>>({});
  const exposedCategories = useRef(new Set<string>());
  const scrollTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const stepStartedAt = useRef(0);
  const selectedSceneIdRef = useRef(selectedSceneId);
  const wasActive = useRef(false);
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const selectedScene = useMemo(() => selectedSceneId ? findScene(selectedSceneId) ?? null : null, [selectedSceneId]);
  const selectionUnavailable = Boolean(active && selectedSceneId && !selectedScene);
  const selectedAge = normalizeAgeGroup(ageGroup);

  useEffect(() => {
    selectedSceneIdRef.current = selectedSceneId;
  }, [selectedSceneId]);

  useEffect(() => {
    if (active && !wasActive.current) {
      stepStartedAt.current = window.performance.now();
      trackSceneEvent('scene_step_viewed', {
        ageGroup: selectedAge,
        categoryCount: DISPLAY_CATEGORIES.length,
        cardCount: DISPLAY_CATEGORIES.reduce((total, category) => total + getScenesByCategory(category.id).length, 0),
        hasPreviousSelection: Boolean(selectedSceneIdRef.current),
      });
    }
    wasActive.current = active;
  }, [active, selectedAge]);

  useEffect(() => {
    if (!active || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const categoryId = (entry.target as HTMLElement).dataset.categoryId;
        if (!entry.isIntersecting || !categoryId || exposedCategories.current.has(categoryId)) return;
        exposedCategories.current.add(categoryId);
        onCategoryExposed?.(categoryId);
        const position = DISPLAY_CATEGORIES.findIndex((category) => category.id === categoryId) + 1;
        trackSceneEvent('scene_category_exposed', { categoryId, position });
      });
    }, { threshold: 0.35 });
    DISPLAY_CATEGORIES.forEach((category) => {
      const node = categorySections.current[category.id];
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [active, onCategoryExposed]);

  useEffect(() => () => {
    Object.values(scrollTimers.current).forEach(clearTimeout);
  }, []);

  const reportRailPosition = (categoryId: string, inputType: InputType) => {
    const rail = rails.current[categoryId];
    if (!rail) return;
    const maxVisibleIndex = getScenesByCategory(categoryId).reduce((maxIndex, scene, index) => {
      const card = cards.current[scene.id];
      return card && card.offsetLeft < rail.scrollLeft + rail.clientWidth ? index : maxIndex;
    }, 0);
    trackSceneEvent('scene_rail_scrolled', { categoryId, maxVisibleIndex, inputType });
  };

  const scheduleRailReport = (categoryId: string, inputType: InputType) => {
    clearTimeout(scrollTimers.current[categoryId]);
    scrollTimers.current[categoryId] = setTimeout(() => reportRailPosition(categoryId, inputType), 250);
  };

  const selectScene = (scene: SceneCardDefinition, eventTimestamp: number) => {
    const isReselect = selectedSceneId === scene.id;
    onChange(scene.id);
    trackSceneEvent('scene_card_selected', {
      sceneId: scene.id,
      categoryId: scene.categoryId,
      cardPosition: scene.sortOrder,
      timeToSelectMs: Math.max(0, Math.round(eventTimestamp - stepStartedAt.current)),
      isReselect,
    });
  };

  const moveCardFocus = (event: KeyboardEvent<HTMLButtonElement>, scene: SceneCardDefinition) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const categoryCards = getScenesByCategory(scene.categoryId);
    const currentIndex = categoryCards.findIndex((item) => item.id === scene.id);
    const nextIndex = currentIndex + (event.key === 'ArrowRight' ? 1 : -1);
    const target = categoryCards[nextIndex];
    if (!target) return;
    event.preventDefault();
    cards.current[target.id]?.focus();
    cards.current[target.id]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    scheduleRailReport(scene.categoryId, 'keyboard');
  };

  const scrollRail = (categoryId: string, direction: -1 | 1) => {
    const rail = rails.current[categoryId];
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.min(390, rail.clientWidth * 0.72), behavior: 'smooth' });
    scheduleRailReport(categoryId, 'arrow');
  };

  return (
    <section
      className="overflow-hidden rounded-[28px] border pb-2 shadow-[0_10px_30px_var(--theme-card-shadow)]"
      style={{ borderColor: 'var(--theme-border)', background: 'var(--theme-bg-surface)' }}
      aria-labelledby="scene-step-title"
    >
      <header className="px-5 pb-6 pt-7 md:px-8 md:pt-8">
        <h2 id="scene-step-title" className="text-2xl font-bold md:text-[34px]">今晚去哪里做梦？</h2>
        <p className="mt-2 text-sm leading-6 md:text-base" style={{ color: 'var(--theme-text-muted)' }}>
          向下浏览四个世界，在喜欢的分类里左右滑动。今晚只选一个场景。
        </p>
        {selectionUnavailable && (
          <p className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold" style={{ color: 'var(--theme-accent)', background: 'var(--theme-bg-subtle)' }}>
            这个场景暂时休息了，请重新选一个。
          </p>
        )}
      </header>

      {DISPLAY_CATEGORIES.map((category) => {
        const scenes = getScenesByCategory(category.id);
        const selection = selectedScene?.categoryId === category.id ? selectedScene : null;
        return (
          <section
            key={category.id}
            ref={(node) => { categorySections.current[category.id] = node; }}
            data-category-id={category.id}
            className="border-t py-7 md:py-8"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-start justify-between gap-4 px-5 pb-4 md:px-8">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] text-[22px]" style={{ background: 'var(--theme-bg-subtle)' }}>
                  {category.icon}
                </span>
                <div>
                  <h3 id={`scene-category-${category.id}`} className="text-xl font-bold leading-tight md:text-[21px]">{category.name}</h3>
                  <p className="mt-1 max-w-2xl text-sm leading-[1.55]" style={{ color: 'var(--theme-text-muted)' }}>{category.description}</p>
                </div>
              </div>
              <span className="hidden whitespace-nowrap pt-1 text-xs min-[401px]:block" style={{ color: 'var(--theme-text-muted)' }}>{scenes.length} 个场景</span>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => scrollRail(category.id, -1)}
                aria-label={`查看更前面的${category.name}场景`}
                className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border bg-white/95 text-2xl shadow-lg transition-transform hover:scale-105 md:grid"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-accent)' }}
              >‹</button>
              <div
                ref={(node) => { rails.current[category.id] = node; }}
                role="group"
                aria-labelledby={`scene-category-${category.id}`}
                onScroll={() => scheduleRailReport(category.id, 'touch')}
                className="flex snap-x snap-mandatory gap-[13px] overflow-x-auto px-5 pb-5 pt-1 [overscroll-behavior-inline:contain] [scroll-padding-inline:20px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-4 md:px-8 md:[scroll-padding-inline:32px]"
              >
                {scenes.map((scene, sceneIndex) => {
                  const selected = selectedSceneId === scene.id;
                  const imageFailed = failedImages[scene.id];
                  return (
                    <button
                      key={scene.id}
                      ref={(node) => { cards.current[scene.id] = node; }}
                      type="button"
                      aria-pressed={selected}
                      aria-label={`${scene.name}：${scene.description}`}
                      onClick={(event) => selectScene(scene, event.timeStamp)}
                      onKeyDown={(event) => moveCardFocus(event, scene)}
                      className="group relative aspect-[3/4] min-w-[210px] max-w-[246px] basis-[70vw] snap-start overflow-hidden rounded-3xl border-2 border-transparent bg-slate-700 text-left text-white shadow-[0_9px_22px_rgba(26,19,13,.13)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] aria-pressed:-translate-y-1 aria-pressed:shadow-[0_0_0_4px_var(--theme-bg-subtle),0_14px_28px_rgba(26,19,13,.18)] motion-reduce:transform-none motion-reduce:transition-none md:basis-[clamp(210px,26vw,254px)] md:max-w-[254px]"
                      style={{ borderColor: selected ? 'var(--theme-accent)' : 'transparent', backgroundImage: category.fallbackGradient }}
                    >
                      {!loadedImages[scene.id] && !imageFailed && <span className="absolute inset-0 animate-pulse bg-white/10 motion-reduce:animate-none" aria-hidden="true" />}
                      {!imageFailed && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={scene.coverImage}
                          alt=""
                          loading={category.sortOrder === 1 && sceneIndex < 2 ? 'eager' : 'lazy'}
                          fetchPriority={category.sortOrder === 1 && sceneIndex < 2 ? 'high' : 'auto'}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                          onLoad={() => setLoadedImages((current) => ({ ...current, [scene.id]: true }))}
                          onError={() => {
                            setFailedImages((current) => ({ ...current, [scene.id]: true }));
                            trackSceneEvent('scene_image_failed', { sceneId: scene.id, assetVersion: scene.catalogVersion });
                          }}
                        />
                      )}
                      <span className="absolute inset-0 bg-gradient-to-b from-black/[.02] from-25% to-black/90" aria-hidden="true" />
                      <span className="absolute left-4 top-4 grid h-[42px] w-[42px] place-items-center rounded-[14px] bg-white/85 text-[22px] shadow-md backdrop-blur-sm">{scene.emoji}</span>
                      {selected && <span className="absolute right-3.5 top-3.5 grid h-[30px] w-[30px] place-items-center rounded-full text-sm font-black text-white shadow-md" style={{ background: 'var(--theme-accent)' }}>✓</span>}
                      <span className="absolute inset-x-[18px] bottom-[18px]">
                        <strong className="block text-[23px] font-extrabold leading-tight drop-shadow-md">{scene.name}</strong>
                        <span className="mt-1.5 line-clamp-2 block text-sm leading-[1.5] text-white/90">{scene.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => scrollRail(category.id, 1)}
                aria-label={`查看更多${category.name}场景`}
                className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border bg-white/95 text-2xl shadow-lg transition-transform hover:scale-105 md:grid"
                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-accent)' }}
              >›</button>
            </div>

            {selection && (
              <div
                className="mx-5 mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-3.5 rounded-[18px] border px-5 py-[18px] md:mx-8"
                style={{ borderColor: 'var(--theme-accent)', background: 'var(--theme-bg-subtle)' }}
                aria-live="polite"
              >
                <span className="grid h-[42px] w-[42px] place-items-center rounded-[14px] text-[22px]" style={{ background: 'var(--theme-bg-surface)' }}>{selection.emoji}</span>
                <div>
                  <strong className="block">今晚将去：{selection.name}</strong>
                  <p className="mt-1 text-sm leading-[1.55]" style={{ color: 'var(--theme-text-muted)' }}>{selection.description}</p>
                  <p className="mt-1 text-sm font-semibold leading-[1.55]" style={{ color: 'var(--theme-accent)' }}>
                    适合 {selectedAge} 岁：{selection.settings[selectedAge]}
                  </p>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </section>
  );
}

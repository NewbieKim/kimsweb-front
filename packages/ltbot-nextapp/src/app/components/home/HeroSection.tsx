/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { toast } from "react-toastify";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { cn } from "@heroui/theme";
import {
  QUICK_GROWTH_THEME_CATEGORIES,
  type QuickGrowthThemeItem,
} from "@/constants";
import styles from "./HeroSection.module.css";

const AVATARS = ["👩", "👨", "👧", "👦", "🧒"];
const QUICK_THEME_BATCH_SIZE = 9;

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
    return pool.slice(0, QUICK_THEME_BATCH_SIZE);
  }

  const selected = allThemes.find((item) => item.shortLabel === selectedTheme);
  if (!selected) {
    return pool.slice(0, QUICK_THEME_BATCH_SIZE);
  }

  const others = pool.filter((item) => item.id !== selected.id).slice(0, QUICK_THEME_BATCH_SIZE - 1);
  return [selected, ...others];
};

export default function HeroSection() {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const { user, isSignedIn } = useUser();
  const [customTheme, setCustomTheme] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>("安静入睡");
  const allThemes = useMemo(
    () => QUICK_GROWTH_THEME_CATEGORIES.flatMap((category) => category.themes),
    [],
  );
  const [themeOptions, setThemeOptions] = useState<QuickGrowthThemeItem[]>(() =>
    pickRandomThemeBatch(allThemes, "安静入睡"),
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isHeroImageError, setIsHeroImageError] = useState(false);
  const [isCoverImageError, setIsCoverImageError] = useState(false);

  const selectedThemeFullLabel = useMemo(() => {
    if (!selectedTheme) return "";
    return allThemes.find((item) => item.shortLabel === selectedTheme)?.fullLabel || selectedTheme;
  }, [allThemes, selectedTheme]);
  const finalTheme = useMemo(
    () => customTheme.trim() || selectedThemeFullLabel || "",
    [customTheme, selectedThemeFullLabel],
  );

  const shuffleThemes = () => {
    setThemeOptions(pickRandomThemeBatch(allThemes, selectedTheme));
  };

  const fetchUserInfo = async (userId: string): Promise<any> => {
    const response = await fetch(`/api/users-prisma/${userId}`, {
      method: "GET",
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "获取用户信息失败");
    }
    return result.data;
  };

  const saveStory = async (storyData: any): Promise<any> => {
    const response = await fetch("/api/stories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(storyData),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "创建故事失败");
    }
    return result.data;
  };

  const consumeScore = async (userId: string, amount: number, storyId?: number): Promise<any> => {
    const response = await fetch("/api/scores/consume", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        amount,
        transactionType: "CONSUME_STORY",
        storyId,
        description: `生成故事消耗 ${amount} 积分`,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "消耗积分失败");
    }
    return result.data;
  };

  const handleQuickGenerate = async () => {
    if (!finalTheme) {
      toast.error("请先选择成长主题或输入自定义主题");
      return;
    }
    if (!isSignedIn || !user?.id) {
      toast.error("请先登录");
      return;
    }

    setIsGenerating(true);
    try {
      const userInfo = await fetchUserInfo(user.id);
      if (userInfo?.userScore?.balance < 10) {
        toast.error("积分不足，请先购买积分");
        return;
      }

      const formData = {
        ageGroup: "4-6岁",
        storySubjectType: "custom",
        customStorySubject: finalTheme,
        characterSetting: "主角是温柔勇敢的小朋友，和伙伴一起完成一个睡前小目标。",
        wordCountLimit: "420-650",
        promptVersion: "universal",
        todaySubjectConfig: JSON.stringify({
          selectedTheme,
          selectedThemeFullLabel,
          customTheme: customTheme.trim(),
          finalTheme,
        }),
      };

      const story = await saveStory({
        userId: user.id,
        ageGroup: formData.ageGroup,
        themeType: "CUSTOM",
        classicTheme: null,
        classicSubTheme: null,
        customTheme: finalTheme,
        characterSettings: JSON.stringify({
          description: formData.characterSetting,
        }),
        wordLimit: 650,
        extData: JSON.stringify({
          wordRange: formData.wordCountLimit,
          generationStatus: "pending",
          generationStartedAt: new Date().toISOString(),
          generationMode: "quick",
          quickTheme: finalTheme,
        }),
      });

      await consumeScore(user.id, 10, story.id);

      fetch("/api/stories/generate-async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId: story.id,
          formData,
        }),
      }).catch((err) => {
        console.error("触发故事生成失败:", err);
      });

      toast.success("故事创建成功，正在生成内容...");
      onClose();
      router.push("/to-explore-story");
    } catch (error: any) {
      toast.error(error.message || "快速生成失败");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section
      className="w-full pt-4 pb-12 md:pt-8 md:pb-16"
      style={{ background: "var(--theme-bg-base)" }}
    >
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-0">
        {/* 左侧文字区 */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          {/* Badge */}
          <span
            className="inline-block text-xs font-semibold px-4 py-1.5 rounded-full"
            style={{
              background: "var(--theme-badge-bg)",
              color: "var(--theme-badge-text)",
            }}
          >
            ✨ 专为 0-8 岁儿童打造的 AI 睡前故事应用
          </span>

          {/* 主标题 */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span
              style={{
                background:
                  "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              每个孩子的专属故事
            </span>
            <br />
            <span style={{ color: "var(--theme-text)" }}>由AI用爱创作</span>
          </h1>

          {/* 副标题 */}
          <p
            className="text-base md:text-lg max-w-xl"
            style={{ color: "var(--theme-text-muted)" }}
          >
            用 AI 为孩子量身定制专属睡前故事，融入他最爱的角色、名字与冒险场景，
            每晚入睡前都是一段奇妙旅程。
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/create-story"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-white font-semibold text-base shadow-lg hover:opacity-90 transition-opacity"
              style={{
                background:
                  "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
              }}
            >
              深度定制故事 →
            </Link>
            <button
              type="button"
              onClick={onOpen}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full font-semibold text-base border-2 hover:opacity-80 transition-opacity"
              style={{
                borderColor: "var(--theme-accent)",
                color: "var(--theme-accent)",
              }}
            >
              快速生成故事 →
            </button>
          </div>

          {/* 社会证明 */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex -space-x-2">
              {AVATARS.map((a, i) => (
                <span
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-base border-2 border-white"
                  style={{ background: "var(--theme-bg-subtle)" }}
                >
                  {a}
                </span>
              ))}
            </div>
            <div className="flex flex-col">
              <span className="text-yellow-400 text-sm">★★★★★</span>
              <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                深受 10,000+ 家庭喜爱
              </span>
            </div>
          </div>
        </div>

        {/* 右侧背景图 + 静态播放器 */}
        <div className="relative w-full max-w-md lg:w-[58%] lg:max-w-none lg:-ml-14 xl:-ml-20 lg:shrink-0">
          <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
            <defs>
              <clipPath id="heroVisualClipPath" clipPathUnits="objectBoundingBox">
                <path d="M .25 0 C .38 .02 .62 0 .93 0 C .98 0 1 .035 .99 .09 C 1 .24 .98 .52 .93 .69 C .86 .89 .67 1 .43 .98 C .2 .96 .06 .83 .02 .65 C -.02 .43 .06 .17 .25 0 Z" />
              </clipPath>
            </defs>
          </svg>
          <div
            className={`${styles.heroVisualClip} relative overflow-hidden h-[220px] sm:h-[280px] md:h-[420px] lg:h-[520px] shadow-2xl`}
            style={{
              border: "1px solid var(--theme-border)",
              background:
                "radial-gradient(circle at 70% 22%, rgba(167,139,250,0.28), transparent 34%), linear-gradient(145deg, #4338ca, #1e3a8a 50%, #0f172a)",
            }}
          >
            {!isHeroImageError ? (
              <Image
                src="/home/backup.png"
                alt="睡前故事场景背景图"
                fill
                priority
                quality={72}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 58vw"
                className="object-cover"
                onError={() => setIsHeroImageError(true)}
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(circle at 70% 25%, rgba(255,255,255,0.18), transparent 35%), linear-gradient(145deg, #4f46e5, #1e3a8a 45%, #0f172a)",
                }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          </div>

          <div className="absolute z-30 bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm lg:bottom-10 lg:left-[52%]">
            <div className="rounded-2xl bg-white/95 backdrop-blur px-3 py-2 shadow-lg ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-12 rounded-lg overflow-hidden shrink-0">
                  {!isCoverImageError ? (
                    <Image
                      src="/home/backup.png"
                      alt="播放器封面"
                      fill
                      quality={60}
                      sizes="64px"
                      className="object-cover"
                      onError={() => setIsCoverImageError(true)}
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(140deg, rgba(79,70,229,0.9), rgba(59,130,246,0.85))",
                      }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">
                    月夜里的小星星
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    为 5 岁昕昕定制
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">▶</span>
                    <div className="flex-1 h-1 rounded-full bg-zinc-200 overflow-hidden">
                      <div className="h-full w-1/3 rounded-full bg-violet-500" />
                    </div>
                    <span className="text-[10px] text-zinc-500">02:45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size="2xl">
        <ModalContent>
          {(close) => (
            <>
              <ModalHeader className="flex items-center justify-between">
                <span style={{ color: "var(--theme-accent)" }} className="text-2xl font-bold">
                  今日成长主题
                </span>
                <button
                  type="button"
                  onClick={shuffleThemes}
                  className="rounded-full border px-4 py-1 text-base font-semibold"
                  style={{ borderColor: "var(--theme-border)", color: "var(--theme-accent)" }}
                >
                  换一批
                </button>
              </ModalHeader>
              <ModalBody>
                <div className="grid grid-cols-3 gap-3">
                  {themeOptions.map((item) => {
                    const active = !customTheme.trim() && selectedTheme === item.shortLabel;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setCustomTheme("");
                          setSelectedTheme((prev) => (prev === item.shortLabel ? null : item.shortLabel));
                        }}
                        className={cn(
                          "rounded-2xl border p-3 text-center transition-all",
                          active ? "shadow-sm" : "",
                        )}
                        style={{
                          borderColor: active ? "var(--theme-accent)" : "var(--theme-border)",
                          background: active ? "var(--theme-bg-subtle)" : "var(--theme-bg-surface)",
                        }}
                      >
                        <p className="text-4xl">{item.icon}</p>
                        <p
                          className="mt-2 text-lg font-semibold"
                          style={{
                            color: active ? "var(--theme-accent)" : "var(--theme-text-muted)",
                          }}
                        >
                          {item.shortLabel}
                        </p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <Input
                    label="自定义主题（可选）"
                    labelPlacement="outside"
                    placeholder="例如：今晚学会和小情绪做朋友"
                    value={customTheme}
                    onValueChange={setCustomTheme}
                    classNames={{
                      inputWrapper: "bg-white border shadow-none",
                    }}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => {
                    close();
                  }}
                  isDisabled={isGenerating}
                >
                  取消
                </Button>
                {isSignedIn ? (
                  <Button variant="light" onPress={handleQuickGenerate} isLoading={isGenerating}>
                    确定
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <Button variant="light">请先登录</Button>
                  </SignInButton>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </section>
  );
}

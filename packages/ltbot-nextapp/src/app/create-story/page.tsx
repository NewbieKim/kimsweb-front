'use client';
import { useState, useEffect, useCallback } from 'react';
import CharacterAndPartner from './components/CharacterAndPartner';
import DreamPlace from './components/DreamPlace';
import TodaySubject from './components/TodaySubject';
import { Button } from '@heroui/button';
import CustomLoader from '@/app/components/CustomLoader';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton } from '@clerk/nextjs';

// 引入状态管理
import { useUserStore } from "@/stores/userStore";

// 接口定义
interface formDataType {
    ageGroup?: string;
    dreamPlace?: string;
    dreamPlaceCardId?: string;
    dreamPlaceConfig?: string;
    storySubjectType?: string;
    storySubject?: string;
    storyChildSubject?: string;
    customStorySubject?: string;
    characterSetting?: string;
    wordCountLimit?: string;
    generateStoryCover?: string;
}
interface fieldData {
    fieldName: string;
    fieldValue: string;
}

export default function CreateStory() {
    const notify = (msg: string) => toast(msg);
    const notifySuccess = (msg: string) => toast.success(msg);
    const notifyError = (msg: string) => toast.error(msg);
    const router = useRouter();
    const [formData, setFormData] = useState<formDataType>({
        storySubjectType: 'custom',
        wordCountLimit: '500-800',
        generateStoryCover: 'yes',
    });
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(false);
    const { isLoaded, isSignedIn, user: clerkUser } = useUser();
    console.log('clerkUser', clerkUser, 'isLoaded', isLoaded, 'isSignedIn', isSignedIn);
    const user = clerkUser;
    const TOTAL_STEPS = 3;
    const stepButtonMap: Record<number, string> = {
        1: '下一步：去哪做梦',
        2: '下一步：成长主题',
        3: '生成故事并朗读',
    };

    const onHandleUserSelection = useCallback((data: fieldData) => {
        setFormData((prev: any) => ({
            ...prev,
            [data.fieldName]: data.fieldValue,
        }));
    }, []);

    useEffect(() => {
        console.log('formData========all', formData);
    }, [formData]);

    // ========================接口调用========================
    // 查询用户信息
    const GetUserInfo = async (userId: string): Promise<any> => {
        try {
            const response = await fetch(`/api/users-prisma/${userId}`, {
                method: 'GET',
            });
            const result = await response.json();
            console.log('查询用户信息成功:', result);
            return result.data;
        } catch (error: any) {
            console.error('查询用户信息失败:', error);
            throw error;
        }
    }
    // 保存故事到数据库
    const SaveStory = async (storyData: any): Promise<any> => {
        try {
            const response = await fetch('/api/stories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(storyData),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || '创建故事失败');
            }

            return result.data;
        } catch (error: any) {
            console.error('保存故事失败:', error);
            throw error;
        }
    }

    // 消耗积分
    const ConsumeScore = async (userId: string, amount: number, storyId?: number): Promise<any> => {
        try {
            const response = await fetch('/api/scores/consume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    amount,
                    transactionType: 'CONSUME_STORY',
                    storyId,
                    description: `生成故事消耗 ${amount} 积分`,
                }),
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || '消耗积分失败');
            }

            return result.data;
        } catch (error: any) {
            console.error('消耗积分失败:', error);
            throw error;
        }
    }


    // 表单验证
    const validateForm = (): boolean => {
        if (!formData.ageGroup) {
            notifyError('请选择年龄组');
            return false;
        }
        if (!formData.dreamPlace) {
            notifyError('请选择故事世界');
            return false;
        }
        if (!formData.storySubjectType) {
            notifyError('请选择主题类型');
            return false;
        }
        if (formData.storySubjectType === 'classic') {
            if (!formData.storySubject) {
                notifyError('请选择经典主题');
                return false;
            }
        } else if (formData.storySubjectType === 'custom') {
            if (!formData.customStorySubject) {
                notifyError('请输入自定义主题');
                return false;
            }
        }
        if (!formData.characterSetting) {
            notifyError('请输入人物设定');
            return false;
        }
        if (!formData.wordCountLimit) {
            notifyError('请选择字数限制');
            return false;
        }
        if (!formData.generateStoryCover) {
            notifyError('请选择是否生成故事封面');
            return false;
        }
        return true;
    }

    // 生成故事（优化后：异步生成）
    const GenerateStory = async (): Promise<any> => {
        // 1. 表单验证
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // 2. 获取当前登录用户 ID
            const userId = user?.id;
            if (!userId) {
                notifyError('请先登录');
                setLoading(false);
                return;
            }

            // 3. 查询用户信息
            const userInfo = await GetUserInfo(userId);
            console.log('用户信息:', userInfo);
            console.log('formData', formData);
            
            // 4. 积分判断
            if (userInfo?.userScore?.balance < 10) {
                notifyError('积分不足，请先购买积分');
                setLoading(false);
                return;
            }

            // 5. 准备故事数据（带生成状态）
            const storyData = {
                userId: userId,
                ageGroup: formData.ageGroup,
                themeType: formData.storySubjectType === 'classic' ? 'CLASSIC' : 'CUSTOM',
                classicTheme: formData.storySubjectType === 'classic' ? formData.storySubject : null,
                classicSubTheme: formData.storySubjectType === 'classic' ? formData.storyChildSubject : null,
                customTheme: formData.storySubjectType === 'custom' ? formData.customStorySubject : null,
                characterSettings: JSON.stringify({
                    description: formData.characterSetting,
                }),
                wordLimit: parseInt(formData.wordCountLimit?.split('-')[1] || '500'),
                extData: JSON.stringify({
                    wordRange: formData.wordCountLimit,
                    generationStatus: 'pending',
                    generationStartedAt: new Date().toISOString(),
                }),
            };

            // 6. 保存故事基础信息
            const story = await SaveStory(storyData);
            console.log('故事创建成功:', story);

            // 7. 消耗积分
            try {
                await ConsumeScore(userId, 10, story.id);
                console.log('积分已扣除');
            } catch (error: any) {
                notifyError(error.message || '积分扣除失败');
                setLoading(false);
                return;
            }

            // 8. 触发异步生成任务（不等待结果，立即返回）
            fetch('/api/stories/generate-async', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({
                    storyId: story.id,
                    formData: formData,
                }),
            }).catch(err => {
                console.error('触发生成任务失败:', err);
            });

            // 9. 立即跳转到故事列表页
            notifySuccess('故事创建成功，正在生成内容...');
            
            setTimeout(() => {
                router.push('/to-explore-story');
                setLoading(false);
            }, 800);

        } catch (error: any) {
            console.error('生成故事失败:', error);
            notifyError(error.message || '生成故事失败');
            setLoading(false);
        }
    }

    const nextStep = () => {
        if (currentStep === 1 && !formData.ageGroup) {
            notifyError('请先完成主角信息');
            return;
        }
        if (currentStep === 2 && !formData.dreamPlace) {
            notifyError('请先选择今晚做梦的世界');
            return;
        }
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
    };

    const previousStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const onClickPrimaryButton = () => {
        if (currentStep < TOTAL_STEPS) {
            nextStep();
            return;
        }
        GenerateStory();
    };
    // 但是这里有一个问题，如果用户信息同步完成，页面会煽动一下，所以需要一个加载器
    if (!isLoaded) return <CustomLoader isLoading={true} />;
    // 未登录显示登录按钮
    if (!isSignedIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">请先登录</h2>
                    <p style={{ color: "var(--theme-text-muted)" }}>登录后即可创建精彩的故事</p>
                </div>
                <SignInButton mode="modal">
                    <Button
                        size="lg"
                        className="text-white font-semibold"
                        style={{
                            background:
                                "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                        }}
                    >
                        立即登录
                    </Button>
                </SignInButton>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen pb-44 md:pb-28" style={{ background: "var(--theme-bg-base)" }}>
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
                {currentStep === 1 ? (
                    <CharacterAndPartner userSelection={onHandleUserSelection} />
                ) : null}

                {currentStep === 2 ? (
                    <DreamPlace
                        ageGroup={formData.ageGroup}
                        userSelection={onHandleUserSelection}
                        onPrev={previousStep}
                    />
                ) : null}

                {currentStep === 3 ? (
                    <TodaySubject
                        userSelection={onHandleUserSelection}
                        onPrev={previousStep}
                    />
                ) : null}
            </div>

            <div
                className="fixed inset-x-0 bottom-[68px] z-40 backdrop-blur-sm md:bottom-0"
                style={{
                    borderTop: "1px solid var(--theme-border)",
                    background: "var(--theme-bg-surface)",
                }}
            >
                <div className="mx-auto flex w-full max-w-3xl items-center gap-3 p-4">
                    {currentStep > 1 ? (
                        <Button
                            size="lg"
                            radius="full"
                            variant="flat"
                            className="min-w-24"
                            style={{
                                background: "var(--theme-bg-subtle)",
                                color: "var(--theme-accent)",
                            }}
                            onPress={previousStep}
                            isDisabled={loading}
                        >
                            上一步
                        </Button>
                    ) : null}
                    <Button
                        size="lg"
                        radius="full"
                        className="h-14 flex-1 text-base font-semibold text-white shadow-lg hover:shadow-xl"
                        style={{
                            background:
                                "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                        }}
                        onPress={onClickPrimaryButton}
                        isLoading={loading}
                        isDisabled={loading}
                    >
                        {stepButtonMap[currentStep]}
                    </Button>
                </div>
            </div>
            <CustomLoader isLoading={loading} />
        </div>
    );
}
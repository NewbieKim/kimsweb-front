'use client';
import { useState, useEffect } from 'react';
import AgeGroup from './components/AgeGroup';
import StorySubjectForm from './components/StorySubjectForm';
import OtherInfo from './components/OtherInfo';
import { Button } from '@heroui/button';
import CustomLoader from '@/app/components/CustomLoader';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';

// 引入状态管理
import { useUserStore } from "@/stores/userStore";

// 接口定义
interface formDataType {
    ageGroup?: string;
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
    const [formData, setFormData] = useState<formDataType>({});
    const [loading, setLoading] = useState<boolean>(false);
    const { isLoaded, isSignedIn, user: clerkUser } = useUser();
    console.log('clerkUser', clerkUser, 'isLoaded', isLoaded, 'isSignedIn', isSignedIn);
    const user = clerkUser;
    const onHandleUserSelection = (data: fieldData) => {
        setFormData((prev: any) => ({
            ...prev,
            [data.fieldName]: data.fieldValue,
        }));
    };
    
    useEffect(() => {
        console.log('formData', formData);
    }, [formData]);

    // ========================接口调用========================
    // 查询用户信息
    const GetUserInfo = async (userId: number): Promise<any> => {
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
    const ConsumeScore = async (userId: number, amount: number, storyId?: number): Promise<any> => {
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
            // 2. 查询用户信息
            const userInfo = await GetUserInfo(2); // TODO: 使用真实用户ID
            console.log('用户信息:', userInfo);
            console.log('formData', formData);
            
            // 3. 积分判断
            if (userInfo?.userScore?.balance < 10) {
                notifyError('积分不足，请先购买积分');
                setLoading(false);
                return;
            }

            // 4. 准备故事数据（带生成状态）
            const storyData = {
                userId: userInfo.id,
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

            // 5. 保存故事基础信息
            const story = await SaveStory(storyData);
            console.log('故事创建成功:', story);

            // 6. 消耗积分
            try {
                await ConsumeScore(userInfo.id, 10, story.id);
                console.log('积分已扣除');
            } catch (error: any) {
                notifyError(error.message || '积分扣除失败');
                setLoading(false);
                return;
            }

            // 7. 触发异步生成任务（不等待结果，立即返回）
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

            // 8. 立即跳转到故事列表页
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

    // 生成提示词（为后续AI生成做准备）
    const generatePrompt = (formData: formDataType): string => {
        const theme = formData.storySubjectType === 'classic' 
            ? `主题是${formData.storySubject}，故事子主题是${formData.storyChildSubject ? ' - ' + formData.storyChildSubject : ''}`
            : formData.customStorySubject;
        const frontTip = '你是一个经验丰富的故事作家，擅长根据用户的需求生成故事。请根据用户的需求生成故事，故事内容要符合用户的需求，故事内容要生动有趣。现要求：';    
        return `${frontTip}。1.年龄组：${formData.ageGroup}。2.故事主题：${theme}。3.人物设定：人物设定是${formData.characterSetting}。4.字数限制：${formData.wordCountLimit}。5.按照文字自动划分段落，每段落不超过100字。`;
    }
    // if (!isLoaded) return <div>Loading...</div>;
    if (!isSignedIn) return <div>请先登录</div>;

    return (
        <div className="flex flex-col gap-4 p-4">
            <AgeGroup userSelection={onHandleUserSelection} />
            <StorySubjectForm userSelection={onHandleUserSelection}/>
            <OtherInfo userSelection={onHandleUserSelection}/>
            <div className="flex flex-row gap-4">
                <Button
                    size="lg" 
                    radius="full" 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow w-full cursor-pointer flex items-center justify-center"
                    onClick={() => GenerateStory()}
                    isLoading={loading}
                    isDisabled={loading}
                >
                    生成故事
                </Button>
            </div>
            <CustomLoader isLoading={loading} />
        </div>
    );
}
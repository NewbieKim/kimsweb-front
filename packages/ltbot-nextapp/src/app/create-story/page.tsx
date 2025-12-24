'use client';
import { useState, useEffect } from 'react';
import AgeGroup from './components/AgeGroup';
import StorySubjectForm from './components/StorySubjectForm';
import OtherInfo from './components/OtherInfo';
import { Button } from '@heroui/button';
import CustomLoader from '@/app/components/CustomLoader';
import { toast } from 'react-toastify';

// 引入状态管理
import { useUserStore } from "@/stores/userStore";

// 接口定义
interface formDataType {
    storySubject: {};
    imageStyle?: string;
    ageGroup?: string;
    characterSetting?: string;
    wordLimit?: string;
}
interface fieldData {
    fieldName: string;
    fieldValue: string;
}

export default function CreateStory() {
    const notify = (msg: string) => toast(msg);
    const notifyError = (msg: string) => toast.error(msg);
    const [formData, setFormData] = useState<formDataType>();
    const [loading, setLoading] = useState<boolean>(false);
    const { users } = useUserStore();

    const onHandleUserSelection = (data: fieldData) => {
        setFormData((prev: any) => ({
            ...prev,
            [data.fieldName]: data.fieldValue,
        }));
    };
    useEffect(() => {
        console.log('formData',formData);
    }, [formData]);

    // ========================接口定义========================
    const SaveFormData = async (formData: formDataType): Promise<any> => {
        console.log('SaveFormData',formData);
        // setLoading(true);
        // try {
        //     const result = await SaveFormData(formData);
        //     setLoading(false);
        //     return result;
        // } catch (e) {
        //     setLoading(false);
        // }
    }
    const GenerateStory = async (): Promise<any> => {
        // 1.积分判断
        if (users?.score < 100) {
            notifyError('积分不足，请先购买积分');
            return;
        }
        // setLoading(true);
        // 2.检查秘钥

        // 3.生成提示词
        // const prompt = await generatePrompt(formData);
        // 4.保存故事
        SaveFormData(formData as formDataType);
    }
    const generatePrompt = async (formData: formDataType): Promise<any> => {
        // 根据formData生成提示词
        const prompt = `
            故事主题：${formData.storySubject},
            故事字数：${formData.storyWordLimit},
            故事人物：${formData.storyCharacter},
            故事背景：${formData.storyBackground},
        `;
        return prompt;
    }
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
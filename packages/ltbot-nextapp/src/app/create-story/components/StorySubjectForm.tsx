"use client";
import React,{ useState } from 'react';
import Image from 'next/image';
import { StorySubjectList } from '@/constants';
import { Radio, RadioGroup } from '@heroui/radio';
import { Input, Textarea } from '@heroui/input';
import { CustomRadio } from '@/app/components/CustomRadio';

interface StorySubjectType {
    label: string;
    childSubjectList: {
        label: string;
        value: string;
    }[];
}

export default function StorySubjectForm({ userSelection }: any) {
    const [selectedStorySubject, setSelectedStorySubject] = useState<StorySubjectType | null>(null);
    const [selectedChildStorySubject, setSelectedChildStorySubject] = useState<{ label: string; value: string; } | null>(null);
    const [customStorySubject, setCustomStorySubject] = useState<string>('');

    const handleSelectStorySubject = (item: StorySubjectType) => {
        setSelectedStorySubject(item);
        userSelection({ fieldName: 'storySubject', fieldValue: item.label });
    }
    const handleSelectChildStorySubject = (item: { label: string; value: string; }) => {
        setSelectedChildStorySubject(item);
        userSelection({ fieldName: 'storyChildSubject', fieldValue: item.label });
    }
    const customStorySubjectChange = (e: any) => {
        setCustomStorySubject(e.target.value);
        userSelection({ fieldName: 'customStorySubject', fieldValue: e.target.value });
    }
    return (
        <div>
            <label className="font-bold text-xl text-primary">2. 故事主题</label>
            {/* <div className="flex flex-row gap-4">
                <RadioGroup label="选择主题类型" orientation="horizontal">
                    <Radio value="classic">经典主题</Radio>
                    <Radio value="custom">自定义主题</Radio>
                </RadioGroup>
            </div> */}
            <div className="w-full">
                <RadioGroup label="选择主题类型" orientation="horizontal" className="w-full">
                    {/* <div className="flex flex-wrap gap-3 w-full">
                        <CustomRadio description="根据你的选择生成故事" value="classic">
                            经典主题
                        </CustomRadio>
                        <CustomRadio description="根据你的输入生成故事" value="custom">
                            自定义主题
                        </CustomRadio>
                    </div> */}
                    <Radio value="classic">经典主题</Radio>
                    <Radio value="custom">自定义主题</Radio>
                </RadioGroup>
            </div>
            {/* 移动端每行显示3个主题，PC端每行显示6个主题 */}
            {/* 选择经典主题 */}
            <div className="flex flex-row gap-4">
                <label className="font-bold text-base text-primary">2.1 选择经典主题</label>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {StorySubjectList.map((item: StorySubjectType, index: number) => (
                    <div 
                        key={index}
                        className={`flex flex-col items-center justify-center rounded-xl p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg ${
                            selectedStorySubject?.label === item.label 
                                ? 'bg-gradient-to-br from-primary-100 via-purple-100 to-pink-100 border-2 border-primary-500 shadow-md' 
                                : 'bg-gradient-to-br from-gray-50 to-blue-50 border-2 border-gray-200 hover:from-blue-100 hover:to-indigo-100'
                        }`}
                        onClick={() => handleSelectStorySubject(item)}
                    >
                        <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                ))}
            </div>
            {/* 选择子主题 */}
            <div className="flex flex-row gap-4">
                <label className="font-bold text-base text-primary">2.2 选择子主题</label>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {selectedStorySubject?.childSubjectList.map((item: { label: string; value: string; }, index: number) => (
                    <div 
                        key={index}
                        className={`flex flex-col items-center justify-center rounded-xl p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg ${
                            selectedChildStorySubject?.label === item.label 
                                ? 'bg-gradient-to-br from-green-100 via-teal-100 to-cyan-100 border-2 border-primary-500 shadow-md' 
                                : 'bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-gray-200 hover:from-yellow-100 hover:to-orange-100'
                        }`}
                        onClick={() => handleSelectChildStorySubject(item)}
                    >
                        <span className="font-medium text-gray-700">{item.label}</span>
                    </div>
                ))}
            </div>
            {/* 自定义主题 */}
            <div className="flex flex-row gap-4">
                <label className="font-bold text-base text-primary">2.3 自定义主题</label>
            </div>
            <div className="w-full">
                <Textarea
                    isRequired
                    className="w-full"
                    label="故事主题"
                    labelPlacement="outside"
                    placeholder="写下你想要生成的故事主题"
                    value={customStorySubject}
                    onChange={(e: any) => customStorySubjectChange(e)}
                    minRows={3}
                />
            </div>
        </div>
    );
}
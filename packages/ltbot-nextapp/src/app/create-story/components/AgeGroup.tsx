"use client";
import React,{ useState } from 'react';
import { cn } from "@heroui/theme";
import Image from 'next/image';
// interface定义
interface createStoryPromptType {
    ageGroup: string,
    storyType: string,
    imageStyle: string,
    storySubject: string
}

interface OptionField {
    label: string;
    imageUrl: string;
    isFree: boolean;
  }

const createStoryAgeGroupOptionList = [
    {
        label: "0-2 岁",
        imageUrl: "/02Years.png",
        isFree: true,
    },
    {
        label: "3-5 岁",
        imageUrl: "/35Years.png",
        isFree: true,
    },
    {
        label: "5-8 岁",
        imageUrl: "/58Years.png",
        isFree: true,
    },
];

export default function AgeGroup({ userSelection }: any) {
    const [selectedAgeOption, setSelectedAgeOption] = useState<OptionField | null>(null);
    const selectAgeGroup = (item: OptionField) => {
        setSelectedAgeOption(item);
        userSelection({ fieldName: 'ageGroup', fieldValue: item.label });
    }
    return (
        <div>
            <label className="font-bold text-xl text-primary">1. 年龄组</label>
            <div className="flex flex-row gap-4">
                {createStoryAgeGroupOptionList.map((item: OptionField, index: number) => (
                    <div 
                        key={index}
                        className={cn(
                            "relative hover:scale-110 transition duration-300 cursor-pointer p-1",
                            selectedAgeOption?.label === item.label && "border-2 rounded-4xl border-primary-500"
                        )}
                        onClick={() => selectAgeGroup(item)}
                    >
                        <label className="absolute bottom-5 text-2xl text-white text-center w-full">{item.label}</label>
                        <Image
                            src={item.imageUrl}
                            alt={item.label}
                            width={300}
                            height={500}
                            className="object-cover h-[260px] rounded-3xl"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
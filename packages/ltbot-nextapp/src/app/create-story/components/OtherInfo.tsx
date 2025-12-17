"use client";
import { useState, useEffect } from 'react';
import { Input } from '@heroui/input';
import { Radio, RadioGroup } from '@heroui/radio';

export default function OtherInfo({ userSelection }: any) {
    const [characterSetting, setCharacterSetting] = useState<string>('');
    const characterSettingChange = (value: string) => {
        console.log('value',value);
        setCharacterSetting(value);
        userSelection({ fieldName: 'characterSetting', fieldValue: value });
    }
    useEffect(() => {
        console.log('characterSetting',characterSetting);
    }, [characterSetting]);
    return (
        <div className="flex flex-col gap-4">
            <div className="font-bold text-base text-primary">3.人物设定</div>
            <div>
                <Input
                    // label="人物设定"
                    labelPlacement="outside"
                    placeholder="写下你想要生成的故事人物设定"
                    value={characterSetting}
                    onValueChange={(value: string) => characterSettingChange(value)}
                />
            </div>
            <div className="font-bold text-base text-primary">4.字数限制</div>
            <div className="flex w-full flex-wrap gap-3">
                <RadioGroup
                    label="字数限制"
                    className="flex flex-wrap gap-3"
                    orientation="horizontal"
                >
                    <Radio value="300-500">300-500</Radio>
                    <Radio value="500-800">500-800</Radio>
                    <Radio value="800-1000">800-1000</Radio>
                </RadioGroup>
            </div>
        </div>
    );
}
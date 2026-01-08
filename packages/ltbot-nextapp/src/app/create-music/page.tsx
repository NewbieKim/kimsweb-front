'use client';
import { useState, useEffect } from 'react';
import { http } from "@/lib/request";
import { toast } from "react-toastify";
import { ApiResponse, User } from "@/types/response";
import { Button } from '@heroui/button';
import { useRouter } from 'next/navigation';

export default function CreateMusic() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">功能暂未开通</h2>
                <p className="text-gray-600">敬请期待！</p>
            </div>
            <Button
                size="lg"
                radius="full"
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow w-full cursor-pointer flex items-center justify-center"
                onClick={() => router.push('/')}
            >
                返回首页
            </Button>
        </div>
    );
}
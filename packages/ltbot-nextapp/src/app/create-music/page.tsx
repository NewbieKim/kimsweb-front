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
        <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: "var(--theme-bg-base)" }}>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">功能暂未开通</h2>
                <p style={{ color: "var(--theme-text-muted)" }}>敬请期待！</p>
            </div>
            <Button
                size="lg"
                className="text-white font-semibold"
                style={{
                    background:
                        "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                }}
                onClick={() => router.push('/')}
            >
                返回首页
            </Button>
        </div>
    );
}
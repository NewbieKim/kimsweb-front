"use client";
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// 检查是否为开发模式
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
console.log('isDevMode', isDevMode);
console.log('process.env.NEXT_PUBLIC_DEV_MODE', process.env.NEXT_PUBLIC_DEV_MODE);

const Page = () => {
  const router = useRouter();
  
  useEffect(() => {
    // 开发模式下自动重定向到dashboard
    if (isDevMode) {
      router.push('/dashboard');
    }
  }, [router]);
  
  // 开发模式下显示加载提示
  if (isDevMode) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">开发模式</h2>
          <p className="text-gray-600">正在自动登录...</p>
        </div>
      </div>
    );
  }
  
  return <SignUp />;
};
export default Page;

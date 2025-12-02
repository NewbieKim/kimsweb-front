import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <main className="flex flex-col gap-8 items-center p-8 bg-white rounded-lg shadow-md max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-blue-600">sleep space</h1>
        <p className="text-gray-700 text-center">
          该项目演示了 Next.js 的核心概念，包括路由、数据获取和渲染策略。
        </p>
      </main>
    </div>
  );
}

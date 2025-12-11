import Link from 'next/link';
import { Button } from "@heroui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* 左侧内容区 */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                在几分钟内为孩子们
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                创作一个神奇的睡眠空间
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-700 max-w-xl mx-auto lg:mx-0">
              欢迎来到AI睡眠空间，与孩子一起探索这个充满魔法和冒险的世界，让他们的想象力自由飞翔。
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/create-story">
                <Button
                  size="lg"
                  radius="full"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-shadow w-full cursor-pointer flex items-center justify-center"
                >
                  创作故事
                </Button>
              </Link>
              <Link href="/create-music">
                <Button
                  size="lg"
                  radius="full"
                  variant="bordered"
                  className="border-2 border-purple-300 text-purple-600 font-semibold text-lg px-8 py-6 hover:bg-purple-50 w-full cursor-pointer flex items-center justify-center"
                >
                  创作音乐
                </Button>
              </Link>
            </div>

            {/* 特点说明 */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mt-12">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center mx-auto lg:mx-0">
                  <span className="text-2xl">✨</span>
                </div>
                <h3 className="font-semibold text-purple-700">快速创作</h3>
                <p className="text-sm text-gray-600">几分钟即可生成</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center mx-auto lg:mx-0">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="font-semibold text-pink-700">个性定制</h3>
                <p className="text-sm text-gray-600">专属于您孩子的故事</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center mx-auto lg:mx-0">
                  <span className="text-2xl">🎵</span>
                </div>
                <h3 className="font-semibold text-green-700">睡前音乐</h3>
                <p className="text-sm text-gray-600">创作独特的睡前音乐</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto lg:mx-0">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="font-semibold text-blue-700">激发想象</h3>
                <p className="text-sm text-gray-600">培养阅读兴趣</p>
              </div>
            </div>
          </div>

          {/* 右侧插图区 */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-50"></div>
              
              {/* 插图占位 - 这里可以放置实际的插图 */}
              <div className="relative bg-gradient-to-br from-purple-300 via-pink-300 to-blue-300 rounded-3xl p-8 shadow-2xl">
                <div className="aspect-square flex flex-col items-center justify-center text-center space-y-6">
                  <div className="text-8xl">🧙‍♀️</div>
                  <div className="flex gap-4 justify-center">
                    <span className="text-6xl">👧</span>
                    <span className="text-6xl">👦</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-4xl">⭐</span>
                    <span className="text-4xl">🌙</span>
                    <span className="text-4xl">🌟</span>
                  </div>
                  <div className="text-2xl font-bold text-purple-700">
                    神奇的冒险故事
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    独特的睡前音乐
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

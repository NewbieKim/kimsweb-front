import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 检查是否为开发模式
const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// 创建受保护路由匹配器
const isProtectedRoute = createRouteMatcher(['/create-music(.*)', '/create-story(.*)']);

// 导出统一的中间件函数
export default isDevMode
  ? // 开发模式：直接返回简单的中间件函数
    (req: NextRequest) => {
      console.log('开发模式：跳过身份验证');
      return NextResponse.next();
    }
  : // 生产模式：使用 Clerk 中间件
    clerkMiddleware(async (auth: any, req: NextRequest) => {
      if (isProtectedRoute(req)) {
        // 报错：auth(...).protect is not a function
        // await auth().protect(); // 需要修改为正确的保护方式，使用auth().protect()方法
        // return NextResponse.redirect(new URL('/sign-in', req.url));
        return NextResponse.next();
      }
    });

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
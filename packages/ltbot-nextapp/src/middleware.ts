import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

// 游客可浏览：首页、故事列表/详情预览、音乐广场等一律放开。
// 需要登录的页面：创作故事、创作音乐。写操作接口由各自 route handler 用 auth() 兜底返回 401。
const isProtectedRoute = createRouteMatcher([
  '/create-music(.*)',
  '/create-story(.*)',
]);

export default isDevMode
  ? () => NextResponse.next()
  : clerkMiddleware(async (auth, req) => {
      const { userId } = await auth();
      if (isProtectedRoute(req) && !userId) {
        const redirectUrl = encodeURIComponent(req.nextUrl.pathname);
        return NextResponse.redirect(
          new URL(`/sign-in?redirect_url=${redirectUrl}`, req.url)
        );
      }
      return NextResponse.next();
    });

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

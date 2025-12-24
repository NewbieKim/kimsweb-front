import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI睡眠空间",
  description: "欢迎来到AI睡眠空间，创建有趣且个性化的故事，让孩子的冒险栩栩如生，激发他们的阅读热情。只需几秒钟！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      {/* safe-top safe-bottom: 避免iPhone的Safe Area影响布局 */}
      <body className="font-sans antialiased safe-top safe-bottom pb-15">
        <Providers>
          <Header />
          {children}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}

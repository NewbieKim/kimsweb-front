import type { Metadata } from "next";
import "./globals.css";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import { Providers } from "./providers";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import { Geist, Geist_Mono } from 'next/font/google'
import { zhCN } from '@/lib/clerkLocalization'
import UserSyncProvider from './components/UserSyncProvider'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

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
    <ClerkProvider localization={zhCN}>
      <html lang="en">
        <body className="font-sans antialiased safe-top safe-bottom pb-15">
          <Providers>
            <UserSyncProvider>
              <Header />
              {/* <SignedOut>
                <SignInButton />
                <SignUpButton>
                  <button className="bg-[#6c47ff] text-ceramic-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut> */}
              {children}
              <BottomNav />
            </UserSyncProvider>
        </Providers>
      </body>
      </html>
    </ClerkProvider>
  );
}

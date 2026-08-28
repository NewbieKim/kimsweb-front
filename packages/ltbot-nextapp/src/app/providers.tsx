"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AuthGateProvider from "@/app/components/AuthGateProvider"; // 认证门禁

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthGateProvider>
          {children}
          <ToastContainer />
        </AuthGateProvider>
      </HeroUIProvider>
    </ThemeProvider>
  );
}


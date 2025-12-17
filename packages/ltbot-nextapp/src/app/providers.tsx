"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system"; // 引入HeroUIProvider，作用是提供HeroUI的上下文
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function Providers({ children }: { children: React.ReactNode }) { // 定义Providers组件，接收children作为子组件
  return (
    <HeroUIProvider>
      {children}
      <ToastContainer />
    </HeroUIProvider>
  );
}


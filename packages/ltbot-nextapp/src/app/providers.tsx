"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        {children}
        <ToastContainer />
      </HeroUIProvider>
    </ThemeProvider>
  );
}


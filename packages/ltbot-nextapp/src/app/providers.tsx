"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      {children}
    </HeroUIProvider>
  );
}


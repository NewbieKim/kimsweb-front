"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type SiteTheme = "purple" | "beige";

interface ThemeContextValue {
  theme: SiteTheme;
  setTheme: (theme: SiteTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "purple",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>("purple");

  useEffect(() => {
    const saved = localStorage.getItem("site-theme") as SiteTheme;
    if (saved === "purple" || saved === "beige") {
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (t: SiteTheme) => {
    document.documentElement.setAttribute("data-site-theme", t);
    localStorage.setItem("site-theme", t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

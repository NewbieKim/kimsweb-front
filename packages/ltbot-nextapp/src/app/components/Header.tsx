"use client";
import React from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import Link from "next/link";
import { MenuList } from "@/constants";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      style={{
        background: "var(--theme-bg-surface)",
        borderBottom: "1px solid var(--theme-border)",
      }}
      className="p-2"
    >
      {/* Logo和品牌 */}
      <NavbarContent>
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--theme-gradient-from), var(--theme-gradient-to))",
              }}
            >
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <span
              className="font-bold text-xl bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
              }}
            >
              AI睡眠伙伴
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* 桌面端导航菜单 */}
      <NavbarContent className="hidden md:flex gap-6" justify="center">
        {MenuList.map((item) => (
          <NavbarItem key={item.path} isActive={pathname === item.path}>
            <Link
              href={item.path}
              className="transition-colors text-sm sm:text-base lg:text-base"
              style={{
                color:
                  pathname === item.path
                    ? "var(--theme-accent)"
                    : "var(--theme-text-muted)",
                fontWeight: pathname === item.path ? "600" : undefined,
              }}
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* 右侧按钮 */}
      <NavbarContent justify="end">
        <ThemeToggle />
        <button
          className="md:hidden transition-colors"
          style={{ color: "var(--theme-accent)" }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16m-7 6h7"
            />
          </svg>
        </button>
      </NavbarContent>

      {/* 移动端菜单 */}
      <NavbarMenu
        style={{ background: "var(--theme-bg-subtle)" }}
        className="pt-6"
      >
        {MenuList.map((item, index) => (
          <NavbarMenuItem key={`${item.path}-${index}`}>
            <Link
              href={item.path}
              className="w-full block py-2"
              style={{
                color:
                  pathname === item.path
                    ? "var(--theme-accent)"
                    : "var(--theme-text)",
                fontWeight: pathname === item.path ? "600" : undefined,
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
};

export default Header;

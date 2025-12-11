"use client";
import React from "react";
import { Button } from "@heroui/button";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/navbar";
import Link from "next/link";
import { MenuList } from "@/constants";
import { usePathname } from "next/navigation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    // nav高度变高 100px
    <Navbar
      height="100px"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      className="bg-gradient-to-r from-purple-50 to-pink-50"
    >
      {/* Logo和品牌 */}
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">AI</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI睡眠空间
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* 桌面端导航菜单 */}
      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        {MenuList.map((item) => (
          <NavbarItem key={item.path} isActive={pathname === item.path}>
            <Link
              href={item.path}
              className={`${
                pathname === item.path
                  ? "text-purple-600 font-semibold"
                  : "text-gray-700 hover:text-purple-600"
              } transition-colors`}
            >
              {item.name}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      {/* 右侧按钮 */}
      <NavbarContent justify="end">
        <NavbarItem className="hidden sm:flex">
          <Link href="/sponsor">
            <Button
              variant="bordered"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              仅赞助
            </Button>
          </Link>
        </NavbarItem>
        <NavbarItem>
          <Link href="/create-story">
            <Button
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold"
            >
              创作故事
            </Button>
          </Link>
        </NavbarItem>
      </NavbarContent>

      {/* 移动端菜单 */}
      <NavbarMenu className="bg-gradient-to-b from-purple-50 to-pink-50">
        {MenuList.map((item, index) => (
          <NavbarMenuItem key={`${item.path}-${index}`}>
            <Link
              href={item.path}
              className={`w-full ${
                pathname === item.path
                  ? "text-purple-600 font-semibold"
                  : "text-gray-700"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
            </Link>
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem>
          <Link
            href="/sponsor"
            className="w-full text-gray-700"
            onClick={() => setIsMenuOpen(false)}
          >
            仅赞助
          </Link>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
};

export default Header;

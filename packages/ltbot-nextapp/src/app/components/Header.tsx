"use client";
import React, { useState } from "react";
import {Button, ButtonGroup} from "@heroui/button";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@nextui-org/navbar";
import Image from "next/image";
import Link from "next/link";
import { MenuList } from "@/constants";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Navbar maxWidth="full">
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "关闭菜单" : "打开菜单"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Image src={"/logo.svg"} alt="logo" width={40} height={40} />
          <h2 className="font-bold text-2xl text-primary ml-3">AI故事魔法师</h2>
        </NavbarBrand>
      </NavbarContent>
      <NavbarContent justify="center" className="hidden sm:flex">
        {MenuList.map((item, index) => (
          <NavbarItem
            key={index}
            className="text-xl text-primary font-medium hover:underline mx-2"
          >
            <Link href={item.path}>{item.name}</Link>
          </NavbarItem>
        ))}
      </NavbarContent>
      <NavbarContent justify="end">
        <Link href={"/dashboard"}>
          <Button color="primary" size="lg" >
            立即开始
          </Button>
        </Link>
      </NavbarContent>
      <NavbarMenu>
        {MenuList.map((item, index) => (
          <NavbarMenuItem key={index}>
            <Link href={item.path}>{item.name}</Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
      <Button color="danger">Danger</Button>
    </Navbar>
    
  );
};

export default Header;



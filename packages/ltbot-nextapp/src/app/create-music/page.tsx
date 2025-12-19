'use client';
import { useState, useEffect } from 'react';
import { http } from "@/lib/request";

const toggleMenu = () => {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// 获取所有用户，调用API：/api/users-prisma
const getUsers = async (): Promise<any> => {
    const res = await http.get("/users-prisma");
    console.log('res', res);
    return res.data || [];
}

// 获取所有用户
const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users-prisma');
      if (!response.ok) throw new Error('获取用户失败');
      const data = await response.json();
    } catch (err) {
      console.error('获取用户失败', err);
    }
  };

export default async function CreateStory() {
    // useEffect(() => {
    //     // const fetchUsers = async () => {
    //     //     const users = await getUsers();
    //     //     console.log('users', users);
    //     // };
    //     fetchUsers();
    // }, []);
    return (
        <div>
            <form className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>............................................
                    <input type="email" name="email" id="email"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <input type="password" name="password" id="password"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <button type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    Sign in
                </button>
            </form>
        </div>
    );
}
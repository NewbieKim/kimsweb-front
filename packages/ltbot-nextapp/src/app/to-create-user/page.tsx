'use client';
import { useState, useEffect } from 'react';
import { http } from "@/lib/request";
import { toast } from "react-toastify";
import { ApiResponse, User } from "@/types/response";

export default function CreateMusic() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    // 获取用户列表
    const fetchUsers = async () => {
        try {
            const res: ApiResponse<User[]> = await http.get("/users-prisma");
            console.log('📥 获取用户列表响应:', res);
            
            if (res.success) {
                setUsers(res.data || []);
                console.log('✅ 用户数据:', res.data);
            } else {
                toast.error(res.message || '获取用户列表失败');
            }
        } catch (error: any) {
            console.error('❌ 获取用户失败:', error);
            toast.error(error.message || '获取用户列表失败');
        }
    };

    // 组件加载时获取用户列表
    useEffect(() => {
        fetchUsers();
    }, []);

    // 提交表单 - 创建用户
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        
        try {
            setLoading(true);
            const formData = new FormData(e.target as HTMLFormElement);
            const name = formData.get('name') as string;
            const email = formData.get('email') as string;

            // 简单验证
            if (!name || !email) {
                toast.error('请填写完整信息');
                return;
            }

            const res: ApiResponse<User> = await http.post('/users-prisma', { name, email });
            console.log('📥 创建用户响应:', res);
            
            if (res.success) {
                toast.success(res.message || '创建成功');
                // 清空表单
                (e.target as HTMLFormElement).reset();
                // 刷新用户列表
                await fetchUsers();
            } else {
                toast.error(res.message || '创建失败');
            }
        } catch (error: any) {
            console.error('❌ 创建用户失败:', error);
            toast.error(error.message || '创建用户失败');
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="max-w-4xl mx-auto p-6" style={{ background: "var(--theme-bg-base)" }}>
            <h1 className="text-3xl font-bold mb-6" style={{ color: "var(--theme-accent)" }}>用户管理</h1>

            {/* 创建用户表单 */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">创建新用户</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            姓名 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            required
                            placeholder="请输入姓名"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
                            style={{ borderColor: "var(--theme-border)" }}
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            邮箱 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            required
                            placeholder="请输入邮箱"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
                            style={{ borderColor: "var(--theme-border)" }}
                        />
                    </div>
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                            年龄
                        </label>
                        <input
                            type="number"
                            name="age"
                            id="age"
                            placeholder="请输入年龄（可选）"
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm"
                            style={{ borderColor: "var(--theme-border)" }}
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background:
                                    "linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))",
                            }}
                        >
                            {loading ? '创建中...' : '创建用户'}
                        </button>
                    </div>
                </form>
            </div>

            {/* 用户列表 */}
            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                    用户列表 <span className="text-sm text-gray-500">({users.length})</span>
                </h2>
                
                {users.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        暂无用户数据
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        姓名
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        邮箱
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        年龄
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        创建时间
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.age || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.createdAt).toLocaleString('zh-CN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEye, FiEyeOff } from 'react-icons/fi';

/**
 * 用户注册表单组件
 * 处理新用户注册流程
 */
export const RegisterForm = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    /**
     * 处理表单输入变化
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /**
     * 切换密码显示/隐藏
     */
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    /**
     * 处理注册表单提交
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // 表单验证
        if (!formData.username.trim()) {
            setError('请输入用户名');
            return;
        }
        
        if (!formData.email.includes('@')) {
            setError('请输入有效的邮箱地址');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('密码长度至少为6位');
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setError('两次输入的密码不一致');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            console.log('提交注册请求');
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await response.json();
            console.log('注册响应:', data);

            if (!response.ok) {
                throw new Error(data.error || '注册失败');
            }

            // 注册成功，重定向到登录页
            router.push('/');
        } catch (error) {
            console.error('注册失败:', error);
            setError(error instanceof Error ? error.message : '注册过程中出现错误');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
                        注册新账户
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        <span>已有账户？ </span>
                        <Link href="/" className="font-medium text-blue-600 hover:text-blue-500">
                            返回登录
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">
                                用户名
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="用户名"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                邮箱地址
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="邮箱地址"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password" className="sr-only">
                                密码
                            </label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="密码（至少6位）"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-3 flex items-center text-gray-400"
                                onClick={togglePasswordVisibility}
                            >
                                {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                            </button>
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">
                                确认密码
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="确认密码"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                                isLoading
                                    ? 'bg-blue-400'
                                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
                        >
                            {isLoading ? (
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <svg
                                        className="animate-spin h-5 w-5 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                </span>
                            ) : null}
                            {isLoading ? '注册中...' : '注册'}
                        </button>
                    </div>

                    <div className="text-center text-gray-400 text-xs mt-6">
                        <span>注册即表示您同意我们的 </span>
                        <a href="#" className="text-blue-400 hover:underline">服务条款</a>
                        <span> 和 </span>
                        <a href="#" className="text-blue-400 hover:underline">隐私政策</a>。
                    </div>
                </form>
            </div>
        </div>
    );
}; 
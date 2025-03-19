'use client';

import AuthGuard from '../components/auth/AuthGuard';

/**
 * 控制台页面
 * 仅管理员可访问
 */
export default function ConsolePage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">管理控制台</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">欢迎来到管理控制台</p>
          <p className="text-gray-600 mt-2">这里将展示管理功能...</p>
        </div>
      </div>
    </AuthGuard>
  );
} 
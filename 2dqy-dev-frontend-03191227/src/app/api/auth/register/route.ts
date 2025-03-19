import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

/**
 * 用户注册API
 * POST /api/auth/register
 */
export async function POST(request: Request) {
    try {
        console.log('收到注册请求');
        const { username, email, password } = await request.json();

        // 验证请求数据
        if (!username || !email || !password) {
            console.log('注册失败: 缺少必要字段');
            return NextResponse.json(
                { error: '请提供用户名、邮箱和密码' },
                { status: 400 }
            );
        }

        console.log(`尝试注册用户: ${username}, ${email}`);

        // 检查邮箱是否已存在
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('注册失败: 邮箱已存在');
            return NextResponse.json(
                { error: '该邮箱已被注册' },
                { status: 400 }
            );
        }

        // 密码加密
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建新用户
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: username,
                permission: 'user' // 默认为普通用户权限
            },
        });

        console.log(`注册成功，用户ID: ${user.id}`);

        return NextResponse.json({
            message: '注册成功',
            user: {
                id: user.id,
                username: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error('注册错误:', error);
        return NextResponse.json(
            { error: '注册过程中出现错误' },
            { status: 500 }
        );
    }
} 
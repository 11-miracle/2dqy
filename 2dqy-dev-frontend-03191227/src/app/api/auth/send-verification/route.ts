import {NextResponse} from 'next/server';
import nodemailer from 'nodemailer';
import {generateVerificationCode} from '@/lib/utils';
import {storeVerificationCode, hasActiveCode, getCodeRemainingTime, debugListAllCodes} from '@/lib/codeCache';

// 邮件发送配置
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

/**
 * 发送验证码
 * POST /api/auth/send-verification
 */
export async function POST(request: Request) {
    try {
        console.log('收到发送验证码请求');
        const {email} = await request.json();

        console.log(`请求发送验证码到邮箱: ${email}`);

        if (!email) {
            console.log('发送失败: 邮箱地址为空');
            return NextResponse.json(
                {message: '邮箱地址不能为空'},
                {status: 400}
            );
        }

        // 检查是否已经有未过期的验证码
        if (hasActiveCode(email)) {
            const remainingSeconds = getCodeRemainingTime(email);
            console.log(`已存在有效的验证码，剩余时间: ${remainingSeconds}秒`);
            return NextResponse.json(
                {
                    message: `请等待${remainingSeconds}秒后再重新发送验证码`,
                    remainingSeconds
                },
                {status: 429} // Too Many Requests
            );
        }

        // 生成6位数验证码
        const verificationCode = generateVerificationCode();
        console.log(`生成验证码: ${verificationCode}`);

        // 保存验证码到缓存，2分钟过期
        storeVerificationCode(email, verificationCode, 120);
        console.log(`为邮箱 ${email} 存储验证码: ${verificationCode}`);

        // 输出当前所有缓存的验证码(调试用)
        debugListAllCodes();

        // 发送验证码邮件
        console.log('准备发送验证码邮件...');
        await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: email,
            subject: '密码重置验证码',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>密码重置验证码</h2>
                    <p>您的验证码是：<strong style="font-size: 20px; color: #4A90E2;">${verificationCode}</strong></p>
                    <p>此验证码将在2分钟后过期。</p>
                    <p>如果这不是您的操作，请忽略此邮件。</p>
                </div>
            `,
        });
        console.log('验证码邮件发送成功');

        return NextResponse.json(
            {message: '验证码已发送到您的邮箱'},
            {status: 200}
        );
    } catch (error) {
        console.error('发送验证码失败:', error);
        return NextResponse.json(
            {message: '发送验证码失败'},
            {status: 500}
        );
    }
} 
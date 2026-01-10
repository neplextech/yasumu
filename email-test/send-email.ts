import { createTransport } from 'nodemailer';

const transport = createTransport({
  host: 'localhost',
  port: 50611,
});

const otp = [...'0123456789']
  .sort(() => 0.5 - Math.random())
  .slice(0, 6)
  .join('');

await transport.sendMail({
  from: 'test@example.com',
  to: 'test@example.com',
  subject: 'Your Yasumu Verification Code',
  text: `Hi there!\n\nYour verification code is: ${otp}\n\nThis code will expire in 10 minutes. If you didn't request this code, please ignore this email.\n\nThe Yasumu Team`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
      <div style="background-color: #1e293b; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        <h1 style="color: #60a5fa; margin-bottom: 20px;">Verification Code 🔐</h1>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 16px;">Hi there!</p>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 16px;">
          Use the following code to verify your account on <strong>Yasumu</strong>:
        </p>
        
        <div style="background-color: #334155; padding: 24px; border-radius: 6px; margin: 24px 0; text-align: center;">
          <span data-otp="${otp}" style="font-size: 32px; font-weight: bold; color: #60a5fa; letter-spacing: 8px; font-family: monospace;">${otp}</span>
        </div>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">
          This code will expire in <strong>10 minutes</strong>.
        </p>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">
          If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
        </p>
        
        <p style="color: #94a3b8; font-style: italic;">The Yasumu Team</p>
        
        <hr style="border: none; border-top: 1px solid #475569; margin: 30px 0;">
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          This email was sent to you because a verification code was requested for your Yasumu account.
          If you didn't request this code, please ignore this email.
        </p>
      </div>
    </div>
  `,
});

import { createTransport } from 'nodemailer';

const transport = createTransport({
  host: 'localhost',
  port: 50611,
  auth: {
    user: 'test@example.com',
    pass: 'test',
  },
});

await transport.sendMail({
  from: 'test@example.com',
  to: 'test@example.com',
  subject: 'Welcome to Yasumu Again - Your Account is Ready!',
  text: "Hi there!\n\nWelcome to Yasumu! We're excited to have you on board.\n\nYour account has been successfully created and is ready to use. You can now start building and testing your APIs with our powerful development tools.\n\nHere are some quick links to get you started:\n- Dashboard: https://yasumu.dev/dashboard\n- Documentation: https://docs.yasumu.dev\n- Community: https://discord.gg/yasumu\n\nIf you have any questions or need assistance, don't hesitate to reach out to our support team at support@yasumu.dev.\n\nHappy coding!\n\nThe Yasumu Team",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f172a;">
      <div style="background-color: #1e293b; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">
        <h1 style="color: #60a5fa; margin-bottom: 20px;">Welcome to Yasumu! 🎉</h1>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 16px;">Hi there!</p>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 16px;">
          Welcome to <strong>Yasumu</strong>! We're excited to have you on board.
        </p>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">
          Your account has been successfully created and is ready to use. You can now start building and testing your APIs with our powerful development tools.
        </p>
        
        <div style="background-color: #334155; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #f1f5f9; margin-top: 0; margin-bottom: 12px;">Quick Links to Get Started:</h3>
          <ul style="color: #e2e8f0; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li><a href="https://yasumu.dev/dashboard" style="color: #60a5fa; text-decoration: none;">Dashboard</a></li>
            <li><a href="https://docs.yasumu.dev" style="color: #60a5fa; text-decoration: none;">Documentation</a></li>
            <li><a href="https://discord.gg/yasumu" style="color: #60a5fa; text-decoration: none;">Community</a></li>
          </ul>
        </div>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 20px;">
          If you have any questions or need assistance, don't hesitate to reach out to our support team at 
          <a href="mailto:support@yasumu.dev" style="color: #60a5fa; text-decoration: none;">support@yasumu.dev</a>.
        </p>
        
        <p style="color: #e2e8f0; line-height: 1.6; margin-bottom: 8px;">Happy coding!</p>
        <p style="color: #94a3b8; font-style: italic;">The Yasumu Team</p>
        
        <hr style="border: none; border-top: 1px solid #475569; margin: 30px 0;">
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
          This email was sent to you because you created an account on Yasumu. 
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    </div>
  `,
});

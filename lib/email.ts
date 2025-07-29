import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"BoostGram AI" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
    });

    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

export function getWelcomeEmailTemplate(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to BoostGram AI</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Welcome to BoostGram AI!</h1>
        </div>
        <div class="content">
          <h2>Hello ${name}!</h2>
          <p>Thank you for joining BoostGram AI, the most advanced platform for growing your Telegram communities.</p>
          
          <h3>What's Next?</h3>
          <ul>
            <li>✅ Complete your profile setup</li>
            <li>🎯 Create your first growth request</li>
            <li>📊 Monitor your community analytics</li>
            <li>🚀 Watch your community grow!</li>
          </ul>
          
          <p>You've been credited with <strong>100 free credits</strong> to get started!</p>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
          
          <p>If you have any questions, our support team is here to help.</p>
          
          <p>Best regards,<br>The BoostGram AI Team</p>
        </div>
        <div class="footer">
          <p>© 2024 BoostGram AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function getOrderCompletedEmailTemplate(name: string, orderDetails: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Completed - BoostGram AI</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Order Completed Successfully!</h1>
        </div>
        <div class="content">
          <h2>Great news, ${name}!</h2>
          <p>Your community growth request has been completed successfully.</p>
          
          <div class="order-details">
            <h3>Order Details:</h3>
            <p><strong>Group:</strong> ${orderDetails.groupLink}</p>
            <p><strong>Members Added:</strong> ${orderDetails.currentCount.toLocaleString()}</p>
            <p><strong>Completion Date:</strong> ${new Date(orderDetails.completedAt).toLocaleDateString()}</p>
          </div>
          
          <p>Your Telegram community is now growing stronger! Monitor your analytics and consider creating additional growth requests to maintain momentum.</p>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">View Dashboard</a>
          
          <p>Thank you for choosing BoostGram AI!</p>
          
          <p>Best regards,<br>The BoostGram AI Team</p>
        </div>
        <div class="footer">
          <p>© 2024 BoostGram AI. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initPromise = this.initTransporter();
  }

  async initTransporter() {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      console.log('📧 EmailService: Configured with custom SMTP server.');
    } else {
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log(`📧 EmailService: Created Ethereal Test Account (${testAccount.user})`);
      } catch (err) {
        console.warn('⚠️ EmailService: Failed to create test account, fallback to JSON log transporter');
        this.transporter = nodemailer.createTransport({
          jsonTransport: true
        });
      }
    }
  }

  async sendMail(mailOptions) {
    await this.initPromise;
    try {
      const info = await this.transporter.sendMail(mailOptions);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`📧 Preview Email URL: ${previewUrl}`);
      }
      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      console.error('❌ Email sending error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendOTPEmail(to, name, otp) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"BedFlow AI" <noreply@bedflow.ai>',
      to,
      subject: '🔐 Your Verification Code - BedFlow AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #38bdf8; margin-bottom: 8px;">BedFlow AI Verification</h2>
          <p style="color: #94a3b8; font-size: 16px;">Hello ${name || 'User'},</p>
          <p style="color: #e2e8f0; font-size: 15px;">Your one-time verification code (OTP) for authenticating your account is:</p>
          
          <div style="background: #1e293b; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px dashed #38bdf8;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8;">${otp}</span>
          </div>

          <p style="color: #94a3b8; font-size: 13px;">This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
          <p style="color: #64748b; font-size: 12px; text-align: center;">BedFlow AI - Intelligent Real-Time Hospital Bed Management System</p>
        </div>
      `
    };
    return this.sendMail(mailOptions);
  }

  async sendPasswordResetEmail(to, name, otp) {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"BedFlow AI Security" <security@bedflow.ai>',
      to,
      subject: '🔑 Password Reset Code - BedFlow AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #334155;">
          <h2 style="color: #f43f5e; margin-bottom: 8px;">Reset Your Password</h2>
          <p style="color: #94a3b8; font-size: 16px;">Hello ${name || 'User'},</p>
          <p style="color: #e2e8f0; font-size: 15px;">We received a request to reset your password. Use the verification code below to reset it:</p>
          
          <div style="background: #1e293b; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0; border: 1px dashed #f43f5e;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #fb7185;">${otp}</span>
          </div>

          <p style="color: #94a3b8; font-size: 13px;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `
    };
    return this.sendMail(mailOptions);
  }

  async sendReportEmail(to, subject, reportBuffer, fileName, format = 'pdf') {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"BedFlow AI Analytics" <reports@bedflow.ai>',
      to,
      subject: subject || 'Hospital Bed Management Report',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px;">
          <h2 style="color: #38bdf8;">Hospital Analytics Report</h2>
          <p>Please find the attached operational report generated from BedFlow AI.</p>
          <div style="background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 4px 0;"><strong>Format:</strong> ${format.toUpperCase()}</p>
            <p style="margin: 4px 0;"><strong>File:</strong> ${fileName}</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: reportBuffer,
          contentType: format === 'pdf' ? 'application/pdf' : 'text/csv'
        }
      ]
    };
    return this.sendMail(mailOptions);
  }
}

module.exports = new EmailService();

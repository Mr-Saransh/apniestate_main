import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zoho.in",
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const mailerService = {
  async sendOtpEmail(to: string, otp: string) {
    try {
      const mailOptions = {
        from: '"Apniestate Tech" <tech@apniestate.com>',
        to,
        subject: "Your OTP Code for Apniestate",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Apniestate Authentication</h2>
            <p>Your One-Time Password (OTP) for login/registration is:</p>
            <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
            <p>This code is valid for 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending OTP email:", error);
      return false;
    }
  },

  async sendChannelPartnerWelcomeEmail(to: string, partnerName: string, referralCode: string, companyName: string = "Apniestate") {
    try {
      if (!to || !to.includes('@')) {
        console.warn("Skipping channel partner email: invalid email address", to);
        return false;
      }
      const mailOptions = {
        from: '"Apniestate Partnerships" <tech@apniestate.com>',
        to,
        subject: `Welcome as Channel Partner - Your Referral Code: ${referralCode}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #1e293b; margin: 0; font-size: 24px;">Welcome to ${companyName} Channel Partner Network</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 6px;">We are excited to partner with you!</p>
            </div>
            
            <p style="color: #334155; font-size: 15px;">Hello <strong>${partnerName}</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              You have been registered as an official Channel Partner. You can now refer clients and close real estate deals to earn attractive commissions.
            </p>

            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
              <span style="font-size: 12px; font-weight: bold; color: #1e40af; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive Referral Code</span>
              <h1 style="color: #1d4ed8; letter-spacing: 4px; font-size: 32px; margin: 8px 0 4px 0;">${referralCode}</h1>
              <p style="color: #3b82f6; font-size: 12px; margin: 0;">Share this code with your clients or team when booking properties</p>
            </div>

            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">
              Every deal booked with your referral code will be automatically tracked in the system, and your performance metrics will be reflected on your dashboard.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
              &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
            </p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Channel partner welcome email sent: %s", info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending channel partner welcome email:", error);
      return false;
    }
  },
};

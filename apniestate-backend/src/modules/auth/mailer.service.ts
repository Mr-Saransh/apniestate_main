import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const host = (process.env.SMTP_HOST || "smtp.zoho.in").replace(/^["']|["']$/g, '').trim();
  const port = Number((process.env.SMTP_PORT || "465").toString().replace(/^["']|["']$/g, '').trim()) || 465;
  const user = (process.env.SMTP_USER || "tech@apniestate.com").replace(/^["']|["']$/g, '').trim();
  const pass = (process.env.SMTP_PASS || "").replace(/^["']|["']$/g, '').trim();
  return { host, port, user, pass };
}

function getTransporter() {
  const cfg = getSmtpConfig();
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.port === 465,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

export const mailerService = {
  async sendOtpEmail(to: string, otp: string) {
    try {
      const cfg = getSmtpConfig();
      const transporter = getTransporter();
      const mailOptions = {
        from: `"Apniestate Tech" <${cfg.user}>`,
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
      console.log("OTP Email sent to %s: %s", to, info.messageId);
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
      const cfg = getSmtpConfig();
      const transporter = getTransporter();
      const mailOptions = {
        from: `"Apniestate Partnerships" <${cfg.user}>`,
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
      console.log("Channel partner welcome email sent to %s: %s", to, info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending channel partner welcome email:", error);
      return false;
    }
  },

  async sendUserInvitationEmail(data: {
    to: string;
    role: string;
    companyName: string;
    inviterName: string;
    inviteLink?: string;
  }) {
    try {
      const { to, role, companyName, inviterName } = data;
      if (!to || !to.includes('@')) {
        console.warn("Skipping invitation email: invalid email address", to);
        return false;
      }
      const cfg = getSmtpConfig();
      const transporter = getTransporter();
      const inviteUrl = data.inviteLink || `${process.env.FRONTEND_URL || 'https://build.apniestate.com'}/auth/register?email=${encodeURIComponent(to)}`;
      const formattedRole = role.replace(/_/g, ' ');

      const mailOptions = {
        from: `"Apniestate" <${cfg.user}>`,
        to,
        subject: `You've been invited to join ${companyName} on Apniestate`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 24px;">Join ${companyName} on Apniestate</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Construction ERP & Real Estate Platform</p>
            </div>

            <p style="color: #334155; font-size: 15px;">Hello,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              <strong>${inviterName}</strong> has invited you to collaborate in <strong>${companyName}</strong> on the Apniestate platform with the role of:
            </p>

            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
              <span style="font-size: 12px; font-weight: bold; color: #166534; text-transform: uppercase; letter-spacing: 1px;">Assigned Role</span>
              <h3 style="color: #15803d; font-size: 20px; margin: 4px 0 0 0;">${formattedRole}</h3>
            </div>

            <p style="color: #334155; font-size: 14px; line-height: 1.5;">
              Click below to activate your account or sign in to accept your invitation:
            </p>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${inviteUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                Accept Invitation & Access Workspace
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; word-break: break-all;">
              Or copy this link into your browser:<br/>
              <a href="${inviteUrl}" style="color: #2563eb;">${inviteUrl}</a>
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
              &copy; ${new Date().getFullYear()} ${companyName}. Powered by Apniestate.
            </p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("User invitation email sent successfully to %s: %s", to, info.messageId);
      return true;
    } catch (error) {
      console.error("Error sending user invitation email:", error);
      return false;
    }
  },
};

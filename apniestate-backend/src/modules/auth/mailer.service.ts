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
};

import { NextRequest } from "next/server";
import { SendOtpSchema } from "@/modules/auth/auth.schema";
import { validateBody } from "@/middleware/validate.middleware";
import { ok, badRequest } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { mailerService } from "@/modules/auth/mailer.service";

export async function POST(req: NextRequest) {
  const parsed = await validateBody(req, SendOtpSchema);
  if ("error" in parsed) return parsed.error;

  const { email } = parsed.data;

  // Generate a 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await prisma.otpVerification.upsert({
      where: { email },
      update: { otp, expires_at },
      create: { email, otp, expires_at },
    });

    const sent = await mailerService.sendOtpEmail(email, otp);
    if (!sent) {
      return badRequest("Failed to send OTP email.");
    }

    return ok(null, "OTP sent successfully");
  } catch (error: any) {
    console.error("Error generating OTP:", error);
    return badRequest("An error occurred while generating OTP.");
  }
}

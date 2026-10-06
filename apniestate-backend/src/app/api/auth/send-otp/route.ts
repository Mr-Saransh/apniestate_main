import { NextRequest } from "next/server";
import { SendOtpSchema } from "@/modules/auth/auth.schema";
import { validateBody } from "@/middleware/validate.middleware";
import { ok, badRequest, conflict, notFound } from "@/lib/response";
import { prisma } from "@/lib/prisma";
import { mailerService } from "@/modules/auth/mailer.service";

export async function POST(req: NextRequest) {
  const parsed = await validateBody(req, SendOtpSchema);
  if ("error" in parsed) return parsed.error;

  const email = parsed.data.email.trim().toLowerCase();
  const type = parsed.data.type;

  // Check user existence based on purpose
  if (type === "signup") {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (existing) {
      return conflict("An account with this email already exists. Please sign in instead.");
    }
  } else if (type === "login") {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    if (!existing) {
      return notFound("No account found with this email. Please create an account first.");
    }
  }

  // Generate a 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await prisma.otpVerification.upsert({
      where: { email },
      update: { otp, expires_at },
      create: { email, otp, expires_at },
    });

    console.log("[OTP] Generated OTP for %s: %s", email, otp);

    const sent = await mailerService.sendOtpEmail(email, otp);
    if (!sent) {
      return badRequest("Unable to send OTP email. Please verify your email address or try again.");
    }

    return ok(null, "OTP sent successfully to your email.");
  } catch (error: any) {
    console.error("Error generating OTP:", error);
    return badRequest("An error occurred while generating OTP.");
  }
}

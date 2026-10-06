import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().optional(),
  otp: z.string().optional(),
}).refine(data => data.password || data.otp, {
  message: "Either password or OTP is required",
  path: ["password"],
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  otp: z.string().min(6, "OTP is required"),
});

export type SignupInput = z.infer<typeof SignupSchema>;

export const SendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  type: z.enum(["signup", "login"]).optional(),
});

export type SendOtpInput = z.infer<typeof SendOtpSchema>;


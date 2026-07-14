import { z } from "zod";

export const LoginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type SignupInput = z.infer<typeof SignupSchema>;

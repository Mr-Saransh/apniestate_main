import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type SignupInput = z.infer<typeof SignupSchema>;

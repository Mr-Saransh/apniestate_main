import { z } from "zod";

export const CompleteProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
});

export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;

export const CreateOrderSchema = z.object({
  plan_id: z.enum(["PLAN_30K", "PLAN_50K", "PLAN_100K"]).default("PLAN_30K"),
  duration_months: z.number().int().refine((val) => [4, 6, 12].includes(val), {
    message: "Duration must be 4, 6, or 12 months",
  }).default(4),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export const PaySubscriptionSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  plan_id: z.enum(["PLAN_30K", "PLAN_50K", "PLAN_100K"]).default("PLAN_30K"),
  duration_months: z.number().int().refine((val) => [4, 6, 12].includes(val)).default(4),
});

export type PaySubscriptionInput = z.infer<typeof PaySubscriptionSchema>;

export const RenewSubscriptionSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  plan_id: z.enum(["PLAN_30K", "PLAN_50K", "PLAN_100K"]).default("PLAN_30K"),
  duration_months: z.number().int().refine((val) => [4, 6, 12].includes(val)).default(4),
});

export type RenewSubscriptionInput = z.infer<typeof RenewSubscriptionSchema>;

export const SelectPlanSchema = z.object({
  plan_id: z.enum(["PLAN_30K", "PLAN_50K", "PLAN_100K"]),
  duration_months: z.number().int().refine((val) => [4, 6, 12].includes(val)),
});

export type SelectPlanInput = z.infer<typeof SelectPlanSchema>;

import { z } from "zod";

export const CompleteProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
});

export type CompleteProfileInput = z.infer<typeof CompleteProfileSchema>;

export const PaySubscriptionSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
});

export type PaySubscriptionInput = z.infer<typeof PaySubscriptionSchema>;

export const RenewSubscriptionSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
});

export type RenewSubscriptionInput = z.infer<typeof RenewSubscriptionSchema>;

import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/jwt";
import type { Role } from "@/types";
import type { CompleteProfileInput, PaySubscriptionInput } from "./subscription.schema";
import crypto from "crypto";

const SUBSCRIPTION_AMOUNT = 31999; // ₹31,999 per month
const TRIAL_DAYS = 15;

// ─── Profile Completion ──────────────────────────────────

export async function completeProfile(userId: string, input: CompleteProfileInput) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      phone: input.phone,
      city: input.city,
      state: input.state,
      profile_completed: true,
    },
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    city: user.city,
    state: user.state,
    profile_completed: user.profile_completed,
    subscription_status: user.subscription_status,
    company_id: user.company_id,
    onboarded: user.onboarded,
    last_workspace_id: user.last_workspace_id,
  };
}

// ─── Razorpay Order Creation ────────────────────────────

export async function createRazorpayOrder() {
  const Razorpay = (await import("razorpay")).default;
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });

  const order = await razorpay.orders.create({
    amount: SUBSCRIPTION_AMOUNT * 100, // Razorpay expects paise
    currency: "INR",
    receipt: `sub_${Date.now()}`,
    notes: {
      purpose: "Apni Estate Monthly Subscription",
    },
  });

  return order;
}

// ─── Payment Verification & Workspace Creation ──────────

export async function verifyAndActivateSubscription(
  userId: string,
  input: PaySubscriptionInput
) {
  // Verify Razorpay signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== input.razorpay_signature) {
    throw new Error("Payment verification failed — invalid signature");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // Transaction: create subscription, company, membership
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Create company/workspace
    const company = await tx.company.create({
      data: { name: `${user.name}'s Workspace` },
    });

    // Create membership
    const membership = await tx.companyMembership.create({
      data: {
        user_id: userId,
        company_id: company.id,
        roles: ["BUILDER"],
        status: "ACTIVE",
      },
    });

    // Create subscription record
    const subscription = await tx.subscription.create({
      data: {
        user_id: userId,
        type: "PAID",
        status: "ACTIVE",
        amount: SUBSCRIPTION_AMOUNT,
        starts_at: now,
        expires_at: expiresAt,
        payment_id: input.razorpay_payment_id,
        razorpay_order_id: input.razorpay_order_id,
        razorpay_signature: input.razorpay_signature,
      },
    });

    // Update user
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        subscription_status: "ACTIVE",
        onboarded: true,
        company_id: company.id,
        last_workspace_id: company.id,
      },
    });

    return { user: updatedUser, company, membership, subscription };
  });

  // Generate new token with company_id
  const accessToken = signAccessToken({
    sub: result.user.id,
    email: result.user.email || "",
    role: result.user.role as Role,
    company_id: result.company.id,
  });

  return {
    accessToken,
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email || "",
      role: result.user.role as Role,
      company_id: result.company.id,
      onboarded: true,
      last_workspace_id: result.company.id,
      profile_completed: result.user.profile_completed,
      subscription_status: "ACTIVE" as const,
      phone: result.user.phone,
      city: result.user.city,
      state: result.user.state,
    },
    subscription: {
      id: result.subscription.id,
      type: result.subscription.type,
      status: result.subscription.status,
      starts_at: result.subscription.starts_at,
      expires_at: result.subscription.expires_at,
    },
    memberships: [
      {
        id: result.membership.id,
        user_id: result.membership.user_id,
        company_id: result.membership.company_id,
        roles: result.membership.roles,
        status: result.membership.status,
        company: {
          id: result.company.id,
          name: result.company.name,
        },
      },
    ],
  };
}

// ─── Trial Request ──────────────────────────────────────

export async function requestTrial(userId: string) {
  const existingTrial = await prisma.subscription.findFirst({
    where: {
      user_id: userId,
      type: "TRIAL",
    },
  });

  if (existingTrial) {
    throw new Error("You have already requested or used a free trial.");
  }

  const subscription = await prisma.subscription.create({
    data: {
      user_id: userId,
      type: "TRIAL",
      status: "PENDING_TRIAL",
      starts_at: new Date(), // Will be updated when admin approves
      expires_at: new Date(), // Will be updated when admin approves
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { subscription_status: "PENDING_TRIAL" },
  });

  return subscription;
}

// ─── Get Subscription Status ─────────────────────────────

export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscription_status: true,
      profile_completed: true,
    },
  });

  const activeSubscription = await prisma.subscription.findFirst({
    where: {
      user_id: userId,
      status: { in: ["ACTIVE", "TRIAL_ACTIVE", "EXPIRING_SOON", "PENDING_TRIAL"] },
    },
    orderBy: { created_at: "desc" },
  });

  let daysRemaining = 0;
  if (activeSubscription && activeSubscription.expires_at) {
    daysRemaining = Math.max(
      0,
      Math.ceil(
        (activeSubscription.expires_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );
  }

  return {
    subscription_status: user?.subscription_status || "NONE",
    profile_completed: user?.profile_completed || false,
    subscription: activeSubscription
      ? {
          id: activeSubscription.id,
          type: activeSubscription.type,
          status: activeSubscription.status,
          starts_at: activeSubscription.starts_at,
          expires_at: activeSubscription.expires_at,
          days_remaining: daysRemaining,
        }
      : null,
  };
}

// ─── Renew Subscription ─────────────────────────────────

export async function renewSubscription(
  userId: string,
  input: PaySubscriptionInput
) {
  // Verify Razorpay signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== input.razorpay_signature) {
    throw new Error("Payment verification failed — invalid signature");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Mark old subscriptions as expired
  await prisma.subscription.updateMany({
    where: { user_id: userId, status: { in: ["EXPIRED", "TRIAL_EXPIRED", "EXPIRING_SOON"] } },
    data: { status: "EXPIRED" },
  });

  // Create new subscription
  const subscription = await prisma.subscription.create({
    data: {
      user_id: userId,
      type: "PAID",
      status: "ACTIVE",
      amount: SUBSCRIPTION_AMOUNT,
      starts_at: now,
      expires_at: expiresAt,
      payment_id: input.razorpay_payment_id,
      razorpay_order_id: input.razorpay_order_id,
      razorpay_signature: input.razorpay_signature,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { subscription_status: "ACTIVE" },
  });

  return {
    subscription: {
      id: subscription.id,
      type: subscription.type,
      status: subscription.status,
      starts_at: subscription.starts_at,
      expires_at: subscription.expires_at,
    },
  };
}

// ─── Admin: Approve Trial ────────────────────────────────

export async function approveTrial(userId: string, adminId: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction(async (tx) => {
    // Find the pending trial
    const trial = await tx.subscription.findFirst({
      where: { user_id: userId, status: "PENDING_TRIAL" },
    });
    if (!trial) throw new Error("No pending trial found for this user");

    // Update the subscription
    await tx.subscription.update({
      where: { id: trial.id },
      data: {
        status: "TRIAL_ACTIVE",
        starts_at: now,
        expires_at: expiresAt,
        approved_by: adminId,
      },
    });

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    // Create company/workspace for the user
    const company = await tx.company.create({
      data: { name: `${user.name}'s Workspace` },
    });

    await tx.companyMembership.create({
      data: {
        user_id: userId,
        company_id: company.id,
        roles: ["BUILDER"],
        status: "ACTIVE",
      },
    });

    // Update user status
    await tx.user.update({
      where: { id: userId },
      data: {
        subscription_status: "TRIAL_ACTIVE",
        onboarded: true,
        company_id: company.id,
        last_workspace_id: company.id,
      },
    });

    return { trial, company };
  });

  return result;
}

// ─── Admin: Reject Trial ─────────────────────────────────

export async function rejectTrial(userId: string) {
  await prisma.subscription.updateMany({
    where: { user_id: userId, status: "PENDING_TRIAL" },
    data: { status: "EXPIRED" },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { subscription_status: "NONE" },
  });
}

// ─── Admin: Get All Users ────────────────────────────────

export async function getAllUsersForAdmin() {
  const users = await prisma.user.findMany({
    where: { role: "BUILDER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      subscription_status: true,
      profile_completed: true,
      created_at: true,
      subscriptions: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          starts_at: true,
          expires_at: true,
          payment_id: true,
          created_at: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return users.map((u) => ({
    ...u,
    latest_subscription: u.subscriptions[0] || null,
    subscriptions: undefined,
  }));
}

// ─── Check Expiring Subscriptions (Cron-like) ────────────

export async function checkExpiringSubscriptions() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find subscriptions expiring within 7 days
  const expiringIn7 = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL_ACTIVE"] },
      expires_at: { lte: sevenDaysFromNow, gt: now },
      notification_7day: false,
    },
  });

  for (const sub of expiringIn7) {
    await prisma.notification.create({
      data: {
        user_id: sub.user_id,
        title: "Subscription Expiring Soon",
        message: `Your ${sub.type === "TRIAL" ? "free trial" : "subscription"} expires in ${Math.ceil((sub.expires_at.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days. Renew now to avoid interruption.`,
        type: "SUBSCRIPTION",
        priority: "HIGH",
      },
    });

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { notification_7day: true },
    });

    // Update user status to EXPIRING_SOON
    await prisma.user.update({
      where: { id: sub.user_id },
      data: { subscription_status: "EXPIRING_SOON" },
    });
  }

  // Find subscriptions expiring within 3 days
  const expiringIn3 = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL_ACTIVE", "EXPIRING_SOON"] },
      expires_at: { lte: threeDaysFromNow, gt: now },
      notification_3day: false,
    },
  });

  for (const sub of expiringIn3) {
    await prisma.notification.create({
      data: {
        user_id: sub.user_id,
        title: "⚠️ Subscription Expiring in 3 Days",
        message: `Your ${sub.type === "TRIAL" ? "free trial" : "subscription"} expires very soon! Renew now to keep your data.`,
        type: "SUBSCRIPTION",
        priority: "URGENT",
      },
    });

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { notification_3day: true, status: "EXPIRING_SOON" },
    });
  }

  // Find and expire already-expired subscriptions
  const expired = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL_ACTIVE", "EXPIRING_SOON"] },
      expires_at: { lte: now },
    },
  });

  for (const sub of expired) {
    const newStatus = sub.type === "TRIAL" ? "TRIAL_EXPIRED" : "EXPIRED";
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: newStatus },
    });
    await prisma.user.update({
      where: { id: sub.user_id },
      data: { subscription_status: newStatus },
    });
  }

  return {
    notified7day: expiringIn7.length,
    notified3day: expiringIn3.length,
    expired: expired.length,
  };
}

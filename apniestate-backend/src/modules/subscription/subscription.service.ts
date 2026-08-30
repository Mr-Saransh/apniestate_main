import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { signAccessToken } from "@/lib/jwt";
import type {
  CreateOrderInput,
  PaySubscriptionInput,
  RenewSubscriptionInput,
  SelectPlanInput,
} from "./subscription.schema";
import {
  COMMERCIAL_PLANS,
  calculateSubscriptionPrice,
  getCompanyEntitlements,
  getCompanySubscription,
  type CommercialPlanId,
} from "./entitlement.service";

// ─── Razorpay Config ─────────────────────────────────────

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";

// ─── Create Razorpay Order ────────────────────────────────

export async function createRazorpayOrder(params?: {
  plan_id?: CommercialPlanId;
  duration_months?: number;
}) {
  const planId = params?.plan_id || "PLAN_30K";
  const durationMonths = params?.duration_months || 4;

  const totalAmountINR = calculateSubscriptionPrice(planId, durationMonths);
  const amountInPaise = totalAmountINR * 100;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    // Return mock order in development if keys not configured
    return {
      id: `order_mock_${Date.now()}`,
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      plan_id: planId,
      duration_months: durationMonths,
    };
  }

  const credentials = Buffer.from(
    `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`
  ).toString("base64");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: "INR",
      receipt: `sub_${Date.now()}`,
      notes: {
        product: "Apni Estate Subscription",
        plan: planId,
        duration_months: durationMonths,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.description || "Failed to create Razorpay order");
  }

  const data = await res.json();
  return {
    ...data,
    plan_id: planId,
    duration_months: durationMonths,
  };
}

// ─── Verify Payment & Activate Company Subscription ───────

export async function verifyAndActivateSubscription(
  userId: string,
  input: PaySubscriptionInput
) {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    plan_id = "PLAN_30K",
    duration_months = 4,
  } = input;

  const planId = plan_id as CommercialPlanId;
  const durationMonths = Number(duration_months) || 4;

  // 1. Verify signature
  if (RAZORPAY_KEY_SECRET) {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      throw new Error("Payment signature verification failed");
    }
  }

  const totalAmountINR = calculateSubscriptionPrice(planId, durationMonths);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  // 2. Transaction: Ensure company, create company subscription & update user status
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    let companyId = user.company_id;
    let company = null;

    if (companyId) {
      company = await tx.company.findUnique({ where: { id: companyId } });
    }

    if (!company) {
      // Create new Company for the user
      company = await tx.company.create({
        data: { name: `${user.name}'s Workspace` },
      });
      companyId = company.id;

      // Create company membership
      await tx.companyMembership.create({
        data: {
          user_id: userId,
          company_id: company.id,
          roles: ["BUILDER"],
          status: "ACTIVE",
        },
      });
    }

    // Expire any existing subscriptions for this company
    await tx.subscription.updateMany({
      where: {
        company_id: company.id,
        status: { in: ["ACTIVE", "TRIAL_ACTIVE", "EXPIRING_SOON"] },
      },
      data: { status: "EXPIRED" },
    });

    // Create Company Subscription record
    const subscription = await tx.subscription.create({
      data: {
        company_id: company.id,
        user_id: userId,
        plan: planId,
        duration_months: durationMonths,
        start_date: now,
        end_date: expiresAt,
        status: "ACTIVE",
        price: totalAmountINR,
        currency: "INR",
        is_demo: false,
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        razorpay_signature: razorpay_signature,
        type: "PAID",
        starts_at: now,
        expires_at: expiresAt,
      },
    });

    // Update User
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        subscription_status: "ACTIVE",
        company_id: company.id,
      },
    });

    // Generate refreshed JWT with company_id
    const accessToken = signAccessToken({
      sub: updatedUser.id,
      role: updatedUser.role,
      email: updatedUser.email || "",
      company_id: company.id,
    });

    return { subscription, user: updatedUser, accessToken };
  });

  return result;
}

// ─── Complete Profile ─────────────────────────────────────

export async function completeProfile(userId: string, data: { name: string; phone: string; city: string; state: string }) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone: data.phone,
      city: data.city,
      state: data.state,
      profile_completed: true,
    },
  });
}

// ─── Renew Subscription ───────────────────────────────────

export async function renewSubscription(
  userId: string,
  input: RenewSubscriptionInput,
  companyId?: string | null
) {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    plan_id = "PLAN_30K",
    duration_months = 4,
  } = input;

  const planId = plan_id as CommercialPlanId;
  const durationMonths = Number(duration_months) || 4;

  if (RAZORPAY_KEY_SECRET) {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expected !== razorpay_signature) {
      throw new Error("Payment signature verification failed");
    }
  }

  const totalAmountINR = calculateSubscriptionPrice(planId, durationMonths);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  const result = await prisma.$transaction(async (tx) => {
    let effectiveCompanyId = companyId;
    if (!effectiveCompanyId) {
      const u = await tx.user.findUnique({ where: { id: userId } });
      effectiveCompanyId = u?.company_id || null;
    }

    if (effectiveCompanyId) {
      await tx.subscription.updateMany({
        where: {
          company_id: effectiveCompanyId,
          status: { in: ["ACTIVE", "TRIAL_ACTIVE", "EXPIRING_SOON", "EXPIRED"] },
        },
        data: { status: "EXPIRED" },
      });
    }

    const subscription = await tx.subscription.create({
      data: {
        company_id: effectiveCompanyId,
        user_id: userId,
        plan: planId,
        duration_months: durationMonths,
        start_date: now,
        end_date: expiresAt,
        status: "ACTIVE",
        price: totalAmountINR,
        currency: "INR",
        is_demo: false,
        payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        razorpay_signature: razorpay_signature,
        type: "PAID",
        starts_at: now,
        expires_at: expiresAt,
      },
    });

    await tx.user.update({
      where: { id: userId },
      data: { subscription_status: "ACTIVE" },
    });

    return subscription;
  });

  return result;
}

// ─── Get Subscription Status & Entitlements ───────────────

export async function getSubscriptionStatus(
  userId: string,
  companyId?: string | null
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      subscription_status: true,
      profile_completed: true,
      company_id: true,
    },
  });

  if (!user) throw new Error("User not found");

  const effectiveCompanyId = companyId || user.company_id;
  const entitlements = await getCompanyEntitlements(effectiveCompanyId);

  // Retrieve active subscription
  let sub = null;
  if (effectiveCompanyId) {
    sub = await getCompanySubscription(effectiveCompanyId);
  }

  if (!sub) {
    sub = await prisma.subscription.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });
  }

  let daysRemaining = 0;
  if (sub && (sub.end_date || sub.expires_at)) {
    const end = sub.end_date || sub.expires_at;
    const diff = new Date(end!).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  return {
    subscription_status: entitlements.status,
    profile_completed: user.profile_completed,
    entitlements,
    subscription: sub
      ? {
          id: sub.id,
          plan: sub.plan,
          duration_months: sub.duration_months,
          type: sub.type,
          status: sub.status,
          price: sub.price,
          is_demo: sub.is_demo,
          starts_at: sub.start_date || sub.starts_at,
          expires_at: sub.end_date || sub.expires_at,
          days_remaining: daysRemaining,
        }
      : null,
  };
}

// ─── Cron / Batch Expiry Checking ────────────────────────

export async function checkExpiringSubscriptions() {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Expire all past due subscriptions that are not demo accounts
  const expiredSubs = await prisma.subscription.updateMany({
    where: {
      is_demo: false,
      status: { in: ["ACTIVE", "EXPIRING_SOON", "TRIAL_ACTIVE"] },
      OR: [
        { end_date: { lt: now } },
        { expires_at: { lt: now } },
      ],
    },
    data: { status: "EXPIRED" },
  });

  // 2. Mark expiring soon within 7 days
  const expiringSoon = await prisma.subscription.updateMany({
    where: {
      is_demo: false,
      status: "ACTIVE",
      OR: [
        { end_date: { gte: now, lte: in7Days } },
        { expires_at: { gte: now, lte: in7Days } },
      ],
    },
    data: { status: "EXPIRING_SOON" },
  });

  return {
    expired_count: expiredSubs.count,
    expiring_soon_count: expiringSoon.count,
    timestamp: now,
  };
}

// ─── Select Plan (Manual/Direct selection) ───────────────

export async function selectPlan(userId: string, input: SelectPlanInput) {
  const { plan_id, duration_months = 4 } = input;
  const planId = plan_id as CommercialPlanId;
  const durationMonths = Number(duration_months) || 4;

  const totalAmountINR = calculateSubscriptionPrice(planId, durationMonths);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    let companyId = user.company_id;
    if (!companyId) {
      const co = await tx.company.create({
        data: { name: `${user.name}'s Workspace` },
      });
      companyId = co.id;
      await tx.companyMembership.create({
        data: { user_id: userId, company_id: co.id, roles: ["BUILDER"], status: "ACTIVE" },
      });
    }

    await tx.subscription.updateMany({
      where: {
        company_id: companyId,
        status: { in: ["ACTIVE", "TRIAL_ACTIVE", "EXPIRING_SOON"] },
      },
      data: { status: "EXPIRED" },
    });

    const subscription = await tx.subscription.create({
      data: {
        company_id: companyId,
        user_id: userId,
        plan: planId,
        duration_months: durationMonths,
        start_date: now,
        end_date: expiresAt,
        status: "ACTIVE",
        price: totalAmountINR,
        currency: "INR",
        is_demo: false,
        type: "PAID",
        starts_at: now,
        expires_at: expiresAt,
      },
    });

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { subscription_status: "ACTIVE", company_id: companyId },
    });

    return { subscription, user: updatedUser };
  });

  return result;
}

// ─── Request Trial ────────────────────────────────────────

export async function requestTrial(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.subscription_status === "TRIAL_ACTIVE") {
    throw new Error("You already have an active trial");
  }
  if (user.subscription_status === "ACTIVE") {
    throw new Error("You already have an active subscription");
  }

  let companyId = user.company_id;
  if (!companyId) {
    const company = await prisma.company.create({
      data: { name: `${user.name}'s Workspace` },
    });
    companyId = company.id;
    await prisma.companyMembership.create({
      data: { user_id: userId, company_id: company.id, roles: ["BUILDER"], status: "ACTIVE" },
    });
  }

  const existing = await prisma.subscription.findFirst({
    where: { user_id: userId, type: "TRIAL" },
  });

  if (existing) {
    throw new Error("Trial already requested or used previously");
  }

  const subscription = await prisma.subscription.create({
    data: {
      company_id: companyId,
      user_id: userId,
      type: "TRIAL",
      plan: "PLAN_30K",
      duration_months: 1,
      status: "PENDING_TRIAL",
      price: 0,
      currency: "INR",
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { subscription_status: "PENDING_TRIAL", company_id: companyId },
  });

  return subscription;
}

// ─── Admin Approval: Trial ────────────────────────────────

export async function approveTrial(userId: string, _adminUsername?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days

  await prisma.subscription.updateMany({
    where: { user_id: userId, status: "PENDING_TRIAL" },
    data: {
      status: "TRIAL_ACTIVE",
      start_date: now,
      end_date: expiresAt,
      starts_at: now,
      expires_at: expiresAt,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { subscription_status: "TRIAL_ACTIVE" },
  });
}

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
      company_id: true,
      created_at: true,
      subscriptions: {
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          id: true,
          plan: true,
          duration_months: true,
          price: true,
          type: true,
          status: true,
          start_date: true,
          end_date: true,
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

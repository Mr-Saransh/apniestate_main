import { NextRequest } from "next/server";
import { withCrmAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, serverError } from "@/lib/response";
import { mailerService } from "@/modules/auth/mailer.service";

// Helper to generate unique referral code
async function generateUniqueReferralCode(name: string): Promise<string> {
  const letters = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "PARTNER";
  for (let i = 0; i < 10; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const code = `CP-${letters}-${num}`;
    const existing = await prisma.channelPartner.findUnique({ where: { referral_code: code } });
    if (!existing) return code;
  }
  return `CP-${Date.now().toString().slice(-6)}`;
}

// GET /api/crm/channel-partners
export const GET = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("Company context required");

    const partners = await prisma.channelPartner.findMany({
      where: { company_id: user.company_id },
      orderBy: { created_at: "desc" },
      include: {
        deals: {
          select: {
            id: true,
            deal_value: true,
            commission: true,
            amount_received: true,
            due_amount: true,
            deal_date: true,
            customer_name: true,
          },
        },
      },
    });

    const partnersWithStats = partners.map((p) => {
      const dealsCount = p.deals.length;
      const totalDealAmount = p.deals.reduce((acc, d) => acc + (d.deal_value || 0), 0);
      const totalCommission = p.deals.reduce((acc, d) => acc + (d.commission || 0), 0);
      const totalReceived = p.deals.reduce((acc, d) => acc + (d.amount_received || 0), 0);

      return {
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        referral_code: p.referral_code,
        commission_rate: p.commission_rate,
        status: p.status,
        notes: p.notes,
        created_at: p.created_at,
        deals_count: dealsCount,
        total_deal_amount: totalDealAmount,
        total_commission: totalCommission,
        total_received: totalReceived,
        recent_deals: p.deals.slice(0, 3),
      };
    });

    return ok(partnersWithStats);
  } catch (err: any) {
    console.error("Channel Partners GET error:", err);
    return serverError(err.message);
  }
});

// POST /api/crm/channel-partners
export const POST = withCrmAuth(async (req, user) => {
  try {
    if (!user.company_id) return badRequest("Company context required");

    const body = await req.json();
    const { name, email, phone, commission_rate, notes } = body;

    if (!name || !name.trim()) return badRequest("Partner name is required");
    if (!email || !email.trim() || !email.includes("@")) return badRequest("Valid email is required");
    if (!phone || !phone.trim()) return badRequest("Phone number is required");

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();

    // Check if email already registered as partner in this company
    const existing = await prisma.channelPartner.findFirst({
      where: {
        company_id: user.company_id,
        OR: [{ email: trimmedEmail }, { phone: trimmedPhone }],
      },
    });

    if (existing) {
      return badRequest("A channel partner with this email or phone number already exists.");
    }

    // Auto-generate unique referral code
    const referralCode = await generateUniqueReferralCode(trimmedName);

    // Create Channel Partner
    const partner = await prisma.channelPartner.create({
      data: {
        company_id: user.company_id,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        referral_code: referralCode,
        commission_rate: commission_rate !== undefined ? Number(commission_rate) : 0,
        status: "ACTIVE",
        notes: notes?.trim() || null,
      },
    });

    // Send email with referral code in background (non-blocking)
    const company = await prisma.company.findUnique({
      where: { id: user.company_id },
      select: { name: true },
    });
    
    mailerService
      .sendChannelPartnerWelcomeEmail(trimmedEmail, trimmedName, referralCode, company?.name || "Apniestate")
      .catch((err) => console.error("Async email error:", err));

    return created(
      {
        ...partner,
        deals_count: 0,
        total_deal_amount: 0,
        total_commission: 0,
        total_received: 0,
      },
      "Channel Partner registered and referral code sent via email"
    );
  } catch (err: any) {
    console.error("Channel Partner POST error:", err);
    return serverError(err.message);
  }
});

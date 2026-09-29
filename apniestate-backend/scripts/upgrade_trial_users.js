const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: "postgres://postgres.eerlsaaeldozxszefcwa:WQ1BzIBhOobqAQEd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=5",
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function upgradeAllTrialUsers() {
  console.log("=== Upgrading all trial users to 15-Day Enterprise Package ===");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // 15 days from now

  // 1. Find all users associated with trials
  const trialUsers = await prisma.user.findMany({
    where: {
      OR: [
        { subscription_status: "TRIAL_ACTIVE" },
        { subscription_status: "PENDING_TRIAL" },
        { subscription_status: "TRIAL_EXPIRED" },
        { subscriptions: { some: { type: "TRIAL" } } }
      ]
    },
    include: {
      subscriptions: true,
      memberships: true,
    }
  });

  console.log(`Found ${trialUsers.length} trial users to process.`);

  for (const user of trialUsers) {
    console.log(`\nProcessing user: ${user.name || user.email || user.id}`);

    // Ensure company workspace exists
    let companyId = user.company_id;
    if (!companyId) {
      const activeMembership = user.memberships?.find(m => m.status === "ACTIVE" && m.company_id);
      if (activeMembership) {
        companyId = activeMembership.company_id;
      } else {
        const company = await prisma.company.create({
          data: { name: `${user.name || "User"}'s Workspace` }
        });
        companyId = company.id;
        await prisma.companyMembership.create({
          data: { user_id: user.id, company_id: company.id, roles: ["BUILDER"], status: "ACTIVE" }
        });
        console.log(`  -> Created new company workspace: ${companyId}`);
      }
    }

    // Ensure user has company membership
    const membership = await prisma.companyMembership.findFirst({
      where: { user_id: user.id, company_id: companyId }
    });
    if (!membership) {
      await prisma.companyMembership.create({
        data: { user_id: user.id, company_id: companyId, roles: ["BUILDER"], status: "ACTIVE" }
      });
      console.log(`  -> Created company membership for workspace`);
    }

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription_status: "TRIAL_ACTIVE",
        company_id: companyId,
        onboarded: true,
      }
    });
    console.log(`  -> Updated user subscription_status to TRIAL_ACTIVE and linked company_id: ${companyId}`);

    // Update or create trial subscription
    const existingTrialSub = user.subscriptions?.find(s => s.type === "TRIAL");
    if (existingTrialSub) {
      await prisma.subscription.update({
        where: { id: existingTrialSub.id },
        data: {
          company_id: companyId,
          plan: "ENTERPRISE",
          status: "TRIAL_ACTIVE",
          type: "TRIAL",
          start_date: now,
          end_date: expiresAt,
          starts_at: now,
          expires_at: expiresAt,
          duration_months: 1,
          price: 0,
          currency: "INR",
        }
      });
      console.log(`  -> Upgraded subscription ${existingTrialSub.id} to ENTERPRISE plan with 15-day validity`);
    } else {
      const newSub = await prisma.subscription.create({
        data: {
          company_id: companyId,
          user_id: user.id,
          type: "TRIAL",
          plan: "ENTERPRISE",
          status: "TRIAL_ACTIVE",
          start_date: now,
          end_date: expiresAt,
          starts_at: now,
          expires_at: expiresAt,
          duration_months: 1,
          price: 0,
          currency: "INR",
        }
      });
      console.log(`  -> Created new ENTERPRISE trial subscription ${newSub.id}`);
    }
  }

  // Also catch any orphan trial subscriptions that might not be attached to these users
  const orphanSubs = await prisma.subscription.updateMany({
    where: {
      type: "TRIAL",
      plan: { not: "ENTERPRISE" }
    },
    data: {
      plan: "ENTERPRISE",
      status: "TRIAL_ACTIVE",
      start_date: now,
      end_date: expiresAt,
      starts_at: now,
      expires_at: expiresAt,
    }
  });

  if (orphanSubs.count > 0) {
    console.log(`\nUpdated ${orphanSubs.count} additional trial subscription records to ENTERPRISE.`);
  }

  console.log("\n=== All trial users successfully upgraded! ===");

  await prisma.$disconnect();
  await pool.end();
}

upgradeAllTrialUsers().catch(err => {
  console.error("Migration error:", err);
  process.exit(1);
});

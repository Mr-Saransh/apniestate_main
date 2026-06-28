import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.sub }, select: { company_id: true } });
  const company_id = dbUser?.company_id || undefined;

  if (!company_id) {
    return ok({
      overview: { totalUsers: 0, activeUsers: 0, totalProjects: 0, totalSites: 0, totalWorkers: 0, totalVendors: 0 },
      usersByRole: [],
      projectsByStatus: [],
      sitesByStatus: [],
      recentActivities: [],
      storageStats: { projects: 0, sites: 0, tasks: 0, workers: 0, materials: 0, vendors: 0, documents: 0 }
    });
  }

  // Users count & roles distribution
  const users = await prisma.user.findMany({ where: { company_id } });
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;

  const roleMap: Record<string, number> = {};
  for (const u of users) {
    roleMap[u.role] = (roleMap[u.role] || 0) + 1;
  }
  const usersByRole = Object.entries(roleMap).map(([role, count]) => ({ role, count }));

  // Projects & Status distribution
  const projects = await prisma.project.findMany({ where: { company_id } });
  const projMap: Record<string, number> = {};
  for (const p of projects) {
    projMap[p.status] = (projMap[p.status] || 0) + 1;
  }
  const projectsByStatus = Object.entries(projMap).map(([status, count]) => ({ status, count }));

  // Sites & Status distribution
  const sites = await prisma.site.findMany({ where: { company_id } });
  const siteMap: Record<string, number> = {};
  for (const s of sites) {
    siteMap[s.status] = (siteMap[s.status] || 0) + 1;
  }
  const sitesByStatus = Object.entries(siteMap).map(([status, count]) => ({ status, count }));

  // Workers
  const totalWorkers = await prisma.worker.count({ where: { company_id, is_active: true } });

  // Vendors
  const totalVendors = await prisma.vendor.count({ where: { company_id, is_active: true } });

  // Storage and entity stats
  const tasksCount = await prisma.task.count({ where: { company_id } });
  const materialsCount = await prisma.material.count({ where: { company_id } });
  const documentsCount = await prisma.document.count({ where: { company_id } });

  // Recent activities
  const recentActivities = await prisma.activityLog.findMany({
    where: { company_id },
    include: { user: { select: { name: true } } },
    orderBy: { created_at: "desc" },
    take: 12
  });

  return ok({
    overview: {
      totalUsers,
      activeUsers,
      totalProjects: projects.length,
      totalSites: sites.length,
      totalWorkers,
      totalVendors
    },
    usersByRole,
    projectsByStatus,
    sitesByStatus,
    recentActivities: recentActivities.map(a => ({
      id: a.id,
      action: a.action,
      entityType: a.entity_type,
      timestamp: a.created_at.toISOString(),
      userName: a.user?.name || "System"
    })),
    storageStats: {
      projects: projects.length,
      sites: sites.length,
      tasks: tasksCount,
      workers: totalWorkers,
      materials: materialsCount,
      vendors: totalVendors,
      documents: documentsCount
    }
  });
});

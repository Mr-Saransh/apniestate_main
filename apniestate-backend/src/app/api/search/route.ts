import { NextRequest } from "next/server";
import { withAuth } from "@/middleware/auth.middleware";
import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/response";

export const GET = withAuth(async (req: NextRequest, user) => {
  const url = new URL(req.url);
  const query = url.searchParams.get("q") || "";

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub }
  });

  const company_id = dbUser?.company_id || undefined;

  if (!query.trim() || !company_id) {
    return ok({ projects: [], sites: [], workers: [], tasks: [], invoices: [], documents: [] });
  }

  const [projects, sites, workers, tasks, invoices, documents] = await Promise.all([
    prisma.project.findMany({
      where: { company_id, name: { contains: query, mode: "insensitive" } },
      take: 5
    }),
    prisma.site.findMany({
      where: { company_id, name: { contains: query, mode: "insensitive" } },
      take: 5
    }),
    prisma.worker.findMany({
      where: { site: { company_id }, name: { contains: query, mode: "insensitive" } },
      take: 5
    }),
    prisma.task.findMany({
      where: { project: { company_id }, title: { contains: query, mode: "insensitive" } },
      take: 5
    }),
    prisma.invoice.findMany({
      where: { company_id, number: { contains: query, mode: "insensitive" } },
      take: 5
    }),
    prisma.document.findMany({
      where: { company_id, name: { contains: query, mode: "insensitive" } },
      take: 5
    })
  ]);

  return ok({
    projects: projects.map(p => ({ id: p.id, name: p.name, category: "Projects", link: "/projects" })),
    sites: sites.map(s => ({ id: s.id, name: s.name, category: "Sites", link: "/sites" })),
    workers: workers.map(w => ({ id: w.id, name: w.name, category: "Workers", link: "/workers" })),
    tasks: tasks.map(t => ({ id: t.id, name: t.title, category: "Tasks", link: "/tasks" })),
    invoices: invoices.map(i => ({ id: i.id, name: i.number, category: "Invoices", link: "/invoices" })),
    documents: documents.map(d => ({ id: d.id, name: d.name, category: "Documents", link: "/documents" }))
  });
});

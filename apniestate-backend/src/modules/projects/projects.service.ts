import { prisma } from "@/lib/prisma";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schema";

export const getProjects = (builderId: string) =>
  prisma.project.findMany({
    where: { builder_id: builderId },
    include: { _count: { select: { sites: true } } },
    orderBy: { created_at: "desc" },
  });

export const getProjectById = (id: string) =>
  prisma.project.findUnique({ where: { id }, include: { sites: true } });

export const createProject = (data: CreateProjectInput, builderId: string) =>
  prisma.project.create({ data: { ...data, builder_id: builderId } });

export const updateProject = (id: string, data: UpdateProjectInput) =>
  prisma.project.update({ where: { id }, data });

export const deleteProject = (id: string) =>
  prisma.project.delete({ where: { id } });

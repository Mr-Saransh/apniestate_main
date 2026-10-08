import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createNotification, notifyUsers } from "@/modules/notifications/notifications.service";
import type {
  CreateSubContractorInput,
  AssignSubContractorInput,
  CreateSubContractorExpenseInput,
  ReviewExpenseInput,
  CreateSubContractorTaskInput,
  UpdateSubContractorTaskInput,
  ReviewTaskInput,
  UpdateSubContractorAssignmentInput,
} from "./subcontractors.schema";

/**
 * Create a new Sub Contractor account and initial project assignment.
 */
export async function createSubContractor(
  input: CreateSubContractorInput,
  creatorId: string,
  companyId: string | null
) {
  const cleanEmail = input.email.trim().toLowerCase();

  // Verify project exists
  const project = await prisma.project.findUnique({
    where: { id: input.project_id },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  // Verify access: project must match companyId or creatorId must be builder/manager
  if (
    companyId &&
    project.company_id &&
    project.company_id !== companyId &&
    project.builder_id !== creatorId &&
    project.manager_id !== creatorId
  ) {
    throw new Error("Unauthorized to assign sub contractors to this project.");
  }

  const effectiveCompanyId = project.company_id || companyId || null;

  // Check if user already exists
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: cleanEmail, mode: "insensitive" } },
        { username: { equals: cleanEmail, mode: "insensitive" } },
      ],
    },
  });

  if (user) {
    if (user.role !== "SUB_CONTRACTOR") {
      throw new Error(`A user with email '${cleanEmail}' already exists with role '${user.role}'. Please use a different email.`);
    }
  } else {
    // Hash password securely
    const passwordHash = await bcrypt.hash(input.password, 10);

    user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        role: "SUB_CONTRACTOR",
        company_id: effectiveCompanyId,
        phone: input.phone || null,
        is_active: true,
        onboarded: true,
        profile_completed: true,
      },
    });

    if (effectiveCompanyId) {
      await prisma.companyMembership.create({
        data: {
          user_id: user.id,
          company_id: effectiveCompanyId,
          roles: ["SUB_CONTRACTOR"],
          status: "ACTIVE",
        },
      }).catch(() => { });
    }
  }

  // Check if already assigned to this project with the same work type
  const existingAssignment = await prisma.subContractorProjectAssignment.findFirst({
    where: {
      user_id: user.id,
      project_id: input.project_id,
      work_type: { equals: input.work_type.trim(), mode: "insensitive" },
    },
  });

  if (existingAssignment) {
    throw new Error(`Sub Contractor is already assigned to this project for '${input.work_type.trim()}'.`);
  }

  const assignment = await prisma.subContractorProjectAssignment.create({
    data: {
      user_id: user.id,
      project_id: input.project_id,
      company_id: effectiveCompanyId,
      work_type: input.work_type.trim(),
      allocated_budget: input.allocated_budget,
      created_by: creatorId,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      project: { select: { id: true, name: true } },
    },
  });

  // Welcome notification to the new sub contractor
  await createNotification({
    user_id: user.id,
    title: "Project Assignment",
    message: `You have been assigned as Sub Contractor for ${input.work_type.trim()} in ${project.name} with an allocated budget of ₹${input.allocated_budget.toLocaleString('en-IN')}.`,
    type: "PROJECT_ASSIGNMENT",
    entity_type: "SUB_CONTRACTOR_ASSIGNMENT",
    entity_id: assignment.id,
  }).catch(() => { });

  // Automated Workflow: Deduct allocated budget from project budget at once,
  // record in central Finance (Expense ledger) by Admin/Builder, and sync Budget category.
  await syncSubContractorAllocationToFinanceAndBudget(
    {
      id: assignment.id,
      project_id: assignment.project_id,
      user_id: assignment.user_id,
      work_type: assignment.work_type,
      allocated_budget: assignment.allocated_budget,
      user: { name: assignment.user.name },
    },
    creatorId,
    effectiveCompanyId
  ).catch((err) => {
    console.error("Failed to sync sub contractor allocation to finance and budget:", err);
  });

  return {
    assignment,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

/**
 * Assign an existing Sub Contractor to another project.
 */
export async function assignSubContractor(
  input: AssignSubContractorInput,
  creatorId: string,
  companyId: string | null
) {
  const project = await prisma.project.findUnique({
    where: { id: input.project_id },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  if (
    companyId &&
    project.company_id &&
    project.company_id !== companyId &&
    project.builder_id !== creatorId &&
    project.manager_id !== creatorId
  ) {
    throw new Error("Unauthorized to assign sub contractors to this project.");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.user_id },
  });

  if (!user || user.role !== "SUB_CONTRACTOR") {
    throw new Error("Sub Contractor user not found.");
  }

  const existing = await prisma.subContractorProjectAssignment.findFirst({
    where: {
      user_id: input.user_id,
      project_id: input.project_id,
      work_type: { equals: input.work_type.trim(), mode: "insensitive" },
    },
  });

  if (existing) {
    throw new Error(`Sub Contractor is already assigned to this project for '${input.work_type.trim()}'.`);
  }

  const assignment = await prisma.subContractorProjectAssignment.create({
    data: {
      user_id: input.user_id,
      project_id: input.project_id,
      company_id: companyId || project.company_id || null,
      work_type: input.work_type.trim(),
      allocated_budget: input.allocated_budget,
      created_by: creatorId,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await createNotification({
    user_id: user.id,
    title: "New Project Assignment",
    message: `You have been assigned to ${project.name} for ${input.work_type.trim()} with budget ₹${input.allocated_budget.toLocaleString('en-IN')}.`,
    type: "PROJECT_ASSIGNMENT",
    entity_type: "SUB_CONTRACTOR_ASSIGNMENT",
    entity_id: assignment.id,
  }).catch(() => { });

  // Automated Workflow: Deduct allocated budget from project budget at once,
  // record in central Finance (Expense ledger) by Admin/Builder, and sync Budget category.
  await syncSubContractorAllocationToFinanceAndBudget(
    {
      id: assignment.id,
      project_id: assignment.project_id,
      user_id: assignment.user_id,
      work_type: assignment.work_type,
      allocated_budget: assignment.allocated_budget,
      user: { name: assignment.user.name },
    },
    creatorId,
    companyId || project.company_id || null
  ).catch((err) => {
    console.error("Failed to sync sub contractor allocation to finance and budget:", err);
  });

  return assignment;
}

/**
 * Get all Sub Contractor assignments for a Builder / Company.
 */
export async function getSubContractors(companyId: string | null, projectId?: string) {
  const where: any = {};
  if (companyId) {
    where.company_id = companyId;
  }
  if (projectId) {
    where.project_id = projectId;
  }

  const assignments = await prisma.subContractorProjectAssignment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, is_active: true } },
      project: { select: { id: true, name: true, status: true, city: true } },
      expenses: {
        select: { id: true, amount: true, status: true, date: true, description: true, bill_url: true, created_at: true },
        orderBy: { date: "desc" },
      },
      tasks: {
        select: { id: true, description: true, deadline: true, status: true, completed_at: true, approved_at: true },
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return assignments.map((assignment) => {
    const approvedExpenses = assignment.expenses.filter((e) => e.status === "APPROVED");
    const pendingExpenses = assignment.expenses.filter((e) => e.status === "PENDING");
    const usedBudget = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBudget = Math.max(0, assignment.allocated_budget - usedBudget);

    const pendingTasks = assignment.tasks.filter(
      (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
    ).length;
    const completedAwaitingApproval = assignment.tasks.filter(
      (t) => t.status === "COMPLETED_PENDING_APPROVAL"
    ).length;
    const approvedTasks = assignment.tasks.filter((t) => t.status === "APPROVED").length;

    return {
      id: assignment.id,
      user_id: assignment.user_id,
      user: assignment.user,
      project_id: assignment.project_id,
      project: assignment.project,
      work_type: assignment.work_type,
      allocated_budget: assignment.allocated_budget,
      used_budget: usedBudget,
      remaining_budget: remainingBudget,
      pending_expense_amount: pendingAmount,
      pending_tasks_count: pendingTasks,
      completed_awaiting_approval_count: completedAwaitingApproval,
      approved_tasks_count: approvedTasks,
      created_at: assignment.created_at,
      expenses: assignment.expenses,
      tasks: assignment.tasks,
    };
  });
}

/**
 * Get Sub Contractor details by assignment ID.
 */
export async function getSubContractorAssignmentById(
  assignmentId: string,
  requesterId: string,
  requesterRole: string
) {
  const assignment = await prisma.subContractorProjectAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      project: { select: { id: true, name: true, status: true, city: true } },
      expenses: {
        include: {
          approver: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
      },
      tasks: {
        include: {
          approver: { select: { id: true, name: true } },
        },
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!assignment) {
    throw new Error("Sub Contractor assignment not found.");
  }

  // If requester is a sub contractor, they can only view their own assignment
  if (requesterRole === "SUB_CONTRACTOR" && assignment.user_id !== requesterId) {
    throw new Error("Access denied to this assignment.");
  }

  const approvedExpenses = assignment.expenses.filter((e) => e.status === "APPROVED");
  const pendingExpenses = assignment.expenses.filter((e) => e.status === "PENDING");
  const usedBudget = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = Math.max(0, assignment.allocated_budget - usedBudget);

  const pendingTasks = assignment.tasks.filter(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  ).length;
  const completedAwaitingApproval = assignment.tasks.filter(
    (t) => t.status === "COMPLETED_PENDING_APPROVAL"
  ).length;
  const approvedTasks = assignment.tasks.filter((t) => t.status === "APPROVED").length;

  return {
    id: assignment.id,
    user_id: assignment.user_id,
    user: assignment.user,
    project_id: assignment.project_id,
    project: assignment.project,
    work_type: assignment.work_type,
    allocated_budget: assignment.allocated_budget,
    used_budget: usedBudget,
    remaining_budget: remainingBudget,
    pending_expense_amount: pendingAmount,
    pending_tasks_count: pendingTasks,
    completed_awaiting_approval_count: completedAwaitingApproval,
    approved_tasks_count: approvedTasks,
    expenses: assignment.expenses,
    tasks: assignment.tasks,
    created_at: assignment.created_at,
  };
}

/**
 * Get all assignments for the currently logged-in Sub Contractor.
 */
export async function getMySubContractorAssignments(userId: string) {
  const assignments = await prisma.subContractorProjectAssignment.findMany({
    where: { user_id: userId },
    include: {
      project: { select: { id: true, name: true, status: true, city: true } },
      expenses: {
        orderBy: { date: "desc" },
      },
      tasks: {
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return assignments.map((assignment) => {
    const approvedExpenses = assignment.expenses.filter((e) => e.status === "APPROVED");
    const usedBudget = approvedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingBudget = Math.max(0, assignment.allocated_budget - usedBudget);

    const pendingTasks = assignment.tasks.filter(
      (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
    ).length;
    const completedAwaitingApproval = assignment.tasks.filter(
      (t) => t.status === "COMPLETED_PENDING_APPROVAL"
    ).length;
    const approvedTasks = assignment.tasks.filter((t) => t.status === "APPROVED").length;

    return {
      id: assignment.id,
      project_id: assignment.project_id,
      project: assignment.project,
      work_type: assignment.work_type,
      allocated_budget: assignment.allocated_budget,
      used_budget: usedBudget,
      remaining_budget: remainingBudget,
      pending_tasks_count: pendingTasks,
      completed_awaiting_approval_count: completedAwaitingApproval,
      approved_tasks_count: approvedTasks,
      expenses: assignment.expenses,
      tasks: assignment.tasks,
    };
  });
}

/**
 * Submit an expense as a Sub Contractor.
 * Validates against remaining budget.
 */
export async function submitExpense(input: CreateSubContractorExpenseInput, userId: string) {
  const assignment = await prisma.subContractorProjectAssignment.findUnique({
    where: { id: input.assignment_id },
    include: {
      user: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, builder_id: true } },
      expenses: { where: { status: "APPROVED" }, select: { amount: true } },
    },
  });

  if (!assignment) {
    throw new Error("Project assignment not found.");
  }

  if (assignment.user_id !== userId) {
    throw new Error("Unauthorized to submit expenses for this assignment.");
  }

  // Calculate remaining allocated budget
  const approvedTotal = assignment.expenses.reduce((sum, e) => sum + e.amount, 0);
  const remainingBudget = Math.max(0, assignment.allocated_budget - approvedTotal);

  if (input.amount > remainingBudget) {
    throw new Error(`Expense exceeds your remaining allocated budget of ₹${remainingBudget.toLocaleString('en-IN')}.`);
  }

  const expense = await prisma.subContractorExpense.create({
    data: {
      assignment_id: input.assignment_id,
      amount: input.amount,
      description: input.description.trim(),
      bill_url: input.bill_url || null,
      status: "PENDING",
      date: new Date(),
    },
  });

  // Notify Builder
  if (assignment.project.builder_id) {
    await createNotification({
      user_id: assignment.project.builder_id,
      title: "New Sub Contractor Expense",
      message: `${assignment.user.name} submitted an expense of ₹${input.amount.toLocaleString('en-IN')} for ${assignment.work_type} in ${assignment.project.name}.`,
      type: "EXPENSE_SUBMITTED",
      entity_type: "SUB_CONTRACTOR_EXPENSE",
      entity_id: expense.id,
    }).catch(() => { });
  }

  return expense;
}

/**
 * Review (Approve / Reject) a Sub Contractor expense.
 * When approved, links cleanly to the central expense ledger.
 */
export async function reviewExpense(
  expenseId: string,
  input: ReviewExpenseInput,
  reviewerId: string,
  companyId: string | null
) {
  const expense = await prisma.subContractorExpense.findUnique({
    where: { id: expenseId },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!expense) {
    throw new Error("Expense not found.");
  }

  const assignment = expense.assignment;

  if (input.status === "APPROVED") {
    const updated = await prisma.subContractorExpense.update({
      where: { id: expenseId },
      data: {
        status: "APPROVED",
        approved_at: new Date(),
        approved_by: reviewerId,
        rejection_reason: null,
      },
    });

    // Sub Contractor micro-expenses are tracked strictly within the Sub Contractor module
    // against their allocated budget limit. They are NOT posted to the central finance ledger,
    // because the entire allocated budget was already deducted upfront at allocation time.

    // Notify Sub Contractor
    await createNotification({
      user_id: assignment.user_id,
      title: "Expense Approved",
      message: `Your expense of ₹${expense.amount.toLocaleString('en-IN')} in ${assignment.project.name} has been approved.`,
      type: "EXPENSE_APPROVED",
      entity_type: "SUB_CONTRACTOR_EXPENSE",
      entity_id: expense.id,
    }).catch(() => { });

    return updated;
  } else {
    // REJECTED
    const updated = await prisma.subContractorExpense.update({
      where: { id: expenseId },
      data: {
        status: "REJECTED",
        approved_at: null,
        approved_by: reviewerId,
        rejection_reason: input.rejection_reason || null,
      },
    });

    // Notify Sub Contractor
    await createNotification({
      user_id: assignment.user_id,
      title: "Expense Rejected",
      message: `Your expense of ₹${expense.amount.toLocaleString('en-IN')} in ${assignment.project.name} was rejected.${input.rejection_reason ? ` Reason: ${input.rejection_reason}` : ""}`,
      type: "EXPENSE_REJECTED",
      entity_type: "SUB_CONTRACTOR_EXPENSE",
      entity_id: expense.id,
    }).catch(() => { });

    return updated;
  }
}

/**
 * Create a task for a Sub Contractor.
 */
export async function createSubContractorTask(
  input: CreateSubContractorTaskInput,
  userId: string
) {
  const assignment = await prisma.subContractorProjectAssignment.findUnique({
    where: { id: input.assignment_id },
  });

  if (!assignment || assignment.user_id !== userId) {
    throw new Error("Assignment not found or unauthorized.");
  }

  return prisma.subContractorTask.create({
    data: {
      assignment_id: input.assignment_id,
      description: input.description.trim(),
      deadline: input.deadline ? new Date(input.deadline) : null,
      status: "OPEN",
    },
  });
}

/**
 * Update task (e.g. edit description/deadline or change status to IN_PROGRESS or COMPLETED_PENDING_APPROVAL).
 */
export async function updateSubContractorTask(
  taskId: string,
  input: UpdateSubContractorTaskInput,
  userId: string
) {
  const task = await prisma.subContractorTask.findUnique({
    where: { id: taskId },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, builder_id: true } },
        },
      },
    },
  });

  if (!task || task.assignment.user_id !== userId) {
    throw new Error("Task not found or unauthorized.");
  }

  if (task.status === "APPROVED") {
    throw new Error("Approved tasks cannot be edited.");
  }

  const data: any = {};
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.deadline !== undefined) data.deadline = input.deadline ? new Date(input.deadline) : null;
  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === "COMPLETED_PENDING_APPROVAL") {
      data.completed_at = new Date();
    }
  }

  const updated = await prisma.subContractorTask.update({
    where: { id: taskId },
    data,
  });

  // If marked complete awaiting approval, notify Builder
  if (input.status === "COMPLETED_PENDING_APPROVAL") {
    const builderId = task.assignment.project.builder_id;
    if (builderId) {
      await createNotification({
        user_id: builderId,
        title: "Task Completed Awaiting Approval",
        message: `${task.assignment.user.name} completed '${updated.description}' in ${task.assignment.project.name} and requires approval.`,
        type: "TASK_COMPLETED",
        entity_type: "SUB_CONTRACTOR_TASK",
        entity_id: updated.id,
      }).catch(() => { });
    }
  }

  return updated;
}

/**
 * Builder reviews task: APPROVE or REJECT (Return for revision).
 */
export async function reviewSubContractorTask(
  taskId: string,
  action: "APPROVE" | "REJECT",
  reviewerId: string
) {
  const task = await prisma.subContractorTask.findUnique({
    where: { id: taskId },
    include: {
      assignment: {
        include: {
          user: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found.");
  }

  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await prisma.subContractorTask.update({
    where: { id: taskId },
    data: {
      status: newStatus,
      approved_at: action === "APPROVE" ? new Date() : null,
      approved_by: reviewerId,
    },
  });

  // Notify Sub Contractor
  await createNotification({
    user_id: task.assignment.user_id,
    title: action === "APPROVE" ? "Task Approved" : "Task Returned for Revision",
    message: action === "APPROVE"
      ? `Task '${task.description}' in ${task.assignment.project.name} has been approved.`
      : `Task '${task.description}' in ${task.assignment.project.name} was returned for revision.`,
    type: action === "APPROVE" ? "TASK_APPROVED" : "TASK_RETURNED",
    entity_type: "SUB_CONTRACTOR_TASK",
    entity_id: task.id,
  }).catch(() => { });

  return updated;
}

/**
 * Automated Workflow:
 * Upfront Budget Allocation for Sub Contractors.
 * 1. DEDUCTED FROM THE PROJECT BUDGET AT ONCE:
 *    Updates project.actual_cost to immediately reflect the committed cost against project.budget.
 * 2. SHOWN IN CENTRAL FINANCE:
 *    Upserts an approved Expense record in the central Finance ledger under category 'SUBCONTRACT'
 *    logged by the Admin/Builder (creatorId), linked by reference_id 'subcontractor-allocation-${assignment.id}'.
 * 3. SHOWN IN CENTRAL BUDGET:
 *    Syncs the 'SUBCONTRACT' category budget in prisma.budget with allocated and spent amounts.
 * 4. NO SEPARATE MICRO-EXPENSE TRACKING IN CENTRAL FINANCE:
 *    Individual subcontractor bills are tracked solely within the Sub Contractor workspace
 *    against the allocated budget limit, preventing double deductions.
 */
export async function syncSubContractorAllocationToFinanceAndBudget(
  assignment: {
    id: string;
    project_id: string;
    user_id: string;
    work_type: string;
    allocated_budget: number;
    user?: { name: string } | null;
  },
  creatorId: string,
  companyId: string | null
) {
  if (!assignment.allocated_budget || assignment.allocated_budget <= 0) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: assignment.project_id },
    select: { id: true, name: true, budget: true, actual_cost: true, company_id: true },
  });

  if (!project) return;

  const effectiveCompanyId = companyId || project.company_id || null;
  const userName = assignment.user?.name || "Sub Contractor";

  // 1. Record Upfront Expense in Central Finance (Logged by Admin/Builder)
  const referenceId = `subcontractor-allocation-${assignment.id}`;
  await prisma.expense.upsert({
    where: { reference_id: referenceId },
    create: {
      amount: assignment.allocated_budget,
      category: "SUBCONTRACT",
      description: `Sub Contractor Budget: ${userName} (${assignment.work_type.trim()})`,
      project_id: project.id,
      user_id: creatorId,
      date: new Date(),
      status: "APPROVED",
      reference_id: referenceId,
      company_id: effectiveCompanyId,
    },
    update: {
      amount: assignment.allocated_budget,
      description: `Sub Contractor Budget: ${userName} (${assignment.work_type.trim()})`,
      user_id: creatorId,
      company_id: effectiveCompanyId,
      status: "APPROVED",
    },
  });

  // 2. Deduct from Project Budget: Recalculate full project.actual_cost
  const [totalApprovedExpenses, approvedPOs, equipmentList, sites] = await Promise.all([
    prisma.expense.aggregate({
      where: { project_id: project.id, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.purchaseOrder.findMany({
      where: { project_id: project.id, status: { in: ["APPROVED", "SENT", "DELIVERED", "PARTIAL"] } },
      select: { total_amount: true },
    }),
    prisma.equipment.findMany({
      where: { project_id: project.id },
      select: { rental_cost: true, fuel_cost: true, operator_cost: true, maintenance_cost: true },
    }),
    prisma.site.findMany({
      where: { project_id: project.id },
      select: { id: true },
    }),
  ]);

  const siteIds = sites.map((s) => s.id);
  const labourLogs = siteIds.length > 0
    ? await prisma.labourLog.findMany({
        where: { site_id: { in: siteIds } },
        include: { category: true },
      })
    : [];

  const poCost = approvedPOs.reduce((s, p) => s + (p.total_amount || 0), 0);
  const equipCost = equipmentList.reduce(
    (s, e) => s + (e.rental_cost || 0) + (e.fuel_cost || 0) + (e.operator_cost || 0) + (e.maintenance_cost || 0),
    0
  );
  const labourCost = labourLogs.reduce((s, l) => {
    if (l.total_cost && l.total_cost > 0) return s + l.total_cost;
    const dailyWage = l.category?.daily_wage || 0;
    const otMult = l.category?.ot_multiplier || 1.5;
    const halfMult = l.category?.half_day_multiplier || 0.5;
    return (
      s +
      (l.present_count || 0) * dailyWage +
      (l.half_day_count || 0) * (dailyWage * halfMult) +
      (l.ot_hours || 0) * ((dailyWage / 8) * otMult)
    );
  }, 0);

  const totalExpenseCost = totalApprovedExpenses._sum.amount || 0;
  const newActualCost = totalExpenseCost + poCost + equipCost + labourCost;

  await prisma.project.update({
    where: { id: project.id },
    data: { actual_cost: newActualCost },
  });

  // 3. Central Budget Module: Sync SUBCONTRACT category entry
  const allProjectAssignments = await prisma.subContractorProjectAssignment.findMany({
    where: { project_id: project.id },
    select: { allocated_budget: true },
  });
  const totalSubcontractorAllocations = allProjectAssignments.reduce((s, a) => s + a.allocated_budget, 0);

  const existingBudget = await prisma.budget.findFirst({
    where: { project_id: project.id, category: "SUBCONTRACT" },
  });

  if (existingBudget) {
    await prisma.budget.update({
      where: { id: existingBudget.id },
      data: {
        spent: totalSubcontractorAllocations,
        allocated: Math.max(existingBudget.allocated || 0, totalSubcontractorAllocations),
        description: existingBudget.description || "Subcontractor Allocations & Works",
      },
    });
  } else {
    await prisma.budget.create({
      data: {
        project_id: project.id,
        category: "SUBCONTRACT",
        allocated: totalSubcontractorAllocations,
        spent: totalSubcontractorAllocations,
        description: "Subcontractor Allocations & Works",
        created_by: creatorId,
        company_id: effectiveCompanyId,
      },
    });
  }
}

/**
 * Update a Sub Contractor assignment (e.g. change allocated budget or work type).
 * Re-runs budget and finance synchronization.
 */
export async function updateSubContractorAssignment(
  assignmentId: string,
  input: UpdateSubContractorAssignmentInput,
  userId: string,
  companyId: string | null
) {
  const existing = await prisma.subContractorProjectAssignment.findUnique({
    where: { id: assignmentId },
    include: { user: true, project: true },
  });

  if (!existing) {
    throw new Error("Assignment not found.");
  }

  const data: any = {};
  if (input.allocated_budget !== undefined) {
    data.allocated_budget = input.allocated_budget;
  }
  if (input.work_type !== undefined) {
    data.work_type = input.work_type.trim();
  }

  const updated = await prisma.subContractorProjectAssignment.update({
    where: { id: assignmentId },
    data,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      project: { select: { id: true, name: true } },
    },
  });

  await syncSubContractorAllocationToFinanceAndBudget(
    {
      id: updated.id,
      project_id: updated.project_id,
      user_id: updated.user_id,
      work_type: updated.work_type,
      allocated_budget: updated.allocated_budget,
      user: { name: updated.user.name },
    },
    userId,
    companyId || existing.project.company_id
  );

  return updated;
}

/**
 * Delete a Sub Contractor assignment and clean up its central allocation expense.
 */
export async function deleteSubContractorAssignment(
  assignmentId: string,
  userId: string,
  companyId: string | null
) {
  const assignment = await prisma.subContractorProjectAssignment.findUnique({
    where: { id: assignmentId },
    include: { project: true },
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  const projectId = assignment.project_id;

  // Delete the assignment (cascades to expenses and tasks)
  await prisma.subContractorProjectAssignment.delete({
    where: { id: assignmentId },
  });

  // Delete the central expense
  await prisma.expense.deleteMany({
    where: { reference_id: `subcontractor-allocation-${assignmentId}` },
  });

  // Recalculate Project actual_cost
  const [totalApprovedExpenses, approvedPOs, equipmentList, sites] = await Promise.all([
    prisma.expense.aggregate({
      where: { project_id: projectId, status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.purchaseOrder.findMany({
      where: { project_id: projectId, status: { in: ["APPROVED", "SENT", "DELIVERED", "PARTIAL"] } },
      select: { total_amount: true },
    }),
    prisma.equipment.findMany({
      where: { project_id: projectId },
      select: { rental_cost: true, fuel_cost: true, operator_cost: true, maintenance_cost: true },
    }),
    prisma.site.findMany({
      where: { project_id: projectId },
      select: { id: true },
    }),
  ]);

  const siteIds = sites.map((s) => s.id);
  const labourLogs = siteIds.length > 0
    ? await prisma.labourLog.findMany({
        where: { site_id: { in: siteIds } },
        include: { category: true },
      })
    : [];

  const poCost = approvedPOs.reduce((s, p) => s + (p.total_amount || 0), 0);
  const equipCost = equipmentList.reduce(
    (s, e) => s + (e.rental_cost || 0) + (e.fuel_cost || 0) + (e.operator_cost || 0) + (e.maintenance_cost || 0),
    0
  );
  const labourCost = labourLogs.reduce((s, l) => {
    if (l.total_cost && l.total_cost > 0) return s + l.total_cost;
    const dailyWage = l.category?.daily_wage || 0;
    const otMult = l.category?.ot_multiplier || 1.5;
    const halfMult = l.category?.half_day_multiplier || 0.5;
    return (
      s +
      (l.present_count || 0) * dailyWage +
      (l.half_day_count || 0) * (dailyWage * halfMult) +
      (l.ot_hours || 0) * ((dailyWage / 8) * otMult)
    );
  }, 0);

  const totalExpenseCost = totalApprovedExpenses._sum.amount || 0;
  await prisma.project.update({
    where: { id: projectId },
    data: { actual_cost: totalExpenseCost + poCost + equipCost + labourCost },
  });

  // Re-sync Budget
  const remainingAssignments = await prisma.subContractorProjectAssignment.findMany({
    where: { project_id: projectId },
    select: { allocated_budget: true },
  });
  const totalSubcontractorAllocations = remainingAssignments.reduce((s, a) => s + a.allocated_budget, 0);

  const existingBudget = await prisma.budget.findFirst({
    where: { project_id: projectId, category: "SUBCONTRACT" },
  });

  if (existingBudget) {
    await prisma.budget.update({
      where: { id: existingBudget.id },
      data: { spent: totalSubcontractorAllocations },
    });
  }

  return { success: true };
}

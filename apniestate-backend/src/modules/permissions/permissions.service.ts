import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Define the permissions mapping for seeding
const DEFAULT_PERMISSIONS = [
  // Users module
  { module: "users", action: "create", description: "Create users" },
  { module: "users", action: "read", description: "View users" },
  { module: "users", action: "update", description: "Update users" },
  { module: "users", action: "delete", description: "Delete users" },

  // Projects module
  { module: "projects", action: "create", description: "Create projects" },
  { module: "projects", action: "read", description: "View projects" },
  { module: "projects", action: "update", description: "Update projects" },
  { module: "projects", action: "delete", description: "Delete projects" },

  // Sites module
  { module: "sites", action: "create", description: "Create sites" },
  { module: "sites", action: "read", description: "View sites" },
  { module: "sites", action: "update", description: "Update sites" },
  { module: "sites", action: "delete", description: "Delete sites" },

  // Tasks module
  { module: "tasks", action: "create", description: "Create tasks" },
  { module: "tasks", action: "read", description: "View tasks" },
  { module: "tasks", action: "update", description: "Update tasks" },
  { module: "tasks", action: "delete", description: "Delete tasks" },

  // Attendance module
  { module: "attendance", action: "create", description: "Mark attendance" },
  { module: "attendance", action: "read", description: "View attendance" },
  { module: "attendance", action: "update", description: "Update attendance" },

  // Leaves module
  { module: "leaves", action: "create", description: "Apply for leaves" },
  { module: "leaves", action: "read", description: "View leaves" },
  { module: "leaves", action: "update", description: "Update leaves" },
  { module: "leaves", action: "approve", description: "Approve leaves" },

  // Finance module (Expenses)
  { module: "finance", action: "create", description: "Create expenses" },
  { module: "finance", action: "read", description: "View expenses" },
  { module: "finance", action: "update", description: "Update expenses" },
  { module: "finance", action: "approve", description: "Approve expenses" },

  // Invoices module
  { module: "invoices", action: "create", description: "Create invoices" },
  { module: "invoices", action: "read", description: "View invoices" },
  { module: "invoices", action: "update", description: "Update invoices" },
  { module: "invoices", action: "delete", description: "Delete invoices" },

  // Payments module
  { module: "payments", action: "create", description: "Record payments" },
  { module: "payments", action: "read", description: "View payments" },
  { module: "payments", action: "update", description: "Update payments" },
  { module: "payments", action: "delete", description: "Delete payments" },

  // Budgets module
  { module: "budgets", action: "create", description: "Set budgets" },
  { module: "budgets", action: "read", description: "View budgets" },
  { module: "budgets", action: "update", description: "Update budgets" },
  { module: "budgets", action: "delete", description: "Delete budgets" },

  // Inventory module
  { module: "inventory", action: "create", description: "Add inventory items" },
  { module: "inventory", action: "read", description: "View inventory" },
  { module: "inventory", action: "update", description: "Update inventory" },
  { module: "inventory", action: "delete", description: "Delete inventory items" },

  // Material requests module
  { module: "material-requests", action: "create", description: "Request materials" },
  { module: "material-requests", action: "read", description: "View material requests" },
  { module: "material-requests", action: "update", description: "Update material requests" },
  { module: "material-requests", action: "approve", description: "Approve material requests" },

  // Vendors module
  { module: "vendors", action: "create", description: "Create vendors" },
  { module: "vendors", action: "read", description: "View vendors" },
  { module: "vendors", action: "update", description: "Update vendors" },
  { module: "vendors", action: "delete", description: "Delete vendors" },

  // Workers module
  { module: "workers", action: "create", description: "Create workers" },
  { module: "workers", action: "read", description: "View workers" },
  { module: "workers", action: "update", description: "Update workers" },
  { module: "workers", action: "delete", description: "Delete workers" },

  // Contractors module
  { module: "contractors", action: "create", description: "Create contractors" },
  { module: "contractors", action: "read", description: "View contractors" },
  { module: "contractors", action: "update", description: "Update contractors" },
  { module: "contractors", action: "delete", description: "Delete contractors" },

  // Documents module
  { module: "documents", action: "create", description: "Upload documents" },
  { module: "documents", action: "read", description: "View documents" },
  { module: "documents", action: "update", description: "Update documents" },
  { module: "documents", action: "delete", description: "Delete documents" },

  // Reports module
  { module: "reports", action: "read", description: "View reports" },
];

export async function seedPermissions() {
  console.log("Seeding default permissions...");

  // 1. Insert permissions in database
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: { description: perm.description },
      create: perm,
    });
  }

  // 2. Fetch all permissions from DB
  const dbPerms = await prisma.permission.findMany();

  // Helper to find permission ID
  const getPermId = (mod: string, act: string) => {
    return dbPerms.find((p) => p.module === mod && p.action === act)?.id;
  };

  // Helper to assign role permissions
  const assignRolePermissions = async (role: Role, modActList: { module: string; action: string }[]) => {
    // Clear existing permissions for this role first
    await prisma.rolePermission.deleteMany({
      where: { role },
    });

    const rolePermData = modActList
      .map((ma) => {
        const permission_id = getPermId(ma.module, ma.action);
        return permission_id ? { role, permission_id } : null;
      })
      .filter(Boolean) as { role: Role; permission_id: string }[];

    await prisma.rolePermission.createMany({
      data: rolePermData,
    });
  };

  // 3. Define mapping per Role

  // BUILDER role permissions (Executive Command Center)
  await assignRolePermissions(Role.BUILDER, [
    // Users & Company Management
    { module: "users", action: "create" },
    { module: "users", action: "read" },
    { module: "users", action: "update" },
    { module: "users", action: "delete" },
    
    // Core (View & Create)
    { module: "projects", action: "create" },
    { module: "projects", action: "read" },
    { module: "projects", action: "update" },
    { module: "sites", action: "create" },
    { module: "sites", action: "read" },
    { module: "sites", action: "update" },
    { module: "tasks", action: "read" }, // View only

    // Approvals
    { module: "leaves", action: "approve" },
    { module: "finance", action: "approve" },
    { module: "material-requests", action: "approve" },
    
    // Financials & Others (View & Manage Budgets/Approvals)
    { module: "finance", action: "read" },
    { module: "invoices", action: "read" },
    { module: "payments", action: "read" },
    { module: "budgets", action: "create" },
    { module: "budgets", action: "read" },
    { module: "budgets", action: "update" },
    
    // View Everything Else
    { module: "attendance", action: "read" },
    { module: "leaves", action: "read" },
    { module: "inventory", action: "read" },
    { module: "material-requests", action: "read" },
    { module: "vendors", action: "read" },
    { module: "workers", action: "read" },
    { module: "contractors", action: "read" },
    { module: "documents", action: "read" },
    { module: "reports", action: "read" }
  ]);

  // PROJECT_MANAGER role permissions
  await assignRolePermissions(Role.PROJECT_MANAGER, [
    { module: "projects", action: "read" },
    { module: "sites", action: "read" },
    
    // Tasks (Execution management)
    { module: "tasks", action: "create" },
    { module: "tasks", action: "read" },
    { module: "tasks", action: "update" },
    { module: "tasks", action: "delete" },
    
    // Reviews
    { module: "attendance", action: "read" },
    { module: "material-requests", action: "read" },
    { module: "inventory", action: "read" },
    { module: "workers", action: "read" },
    
    // Reports
    { module: "reports", action: "read" }
  ]);

  // SITE_SUPERVISOR role permissions (Execution focused)
  await assignRolePermissions(Role.SITE_SUPERVISOR, [
    { module: "projects", action: "read" },
    { module: "sites", action: "read" },
    
    // Tasks & Daily execution
    { module: "tasks", action: "read" },
    { module: "tasks", action: "update" },
    
    // Attendance
    { module: "attendance", action: "create" },
    { module: "attendance", action: "read" },
    { module: "attendance", action: "update" },
    
    // Inventory & Materials
    { module: "inventory", action: "read" },
    { module: "inventory", action: "update" }, // issue materials
    { module: "material-requests", action: "create" },
    { module: "material-requests", action: "read" },
    
    // Site expenses & Cashbook
    { module: "finance", action: "create" }, // record site expenses
    { module: "finance", action: "read" },
    
    // Documents (DPR, site photos)
    { module: "documents", action: "create" },
    { module: "documents", action: "read" },
    
    // Reports
    { module: "reports", action: "read" }
  ]);

  // ACCOUNTANT role permissions (Finance only)
  await assignRolePermissions(Role.ACCOUNTANT, [
    { module: "finance", action: "create" },
    { module: "finance", action: "read" },
    { module: "finance", action: "update" },
    // Notice: no "approve" for expenses
    
    { module: "invoices", action: "create" },
    { module: "invoices", action: "read" },
    { module: "invoices", action: "update" },
    
    { module: "payments", action: "create" },
    { module: "payments", action: "read" },
    { module: "payments", action: "update" },
    
    { module: "budgets", action: "read" },
    { module: "vendors", action: "read" },
    { module: "vendors", action: "update" },
    { module: "contractors", action: "read" },
    { module: "contractors", action: "update" },
    
    // View attendance for payroll
    { module: "attendance", action: "read" },
    { module: "workers", action: "read" },
    
    { module: "reports", action: "read" }
  ]);

  // INVENTORY_MANAGER role permissions
  await assignRolePermissions(Role.INVENTORY_MANAGER, [
    { module: "inventory", action: "create" },
    { module: "inventory", action: "read" },
    { module: "inventory", action: "update" },
    { module: "inventory", action: "delete" },
    { module: "material-requests", action: "read" },
    { module: "material-requests", action: "update" },
    { module: "vendors", action: "read" },
  ]);


  console.log("Permissions seeded successfully.");
}

export async function getAllPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { action: "asc" }],
  });
}

export async function getRolePermissions(role: Role) {
  return prisma.rolePermission.findMany({
    where: { role },
    include: { permission: true },
  });
}

export async function updateRolePermissions(role: Role, permissionIds: string[]) {
  return prisma.$transaction(async (tx) => {
    // Delete existing
    await tx.rolePermission.deleteMany({
      where: { role },
    });

    // Insert new
    if (permissionIds.length > 0) {
      await tx.rolePermission.createMany({
        data: permissionIds.map((pid) => ({
          role,
          permission_id: pid,
        })),
      });
    }

    return tx.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });
  });
}

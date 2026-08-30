export type Role =
  | "ADMIN"
  | "BUILDER"
  | "SITE_SUPERVISOR"
  | "ACCOUNTANT"
  | "INVENTORY_MANAGER"
  | "PROJECT_MANAGER"
  | "WORKER"
  | "VENDOR"
  | "CRM_MANAGER"
  | "TELECALLER"
  | "SALES_EXECUTIVE";

export type CrmRole = "BUILDER" | "CRM_MANAGER" | "TELECALLER";

export interface JWTPayload {
  sub: string;      // user id
  email: string;
  role: Role;
  crm_role?: CrmRole | null;
  company_id?: string | null;
  iat?: number;
  exp?: number;
}


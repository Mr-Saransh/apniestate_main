export type Role = "ADMIN" | "BUILDER" | "SITE_SUPERVISOR" | "ACCOUNTANT" | "INVENTORY_MANAGER" | "PROJECT_MANAGER";

export interface JWTPayload {
  sub: string;      // user id
  email: string;
  role: Role;
  company_id?: string | null;
  iat?: number;
  exp?: number;
}

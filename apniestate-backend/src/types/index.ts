export type Role = "BUILDER" | "SITE_SUPERVISOR" | "ACCOUNTANT" | "INVENTORY_MANAGER" | "PROJECT_MANAGER" | string;

export interface JWTPayload {
  sub: string;      // user id
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

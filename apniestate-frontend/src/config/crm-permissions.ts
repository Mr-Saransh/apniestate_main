import type { AuthUser } from '@/api/auth';

export type CrmCapability =
  | 'CRM_VIEW_ALL_LEADS'
  | 'CRM_VIEW_TEAM_LEADS'
  | 'CRM_VIEW_OWN_LEADS'
  | 'CRM_CREATE_LEAD'
  | 'CRM_EDIT_LEAD'
  | 'CRM_DELETE_LEAD'
  | 'CRM_ASSIGN_LEADS'
  | 'CRM_REASSIGN_LEADS'
  | 'CRM_CREATE_MANAGER'
  | 'CRM_CREATE_TELECALLER'
  | 'CRM_MANAGE_TEAM'
  | 'CRM_VIEW_TEAM_PIPELINE'
  | 'CRM_VIEW_TEAM_REPORTS'
  | 'CRM_VIEW_BOOKINGS'
  | 'CRM_VIEW_ALL_CUSTOMERS'
  | 'CRM_MANAGE_SETTINGS'
  | 'CRM_SWITCH_MODE';

export type CrmRole = 'BUILDER' | 'CRM_MANAGER' | 'TELECALLER';

export const CRM_ROLE_CAPABILITIES: Record<CrmRole, CrmCapability[]> = {
  BUILDER: [
    'CRM_VIEW_ALL_LEADS',
    'CRM_VIEW_TEAM_LEADS',
    'CRM_VIEW_OWN_LEADS',
    'CRM_CREATE_LEAD',
    'CRM_EDIT_LEAD',
    'CRM_DELETE_LEAD',
    'CRM_ASSIGN_LEADS',
    'CRM_REASSIGN_LEADS',
    'CRM_CREATE_MANAGER',
    'CRM_CREATE_TELECALLER',
    'CRM_MANAGE_TEAM',
    'CRM_VIEW_TEAM_PIPELINE',
    'CRM_VIEW_TEAM_REPORTS',
    'CRM_VIEW_BOOKINGS',
    'CRM_VIEW_ALL_CUSTOMERS',
    'CRM_MANAGE_SETTINGS',
    'CRM_SWITCH_MODE',
  ],
  CRM_MANAGER: [
    'CRM_VIEW_TEAM_LEADS',
    'CRM_VIEW_OWN_LEADS',
    'CRM_CREATE_LEAD',
    'CRM_EDIT_LEAD',
    'CRM_DELETE_LEAD',
    'CRM_ASSIGN_LEADS',
    'CRM_REASSIGN_LEADS',
    'CRM_CREATE_TELECALLER',
    'CRM_MANAGE_TEAM',
    'CRM_VIEW_TEAM_PIPELINE',
    'CRM_VIEW_TEAM_REPORTS',
    'CRM_VIEW_BOOKINGS',
    'CRM_VIEW_ALL_CUSTOMERS',
  ],
  TELECALLER: [
    'CRM_VIEW_OWN_LEADS',
    'CRM_CREATE_LEAD',
    'CRM_EDIT_LEAD',
    'CRM_VIEW_BOOKINGS',
  ],
};

export function hasCrmCapability(crmRole: CrmRole | null | undefined, capability: CrmCapability): boolean {
  if (!crmRole) return false;
  const capabilities = CRM_ROLE_CAPABILITIES[crmRole] || [];
  return capabilities.includes(capability);
}

export function getUserCrmRole(user: AuthUser | null | undefined): CrmRole | null {
  if (!user) return null;

  if (user.crm_role) {
    return user.crm_role;
  }

  if (user.role === 'BUILDER' || user.role === 'ADMIN') {
    return 'BUILDER';
  }

  if (user.role === 'CRM_MANAGER') {
    return 'CRM_MANAGER';
  }

  if (user.role === 'TELECALLER' || user.role === 'SALES_EXECUTIVE') {
    return 'TELECALLER';
  }

  return null;
}

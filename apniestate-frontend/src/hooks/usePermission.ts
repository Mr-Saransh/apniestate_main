import { useAuth } from '@/context/AuthContext';

export function usePermission() {
  const { permissions, hasPermission } = useAuth();
  return { permissions, hasPermission };
}

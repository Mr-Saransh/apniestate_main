const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface AdminApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: { code: string; message: string };
}

class AdminApiClient {
  private getToken(): string | null {
    return localStorage.getItem('admin_panel_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<AdminApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.headers.get('content-type')?.includes('text/csv')) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'export.csv';
      a.click();
      URL.revokeObjectURL(url);
      return { success: true } as AdminApiResponse<T>;
    }

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error?.message || 'Request failed');
    }
    return json;
  }

  async get<T>(endpoint: string): Promise<AdminApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<AdminApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

const adminClient = new AdminApiClient();

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  subscription_status: string;
  profile_completed: boolean;
  created_at: string;
  latest_subscription: {
    type: string;
    status: string;
    amount: number | null;
    starts_at: string;
    expires_at: string;
    payment_id: string | null;
  } | null;
}

export const adminPanelApi = {
  login: (username: string, password: string) =>
    adminClient.post<{ token: string; username: string }>('/admin-panel/login', { username, password }),

  getUsers: () =>
    adminClient.get<AdminUser[]>('/admin-panel/users'),

  approveTrial: (userId: string) =>
    adminClient.post<any>('/admin-panel/approve-trial', { user_id: userId }),

  rejectTrial: (userId: string) =>
    adminClient.post<any>('/admin-panel/reject-trial', { user_id: userId }),

  exportCsv: () =>
    adminClient.get<any>('/admin-panel/export-csv'),
};

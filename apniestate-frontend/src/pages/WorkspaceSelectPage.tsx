import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Building2, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { apiClient } from '@/api/client';

interface Workspace {
  id: string;
  user_id: string;
  company_id: string;
  roles: string[];
  company: {
    id: string;
    name: string;
  };
}

export default function WorkspaceSelectPage() {
  const navigate = useNavigate();
  const { user, setAuthSession } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  
  // For company creation
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyRole, setNewCompanyRole] = useState('BUILDER');
  const [creatingLoading, setCreatingLoading] = useState(false);

  useEffect(() => {
    // If not authenticated (no base token), go to login
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWorkspaces();
  }, [user]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ memberships: Workspace[] }>('/auth/workspaces');
      if (res.success && res.data) {
        const list = res.data.memberships;
        setWorkspaces(list);
        
        // Auto-select if only 1 workspace and no active workspace is selected
        if (list.length === 1 && !user?.company_id) {
          handleSelectWorkspace(list[0].company_id, list[0].roles[0]);
        } else if (list.length === 0) {
          // If no workspaces, force creating a new one
          setIsCreating(true);
        } else if (user?.company_id) {
          // If they already have an active workspace, let them stay on the select screen
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkspace = async (companyId: string, role: string) => {
    try {
      setSwitchingTo(companyId);
      const res = await apiClient.post<{ accessToken: string, user: any }>('/auth/switch-workspace', {
        company_id: companyId,
        role: role
      });

      if (res.success && res.data) {
        // We need to update the AuthContext with the new token and user
        setAuthSession(res.data.accessToken, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to switch workspace', err);
    } finally {
      setSwitchingTo(null);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    try {
      setCreatingLoading(true);
      const res = await apiClient.post<{ company: any, membership: any }>('/companies/create', { name: newCompanyName, role: newCompanyRole });
      if (res.success) {
        // Successfully created, the backend auto-switches us. But we need the new token.
        // Actually, backend didn't issue a new token in /companies/create. 
        // We should just call switch-workspace to get the token!
        await handleSelectWorkspace(res.data!.company.id, newCompanyRole);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6', padding: '20px' }}>
      <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', background: '#EFF6FF', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Building2 size={24} color="#3B82F6" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Select Workspace</h1>
          <p style={{ color: '#6B7280', fontSize: '15px' }}>Choose a company context to continue</p>
        </div>

        {!isCreating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.company_id, ws.roles[0])} // default to first role for now
                disabled={switchingTo !== null}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB',
                  background: '#FFFFFF', cursor: 'pointer', transition: 'all 0.2s',
                  opacity: switchingTo === ws.company_id ? 0.7 : 1
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = '#E5E7EB')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#374151' }}>
                    {ws.company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>{ws.company.name}</div>
                    <div style={{ color: '#6B7280', fontSize: '13px' }}>Role: {ws.roles[0]}</div>
                  </div>
                </div>
                {switchingTo === ws.company_id ? <Loader2 size={20} className="animate-spin text-blue-600" /> : <ChevronRight size={20} color="#9CA3AF" />}
              </button>
            ))}

            <button
              onClick={() => setIsCreating(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '16px', borderRadius: '12px', border: '1px dashed #D1D5DB',
                background: 'transparent', cursor: 'pointer', color: '#4B5563', fontWeight: 600,
                marginTop: '8px'
              }}
            >
              <Plus size={18} /> Create New Company
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Company Name</label>
              <input 
                type="text" 
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. Apni Estate Enterprise"
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '15px', marginBottom: '16px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Your Role in Company</label>
              <select 
                value={newCompanyRole}
                onChange={(e) => setNewCompanyRole(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '15px' }}
              >
                <option value="BUILDER">Builder / Owner</option>
                <option value="PROJECT_MANAGER">Project Manager</option>
                <option value="SITE_SUPERVISOR">Site Supervisor</option>
                <option value="ACCOUNTANT">Accountant</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                disabled={creatingLoading || workspaces.length === 0}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', background: workspaces.length === 0 ? '#F3F4F6' : '#FFFFFF', color: workspaces.length === 0 ? '#9CA3AF' : '#111827', fontWeight: 600, cursor: workspaces.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingLoading}
                style={{ flex: 2, padding: '12px', borderRadius: '8px', border: 'none', background: '#0A3D91', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {creatingLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create & Continue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

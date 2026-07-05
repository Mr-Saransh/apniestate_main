import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Building2, ChevronRight, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { apiClient } from '@/api/client';
import { Membership } from '@/api/auth';

export default function WorkspaceSelectPage() {
  const navigate = useNavigate();
  const { user, memberships, switchWorkspace } = useAuth();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  
  // For company creation
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [creatingLoading, setCreatingLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user]);

  const handleSelectWorkspace = async (companyId: string, role: string) => {
    try {
      setSwitchingTo(companyId);
      await switchWorkspace(companyId, role);
      navigate('/dashboard', { replace: true });
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
      const res = await apiClient.post<{ company: any, membership: any }>('/companies/create', { name: newCompanyName });
      if (res.success && res.data) {
        // Switch to the newly created workspace
        await handleSelectWorkspace(res.data.company.id, 'BUILDER');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingLoading(false);
    }
  };

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
            {memberships.map(ws => (
              <div key={ws.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px', borderRadius: '12px', border: '1px solid #E5E7EB', background: '#FFFFFF' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#374151' }}>
                    {ws.company.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ textAlign: 'left', flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>{ws.company.name}</div>
                    <div style={{ color: '#6B7280', fontSize: '13px' }}>Select a role to login as:</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ws.roles.map(role => (
                    <button
                      key={role}
                      onClick={() => handleSelectWorkspace(ws.company_id, role)}
                      disabled={switchingTo !== null}
                      style={{
                        padding: '8px 12px', borderRadius: '6px', border: '1px solid #E5E7EB',
                        background: '#F9FAFB', cursor: 'pointer', transition: 'all 0.2s', fontSize: '13px', fontWeight: 500, color: '#374151',
                        opacity: switchingTo === ws.company_id ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      {role.replace('_', ' ')}
                      {switchingTo === ws.company_id ? <Loader2 size={14} className="animate-spin text-blue-600" /> : <ChevronRight size={14} color="#9CA3AF" />}
                    </button>
                  ))}
                </div>
              </div>
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
            
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
               <Link to="/my-invitations" style={{ fontSize: '14px', color: '#3B82F6', textDecoration: 'none' }}>Check Pending Invitations</Link>
            </div>
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
              <p style={{ fontSize: '12px', color: '#6B7280' }}>You will automatically be assigned the <b>Builder (Owner)</b> role for this company.</p>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                disabled={creatingLoading || memberships.length === 0}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', background: memberships.length === 0 ? '#F3F4F6' : '#FFFFFF', color: memberships.length === 0 ? '#9CA3AF' : '#111827', fontWeight: 600, cursor: memberships.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingLoading || !newCompanyName.trim()}
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

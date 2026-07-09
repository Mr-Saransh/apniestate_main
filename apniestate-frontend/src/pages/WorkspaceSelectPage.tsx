import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Building2, ChevronRight, Plus, Loader2, Users, Sparkles } from 'lucide-react';
import { apiClient } from '@/api/client';
import '@/styles/company-selection.css';

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
  }, [user, navigate]);

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
    <div className="cs-page">
      <div className="cs-bg-gradient" />
      <div className="cs-bg-orb cs-bg-orb-1" />
      <div className="cs-bg-orb cs-bg-orb-2" />

      <div className="cs-container">
        <div className="cs-header">
          <div className="cs-logo-icon">
            {isCreating ? <Sparkles size={32} /> : <Building2 size={32} />}
          </div>
          <h1 className="cs-title">
            {isCreating ? 'Create Your Company' : 'Select Workspace'}
          </h1>
          <p className="cs-subtitle">
            {isCreating
              ? 'Set up your construction workspace to get started.'
              : `Welcome back, ${user?.name || 'User'}. Choose a company context to continue.`}
          </p>
        </div>

        {!isCreating ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="cs-company-list">
              {memberships.map(ws => (
                <div key={ws.id} className="cs-company-card" style={{ flexDirection: 'column', alignItems: 'stretch', cursor: 'default' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                    <div className="cs-company-avatar">
                      {ws.company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="cs-company-info">
                      <div className="cs-company-name">{ws.company.name}</div>
                      <div className="cs-company-meta">
                        <span className="cs-meta-item">
                          <Users size={12} /> {ws.roles.length} Role{ws.roles.length !== 1 ? 's' : ''} available
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {ws.roles.map(role => (
                      <button
                        key={role}
                        onClick={() => handleSelectWorkspace(ws.company_id, role)}
                        disabled={switchingTo !== null}
                        style={{
                          padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.4)',
                          background: 'rgba(255,255,255,0.15)', cursor: switchingTo ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontSize: '13px', fontWeight: 600, color: '#FFFFFF',
                          opacity: switchingTo === ws.company_id ? 0.7 : 1,
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
                      >
                        {role.replace('_', ' ')}
                        {switchingTo === ws.company_id ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} style={{ opacity: 0.8 }} />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="cs-btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <Plus size={18} /> Create New Company
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <Link to="/my-invitations" style={{ fontSize: '14px', color: '#FFFFFF', textDecoration: 'underline', opacity: 0.9, fontWeight: 500 }}>Check Pending Invitations</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateCompany} className="cs-create-section">
            <div className="cs-form-group">
              <label className="cs-label">Company Name</label>
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="e.g. Apni Estate Enterprise"
                required
                className="cs-input"
                style={{ marginBottom: '16px' }}
              />
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>You will automatically be assigned the <b>Builder (Owner)</b> role for this company.</p>
            </div>

            <div className="cs-actions" style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                disabled={creatingLoading || memberships.length === 0}
                className="cs-btn-outline"
                style={{ flex: 1, justifyContent: 'center', opacity: memberships.length === 0 ? 0.5 : 1, cursor: memberships.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingLoading || !newCompanyName.trim()}
                className="cs-btn-primary"
                style={{ flex: 2, justifyContent: 'center' }}
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

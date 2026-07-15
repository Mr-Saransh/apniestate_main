import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminPanelApi, type AdminUser } from '@/api/adminPanel';
import { LogOut, Download, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import Logo from '@/components/shared/Logo';
import '@/styles/admin-panel.css';

type FilterTab = 'ALL' | 'PENDING' | 'ACTIVE' | 'EXPIRED';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  useEffect(() => {
    // Check auth
    if (!localStorage.getItem('admin_panel_token')) {
      navigate('/apni-admin/login', { replace: true });
      return;
    }
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminPanelApi.getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
      if (err.message?.includes('Unauthorized') || err.message?.includes('token')) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_panel_token');
    navigate('/apni-admin/login', { replace: true });
  };

  const handleExportCSV = async () => {
    try {
      await adminPanelApi.exportCsv();
    } catch (err: any) {
      alert(err.message || 'Failed to export CSV');
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const res = await adminPanelApi.approveTrial(userId);
      if (res.success) {
        // Optimistic update
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, subscription_status: 'TRIAL_ACTIVE' }
            : u
        ));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to approve trial');
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Are you sure you want to reject this trial request?')) return;
    
    try {
      const res = await adminPanelApi.rejectTrial(userId);
      if (res.success) {
        setUsers(users.map(u => 
          u.id === userId 
            ? { ...u, subscription_status: 'NONE' }
            : u
        ));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reject trial');
    }
  };

  // Stats
  const stats = {
    total: users.length,
    paid: users.filter(u => u.subscription_status === 'ACTIVE').length,
    trial: users.filter(u => u.subscription_status === 'TRIAL_ACTIVE').length,
    pending: users.filter(u => u.subscription_status === 'PENDING_TRIAL').length,
  };

  // Filter
  const filteredUsers = users.filter(u => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return u.subscription_status === 'PENDING_TRIAL';
    if (activeTab === 'ACTIVE') return ['ACTIVE', 'TRIAL_ACTIVE'].includes(u.subscription_status);
    if (activeTab === 'EXPIRED') return ['EXPIRED', 'TRIAL_EXPIRED'].includes(u.subscription_status);
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <span className="admin-status paid">Paid Active</span>;
      case 'TRIAL_ACTIVE': return <span className="admin-status trial-active">Trial Active</span>;
      case 'PENDING_TRIAL': return <span className="admin-status pending">Pending Trial</span>;
      case 'EXPIRING_SOON': return <span className="admin-status expiring">Expiring Soon</span>;
      case 'EXPIRED':
      case 'TRIAL_EXPIRED': return <span className="admin-status expired">Expired</span>;
      default: return <span className="admin-status none">None</span>;
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-topbar">
        <div className="admin-title">
          <Logo size="sm" />
          <h1>Admin Dashboard</h1>
          <span className="confidential">Confidential</span>
        </div>
        <div className="admin-topbar-actions">
          <button className="admin-btn csv" onClick={handleExportCSV}>
            <Download size={14} />
            Export CSV
          </button>
          <button className="admin-btn danger" onClick={handleLogout}>
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat-card total">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="admin-stat-card paid">
          <div className="stat-label">Paid Active</div>
          <div className="stat-value">{stats.paid}</div>
        </div>
        <div className="admin-stat-card trial">
          <div className="stat-label">Trial Active</div>
          <div className="stat-value">{stats.trial}</div>
        </div>
        <div className="admin-stat-card pending">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value">{stats.pending}</div>
        </div>
      </div>

      <div className="admin-filters">
        <button 
          className={`admin-filter-btn ${activeTab === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Users
        </button>
        <button 
          className={`admin-filter-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Pending Trials ({stats.pending})
        </button>
        <button 
          className={`admin-filter-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setActiveTab('ACTIVE')}
        >
          Active Subscriptions
        </button>
        <button 
          className={`admin-filter-btn ${activeTab === 'EXPIRED' ? 'active' : ''}`}
          onClick={() => setActiveTab('EXPIRED')}
        >
          Expired
        </button>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-empty">Loading data...</div>
        ) : error ? (
          <div className="admin-empty" style={{ color: '#f87171' }}>{error}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty">
            <p>No users found for this filter.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Location</th>
                <th>Status</th>
                <th>Plan Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff', marginBottom: 2 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                      {user.email} <br/> {user.phone || 'No phone'}
                    </div>
                  </td>
                  <td>
                    {user.city || user.state ? (
                      <>
                        <div style={{ color: '#fff' }}>{user.city || '-'}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{user.state || '-'}</div>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>Incomplete Profile</span>
                    )}
                  </td>
                  <td>{getStatusBadge(user.subscription_status)}</td>
                  <td>
                    {user.latest_subscription ? (
                      <>
                        <div style={{ color: '#fff' }}>
                          {user.latest_subscription.type === 'PAID' ? '₹' + user.latest_subscription.amount : 'Trial'}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                          Exp: {new Date(user.latest_subscription.expires_at).toLocaleDateString()}
                        </div>
                      </>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>
                    )}
                  </td>
                  <td>
                    {user.subscription_status === 'PENDING_TRIAL' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="admin-action-btn approve"
                          onClick={() => handleApprove(user.id)}
                        >
                          <CheckCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                          Approve
                        </button>
                        <button 
                          className="admin-action-btn reject"
                          onClick={() => handleReject(user.id)}
                        >
                          <XCircle size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Shield, CheckCircle2, XCircle, Clock, ChevronRight, Settings, AlertCircle, FileText, ShoppingCart, Users, Package } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';

const entityTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  EXPENSE: { label: 'Expenses', icon: FileText, color: '#F59E0B' },
  PO: { label: 'Purchase Orders', icon: ShoppingCart, color: '#3B82F6' },
  LEAVE: { label: 'Leave Requests', icon: Users, color: '#8B5CF6' },
  MATERIAL_REQUEST: { label: 'Material Requests', icon: Package, color: '#10B981' },
  BUDGET_CHANGE: { label: 'Budget Changes', icon: FileText, color: '#EF4444' },
  CASHBOOK: { label: 'Cashbook Entries', icon: FileText, color: '#EC4899' },
  VENDOR_PAYMENT: { label: 'Vendor Payments', icon: FileText, color: '#14B8A6' },
  INVOICE: { label: 'Invoices', icon: FileText, color: '#F97316' },
  ADVANCE_SALARY: { label: 'Advance Salary', icon: Users, color: '#6366F1' }
};

const ROLES = ['SITE_SUPERVISOR', 'PROJECT_MANAGER', 'BUILDER'];

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'chains' | 'logs'>('pending');
  const [showChainModal, setShowChainModal] = useState(false);
  const [chainEntityType, setChainEntityType] = useState('EXPENSE');
  const [chainName, setChainName] = useState('');
  const [chainSteps, setChainSteps] = useState<{role: string; label: string}[]>([
    { role: 'SITE_SUPERVISOR', label: 'Supervisor Review' },
    { role: 'PROJECT_MANAGER', label: 'Manager Approval' },
    { role: 'BUILDER', label: 'Builder Final Approval' }
  ]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const res = await apiClient.get<any>('/approvals');
      if (res.data) setData(res.data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveChain = async () => {
    if (!chainName || chainSteps.length === 0) return;
    setSaving(true);
    try {
      await apiClient.post('/approvals', {
        action: 'create_chain',
        entity_type: chainEntityType,
        name: chainName,
        steps: chainSteps
      });
      await loadData();
      setShowChainModal(false);
    } catch (err) {
      console.error('Failed to save chain:', err);
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => setChainSteps(prev => [...prev, { role: 'BUILDER', label: '' }]);
  const removeStep = (idx: number) => setChainSteps(prev => prev.filter((_, i) => i !== idx));

  if (loading) return <LoadingSpinner size="lg" />;

  const summary = data?.summary || {};
  const chains = data?.chains || [];
  const logs = data?.recentLogs || [];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={28} color="var(--color-primary)" /> Approval Center
            </h1>
            <p className="page-subtitle">Manage approval workflows, review pending items, and view audit trails.</p>
          </div>
          {(user?.role === 'BUILDER' || user?.role === 'ADMIN') && (
            <button className="btn btn-primary" onClick={() => setShowChainModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Settings size={16} /> Configure Chains
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        {Object.entries(entityTypeConfig).slice(0, 4).map(([key, config]) => {
          const Icon = config.icon;
          const count = summary[key === 'PO' ? 'purchaseOrders' : key === 'MATERIAL_REQUEST' ? 'materialRequests' : key.toLowerCase() + 's'] || 0;
          return (
            <div key={key} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>{config.label}</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: count > 0 ? config.color : 'var(--color-text)', margin: '4px 0 0' }}>{count}</h3>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${config.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={config.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        {[
          { id: 'pending' as const, label: `Pending (${summary.total || 0})` },
          { id: 'chains' as const, label: `Approval Chains (${chains.length})` },
          { id: 'logs' as const, label: 'Audit Trail' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`filter-chip ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <div>
          {summary.total === 0 ? (
            <EmptyState icon={<CheckCircle2 size={36} />} title="All Clear" description="No items pending approval at this time." />
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-body" style={{ padding: 0 }}>
                {summary.expenses > 0 && (
                  <a href="/finance" className="list-card hover-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="list-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><FileText size={20} /></div>
                    <div className="list-card-content">
                      <div className="list-card-title">{summary.expenses} Expense Vouchers</div>
                      <div className="list-card-subtitle">Awaiting review and approval</div>
                    </div>
                    <ChevronRight size={20} color="var(--color-text-muted)" />
                  </a>
                )}
                {summary.purchaseOrders > 0 && (
                  <a href="/vendors" className="list-card hover-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="list-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}><ShoppingCart size={20} /></div>
                    <div className="list-card-content">
                      <div className="list-card-title">{summary.purchaseOrders} Purchase Orders</div>
                      <div className="list-card-subtitle">Awaiting approval before dispatch</div>
                    </div>
                    <ChevronRight size={20} color="var(--color-text-muted)" />
                  </a>
                )}
                {summary.leaves > 0 && (
                  <a href="/leaves" className="list-card hover-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="list-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}><Users size={20} /></div>
                    <div className="list-card-content">
                      <div className="list-card-title">{summary.leaves} Leave Requests</div>
                      <div className="list-card-subtitle">Workers waiting for leave approval</div>
                    </div>
                    <ChevronRight size={20} color="var(--color-text-muted)" />
                  </a>
                )}
                {summary.materialRequests > 0 && (
                  <a href="/materials" className="list-card hover-row" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="list-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}><Package size={20} /></div>
                    <div className="list-card-content">
                      <div className="list-card-title">{summary.materialRequests} Material Requests</div>
                      <div className="list-card-subtitle">Site requests pending approval</div>
                    </div>
                    <ChevronRight size={20} color="var(--color-text-muted)" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chains' && (
        <div>
          {chains.length === 0 ? (
            <EmptyState icon={<Settings size={36} />} title="No Chains Configured" description="Set up approval chains to enable multi-level approvals." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {chains.map((chain: any) => (
                <div key={chain.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text)' }}>{chain.name}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        Entity: {entityTypeConfig[chain.entity_type]?.label || chain.entity_type}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '8px',
                      background: chain.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                      color: chain.is_active ? '#10B981' : '#6B7280'
                    }}>
                      {chain.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {/* Steps visualization */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {chain.steps.map((step: any, idx: number) => (
                      <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
                          background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)'
                        }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', background: 'rgba(59,130,246,0.1)', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {step.step_order}
                          </span>
                          <div>
                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>
                              {step.label || step.role.replace(/_/g, ' ')}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{step.role.replace(/_/g, ' ')}</div>
                          </div>
                        </div>
                        {idx < chain.steps.length - 1 && <ChevronRight size={16} color="var(--color-text-muted)" />}
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.06)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>Approved</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div>
          {logs.length === 0 ? (
            <EmptyState icon={<Clock size={36} />} title="No Audit Logs" description="Approval actions will appear here as they are processed." />
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-body" style={{ padding: 0 }}>
                {logs.map((log: any) => (
                  <div key={log.id} className="list-card" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="list-card-icon" style={{
                      background: log.action === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : log.action === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: log.action === 'APPROVED' ? '#10B981' : log.action === 'REJECTED' ? '#EF4444' : '#F59E0B'
                    }}>
                      {log.action === 'APPROVED' ? <CheckCircle2 size={20} /> : log.action === 'REJECTED' ? <XCircle size={20} /> : <Clock size={20} />}
                    </div>
                    <div className="list-card-content">
                      <div className="list-card-title">
                        {log.user?.name || 'User'} {log.action.toLowerCase()} {log.entity_type.replace(/_/g, ' ')}
                      </div>
                      <div className="list-card-subtitle">
                        Step {log.step_order} · {log.role.replace(/_/g, ' ')}
                        {log.comments && ` · "${log.comments}"`}
                      </div>
                    </div>
                    <div className="list-card-date">
                      {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chain Configuration Modal */}
      <Modal
        isOpen={showChainModal}
        onClose={() => setShowChainModal(false)}
        title="Configure Approval Chain"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowChainModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveChain} disabled={saving || !chainName}>
              {saving ? 'Saving...' : 'Save Chain'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Entity Type</label>
            <select className="form-input form-select" value={chainEntityType} onChange={e => setChainEntityType(e.target.value)}>
              {Object.entries(entityTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Chain Name</label>
            <input className="form-input" placeholder="e.g. Standard Expense Approval" value={chainName} onChange={e => setChainName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Approval Steps</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {chainSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', width: 24, textAlign: 'center' }}>{idx + 1}</span>
                  <select className="form-input form-select" value={step.role} onChange={e => {
                    const updated = [...chainSteps];
                    updated[idx].role = e.target.value;
                    setChainSteps(updated);
                  }} style={{ flex: 1 }}>
                    {ROLES.map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
                  </select>
                  <input className="form-input" placeholder="Label" value={step.label} onChange={e => {
                    const updated = [...chainSteps];
                    updated[idx].label = e.target.value;
                    setChainSteps(updated);
                  }} style={{ flex: 1 }} />
                  {chainSteps.length > 1 && (
                    <button className="btn btn-secondary btn-sm" onClick={() => removeStep(idx)} style={{ padding: '4px 8px', minHeight: 'unset' }}>
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addStep} style={{ alignSelf: 'flex-start', fontSize: '12px' }}>
                + Add Step
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

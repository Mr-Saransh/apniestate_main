import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calculator,
  Wallet,
  FileText,
  TrendingUp,
  AlertCircle,
  Plus,
  CheckCircle,
  Truck
} from 'lucide-react';
import { apiClient } from '@/api/client';
import EmptyState from '@/components/shared/EmptyState';

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [expRes, invRes, payRes] = await Promise.all([
          apiClient.get<any[]>('/finance'),
          apiClient.get<any[]>('/invoices').catch(() => ({ data: [] } as any)),
          apiClient.get<any[]>('/payments').catch(() => ({ data: [] } as any))
        ]);

        if (expRes.success && expRes.data) setExpenses(expRes.data);
        if (invRes.success && invRes.data) setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
        if (payRes.success && payRes.data) setPayments(Array.isArray(payRes.data) ? payRes.data : []);
      } catch (err) {
        console.error('Failed to load Accountant dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="sd-skeleton sd-skeleton-hero" style={{ height: '80px', borderRadius: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="sd-skeleton sd-skeleton-card" style={{ height: '140px', borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalApprovedExpenses = expenses
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const pendingVouchers = expenses.filter(e => e.status === 'PENDING').length;
  const pendingInvoicesAmount = invoices
    .filter(i => i.status === 'PENDING' || i.status === 'PARTIAL')
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      <header style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Finance Ledger</span>
        <h1 style={{ fontSize: '28px', color: 'var(--color-text)', fontWeight: 800, letterSpacing: '-0.02em', marginTop: '4px' }}>Accountant Ledger Board</h1>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', fontSize: '14px' }}>Handle expense approvals, vendor invoices, cash flows, and GST audit entries.</p>
      </header>

      {/* KPI Grid */}
      <div className="builder-grid-kpis">
        {[
          { title: 'Total Audited Disbursements', value: `₹${totalApprovedExpenses.toLocaleString('en-IN')}`, icon: TrendingUp, color: '#16A34A', bg: 'rgba(22, 163, 74, 0.06)' },
          { title: 'Pending Expense Vouchers', value: `${pendingVouchers} Vouchers`, icon: Calculator, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.06)' },
          { title: 'Outstanding Invoice Value', value: `₹${pendingInvoicesAmount.toLocaleString('en-IN')}`, icon: FileText, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.06)' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ y: -4, boxShadow: '0 12px 20px rgba(0,0,0,0.04)' }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 6px rgba(0,0,0,0.01)'
              }}
            >
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 550 }}>{kpi.title}</span>
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text)', margin: '6px 0 0 0', letterSpacing: '-0.02em' }}>
                  {kpi.value}
                </h3>
              </div>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: kpi.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: kpi.color
              }}>
                <Icon size={22} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Sections */}
      <div className="builder-grid-sections">
        {/* Recent Cashbook / Expense log */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Expense Disbursements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {expenses.length === 0 ? (
              <EmptyState icon={<Calculator size={28} />} title="No Expense Vouchers" description="There are no pending cashbook or expense vouchers to reconcile." />
            ) : (
              expenses.slice(0, 5).map((exp) => (
                <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{exp.category}</h5>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{exp.description || 'Voucher disbursement'}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#DC2626' }}>-₹{exp.amount.toLocaleString('en-IN')}</span>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: exp.status === 'APPROVED' ? '#16A34A' : '#F59E0B', marginTop: '2px' }}>{exp.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Outstanding Invoice Payments */}
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '16px' }}>Outstanding Purchase Invoices</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {invoices.length === 0 ? (
              <EmptyState icon={<FileText size={28} />} title="All Invoices Settled" description="No outstanding supplier purchase invoices require reconciliation." />
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                  <div>
                    <h5 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>Inv #{invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}</h5>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Supplier: {invoice.vendor?.name || 'Local Supplier'}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>₹{invoice.amount.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDashboardQuery } from '@/hooks/useDashboardQuery';
import { IndianRupee, FileText, FileDown, ArrowDownToLine, TrendingUp, AlertTriangle } from 'lucide-react';
import { KPI, Card } from '@/components/shared/FigmaComponents';

export default function AccountantDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardQuery<any>('/dashboard/accountant', {
    refetchInterval: 12000
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Try to use real data or fallback to defaults for demo
  const cashIn = data.overview?.cashIn || 250000;
  const cashOut = data.overview?.cashOut || 180000;
  const pendingInvoices = data.overview?.pendingInvoices || 12;
  const unverifiedPO = data.overview?.unverifiedPO || 4;

  const name = user?.name ? user.name.split(' ')[0] : 'Accountant';
  const hr = new Date().getHours();
  const greeting = hr < 12 ? `Good morning, ${name} ☀️` : (hr < 17 ? `Good afternoon, ${name} ☀️` : `Good evening, ${name} 🌙`);

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'AC';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground">{greeting}</h1>
          <p className="text-[11px] text-muted-foreground">{formattedDate} • Finance Desk</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Cash In (Today)" value={`₹${cashIn.toLocaleString()}`} icon={TrendingUp} trend={{ up: true, v: "15%" }} />
        <KPI label="Cash Out (Today)" value={`₹${cashOut.toLocaleString()}`} icon={ArrowDownToLine} trend={{ up: true, v: "8%" }} />
        <KPI label="Pending Invoices" value={pendingInvoices.toString()} icon={FileText} trend={{ up: false, v: "-2" }} />
        <KPI label="Unverified POs" value={unverifiedPO.toString()} icon={FileDown} trend={{ up: false, v: "+1" }} />
      </div>

      <Card title="Pending Transactions" noPad>
        <div className="p-4 space-y-3">
          {[
            { t: 'Vendor Payment - Steel', amount: '₹1,45,000', status: 'Requires Approval' },
            { t: 'Labour Payroll W3', amount: '₹82,500', status: 'Processing' },
            { t: 'Petty Cash - Site A', amount: '₹5,000', status: 'Pending' }
          ].map((tx, i) => (
            <div key={i} className="flex justify-between items-center pb-2 border-b border-border last:border-0 last:pb-0">
              <div>
                <p className="text-xs font-bold text-foreground">{tx.t}</p>
                <p className="text-[10px] text-muted-foreground">{tx.status}</p>
              </div>
              <span className="text-[12px] font-bold text-foreground">
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </Card>
      
      <Card title="Financial Alerts">
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-amber-50 p-2 rounded-lg border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">Budget Limit Warning</p>
              <p className="text-[10px] text-amber-700">Project Alpha has reached 90% of its monthly material budget.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { Wallet } from 'lucide-react';
import CashbookPage from './FinancePage';
import InvoicesPage from './InvoicesPage';
import PaymentsPage from './PaymentsPage';
import ExpensesPage from './ExpensesPage';
import BudgetsPage from './BudgetsPage';

export default function FinanceWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProject();
  const tab = searchParams.get('tab') || 'cashbook';
  
  const tabs = [
    { id: 'cashbook', label: 'Cashbook' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'payments', label: 'Payments' },
    { id: 'budgets', label: 'Budgets' },
  ];

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Wallet size={48} className="text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Project Selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Please select a project from the top bar to view finance operations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="bg-white border-b border-border px-4 pt-4 pb-0 shrink-0 sticky top-0 z-10">
        <h2 className="text-base font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>Finance</h2>
        <div className="flex gap-0 overflow-x-auto hide-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSearchParams({ tab: t.id }, { replace: true })}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                tab === t.id ? "border-[#2648E7] text-[#2648E7]" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full">
        {tab === 'cashbook' && (
          <div className="max-w-2xl mx-auto px-4 py-5"><CashbookPage /></div>
        )}
        {tab === 'expenses' && (
          <div className="max-w-2xl mx-auto px-4 py-5"><ExpensesPage /></div>
        )}
        {tab === 'invoices' && (
          <div className="max-w-2xl mx-auto px-4 py-5"><InvoicesPage /></div>
        )}
        {tab === 'payments' && (
          <div className="max-w-2xl mx-auto px-4 py-5"><PaymentsPage /></div>
        )}
        {tab === 'budgets' && (
          <div className="max-w-2xl mx-auto px-4 py-5"><BudgetsPage /></div>
        )}
      </div>
    </div>
  );
}

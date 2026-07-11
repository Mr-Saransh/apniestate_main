import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { Landmark, Receipt, FileText, CreditCard, PieChart } from 'lucide-react';

import FinancePage from './FinancePage';
import ExpensesPage from './ExpensesPage';
import InvoicesPage from './InvoicesPage';
import PaymentsPage from './PaymentsPage';
import BudgetsPage from './BudgetsPage';

export default function FinanceWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProject();
  
  const currentTab = searchParams.get('tab') || 'cashbook';
  
  const tabs = [
    { id: 'cashbook', label: 'Cashbook', icon: Landmark },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'payments', label: 'Vendor Payments', icon: CreditCard },
    { id: 'budgets', label: 'Budget', icon: PieChart },
  ];

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-slate-400 mb-4"><Landmark size={48} /></div>
        <h2 className="text-xl font-semibold text-slate-700">No Project Selected</h2>
        <p className="text-slate-500 mt-2">Please select a project from the top bar to view finance operations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Project Finance</h1>
            <p className="text-sm text-slate-500 mt-1">Manage cashbook, expenses, invoices, and budgets.</p>
          </div>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
          {tabs.map(tab => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1">
        {currentTab === 'cashbook' && <FinancePage />}
        {currentTab === 'expenses' && <ExpensesPage />}
        {currentTab === 'invoices' && <InvoicesPage />}
        {currentTab === 'payments' && <PaymentsPage />}
        {currentTab === 'budgets' && <BudgetsPage />}
      </div>
    </div>
  );
}

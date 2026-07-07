import React, { useState } from 'react';
import { Receipt, Calendar, CreditCard, Plus } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';

export default function ExpensesPage() {
  const [search, setSearch] = useState('');

  // Mock data for Expenses
  const expenses = [
    { id: 'EXP-901', title: 'Site Office Fuel', amount: 15000, date: '2026-07-06', status: 'APPROVED', category: 'Fuel' },
    { id: 'EXP-902', title: 'Misc Hardware Tools', amount: 8500, date: '2026-07-06', status: 'PENDING', category: 'Tools' },
    { id: 'EXP-903', title: 'Team Lunch', amount: 4200, date: '2026-07-05', status: 'APPROVED', category: 'Meals' },
    { id: 'EXP-904', title: 'Generator Repair', amount: 25000, date: '2026-07-02', status: 'REJECTED', category: 'Maintenance' },
  ];

  const filtered = expenses.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()));

  const formatMoney = (val: number) => `₨ ${val.toLocaleString()}`;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PH title="Expenses" sub="Track operational costs and reimbursements" />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search expenses..." />
        </div>
        <button className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors">
          <Plus size={14} /> Log Expense
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(e => (
          <Card key={e.id} noPad>
            <div className="p-4 flex flex-col h-full gap-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug">{e.title}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{e.id} • {e.category}</p>
                </div>
                <Chip color={e.status === 'APPROVED' ? 'green' : e.status === 'REJECTED' ? 'red' : 'yellow'}>
                  {e.status}
                </Chip>
              </div>
              
              <div className="text-lg font-black text-foreground">
                {formatMoney(e.amount)}
              </div>
              
              <div className="mt-auto pt-3 border-t border-border flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(e.date).toLocaleDateString()}</div>
                <div className="flex-1" />
                <div className="flex items-center gap-1"><CreditCard size={12} /> Cash</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

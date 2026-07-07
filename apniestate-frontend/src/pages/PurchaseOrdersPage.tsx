import React, { useState } from 'react';
import { ShoppingCart, Calendar, Clock, Download } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState('');

  // Mock data for POs
  const pos = [
    { id: 'PO-1024', vendor: 'Ittefaq Steel Mills', amount: 450000, date: '2026-07-01', status: 'APPROVED' },
    { id: 'PO-1025', vendor: 'Pakland Cement Ltd.', amount: 125000, date: '2026-07-03', status: 'PENDING' },
    { id: 'PO-1026', vendor: 'Sindh Brick Works', amount: 85000, date: '2026-07-05', status: 'SENT' },
    { id: 'PO-1027', vendor: 'Northern Aggregates', amount: 210000, date: '2026-07-06', status: 'DRAFT' },
  ];

  const filtered = pos.filter(p => p.vendor.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()));

  const formatMoney = (val: number) => {
    if (val >= 100000) return `₨ ${(val / 100000).toFixed(2)}L`;
    return `₨ ${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PH title="Purchase Orders" sub="Track material and service orders" />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search POs..." />
        </div>
        <button className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors">
          <ShoppingCart size={14} /> New PO
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(p => (
          <Card key={p.id} noPad>
            <div className="p-4 flex flex-col h-full gap-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug">{p.vendor}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{p.id}</p>
                </div>
                <Chip color={p.status === 'APPROVED' || p.status === 'SENT' ? 'green' : p.status === 'DRAFT' ? 'gray' : 'yellow'}>
                  {p.status}
                </Chip>
              </div>
              
              <div className="text-lg font-black text-foreground">
                {formatMoney(p.amount)}
              </div>
              
              <div className="mt-auto pt-3 border-t border-border flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(p.date).toLocaleDateString()}</div>
                <div className="flex-1" />
                <button className="p-1.5 hover:bg-muted text-foreground rounded transition-colors"><Download size={14} /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

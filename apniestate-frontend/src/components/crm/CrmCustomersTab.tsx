import React, { useState, useEffect } from 'react';
import {
  IndianRupee, Plus, Building2, UserCheck, Calendar,
  Receipt, Trash2, CheckCircle2, TrendingUp
} from 'lucide-react';
import { crmApi, type CrmDeal, type CrmLead } from '@/api/crm';

interface CrmCustomersTabProps {
  leads: CrmLead[];
  onOpenAddDeal: (lead?: CrmLead) => void;
  onSelectLead: (leadId: string) => void;
}

export default function CrmCustomersTab({
  leads,
  onOpenAddDeal,
  onSelectLead,
}: CrmCustomersTabProps) {
  const [deals, setDeals] = useState<CrmDeal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getDeals();
      if (res.success && res.data) {
        setDeals(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const totalDealValue = deals.reduce((sum, d) => sum + (d.deal_value || 0), 0);
  const totalCommission = deals.reduce((sum, d) => sum + (d.commission || 0), 0);
  const totalReceived = deals.reduce((sum, d) => sum + (d.amount_received || 0), 0);

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal record?')) return;
    try {
      await crmApi.deleteDeal(id);
      await fetchDeals();
    } catch (err) {
      console.error('Failed to delete deal:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Customers & Won Deals</h2>
          <p className="text-xs text-slate-500">Track booked properties, brokerage revenue, and payments</p>
        </div>
        <button
          onClick={() => onOpenAddDeal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} /> Record Deal
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-200/80 shadow-sm">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Total Sales Volume</span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            ₹{totalDealValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{deals.length} total closed properties</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200/80 shadow-sm">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Commission Earned</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{totalCommission.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Brokerage & agency earnings</p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-200/80 shadow-sm">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Amount Received</span>
          <p className="text-2xl font-extrabold text-blue-700 mt-1">
            ₹{totalReceived.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Payments collected to date</p>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Deals Register</h3>
          <span className="text-xs font-bold text-slate-500">{deals.length} records</span>
        </div>

        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
          </div>
        ) : deals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <IndianRupee size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No deals recorded yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Click "Record Deal" to register your first booked client.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                <tr>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Property / Unit</th>
                  <th className="p-4">Deal Value</th>
                  <th className="p-4">Commission</th>
                  <th className="p-4">Amount Received</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Deal Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      <span
                        onClick={() => onSelectLead(d.lead_id)}
                        className="hover:text-[#2648E7] cursor-pointer hover:underline"
                      >
                        {d.customer_name}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-semibold">{d.property_name || '—'}</td>
                    <td className="p-4 font-extrabold text-slate-900">₹{d.deal_value?.toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-emerald-600">₹{d.commission?.toLocaleString('en-IN') || 0}</td>
                    <td className="p-4 font-bold text-blue-600">₹{d.amount_received?.toLocaleString('en-IN') || 0}</td>
                    <td className="p-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold">{d.payment_mode || 'UPI'}</span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {new Date(d.deal_date).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteDeal(d.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Deal"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Plus,
  Building2,
  UserCheck,
  Calendar,
  Receipt,
  Trash2,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Users,
  X,
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

  // Customer Payment Modal
  const [payingDeal, setPayingDeal] = useState<CrmDeal | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payNotes, setPayNotes] = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState('');

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
  const totalReceived = deals.reduce((sum, d) => sum + (d.amount_received || 0), 0);
  const totalDueBalance = deals.reduce(
    (sum, d) => sum + (d.due_amount !== undefined ? d.due_amount : Math.max(0, (d.deal_value || 0) - (d.amount_received || 0))),
    0
  );
  const totalCommission = deals.reduce((sum, d) => sum + (d.commission || 0), 0);

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this deal record?')) return;
    try {
      await crmApi.deleteDeal(id);
      await fetchDeals();
    } catch (err) {
      console.error('Failed to delete deal:', err);
    }
  };

  const handleOpenPay = (deal: CrmDeal) => {
    const currentDue = deal.due_amount !== undefined ? deal.due_amount : Math.max(0, deal.deal_value - deal.amount_received);
    setPayingDeal(deal);
    setPayAmount(currentDue.toString());
    setPayMode('UPI');
    setPayNotes('');
    setPayError('');
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDeal) return;

    const amountNum = parseFloat(payAmount);
    const currentDue = payingDeal.due_amount !== undefined ? payingDeal.due_amount : Math.max(0, payingDeal.deal_value - payingDeal.amount_received);

    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError('Please enter a valid payment amount greater than zero.');
      return;
    }

    if (amountNum > currentDue + 0.01) {
      setPayError(`Payment cannot exceed the remaining due amount of ₹${currentDue.toLocaleString('en-IN')}.`);
      return;
    }

    setPayLoading(true);
    setPayError('');

    try {
      await crmApi.payDealDue(payingDeal.id, {
        amount: amountNum,
        payment_mode: payMode,
        notes: payNotes.trim() || undefined,
      });

      setPayingDeal(null);
      await fetchDeals();
    } catch (err: any) {
      setPayError(err.message || 'Failed to record customer payment');
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Customers & Won Deals</h2>
          <p className="text-xs text-slate-500">
            Track booked properties, customer paid vs due balances, and Channel Partner referrals
          </p>
        </div>
        <button
          onClick={() => onOpenAddDeal()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus size={14} /> Record Deal
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">
            Total Sales Volume
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            ₹{totalDealValue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">{deals.length} properties closed</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider">
            Customer Paid
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-blue-700 mt-1">
            ₹{totalReceived.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Collected revenue</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-red-700 uppercase tracking-wider">
            Customer Due Balance
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-red-700 mt-1">
            ₹{totalDueBalance.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-red-500 mt-1">Pending customer installments</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
            CP Commission
          </span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{totalCommission.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Brokerage & agency payouts</p>
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
            <div className="size-8 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
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
                  <th className="p-4">Total Value</th>
                  <th className="p-4 text-emerald-700">Customer Paid</th>
                  <th className="p-4 text-red-700">Customer Due</th>
                  <th className="p-4">Channel Partner</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Deal Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deals.map((d) => {
                  const dealVal = d.deal_value || 0;
                  const received = d.amount_received || 0;
                  const due = d.due_amount !== undefined ? d.due_amount : Math.max(0, dealVal - received);
                  const isFullyPaid = due <= 0;

                  return (
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

                      <td className="p-4 font-extrabold text-slate-900">
                        ₹{dealVal.toLocaleString('en-IN')}
                      </td>

                      <td className="p-4 font-bold text-emerald-700">
                        ₹{received.toLocaleString('en-IN')}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-bold ${isFullyPaid ? 'text-slate-400' : 'text-red-700'}`}>
                            ₹{due.toLocaleString('en-IN')}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isFullyPaid
                                ? 'bg-emerald-100 text-emerald-700'
                                : received > 0
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isFullyPaid ? 'Settled' : received > 0 ? 'Partial Due' : 'Unpaid'}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-slate-700">
                        {d.channel_partner ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-amber-900 block">{d.channel_partner.name}</span>
                            <span className="font-mono text-[10px] text-amber-700 px-1.5 py-0.2 rounded bg-amber-50 border border-amber-200">
                              {d.channel_partner.referral_code}
                            </span>
                          </div>
                        ) : d.referral_code ? (
                          <span className="font-mono text-[11px] text-amber-800 font-semibold">
                            {d.referral_code}
                          </span>
                        ) : (
                          <span className="text-slate-400">Direct / None</span>
                        )}
                      </td>

                      <td className="p-4 text-slate-600">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold">
                          {d.payment_mode || 'UPI'}
                        </span>
                      </td>

                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(d.deal_date).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isFullyPaid && (
                            <button
                              onClick={() => handleOpenPay(d)}
                              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                              title="Record Customer Payment"
                            >
                              + Pay
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteDeal(d.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Deal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Customer Installment Payment Modal */}
      {payingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <IndianRupee size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Record Customer Payment</h3>
                  <p className="text-[11px] text-slate-500">
                    {payingDeal.customer_name} · {payingDeal.property_name || 'Property'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayingDeal(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              {payError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Deal Balance Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Property / Deal Value:</span>
                  <span className="font-bold text-slate-900">₹{(payingDeal.deal_value || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-bold text-emerald-700">₹{(payingDeal.amount_received || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="h-px bg-slate-200 my-1" />
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-red-700">Current Customer Due:</span>
                  <span className="font-black text-red-700 text-sm">
                    ₹{(
                      payingDeal.due_amount !== undefined
                        ? payingDeal.due_amount
                        : Math.max(0, (payingDeal.deal_value || 0) - (payingDeal.amount_received || 0))
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-base font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Direct Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Installment payment ref TXN-4921"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayingDeal(null)}
                  disabled={payLoading}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {payLoading && (
                    <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

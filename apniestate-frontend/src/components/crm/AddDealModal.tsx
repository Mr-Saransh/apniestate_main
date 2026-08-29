import React, { useState } from 'react';
import { X, IndianRupee, Building2, CheckCircle2 } from 'lucide-react';
import { crmApi, type CrmLead } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';

interface AddDealModalProps {
  lead: CrmLead | null;
  leads?: CrmLead[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDealModal({
  lead,
  leads = [],
  isOpen,
  onClose,
  onSuccess,
}: AddDealModalProps) {
  const { projects } = useProject();
  const [selectedLeadId, setSelectedLeadId] = useState(lead?.id || '');
  const [customerName, setCustomerName] = useState(lead?.name || '');
  const [propertyName, setPropertyName] = useState(lead?.project?.name || '');
  const [dealValue, setDealValue] = useState('');
  const [commission, setCommission] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [dealDate, setDealDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (lead) {
      setSelectedLeadId(lead.id);
      setCustomerName(lead.name);
      setPropertyName(lead.project?.name || '');
    } else if (leads.length > 0 && !selectedLeadId) {
      setSelectedLeadId(leads[0].id);
      setCustomerName(leads[0].name);
    }
  }, [lead, leads]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !customerName.trim()) {
      setError('Please select a lead and customer name');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.createDeal({
        lead_id: selectedLeadId,
        customer_name: customerName.trim(),
        property_name: propertyName.trim() || undefined,
        deal_value: Number(dealValue) || 0,
        commission: Number(commission) || 0,
        amount_received: Number(amountReceived) || 0,
        payment_mode: paymentMode,
        transaction_id: transactionId.trim() || undefined,
        deal_date: new Date(dealDate).toISOString(),
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to record deal');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Record Won Deal</h2>
              <p className="text-xs text-white/80">Convert lead into booked client & record revenue</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          {!lead && leads.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Lead</label>
              <select
                value={selectedLeadId}
                onChange={e => {
                  setSelectedLeadId(e.target.value);
                  const found = leads.find(l => l.id === e.target.value);
                  if (found) {
                    setCustomerName(found.name);
                    setPropertyName(found.project?.name || '');
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              >
                {leads.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.phone || 'No phone'})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Property / Unit Name</label>
              <input
                type="text"
                value={propertyName}
                onChange={e => setPropertyName(e.target.value)}
                placeholder="e.g. Skyline Residences Tower A - 402"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Deal (₹)</label>
              <input
                type="number"
                required
                value={dealValue}
                onChange={e => setDealValue(e.target.value)}
                placeholder="7500000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Commission (₹)</label>
              <input
                type="number"
                value={commission}
                onChange={e => setCommission(e.target.value)}
                placeholder="150000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Received (₹)</label>
              <input
                type="number"
                value={amountReceived}
                onChange={e => setAmountReceived(e.target.value)}
                placeholder="500000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="Direct Transfer">NEFT / RTGS / Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Cheque #</label>
              <input
                type="text"
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                placeholder="e.g. TXN-99823412"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deal Date</label>
            <input
              type="date"
              required
              value={dealDate}
              onChange={e => setDealDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Booking token received. Agreement signing on 15th."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-600 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Record Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Copy,
  Check,
  Mail,
  Phone,
  IndianRupee,
  Sparkles,
  AlertCircle,
  Building2,
  Trash2,
  Share2,
  CheckCircle2,
  ExternalLink,
  X,
} from 'lucide-react';
import { crmApi, type ChannelPartner } from '@/api/crm';

export default function CrmChannelPartnersTab() {
  const [partners, setPartners] = useState<ChannelPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Add Partner Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [commissionRate, setCommissionRate] = useState('2');
  const [notes, setNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [newlyCreatedPartner, setNewlyCreatedPartner] = useState<ChannelPartner | null>(null);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getChannelPartners();
      if (res.data) {
        setPartners(res.data);
      }
    } catch (err) {
      console.error('Failed to load channel partners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setAddError('Please fill in Name, Email, and Phone number.');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      const res = await crmApi.createChannelPartner({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        commission_rate: parseFloat(commissionRate) || 0,
        notes: notes.trim() || undefined,
      });

      if (res.data) {
        setNewlyCreatedPartner(res.data);
        await fetchPartners();
        setName('');
        setEmail('');
        setPhone('');
        setCommissionRate('2');
        setNotes('');
      }
    } catch (err: any) {
      setAddError(err.message || 'Failed to create channel partner');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Are you sure you want to remove this channel partner?')) return;
    try {
      await crmApi.deleteChannelPartner(id);
      await fetchPartners();
    } catch (err: any) {
      alert(err.message || 'Failed to delete partner');
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.toLowerCase().includes(search.toLowerCase()) ||
      p.referral_code.toLowerCase().includes(search.toLowerCase())
  );

  const totalPartners = partners.length;
  const totalDealsWon = partners.reduce((sum, p) => sum + (p.deals_count || 0), 0);
  const totalVolume = partners.reduce((sum, p) => sum + (p.total_deal_amount || 0), 0);
  const totalCommission = partners.reduce((sum, p) => sum + (p.total_commission || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            Channel Partners (CP) Network
          </h2>
          <p className="text-xs text-muted-foreground">
            Manage authorized brokers & partners. Auto-generate referral codes and track their deals.
          </p>
        </div>
        <button
          onClick={() => {
            setAddError('');
            setNewlyCreatedPartner(null);
            setIsAddOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all active:scale-95 shrink-0"
        >
          <Plus size={14} /> Add Channel Partner
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-amber-700 uppercase tracking-wider">
            Total Partners
          </span>
          <p className="text-xl sm:text-2xl font-black text-amber-800 mt-1">{totalPartners}</p>
          <p className="text-[10px] text-amber-600 mt-1">Active registered brokers</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Total Deals Won
          </span>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{totalDealsWon}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Properties closed via CPs</p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-blue-700 uppercase tracking-wider">
            CP Sales Volume
          </span>
          <p className="text-xl sm:text-2xl font-black text-blue-800 mt-1">
            ₹{totalVolume.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-blue-600 mt-1">Total referred business</p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200/80 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold text-purple-700 uppercase tracking-wider">
            Commission Accrued
          </span>
          <p className="text-xl sm:text-2xl font-black text-purple-800 mt-1">
            ₹{totalCommission.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-purple-600 mt-1">Brokerage payables</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search partner name, code, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-border rounded-xl text-xs focus:outline-none focus:border-amber-600"
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground shrink-0">
          {filteredPartners.length} {filteredPartners.length === 1 ? 'partner' : 'partners'} listed
        </span>
      </div>

      {/* Partners List */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="size-8 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Users size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-bold text-foreground">No channel partners found</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click "Add Channel Partner" to register your first partner and generate their referral code.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-border">
                <tr>
                  <th className="p-4">Partner Name</th>
                  <th className="p-4">Contact Details</th>
                  <th className="p-4">Referral Code</th>
                  <th className="p-4 text-center">Deals Closed</th>
                  <th className="p-4">Total Deal Volume</th>
                  <th className="p-4">Commission</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPartners.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4 font-bold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs shrink-0">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Joined {new Date(p.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-600 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Mail size={12} className="text-muted-foreground" />
                        <span>{p.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Phone size={12} className="text-muted-foreground" />
                        <span>{p.phone}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-xs">
                        <span>{p.referral_code}</span>
                        <button
                          onClick={() => handleCopyCode(p.referral_code)}
                          title="Copy Referral Code"
                          className="p-1 hover:bg-amber-200/60 rounded text-amber-700 transition-colors"
                        >
                          {copiedCode === p.referral_code ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800">
                        {p.deals_count || 0}
                      </span>
                    </td>

                    <td className="p-4 font-extrabold text-foreground">
                      ₹{(p.total_deal_amount || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="p-4 font-bold text-emerald-600">
                      ₹{(p.total_commission || 0).toLocaleString('en-IN')}
                      {p.commission_rate ? (
                        <span className="text-[10px] text-muted-foreground block font-normal">
                          ({p.commission_rate}%)
                        </span>
                      ) : null}
                    </td>

                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        {p.status}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeletePartner(p.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Channel Partner"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Partner Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Register Channel Partner</h3>
                  <p className="text-[11px] text-white/80">Auto-generates referral code & emails partner</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {newlyCreatedPartner ? (
              <div className="p-6 space-y-4 text-center">
                <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">Partner Registered Successfully!</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    An email has been dispatched to <strong>{newlyCreatedPartner.email}</strong> with their code.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest block mb-1">
                    Generated Referral Code
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black font-mono text-amber-900 tracking-wider">
                      {newlyCreatedPartner.referral_code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(newlyCreatedPartner.referral_code)}
                      className="p-1.5 bg-amber-200/80 hover:bg-amber-300 rounded-lg text-amber-800 transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === newlyCreatedPartner.referral_code ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                {addError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{addError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="rajesh@partner.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Standard Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="2.0"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-600"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Default brokerage commission percentage for deals brought by this partner.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Notes / Agency Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apex Realty Consultants / Area: Sector 62"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-amber-600"
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    disabled={addLoading}
                    className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addLoading}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {addLoading && (
                      <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Register & Generate Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

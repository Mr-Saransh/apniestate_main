import React, { useState, useEffect } from 'react';
import { X, Edit, Phone, Mail, MapPin, IndianRupee, Tag, Building2 } from 'lucide-react';
import { crmApi, type CrmLead } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';

interface EditLeadModalProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedLead: CrmLead) => void;
}

export default function EditLeadModal({ lead, isOpen, onClose, onSuccess }: EditLeadModalProps) {
  const { projects } = useProject();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'BUYER' as 'BUYER' | 'SELLER' | 'INVESTOR' | 'RENTER',
    status: 'NEW' as 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT' | 'NEGOTIATION' | 'BOOKED' | 'LOST',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    budget: '',
    city: '',
    source: 'Website',
    project_id: '',
    tagInput: '',
    tags: [] as string[],
    notes: '',
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        email: lead.email || '',
        type: lead.type || 'BUYER',
        status: lead.status || 'NEW',
        priority: lead.priority || 'MEDIUM',
        budget: lead.budget || '',
        city: lead.city || '',
        source: lead.source || 'Website',
        project_id: lead.project_id || '',
        tagInput: '',
        tags: lead.tags || [],
        notes: lead.notes || '',
      });
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const handleAddTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.tagInput.trim()],
        tagInput: '',
      }));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Lead name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.updateLead(lead.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget.trim() || undefined,
        city: formData.city.trim() || undefined,
        source: formData.source,
        project_id: formData.project_id || undefined,
        tags: formData.tags,
        notes: formData.notes.trim() || undefined,
      });

      if (res.success && res.data) {
        onSuccess(res.data);
        onClose();
      } else {
        setError(res.message || 'Failed to update lead');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-[#2648E7] to-[#1e3bbd] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Edit Lead</h2>
              <p className="text-xs text-white/80">Update lead details and stage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lead Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="BUYER">Buyer</option>
                <option value="SELLER">Seller</option>
                <option value="INVESTOR">Investor</option>
                <option value="RENTER">Renter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="SITE_VISIT">Site Visit</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="BOOKED">Booked</option>
                <option value="LOST">Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="HIGH">🔥 High</option>
                <option value="MEDIUM">⚡ Medium</option>
                <option value="LOW">🌱 Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Budget</label>
              <input
                type="text"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Project</label>
              <select
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="">General (No Project)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={formData.tagInput}
                onChange={e => setFormData({ ...formData, tagInput: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                placeholder="Add tag and press enter"
                className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#2648E7]/10 text-[#2648E7] rounded-lg"
                  >
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7] resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Edit size={16} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

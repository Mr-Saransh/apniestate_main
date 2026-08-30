import React, { useState, useEffect } from 'react';
import { X, Edit, Phone, Mail, MapPin, IndianRupee, Tag, Building2, UserCheck } from 'lucide-react';
import { crmApi, type CrmLead, type CrmTeamMember } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';

interface EditLeadModalProps {
  lead: CrmLead | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedLead: CrmLead) => void;
}

export default function EditLeadModal({ lead, isOpen, onClose, onSuccess }: EditLeadModalProps) {
  const { projects } = useProject();
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);
  const isManagerOrBuilder = crmRole === 'BUILDER' || crmRole === 'CRM_MANAGER' || user?.role === 'BUILDER' || user?.role === 'ADMIN';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);

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
    assigned_to: '',
    tagInput: '',
    tags: [] as string[],
    notes: '',
  });

  useEffect(() => {
    if (isOpen && isManagerOrBuilder) {
      crmApi.getTeam().then((res) => {
        if (res.success && res.data) {
          setTeamMembers(res.data.members.filter((m) => m.status === 'ACTIVE' && m.crm_role !== 'BUILDER'));
        }
      }).catch(() => {});
    }
  }, [isOpen, isManagerOrBuilder]);

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
        assigned_to: lead.assigned_to || '',
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

      const updatePayload: any = {
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email || null,
        type: formData.type,
        status: formData.status,
        priority: formData.priority,
        budget: formData.budget || null,
        city: formData.city || null,
        source: formData.source,
        project_id: formData.project_id || null,
        tags: formData.tags,
        notes: formData.notes || null,
      };

      if (isManagerOrBuilder) {
        updatePayload.assigned_to = formData.assigned_to || null;
      }

      const res = await crmApi.updateLead(lead.id, updatePayload);

      if (res.success && res.data) {
        onSuccess(res.data);
      } else {
        setError(res.error?.message || 'Failed to update lead');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong while updating the lead');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[#2648E7] text-white flex items-center justify-center shadow-sm">
              <Edit size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Edit Lead Details</h3>
              <p className="text-[11px] text-slate-500">Update information and ownership for {lead.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
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
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
                />
                <Phone size={14} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
                />
                <Mail size={14} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / City</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#2648E7]"
                />
                <MapPin size={14} className="absolute left-3 top-3.5 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Assigned Telecaller (Builder / Manager Only) */}
          {isManagerOrBuilder && (
            <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/60">
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <UserCheck size={14} className="text-[#2648E7]" />
                <span>Assigned Telecaller / Sales Executive</span>
              </label>
              <select
                value={formData.assigned_to}
                onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-semibold bg-white border border-blue-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="">⚠️ Unassigned Pool (Anyone can claim / Smart Distribute)</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.crm_role === 'CRM_MANAGER' ? 'Manager' : 'Executive'}) — {m.assigned_leads_count} current leads
                  </option>
                ))}
              </select>
            </div>
          )}

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
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag and press Add"
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {formData.tags.map(t => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-[#2648E7]"
                  >
                    <span>#{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Interaction Summary</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-md shadow-[#2648E7]/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

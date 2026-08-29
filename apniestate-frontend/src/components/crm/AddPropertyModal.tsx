import React, { useState } from 'react';
import { X, Building2, Plus, IndianRupee, MapPin, Bed, Bath, Square } from 'lucide-react';
import { crmApi } from '@/api/crm';
import { useProject } from '@/context/ProjectContext';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPropertyModal({ isOpen, onClose, onSuccess }: AddPropertyModalProps) {
  const { projects, activeProjectId } = useProject();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    price: '',
    type: 'Sale',
    beds: '2',
    baths: '2',
    sqft: '',
    status: 'Available',
    image_url: '',
    project_id: activeProjectId || '',
    featured: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Property name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.createProperty({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        price: formData.price.trim() || undefined,
        type: formData.type,
        beds: Number(formData.beds) || 0,
        baths: Number(formData.baths) || 0,
        sqft: formData.sqft.trim() || undefined,
        status: formData.status,
        image_url: formData.image_url.trim() || undefined,
        project_id: formData.project_id || undefined,
        featured: formData.featured,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to list property');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to list property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-[#2648E7] to-[#1e3bbd] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Add Property / Unit</h2>
              <p className="text-xs text-white/80">Add listing to catalog for WhatsApp sharing</p>
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Property Name / Unit</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Skyline Residences - Unit 304 (3BHK)"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price / Rent</label>
              <input
                type="text"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. ₹85 Lakhs or ₹45,000/mo"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="Sale">Sale</option>
                <option value="Rent">Rent</option>
                <option value="Both">Both (Sale / Rent)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">BHK / Beds</label>
              <input
                type="number"
                value={formData.beds}
                onChange={e => setFormData({ ...formData, beds: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Baths</label>
              <input
                type="number"
                value={formData.baths}
                onChange={e => setFormData({ ...formData, baths: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area (sqft)</label>
              <input
                type="text"
                value={formData.sqft}
                onChange={e => setFormData({ ...formData, sqft: e.target.value })}
                placeholder="1,450"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Address / Location</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Sector 15, Pune"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Linked Project</label>
              <select
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
              >
                <option value="">General</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={e => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#2648E7]"
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
              className="px-5 py-2 text-sm font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              Add Property
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

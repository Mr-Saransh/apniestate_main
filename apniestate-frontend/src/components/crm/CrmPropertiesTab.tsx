import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Share2, MapPin, IndianRupee, Bed, Bath, Square,
  Trash2, MessageCircle
} from 'lucide-react';
import { crmApi, type CrmProperty, type CrmLead } from '@/api/crm';

interface CrmPropertiesTabProps {
  leads: CrmLead[];
  onOpenAddProperty: () => void;
  onOpenShareProperty: (property: CrmProperty) => void;
}

export default function CrmPropertiesTab({
  leads,
  onOpenAddProperty,
  onOpenShareProperty,
}: CrmPropertiesTabProps) {
  const [properties, setProperties] = useState<CrmProperty[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getProperties();
      if (res.success && res.data) {
        setProperties(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this property listing?')) return;
    try {
      await crmApi.deleteProperty(id);
      await fetchProperties();
    } catch (err) {
      console.error('Failed to delete property:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Property & Unit Catalog</h2>
          <p className="text-xs text-slate-500">Available listings ready to share with prospective buyers</p>
        </div>
        <button
          onClick={onOpenAddProperty}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm transition-all active:scale-95"
        >
          <Plus size={14} /> Add Property
        </button>
      </div>

      {/* Grid of Listings */}
      {loading ? (
        <div className="p-12 flex justify-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
        </div>
      ) : properties.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
          <Building2 size={36} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No properties in CRM catalog</p>
          <p className="text-xs text-slate-400 mt-0.5">Click "Add Property" to create listings you can pitch to leads.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="h-44 bg-slate-100 relative overflow-hidden">
                  <img
                    src={p.image_url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop'}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-black/60 backdrop-blur-md text-white">
                      {p.type}
                    </span>
                  </div>
                  {p.price && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-[#2648E7] text-white shadow-md">
                        {p.price}
                      </span>
                    </div>
                  )}
                </div>

                {/* Specs */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{p.name}</h3>
                  </div>

                  {p.address && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                      <MapPin size={12} className="text-slate-400 shrink-0" /> {p.address}
                    </p>
                  )}

                  <div className="flex items-center gap-3 pt-2 text-xs font-bold text-slate-600 border-t border-slate-100">
                    {p.beds !== undefined && (
                      <span className="flex items-center gap-1"><Bed size={14} className="text-slate-400" /> {p.beds} BHK</span>
                    )}
                    {p.baths !== undefined && (
                      <span className="flex items-center gap-1"><Bath size={14} className="text-slate-400" /> {p.baths} Bath</span>
                    )}
                    {p.sqft && (
                      <span className="flex items-center gap-1"><Square size={14} className="text-slate-400" /> {p.sqft} sqft</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenShareProperty(p)}
                  className="flex-1 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <MessageCircle size={15} /> Share on WhatsApp
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Delete Listing"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

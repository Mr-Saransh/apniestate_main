import React, { useState } from 'react';
import { X, Share2, MessageCircle, Building2, Phone } from 'lucide-react';
import { type CrmProperty, type CrmLead } from '@/api/crm';

interface SharePropertyModalProps {
  property: CrmProperty | null;
  leads: CrmLead[];
  isOpen: boolean;
  onClose: () => void;
}

export default function SharePropertyModal({
  property,
  leads = [],
  isOpen,
  onClose,
}: SharePropertyModalProps) {
  const [selectedLeadId, setSelectedLeadId] = useState(leads[0]?.id || '');
  const [customPhone, setCustomPhone] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  React.useEffect(() => {
    if (property) {
      const defaultText = `Hello! Check out this property from Apni Estate:\n\n*${property.name}*\n📍 ${property.address || 'Prime Location'}\n💰 Price: ${property.price || 'On Request'}\n🏠 Config: ${property.beds} BHK | ${property.baths} Baths | ${property.sqft || 'Spacious'} sqft\n\nLet me know if you would like to schedule a site visit!`;
      setCustomMessage(defaultText);
    }
  }, [property]);

  React.useEffect(() => {
    if (selectedLeadId) {
      const l = leads.find(item => item.id === selectedLeadId);
      if (l && l.phone) setCustomPhone(l.phone);
    }
  }, [selectedLeadId, leads]);

  if (!isOpen || !property) return null;

  const handleShare = () => {
    const phoneToUse = customPhone.trim();
    if (!phoneToUse) return;

    const cleanPhone = phoneToUse.replace(/[^\d]/g, '');
    const encoded = encodeURIComponent(customMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">Share Property via WhatsApp</h2>
              <p className="text-xs text-white/80">{property.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Lead</label>
            <select
              value={selectedLeadId}
              onChange={e => setSelectedLeadId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
            >
              <option value="">Custom Number / Other</option>
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.phone || 'No phone'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Recipient WhatsApp Phone</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                value={customPhone}
                onChange={e => setCustomPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Message Preview</label>
            <textarea
              rows={6}
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-600 font-mono resize-none"
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
              type="button"
              disabled={!customPhone.trim()}
              onClick={handleShare}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <MessageCircle size={16} /> Open WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

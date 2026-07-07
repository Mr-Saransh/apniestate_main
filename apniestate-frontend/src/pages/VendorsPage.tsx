import { useState, useEffect, type FormEvent } from 'react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { Truck, Plus, User, Phone, Mail, MapPin, X } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Vendor {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  category?: string;
  is_active: boolean;
}

const CATEGORIES = ['All', 'Suppliers', 'Subcontractors', 'Consultants', 'Logistics', 'Services'];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('Suppliers');

  useEffect(() => {
    async function loadVendors() {
      try {
        const res = await apiClient.get<Vendor[]>('/vendors');
        if (res.data) {
          setVendors(res.data);
        }
      } catch (err) {
        console.error('Failed to load vendors list', err);
      } finally {
        setLoading(false);
      }
    }
    loadVendors();
  }, []);

  const handleCreateVendor = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    try {
      const res = await apiClient.post<Vendor>('/vendors', {
        name,
        contact_person: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        category,
        is_active: true
      });

      if (res.data) {
        setVendors(prev => [res.data!, ...prev]);
        setShowModal(false);
        // Reset form
        setName('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
        setCategory('Suppliers');
      }
    } catch (err) {
      console.error('Failed to register vendor', err);
      alert('Error registering vendor.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = activeCategory === 'All'
    ? vendors
    : vendors.filter(v => v.category === activeCategory);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-start">
        <PH title="Vendors" sub="Supply chains, trades, and contacts" />
        <button 
          onClick={() => setShowModal(true)}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} /> New Vendor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm w-full col-span-full">No vendors found</div>
        ) : (
          filtered.map((vendor) => (
            <div 
              key={vendor.id} 
              className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-3 group"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-foreground leading-snug">{vendor.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{vendor.category || 'General'}</p>
                </div>
                <Chip color={vendor.is_active ? 'green' : 'gray'}>
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </Chip>
              </div>

              <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border">
                {vendor.contact_person && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <User size={12} /> <span className="truncate">{vendor.contact_person} (Rep)</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <Phone size={12} /> <a href={`tel:${vendor.phone}`} className="hover:text-primary transition-colors truncate">{vendor.phone}</a>
                  </div>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                    <Mail size={12} /> <a href={`mailto:${vendor.email}`} className="hover:text-primary transition-colors truncate">{vendor.email}</a>
                  </div>
                )}
                {vendor.address && (
                  <div className="flex items-start gap-2 text-[11px] font-medium text-muted-foreground">
                    <MapPin size={12} className="mt-0.5 shrink-0" /> <span className="line-clamp-2">{vendor.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="font-bold text-foreground">New Vendor</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-md transition-colors"><X size={18} className="text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={handleCreateVendor} className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendor Name *</label>
                  <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. UltraTech Concrete Ltd." />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Representative Name</label>
                    <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={contactPerson} onChange={e => setContactPerson(e.target.value)} placeholder="e.g. Rajesh Kumar" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                    <select className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="Suppliers">Suppliers</option>
                      <option value="Subcontractors">Subcontractors</option>
                      <option value="Consultants">Consultants</option>
                      <option value="Logistics">Logistics</option>
                      <option value="Services">Services</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
                    <input type="tel" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 9876543210" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input type="email" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. sales@ultratech.com" />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company Address</label>
                  <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Industrial Area, Phase II" />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

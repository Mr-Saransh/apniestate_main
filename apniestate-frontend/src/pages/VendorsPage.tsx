import { useState, useEffect, type FormEvent } from 'react';
import { PH, Card, Chip } from '@/components/shared/FigmaComponents';
import { Truck, Plus, User, Phone, Mail, MapPin, X, Edit2, Trash2, Star, MessageSquare, Check } from 'lucide-react';
import { apiClient } from '@/api/client';
import { vendorsApi, type Vendor, type VendorRating } from '@/api/vendors';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

const CATEGORIES = ['All', 'Suppliers', 'Subcontractors', 'Consultants', 'Logistics', 'Services'];

const QUICK_TAGS = [
  '⚡ Fast & On-Time',
  '🐢 Slow Provider / Delay',
  '📦 Premium Quality',
  '⚠️ Damaged / Substandard',
  '💰 Competitive Rates',
  '📞 Responsive Communication',
  '🤝 Highly Recommended',
  '🚫 Overpriced / Hidden Charges'
];

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // Rating Modal states
  const [ratingModalVendor, setRatingModalVendor] = useState<Vendor | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [vendorReviews, setVendorReviews] = useState<VendorRating[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

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
        const res = await vendorsApi.getVendors();
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
        setVendors(prev => [{ ...res.data!, avgRating: 0, ratingCount: 0 }, ...prev]);
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

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v);
    setName(v.name);
    setContactPerson(v.contact_person || '');
    setPhone(v.phone || '');
    setEmail(v.email || '');
    setAddress(v.address || '');
    setCategory(v.category || 'Suppliers');
  };

  const handleUpdateVendor = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingVendor || !name) return;

    setSaving(true);
    try {
      const res = await apiClient.patch<Vendor>(`/vendors/${editingVendor.id}`, {
        name,
        contact_person: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        category
      });

      if (res.data) {
        setVendors(prev => prev.map(v => v.id === editingVendor.id ? { ...v, ...res.data! } : v));
        setEditingVendor(null);
        // Reset form
        setName('');
        setContactPerson('');
        setPhone('');
        setEmail('');
        setAddress('');
        setCategory('Suppliers');
      }
    } catch (err) {
      console.error('Failed to update vendor', err);
      alert('Error updating vendor.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    const confirmed = confirm(`Are you sure you want to remove ${vendorName}? This will safely archive the vendor while preserving all historical purchase orders, invoices, and payments.`);
    if (!confirmed) return;

    try {
      await apiClient.delete(`/vendors/${vendorId}`);
      setVendors(prev => prev.filter(v => v.id !== vendorId));
    } catch (err) {
      console.error('Failed to delete vendor', err);
      alert('Failed to remove vendor. Please try again.');
    }
  };

  // Open Rating Modal
  const handleOpenRating = async (vendor: Vendor) => {
    setRatingModalVendor(vendor);
    setRatingScore(5);
    setHoverRating(0);
    setRatingComment('');
    setSelectedTags([]);
    setLoadingReviews(true);

    try {
      const res = await vendorsApi.getVendorRatings(vendor.id);
      if (res.data) {
        setVendorReviews(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
      setVendorReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Submit Vendor Rating
  const handleSubmitRating = async () => {
    if (!ratingModalVendor) return;
    setSubmittingRating(true);

    const tagText = selectedTags.length > 0 ? `[${selectedTags.join(', ')}] ` : '';
    const fullComment = `${tagText}${ratingComment.trim()}`.trim() || undefined;

    try {
      const res = await vendorsApi.rateVendor(ratingModalVendor.id, ratingScore, fullComment);
      if (res.data) {
        // Update local vendor ratings
        setVendors(prev => prev.map(v => {
          if (v.id !== ratingModalVendor.id) return v;
          const currentCount = v.ratingCount || v.ratings?.length || 0;
          const currentAvg = v.avgRating || 0;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + ratingScore) / newCount).toFixed(1));
          return {
            ...v,
            ratingCount: newCount,
            avgRating: newAvg,
            ratings: [res.data!, ...(v.ratings || [])]
          };
        }));

        setRatingModalVendor(null);
      }
    } catch (err: any) {
      console.error('Failed to submit rating', err);
      alert(err.message || 'Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  const filtered = activeCategory === 'All'
    ? vendors
    : vendors.filter(v => v.category === activeCategory);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-start">
        <PH title="Vendors" sub="Supply chains, trades, contacts and reliability ratings" />
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
          filtered.map((vendor) => {
            const hasRatings = (vendor.avgRating && vendor.avgRating > 0) || (vendor.ratingCount && vendor.ratingCount > 0);
            return (
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

                {/* Rating Badge */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenRating(vendor)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-bold text-amber-800 transition-colors group/btn"
                    title="Click to view ratings or add your review"
                  >
                    <Star size={13} className={hasRatings ? "text-amber-500 fill-amber-500" : "text-amber-400"} />
                    <span>
                      {hasRatings 
                        ? `${vendor.avgRating} / 5 (${vendor.ratingCount || vendor.ratings?.length || 1} ${Number(vendor.ratingCount || 1) === 1 ? 'review' : 'reviews'})`
                        : 'Unrated · Rate'}
                    </span>
                  </button>

                  {vendor.avgRating !== undefined && vendor.avgRating > 0 && vendor.avgRating < 3 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      🐢 Slow Delivery Flag
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border">
                  {vendor.contact_person && (
                    <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                      <User size={12} /> <span className="truncate">{vendor.contact_person} (Rep)</span>
                    </div>
                  )}
                  {vendor.phone ? (
                    <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-muted-foreground">
                      <div className="flex items-center gap-2 truncate">
                        <Phone size={12} />
                        <span className="truncate">{vendor.phone}</span>
                      </div>
                      <a
                        href={`tel:${vendor.phone}`}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition-colors shadow-sm"
                        title="Call vendor directly"
                      >
                        <Phone size={11} /> Call
                      </a>
                    </div>
                  ) : (
                    <div className="text-[11px] text-muted-foreground italic flex items-center gap-1.5">
                      <Phone size={11} className="opacity-40" /> No phone saved
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

                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <button
                      onClick={() => handleOpenRating(vendor)}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-amber-200/80 shadow-2xs"
                      title="Rate vendor performance and delivery speed"
                    >
                      <Star size={12} className="text-amber-500 fill-amber-500" /> Rate Vendor
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(vendor)}
                        className="p-1.5 text-muted-foreground hover:text-[#2648E7] hover:bg-[#2648E7]/10 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVendor(vendor.id, vendor.name)}
                        className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
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

      {/* Edit Vendor Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-xl border border-border shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="font-bold text-foreground">Edit Vendor details</h2>
              <button onClick={() => setEditingVendor(null)} className="p-1 hover:bg-muted rounded-md transition-colors"><X size={18} className="text-muted-foreground" /></button>
            </div>
            
            <form onSubmit={handleUpdateVendor} className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendor Name *</label>
                  <input type="text" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={name} onChange={e => setName(e.target.value)} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Representative Name</label>
                    <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
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
                    <input type="tel" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
                    <input type="email" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company Address</label>
                  <input type="text" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
                <button type="button" onClick={() => setEditingVendor(null)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
                  {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rate Vendor Modal */}
      {ratingModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Star size={20} className="fill-amber-500" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-foreground">Rate {ratingModalVendor.name}</h2>
                  <p className="text-[11px] text-muted-foreground">Supplier Quality, Delivery Speed & Reliability</p>
                </div>
              </div>
              <button 
                onClick={() => setRatingModalVendor(null)} 
                className="size-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 text-muted-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Star Rating Picker */}
              <div className="text-center p-4 bg-muted/30 rounded-2xl border border-border/80">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Overall Rating (1 to 5 Stars)</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRatingScore(star)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none cursor-pointer"
                    >
                      <Star
                        size={32}
                        className={`transition-colors ${
                          star <= (hoverRating || ratingScore)
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-foreground mt-2">
                  {ratingScore === 5 && '⭐⭐⭐⭐⭐ 5/5 — Excellent & Highly Punctual'}
                  {ratingScore === 4 && '⭐⭐⭐⭐ 4/5 — Good & Dependable'}
                  {ratingScore === 3 && '⭐⭐⭐ 3/5 — Average Service'}
                  {ratingScore === 2 && '⭐⭐ 2/5 — Slow Provider / Frequently Delayed'}
                  {ratingScore === 1 && '⭐ 1/5 — Poor / Critical Delays & Damage'}
                </p>
              </div>

              {/* Quick Feedback Tags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Select Performance Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#2648E7] text-white border-[#2648E7]'
                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review / Comment Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Review Notes / Delivery Experience</label>
                <textarea
                  rows={3}
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="e.g. Delivered 3 hours after scheduled time. Truck was slow to arrive..."
                  className="w-full bg-white border border-border rounded-xl p-3 text-xs focus:outline-none focus:border-[#2648E7] text-gray-900"
                />
              </div>

              {/* Past Reviews / History */}
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Recent Reviews {vendorReviews.length > 0 ? `(${vendorReviews.length})` : ''}</span>
                  {loadingReviews && <span className="text-[10px] text-muted-foreground">Loading...</span>}
                </p>
                {vendorReviews.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {vendorReviews.map((r) => (
                      <div key={r.id} className="p-2.5 bg-muted/40 border border-border rounded-xl text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{r.user?.name || 'Site Supervisor'}</span>
                          <div className="flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                            <Star size={11} className="fill-amber-500 text-amber-500" /> {r.score}/5
                          </div>
                        </div>
                        {r.comment && <p className="text-muted-foreground text-[11px] leading-relaxed">{r.comment}</p>}
                        <p className="text-[9px] text-muted-foreground/60">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    ))}
                  </div>
                ) : !loadingReviews ? (
                  <p className="text-xs text-muted-foreground italic py-1">No previous reviews recorded yet. Be the first to rate this vendor!</p>
                ) : null}
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 bg-muted/10">
              <button
                type="button"
                onClick={() => setRatingModalVendor(null)}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingRating}
                onClick={handleSubmitRating}
                className="px-5 py-2 text-xs font-bold bg-[#2648E7] text-white rounded-xl hover:bg-[#1d38b8] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {submittingRating ? 'Saving Rating...' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

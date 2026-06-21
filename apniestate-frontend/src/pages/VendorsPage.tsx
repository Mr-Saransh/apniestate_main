import { useState, useEffect, type FormEvent } from 'react';
import { Truck, Plus, Loader2, Sparkles, User, Phone, Mail, MapPin, Tag } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

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
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={28} color="var(--color-primary)" /> Vendors & Subcontractors
            </h1>
            <p className="page-subtitle">Manage critical supply chains, trades, and contacts</p>
          </div>
          <button 
            className="btn btn-primary btn-3d btn-3d-primary animate-pop-in" 
            onClick={() => setShowModal(true)}
            id="btn-add-vendor"
          >
            <Plus size={18} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Category filters */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-6)' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid listing */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Truck size={40} />}
          title="No vendors added yet"
          description="Register suppliers, masonry sub-contractors, or architectural consultants."
        />
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {filtered.map(vendor => (
            <div key={vendor.id} className="card-3d animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>{vendor.name}</h3>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                    Category: {vendor.category || 'General'}
                  </span>
                </div>
                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', color: vendor.is_active ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  {vendor.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Vendor credentials info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-3)' }}>
                {vendor.contact_person && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={14} className="text-muted" />
                    <span>{vendor.contact_person} (Rep)</span>
                  </div>
                )}
                {vendor.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} className="text-muted" />
                    <a href={`tel:${vendor.phone}`} style={{ color: 'inherit' }}>{vendor.phone}</a>
                  </div>
                )}
                {vendor.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={14} className="text-muted" />
                    <a href={`mailto:${vendor.email}`} style={{ color: 'inherit' }}>{vendor.email}</a>
                  </div>
                )}
                {vendor.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={14} className="text-muted" />
                    <span className="truncate">{vendor.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3D Glassmorphic Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="panel-glass card-3d animate-pop-in" style={{ width: '90%', maxWidth: '460px', padding: 'var(--space-6)', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--color-cta)" /> Onboard New Vendor
            </h2>
            <form onSubmit={handleCreateVendor} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="form-group">
                <label className="form-label">Vendor / Company Name</label>
                <input
                  type="text"
                  className="form-input premium-input"
                  placeholder="e.g. UltraTech Concrete Ltd."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Representative Name</label>
                  <input
                    type="text"
                    className="form-input premium-input"
                    placeholder="e.g. Rajesh Kumar"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input premium-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Suppliers">Suppliers</option>
                    <option value="Subcontractors">Subcontractors</option>
                    <option value="Consultants">Consultants</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Services">Services</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Phone Line</label>
                  <input
                    type="tel"
                    className="form-input premium-input"
                    placeholder="e.g. +91 9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input premium-input"
                    placeholder="e.g. sales@ultratech.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Company Address</label>
                <input
                  type="text"
                  className="form-input premium-input"
                  placeholder="e.g. Industrial Area, Phase II"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-3d btn-3d-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-3d btn-3d-primary"
                  disabled={saving}
                >
                  {saving ? <Loader2 size={16} className="spinner" /> : 'Register Vendor'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

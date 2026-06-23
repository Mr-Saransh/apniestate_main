import { useState, useEffect, type FormEvent } from 'react';
import { contractorsApi, type Contractor } from '@/api/contractors';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import { Plus, Search, Truck, MoreVertical, Edit2, Trash2, ShieldCheck, Mail, Phone, Star } from 'lucide-react';

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formGstNumber, setFormGstNumber] = useState('');
  const [formPanNumber, setFormPanNumber] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formIsActive, setFormIsActive] = useState(true);

  const fetchContractors = async () => {
    try {
      const res = await contractorsApi.getContractors();
      if (res.data) setContractors(res.data);
    } catch (err) {
      console.error('Failed to fetch contractors', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractors();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        name: formName,
        contact_person: formContactPerson || null,
        phone: formPhone || null,
        email: formEmail || null,
        gst_number: formGstNumber || null,
        pan_number: formPanNumber || null,
        rating: Number(formRating),
        is_active: formIsActive
      };

      await contractorsApi.createContractor(data);
      setShowCreateModal(false);
      resetForm();
      fetchContractors();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create contractor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedContractor) return;
    setFormError('');
    setSubmitting(true);

    try {
      const data = {
        name: formName,
        contact_person: formContactPerson || null,
        phone: formPhone || null,
        email: formEmail || null,
        gst_number: formGstNumber || null,
        pan_number: formPanNumber || null,
        rating: Number(formRating),
        is_active: formIsActive
      };

      await contractorsApi.updateContractor(selectedContractor.id, data);
      setShowEditModal(false);
      resetForm();
      fetchContractors();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update contractor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this contractor?')) return;
    try {
      await contractorsApi.deleteContractor(id);
      fetchContractors();
    } catch (err) {
      console.error('Failed to delete contractor', err);
    }
  };

  const openEditModal = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setFormName(contractor.name);
    setFormContactPerson(contractor.contact_person || '');
    setFormPhone(contractor.phone || '');
    setFormEmail(contractor.email || '');
    setFormGstNumber(contractor.gst_number || '');
    setFormPanNumber(contractor.pan_number || '');
    setFormRating(contractor.rating || 5);
    setFormIsActive(contractor.is_active);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setSelectedContractor(null);
    setFormName('');
    setFormContactPerson('');
    setFormPhone('');
    setFormEmail('');
    setFormGstNumber('');
    setFormPanNumber('');
    setFormRating(5);
    setFormIsActive(true);
    setFormError('');
  };

  const filtered = contractors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.contact_person && c.contact_person.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Stats
  const totalContractors = contractors.length;
  const activeContractors = contractors.filter(c => c.is_active).length;
  const averageRating = contractors.length > 0
    ? (contractors.reduce((acc, c) => acc + (c.rating || 0), 0) / contractors.length).toFixed(1)
    : '0.0';

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contractor Directory</h1>
          <p className="page-subtitle">Manage subcontractor organizations, agreements, compliance, and ratings</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }} id="add-contractor-btn">
          <Plus size={18} />
          Add Contractor
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={<Truck size={20} />}
          label="Total Subcontractors"
          value={totalContractors}
          color="#3B82F6"
          bgColor="rgba(59, 130, 246, 0.1)"
        />
        <StatCard
          icon={<ShieldCheck size={20} />}
          label="Active Partners"
          value={activeContractors}
          color="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
        />
        <StatCard
          icon={<Star size={20} />}
          label="Average Quality Score"
          value={`${averageRating} / 5.0`}
          color="#F59E0B"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', maxWidth: '400px' }}>
        <div className="card-body" style={{ padding: 'var(--space-3)' }}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Search by company or contact name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-contractors"
            />
          </div>
        </div>
      </div>

      {/* Contractors Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Truck size={36} />}
          title="No contractors found"
          description="Add a contractor to map against workers, payments, and site work contracts"
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} /> Add Contractor
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>Contact Person</th>
                    <th>Compliance (GST / PAN)</th>
                    <th>Quality Score</th>
                    <th>Status</th>
                    <th>Staff count</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(contractor => (
                    <tr key={contractor.id} className="hover-row">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                          <div className="avatar avatar-sm" style={{ background: '#F5F3FF', color: '#8B5CF6', fontWeight: 'bold' }}>
                            {contractor.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{contractor.name}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{contractor.contact_person || '—'}</div>
                          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                            {contractor.phone && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Phone size={10} /> {contractor.phone}</span>}
                            {contractor.email && <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Mail size={10} /> {contractor.email}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          {contractor.gst_number && <div style={{ color: 'var(--color-text-secondary)' }}>GST: <span style={{ fontFamily: 'monospace' }}>{contractor.gst_number}</span></div>}
                          {contractor.pan_number && <div style={{ color: 'var(--color-text-muted)' }}>PAN: <span style={{ fontFamily: 'monospace' }}>{contractor.pan_number}</span></div>}
                          {!contractor.gst_number && !contractor.pan_number && <span style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>No Tax Info</span>}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: 'bold' }}>
                          <Star size={16} fill="#F59E0B" color="#F59E0B" />
                          <span>{contractor.rating ? contractor.rating.toFixed(1) : '—'}</span>
                        </div>
                      </td>
                      <td>
                        {contractor.is_active ? (
                          <span className="badge badge-active">Active</span>
                        ) : (
                          <span className="badge badge-cancelled">Inactive</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 'bold', textAlign: 'center' }}>
                        {contractor._count?.workers || 0}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => openEditModal(contractor)}
                            title="Edit Contractor"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon btn-sm text-danger"
                            onClick={() => handleDelete(contractor.id)}
                            title="Deactivate Contractor"
                          >
                            <Trash2 size={15} color="#EF4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Contractor Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Add New Contractor"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleCreate as any}
              disabled={submitting || !formName}
              id="submit-add-contractor"
            >
              {submitting ? 'Adding...' : 'Add Contractor'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div className="form-group">
            <label className="form-label" htmlFor="c-name">Company Name *</label>
            <input id="c-name" type="text" className="form-input" placeholder="e.g. Apex Subcontracting Corp" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="c-contact">Contact Person Name</label>
              <input id="c-contact" type="text" className="form-input" placeholder="e.g. Saransh Kumar" value={formContactPerson} onChange={(e) => setFormContactPerson(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="c-phone">Phone Number</label>
              <input id="c-phone" type="tel" className="form-input" placeholder="Phone contact" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="c-email">Email Address</label>
              <input id="c-email" type="email" className="form-input" placeholder="contact@company.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="c-rating">Initial Quality Rating (1-5)</label>
              <input id="c-rating" type="number" className="form-input" value={formRating} onChange={(e) => setFormRating(Number(e.target.value))} min={1} max={5} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="c-gst">GST Number (15-digit)</label>
              <input id="c-gst" type="text" className="form-input" placeholder="e.g. 07AAAAA0000A1Z0" value={formGstNumber} onChange={(e) => setFormGstNumber(e.target.value.toUpperCase())} maxLength={15} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="c-pan">PAN Number (10-digit)</label>
              <input id="c-pan" type="text" className="form-input" placeholder="e.g. ABCDE1234F" value={formPanNumber} onChange={(e) => setFormPanNumber(e.target.value.toUpperCase())} maxLength={10} />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input id="c-active" type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} />
            <label className="form-label" htmlFor="c-active" style={{ marginBottom: 0 }}>Active Partner</label>
          </div>
        </form>
      </Modal>

      {/* Edit Contractor Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); resetForm(); }}
        title="Edit Contractor"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => { setShowEditModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleUpdate as any}
              disabled={submitting || !formName}
              id="submit-edit-contractor"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div className="form-group">
            <label className="form-label" htmlFor="edit-c-name">Company Name *</label>
            <input id="edit-c-name" type="text" className="form-input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-c-contact">Contact Person Name</label>
              <input id="edit-c-contact" type="text" className="form-input" value={formContactPerson} onChange={(e) => setFormContactPerson(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-c-phone">Phone Number</label>
              <input id="edit-c-phone" type="tel" className="form-input" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-c-email">Email Address</label>
              <input id="edit-c-email" type="email" className="form-input" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-c-rating">Quality Rating (1-5)</label>
              <input id="edit-c-rating" type="number" className="form-input" value={formRating} onChange={(e) => setFormRating(Number(e.target.value))} min={1} max={5} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-c-gst">GST Number</label>
              <input id="edit-c-gst" type="text" className="form-input" value={formGstNumber} onChange={(e) => setFormGstNumber(e.target.value.toUpperCase())} maxLength={15} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-c-pan">PAN Number</label>
              <input id="edit-c-pan" type="text" className="form-input" value={formPanNumber} onChange={(e) => setFormPanNumber(e.target.value.toUpperCase())} maxLength={10} />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <input id="edit-c-active" type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} />
            <label className="form-label" htmlFor="edit-c-active" style={{ marginBottom: 0 }}>Active Partner</label>
          </div>
        </form>
      </Modal>
    </div>
  );
}

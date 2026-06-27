import { useState, useEffect, type FormEvent } from 'react';
import { Boxes, Plus, Loader2, Sparkles, AlertCircle, ShoppingCart, Check, X, Truck, Clock } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { PrimaryCard, Button, Badge } from '@/components/design-system';
import Modal from '@/components/shared/Modal';

interface Material {
  id: string;
  name: string;
  unit: string;
  description?: string;
  category?: string;
}

interface MaterialRequest {
  id: string;
  site_id: string;
  material_id: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELIVERED';
  notes?: string;
  created_at: string;
  site?: { name: string };
  material?: { name: string; unit: string };
  requester?: { name: string };
}

const CATEGORIES = ['All', 'Structural', 'Finishing', 'Electrical', 'Plumbing', 'General'];

export default function MaterialsPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'requests'>('requests');
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // Form states for Catalog
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [category, setCategory] = useState('Structural');
  const [description, setDescription] = useState('');

  // Form states for Request
  const [reqSiteId, setReqSiteId] = useState('');
  const [reqMaterialId, setReqMaterialId] = useState('');
  const [reqQuantity, setReqQuantity] = useState('');
  const [reqNotes, setReqNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [matRes, reqRes, sitesRes] = await Promise.all([
        apiClient.get<Material[]>('/materials'),
        apiClient.get<MaterialRequest[]>('/material-requests'),
        apiClient.get<any[]>('/sites')
      ]);
      if (matRes.data) setMaterials(matRes.data);
      if (reqRes.data) setRequests(reqRes.data);
      if (sitesRes.data) {
        setSites(sitesRes.data);
        if (sitesRes.data.length > 0) setReqSiteId(sitesRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load materials data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateMaterial = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;
    setSaving(true);
    try {
      await apiClient.post('/materials', { name, unit, category, description: description || null });
      setShowCatalogModal(false);
      setName(''); setUnit('Bags'); setDescription('');
      loadData();
    } catch (err) {
      console.error('Failed to create material', err);
      alert('Error creating material.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!reqSiteId || !reqMaterialId || !reqQuantity) return;
    setSaving(true);
    try {
      await apiClient.post('/material-requests', {
        site_id: reqSiteId,
        material_id: reqMaterialId,
        quantity: Number(reqQuantity),
        notes: reqNotes || null
      });
      setShowRequestModal(false);
      setReqQuantity(''); setReqNotes('');
      loadData();
      setActiveTab('requests');
    } catch (err) {
      console.error('Failed to create material request', err);
      alert('Error creating request.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      // Assuming a PATCH endpoint exists for updating status. If not, this might fail and we would need to implement it.
      await apiClient.patch(`/material-requests/${id}`, { status });
      loadData();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status.');
    }
  };

  const filteredMaterials = activeCategory === 'All'
    ? materials
    : materials.filter(m => m.category === activeCategory);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={28} color="var(--color-primary)" /> Material Management
          </h1>
          <p className="page-subtitle">Procurement workflow, material requests, and catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Button variant="secondary" onClick={() => setShowCatalogModal(true)}>
            <Plus size={18} /> New Material
          </Button>
          <Button onClick={() => setShowRequestModal(true)}>
            <ShoppingCart size={18} /> Order Material
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)' }}>
        <button
          onClick={() => setActiveTab('requests')}
          style={{
            padding: '12px 16px',
            borderBottom: activeTab === 'requests' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'requests' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'requests' ? 'bold' : 'normal',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Active Requests
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            padding: '12px 16px',
            borderBottom: activeTab === 'catalog' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'catalog' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: activeTab === 'catalog' ? 'bold' : 'normal',
            background: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none', cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Master Catalog
        </button>
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <>
          {requests.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={40} />}
              title="No active requests"
              description="Create a new material purchase request for your site."
              action={<Button onClick={() => setShowRequestModal(true)}>Create Request</Button>}
            />
          ) : (
            <PrimaryCard style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="hide-scrollbar" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: '12px', textTransform: 'uppercase', color: '#6B7280' }}>
                      <th style={{ padding: '14px 20px' }}>Date</th>
                      <th style={{ padding: '14px 20px' }}>Material & Quantity</th>
                      <th style={{ padding: '14px 20px' }}>Site</th>
                      <th style={{ padding: '14px 20px' }}>Requested By</th>
                      <th style={{ padding: '14px 20px' }}>Status</th>
                      <th style={{ padding: '14px 20px' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map(req => (
                      <tr key={req.id} className="hover-row" style={{ borderBottom: '1px solid #E2E8F0', fontSize: '14px' }}>
                        <td style={{ padding: '14px 20px', color: '#6B7280' }}>
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>{req.material?.name || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: '#0A3D91', fontWeight: 600 }}>{req.quantity} {req.material?.unit}</div>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#374151' }}>{req.site?.name || 'Unknown'}</td>
                        <td style={{ padding: '14px 20px', color: '#6B7280' }}>{req.requester?.name || 'N/A'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <StatusBadge status={req.status} />
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {req.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleStatusChange(req.id, 'APPROVED')} className="btn btn-ghost btn-sm" style={{ color: '#10B981' }} title="Approve"><Check size={18} /></button>
                              <button onClick={() => handleStatusChange(req.id, 'REJECTED')} className="btn btn-ghost btn-sm" style={{ color: '#EF4444' }} title="Reject"><X size={18} /></button>
                            </div>
                          )}
                          {req.status === 'APPROVED' && (
                            <button onClick={() => handleStatusChange(req.id, 'DELIVERED')} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Truck size={14} /> Mark Delivered
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PrimaryCard>
          )}
        </>
      )}

      {/* Catalog Tab */}
      {activeTab === 'catalog' && (
        <>
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

          {filteredMaterials.length === 0 ? (
            <EmptyState
              icon={<Boxes size={40} />}
              title="No materials found"
              description="Add structural elements to set up your procurement logs."
            />
          ) : (
            <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
              {filteredMaterials.map(mat => (
                <div key={mat.id} className="card-3d animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>{mat.name}</h3>
                    <span style={{ fontSize: 'var(--font-size-xs)', padding: '2px 8px', borderRadius: '12px', background: 'var(--color-primary-50)', color: 'var(--color-primary)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {mat.unit}
                    </span>
                  </div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
                    Category: {mat.category || 'General'}
                  </span>
                  {mat.description && (
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                      {mat.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Catalog Modal */}
      <Modal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        title="Add Material to Catalog"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setShowCatalogModal(false)}>Cancel</Button>
            <Button onClick={() => {
              const form = document.getElementById('catalog-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }} disabled={saving}>
              {saving ? 'Saving...' : 'Save Material'}
            </Button>
          </div>
        }
      >
        <form id="catalog-form" onSubmit={handleCreateMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Material Name</label>
            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-input" value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="Bags">Bags</option>
                <option value="Tons">Tons</option>
                <option value="CFT">CFT</option>
                <option value="Kilograms">Kg</option>
                <option value="Liters">Liters</option>
                <option value="Nos">Nos</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Structural">Structural</option>
                <option value="Finishing">Finishing</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Material"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button onClick={() => {
              const form = document.getElementById('request-form') as HTMLFormElement;
              if (form) form.requestSubmit();
            }} disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        }
      >
        <form id="request-form" onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Select Site *</label>
            <select className="form-input" value={reqSiteId} onChange={e => setReqSiteId(e.target.value)} required>
              <option value="">Select a site</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Select Material *</label>
            <select className="form-input" value={reqMaterialId} onChange={e => setReqMaterialId(e.target.value)} required>
              <option value="">Select a material</option>
              {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Quantity Required *</label>
            <input type="number" className="form-input" min="0.1" step="0.1" value={reqQuantity} onChange={e => setReqQuantity(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Urgency / Notes</label>
            <textarea className="form-input" value={reqNotes} onChange={e => setReqNotes(e.target.value)} rows={2} />
          </div>
        </form>
      </Modal>

    </div>
  );
}

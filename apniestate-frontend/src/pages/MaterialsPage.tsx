import { useState, useEffect, type FormEvent } from 'react';
import { Boxes, Plus, Loader2, Sparkles, FolderOpen, AlertCircle } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface Material {
  id: string;
  name: string;
  unit: string;
  description?: string;
  category?: string;
}

const CATEGORIES = ['All', 'Structural', 'Finishing', 'Electrical', 'Plumbing', 'General'];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  // Form states
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Bags');
  const [category, setCategory] = useState('Structural');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function loadMaterials() {
      try {
        const res = await apiClient.get<Material[]>('/materials');
        if (res.data) {
          setMaterials(res.data);
        }
      } catch (err) {
        console.error('Failed to load materials catalog', err);
      } finally {
        setLoading(false);
      }
    }
    loadMaterials();
  }, []);

  const handleCreateMaterial = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;

    setSaving(true);
    try {
      const res = await apiClient.post<Material>('/materials', {
        name,
        unit,
        category,
        description: description || null
      });

      if (res.data) {
        setMaterials(prev => [res.data!, ...prev]);
        setShowModal(false);
        // Reset form
        setName('');
        setUnit('Bags');
        setDescription('');
      }
    } catch (err) {
      console.error('Failed to create material', err);
      alert('Error creating material.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = activeCategory === 'All'
    ? materials
    : materials.filter(m => m.category === activeCategory);

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Boxes size={28} color="var(--color-primary)" /> Materials Catalog
            </h1>
            <p className="page-subtitle">Manage structural profiles, units, and inventory types</p>
          </div>
          <button 
            className="btn btn-primary btn-3d btn-3d-primary animate-pop-in" 
            onClick={() => setShowModal(true)}
            id="btn-add-material"
          >
            <Plus size={18} /> Add Material
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

      {/* List content */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Boxes size={40} />}
          title="No materials found"
          description={activeCategory === 'All' ? "Add structural elements to set up your procurement logs." : "Try selecting another category filter."}
        />
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {filtered.map(mat => (
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
              {mat.description ? (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                  {mat.description}
                </p>
              ) : (
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '8px' }}>
                  No description provided.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3D Glassmorphic Modal */}
      {showModal && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="panel-glass card-3d animate-pop-in" style={{ width: '90%', maxWidth: '460px', padding: 'var(--space-6)', background: '#fff', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="var(--color-cta)" /> Add Material to Catalog
            </h2>
            <form onSubmit={handleCreateMaterial} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="form-group">
                <label className="form-label">Material Name</label>
                <input
                  type="text"
                  className="form-input premium-input"
                  placeholder="e.g. Portland Cement OPC 53 / 12mm TMT Steel Rebar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Unit of Measure</label>
                  <select
                    className="form-input premium-input"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                  >
                    <option value="Bags">Bags</option>
                    <option value="Tons">Tons</option>
                    <option value="CFT">CFT (Cubic Feet)</option>
                    <option value="Kilograms">Kilograms</option>
                    <option value="Liters">Liters</option>
                    <option value="Nos">Nos (Pieces)</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input premium-input"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="Structural">Structural</option>
                    <option value="Finishing">Finishing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Specifications)</label>
                <textarea
                  className="form-input premium-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  placeholder="e.g. High-grade cement for structural concrete works."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
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
                  {saving ? <Loader2 size={16} className="spinner" /> : 'Add Material'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

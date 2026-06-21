import { useState, useEffect, type FormEvent } from 'react';
import { FileText, Plus, Loader2, Sparkles, Folder, Download, Calendar, Tag, Trash2, Search } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface DocumentItem {
  id: string;
  name: string;
  file_url: string;
  entity_type: string;
  entity_id: string;
  uploaded_by: string;
  category?: string;
  file_size?: number;
  created_at: string;
  uploader?: { name: string; role: string };
}

const CATEGORIES = ['All', 'Blueprints', 'Contracts', 'Permits', 'Invoices', 'Reports'];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Blueprints');
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await apiClient.get<DocumentItem[]>('/documents');
        if (res.data) {
          setDocuments(res.data);
        }
      } catch (err) {
        console.error('Failed to load documents vault', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocuments();
  }, []);

  const handleUploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSaving(true);
    // Simulating file metadata
    const dummyUrl = fileUrl || `https://apniestate-storage.s3.amazonaws.com/docs/${encodeURIComponent(name.toLowerCase())}.pdf`;
    const dummySize = Math.floor(Math.random() * 4500) + 120; // 120KB to 4.6MB

    try {
      const res = await apiClient.post<DocumentItem>('/documents', {
        name,
        file_url: dummyUrl,
        entity_type: 'PROJECT',
        entity_id: 'default-project-id',
        category,
        file_size: dummySize
      });

      if (res.data) {
        setDocuments(prev => [res.data!, ...prev]);
        setShowModal(false);
        // Reset form
        setName('');
        setCategory('Blueprints');
        setFileUrl('');
      }
    } catch (err) {
      console.error('Failed to upload document', err);
      alert('Error uploading document. Please verify the URL.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      await apiClient.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error('Failed to delete document', err);
    }
  };

  const filtered = documents.filter(doc => {
    const matchesCategory = activeCategory === 'All' || doc.category === activeCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (doc.category && doc.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getFormatSize = (sizeBytes?: number) => {
    if (!sizeBytes) return 'Unknown size';
    if (sizeBytes > 1024) {
      return `${(sizeBytes / 1024).toFixed(1)} MB`;
    }
    return `${sizeBytes} KB`;
  };

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header Banner with illustration */}
      <div className="page-header-row-with-img animate-fade-in">
        <div className="page-header-text-block">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <FileText size={24} color="var(--color-primary)" /> Documents Vault
          </h1>
          <p className="page-subtitle" style={{ marginTop: 0 }}>Secure blueprints, contracts, and permits</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="btn btn-primary btn-3d btn-3d-primary animate-pop-in" 
            onClick={() => setShowModal(true)}
            id="btn-upload-doc"
            style={{ minHeight: '40px', padding: '0 16px' }}
          >
            <Plus size={16} /> Upload Document
          </button>
          <div className="page-header-illust-wrap">
            <img src="/images/docs_friendly.png" alt="Documents Vault" className="page-header-illust-img" />
          </div>
        </div>
      </div>

      {/* Search Bar & Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input premium-input"
            style={{ width: '100%', maxWidth: '400px' }}
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-bar" style={{ margin: 0, padding: 0 }}>
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
      </div>

      {/* Grid listing (Folders or Files layout) */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Folder size={40} />}
          title="No documents matching filters"
          description="Try modifying search or upload a blueprint schematics file."
        />
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-6)' }}>
          {filtered.map(doc => (
            <div key={doc.id} className="card-3d animate-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              
              {/* Document Icon & Name */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '10px', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="truncate" style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-base)', marginBottom: '2px' }} title={doc.name}>
                    {doc.name}
                  </h4>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={10} /> {doc.category || 'General'} · {getFormatSize(doc.file_size)}
                  </span>
                </div>
              </div>

              {/* Upload Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border-light)', paddingTop: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Uploaded By</span>
                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{doc.uploader?.name || 'Admin'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Date Uploaded</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                <a 
                  href={doc.file_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary btn-3d btn-3d-secondary" 
                  style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', minHeight: 'auto', display: 'inline-flex', gap: '4px', alignItems: 'center' }}
                >
                  <Download size={12} /> View File
                </a>
                <button 
                  className="btn btn-danger btn-3d" 
                  style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)', minHeight: 'auto', display: 'inline-flex', gap: '4px', alignItems: 'center', border: '1px solid var(--color-danger-light)', borderBottom: '3px solid var(--color-danger)' }}
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  <Trash2 size={12} /> Delete
                </button>
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
              <Sparkles size={20} color="var(--color-cta)" /> Upload Construction Document
            </h2>
            <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              
              <div className="form-group">
                <label className="form-label">Document Title / Name</label>
                <input
                  type="text"
                  className="form-input premium-input"
                  placeholder="e.g. Ground Floor Electrical Layout Plan"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input premium-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="Blueprints">Blueprints & Maps</option>
                  <option value="Contracts">Contracts & Agreements</option>
                  <option value="Permits">Municipal Permits</option>
                  <option value="Invoices">Invoices & Receipts</option>
                  <option value="Reports">Safety & Site Reports</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mock Storage File URL (Optional)</label>
                <input
                  type="url"
                  className="form-input premium-input"
                  placeholder="e.g. https://storage.com/plan.pdf"
                  value={fileUrl}
                  onChange={e => setFileUrl(e.target.value)}
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
                  {saving ? <Loader2 size={16} className="spinner" /> : 'Store Document'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

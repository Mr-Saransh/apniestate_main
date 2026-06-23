import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Plus, Folder, Download, Calendar, Tag, Trash2, Search } from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/shared/Modal';
import {
  PrimaryCard,
  EmptyState,
  Badge,
  Button,
  Input,
  Select
} from '@/components/design-system';

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
  const location = useLocation();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [formError, setFormError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Blueprints');
  const [fileUrl, setFileUrl] = useState('');

  const loadDocuments = async () => {
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
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowModal(true);
    }
  }, [location.search]);

  const resetForm = () => {
    setName('');
    setCategory('Blueprints');
    setFileUrl('');
    setFormError('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
    navigate('/documents', { replace: true });
  };

  const handleUploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!name) {
      setFormError('Document Title is required.');
      return;
    }

    setSaving(true);
    setFormError('');
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
        handleCloseModal();
      }
    } catch (err: any) {
      console.error('Failed to upload document', err);
      setFormError(err.response?.data?.message || 'Error uploading document. Please try again.');
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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Documents Vault</h1>
          <p className="page-subtitle">Secure blueprints, contracts, and municipal permits.</p>
        </div>
      </div>

      {/* Search Bar & Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="search-input-wrapper" style={{ maxWidth: '400px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search documents by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-bar">
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

      {/* Grid listing */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Folder size={36} />}
          title="No documents logged"
          description="Try modifying search or upload a municipal permit or blueprint schema."
          action={<Button size="sm" onClick={() => setShowModal(true)}>Upload Your First Document</Button>}
        />
      ) : (
        <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {filtered.map(doc => (
            <PrimaryCard key={doc.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Document Icon & Name */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ padding: '10px', background: 'rgba(10, 61, 145, 0.08)', borderRadius: '12px', color: '#0A3D91', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={24} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 className="truncate" style={{ fontWeight: 700, fontSize: '15px', color: '#111827', margin: '0 0 2px 0' }} title={doc.name}>
                    {doc.name}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#6B7280', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Tag size={10} /> {doc.category || 'General'} · {getFormatSize(doc.file_size)}
                  </span>
                </div>
              </div>

              {/* Upload Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#374151', borderTop: '1px solid #E2E8F0', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Uploaded By</span>
                  <span style={{ fontWeight: 600 }}>{doc.uploader?.name || 'Admin'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6B7280' }}>Date Uploaded</span>
                  <span>{new Date(doc.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                <a 
                  href={doc.file_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-secondary btn-3d btn-3d-secondary" 
                  style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'auto', display: 'inline-flex', gap: '4px', alignItems: 'center', textDecoration: 'none' }}
                >
                  <Download size={12} /> View File
                </a>
                <button 
                  className="btn btn-danger btn-3d" 
                  style={{ padding: '6px 12px', fontSize: '12px', minHeight: 'auto', display: 'inline-flex', gap: '4px', alignItems: 'center', border: '1px solid #DC2626', borderBottom: '3px solid #DC2626', backgroundColor: 'transparent', color: '#DC2626' }}
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>

            </PrimaryCard>
          ))}
        </div>
      )}


      {/* Upload Document Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Upload Construction Document"
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={handleUploadDocument as any} 
              disabled={saving || !name}
              id="submit-upload-doc"
            >
              {saving ? 'Storing...' : 'Store Document'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <Input
            id="doc-name"
            label="Document Title / Name *"
            type="text"
            placeholder="e.g. Ground Floor Electrical Layout Plan"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />

          <Select
            id="doc-category"
            label="Category *"
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="Blueprints">Blueprints & Maps</option>
            <option value="Contracts">Contracts & Agreements</option>
            <option value="Permits">Municipal Permits</option>
            <option value="Invoices">Invoices & Receipts</option>
            <option value="Reports">Safety & Site Reports</option>
          </Select>

          <Input
            id="doc-url"
            label="Storage File URL (Optional)"
            type="url"
            placeholder="e.g. https://storage.com/plan.pdf"
            value={fileUrl}
            onChange={e => setFileUrl(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
}

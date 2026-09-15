import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  X,
  Download,
  Eye,
  Trash2,
  Search,
  Upload,
  FolderOpen,
  Calendar,
  Layers,
  FileSpreadsheet,
  Image as ImageIcon,
  Archive,
  FileCode,
  File,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  HardDrive,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useProject } from '@/context/ProjectContext';

export interface DocumentItem {
  id: string;
  name: string;
  file_url: string;
  entity_type: string;
  entity_id: string;
  uploaded_by: string;
  category?: string | null;
  file_size?: number | null; // in bytes or KB
  created_at: string;
  status?: string | null;
  uploader?: {
    name: string;
    role: string;
  };
  tags?: { id: string; tag: string }[];
}

const CATEGORIES = [
  'ALL',
  'Blueprints',
  'Contracts',
  'Permits',
  'Invoices',
  'Compliance',
  'Reports',
  'Site Photos',
  'Other',
] as const;

function getFileExt(urlOrName: string): string {
  try {
    const clean = urlOrName.split('?')[0];
    const parts = clean.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase();
    }
  } catch {}
  return '';
}

function getFileDetails(name: string, url: string) {
  const ext = getFileExt(name) || getFileExt(url);

  if (['pdf'].includes(ext)) {
    return {
      ext: 'PDF',
      color: 'bg-red-100 text-red-700 border-red-200',
      badgeColor: 'bg-red-600 text-white',
      Icon: FileText,
      iconColor: 'text-red-600',
    };
  }
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(ext)) {
    return {
      ext: ext.toUpperCase() || 'DOC',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      badgeColor: 'bg-blue-600 text-white',
      Icon: FileText,
      iconColor: 'text-blue-600',
    };
  }
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
    return {
      ext: ext.toUpperCase() || 'XLS',
      color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      badgeColor: 'bg-emerald-600 text-white',
      Icon: FileSpreadsheet,
      iconColor: 'text-emerald-600',
    };
  }
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext)) {
    return {
      ext: ext.toUpperCase() || 'IMG',
      color: 'bg-purple-100 text-purple-700 border-purple-200',
      badgeColor: 'bg-purple-600 text-white',
      Icon: ImageIcon,
      iconColor: 'text-purple-600',
    };
  }
  if (['dwg', 'dxf', 'cad', 'rvt', 'ifc'].includes(ext)) {
    return {
      ext: 'CAD',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      badgeColor: 'bg-cyan-700 text-white',
      Icon: FileCode,
      iconColor: 'text-cyan-700',
    };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      ext: 'ZIP',
      color: 'bg-amber-100 text-amber-800 border-amber-200',
      badgeColor: 'bg-amber-700 text-white',
      Icon: Archive,
      iconColor: 'text-amber-700',
    };
  }

  return {
    ext: ext ? ext.toUpperCase() : 'DOC',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    badgeColor: 'bg-slate-600 text-white',
    Icon: File,
    iconColor: 'text-slate-600',
  };
}

function formatSize(bytesOrKb?: number | null) {
  if (!bytesOrKb || bytesOrKb <= 0) return '—';
  // If value is > 50,000, treat as bytes; otherwise treat as KB
  const bytes = bytesOrKb > 50000 ? bytesOrKb : bytesOrKb * 1024;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { projects, activeProjectId } = useProject();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('ALL');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  // Upload Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Blueprints');
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      if (documents.length === 0) setLoading(true);
      const res = await apiClient.get<DocumentItem[]>('/documents');
      if (res.data) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Failed to load documents', err);
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
      setShowUploadModal(true);
    }
  }, [location.search]);

  useEffect(() => {
    if (activeProjectId && !targetProjectId) {
      setTargetProjectId(activeProjectId);
    }
  }, [activeProjectId]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setFormError('');
    if (!name.trim()) {
      // Auto-populate document title without the extension
      const fileNameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(fileNameWithoutExt);
    }
  };

  const handleUploadDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please enter a document title.');
      return;
    }
    if (!file) {
      setFormError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setFormError('');

    try {
      // 1. Upload file in ANY format to /api/documents/upload
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await apiClient.upload<{
        file_url: string;
        file_name: string;
        file_size: number;
        mime_type: string;
      }>('/documents/upload', formData);

      const uploadedUrl = uploadRes.data?.file_url;
      if (!uploadedUrl) {
        throw new Error(uploadRes.message || 'File upload failed to return a URL.');
      }

      // 2. Register document record in database
      await apiClient.post('/documents', {
        name: name.trim(),
        category,
        file_url: uploadedUrl,
        entity_type: targetProjectId ? 'PROJECT' : 'COMPANY',
        entity_id: targetProjectId || 'company-vault',
        file_size: file.size,
      });

      // 3. Reset form and refresh list
      setShowUploadModal(false);
      setName('');
      setFile(null);
      setCategory('Blueprints');
      navigate('/documents', { replace: true });
      await loadDocuments();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setFormError(err.message || 'Failed to complete document upload.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      const fullUrl = doc.file_url.startsWith('http')
        ? doc.file_url
        : `${window.location.origin}${doc.file_url}`;

      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Download request failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;

      // Extract proper download filename
      const ext = getFileExt(doc.file_url) || getFileExt(doc.name);
      const downloadName = doc.name.includes('.')
        ? doc.name
        : ext
        ? `${doc.name}.${ext}`
        : doc.name;

      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      // Fallback: direct window open for external/cross-origin files
      window.open(doc.file_url, '_blank');
    }
  };

  const handleDeleteDocument = async (id: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${docName}"?`)) {
      return;
    }
    try {
      await apiClient.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (previewDoc?.id === id) {
        setPreviewDoc(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete document');
    }
  };

  // Filtering
  const filteredDocs = documents.filter(doc => {
    const matchesSearch =
      !search ||
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.category?.toLowerCase().includes(search.toLowerCase()) ||
      doc.uploader?.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' ||
      (doc.category || '').toLowerCase() === selectedCategory.toLowerCase();

    const matchesProject =
      selectedProjectFilter === 'ALL' ||
      doc.entity_id === selectedProjectFilter;

    return matchesSearch && matchesCategory && matchesProject;
  });

  const totalSizeSum = documents.reduce((sum, d) => sum + (d.file_size || 0), 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-[#2648E7]/10 flex items-center justify-center text-[#2648E7]">
              <FolderOpen size={20} />
            </div>
            <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Document Vault
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Central repository for blueprints, contracts, permits, invoices & site compliance assets.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError('');
            setShowUploadModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 active:scale-98 transition-all shrink-0 cursor-pointer"
          style={{ backgroundColor: '#2648E7' }}
        >
          <Plus size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-border shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Files</span>
          <p className="text-xl font-black text-foreground mt-0.5">{documents.length}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-border shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vault Storage</span>
          <p className="text-xl font-black text-[#2648E7] mt-0.5">{formatSize(totalSizeSum)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-border shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Categories</span>
          <p className="text-xl font-black text-emerald-700 mt-0.5">
            {new Set(documents.map(d => d.category || 'Other')).size}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-border shadow-xs">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supported Types</span>
          <p className="text-xl font-black text-purple-700 mt-0.5">Any Format</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search documents by name, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
            />
          </div>

          {/* Project filter dropdown */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Project:</span>
            <select
              value={selectedProjectFilter}
              onChange={e => setSelectedProjectFilter(e.target.value)}
              className="w-full sm:w-56 p-2 bg-slate-50 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
            >
              <option value="ALL">All Projects & Company</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pt-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2648E7] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid / List */}
      {loading && documents.length === 0 ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-border">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 rounded-full border-3 border-[#2648E7] border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading documents...</p>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-xs">
          <div className="size-16 rounded-2xl bg-blue-50 text-[#2648E7] flex items-center justify-center mx-auto mb-3">
            <FolderOpen size={30} />
          </div>
          <h3 className="text-base font-bold text-foreground">No documents found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || selectedCategory !== 'ALL'
              ? 'No documents match your search or filter criteria.'
              : 'Upload your first blueprint, contract, invoice, or site permit. All formats are supported.'}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            style={{ backgroundColor: '#2648E7' }}
          >
            <Plus size={14} /> Upload Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDocs.map(doc => {
            const { ext, color, badgeColor, Icon, iconColor } = getFileDetails(doc.name, doc.file_url);
            const formattedDate = new Date(doc.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });
            const projectName = projects.find(p => p.id === doc.entity_id)?.name;

            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl border border-border p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-[#2648E7]/50 transition-all group"
              >
                <div>
                  {/* Top Row: Icon + Badge + Ext */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 border ${color}`}>
                        <Icon size={20} className={iconColor} />
                      </div>
                      <div className="min-w-0">
                        <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded ${badgeColor}`}>
                          {ext}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground block truncate mt-0.5">
                          {doc.category || 'General'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-bold text-slate-700 block">
                        {formatSize(doc.file_size)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{formattedDate}</span>
                    </div>
                  </div>

                  {/* Document Title */}
                  <h4
                    className="text-sm font-bold text-foreground line-clamp-2 mb-1 group-hover:text-[#2648E7] transition-colors cursor-pointer"
                    onClick={() => setPreviewDoc(doc)}
                    title={doc.name}
                  >
                    {doc.name}
                  </h4>

                  {/* Project / Uploader Info */}
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground flex-wrap mb-4">
                    {projectName && (
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700 truncate max-w-[160px]">
                        {projectName}
                      </span>
                    )}
                    {doc.uploader?.name && (
                      <span>by {doc.uploader.name}</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Download, View, Delete */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/70">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-[#2648E7] transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete Document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                    style={{ backgroundColor: '#2648E7' }}
                  >
                    <Download size={13} />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal (Accepts Any File Format) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#2648E7]/10 flex items-center justify-center text-[#2648E7]">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Upload Document</h3>
                  <p className="text-[11px] text-muted-foreground">Upload any file format (PDF, CAD, DOCX, XLSX, IMG, ZIP, etc.)</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-muted-foreground cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Select File (Any Format) <span className="text-red-500">*</span>
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-[#2648E7] bg-blue-50/50'
                      : file
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-border hover:border-[#2648E7] bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground truncate max-w-xs">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
                      </div>
                      <span className="text-[10px] font-semibold text-[#2648E7] hover:underline">
                        Click to change file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                        <Upload size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Click to browse or drag & drop</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          PDF, CAD/DWG, Word, Excel, Images, ZIP, TXT or any format
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Site Plan Rev 4"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
                />
              </div>

              {/* Category & Project Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-white border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
                  >
                    {CATEGORIES.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Associated Project
                  </label>
                  <select
                    value={targetProjectId}
                    onChange={e => setTargetProjectId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-border rounded-xl text-xs focus:outline-none focus:border-[#2648E7]"
                  >
                    <option value="">Company-wide (No Project)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  style={{ backgroundColor: '#2648E7' }}
                >
                  {uploading && (
                    <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{uploading ? 'Uploading...' : 'Save & Upload'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-8 rounded-lg bg-[#2648E7]/10 flex items-center justify-center text-[#2648E7] shrink-0">
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{previewDoc.name}</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {previewDoc.category} · {formatSize(previewDoc.file_size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: '#2648E7' }}
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1 hover:bg-slate-200 rounded-lg text-muted-foreground cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex items-center justify-center min-h-[350px]">
              {previewDoc.file_url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                <img
                  src={previewDoc.file_url}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full rounded-xl object-contain shadow-sm"
                />
              ) : previewDoc.file_url.match(/\.pdf$/i) ? (
                <iframe
                  src={previewDoc.file_url}
                  title={previewDoc.name}
                  className="w-full h-[65vh] rounded-xl border border-border bg-white"
                />
              ) : (
                <div className="text-center p-8 max-w-sm">
                  <div className="size-16 rounded-2xl bg-slate-200/80 flex items-center justify-center mx-auto mb-3 text-slate-600">
                    <File size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-foreground">Direct Preview Not Supported</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    This file format cannot be rendered directly inside the browser viewer. Click below to download or view with your system application.
                  </p>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: '#2648E7' }}
                  >
                    <Download size={14} /> Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

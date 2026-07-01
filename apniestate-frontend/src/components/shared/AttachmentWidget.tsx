import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Upload, X, File, Image, FileText, Download, Eye, Trash2 } from 'lucide-react';
import { apiClient } from '@/api/client';
import Modal from './Modal';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  created_at: string;
}

interface AttachmentWidgetProps {
  entityType: string;
  entityId: string;
  readOnly?: boolean;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image size={20} color="#3B82F6" />;
  if (fileType === 'application/pdf') return <FileText size={20} color="#EF4444" />;
  return <File size={20} color="#6B7280" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(fileType: string) {
  return fileType.startsWith('image/');
}

export default function AttachmentWidget({ entityType, entityId, readOnly = false }: AttachmentWidgetProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<Attachment[]>(`/attachments?entity_type=${entityType}&entity_id=${entityId}`);
      if (res.data) setAttachments(res.data);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) loadAttachments();
  }, [entityId, entityType]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        // Convert to base64 data URL for local storage
        // In production, this would upload to S3 and return a URL
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        await apiClient.post('/attachments', {
          entity_type: entityType,
          entity_id: entityId,
          file_name: file.name,
          file_url: dataUrl,
          file_type: file.type,
          file_size: file.size
        });
      }
      await loadAttachments();
    } catch (err) {
      console.error('Failed to upload attachment:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/attachments/${id}`);
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete attachment:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div style={{ marginTop: 'var(--space-4)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        fontSize: '13px',
        fontWeight: 600,
        color: 'var(--color-text)'
      }}>
        <Paperclip size={14} />
        Attachments ({attachments.length})
      </div>

      {/* Upload Zone */}
      {!readOnly && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
            transition: 'all 0.2s ease',
            marginBottom: '12px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Upload size={20} color="var(--color-text-muted)" style={{ margin: '0 auto 8px' }} />
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: 0 }}>
            {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
          </p>
          <p style={{ fontSize: '10px', color: 'var(--color-text-muted)', margin: '4px 0 0', opacity: 0.7 }}>
            Photos, PDFs, Documents · Max 10MB
          </p>
        </div>
      )}

      {/* Attachment Thumbnails */}
      {loading ? (
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 0' }}>Loading...</div>
      ) : attachments.length === 0 ? (
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', padding: '8px 0', fontStyle: 'italic' }}>
          No attachments yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
          {attachments.map(att => (
            <div
              key={att.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                overflow: 'hidden',
                background: 'var(--color-surface)',
                position: 'relative'
              }}
            >
              {/* Thumbnail */}
              {isImageType(att.file_type) ? (
                <div
                  style={{
                    width: '100%',
                    height: '80px',
                    backgroundImage: `url(${att.file_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setPreviewUrl(att.file_url); setPreviewName(att.file_name); }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-bg)',
                    cursor: 'pointer'
                  }}
                  onClick={() => { setPreviewUrl(att.file_url); setPreviewName(att.file_name); }}
                >
                  {getFileIcon(att.file_type)}
                </div>
              )}
              {/* Info */}
              <div style={{ padding: '6px 8px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {att.file_name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  {formatFileSize(att.file_size)}
                </div>
              </div>
              {/* Actions */}
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                display: 'flex',
                gap: '4px'
              }}>
                <button
                  onClick={() => { setPreviewUrl(att.file_url); setPreviewName(att.file_name); }}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.85)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Preview"
                >
                  <Eye size={12} />
                </button>
                <a
                  href={att.file_url}
                  download={att.file_name}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.85)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                  title="Download"
                >
                  <Download size={12} />
                </a>
                {!readOnly && (
                  <button
                    onClick={() => handleDelete(att.id)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EF4444'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      <Modal
        isOpen={!!previewUrl}
        onClose={() => { setPreviewUrl(null); setPreviewName(''); }}
        title={previewName}
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setPreviewUrl(null); setPreviewName(''); }}>
              Close
            </button>
            {previewUrl && (
              <a href={previewUrl} download={previewName} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <Download size={16} /> Download
              </a>
            )}
          </div>
        }
      >
        {previewUrl && (
          <div style={{ textAlign: 'center' }}>
            {previewUrl.startsWith('data:image/') || previewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
              <img src={previewUrl} alt={previewName} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '8px' }} />
            ) : previewUrl.startsWith('data:application/pdf') || previewUrl.match(/\.pdf$/i) ? (
              <iframe src={previewUrl} title={previewName} style={{ width: '100%', height: '70vh', border: 'none', borderRadius: '8px' }} />
            ) : (
              <div style={{ padding: '40px', color: 'var(--color-text-muted)' }}>
                <File size={48} style={{ margin: '0 auto 16px', display: 'block' }} />
                <p>Preview not available for this file type.</p>
                <p style={{ fontSize: '12px' }}>Click Download to view the file.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

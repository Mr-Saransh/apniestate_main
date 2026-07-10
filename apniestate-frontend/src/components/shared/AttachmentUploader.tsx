import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Paperclip, Upload, File, Image as ImageIcon, FileText, Download, Eye, Trash2, Camera, RefreshCw } from 'lucide-react';
import { apiClient } from '@/api/client';
import Modal from './Modal';
import imageCompression from 'browser-image-compression';

interface Attachment {
  id: string;
  category?: string;
  file_name: string;
  original_name?: string;
  mime_type: string;
  file_size?: number;
  secure_url: string;
  thumbnail_url?: string;
  created_at: string;
}

interface AttachmentUploaderProps {
  entityType: string;
  entityId: string;
  category?: string;
  readOnly?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon size={20} color="#3B82F6" />;
  if (mimeType === 'application/pdf') return <FileText size={20} color="#EF4444" />;
  return <File size={20} color="#6B7280" />;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(mimeType: string) {
  return mimeType.startsWith('image/');
}

export default function AttachmentUploader({ entityType, entityId, category, readOnly = false }: AttachmentUploaderProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string, name: string, progress: number }[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadAttachments = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const url = `/attachments?entity_type=${entityType}&entity_id=${entityId}${category ? `&category=${category}` : ''}`;
      const res = await apiClient.get<Attachment[]>(url);
      if (res.data) setAttachments(res.data);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [entityId, entityType, category]);

  useEffect(() => {
    loadAttachments();
  }, [loadAttachments]);

  const processAndUploadFile = async (file: File) => {
    const uploadId = Math.random().toString(36).substring(7);
    setUploadingFiles(prev => [...prev, { id: uploadId, name: file.name, progress: 0 }]);
    
    try {
      let processedFile = file;
      
      // Compress image before upload if it's an image
      if (isImageType(file.type)) {
        setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 10 } : u));
        
        const options = {
          maxSizeMB: 1, // Max size 1MB
          maxWidthOrHeight: 1920, // Resize large images
          useWebWorker: true,
        };
        processedFile = await imageCompression(file, options);
      }
      
      setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 30 } : u));
      
      // Get signature from our backend
      const folderPath = `ApniEstate/${entityType}/${entityId}`;
      const sigRes = await apiClient.post('/attachments/signature', { folder: folderPath });
      const { signature, timestamp, folder, cloudName, apiKey } = sigRes.data as any;
      
      setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 50 } : u));
      
      // Upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', processedFile);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);
      formData.append('folder', folder);
      
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
      
      const uploadRes = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) {
        throw new Error('Cloudinary upload failed');
      }
      
      const cloudinaryData = await uploadRes.json();
      
      setUploadingFiles(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 90 } : u));
      
      // Save metadata to our backend
      await apiClient.post('/attachments', {
        entity_type: entityType,
        entity_id: entityId,
        category: category || null,
        file_name: processedFile.name,
        original_name: file.name,
        mime_type: processedFile.type || cloudinaryData.resource_type + '/' + cloudinaryData.format,
        file_size: cloudinaryData.bytes,
        image_width: cloudinaryData.width || null,
        image_height: cloudinaryData.height || null,
        cloudinary_public_id: cloudinaryData.public_id,
        secure_url: cloudinaryData.secure_url,
        // Optional: Cloudinary transforms can be used for thumbnail, but we can also just use the secure_url
        thumbnail_url: cloudinaryData.secure_url, 
      });
      
      setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
      loadAttachments();
    } catch (error) {
      console.error('Upload failed:', error);
      // In a real app, mark it as failed instead of just removing
      setUploadingFiles(prev => prev.filter(u => u.id !== uploadId));
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    // We process each file sequentially or could do Promise.all for parallelism.
    // For mobile, sequential might be safer for memory.
    for (const file of Array.from(files)) {
      await processAndUploadFile(file);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;
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
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text)'
        }}>
          <Paperclip size={14} />
          {category ? `${category} ` : 'Attachments '} 
          ({attachments.length})
        </div>
        
        <button 
          onClick={loadAttachments}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
        </button>
      </div>

      {/* Upload Zone */}
      {!readOnly && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          {/* Camera Button for Mobile */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '16px',
              background: 'var(--color-primary)',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Camera size={24} />
            Take Photo
          </button>
          
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => handleUpload(e.target.files)}
          />

          {/* Regular Upload Button */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 2,
              border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(59, 130, 246, 0.04)' : 'transparent',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
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
            <Upload size={20} color="var(--color-text-muted)" style={{ margin: '0 auto 4px' }} />
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', margin: 0 }}>
              Upload Files
            </p>
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              Drag & drop or click
            </p>
          </div>
        </div>
      )}

      {/* Uploading Status */}
      {uploadingFiles.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {uploadingFiles.map(file => (
            <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--color-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Uploading: {file.name}
                </div>
                <div style={{ height: '4px', background: 'var(--color-border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${file.progress}%`, background: 'var(--color-primary)', transition: 'width 0.3s ease' }} />
                </div>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}>
                {file.progress}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attachment Grid */}
      {loading && attachments.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '16px', textAlign: 'center', background: 'var(--color-bg)', borderRadius: '12px' }}>
          Loading attachments...
        </div>
      ) : attachments.length === 0 && uploadingFiles.length === 0 ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', padding: '16px', textAlign: 'center', background: 'var(--color-bg)', borderRadius: '12px', fontStyle: 'italic' }}>
          No attachments yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {attachments.map(att => (
            <div
              key={att.id}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'var(--color-surface)',
                position: 'relative',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => { setPreviewUrl(att.secure_url); setPreviewName(att.file_name); }}
            >
              {/* Thumbnail */}
              {isImageType(att.mime_type) ? (
                <div
                  style={{
                    width: '100%',
                    height: '100px',
                    backgroundImage: `url(${att.secure_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-bg)',
                  }}
                >
                  {getFileIcon(att.mime_type)}
                </div>
              )}
              
              {/* Info */}
              <div style={{ padding: '8px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {att.file_name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    {formatFileSize(att.file_size)}
                  </div>
                  <div style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--color-bg)', borderRadius: '10px', color: 'var(--color-text-muted)' }}>
                    {new Date(att.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              {/* Actions Overlay */}
              <div 
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  display: 'flex',
                  gap: '6px',
                  opacity: 0.9
                }}
                onClick={e => e.stopPropagation()} // Prevent preview when clicking actions
              >
                <a
                  href={att.secure_url}
                  download={att.file_name}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    color: 'var(--color-text)'
                  }}
                  title="Download"
                >
                  <Download size={14} />
                </a>
                {!readOnly && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(att.id); }}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EF4444'
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
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
              <a href={previewUrl} download={previewName} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Download File
              </a>
            )}
          </div>
        }
      >
        {previewUrl && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            {previewUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) || previewUrl.startsWith('data:image/') || previewUrl.includes('cloudinary.com') ? (
              <img src={previewUrl} alt={previewName} style={{ maxWidth: '100%', maxHeight: '65vh', borderRadius: '8px', objectFit: 'contain' }} />
            ) : previewUrl.match(/\.pdf$/i) || previewUrl.startsWith('data:application/pdf') ? (
              <iframe src={previewUrl} title={previewName} style={{ width: '100%', height: '65vh', border: '1px solid var(--color-border)', borderRadius: '8px' }} />
            ) : (
              <div style={{ padding: '60px', color: 'var(--color-text-muted)', background: 'var(--color-bg)', borderRadius: '12px' }}>
                <File size={64} style={{ margin: '0 auto 24px', display: 'block', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text)' }}>Preview not available</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>This file type cannot be previewed in the browser. Click Download to view the file.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

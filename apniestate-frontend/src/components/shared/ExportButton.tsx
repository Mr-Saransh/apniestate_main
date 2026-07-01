import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { exportData, ExportColumn } from './ExportEngine';
import { useAuth } from '@/context/AuthContext';

interface ExportButtonProps {
  data: any[];
  columns: ExportColumn[];
  title: string;
  className?: string;
}

export default function ExportButton({ data, columns, title, className = 'btn btn-secondary' }: ExportButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format: 'excel' | 'pdf') => {
    setIsOpen(false);
    exportData({
      format,
      title,
      columns,
      data,
      generatedBy: user?.name
    });
  };

  return (
    <div className="relative" ref={dropdownRef} style={{ display: 'inline-block' }}>
      <button 
        className={className} 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
      >
        <Download size={16} /> Export ▾
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '4px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          zIndex: 50,
          minWidth: '160px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => handleExport('excel')}
            style={{
              width: '100%',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'left'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <Table size={16} color="#10B981" /> Export as Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            style={{
              width: '100%',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              textAlign: 'left',
              borderTop: '1px solid var(--color-border)'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseOut={e => e.currentTarget.style.background = 'none'}
          >
            <FileText size={16} color="#EF4444" /> Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}

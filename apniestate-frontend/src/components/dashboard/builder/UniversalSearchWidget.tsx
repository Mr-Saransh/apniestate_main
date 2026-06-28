import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FolderKanban, Briefcase, FileText, Users, Boxes, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UniversalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
}

export const UniversalSearchWidget: React.FC<UniversalSearchProps> = ({ isOpen, onClose, data }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      setQuery('');
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Since this component might be mounted but hidden, we need the parent to toggle it.
        // The parent will handle the toggle.
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mock search logic based on dashboard data
  const getResults = () => {
    if (!query || query.trim().length < 2) return [];
    
    const q = query.toLowerCase();
    const results: { id: string; title: string; subtitle: string; type: string; link: string; icon: any }[] = [];

    // Search Projects
    data?.projectIntelligence?.forEach((p: any) => {
      if (p.name.toLowerCase().includes(q)) {
        results.push({ id: `p-${p.id}`, title: p.name, subtitle: `Project • ${p.status}`, type: 'Project', link: `/projects?id=${p.id}`, icon: FolderKanban });
      }
    });

    // Search Materials
    data?.materialShortages?.forEach((m: any) => {
      if (m.name.toLowerCase().includes(q) || m.siteName.toLowerCase().includes(q)) {
        results.push({ id: `m-${m.name}`, title: m.name, subtitle: `Material at ${m.siteName}`, type: 'Material', link: `/inventory`, icon: Boxes });
      }
    });

    // Search Vendors
    data?.vendorPerformance?.forEach((v: any) => {
      if (v.name.toLowerCase().includes(q)) {
        results.push({ id: `v-${v.name}`, title: v.name, subtitle: `Vendor • ${v.type.replace(/_/g, ' ')}`, type: 'Vendor', link: `/vendors`, icon: Users });
      }
    });

    // Fallbacks if no exact matches found but query relates to modules
    if ('projects'.includes(q)) results.push({ id: 'mod-proj', title: 'Go to Projects', subtitle: 'Module', type: 'Module', link: '/projects', icon: FolderKanban });
    if ('inventory'.includes(q) || 'materials'.includes(q)) results.push({ id: 'mod-inv', title: 'Go to Inventory', subtitle: 'Module', type: 'Module', link: '/inventory', icon: Boxes });
    if ('finance'.includes(q) || 'expenses'.includes(q)) results.push({ id: 'mod-fin', title: 'Go to Finance', subtitle: 'Module', type: 'Module', link: '/finance', icon: Calculator });

    return results;
  };

  const results = getResults();

  const handleSelect = (link: string) => {
    navigate(link);
    onClose();
  };

  return (
    <div className="search-palette-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-palette-modal animate-in">
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--color-border)' }}>
          <Search size={20} color="var(--color-text-muted)" />
          <input 
            ref={inputRef}
            className="search-palette-input" 
            placeholder="Search projects, materials, vendors... (Cmd+K)" 
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={20} color="var(--color-text-muted)" />
          </button>
        </div>

        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
          {query.trim().length > 0 && query.trim().length < 2 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>Type at least 2 characters...</div>
          )}
          
          {query.trim().length >= 2 && results.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              No results found for "{query}"
            </div>
          )}

          {results.map((res, i) => {
            const Icon = res.icon;
            return (
              <div 
                key={i} 
                onClick={() => handleSelect(res.link)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', 
                  borderRadius: '12px', cursor: 'pointer', transition: 'background 0.1s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color="var(--color-primary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>{res.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{res.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Powered by Universal Search Engine</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};

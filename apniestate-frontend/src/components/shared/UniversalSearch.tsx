import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  FolderKanban,
  MapPin,
  Users,
  ClipboardList,
  FileText,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/api/client';

interface SearchResult {
  id: string;
  name: string;
  category: string;
  link: string;
}

const categoryIcons: Record<string, any> = {
  Projects: FolderKanban,
  Sites: MapPin,
  Workers: Users,
  Tasks: ClipboardList,
  Invoices: FileText,
  Documents: FileText,
};

const categoryColors: Record<string, string> = {
  Projects: '#0A3D91',
  Sites: '#16A34A',
  Workers: '#F59E0B',
  Tasks: '#3B82F6',
  Invoices: '#DC2626',
  Documents: '#8B5CF6',
};

export default function UniversalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<any>(null);

  // Open with Ctrl+K or custom event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    const handleOpenSearch = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-search', handleOpenSearch as EventListener);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-search', handleOpenSearch as EventListener);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Search with debounce
  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setSelectedIndex(0);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!q.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<any>(`/search?q=${encodeURIComponent(q)}`);
        if (res.success && res.data) {
          const allResults: SearchResult[] = [
            ...res.data.projects,
            ...res.data.sites,
            ...res.data.workers,
            ...res.data.tasks,
            ...res.data.invoices,
            ...res.data.documents,
          ];
          setResults(allResults);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      setIsOpen(false);
      navigate(results[selectedIndex].link);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    navigate(result.link);
  };

  // Group results by category
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            style={{
              position: 'fixed',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              width: '90%',
              maxWidth: '580px',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
              }}
            >
              <Search size={20} color="#9CA3AF" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search projects, sites, workers, tasks..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#111827',
                  background: 'transparent',
                }}
              />
              {loading && <Loader2 size={18} className="animate-spin" color="#9CA3AF" />}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(0, 0, 0, 0.06)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#6B7280',
                }}
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '400px', overflow: 'auto', padding: '8px 0' }}>
              {!query.trim() && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                  <Search size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>
                    Type to search across your entire workspace
                  </p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>
                    <kbd style={{ padding: '2px 6px', background: '#F3F4F6', borderRadius: '4px', fontWeight: 600 }}>Ctrl</kbd> + <kbd style={{ padding: '2px 6px', background: '#F3F4F6', borderRadius: '4px', fontWeight: 600 }}>K</kbd> to open anytime
                  </p>
                </div>
              )}

              {query.trim() && results.length === 0 && !loading && (
                <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>
                  <p style={{ fontSize: '14px', fontWeight: 500 }}>No results found for "{query}"</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Try a different search term</p>
                </div>
              )}

              {Object.entries(grouped).map(([category, items]) => {
                const Icon = categoryIcons[category] || FileText;
                const color = categoryColors[category] || '#6B7280';

                return (
                  <div key={category}>
                    <div
                      style={{
                        padding: '8px 20px 4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: '#9CA3AF',
                      }}
                    >
                      {category}
                    </div>
                    {items.map((result) => {
                      const thisIndex = flatIndex++;
                      const isSelected = thisIndex === selectedIndex;

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '10px 20px',
                            border: 'none',
                            background: isSelected ? 'rgba(10, 61, 145, 0.06)' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.1s ease',
                          }}
                          onMouseEnter={() => setSelectedIndex(thisIndex)}
                        >
                          <span
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: `${color}12`,
                              color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={16} />
                          </span>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                            {result.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

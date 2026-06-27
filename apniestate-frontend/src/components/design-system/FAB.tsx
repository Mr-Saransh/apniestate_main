import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useAuth } from '@/context/AuthContext';
import { getFabConfig } from '@/config/navigation.config';

export function FAB() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const actions = getFabConfig(user?.role || 'SITE_SUPERVISOR');

  const handleAction = useCallback(
    (action: any) => {
      setIsOpen(false);
      if (action.action === 'search') {
        window.dispatchEvent(new CustomEvent('open-search'));
        return;
      }
      navigate(action.path);
    },
    [navigate]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sd-fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      <div
        ref={containerRef}
        className={`sd-fab-container ${isDesktop ? 'sd-fab-container--desktop' : 'sd-fab-container--mobile'}`}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className={`sd-fab-menu ${isDesktop ? 'sd-fab-menu--desktop' : 'sd-fab-menu--mobile'}`}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            >
              {actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    type="button"
                    className="sd-fab-item"
                    onClick={() => handleAction(action)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ delay: i * 0.025, duration: 0.18 }}
                  >
                    <span className="sd-fab-item-icon" style={{ background: action.bg, color: action.color }}>
                      <Icon size={16} />
                    </span>
                    <span className="sd-fab-item-label">{action.label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="button"
          className="sd-fab-btn"
          onClick={() => setIsOpen((o) => !o)}
          aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={isOpen}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 24 }}
        >
          <Plus size={28} strokeWidth={2.5} />
        </motion.button>
      </div>
    </>
  );
}

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

  // Maximum 6 visible actions, slice to guarantee compliance
  const rawActions = getFabConfig(user?.role || 'SITE_SUPERVISOR');
  const actions = rawActions.slice(0, 6);

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

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Framer Motion transition parameters
  const menuVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.02
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 16 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 450, damping: 25 }
    },
    exit: { opacity: 0, scale: 0.8, y: 12, transition: { duration: 0.15 } }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="sd-fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
              className="sd-fab-menu"
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
            >
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    type="button"
                    className="sd-fab-item"
                    onClick={() => handleAction(action)}
                    variants={itemVariants}
                    style={{ minHeight: 48, outline: 'none' }} // Minimum 48px touch target
                  >
                    <span className="sd-fab-item-label">{action.label}</span>
                    <span className="sd-fab-item-icon-wrapper" style={{ width: 56, display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
                      <span className="sd-fab-item-icon" style={{ background: action.bg, color: action.color, width: 48, height: 48 }}>
                        <Icon size={20} />
                      </span>
                    </span>
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
          style={{ width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        >
          <Plus size={28} strokeWidth={2.5} />
        </motion.button>
      </div>
    </>
  );
}

import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useMediaQuery';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const isDesktop = useIsDesktop();

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: isDesktop 
      ? { scale: 0.96, opacity: 0, y: 10 } 
      : { y: '100%' },
    visible: { 
      scale: 1, 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 350, damping: 30 } as const
    },
    exit: isDesktop
      ? { scale: 0.96, opacity: 0, y: 10, transition: { duration: 0.15 } }
      : { y: '100%', transition: { type: 'spring', stiffness: 350, damping: 32 } as const }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="responsive-modal-overlay"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={overlayVariants}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="responsive-modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            variants={modalVariants}
          >
            <div className="responsive-modal-handle" />
            <div className="responsive-modal-header">
              <h2 className="responsive-modal-title">{title}</h2>
              <button
                className="btn btn-icon btn-ghost"
                onClick={onClose}
                aria-label="Close"
                style={{ 
                  minHeight: 48, 
                  minWidth: 48, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div className="responsive-modal-body">
              {children}
            </div>
            {footer && (
              <div className="responsive-modal-footer">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

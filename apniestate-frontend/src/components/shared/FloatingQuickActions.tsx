import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  ClipboardCheck,
  PackageSearch,
  HardHat,
  Wallet,
  FileText,
  UserCheck,
  Package,
  Boxes,
  Users,
  Calendar,
  AlertTriangle,
  Receipt,
  Calculator,
  Shield,
  Layers,
  Building2,
  TrendingUp,
  Settings,
  Home
} from 'lucide-react';
import '@/styles/floating-actions.css';
import { useAuth } from '@/context/AuthContext';
import { getFabConfig } from '@/config/navigation.config';

export default function FloatingQuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const fabActions = getFabConfig(user?.role || 'SITE_SUPERVISOR');

  if (!fabActions || fabActions.length === 0) {
    return null; // Don't render FAB if no actions available for this role
  }

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="floating-actions-container">
      {isOpen && <div className="floating-overlay" onClick={() => setIsOpen(false)} />}
      
      <div className={`floating-menu ${isOpen ? 'is-open' : ''}`}>
        {fabActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button 
              key={index}
              className={`floating-menu-item item-${index + 1}`}
              onClick={() => handleAction(action.path)}
            >
              <span className="floating-menu-label">{action.label}</span>
              <div className="floating-menu-icon" style={{ color: action.color, backgroundColor: action.bg }}>
                <Icon size={20} />
              </div>
            </button>
          );
        })}
      </div>

      <button 
        className={`floating-fab ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Quick Actions"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  ClipboardCheck,
  PackageSearch,
  HardHat,
  Wallet,
  FileText
} from 'lucide-react';
import '@/styles/floating-actions.css';

export default function FloatingQuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="floating-actions-container">
      {isOpen && <div className="floating-overlay" onClick={() => setIsOpen(false)} />}
      
      <div className={`floating-menu ${isOpen ? 'is-open' : ''}`}>
        <button 
          className="floating-menu-item item-1"
          onClick={() => handleAction('/projects?create=true')}
        >
          <span className="floating-menu-label">Create Project</span>
          <div className="floating-menu-icon text-primary">
            <FolderKanban size={20} />
          </div>
        </button>

        <button 
          className="floating-menu-item item-2"
          onClick={() => handleAction('/tasks?create=true')}
        >
          <span className="floating-menu-label">Create Task</span>
          <div className="floating-menu-icon text-success">
            <ClipboardCheck size={20} />
          </div>
        </button>

        <button 
          className="floating-menu-item item-3"
          onClick={() => handleAction('/inventory?create=true')}
        >
          <span className="floating-menu-label">Add Material</span>
          <div className="floating-menu-icon text-warning">
            <PackageSearch size={20} />
          </div>
        </button>

        <button 
          className="floating-menu-item item-4"
          onClick={() => handleAction('/attendance')}
        >
          <span className="floating-menu-label">Mark Attendance</span>
          <div className="floating-menu-icon text-info">
            <HardHat size={20} />
          </div>
        </button>

        <button 
          className="floating-menu-item item-5"
          onClick={() => handleAction('/finance?create=true')}
        >
          <span className="floating-menu-label">Add Expense</span>
          <div className="floating-menu-icon" style={{ color: '#E11D48' }}>
            <Wallet size={20} />
          </div>
        </button>

        <button 
          className="floating-menu-item item-6"
          onClick={() => handleAction('/documents?create=true')}
        >
          <span className="floating-menu-label">Upload Document</span>
          <div className="floating-menu-icon" style={{ color: '#6366F1' }}>
            <FileText size={20} />
          </div>
        </button>
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

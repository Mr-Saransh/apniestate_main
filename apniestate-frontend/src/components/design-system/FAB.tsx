import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderKanban,
  ClipboardCheck,
  Package,
  UserCheck,
  Wallet,
  FileText,
  X
} from 'lucide-react';
import { Colors } from './Colors';
import { Shadows } from './Shadows';

export function FAB() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleFabClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuAction = (targetPath: string) => {
    setIsOpen(false);
    navigate(targetPath);
  };

  return (
    <>
      <style>
        {`
          @keyframes slideUpFab {
            0% { opacity: 0; transform: translateY(20px) scale(0.9); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .fab-menu-container {
            animation: slideUpFab 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            transform-origin: bottom right;
          }
          .fab-btn-rotate {
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          }
          .fab-btn-rotate.open {
            transform: rotate(135deg);
          }
        `}
      </style>
      <div
        style={{
          position: 'fixed',
          bottom: '88px', // High enough to avoid bottom nav bar on mobile
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {/* Quick Actions menu */}
        {isOpen && (
          <>
            {/* Overlay to close menu on click */}
            <div
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                zIndex: -1,
                animation: 'fadeIn 0.2s ease',
              }}
            />

            <div
              className="fab-menu-container"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '16px',
                alignItems: 'flex-end',
              }}
            >
              {/* Create Project */}
              <button
                onClick={() => handleMenuAction('/projects?create=true')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  boxShadow: Shadows.md,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: Colors.primaryText,
                  fontSize: '14px',
                }}
              >
                <span>Create Project</span>
                <div style={{ color: Colors.primaryBlue, display: 'flex' }}><FolderKanban size={18} /></div>
              </button>

              {/* Create Task */}
              <button
                onClick={() => handleMenuAction('/tasks?create=true')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  boxShadow: Shadows.md,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: Colors.primaryText,
                  fontSize: '14px',
                }}
              >
                <span>Create Task</span>
                <div style={{ color: Colors.successGreen, display: 'flex' }}><ClipboardCheck size={18} /></div>
              </button>

              {/* Request Material */}
              <button
                onClick={() => handleMenuAction('/inventory?create=true')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  boxShadow: Shadows.md,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: Colors.primaryText,
                  fontSize: '14px',
                }}
              >
                <span>Add Material</span>
                <div style={{ color: Colors.warningAmber, display: 'flex' }}><Package size={18} /></div>
              </button>

              {/* Mark Attendance */}
              <button
                onClick={() => handleMenuAction('/attendance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  boxShadow: Shadows.md,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: Colors.primaryText,
                  fontSize: '14px',
                }}
              >
                <span>Mark Attendance</span>
                <div style={{ color: Colors.primaryBlue, display: 'flex' }}><UserCheck size={18} /></div>
              </button>

              {/* Add Expense */}
              <button
                onClick={() => handleMenuAction('/finance?create=true')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  boxShadow: Shadows.md,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: Colors.primaryText,
                  fontSize: '14px',
                }}
              >
                <span>Add Expense</span>
                <div style={{ color: Colors.errorRed, display: 'flex' }}><Wallet size={18} /></div>
              </button>

              {/* Upload Document */}
              <button
                onClick={() => handleMenuAction('/documents?create=true')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#FFFFFF',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '24px',
                  boxShadow: Shadows.md,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: Colors.primaryText,
                  fontSize: '14px',
                }}
              >
                <span>Upload Document</span>
                <div style={{ color: Colors.primaryBlue, display: 'flex' }}><FileText size={18} /></div>
              </button>
            </div>
          </>
        )}

        {/* Primary Blue FAB Button */}
        <button
          onClick={handleFabClick}
          aria-label="Quick action"
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: Colors.primaryBlue,
            color: '#FFFFFF',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(10, 61, 145, 0.35)',
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          <div className={`fab-btn-rotate ${isOpen ? 'open' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={28} />
          </div>
        </button>
      </div>
    </>
  );
}

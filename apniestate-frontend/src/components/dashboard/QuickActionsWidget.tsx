import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuickActionsConfig } from '@/config/navigation.config';
import { useAuth } from '@/context/AuthContext';

export function QuickActionsWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const actions = getQuickActionsConfig(user?.role || 'SITE_SUPERVISOR');

  if (!actions || actions.length === 0) return null;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '20px',
      padding: '24px',
      marginTop: 'var(--space-6)'
    }}>
      <h3 style={{ 
        fontSize: '15px', 
        fontWeight: 700, 
        color: 'var(--color-text)', 
        marginBottom: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px' 
      }}>
        Quick Actions
      </h3>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '16px'
      }}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                padding: '16px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = action.color;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${action.bg}`;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: action.bg,
                color: action.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <Icon size={20} />
              </div>
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: 'var(--color-text)' 
              }}>
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

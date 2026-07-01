import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
      background: 'var(--color-bg)',
      color: 'var(--color-text)'
    }}>
      <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        padding: '24px',
        borderRadius: '50%',
        marginBottom: '24px',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <ShieldAlert size={64} color="#EF4444" />
      </div>
      
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 800, 
        marginBottom: '16px',
        color: 'var(--color-text)'
      }}>
        Access Denied
      </h1>
      
      <p style={{ 
        fontSize: '16px', 
        color: 'var(--color-text-muted)', 
        maxWidth: '400px',
        lineHeight: 1.6,
        marginBottom: '32px'
      }}>
        You do not have the required permissions to view this module. This area is restricted to authorized roles only.
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--color-primary, #0A3D91)',
          color: '#FFF',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px rgba(10, 61, 145, 0.2)'
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <ArrowLeft size={18} />
        Return to My Dashboard
      </button>
    </div>
  );
}

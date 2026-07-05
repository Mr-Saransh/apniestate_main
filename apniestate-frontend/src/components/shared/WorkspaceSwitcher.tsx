import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Building2, ChevronDown, Check, Loader2, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WorkspaceSwitcher() {
  const { memberships, activeWorkspace, switchWorkspace } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!memberships || memberships.length === 0 || !activeWorkspace) return null;

  const handleSwitch = async (companyId: string, role: string) => {
    if (activeWorkspace.company.id === companyId && activeWorkspace.role === role) {
      setIsOpen(false);
      return;
    }
    
    try {
      setSwitchingTo(`${companyId}-${role}`);
      await switchWorkspace(companyId, role);
      setIsOpen(false);
      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingTo(null);
    }
  };

  return (
    <div className="workspace-switcher-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="workspace-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', minWidth: '180px',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
          <Building2 size={16} color="var(--color-primary)" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>
              {activeWorkspace.company.name}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
              {activeWorkspace.role.replace('_', ' ')}
            </span>
          </div>
        </div>
        <ChevronDown size={14} color="var(--color-text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div 
          className="workspace-dropdown"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            width: '260px', background: 'var(--color-surface)',
            border: '1px solid var(--color-border)', borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1000,
            maxHeight: '400px', overflowY: 'auto', padding: '8px'
          }}
        >
          <div style={{ padding: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Your Workspaces
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {memberships.map((mem) => (
              <div key={mem.company_id} style={{ paddingBottom: '4px', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ padding: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                  {mem.company.name}
                </div>
                {mem.roles.map((role) => {
                  const isActive = activeWorkspace.company.id === mem.company_id && activeWorkspace.role === role;
                  const isSwitching = switchingTo === `${mem.company_id}-${role}`;
                  
                  return (
                    <button
                      key={`${mem.company_id}-${role}`}
                      onClick={() => handleSwitch(mem.company_id, role)}
                      disabled={isSwitching}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', background: isActive ? 'var(--color-bg)' : 'transparent',
                        border: 'none', borderRadius: '6px', cursor: 'pointer', textAlign: 'left',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'
                      }}
                      onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-bg)'; }}
                      onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ fontSize: '13px' }}>{role.replace('_', ' ')}</span>
                      {isSwitching ? <Loader2 size={14} className="animate-spin" /> : isActive ? <Check size={14} /> : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ padding: '8px', marginTop: '4px' }}>
            <button
              onClick={() => { setIsOpen(false); navigate('/select-workspace'); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px', background: 'transparent', border: '1px dashed var(--color-border)',
                borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500, color: 'var(--color-text)'
              }}
            >
              <ArrowRightLeft size={14} /> Manage Workspaces
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

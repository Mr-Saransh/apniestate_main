import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Bell, Menu, ChevronDown, Check, Building2, Plus } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PLANNING: { label: "Planning", bg: "bg-white/10", text: "text-white", dot: "bg-white" },
    ACTIVE: { label: "Active", bg: "bg-emerald-500/20", text: "text-emerald-100", dot: "bg-emerald-400" },
    ON_HOLD: { label: "On Hold", bg: "bg-amber-500/20", text: "text-amber-100", dot: "bg-amber-400" },
    COMPLETED: { label: "Done", bg: "bg-white/10", text: "text-white", dot: "bg-white" },
    CANCELLED: { label: "Cancelled", bg: "bg-red-500/20", text: "text-red-100", dot: "bg-red-400" },
  };
  const s = map[status] || { label: status, bg: "bg-white/10", text: "text-white", dot: "bg-white" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export default function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { projects, activeProject, activeProjectId, setActiveProjectId } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';
  
  const [showSwitcher, setShowSwitcher] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setShowSwitcher(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="shrink-0 h-14 lg:h-16 flex items-center px-4 lg:px-8 gap-4 z-30 relative shadow-md transition-all" style={{ background: "linear-gradient(90deg, #2648E7 0%, #1e3bbd 100%)", color: "white" }}>
      <button
        onClick={onOpenSidebar}
        className="lg:hidden size-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center shrink-0"
      >
        <Menu size={18} className="text-white" />
      </button>

      {/* Project Switcher */}
      <div className="flex-1 min-w-0 relative" ref={switcherRef}>
        <button 
          onClick={() => setShowSwitcher(!showSwitcher)}
          className="flex flex-col items-start text-left max-w-full hover:bg-white/10 rounded-xl px-2 py-1 -ml-2 transition-colors"
        >
          {activeProject ? (
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm lg:text-base font-bold text-white truncate" style={{ fontFamily: "var(--font-display)" }}>
                  {activeProject.name}
                </p>
                <ChevronDown size={16} className={`text-white/70 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
                <StatusBadge status={activeProject.status} />
              </div>
              {(activeProject.city || activeProject.address) && (
                <p className="text-xs text-white/70 flex items-center gap-1 leading-none mt-0.5">
                  <MapPin size={10} />{activeProject.city || activeProject.address}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm lg:text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
                Apni Estate
              </p>
              <ChevronDown size={16} className={`text-white/70 transition-transform ${showSwitcher ? 'rotate-180' : ''}`} />
            </div>
          )}
        </button>

        {/* Dropdown Menu */}
        {showSwitcher && (
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-border overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            <div className="p-3 border-b border-border bg-slate-50/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Switch Project</p>
            </div>
            <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {projects.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">No projects found.</div>
              ) : (
                projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProjectId(p.id);
                      setShowSwitcher(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      p.id === activeProjectId 
                        ? 'bg-[#2648E7]/10 text-[#2648E7]' 
                        : 'text-foreground hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                        p.id === activeProjectId ? 'bg-[#2648E7] text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <Building2 size={14} />
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className={`text-sm font-semibold truncate ${p.id === activeProjectId ? 'text-[#2648E7]' : 'text-slate-800'}`}>
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.city || 'No location set'}
                        </p>
                      </div>
                    </div>
                    {p.id === activeProjectId && <Check size={16} className="text-[#2648E7] shrink-0" />}
                  </button>
                ))
              )}
            </div>
            <div className="p-2 border-t border-border">
              <button 
                onClick={() => { setShowSwitcher(false); navigate('/projects?create=true'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Plus size={16} /> Create New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => navigate('/notifications')} className="relative size-10 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
          <Bell size={18} className="text-white" />
          <span className="absolute top-2 right-2.5 size-2 rounded-full bg-red-500 border border-[#2648E7]" />
        </button>
        <button onClick={() => navigate('/profile')} className="size-10 rounded-full flex items-center justify-center text-[#2648E7] font-bold text-sm shrink-0 shadow-md bg-white hover:bg-gray-50 transition-colors ring-2 ring-white/20">
          {initials}
        </button>
      </div>
    </header>
  );
}

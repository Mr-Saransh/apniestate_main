import { MapPin, Bell, Menu } from 'lucide-react';
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
  const { activeProject } = useProject();
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'AR';

  return (
    <header className="shrink-0 h-14 flex items-center px-4 gap-3 z-30 relative shadow-md" style={{ backgroundColor: "#2648E7", color: "white" }}>
      <button
        onClick={onOpenSidebar}
        className="lg:hidden size-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center shrink-0"
      >
        <Menu size={18} className="text-white" />
      </button>

      {/* Project name */}
      <div className="flex-1 min-w-0">
        {activeProject ? (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate" style={{ fontFamily: "var(--font-display)" }}>
                {activeProject.name}
              </p>
              <StatusBadge status={activeProject.status} />
            </div>
            {(activeProject.city || activeProject.address) && (
              <p className="text-xs text-white/70 flex items-center gap-1 leading-none mt-0.5">
                <MapPin size={9} />{activeProject.city || activeProject.address}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>
            Apni Estate
          </p>
        )}
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => navigate('/notifications')} className="relative size-9 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
          <Bell size={16} className="text-white" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 border border-[#2648E7]" />
        </button>
        <button onClick={() => navigate('/profile')} className="size-9 rounded-full flex items-center justify-center text-[#2648E7] font-bold text-xs shrink-0 shadow-sm bg-white hover:bg-gray-50 transition-colors">
          {initials}
        </button>
      </div>
    </header>
  );
}

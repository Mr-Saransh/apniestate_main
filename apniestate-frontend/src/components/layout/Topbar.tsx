import { MapPin, Bell, Menu } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PLANNING: { label: "Planning", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
    ACTIVE: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    ON_HOLD: { label: "On Hold", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    COMPLETED: { label: "Done", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
    CANCELLED: { label: "Cancelled", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };
  const s = map[status] || { label: status, bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };
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
    <header className="shrink-0 h-14 flex items-center px-4 gap-3 bg-white border-b border-border z-20 relative">
      <button
        onClick={onOpenSidebar}
        className="lg:hidden size-9 rounded-xl bg-muted flex items-center justify-center shrink-0"
      >
        <Menu size={18} className="text-foreground" />
      </button>

      {/* Project name */}
      <div className="flex-1 min-w-0">
        {activeProject ? (
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground truncate" style={{ fontFamily: "var(--font-display)" }}>
                {activeProject.name}
              </p>
              <StatusBadge status={activeProject.status} />
            </div>
            {(activeProject.city || activeProject.address) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 leading-none mt-0.5">
                <MapPin size={9} />{activeProject.city || activeProject.address}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Apni Estate
          </p>
        )}
      </div>

      {/* Right icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={() => navigate('/notifications')} className="relative size-9 rounded-xl bg-muted flex items-center justify-center">
          <Bell size={16} className="text-foreground" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-red-500 border border-white" />
        </button>
        <button onClick={() => navigate('/profile')} className="size-9 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: "#2648E7" }}>
          {initials}
        </button>
      </div>
    </header>
  );
}

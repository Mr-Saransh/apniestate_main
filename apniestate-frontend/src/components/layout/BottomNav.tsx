import { Home, ShoppingCart, Wallet, Users, BarChart2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const BOTTOM_NAV = [
  { id: "dashboard", path: "/dashboard", Icon: Home, label: "Home" },
  { id: "purchase", path: "/purchase", Icon: ShoppingCart, label: "Purchase" },
  { id: "finance", path: "/finance", Icon: Wallet, label: "Finance" },
  { id: "operations", path: "/operations", Icon: Users, label: "Labour" },
  { id: "progress", path: "/progress", Icon: BarChart2, label: "Progress" },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="lg:hidden shrink-0 flex items-center bg-white border-t border-border pb-safe">
      {BOTTOM_NAV.map(({ id, path, Icon, label }) => {
        const isActive = location.pathname.startsWith(path) || (id === "dashboard" && location.pathname === "/");
        return (
          <button
            key={id}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 active:scale-90 transition-transform"
          >
            <div className={`size-8 rounded-xl flex items-center justify-center ${isActive ? "bg-[#2648E7]/10" : ""}`}>
              <Icon size={19} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? "#2648E7" : "#9ca3af"} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: isActive ? "#2648E7" : "#9ca3af" }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

import React from 'react';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

export type ChipColor = "blue" | "green" | "yellow" | "red" | "gray";

export function Chip({ children, color = "gray" }: { children: React.ReactNode; color?: ChipColor }) {
  const cls: Record<ChipColor, string> = {
    blue: "bg-blue-100 text-blue-700", green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700", red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${cls[color]}`}>
      {children}
    </span>
  );
}

export function KPI({ label, value, icon: Icon, trend }: {
  label: string; value: string; icon: React.ElementType;
  trend?: { up: boolean; v: string };
}) {
  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
            {trend.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trend.v}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export function Card({ title, right, children, noPad, className, onClick }: {
  title?: string; right?: React.ReactNode; children: React.ReactNode; noPad?: boolean; className?: string; onClick?: () => void;
}) {
  return (
    <div onClick={onClick} className={`bg-card rounded-xl border border-border overflow-hidden shadow-sm ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}>
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {right}
        </div>
      )}
      <div className={noPad ? "" : "p-4"}>{children}</div>
    </div>
  );
}

export function SrchBar({ placeholder, onChange }: { placeholder?: string, onChange?: (e: any) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <input
        onChange={onChange}
        className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder={placeholder || "Search..."}
      />
    </div>
  );
}

export function PH({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <h1 className="text-base font-bold text-foreground">{title}</h1>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export function Badge({ children, variant = "secondary" }: { children: React.ReactNode; variant?: "success" | "warning" | "danger" | "info" | "secondary" }) {
  const v = variant === "success" ? "green" : variant === "warning" ? "yellow" : variant === "danger" ? "red" : variant === "info" ? "blue" : "gray";
  return <Chip color={v as any}>{children}</Chip>;
}

export function Button({ children, onClick, variant = "primary", size = "md", icon }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "secondary" | "danger" | "success"; size?: "sm" | "md"; icon?: React.ReactNode }) {
  const base = "inline-flex items-center justify-center font-medium rounded-lg transition-colors";
  const vs = {
    primary: "bg-primary text-white hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <button onClick={onClick} className={`${base} ${vs[variant]} ${sz} gap-2`}>
      {icon}
      {children}
    </button>
  );
}

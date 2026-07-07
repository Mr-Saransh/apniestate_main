import React, { useState } from 'react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { TrendingUp, Activity, AlertTriangle, FileCheck, FileText, Download, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReportsPage() {
  const navigate = useNavigate();

  const categories = [
    { id: 'financial', icon: TrendingUp, label: "Financial Reports", desc: "P&L, budget variance, cash flow", link: "/reports/financial" },
    { id: 'productivity', icon: Activity, label: "Productivity Reports", desc: "Output, labor efficiency, milestones", link: "/reports/productivity" },
    { id: 'safety', icon: AlertTriangle, label: "Safety Reports", desc: "Incidents, near-misses, compliance", link: "/reports/safety" },
    { id: 'compliance', icon: FileCheck, label: "Compliance Reports", desc: "Labor law, permits, audits", link: "/reports/compliance" },
    { id: 'attendance', icon: FileText, label: "Export Attendance", desc: "Download labor spreadsheets", link: "/export/attendance" },
    { id: 'dpr', icon: FileText, label: "Export DPR", desc: "Generate PDF progress reports", link: "/export/dpr" },
  ];

  const recent = [
    { name: "Financial Summary — June 2026", date: "01 Jul", type: "Financial" },
    { name: "Labor Efficiency — Downtown Plaza", date: "30 Jun", type: "Productivity" },
    { name: "Safety Audit — DHA Phase 8", date: "28 Jun", type: "Safety" },
    { name: "Budget Variance Report — Q2", date: "25 Jun", type: "Financial" },
  ];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <PH title="Reports & Analytics" sub="Executive summaries and deep-dive analysis" />
        <button className="px-3 py-2 bg-secondary text-primary rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-primary/10 transition-colors shadow-sm">
          <Filter className="w-3 h-3" /> Filter
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((c, i) => (
          <button 
            key={i} 
            onClick={() => navigate(c.link)}
            className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/40 active:scale-[0.98] transition-all shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center mb-2">
              <c.icon className="w-4 h-4 text-primary" />
            </div>
            <p className="text-xs font-semibold text-foreground">{c.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{c.desc}</p>
          </button>
        ))}
      </div>

      <Card title="Recent Reports" noPad>
        {recent.map((r, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i < recent.length - 1 ? "border-b border-border" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{r.name}</p>
              <p className="text-[10px] text-muted-foreground">{r.type} · {r.date}</p>
            </div>
            <button className="text-[11px] text-primary font-semibold hover:underline">
              <Download className="w-3 h-3" />
            </button>
          </div>
        ))}
      </Card>
    </div>
  );
}

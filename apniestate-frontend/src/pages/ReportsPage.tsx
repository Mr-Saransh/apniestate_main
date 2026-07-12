import React from 'react';
import { FileBarChart, IndianRupee, Package, Users, FileText, ChevronRight } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</p>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-border ${className}`}>{children}</div>
  );
}

export default function ReportsPage() {
  const { activeProjectId } = useProject();

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileBarChart size={48} className="text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Project Selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Please select a project from the top bar to view reports.</p>
      </div>
    );
  }

  const handleDownload = (type: string) => {
    if (!activeProjectId) return;
    const token = localStorage.getItem('access_token');
    const url = `/api/reports/download?project_id=${activeProjectId}&type=${encodeURIComponent(type)}`;
    
    // Create a temporary link to download via authenticated fetch
    fetch(`http://localhost:3001${url}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error('Download failed');
      const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'report.csv';
      return res.blob().then(blob => ({ blob, filename }));
    })
    .then(({ blob, filename }) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(err => {
      console.error(err);
      alert('Failed to download report.');
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <SectionLabel>Generate Report</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <FileBarChart size={22} className="text-[#2648E7]" />, title: "Monthly Summary", sub: "Labour, material, and finance overview", bg: "bg-[#2648E7]/8" },
            { icon: <IndianRupee size={22} className="text-emerald-600" />, title: "Finance Report", sub: "Income, expenses, pending payments", bg: "bg-emerald-50" },
            { icon: <Package size={22} className="text-amber-600" />, title: "Material Report", sub: "Purchases, inventory, wastage", bg: "bg-amber-50" },
            { icon: <Users size={22} className="text-purple-600" />, title: "Labour Report", sub: "Attendance, wages, category breakdown", bg: "bg-purple-50" },
            { icon: <FileBarChart size={22} className="text-indigo-600" />, title: "Milestone Progress Report", sub: "Timeline & DPR based progress", bg: "bg-indigo-50" },
          ].map((r) => (
            <Card key={r.title} className="p-4 flex items-center gap-4">
              <div className={`size-12 rounded-2xl ${r.bg} flex items-center justify-center shrink-0`}>{r.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{r.sub}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button onClick={() => alert("PDF generation coming soon")} className="text-xs font-bold text-white px-3 py-1.5 rounded-lg" style={{ backgroundColor: "#2648E7" }}>PDF</button>
                <button onClick={() => handleDownload(r.title)} className="text-xs font-bold text-foreground px-3 py-1.5 rounded-lg bg-muted hover:bg-slate-200 transition-colors">Excel</button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Recent Reports</SectionLabel>
        <div className="space-y-2">
          {[
            { name: "October 2025 — Monthly Summary", date: "1 Nov 2025", size: "2.1 MB" },
            { name: "September 2025 — Finance Report", date: "3 Oct 2025", size: "1.4 MB" },
            { name: "Q3 2025 — Project Summary", date: "5 Oct 2025", size: "4.8 MB" },
          ].map((r) => (
            <Card key={r.name} className="px-4 py-3.5 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <FileText size={15} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.date} · {r.size}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { Download } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { apiClient } from '@/api/client';

export default function ExportAttendancePage() {
  const { activeProject } = useProject();
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  
  useEffect(() => {
    if (activeProject) {
      apiClient.get(`/sites?project_id=${activeProject.id}`).then(res => setSites(Array.isArray(res.data) ? res.data : []));
    }
  }, [activeProject]);

  const handleDownload = () => {
    let url = `/api/reports/labour-csv?start_date=${startDate}&end_date=${endDate}`;
    if (activeProject) url += `&project_id=${activeProject.id}`;
    if (selectedSite !== 'all') url += `&site_id=${selectedSite}`;
    
    const token = localStorage.getItem('access_token');
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    
    fetch(`${baseUrl}${url}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.blob())
    .then(blob => {
        const _url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = _url;
        link.setAttribute('download', 'labour_attendance_report.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }).catch(console.error);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Export Attendance" sub="Download labor spreadsheets for corporate audit" />
      
      <Card title="Export Configuration">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Date From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Date To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Site Filter</label>
            <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="all">All Sites in Project</option>
              {sites.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Export Format</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                <input type="radio" name="att-fmt" defaultChecked className="accent-primary w-4 h-4" />
                <span className="text-xs font-medium">CSV (.csv)</span>
              </label>
            </div>
          </div>
        </div>
      </Card>
      
      <button onClick={handleDownload} className="w-full py-3.5 bg-amber-400 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-95 transition-all">
        <Download className="w-4 h-4" /> Download Attendance Report
      </button>
    </div>
  );
}

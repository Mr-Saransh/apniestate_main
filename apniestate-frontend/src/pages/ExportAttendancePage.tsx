'use client';
import React, { useState, useEffect } from 'react';
import { PH, Card } from '@/components/shared/FigmaComponents';
import { Download } from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import { apiClient } from '@/api/client';
import DateRangeFilter from '@/components/shared/DateRangeFilter';
import { getDatePresetRange } from '@/utils/dateFilter';

export default function ExportAttendancePage() {
  const { activeProject } = useProject();
  const initialMonth = getDatePresetRange('this_month');
  const [startDate, setStartDate] = useState(initialMonth.from);
  const [endDate, setEndDate] = useState(initialMonth.to);
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
        link.setAttribute('download', `labour_attendance_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }).catch(console.error);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      <PH title="Export Attendance" sub="Download labor spreadsheets for corporate audit" />
      
      <Card title="Export Configuration">
        <div className="space-y-4">
          <DateRangeFilter
            fromDate={startDate}
            toDate={endDate}
            onChange={(from, to) => {
              setStartDate(from);
              setEndDate(to);
            }}
            label="Attendance Date Range"
            allowedPresets={['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'last_30_days', 'custom']}
          />
          
          <div>
            <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Site Filter</label>
            <select value={selectedSite} onChange={e => setSelectedSite(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
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
      
      <button onClick={handleDownload} className="w-full py-3.5 bg-amber-400 text-black rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-95 transition-all cursor-pointer">
        <Download className="w-4 h-4" /> Download Attendance Report ({startDate} to {endDate})
      </button>
    </div>
  );
}

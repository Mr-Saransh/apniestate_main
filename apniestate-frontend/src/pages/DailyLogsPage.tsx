import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { Plus } from 'lucide-react';
import { PH, SrchBar, Card, Chip } from '@/components/shared/FigmaComponents';

interface DailyLog {
  id: string;
  site: { name: string };
  report_date: string;
  weather?: string;
  workers_count?: number;
  summary: string;
  submitter?: { name: string };
  issues_faced?: any;
  status?: string;
}

export default function DailyLogsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get<any>('/dpr').then(res => {
      if (res.success && res.data) {
        setLogs(Array.isArray(res.data) ? res.data : res.data.data || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l =>
    l.site?.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.submitter?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  const getIssueCount = (issues: any) => {
    if (!issues) return 0;
    if (Array.isArray(issues)) return issues.length;
    try { const parsed = JSON.parse(issues); return Array.isArray(parsed) ? parsed.length : 0; }
    catch { return 0; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Daily Logs" sub="Field notes, weather impact & site bottlenecks" />
      <div className="flex gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search logs..." />
        </div>
        <button 
          onClick={() => navigate('/dpr')}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> New Log
        </button>
      </div>
      
      <Card noPad>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No daily logs found</div>
        ) : (
          filtered.map((log, i) => {
            const issuesCount = getIssueCount(log.issues_faced);
            const status = log.status || (issuesCount > 0 ? "Pending" : "Reviewed");
            
            return (
              <div key={log.id || i} className={`px-4 py-3 ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">{log.site?.name || "Unknown Site"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {log.submitter?.name || "Unknown"} · {formatDate(log.report_date)} {log.weather ? `· ${log.weather}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <Chip color={status === "Pending" ? "yellow" : "green"}>{status}</Chip>
                    {issuesCount > 0 && (
                      <span className="text-[10px] text-red-500 font-medium">
                        {issuesCount} issue{issuesCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

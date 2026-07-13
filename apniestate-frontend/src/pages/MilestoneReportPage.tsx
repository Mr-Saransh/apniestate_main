import React, { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { FileBarChart, Calendar as CalendarIcon, Download, ChevronRight } from 'lucide-react';
import { apiClient } from '@/api/client';
import { milestonesApi, type Milestone } from '@/api/milestones';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function MilestoneReportPage() {
  const { activeProjectId } = useProject();
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dprs, setDprs] = useState<any[]>([]);

  // Default dates to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const generateReport = async () => {
    if (!activeProjectId || !fromDate || !toDate) return;
    setLoading(true);
    try {
      const [mRes, dRes] = await Promise.all([
        milestonesApi.getAll(activeProjectId),
        apiClient.get(`/dpr?project_id=${activeProjectId}`)
      ]);
      
      setMilestones(mRes.data || []);
      setDprs((dRes.data as any[]) || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProjectId && fromDate && toDate) {
      generateReport();
    }
  }, [activeProjectId]);

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FileBarChart size={48} className="text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Project Selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Please select a project to view the milestone progress report.</p>
      </div>
    );
  }

  // Logic: Filter DPRs within the date range
  const from = new Date(fromDate);
  from.setHours(0,0,0,0);
  const to = new Date(toDate);
  to.setHours(23,59,59,999);

  const filteredDprs = dprs.filter(d => {
    const dDate = new Date(d.report_date);
    return dDate >= from && dDate <= to;
  });

  // Calculate metrics
  const totalDprs = filteredDprs.length;
  const milestonesWorkedOn = [...new Set(filteredDprs.filter(d => d.milestone_id).map(d => d.milestone_id))];
  const progressAdded = filteredDprs.reduce((acc, d) => acc + (d.completion_percentage || 0), 0);
  
  // Milestones that had progress during this period
  const activeMilestones = milestones.filter(m => milestonesWorkedOn.includes(m.id));

  return (
    <div className="flex flex-col h-full bg-background relative animate-fade-in">
      <div className="bg-white border-b border-border px-4 py-5 sticky top-0 z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily: "var(--font-display)" }}>Milestone Progress Report</h2>
          <p className="text-sm text-muted-foreground">Track exact milestone progression over time based on DPRs.</p>
        </div>
        
        <div className="flex items-center gap-2 self-start md:self-auto bg-muted p-1 rounded-xl">
          <input 
            type="date" 
            value={fromDate} 
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-white border border-transparent rounded-lg px-3 py-1.5 text-sm outline-none shadow-sm font-medium"
          />
          <span className="text-muted-foreground text-sm font-medium">to</span>
          <input 
            type="date" 
            value={toDate} 
            onChange={(e) => setToDate(e.target.value)}
            className="bg-white border border-transparent rounded-lg px-3 py-1.5 text-sm outline-none shadow-sm font-medium"
          />
          <button 
            onClick={generateReport}
            className="bg-[#2648E7] text-white p-2 rounded-lg ml-1 hover:bg-[#1a35b3] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {loading ? (
            <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total DPRs</span>
                  <span className="text-3xl font-bold text-[#2648E7]">{totalDprs}</span>
                  <span className="text-xs text-muted-foreground mt-1">Submitted in this period</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Milestones Active</span>
                  <span className="text-3xl font-bold text-amber-600">{milestonesWorkedOn.length}</span>
                  <span className="text-xs text-muted-foreground mt-1">Worked on in this period</span>
                </div>
                <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Progress Gained</span>
                  <span className="text-3xl font-bold text-emerald-600">+{progressAdded}%</span>
                  <span className="text-xs text-muted-foreground mt-1">Total milestone completion added</span>
                </div>
              </div>

              {/* Milestones Breakdown */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-base">Milestones Worked On</h3>
                  <button className="text-xs font-bold bg-white border border-border px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-foreground hover:bg-muted">
                    <Download size={14} /> Export
                  </button>
                </div>
                
                <div className="p-0">
                  {activeMilestones.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No milestones were worked on during this period.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {activeMilestones.map(m => {
                        const mDprs = filteredDprs.filter(d => d.milestone_id === m.id);
                        const addedHere = mDprs.reduce((acc, d) => acc + (d.completion_percentage || 0), 0);
                        return (
                          <div key={m.id} className="p-5">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-foreground text-base">{m.name}</h4>
                                <p className="text-xs font-medium text-muted-foreground mt-0.5">
                                  Current Overall Progress: <span className="text-foreground">{m.progress_percentage}%</span> · 
                                  Status: <span className={m.status === 'COMPLETED' ? 'text-emerald-600' : 'text-[#2648E7]'}>{m.status}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-emerald-600">+{addedHere}%</span>
                                <p className="text-xs text-muted-foreground">added in period</p>
                              </div>
                            </div>

                            <div className="mt-4 bg-muted/30 rounded-xl p-3 border border-border space-y-2">
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">DPR Logs ({mDprs.length})</p>
                              {mDprs.map(d => (
                                <div key={d.id} className="flex gap-3 text-sm">
                                  <div className="w-20 shrink-0 font-medium text-muted-foreground">
                                    {new Date(d.report_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                  </div>
                                  <div className="flex-1 text-foreground">
                                    {d.summary}
                                  </div>
                                  <div className="w-12 text-right font-bold text-emerald-600">
                                    +{d.completion_percentage}%
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

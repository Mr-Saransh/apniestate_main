import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import {
  BarChart2,
  Plus,
  CheckCircle2,
  Calendar as CalendarIcon,
  UploadCloud,
  X,
  ArrowRight,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Flag,
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { milestonesApi, type Milestone } from '@/api/milestones';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</p>;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl shadow-sm border border-border ${className}`}>{children}</div>;
}

export default function ProgressWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProject();
  const view = searchParams.get('tab') || 'timeline';

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dprs, setDprs] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [showDprModal, setShowDprModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calendar View Date & Month navigation
  const [viewDate, setViewDate] = useState(new Date());
  const monthScrollRef = useRef<HTMLDivElement>(null);

  // Add Milestone Form
  const [mName, setMName] = useState('');
  const [mTargetDate, setMTargetDate] = useState('');
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);

  // Submit DPR Form
  const [dprSiteId, setDprSiteId] = useState('');
  const [dprSummary, setDprSummary] = useState('');
  const [dprPercentage, setDprPercentage] = useState(0);
  const [dprPhotoUrl, setDprPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = async () => {
    if (!activeProjectId) return;
    try {
      setLoading(true);
      const [milestonesRes, dprsRes, sitesRes] = await Promise.all([
        milestonesApi.getAll(activeProjectId),
        apiClient.get<any>(`/dpr?project_id=${activeProjectId}`),
        apiClient.get<any>(`/sites?project_id=${activeProjectId}`)
      ]);

      if (milestonesRes.success && milestonesRes.data) {
        setMilestones(milestonesRes.data);
      }
      if (dprsRes.success) setDprs(Array.isArray(dprsRes.data) ? dprsRes.data : []);
      if (sitesRes.success) {
        const sitesData = Array.isArray(sitesRes.data) ? sitesRes.data : [];
        setSites(sitesData);
        if (sitesData.length > 0 && !dprSiteId) {
          setDprSiteId(sitesData[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeProjectId]);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId || !mName || !mTargetDate) return;
    try {
      setIsCreatingMilestone(true);
      await milestonesApi.create({
        project_id: activeProjectId,
        name: mName,
        target_date: mTargetDate
      });
      setShowAddMilestone(false);
      setMName('');
      setMTargetDate('');
      fetchData();
    } catch (err) {
      alert("Failed to create milestone");
    } finally {
      setIsCreatingMilestone(false);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;
    try {
      await milestonesApi.delete(id);
      fetchData();
    } catch (err) {
      alert("Failed to delete milestone");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append("file", file);
      
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${baseUrl}/cloudinary/upload`, {
        method: "POST",
        headers: token ? { "Authorization": `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (data.success && data.result?.secure_url) {
        setDprPhotoUrl(data.result.secure_url);
      }
    } catch (err) {
      alert("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitDpr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dprSiteId || !dprSummary) return;

    try {
      const payload: any = {
        project_id: activeProjectId,
        site_id: dprSiteId,
        report_date: new Date().toISOString(),
        summary: dprSummary,
        completion_percentage: dprPercentage,
        milestone_id: selectedMilestone ? selectedMilestone.id : undefined,
      };

      if (dprPhotoUrl) {
        payload.photos = [dprPhotoUrl];
      }
      
      await apiClient.post('/dpr', payload);
      setShowDprModal(false);
      setDprSummary('');
      setDprPercentage(0);
      setDprPhotoUrl('');
      fetchData();
    } catch (err) {
      alert("Failed to submit DPR");
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Calendar logic for horizontally scrollable multi-month view
  const today = new Date();
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(viewYear, viewMonth, i));

  // Generate 16 months for horizontal scroll selector (-2 past months to +13 future months)
  const monthsList = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = -2; i <= 13; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mCount = milestones.filter(m => {
        const md = new Date(m.target_date);
        return md.getFullYear() === d.getFullYear() && md.getMonth() === d.getMonth();
      }).length;
      list.push({
        date: d,
        label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
        fullLabel: d.toLocaleString('default', { month: 'long', year: 'numeric' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        milestoneCount: mCount,
        isCurrent: d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(),
        isSelected: d.getFullYear() === viewYear && d.getMonth() === viewMonth,
      });
    }
    return list;
  }, [milestones, viewYear, viewMonth]);

  const goToPrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const goToMonth = (d: Date) => {
    setViewDate(d);
  };

  const goToToday = () => {
    const now = new Date();
    setViewDate(now);
    setSelectedDate(now);
  };

  // DPRs for selected date
  const dprsForSelectedDate = selectedDate ? dprs.filter(d => {
    const dDate = new Date(d.report_date);
    return dDate.getFullYear() === selectedDate.getFullYear() && 
           dDate.getMonth() === selectedDate.getMonth() && 
           dDate.getDate() === selectedDate.getDate();
  }) : [];

  // Milestones for selected date
  const milestonesForSelectedDate = selectedDate ? milestones.filter(m => {
    const md = new Date(m.target_date);
    return md.getFullYear() === selectedDate.getFullYear() && 
           md.getMonth() === selectedDate.getMonth() && 
           md.getDate() === selectedDate.getDate();
  }) : [];

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <BarChart2 size={48} className="text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Project Selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Please select a project from the top bar to view progress.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="bg-white border-b border-border px-4 pt-4 pb-0 shrink-0 sticky top-0 z-10">
        <h2 className="text-base font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>Progress Tracking</h2>
        <div className="flex gap-0">
          {[{ id: "timeline", label: "Timeline & Milestones" }, { id: "calendar", label: "Calendar & Schedule" }].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSearchParams({ tab: id }, { replace: true })}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                view === id ? "border-[#2648E7] text-[#2648E7]" : "border-transparent text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading progress data...</div>
          ) : view === "timeline" ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <SectionLabel>Milestones</SectionLabel>
                <button 
                  onClick={() => { setMTargetDate(''); setShowAddMilestone(true); }}
                  className="text-xs font-bold bg-[#2648E7]/10 text-[#2648E7] px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Plus size={14} /> Add Milestone
                </button>
              </div>
              
              <div className="space-y-0">
                {milestones.length === 0 ? (
                  <div className="text-center p-6 bg-white rounded-xl border border-border text-sm text-muted-foreground">
                    No milestones defined yet.
                  </div>
                ) : milestones.map((m, i) => (
                  <div key={m.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`size-5 rounded-full border-2 mt-1 shrink-0 ${
                        m.status === 'COMPLETED' ? "bg-emerald-500 border-emerald-500" :
                        m.status === 'IN_PROGRESS' ? "bg-white border-[#2648E7]" :
                        "bg-white border-gray-200"
                      }`} />
                      {i < milestones.length - 1 && (
                        <div className={`w-0.5 flex-1 my-1 ${m.status === 'COMPLETED' ? "bg-emerald-500" : "bg-gray-100"}`} style={{ minHeight: 40 }} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className={`rounded-xl px-4 py-3 border ${
                        m.status === 'IN_PROGRESS' ? "bg-[#2648E7]/5 border-[#2648E7]/20" :
                        m.status === 'COMPLETED' ? "bg-white border-border opacity-60" :
                        "bg-white border-border"
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className={`font-semibold text-sm ${m.status === 'IN_PROGRESS' ? "text-[#2648E7]" : "text-foreground"}`}>{m.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                              {new Date(m.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            {m.status === 'COMPLETED' && <CheckCircle2 size={16} className="text-emerald-500" />}
                            <button onClick={() => handleDeleteMilestone(m.id)} className="p-1 hover:bg-muted text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${m.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-[#2648E7]'}`} style={{ width: `${m.progress_percentage || 0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground">{m.progress_percentage || 0}%</span>
                        </div>

                        {m.status !== 'COMPLETED' && (
                          <div className="mt-3 pt-3 border-t border-border border-dashed flex justify-end">
                            <button 
                              onClick={() => { setSelectedMilestone(m); setShowDprModal(true); }}
                              className="text-xs font-bold text-white bg-[#2648E7] px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#1a35b3]"
                            >
                              <Plus size={14} /> Submit DPR
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Horizontally Scrollable Month Strip */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <SectionLabel>Select Month & Target Timeline</SectionLabel>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToToday}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
                    >
                      Today
                    </button>
                    <button
                      onClick={goToNextMonth}
                      className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#2648E7]/10 hover:bg-[#2648E7]/20 text-[#2648E7] transition-colors flex items-center gap-1"
                    >
                      Next Month <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Horizontal Scroll Month Bar */}
                <div 
                  ref={monthScrollRef}
                  className="flex gap-2 overflow-x-auto pb-2 scroll-smooth no-scrollbar"
                  style={{ scrollSnapType: 'x mandatory' }}
                >
                  {monthsList.map((mItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToMonth(mItem.date)}
                      style={{ scrollSnapAlign: 'start' }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 border ${
                        mItem.isSelected
                          ? "bg-[#2648E7] text-white border-[#2648E7] shadow-md shadow-[#2648E7]/30"
                          : mItem.isCurrent
                          ? "bg-white text-[#2648E7] border-[#2648E7]/40 hover:bg-[#2648E7]/5"
                          : "bg-white text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span>{mItem.label}</span>
                      {mItem.milestoneCount > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                          mItem.isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                        }`}>
                          {mItem.milestoneCount} 🏁
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Month Calendar Card */}
              <Card className="p-5">
                {/* Month Navigator Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <button
                    onClick={goToPrevMonth}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Previous Month"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="text-center">
                    <h3 className="text-base font-extrabold text-foreground">
                      {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {milestones.filter(m => {
                        const md = new Date(m.target_date);
                        return md.getFullYear() === viewYear && md.getMonth() === viewMonth;
                      }).length} milestone(s) scheduled this month
                    </p>
                  </div>

                  <button
                    onClick={goToNextMonth}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Next Month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <p key={d} className="text-[11px] font-bold text-muted-foreground text-center py-1">{d}</p>
                  ))}
                </div>

                {/* Day Cells Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
                    
                    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
                    const isSelected = selectedDate && date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth() && date.getFullYear() === selectedDate.getFullYear();
                    
                    // Check if milestone target is this date
                    const hasMilestone = milestones.some(m => {
                      const md = new Date(m.target_date);
                      return md.getDate() === date.getDate() && md.getMonth() === date.getMonth() && md.getFullYear() === date.getFullYear();
                    });
                    
                    // Check if DPR exists
                    const hasLog = dprs.some(d => {
                      const dd = new Date(d.report_date);
                      return dd.getDate() === date.getDate() && dd.getMonth() === date.getMonth() && dd.getFullYear() === date.getFullYear();
                    });

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDateClick(date)}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold relative gap-0.5 transition-all ${
                          isSelected ? "ring-2 ring-[#2648E7] ring-offset-2 scale-105 z-10 font-bold" : ""
                        } ${
                          isToday ? "bg-[#2648E7] text-white shadow-md shadow-[#2648E7]/20" :
                          hasMilestone ? "bg-amber-50 text-amber-800 border border-amber-200" :
                          hasLog ? "bg-indigo-50 text-indigo-800 border border-indigo-200" :
                          "text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <span>{date.getDate()}</span>
                        <div className="flex gap-0.5">
                          {hasLog && !isToday && <span className="size-1.5 rounded-full bg-indigo-500" />}
                          {hasMilestone && !isToday && <span className="size-1.5 rounded-full bg-amber-500" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-5 mt-5 pt-4 border-t border-border justify-center flex-wrap">
                  <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-indigo-500" /><p className="text-xs text-muted-foreground font-medium">DPR Logged</p></div>
                  <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-500" /><p className="text-xs text-muted-foreground font-medium">Milestone Target</p></div>
                  <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#2648E7]" /><p className="text-xs text-muted-foreground font-medium">Today</p></div>
                </div>
              </Card>

              {/* Selected Date Activity & Add Milestone Action */}
              {selectedDate && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionLabel>
                      Schedule on {selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </SectionLabel>
                    <button
                      onClick={() => {
                        const offsetDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
                        setMTargetDate(offsetDate.toISOString().split('T')[0]);
                        setShowAddMilestone(true);
                      }}
                      className="text-xs font-bold px-3 py-1.5 bg-[#2648E7] hover:bg-[#1a35b3] text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <Plus size={13} /> Set Milestone for this Date
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Milestones on Selected Date */}
                    {milestonesForSelectedDate.length > 0 ? (
                      <div className="space-y-3">
                        {milestonesForSelectedDate.map(m => (
                          <div key={m.id} className={`rounded-xl px-4 py-3 border ${m.status === 'COMPLETED' ? "bg-emerald-50/50 border-emerald-100" : "bg-amber-50/50 border-amber-100"}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`size-2 rounded-full ${m.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <p className="font-semibold text-sm text-foreground">{m.name}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground bg-white px-2 py-1 rounded-md border border-border shadow-sm">Milestone</span>
                                <button onClick={() => handleDeleteMilestone(m.id)} className="p-1 hover:bg-red-50 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-3 pl-4">
                              <div className="flex-1 bg-black/5 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full ${m.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${m.progress_percentage || 0}%` }} />
                              </div>
                              <span className="text-xs font-bold text-muted-foreground">{m.progress_percentage || 0}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          const offsetDate = new Date(selectedDate.getTime() - (selectedDate.getTimezoneOffset() * 60000));
                          setMTargetDate(offsetDate.toISOString().split('T')[0]);
                          setShowAddMilestone(true);
                        }}
                        className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors group bg-white"
                      >
                        <div className="bg-primary/10 p-2.5 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                          <Plus size={18} className="text-[#2648E7]" />
                        </div>
                        <span className="text-sm font-semibold">No milestone set for this date. Click to schedule!</span>
                      </button>
                    )}

                    {/* DPRs Section */}
                    {dprsForSelectedDate.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <p className="text-xs font-bold uppercase text-muted-foreground">Daily Logs on this Date</p>
                        {dprsForSelectedDate.map(dpr => (
                          <div key={dpr.id} className="border border-border rounded-xl p-4 bg-white shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 uppercase tracking-wider">DPR Log</span>
                              <span className="text-xs font-medium text-muted-foreground">{dpr.site?.name}</span>
                            </div>
                            <p className="text-sm font-medium text-foreground mb-3">{dpr.summary}</p>
                            
                            {dpr.milestone_id && (
                              <div className="bg-muted p-2 rounded-lg mb-3">
                                <p className="text-xs font-medium text-foreground">Updated milestone by <span className="font-bold text-emerald-600">{dpr.completion_percentage}%</span></p>
                              </div>
                            )}

                            {dpr.photos?.length > 0 && (
                              <div className="mt-3">
                                <img src={dpr.photos[0]} alt="Progress" className="w-full h-40 object-cover rounded-lg border border-border" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-lg">Add Milestone</h3>
              <button onClick={() => setShowAddMilestone(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMilestone} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Milestone Name</label>
                <input required value={mName} onChange={e => setMName(e.target.value)} className="w-full bg-muted border border-transparent rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2648E7] focus:bg-white" placeholder="e.g. Ground Floor Slab" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Target Date</label>
                <input required type="date" value={mTargetDate} onChange={e => setMTargetDate(e.target.value)} className="w-full bg-muted border border-transparent rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2648E7] focus:bg-white" />
              </div>
              <div className="pt-2 flex justify-end">
                <button disabled={isCreatingMilestone} type="submit" className="bg-[#2648E7] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#1a35b3] disabled:opacity-50 flex items-center gap-2">
                  {isCreatingMilestone ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submit DPR Modal */}
      {showDprModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h3 className="font-bold text-lg">Submit DPR</h3>
              <button onClick={() => setShowDprModal(false)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmitDpr} className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {selectedMilestone && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4">
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-wider mb-1">Applying to Milestone</p>
                  <p className="font-semibold text-indigo-900">{selectedMilestone.name}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold mb-1.5">Select Site</label>
                <select required value={dprSiteId} onChange={e => setDprSiteId(e.target.value)} className="w-full bg-muted border border-transparent rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2648E7] focus:bg-white">
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1.5">Summary of Work</label>
                <textarea required rows={3} value={dprSummary} onChange={e => setDprSummary(e.target.value)} className="w-full bg-muted border border-transparent rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#2648E7] focus:bg-white" placeholder="Describe the work done today..." />
              </div>
              
              {selectedMilestone && (
                <div>
                  <label className="block text-sm font-semibold mb-1.5 flex justify-between">
                    <span>% Completed Today</span>
                    <span className="text-[#2648E7]">{dprPercentage}%</span>
                  </label>
                  <input type="range" min="0" max="100" value={dprPercentage} onChange={e => setDprPercentage(Number(e.target.value))} className="w-full accent-[#2648E7]" />
                  <p className="text-xs text-muted-foreground mt-1">How much of the milestone was finished today?</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-1.5">Photo Evidence</label>
                {dprPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden aspect-video border border-border">
                    <img src={dprPhotoUrl} alt="DPR" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setDprPhotoUrl('')} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full hover:bg-black/70">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                    <div className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 bg-muted/50 text-muted-foreground">
                      {isUploading ? (
                        <div className="animate-pulse flex flex-col items-center gap-2"><UploadCloud size={24} /><span>Uploading...</span></div>
                      ) : (
                        <><UploadCloud size={24} /><span className="text-sm font-medium">Tap to upload photo</span></>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
            <div className="p-4 border-t border-border shrink-0 flex justify-end">
              <button onClick={handleSubmitDpr} className="bg-[#2648E7] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#1a35b3] w-full flex justify-center items-center gap-2">
                <CheckCircle2 size={16} /> Submit Progress Report
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}

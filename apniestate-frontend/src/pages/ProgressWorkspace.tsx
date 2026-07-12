import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { BarChart2, Plus, CheckCircle2 } from 'lucide-react';

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

const MILESTONES = [
  { label: "Foundation complete", date: "15 Aug", done: true },
  { label: "Plinth beam", date: "1 Sep", done: true },
  { label: "Ground floor slab", date: "15 Oct", done: true },
  { label: "1st floor column", date: "10 Nov", done: false, current: true },
  { label: "1st floor slab", date: "5 Dec", done: false },
  { label: "2nd floor structure", date: "20 Jan", done: false },
  { label: "Roof slab", date: "28 Feb", done: false },
  { label: "Finishing & handover", date: "1 May", done: false },
];

export default function ProgressWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProject();
  const view = searchParams.get('tab') || 'timeline';

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
        <h2 className="text-base font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>Progress</h2>
        <div className="flex gap-0">
          {[{ id: "timeline", label: "Timeline & Milestones" }, { id: "calendar", label: "Calendar" }].map(({ id, label }) => (
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
          {view === "timeline" ? (
            <>
              <div>
                <SectionLabel>Milestones</SectionLabel>
                <div className="space-y-0">
                  {MILESTONES.map((m, i) => (
                    <div key={m.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`size-5 rounded-full border-2 mt-1 shrink-0 ${
                          m.done ? "bg-[#2648E7] border-[#2648E7]" :
                          m.current ? "bg-white border-[#2648E7]" :
                          "bg-white border-gray-200"
                        }`} />
                        {i < MILESTONES.length - 1 && (
                          <div className={`w-0.5 flex-1 my-1 ${m.done ? "bg-[#2648E7]" : "bg-gray-100"}`} style={{ minHeight: 28 }} />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className={`rounded-xl px-4 py-3 border ${
                          m.current ? "bg-[#2648E7]/5 border-[#2648E7]/20" :
                          m.done ? "bg-white border-border opacity-50" :
                          "bg-white border-border opacity-30"
                        }`}>
                          <div className="flex items-center justify-between">
                            <p className={`font-semibold text-sm ${m.current ? "text-[#2648E7]" : "text-foreground"}`}>{m.label}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{m.date}</span>
                              {m.done && <CheckCircle2 size={14} className="text-emerald-500" />}
                              {m.current && <span className="text-[11px] font-bold text-[#2648E7] bg-[#2648E7]/10 px-1.5 py-0.5 rounded-full">Active</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>Daily Progress Log</SectionLabel>
                <div className="space-y-2.5">
                  {[
                    { date: "Today, " + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), note: "Column shuttering on Grid A–B started. 34 workers on site. No safety incidents.", photos: 3 },
                    { date: "Yesterday", note: "Reinforcement bars placed on ground floor columns. Steel inspection passed.", photos: 5 },
                    { date: "2 Days Ago", note: "Foundation curing complete. Plinth beam marks set by structural engineer.", photos: 2 },
                  ].map((d) => (
                    <Card key={d.date} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-[#2648E7]">{d.date}</p>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{d.photos} photos</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{d.note}</p>
                    </Card>
                  ))}
                </div>
                <div className="mt-3 relative w-full">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const token = localStorage.getItem('access_token');
                      const formData = new FormData();
                      formData.append("file", file);
                      try {
                        const res = await fetch("http://localhost:3001/api/cloudinary/upload", {
                          method: "POST",
                          headers: { "Authorization": `Bearer ${token}` },
                          body: formData
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert(`Image uploaded successfully! URL: ${data.result.secure_url}`);
                          // In a real flow, you'd save this URL to a new DailyReport record
                        } else {
                          alert("Upload failed.");
                        }
                      } catch (err) {
                        alert("Error uploading image.");
                      }
                    }}
                  />
                  <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm text-white relative z-0" style={{ backgroundColor: "#2648E7" }}>
                    <Plus size={16} />Add Today's Progress Image
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div>
              <SectionLabel>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</SectionLabel>
              <Card className="p-5">
                <div className="grid grid-cols-7 gap-1 mb-3">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <p key={d} className="text-[11px] font-bold text-muted-foreground text-center">{d}</p>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                    const isToday = d === new Date().getDate();
                    const hasMilestone = d === 10;
                    const hasLog = [22, 23, 24, 25, 26, 27, 28, 29].includes(d);
                    return (
                      <div
                        key={d}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-semibold relative gap-0.5 ${
                          isToday ? "text-white" :
                          hasMilestone ? "bg-[#FCC300]/15 text-amber-800" :
                          hasLog ? "bg-[#2648E7]/8 text-[#2648E7]" :
                          "text-foreground hover:bg-muted"
                        }`}
                        style={isToday ? { backgroundColor: "#2648E7" } : {}}
                      >
                        {d}
                        {hasLog && !isToday && <span className="size-1 rounded-full bg-[#2648E7]" />}
                        {hasMilestone && <span className="size-1 rounded-full bg-amber-500" />}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-5 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-[#2648E7]/50" /><p className="text-xs text-muted-foreground">Progress logged</p></div>
                  <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-amber-400" /><p className="text-xs text-muted-foreground">Milestone</p></div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, type FormEvent } from 'react';
import { Plus, Building2, CheckCircle, Eye, Download, X } from 'lucide-react';
import { dprApi, type DPR } from '@/api/dpr';
import { apiClient } from '@/api/client';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { generateDprPdf } from '@/components/shared/PdfGenerator';

interface Project {
  id: string;
  name: string;
}

interface Site {
  id: string;
  name: string;
  project_id: string;
}

export default function DprPage() {
  const [dprs, setDprs] = useState<DPR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDpr, setSelectedDpr] = useState<DPR | null>(null);

  // Form states
  const [formProjectId, setFormProjectId] = useState('');
  const [formSiteId, setFormSiteId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWorkCompleted, setFormWorkCompleted] = useState('');
  const [formWeather, setFormWeather] = useState('Sunny');
  const [formWorkersPresent, setFormWorkersPresent] = useState('');
  const [formMaterials, setFormMaterials] = useState('');
  const [formIssues, setFormIssues] = useState('');
  const [formTomorrowPlan, setFormTomorrowPlan] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [projectsRes, sitesRes] = await Promise.all([
        apiClient.get<Project[]>('/projects'),
        apiClient.get<Site[]>('/sites')
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (sitesRes.data) setSites(sitesRes.data);

      const dprsRes = await dprApi.getAll({});
      if (dprsRes.data) setDprs(dprsRes.data);

    } catch (err) {
      console.error('Failed to load DPR page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formSiteId || !formWorkCompleted) {
      setFormError('Site and Work Completed details are required.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      await dprApi.create({
        site_id: formSiteId,
        date: formDate,
        work_completed: formWorkCompleted,
        weather: formWeather || null,
        workers_present: formWorkersPresent ? parseInt(formWorkersPresent) : null,
        materials_consumed: formMaterials || null,
        issues_faced: formIssues || null,
        tomorrow_plan: formTomorrowPlan || null
      });

      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit Daily Progress Report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormProjectId('');
    setFormSiteId('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormWorkCompleted('');
    setFormWeather('Sunny');
    setFormWorkersPresent('');
    setFormMaterials('');
    setFormIssues('');
    setFormTomorrowPlan('');
    setFormError('');
  };

  const openDetails = (dpr: DPR) => {
    setSelectedDpr(dpr);
    setShowDetailModal(true);
  };

  const handleDownloadPdf = () => {
    if (!selectedDpr) return;
    const doc = generateDprPdf(selectedDpr, selectedDpr.site?.name || 'Unknown Site');
    doc.save(`DPR_${selectedDpr.site?.name || 'Site'}_${selectedDpr.report_date.split('T')[0]}.pdf`);
  };

  const filteredDprs = dprs.filter(d => 
    d.site?.name.toLowerCase().includes(search.toLowerCase()) || 
    d.work_completed?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSites = sites.filter(s => !formProjectId || s.project_id === formProjectId);

  if (loading && dprs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Daily Progress Reports" sub="End-of-day site summaries with photos" />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search reports..." />
        </div>
        <button 
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> New
        </button>
      </div>

      {filteredDprs.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm bg-card rounded-xl border border-border">No reports found</div>
      ) : (
        filteredDprs.map((r, i) => {
          const dateStr = new Date(r.report_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const activities = r.work_completed ? r.work_completed.split('\n').filter(Boolean).slice(0, 3) : ['No activities recorded'];
          const pmName = r.submitter?.name || "System";
          const issuesCount = r.issues_faced ? (typeof r.issues_faced === 'string' ? JSON.parse(r.issues_faced).length : r.issues_faced.length) : 0;
          
          return (
            <Card key={r.id || i} title={r.site?.name || "Unknown Site"} right={
              <button onClick={() => openDetails(r)} className="px-2 py-1 bg-secondary text-primary rounded text-[10px] font-bold hover:bg-primary/10 transition-colors">
                View
              </button>
            }>
              <div className="space-y-3">
                <div className="h-20 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity" onClick={() => openDetails(r)}>
                  <div className="flex items-center gap-2 text-white/40">
                    <Building2 className="w-7 h-7" />
                    <span className="text-xs">Site Photo — {dateStr}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Key Activities</p>
                  {activities.map((a, j) => (
                    <div key={j} className="flex items-start gap-2 mb-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-foreground line-clamp-1">{a}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border">
                  <span>PM: {pmName}</span>
                  <div className="flex items-center gap-2">
                    {issuesCount > 0 && <span className="text-red-500 font-medium">{issuesCount} issues</span>}
                    <span>{dateStr}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDpr && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">DPR Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4 text-sm">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Site & Date</p>
                <p className="font-semibold mt-1">{selectedDpr.site?.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(selectedDpr.report_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Work Completed</p>
                <div className="mt-1 whitespace-pre-wrap text-sm">{selectedDpr.work_completed}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weather</p>
                  <p className="mt-1">{selectedDpr.weather || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Workers Present</p>
                  <p className="mt-1">{selectedDpr.workers_present || 'Not specified'}</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={() => setShowDetailModal(false)} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Close
              </button>
              <button onClick={handleDownloadPdf} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">New Progress Report</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-4 overflow-y-auto space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project (Optional)</label>
                  <select className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formProjectId} onChange={(e) => { setFormProjectId(e.target.value); setFormSiteId(''); }}>
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Site *</label>
                  <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formSiteId} onChange={(e) => setFormSiteId(e.target.value)}>
                    <option value="">Select a Site</option>
                    {filteredSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date *</label>
                  <input type="date" required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Work Completed *</label>
                  <textarea required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" rows={3} placeholder="What was done today?" value={formWorkCompleted} onChange={(e) => setFormWorkCompleted(e.target.value)} />
                </div>
              </div>
              
              <div className="p-4 border-t border-border flex gap-2 -mx-4 -mb-4 mt-4 bg-muted/30 rounded-b-2xl">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

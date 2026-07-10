import React, { useState, useEffect, type FormEvent } from 'react';
import { Plus, Clock, FileText, CheckCircle, Upload, AlertCircle, Building2, User, ChevronRight, X } from 'lucide-react';
import { dprApi, type DPR } from '@/api/dpr';
import { apiClient } from '@/api/client';
import { PH, Card, Badge, SrchBar, Button } from '@/components/shared/FigmaComponents';
import AttachmentUploader from '@/components/shared/AttachmentUploader';

interface Project { id: string; name: string; }
interface Site { id: string; name: string; project_id: string; }

export default function DprPage() {
  const [dprs, setDprs] = useState<DPR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterSiteId, setFilterSiteId] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDpr, setSelectedDpr] = useState<DPR | null>(null);

  // Form states
  const [formSiteId, setFormSiteId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSummary, setFormSummary] = useState('');
  const [formWeather, setFormWeather] = useState('Sunny');
  const [formTemperature, setFormTemperature] = useState('');
  const [formWorkCompleted, setFormWorkCompleted] = useState('');
  const [formWorkInProgress, setFormWorkInProgress] = useState('');
  const [formTomorrowPlan, setFormTomorrowPlan] = useState('');
  const [formCompletionPercentage, setFormCompletionPercentage] = useState('');
  const [formReasonsForDelay, setFormReasonsForDelay] = useState('');
  const [formSafety, setFormSafety] = useState('');
  const [formQuality, setFormQuality] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [projectsRes, sitesRes, dprsRes] = await Promise.all([
        apiClient.get<Project[]>('/projects'),
        apiClient.get<Site[]>('/sites'),
        dprApi.getAll({ project_id: filterProjectId, site_id: filterSiteId })
      ]);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (sitesRes.data) setSites(sitesRes.data);
      if (dprsRes.data) setDprs(dprsRes.data);
    } catch (err) {
      console.error('Failed to load DPR page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterProjectId, filterSiteId]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formSiteId || !formSummary) {
      setFormError('Site and Summary are required.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      const site = sites.find(s => s.id === formSiteId);
      const res = await dprApi.create({
        project_id: site?.project_id,
        site_id: formSiteId,
        date: formDate,
        summary: formSummary,
        weather: formWeather || null,
        temperature: formTemperature ? parseFloat(formTemperature) : null,
        work_completed: formWorkCompleted || null,
        work_in_progress: formWorkInProgress || null,
        tomorrow_plan: formTomorrowPlan || null,
        completion_percentage: formCompletionPercentage ? parseFloat(formCompletionPercentage) : null,
        reasons_for_delay: formReasonsForDelay || null,
        safety_observations: formSafety || null,
        quality_observations: formQuality || null,
        remarks: formRemarks || null,
        status: "DRAFT"
      });

      if (res.data) {
        setSelectedDpr(res.data);
        setShowCreateModal(false);
        setShowDetailModal(true); // Open detail view to attach photos
        loadData();
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit Daily Progress Report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (dpr: DPR, newStatus: "SUBMITTED" | "APPROVED") => {
    try {
      await dprApi.update(dpr.id, { status: newStatus });
      loadData();
      if (selectedDpr?.id === dpr.id) {
        setSelectedDpr({ ...selectedDpr, status: newStatus });
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const filteredDprs = dprs.filter(d => 
    d.summary?.toLowerCase().includes(search.toLowerCase()) || 
    d.work_completed?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PH title="Daily Progress Reports" sub="Timeline of project execution" />
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>New DPR</Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SrchBar placeholder="Search DPRs..." onChange={(e: any) => setSearch(e.target.value)} />
        </div>
        <select 
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select 
          className="px-3 py-2 border rounded-lg text-sm bg-white"
          value={filterSiteId}
          onChange={(e) => setFilterSiteId(e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.filter(s => !filterProjectId || s.project_id === filterProjectId).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Card>

      {/* Timeline View */}
      <div className="space-y-6">
        {filteredDprs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
            No Daily Progress Reports found.
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-8">
            {filteredDprs.map((dpr) => (
              <div key={dpr.id} className="relative">
                <div className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border-4 border-white ${
                  dpr.status === 'APPROVED' ? 'bg-green-500' : dpr.status === 'SUBMITTED' ? 'bg-blue-500' : 'bg-gray-300'
                }`}>
                  <CheckCircle size={12} className="text-white" />
                </div>
                
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedDpr(dpr); setShowDetailModal(true); }}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{dpr.site?.name} <span className="text-gray-400 font-normal text-sm ml-2">{dpr.site?.project?.name}</span></h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(dpr.report_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><User size={12} /> {dpr.submitter?.name}</span>
                      </div>
                    </div>
                    <Badge variant={dpr.status === 'APPROVED' ? 'success' : dpr.status === 'SUBMITTED' ? 'info' : 'secondary'}>
                      {dpr.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">{dpr.summary}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {dpr.completion_percentage != null && (
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${dpr.completion_percentage}%` }} />
                        </div>
                        <span className="text-xs font-medium">{dpr.completion_percentage}% Complete</span>
                      </div>
                    )}
                    {dpr.weather && (
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-md">Weather: {dpr.weather}</span>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Plus size={18} /> New Daily Report</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={16} /></button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{formError}</div>}
              
              <form id="dpr-form" onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Site *</label>
                    <select required value={formSiteId} onChange={e => setFormSiteId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                      <option value="">Select Site</option>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name} ({projects.find(p=>p.id===s.project_id)?.name})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                    <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Executive Summary *</label>
                  <textarea required value={formSummary} onChange={e => setFormSummary(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} placeholder="Brief summary of today's progress..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Weather</label>
                    <input type="text" value={formWeather} onChange={e => setFormWeather(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g., Sunny, Rainy" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Completion % (Overall)</label>
                    <input type="number" min="0" max="100" value={formCompletionPercentage} onChange={e => setFormCompletionPercentage(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="%" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-semibold text-gray-900">Work Details</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Work Completed</label>
                    <textarea value={formWorkCompleted} onChange={e => setFormWorkCompleted(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Work In Progress</label>
                    <textarea value={formWorkInProgress} onChange={e => setFormWorkInProgress(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pending Work (Tomorrow's Plan)</label>
                    <textarea value={formTomorrowPlan} onChange={e => setFormTomorrowPlan(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reasons for Delay (if any)</label>
                    <textarea value={formReasonsForDelay} onChange={e => setFormReasonsForDelay(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" rows={2} />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" form="dpr-form" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg flex items-center gap-2">
                {submitting ? 'Creating...' : 'Create & Add Photos'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Detail & Media Modal */}
      {showDetailModal && selectedDpr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  DPR: {selectedDpr.site?.name} 
                  <Badge variant={selectedDpr.status === 'APPROVED' ? 'success' : selectedDpr.status === 'SUBMITTED' ? 'info' : 'secondary'}>{selectedDpr.status}</Badge>
                </h2>
                <p className="text-xs text-gray-500 mt-1">{new Date(selectedDpr.report_date).toLocaleDateString()} by {selectedDpr.submitter?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedDpr.status === 'DRAFT' && (
                  <Button onClick={() => handleStatusChange(selectedDpr, 'SUBMITTED')} variant="primary" size="sm">Submit Report</Button>
                )}
                {selectedDpr.status === 'SUBMITTED' && (
                  <Button onClick={() => handleStatusChange(selectedDpr, 'APPROVED')} variant="success" size="sm">Approve</Button>
                )}
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={16} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
              
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Executive Summary</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedDpr.summary}</p>
                </div>
                
                {selectedDpr.work_completed && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Work Completed</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedDpr.work_completed}</p>
                  </div>
                )}
                
                {selectedDpr.attendance_data && typeof selectedDpr.attendance_data === 'object' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Labour Summary (Auto-Generated)</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-blue-600 font-medium">Present</p>
                        <p className="text-lg font-bold text-blue-900">{selectedDpr.attendance_data.workersPresent || 0}</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded-lg text-center">
                        <p className="text-xs text-red-600 font-medium">Absent</p>
                        <p className="text-lg font-bold text-red-900">{selectedDpr.attendance_data.workersAbsent || 0}</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg text-center">
                        <p className="text-xs text-purple-600 font-medium">Overtime (Hrs)</p>
                        <p className="text-lg font-bold text-purple-900">{selectedDpr.attendance_data.totalOvertime || 0}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedDpr.materials_consumed && typeof selectedDpr.materials_consumed === 'object' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Material Summary (Auto-Generated)</h4>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">CONSUMED TODAY</p>
                      {selectedDpr.materials_consumed.consumed?.length > 0 ? (
                        <ul className="text-sm text-gray-700 space-y-1">
                          {selectedDpr.materials_consumed.consumed.map((m: any, i: number) => (
                            <li key={i} className="flex justify-between"><span>{m.name}</span> <span className="font-medium">{m.quantity} {m.unit}</span></li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-gray-400">No materials consumed</p>}
                    </div>
                  </div>
                )}
                
                {selectedDpr.issues_faced && typeof selectedDpr.issues_faced === 'object' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Task Summary (Auto-Generated)</h4>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500">COMPLETED TASKS</p>
                      {selectedDpr.issues_faced.completed_tasks?.length > 0 ? (
                        <ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
                          {selectedDpr.issues_faced.completed_tasks.map((t: string, i: number) => <li key={i}>{t}</li>)}
                        </ul>
                      ) : <p className="text-sm text-gray-400">No tasks marked complete today</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full md:w-80 bg-gray-50 p-4 rounded-xl space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Media & Attachments</h4>
                  <AttachmentUploader 
                    entityType="DPR" 
                    entityId={selectedDpr.id} 
                    category="Progress Photo"
                    readOnly={selectedDpr.status !== 'DRAFT'} 
                  />
                </div>
              </div>

            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

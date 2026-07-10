import React, { useState, useEffect, type FormEvent } from 'react';
import { Plus, Clock, FileText, CheckCircle, Upload, AlertCircle, Building2, User, ChevronRight, X } from 'lucide-react';
import { dprApi, type WeeklyReport } from '@/api/dpr';
import { apiClient } from '@/api/client';
import { PH, Card, Badge, SrchBar, Button } from '@/components/shared/FigmaComponents';

interface Project { id: string; name: string; }
interface Site { id: string; name: string; project_id: string; }

export default function WeeklyReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterSiteId, setFilterSiteId] = useState('');

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);

  const [formProjectId, setFormProjectId] = useState('');
  const [formSiteId, setFormSiteId] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [projectsRes, sitesRes, reportsRes] = await Promise.all([
        apiClient.get<Project[]>('/projects'),
        apiClient.get<Site[]>('/sites'),
        dprApi.getWeekly({ project_id: filterProjectId, site_id: filterSiteId })
      ]);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (sitesRes.data) setSites(sitesRes.data);
      if (reportsRes.data) setReports(reportsRes.data);
    } catch (err) {
      console.error('Failed to load Weekly Reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterProjectId, filterSiteId]);

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formProjectId || !formStartDate || !formEndDate) {
      setFormError('Project, Start Date, and End Date are required.');
      return;
    }
    setFormError('');
    setSubmitting(true);

    try {
      await dprApi.generateWeekly({
        project_id: formProjectId,
        site_id: formSiteId || undefined,
        start_date: formStartDate,
        end_date: formEndDate
      });
      setShowGenerateModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to generate report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PH title="Weekly Progress Reports" sub="Automated weekly summaries of site execution" />
        <Button onClick={() => setShowGenerateModal(true)} icon={<Plus size={16} />}>Generate Report</Button>
      </div>

      <Card className="p-4 flex gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
            No Weekly Reports generated yet.
          </div>
        ) : (
          reports.map(report => (
            <Card key={report.id} className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedReport(report)}>
              <div className="flex justify-between items-start mb-3">
                <Badge variant={report.site_health === 'ON_TRACK' ? 'success' : report.site_health === 'AT_RISK' ? 'warning' : 'danger'}>
                  {report.site_health?.replace('_', ' ')}
                </Badge>
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(report.week_start_date).toLocaleDateString()} - {new Date(report.week_end_date).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{report.project?.name}</h3>
              <p className="text-sm text-gray-500 mb-4">{report.site ? report.site.name : "All Sites"}</p>
              
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Days Active</span>
                  <span className="font-semibold">{report.attendance_summary?.days_reported || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Workers Present</span>
                  <span className="font-semibold">{report.attendance_summary?.total_workers_present || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="font-semibold">{report.status}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Plus size={18} /> Generate Weekly Report</h2>
              <button onClick={() => setShowGenerateModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4">
              {formError && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2"><AlertCircle size={16}/>{formError}</div>}
              <form id="gen-form" onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Project *</label>
                  <select required value={formProjectId} onChange={e => { setFormProjectId(e.target.value); setFormSiteId(''); }} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="">Select Project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Site (Optional)</label>
                  <select value={formSiteId} onChange={e => setFormSiteId(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                    <option value="">All Sites</option>
                    {sites.filter(s => s.project_id === formProjectId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                    <input type="date" required value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                    <input type="date" required value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
              <button type="button" onClick={() => setShowGenerateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" form="gen-form" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg">
                {submitting ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">Weekly Report: {selectedReport.project?.name}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(selectedReport.week_start_date).toLocaleDateString()} - {new Date(selectedReport.week_end_date).toLocaleDateString()} 
                  {selectedReport.site ? ` • ${selectedReport.site.name}` : ' • All Sites'}
                </p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                  <p className="text-xs text-gray-500 font-medium mb-1">Health</p>
                  <Badge variant={selectedReport.site_health === 'ON_TRACK' ? 'success' : selectedReport.site_health === 'AT_RISK' ? 'warning' : 'danger'}>
                    {selectedReport.site_health?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                  <p className="text-xs text-blue-600 font-medium mb-1">Total Workers</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedReport.attendance_summary?.total_workers_present || 0}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-xl border border-green-100 text-center">
                  <p className="text-xs text-green-600 font-medium mb-1">Total Labour Cost</p>
                  <p className="text-2xl font-bold text-green-900">₹{selectedReport.attendance_summary?.total_labour_cost || 0}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Work Completed</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                  {selectedReport.completed_work || <span className="text-gray-400 italic">No work recorded this week.</span>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Delay & Risks</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-red-50 p-4 rounded-lg border border-red-100">
                  {selectedReport.delay_summary || <span className="text-gray-400 italic">No delays recorded.</span>}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-3">Pending / Carry Over Work</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                  {selectedReport.pending_work || <span className="text-gray-400 italic">No pending work noted.</span>}
                </div>
              </div>

            </div>
          </Card>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, type FormEvent } from 'react';
import { ClipboardList, Plus, Search, Calendar, MapPin, CloudSun, AlertCircle, FileText, Trash2, Eye, User, Users, Download } from 'lucide-react';
import { dprApi, type DPR } from '@/api/dpr';
import { generateDprPdf } from '@/components/shared/PdfGenerator';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';

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

  // Filters
  const [projectFilter, setProjectFilter] = useState('');
  const [siteFilter, setSiteFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

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

      const filters: any = {};
      if (projectFilter) filters.project_id = projectFilter;
      if (siteFilter) filters.site_id = siteFilter;
      if (dateFilter) filters.date = dateFilter;

      const dprsRes = await dprApi.getAll(filters);
      if (dprsRes.data) setDprs(dprsRes.data);

    } catch (err) {
      console.error('Failed to load DPR page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectFilter, siteFilter, dateFilter]);

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

  if (loading) return <LoadingSpinner size="lg" />;

  const filteredSites = sites.filter(s => !formProjectId || s.project_id === formProjectId);

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Daily Progress Reports (DPR)</h1>
            <p className="page-subtitle">Track site works completion logs and supervisor briefs</p>
          </div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
            <Plus size={18} /> Submit DPR
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <select
              className="form-input form-select"
              value={projectFilter}
              onChange={e => { setProjectFilter(e.target.value); setSiteFilter(''); }}
            >
              <option value="">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <select
              className="form-input form-select"
              value={siteFilter}
              onChange={e => setSiteFilter(e.target.value)}
              disabled={!projectFilter}
            >
              <option value="">All Sites</option>
              {sites.filter(s => s.project_id === projectFilter).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <input
              type="date"
              className="form-input"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
            />
          </div>
          { (projectFilter || siteFilter || dateFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setProjectFilter(''); setSiteFilter(''); setDateFilter(''); }}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* DPR Cards List */}
      {dprs.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={38} />}
          title="No DPRs submitted yet"
          description="Supervisor progress summaries will appear here once logged."
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Log Daily Progress
            </button>
          }
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {dprs.map((dpr) => (
            <div key={dpr.id} className="list-card hover-row" onClick={() => openDetails(dpr)} style={{ cursor: 'pointer' }}>
              <div className="list-card-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary)' }}>
                <ClipboardList size={20} />
              </div>
              <div className="list-card-content">
                <div className="list-card-title">{dpr.site?.name || 'Site Location'}</div>
                <div className="list-card-subtitle" style={{ color: 'var(--color-text)' }}>
                  {dpr.summary.length > 80 ? `${dpr.summary.slice(0, 80)}...` : dpr.summary}
                </div>
                <div className="list-card-subtitle" style={{ fontSize: 'var(--font-size-xs)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={12} /> {new Date(dpr.report_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><User size={12} /> Submitter: {dpr.submitter?.name || 'Supervisor'}</span>
                  {dpr.weather && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><CloudSun size={12} /> {dpr.weather}</span>}
                  {dpr.workers_count && <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Users size={12} /> {dpr.workers_count} Present</span>}
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); openDetails(dpr); }}>
                <Eye size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Submission Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Submit Daily Progress Report (DPR)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate as any} disabled={submitting || !formSiteId || !formWorkCompleted}>
              {submitting ? 'Submitting...' : 'Submit DPR'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {formError && <div className="login-error"><span>{formError}</span></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="dpr-project">Select Project *</label>
              <select id="dpr-project" className="form-input form-select" value={formProjectId} onChange={e => { setFormProjectId(e.target.value); setFormSiteId(''); }} required>
                <option value="">Select project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dpr-site">Select Site Location *</label>
              <select id="dpr-site" className="form-input form-select" value={formSiteId} onChange={e => setFormSiteId(e.target.value)} disabled={!formProjectId} required>
                <option value="">Select site location...</option>
                {filteredSites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="dpr-date">Report Date</label>
              <input id="dpr-date" type="date" className="form-input" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dpr-weather">Weather Conditions</label>
              <input id="dpr-weather" type="text" className="form-input" placeholder="e.g. Sunny / Rainy / Clear" value={formWeather} onChange={e => setFormWeather(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dpr-workers">Workers Present Count</label>
            <input id="dpr-workers" type="number" min={0} className="form-input" placeholder="e.g. 15" value={formWorkersPresent} onChange={e => setFormWorkersPresent(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dpr-completed">Work Completed Details *</label>
            <textarea id="dpr-completed" className="form-input" placeholder="Describe tasks executed, floor levels completed, concrete volume poured, etc." value={formWorkCompleted} onChange={e => setFormWorkCompleted(e.target.value)} rows={3} required />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dpr-materials">Materials Consumed Today</label>
            <textarea id="dpr-materials" className="form-input" placeholder="e.g. 50 bags Cement, 2.5 tonnes TMT Steel bars" value={formMaterials} onChange={e => setFormMaterials(e.target.value)} rows={2} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="dpr-issues">Issues / Delays Faced</label>
              <textarea id="dpr-issues" className="form-input" placeholder="e.g. Labor shortage, lack of water" value={formIssues} onChange={e => setFormIssues(e.target.value)} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dpr-tomorrow">Tomorrow's Activity Plan</label>
              <textarea id="dpr-tomorrow" className="form-input" placeholder="Describe scheduled concrete pours, shuttering prep, etc." value={formTomorrowPlan} onChange={e => setFormTomorrowPlan(e.target.value)} rows={2} />
            </div>
          </div>

        </form>
      </Modal>

      {/* Details View Modal */}
      {selectedDpr && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          title={`DPR Log: ${selectedDpr.site?.name || 'Site location'}`}
          footer={
            <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleDownloadPdf} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={16} /> Download PDF
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Close</button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Project association</div>
              <div style={{ fontWeight: 'bold' }}>{selectedDpr.site?.project?.name || 'Apni Estate'}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Report Date</span>
                <div style={{ fontWeight: 'bold' }}>{new Date(selectedDpr.report_date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Supervisor</span>
                <div style={{ fontWeight: 'bold' }}>{selectedDpr.submitter?.name || 'Unassigned'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Weather Conditions</span>
                <div style={{ fontWeight: 'bold' }}>{selectedDpr.weather || '—'}</div>
              </div>
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Workers Present Count</span>
                <div style={{ fontWeight: 'bold' }}>{selectedDpr.workers_count || '—'}</div>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Work Completed</span>
              <p style={{ margin: '4px 0 0 0', lineHeight: 1.5, background: 'var(--color-bg-warm)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                {selectedDpr.work_completed}
              </p>
            </div>

            {selectedDpr.materials_consumed && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Materials Consumed</span>
                <p style={{ margin: '4px 0 0 0', lineHeight: 1.5, background: 'var(--color-primary-50)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', color: 'var(--color-primary)' }}>
                  {selectedDpr.materials_consumed}
                </p>
              </div>
            )}

            {selectedDpr.issues_faced && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Issues / Blockers Faced</span>
                <p style={{ margin: '4px 0 0 0', lineHeight: 1.5, background: 'var(--color-danger-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)' }}>
                  {selectedDpr.issues_faced}
                </p>
              </div>
            )}

            {selectedDpr.tomorrow_plan && (
              <div>
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Tomorrow's Schedule Plan</span>
                <p style={{ margin: '4px 0 0 0', lineHeight: 1.5, background: 'var(--color-info-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', color: 'var(--color-info)' }}>
                  {selectedDpr.tomorrow_plan}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}

    </div>
  );
}

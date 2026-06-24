import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Building2,
  Users,
  Wallet,
  ClipboardCheck,
  Package,
  Plus,
  AlertCircle,
  AlertTriangle,
  FileWarning,
  CheckCircle,
  ChevronRight,
  FileText,
  Clock,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingMaterials, setPendingMaterials] = useState<any[]>([]);
  const [dprStatus, setDprStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [projRes, attRes, tasksRes, actRes, matRes, dprRes] = await Promise.all([
        apiClient.get<any>('/projects/current').catch(() => ({ data: null } as any)),
        apiClient.get<any>('/attendance/summary').catch(() => ({ data: null } as any)),
        apiClient.get<any[]>('/tasks/today').catch(() => ({ data: [] } as any)),
        apiClient.get<any[]>('/activities/recent').catch(() => ({ data: [] } as any)),
        apiClient.get<any[]>('/materials/pending').catch(() => ({ data: [] } as any)),
        apiClient.get<any>('/dpr/pending').catch(() => ({ data: null } as any))
      ]);

      setCurrentProject(projRes.data);
      setAttendanceSummary(attRes.data);
      setTodayTasks(tasksRes.data || []);
      setRecentActivities(actRes.data || []);
      setPendingMaterials(matRes.data || []);
      setDprStatus(dprRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  const hasProject = currentProject && currentProject.id;

  // Compute Alerts
  const alerts = [];
  if (hasProject) {
    if (dprStatus?.pending) {
      alerts.push({
        type: 'dpr',
        title: 'Daily DPR Pending',
        desc: "Submit today's progress report",
        icon: FileWarning,
        color: 'primary',
        bg: 'rgba(10, 61, 145, 0.05)',
        link: '/dpr'
      });
    }
    if (pendingMaterials && pendingMaterials.length > 0) {
      const materialsList = pendingMaterials.map(m => m.materialName).join(', ');
      alerts.push({
        type: 'materials',
        title: `${pendingMaterials.length} Material Request${pendingMaterials.length > 1 ? 's' : ''} Pending`,
        desc: materialsList || 'Cement, Steel, Bricks',
        icon: AlertTriangle,
        color: 'warning',
        bg: 'rgba(245, 158, 11, 0.05)',
        link: '/inventory'
      });
    }
    if (currentProject.pendingTasks > 0) {
      alerts.push({
        type: 'overdue',
        title: `${currentProject.pendingTasks} Pending Tasks`,
        desc: 'Overdue or active work on site',
        icon: AlertCircle,
        color: 'error',
        bg: 'rgba(220, 38, 38, 0.05)',
        link: '/tasks'
      });
    }
    if (currentProject.pendingMaterialRequests > 0 && (!pendingMaterials || pendingMaterials.length === 0)) {
      alerts.push({
        type: 'approval',
        title: 'Approval Pending',
        desc: 'Material requests awaiting signoff',
        icon: Clock,
        color: 'warning',
        bg: 'rgba(245, 158, 11, 0.05)',
        link: '/inventory'
      });
    }
  }

  return (
    <div className="cc-dashboard animate-fade-in">
      {!hasProject ? (
        <div className="cc-card cc-onboard-card">
          <div className="cc-onboard-header">
            <Building2 size={32} color="#0A3D91" />
            <h2 className="cc-onboard-title">Start Your Site</h2>
          </div>
          <p className="cc-onboard-desc">
            No active project is currently assigned to you. Get started by setting up your project, adding workers, or creating a site.
          </p>
          <div className="cc-onboard-actions">
            <button className="cc-btn-primary" onClick={() => navigate('/projects')}>
              Create Project
            </button>
            <button className="cc-btn-secondary" onClick={() => navigate('/workers')}>
              Add Workers
            </button>
            <button className="cc-btn-secondary" onClick={() => navigate('/sites')}>
              Create Site
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SECTION 1: Site Overview Hero Card */}
          <div className="cc-card cc-hero-v3">
            <div className="cc-hero-top">
              <div className="cc-hero-info">
                <div className="cc-hero-avatar">
                  <Building2 size={20} color="#FFF" />
                </div>
                <div className="cc-hero-text">
                  <h1 className="cc-hero-title">{currentProject.siteName || currentProject.name}</h1>
                  <p className="cc-hero-meta">
                    Site ID: {currentProject.siteId?.substring(0, 8).toUpperCase() || 'GV-1024'} • {currentProject.location || 'Bhopal, MP'}
                  </p>
                </div>
              </div>
              <div className="cc-hero-badge-container">
                <span className="cc-hero-badge">{currentProject.status || 'ACTIVE'}</span>
              </div>
            </div>

            <div className="cc-hero-mid">
              <div className="cc-hero-date-row">
                <Calendar size={12} />
                <span>{currentProject.date}</span>
              </div>
              <div className="cc-hero-stats">
                <div className="cc-hero-stat">
                  <span className="cc-h-num">{attendanceSummary?.present + (attendanceSummary?.halfDay || 0) || currentProject.workersPresentToday || 0}</span>
                  <span className="cc-h-lbl">Workers Present</span>
                </div>
                <div className="cc-hero-stat">
                  <span className="cc-h-num">₹{(attendanceSummary?.todayLabourCost || currentProject.todayLabourCost || 0).toLocaleString('en-IN')}</span>
                  <span className="cc-h-lbl">Today's Cost</span>
                </div>
                <div className="cc-hero-stat progress-stat">
                  <div className="cc-circular-progress">
                    <span className="cc-circle-percent">{currentProject.progress}%</span>
                    <svg viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path className="circle"
                        strokeDasharray={`${currentProject.progress}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </div>
                  <span className="cc-h-lbl">Progress</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Quick Actions */}
          <div className="cc-actions-section">
            <div className="cc-actions-grid-v3">
              <button className="cc-act-card" onClick={() => navigate('/attendance')}>
                <div className="cc-act-icon-box" style={{ background: 'rgba(10, 61, 145, 0.08)', color: '#0A3D91' }}>
                  <Users size={24} />
                </div>
                <div className="cc-act-text">
                  <span className="cc-act-title">Attendance</span>
                  <span className="cc-act-sub">Mark presence</span>
                </div>
              </button>

              <button className="cc-act-card" onClick={() => navigate('/dpr')}>
                <div className="cc-act-icon-box" style={{ background: 'rgba(22, 163, 74, 0.08)', color: '#16A34A' }}>
                  <ClipboardCheck size={24} />
                </div>
                <div className="cc-act-text">
                  <span className="cc-act-title">Submit DPR</span>
                  <span className="cc-act-sub">Daily report</span>
                </div>
              </button>

              <button className="cc-act-card" onClick={() => navigate('/inventory?create=true')}>
                <div className="cc-act-icon-box" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B' }}>
                  <Package size={24} />
                </div>
                <div className="cc-act-text">
                  <span className="cc-act-title">Request Material</span>
                  <span className="cc-act-sub">Order inventory</span>
                </div>
              </button>

              <button className="cc-act-card" onClick={() => navigate('/tasks?create=true')}>
                <div className="cc-act-icon-box" style={{ background: 'rgba(10, 61, 145, 0.08)', color: '#0A3D91' }}>
                  <Plus size={24} />
                </div>
                <div className="cc-act-text">
                  <span className="cc-act-title">Create Task</span>
                  <span className="cc-act-sub">Assign new work</span>
                </div>
              </button>
            </div>
          </div>

          {/* RESPONSIVE 2-COLUMN LAYOUT */}
          <div className="cc-dashboard-columns">
            <div className="cc-col">
              {/* TODAY'S WORK */}
              <div className="cc-section-block">
                <div className="cc-section-header">
                  <h2 className="cc-v3-section-title">Today's Work Plan</h2>
                  <span className="cc-section-link" onClick={() => navigate('/tasks')}>View All Tasks</span>
                </div>
                <div className="cc-card cc-dense-list">
                  {todayTasks.length > 0 ? (
                    todayTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="cc-dense-row" onClick={() => navigate('/tasks')}>
                        <div className="cc-row-left">
                          <div className={`cc-custom-check ${task.status === 'DONE' ? 'checked' : ''}`}>
                            {task.status === 'DONE' && <span className="check-mark">✓</span>}
                          </div>
                          <div className="cc-row-info">
                            <span className={`cc-row-name ${task.status === 'DONE' ? 'strike' : ''}`}>{task.title}</span>
                            <span className="cc-row-sub">{task.location}</span>
                          </div>
                        </div>
                        <div className="cc-row-right">
                          <span className="cc-workers-badge">{task.assignedWorkersCount} Workers</span>
                          <span className={`cc-status-indicator ${task.status.toLowerCase()}`}>
                            {task.status === 'TODO' ? 'Pending' : task.status === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="cc-empty-state-dense">
                      <span>No tasks scheduled today.</span>
                      <button className="cc-btn-primary cc-btn-sm" onClick={() => navigate('/tasks?create=true')}>
                        Create Task
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ATTENTION REQUIRED */}
              {alerts.length > 0 && (
                <div className="cc-section-block">
                  <h2 className="cc-v3-section-title">Attention Required</h2>
                  <div className="cc-alerts-stack">
                    {alerts.map((alert, idx) => {
                      const Icon = alert.icon;
                      return (
                        <div key={idx} className="cc-alert-row-v3" style={{ background: alert.bg }} onClick={() => navigate(alert.link)}>
                          <div className={`cc-alert-icon-v3 ${alert.color}`}>
                            <Icon size={18} />
                          </div>
                          <div className="cc-alert-content-v3">
                            <span className={`cc-alert-title-v3 ${alert.color}`}>{alert.title}</span>
                            <span className="cc-alert-desc-v3">{alert.desc}</span>
                          </div>
                          <ChevronRight size={18} className="cc-alert-arrow" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="cc-col">
              {/* RECENT ACTIVITY */}
              <div className="cc-section-block">
                <div className="cc-section-header">
                  <h2 className="cc-v3-section-title">Site Activity</h2>
                  <span className="cc-section-link" onClick={() => navigate('/more')}>View All Activity</span>
                </div>
                <div className="cc-card cc-timeline-v3">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((log) => (
                      <div key={log.id} className="cc-tl-row-v3">
                        <div className="cc-tl-time-box">{log.time}</div>
                        <div className="cc-tl-node-v3">
                          <div className="cc-tl-dot-v3"></div>
                          <div className="cc-tl-line-v3"></div>
                        </div>
                        <div className="cc-tl-desc-v3">{log.text}</div>
                      </div>
                    ))
                  ) : (
                    <div className="cc-empty-state-dense">
                      <span>No recent activity logged.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* QUICK ACCESS */}
              <div className="cc-section-block">
                <h2 className="cc-v3-section-title">Quick Access</h2>
                <div className="cc-quick-access-grid">
                  <div className="cc-qa-chip" onClick={() => navigate('/workers')}>
                    <Users size={16} />
                    <span>Workers</span>
                  </div>
                  <div className="cc-qa-chip" onClick={() => navigate('/materials')}>
                    <Package size={16} />
                    <span>Materials</span>
                  </div>
                  <div className="cc-qa-chip" onClick={() => navigate('/finance')}>
                    <Wallet size={16} />
                    <span>Cashbook</span>
                  </div>
                  <div className="cc-qa-chip" onClick={() => navigate('/more')}>
                    <CheckCircle size={16} />
                    <span>Approvals</span>
                  </div>
                  <div className="cc-qa-chip" onClick={() => navigate('/more')}>
                    <FileText size={16} />
                    <span>Documents</span>
                  </div>
                  <div className="cc-qa-chip" onClick={() => navigate('/vendors')}>
                    <Users size={16} />
                    <span>Vendors</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

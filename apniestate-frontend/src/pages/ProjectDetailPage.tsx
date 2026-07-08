import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { projectsApi, type Project } from '@/api/projects';
import { milestonesApi, type Milestone } from '@/api/milestones';
import { budgetsApi, type Budget } from '@/api/budgets';
import { usersApi, type User } from '@/api/users';
import { apiClient } from '@/api/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import StatusBadge from '@/components/shared/StatusBadge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/shared/Modal';
import EmptyState from '@/components/shared/EmptyState';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Wallet,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  TrendingUp,
  DollarSign,
  TrendingDown,
  Timer,
  AlertTriangle,
  UserPlus
} from 'lucide-react';

const tabs = ['Overview', 'Milestones', 'Sites', 'Tasks', 'Finance', 'Timeline', 'Units'];

export default function ProjectDetailPage() {
  const { hasPermission } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // State
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Modals
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showAddSiteModal, setShowAddSiteModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);

  // Form states - Project
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<Project['status']>('PLANNING');
  const [editBudget, setEditBudget] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectSaving, setProjectSaving] = useState(false);

  // Form states - Milestone
  const [mName, setMName] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mTargetDate, setMTargetDate] = useState('');
  const [mWeight, setMWeight] = useState(1);
  const [milestoneError, setMilestoneError] = useState('');
  const [milestoneSaving, setMilestoneSaving] = useState(false);

  // Form states - Site
  const [sName, setSName] = useState('');
  const [sLocation, setSLocation] = useState('');
  const [sSupervisorId, setSSupervisorId] = useState('');
  const [sPhase, setSPhase] = useState('');
  const [sProgress, setSProgress] = useState(0);
  const [sStatus, setSStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED'>('IN_PROGRESS');
  const [siteError, setSiteError] = useState('');
  const [siteSaving, setSiteSaving] = useState(false);

  // Form states - Task
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tSiteId, setTSiteId] = useState('');
  const [tAssigneeId, setTAssigneeId] = useState('');
  const [tPriority, setTPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [tDueDate, setTDueDate] = useState('');
  const [tReminderDays, setTReminderDays] = useState(1);
  const [taskError, setTaskError] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);

  // Form states - Budget
  const [bCategory, setBCategory] = useState<'MATERIALS' | 'LABOUR' | 'EQUIPMENT' | 'OVERHEAD' | 'SUBCONTRACT' | 'CONTINGENCY' | 'OTHER'>('MATERIALS');
  const [bAllocated, setBAllocated] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [budgetSaving, setBudgetSaving] = useState(false);

  // Form states - Unit
  const [uNumber, setUNumber] = useState('');
  const [uType, setUType] = useState('HOUSE');
  const [uCustomType, setUCustomType] = useState('');
  const [uStatus, setUStatus] = useState('VACANT');
  const [uPrice, setUPrice] = useState('');
  const [uClientName, setUClientName] = useState('');
  const [unitError, setUnitError] = useState('');
  const [unitSaving, setUnitSaving] = useState(false);

  const fetchProjectData = async () => {
    try {
      const projRes = await projectsApi.getById(id!);
      if (projRes.data) {
        setProject(projRes.data);
        // Pre-populate project edit fields
        setEditName(projRes.data.name);
        setEditDesc(projRes.data.description || '');
        setEditStartDate(projRes.data.start_date ? projRes.data.start_date.split('T')[0] : '');
        setEditEndDate(projRes.data.end_date ? projRes.data.end_date.split('T')[0] : '');
        setEditStatus(projRes.data.status);
        setEditBudget(projRes.data.budget ? projRes.data.budget.toString() : '');
        setEditAddress(projRes.data.address || '');
        setEditCity(projRes.data.city || '');
        setEditManagerId(projRes.data.manager_id || '');
      }

      // Fetch Milestones
      const milesRes = await milestonesApi.getAll(id!);
      if (milesRes.data) setMilestones(milesRes.data);

      // Fetch Budgets
      const budgetsRes = await budgetsApi.getBudgetsByProject(id!);
      if (budgetsRes.data) setBudgets(budgetsRes.data);

      // Fetch Expenses
      const expRes = await apiClient.get<any[]>(`/finance?project_id=${id}`);
      if (expRes.data) setExpenses(expRes.data);

      // Fetch Timeline planning forecast data
      const timelineRes = await apiClient.get<any>(`/projects/${id}/timeline`);
      if (timelineRes.data) setTimelineData(timelineRes.data);

      let usersRes: any = { data: [] };
      if (hasPermission('users.read')) {
        usersRes = await usersApi.getAll().catch(() => ({ data: [] }));
      }
      if (usersRes.data) setUsers(usersRes.data);

      // Fetch Units
      const unitsRes = await apiClient.get<any[]>(`/projects/${id}/units`);
      if (unitsRes.data) setUnits(unitsRes.data);

    } catch (err) {
      console.error('Failed to load project details page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" />;
  if (!project) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <div className="empty-state-title">Project not found</div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')} style={{ marginTop: 'var(--space-4)' }}>
          Back to Projects
        </button>
      </div>
    );
  }

  // Calculated properties
  const totalTasksCount = project._count?.tasks || project.tasks?.length || 0;
  const progress = project.progress_percentage || 0;

  // Pie chart logic
  const categoryColors: Record<string, string> = {
    MATERIAL: '#F97316',
    GENERAL: '#EF4444',
    LABOUR: '#3B82F6',
    STOCK_TRANSFER: '#A855F7',
    SUBCONTRACTS: '#14B8A6',
    BROKER: '#EC4899',
    OFFICE: '#6366F1',
    OTHER: '#9CA3AF'
  };
  const hasSpent = budgets.some(b => b.spent > 0);
  const pieData = budgets.filter(b => b.spent > 0).map((b) => ({
    name: b.category,
    value: b.spent,
    color: categoryColors[b.category] || categoryColors.OTHER
  }));

  // Health Score calculations
  const totalSpentExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = units.filter((u: any) => u.status === 'SOLD').reduce((sum: number, u: any) => sum + (u.price || 0), 0);
  const projectProfitability = totalRevenue - totalSpentExpenses;
  const projectProfitMargin = totalRevenue > 0 ? (projectProfitability / totalRevenue) * 100 : 0;
  
  const allocatedBudget = project.budget || 0;
  const budgetVariance = allocatedBudget - totalSpentExpenses;
  
  let healthStatus: 'ON_BUDGET' | 'AT_RISK' | 'OVER_BUDGET' = 'ON_BUDGET';
  if (allocatedBudget > 0) {
    const ratio = totalSpentExpenses / allocatedBudget;
    if (ratio > 1.0) {
      healthStatus = 'OVER_BUDGET';
    } else if (ratio > 0.9) {
      healthStatus = 'AT_RISK';
    }
  }

  const getHealthBadgeColor = (h: typeof healthStatus) => {
    switch (h) {
      case 'ON_BUDGET': return { color: 'var(--color-success)', bg: 'var(--color-success-bg)', text: 'On Budget' };
      case 'AT_RISK': return { color: 'var(--color-warning)', bg: 'var(--color-warning-bg)', text: 'At Risk' };
      case 'OVER_BUDGET': return { color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', text: 'Over Budget' };
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'URGENT':
      case 'HIGH': return 'var(--color-danger)';
      case 'MEDIUM': return 'var(--color-warning)';
      default: return 'var(--color-success)';
    }
  };

  // Handlers - Project
  const handleUpdateProject = async (e: FormEvent) => {
    e.preventDefault();
    setProjectError('');
    setProjectSaving(true);
    try {
      await projectsApi.update(project.id, {
        name: editName,
        description: editDesc || null,
        start_date: new Date(editStartDate).toISOString(),
        end_date: editEndDate ? new Date(editEndDate).toISOString() : null,
        status: editStatus,
        budget: editBudget ? parseFloat(editBudget) : null,
        address: editAddress || null,
        city: editCity || null,
        manager_id: editManagerId || null,
      });
      setShowEditProjectModal(false);
      fetchProjectData();
    } catch (err: any) {
      setProjectError(err.message || 'Failed to update project details');
    } finally {
      setProjectSaving(false);
    }
  };

  const handleArchiveProject = async () => {
    if (!confirm('Are you sure you want to archive this project? This will set its status to Cancelled.')) return;
    try {
      await projectsApi.update(project.id, { status: 'CANCELLED' });
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('CRITICAL WARNING: Are you sure you want to permanently delete this project? All associated sites, milestones, and tasks will be deleted.')) return;
    try {
      await projectsApi.delete(project.id);
      navigate('/projects');
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers - Milestone
  const handleCreateMilestone = async (e: FormEvent) => {
    e.preventDefault();
    setMilestoneError('');
    setMilestoneSaving(true);
    try {
      await milestonesApi.create({
        project_id: project.id,
        name: mName,
        description: mDesc || null,
        target_date: new Date(mTargetDate).toISOString(),
        weight: Number(mWeight) || 1,
        status: 'PENDING'
      });
      setShowAddMilestoneModal(false);
      setMName('');
      setMDesc('');
      setMTargetDate('');
      setMWeight(1);
      fetchProjectData();
    } catch (err: any) {
      setMilestoneError(err.message || 'Failed to create milestone');
    } finally {
      setMilestoneSaving(false);
    }
  };

  const toggleMilestoneStatus = async (m: Milestone) => {
    const nextStatusMap: Record<Milestone['status'], Milestone['status']> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'COMPLETED',
      COMPLETED: 'DELAYED',
      DELAYED: 'PENDING'
    };
    const nextStatus = nextStatusMap[m.status];
    try {
      await milestonesApi.update(m.id, {
        status: nextStatus,
        actual_date: nextStatus === 'COMPLETED' ? new Date().toISOString() : null
      });
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMilestone = async (mId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await milestonesApi.delete(mId);
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers - Site
  const handleCreateSite = async (e: FormEvent) => {
    e.preventDefault();
    setSiteError('');
    setSiteSaving(true);
    try {
      await apiClient.post('/sites', {
        project_id: project.id,
        name: sName,
        location: sLocation,
        supervisor_id: sSupervisorId || null,
        status: sStatus,
        progress_percentage: Number(sProgress),
        phase: sPhase || null
      });
      setShowAddSiteModal(false);
      setSName('');
      setSLocation('');
      setSSupervisorId('');
      setSPhase('');
      setSProgress(0);
      setSStatus('IN_PROGRESS');
      fetchProjectData();
    } catch (err: any) {
      setSiteError(err.message || 'Failed to create site');
    } finally {
      setSiteSaving(false);
    }
  };

  // Handlers - Task
  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    setTaskError('');
    setTaskSaving(true);
    try {
      await apiClient.post('/tasks', {
        title: tTitle,
        description: tDesc || null,
        project_id: project.id,
        site_id: tSiteId || null,
        assignee_id: tAssigneeId || null,
        priority: tPriority,
        due_date: tDueDate ? new Date(tDueDate).toISOString() : null,
        reminder_days: Number(tReminderDays),
        status: 'TODO'
      });
      setShowAddTaskModal(false);
      setTTitle('');
      setTDesc('');
      setTSiteId('');
      setTAssigneeId('');
      setTPriority('MEDIUM');
      setTDueDate('');
      setTReminderDays(1);
      fetchProjectData();
    } catch (err: any) {
      setTaskError(err.message || 'Failed to create task');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      TODO: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'BLOCKED',
      BLOCKED: 'TODO'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'TODO';
    try {
      await apiClient.patch(`/tasks/${taskId}`, { status: nextStatus });
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers - Budget allocation
  const handleCreateBudget = async (e: FormEvent) => {
    e.preventDefault();
    setBudgetError('');
    setBudgetSaving(true);
    try {
      await budgetsApi.createBudget({
        project_id: project.id,
        category: bCategory,
        allocated: parseFloat(bAllocated),
        description: bDesc || null,
      });
      setShowAddBudgetModal(false);
      setBAllocated('');
      setBDesc('');
      fetchProjectData();
    } catch (err: any) {
      setBudgetError(err.message || 'Failed to create budget entry');
    } finally {
      setBudgetSaving(false);
    }
  };

  // Handlers - Units
  const handleCreateUnit = async (e: FormEvent) => {
    e.preventDefault();
    setUnitError('');
    setUnitSaving(true);
    try {
      await apiClient.post(`/projects/${id}/units`, {
        unit_number: uNumber,
        type: uType,
        custom_type: uType === 'OTHER' ? uCustomType : null,
        status: uStatus,
        price: uPrice || null,
        client_name: uClientName || null,
      });
      setShowAddUnitModal(false);
      setUNumber('');
      setUType('HOUSE');
      setUCustomType('');
      setUStatus('VACANT');
      setUPrice('');
      setUClientName('');
      fetchProjectData();
    } catch (err: any) {
      setUnitError(err.message || 'Failed to create unit');
    } finally {
      setUnitSaving(false);
    }
  };

  const handleToggleUnitStatus = async (unitId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      VACANT: 'BOOKED',
      BOOKED: 'SOLD',
      SOLD: 'VACANT'
    };
    const nextStatus = nextStatusMap[currentStatus] || 'VACANT';
    try {
      await apiClient.patch(`/units/${unitId}`, { status: nextStatus });
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm('Are you sure you want to delete this unit?')) return;
    try {
      await apiClient.delete(`/units/${unitId}`);
      fetchProjectData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* Back + Header */}
      <div style={{ marginBottom: 'var(--space-5)' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate('/projects')}
          style={{ marginBottom: 'var(--space-3)', marginLeft: '-0.5rem' }}
          aria-label="Back to projects"
        >
          <ArrowLeft size={18} />
          Projects
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <h1 className="page-title" style={{ margin: 0 }}>{project.name}</h1>
              <StatusBadge status={project.status} />
              <span className="badge" style={{ background: getHealthBadgeColor(healthStatus).bg, color: getHealthBadgeColor(healthStatus).color }}>
                {getHealthBadgeColor(healthStatus).text}
              </span>
            </div>
            {project.description && (
              <p className="page-subtitle" style={{ marginTop: 'var(--space-2)' }}>
                {project.description}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowEditProjectModal(true)}>
              <Edit2 size={14} style={{ marginRight: '6px' }} /> Edit Project
            </button>
            <button className="btn btn-ghost btn-sm text-danger" onClick={handleDeleteProject} style={{ color: 'var(--color-danger)' }}>
              <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-5)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="animate-fade-in">
          {/* Project Progress */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-body">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: 'var(--space-3)',
              }}>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
                  Overall Progress (based on Task Completion)
                </span>
                <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                  {progress}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
            <InfoCard
              icon={<Calendar size={18} />}
              label="Start Date"
              value={new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            />
            <InfoCard
              icon={<Calendar size={18} />}
              label="Estimated End Date"
              value={project.end_date
                ? new Date(project.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Not set'
              }
            />
            <InfoCard icon={<MapPin size={18} />} label="Total Sites" value={`${project._count?.sites || project.sites?.length || 0} sites`} />
            <InfoCard icon={<Wallet size={18} />} label="Project Budget" value={project.budget ? `₹${project.budget.toLocaleString('en-IN')}` : 'Not set'} />
          </div>

          <div className="grid-2" style={{ marginBottom: 'var(--space-5)' }}>
            {/* Stats Column */}
            <div className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', margin: 0 }}>
                Project Entities
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-4)' }}>
                <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>{totalTasksCount}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Tasks Count</div>
                </div>
                <div style={{ textAlign: 'center', padding: 'var(--space-3)', background: 'var(--color-info-bg)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-info)' }}>{project._count?.workers || 0}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Linked Workers</div>
                </div>
              </div>
            </div>

            {/* Team Assignment Details */}
            <div className="card" style={{ padding: 'var(--space-5)' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', margin: 0, marginBottom: 'var(--space-3)' }}>
                Team Assignment
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Builder / Developer</div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>
                    {project.builder?.name || 'Unassigned'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Project Manager</div>
                  <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>
                    {project.manager?.name || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No project manager assigned</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Health Card */}
          <div className="card" style={{ marginBottom: 'var(--space-5)', background: getHealthBadgeColor(healthStatus).bg + '20', border: `1px solid ${getHealthBadgeColor(healthStatus).color}40` }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: 0, color: getHealthBadgeColor(healthStatus).color }}>
                  Financial Status: {getHealthBadgeColor(healthStatus).text}
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Total Allocated</span>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>₹{allocatedBudget.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Total Actual Costs</span>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>₹{totalSpentExpenses.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Budget Variance</span>
                  <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: budgetVariance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {budgetVariance >= 0 ? '+' : ''}₹{budgetVariance.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expenditure Breakdown Pie Chart */}
          <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: 0, marginBottom: 'var(--space-4)', textAlign: 'center' }}>
                Expense Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                        animationBegin={200}
                        animationDuration={1500}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Custom Legend */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px', 
                  width: '100%', 
                  padding: '0 16px',
                  marginTop: '16px' 
                }}>
                  {pieData.map((entry, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ 
                        width: '10px', 
                        height: '10px', 
                        borderRadius: '50%', 
                        backgroundColor: entry.color,
                        marginTop: '4px'
                      }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                          {entry.name.replace('_', ' ').toLowerCase()}
                        </span>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          ₹{entry.value.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Address Card */}
          {(project.address || project.city) && (
            <div className="card">
              <div className="card-body">
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Location Details</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  <MapPin size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{project.address}{project.city ? `, ${project.city}` : ''}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Units / Bookings Tab */}
      {activeTab === 'Units' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Project Units & Bookings</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddUnitModal(true)}>
              <Plus size={16} /> Add Unit
            </button>
          </div>

          {units.length === 0 ? (
            <EmptyState
              icon={<UserPlus size={36} />}
              title="No units defined"
              description="Create manageable units like rooms, shops, or floors to track their booking status."
              action={
                <button className="btn btn-primary" onClick={() => setShowAddUnitModal(true)}>
                  <Plus size={16} /> Create Unit
                </button>
              }
            />
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {units.map((u: any) => (
                <div key={u.id} className="list-card hover-row">
                  <div className="list-card-content">
                    <div className="list-card-title">
                      {u.unit_number} 
                      <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--color-text-muted)', marginLeft: '8px' }}>
                        ({u.type === 'OTHER' ? u.custom_type : u.type})
                      </span>
                    </div>
                    {u.client_name && <div className="list-card-subtitle">Client: {u.client_name}</div>}
                    {u.price && (
                      <div className="list-card-subtitle" style={{ marginTop: '4px', fontWeight: 'bold' }}>
                        Price: ₹{u.price.toLocaleString('en-IN')}
                      </div>
                    )}
                  </div>
                  <div className="list-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span 
                      className={`badge cursor-pointer ${u.status === 'VACANT' ? 'badge-pending' : u.status === 'BOOKED' ? 'badge-active' : 'badge-cancelled'}`}
                      style={{ textTransform: 'capitalize' }}
                      onClick={() => handleToggleUnitStatus(u.id, u.status)}
                      title="Click to cycle status: VACANT -> BOOKED -> SOLD"
                    >
                      {u.status}
                    </span>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => handleDeleteUnit(u.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'Milestones' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Project Milestones</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddMilestoneModal(true)}>
              <Plus size={16} /> Add Milestone
            </button>
          </div>

          {milestones.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={36} />}
              title="No milestones defined"
              description="Add key stages of construction to track high-level completion status."
              action={
                <button className="btn btn-primary" onClick={() => setShowAddMilestoneModal(true)}>
                  <Plus size={16} /> Create Milestone
                </button>
              }
            />
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              {milestones.map((m) => (
                <div key={m.id} className="list-card hover-row" id={`milestone-${m.id}`}>
                  <div
                    style={{ cursor: 'pointer', display: 'flex', paddingRight: '12px' }}
                    onClick={() => toggleMilestoneStatus(m)}
                    title="Click to cycle status"
                  >
                    <CheckCircle2 color={m.status === 'COMPLETED' ? 'var(--color-success)' : 'var(--color-text-muted)'} size={22} />
                  </div>
                  <div className="list-card-content">
                    <div className="list-card-title">{m.name}</div>
                    {m.description && <div className="list-card-subtitle">{m.description}</div>}
                    <div className="list-card-subtitle" style={{ marginTop: '4px' }}>
                      Target Date: {new Date(m.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {m.actual_date && ` · Finished: ${new Date(m.actual_date).toLocaleDateString('en-GB')}`}
                      {m.weight && ` · Weight: ${m.weight}`}
                    </div>
                  </div>
                  <div className="list-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className={`badge ${m.status === 'COMPLETED' ? 'badge-active' : m.status === 'DELAYED' ? 'badge-cancelled' : 'badge-pending'}`} style={{ textTransform: 'capitalize' }}>
                      {m.status.toLowerCase().replace('_', ' ')}
                    </span>
                    <button className="btn btn-ghost btn-sm text-danger btn-icon" onClick={() => handleDeleteMilestone(m.id)}>
                      <Trash2 size={16} color="#EF4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sites Tab */}
      {activeTab === 'Sites' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Project Site Locations</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddSiteModal(true)}>
              <Plus size={16} /> Add Site
            </button>
          </div>

          {!project.sites || project.sites.length === 0 ? (
            <EmptyState
              icon={<MapPin size={36} />}
              title="No site locations registered"
              description="Create a site to track construction details, supervisors, and progress percentages."
              action={
                <button className="btn btn-primary" onClick={() => setShowAddSiteModal(true)}>
                  <Plus size={16} /> Register Site
                </button>
              }
            />
          ) : (
            <div className="grid-2">
              {project.sites.map((site) => (
                <div key={site.id} className="card hover-row" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)' }}>{site.name}</h3>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <MapPin size={12} /> {site.location}
                      </div>
                    </div>
                    <span className="badge badge-active" style={{ textTransform: 'capitalize' }}>
                      {site.status?.replace('_', ' ').toLowerCase() || ''}
                    </span>
                  </div>

                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                    {site.phase && <div>Phase: <strong>{site.phase}</strong></div>}
                    <div>Supervisor: <strong>{site.supervisor?.name || 'Unassigned'}</strong></div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '4px' }}>
                      <span>Site Progress</span>
                      <span>{site.progress_percentage}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${site.progress_percentage}%` }} />
                    </div>
                  </div>

                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/sites`)} style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    View in Sites Directory <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'Tasks' && (
        <ProjectTasksView
          project={project}
          tasks={project.tasks || []}
          onToggleStatus={handleToggleTaskStatus}
          onDelete={handleDeleteTask}
          onOpenCreateModal={() => {
            setTSiteId('');
            setTAssigneeId('');
            setShowAddTaskModal(true);
          }}
        />
      )}

      {/* Finance Tab */}
      {activeTab === 'Finance' && (
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Category Budget Allocations</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddBudgetModal(true)}>
              <Plus size={16} /> Allocate Budget
            </button>
          </div>

          {/* Profitability Card */}
          <div className="rounded-xl p-3 border border-border bg-white mb-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total Profitability</p>
              <div className="flex items-baseline gap-2">
                <p className="text-lg font-bold text-foreground">₹{projectProfitability.toLocaleString('en-IN')}</p>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${projectProfitMargin >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {projectProfitMargin >= 0 ? '+' : ''}{projectProfitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Project Revenue</p>
              <p className="text-sm font-bold text-foreground">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-5)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: 0, marginBottom: 'var(--space-4)' }}>
              Budget Health & Categories
            </h3>

            {budgets.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                No category budgets allocated yet. Click the Allocate Budget button to structure project spending limits.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {budgets.map((b) => {
                  const variance = b.allocated - b.spent;
                  const pct = b.allocated > 0 ? Math.min(100, Math.round((b.spent / b.allocated) * 100)) : 0;
                  return (
                    <div key={b.id} style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2px', marginBottom: '4px' }}>
                        <div>
                          <strong style={{ textTransform: 'capitalize', fontSize: 'var(--font-size-sm)' }}>
                            {b.category.toLowerCase()}
                          </strong>
                          {b.description && (
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                              ({b.description})
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 'var(--font-size-xs)' }}>
                          <span>₹{b.spent.toLocaleString()} spent of ₹{b.allocated.toLocaleString()} limit</span>
                        </div>
                      </div>
                      <div className="progress-bar" style={{ height: '6px', marginBottom: '4px' }}>
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: pct > 100 ? 'var(--color-danger)' : pct > 90 ? 'var(--color-warning)' : 'var(--color-success)' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)' }}>
                        <span style={{ color: variance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {variance >= 0 ? 'Under Limit' : 'Over limit'}: ₹{Math.abs(variance).toLocaleString()}
                        </span>
                        <span>{pct}% utilized</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Project Expenses */}
          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', margin: 0, marginBottom: 'var(--space-4)' }}>
                Recent Project Expenses
              </h3>
              {expenses.length === 0 ? (
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0 }}>
                  No expenses logged under this project or its sites.
                </p>
              ) : (
                <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Site</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id}>
                          <td>{new Date(e.date).toLocaleDateString('en-GB')}</td>
                          <td>
                            <span className="badge" style={{ background: '#F3F4F6', color: '#374151', textTransform: 'uppercase', fontSize: '10px' }}>
                              {e.category}
                            </span>
                          </td>
                          <td>{e.description || '—'}</td>
                          <td>{e.site?.name || 'Project-Level'}</td>
                          <td style={{ fontWeight: 'bold' }}>₹{e.amount.toLocaleString()}</td>
                          <td>
                            <span className={`badge ${e.status === 'PAID' || e.status === 'APPROVED' ? 'badge-active' : e.status === 'REJECTED' ? 'badge-cancelled' : 'badge-pending'}`}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'Timeline' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Smart Site Timeline Planning</h2>

          {/* completion forecast */}
          {timelineData && (
            <div className="card" style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <Timer size={24} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                    Project Completion Forecast
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text)' }}>
                    {timelineData.forecastMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Delay warnings */}
          {timelineData && timelineData.delayWarnings && timelineData.delayWarnings.length > 0 && (
            <div className="card" style={{ background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)' }}>
              <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                <AlertTriangle size={24} color="var(--color-danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)' }}>
                    Timeline Planning Delay Warnings
                  </h3>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>
                    {timelineData.delayWarnings.map((warn: string, idx: number) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Daily Work recommendation */}
          <div className="grid-2">
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
                <AlertCircle size={18} /> Recommended Daily Work
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: '2px 0 12px 0' }}>
                Tasks currently overdue or due today. Execute immediately.
              </p>
              {!timelineData || !timelineData.dailyWork || timelineData.dailyWork.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  No urgent tasks matching daily recommendations.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {timelineData.dailyWork.map((t: any) => (
                    <div key={t.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid var(--color-danger)', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>{t.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <span>Assignee: {t.assignee?.name || 'Unassigned'}</span>
                        <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>
                          Due: {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : 'No date'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Work recommendation */}
            <div className="card" style={{ padding: 'var(--space-4)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-bold)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                <Calendar size={18} /> Recommended Weekly Work
              </h3>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: '2px 0 12px 0' }}>
                Tasks due in the next 7 days. Start preparing and allocating labor.
              </p>
              {!timelineData || !timelineData.weeklyWork || timelineData.weeklyWork.length === 0 ? (
                <p style={{ fontStyle: 'italic', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
                  No tasks due in next 7 days.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {timelineData.weeklyWork.map((t: any) => (
                    <div key={t.id} style={{ padding: 'var(--space-2) var(--space-3)', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--color-primary)', borderRadius: '4px' }}>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>{t.title}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <span>Assignee: {t.assignee?.name || 'Unassigned'}</span>
                        <span>Due: {t.due_date ? new Date(t.due_date).toLocaleDateString('en-GB') : '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALS SECTION */}

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditProjectModal}
        onClose={() => setShowEditProjectModal(false)}
        title="Edit Project Details"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowEditProjectModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleUpdateProject as any} disabled={projectSaving || !editName || !editStartDate}>
              {projectSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateProject} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {projectError && <div className="login-error"><span>{projectError}</span></div>}
          <div className="form-group">
            <label className="form-label" htmlFor="edit-proj-name">Project Name *</label>
            <input id="edit-proj-name" type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-proj-desc">Description</label>
            <textarea id="edit-proj-desc" className="form-input" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-proj-start">Start Date *</label>
              <input id="edit-proj-start" type="date" className="form-input" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-proj-end">End Date</label>
              <input id="edit-proj-end" type="date" className="form-input" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-proj-budget">Budget (₹)</label>
              <input id="edit-proj-budget" type="number" className="form-input" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-proj-status">Status</label>
              <select id="edit-proj-status" className="form-input form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)}>
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-proj-address">Address</label>
              <input id="edit-proj-address" type="text" className="form-input" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-proj-city">City</label>
              <input id="edit-proj-city" type="text" className="form-input" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-proj-manager">Assign Project Manager</label>
            <select id="edit-proj-manager" className="form-input form-select" value={editManagerId} onChange={(e) => setEditManagerId(e.target.value)}>
              <option value="">No Manager (Unassigned)</option>
              {users
                .filter(u => ['PROJECT_MANAGER', 'BUILDER', 'ADMIN'].includes(u.role))
                .map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, ' ')})</option>
                ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={showAddMilestoneModal}
        onClose={() => setShowAddMilestoneModal(false)}
        title="Add Milestone Stage"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddMilestoneModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateMilestone as any} disabled={milestoneSaving || !mName || !mTargetDate}>
              {milestoneSaving ? 'Adding...' : 'Save Milestone'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateMilestone} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {milestoneError && <div className="login-error"><span>{milestoneError}</span></div>}
          <div className="form-group">
            <label className="form-label" htmlFor="m-name">Milestone Stage Name *</label>
            <input id="m-name" type="text" className="form-input" placeholder="e.g. RCC Casting of roof slab" value={mName} onChange={(e) => setMName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="m-desc">Description</label>
            <textarea id="m-desc" className="form-input" placeholder="Brief stages description/instructions" value={mDesc} onChange={(e) => setMDesc(e.target.value)} rows={2} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="m-target">Target Completion Date *</label>
              <input id="m-target" type="date" className="form-input" value={mTargetDate} onChange={(e) => setMTargetDate(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="m-weight">Weight Factor (1-10)</label>
              <input id="m-weight" type="number" className="form-input" min={1} max={10} value={mWeight} onChange={(e) => setMWeight(Number(e.target.value))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Site Modal */}
      <Modal
        isOpen={showAddSiteModal}
        onClose={() => setShowAddSiteModal(false)}
        title="Register Site Location"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddSiteModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateSite as any} disabled={siteSaving || !sName || !sLocation}>
              {siteSaving ? 'Registering...' : 'Register Site'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateSite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {siteError && <div className="login-error"><span>{siteError}</span></div>}
          <div className="form-group">
            <label className="form-label" htmlFor="site-nm">Site Name *</label>
            <input id="site-nm" type="text" className="form-input" placeholder="e.g. Block C Excavation" value={sName} onChange={(e) => setSName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="site-loc">Physical Address / Geo Location *</label>
            <input id="site-loc" type="text" className="form-input" placeholder="e.g. Sector 62, Noida" value={sLocation} onChange={(e) => setSLocation(e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="site-super">Site Supervisor</label>
              <select id="site-super" className="form-input form-select" value={sSupervisorId} onChange={(e) => setSSupervisorId(e.target.value)}>
                <option value="">Unassigned</option>
                {users
                  .filter(u => ['SITE_SUPERVISOR', 'PROJECT_MANAGER'].includes(u.role))
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, ' ')})</option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="site-phs">Current Phase</label>
              <input id="site-phs" type="text" className="form-input" placeholder="e.g. Excavation stage" value={sPhase} onChange={(e) => setSPhase(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="site-status">Status</label>
              <select id="site-status" className="form-input form-select" value={sStatus} onChange={(e) => setSStatus(e.target.value as any)}>
                <option value="NOT_STARTED">Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="site-progress">Progress ({sProgress}%)</label>
              <input id="site-progress" type="range" className="form-input" min={0} max={100} style={{ padding: 0 }} value={sProgress} onChange={(e) => setSProgress(Number(e.target.value))} />
            </div>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        title="Add Project Task"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddTaskModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateTask as any} disabled={taskSaving || !tTitle}>
              {taskSaving ? 'Saving...' : 'Save Task'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {taskError && <div className="login-error"><span>{taskError}</span></div>}
          <div className="form-group">
            <label className="form-label" htmlFor="t-title">Task Title *</label>
            <input id="t-title" type="text" className="form-input" placeholder="e.g. Backfilling of foundations" value={tTitle} onChange={(e) => setTTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="t-desc">Task Description</label>
            <textarea id="t-desc" className="form-input" placeholder="Provide design notes / materials specifications" value={tDesc} onChange={(e) => setTDesc(e.target.value)} rows={2} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="t-site">Select Site Location</label>
              <select id="t-site" className="form-input form-select" value={tSiteId} onChange={(e) => setTSiteId(e.target.value)}>
                <option value="">General (No specific site)</option>
                {project.sites?.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="t-assign">Assign Team User</label>
              <select id="t-assign" className="form-input form-select" value={tAssigneeId} onChange={(e) => setTAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace(/_/g, ' ')})</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="t-due">Due Date</label>
              <input id="t-due" type="date" className="form-input" value={tDueDate} onChange={(e) => setTDueDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="t-prio">Priority</label>
              <select id="t-prio" className="form-input form-select" value={tPriority} onChange={(e) => setTPriority(e.target.value as any)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="t-reminder">Remind Days Before</label>
            <input id="t-reminder" type="number" className="form-input" min={0} value={tReminderDays} onChange={(e) => setTReminderDays(Number(e.target.value))} />
          </div>
        </form>
      </Modal>

      {/* Allocate Budget Modal */}
      <Modal
        isOpen={showAddBudgetModal}
        onClose={() => setShowAddBudgetModal(false)}
        title="Allocate Category Budget"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddBudgetModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateBudget as any} disabled={budgetSaving || !bAllocated}>
              {budgetSaving ? 'Allocating...' : 'Allocate Budget'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateBudget} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {budgetError && <div className="login-error"><span>{budgetError}</span></div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="b-cat">Category *</label>
              <select id="b-cat" className="form-input form-select" value={bCategory} onChange={(e) => setBCategory(e.target.value as any)}>
                <option value="MATERIALS">Materials</option>
                <option value="LABOUR">Labour (Workforce)</option>
                <option value="EQUIPMENT">Equipment</option>
                <option value="SUBCONTRACT">Subcontracts</option>
                <option value="OVERHEAD">Overheads</option>
                <option value="CONTINGENCY">Contingency</option>
                <option value="OTHER">Other Miscellaneous</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="b-amt">Allocated Limit (₹) *</label>
              <input id="b-amt" type="number" className="form-input" placeholder="e.g. 1500000" value={bAllocated} onChange={(e) => setBAllocated(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="b-desc">Notes / Scope Description</label>
            <textarea id="b-desc" className="form-input" placeholder="Optional allocations remarks" value={bDesc} onChange={(e) => setBDesc(e.target.value)} rows={2} />
          </div>
        </form>
      </Modal>

      {/* Add Unit Modal */}
      <Modal
        isOpen={showAddUnitModal}
        onClose={() => setShowAddUnitModal(false)}
        title="Create New Project Unit"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddUnitModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreateUnit as any} disabled={unitSaving || !uNumber}>
              {unitSaving ? 'Saving...' : 'Create Unit'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateUnit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {unitError && <div className="login-error"><span>{unitError}</span></div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="u-number">Unit Number/Name *</label>
              <input id="u-number" type="text" className="form-input" placeholder="e.g. Shop 101, Villa 5" value={uNumber} onChange={(e) => setUNumber(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="u-type">Unit Type *</label>
              <select id="u-type" className="form-input form-select" value={uType} onChange={(e) => setUType(e.target.value)}>
                <option value="HOUSE">House / Villa</option>
                <option value="MALL_SHOP">Mall Shop</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="OFFICE">Office Space</option>
                <option value="OTHER">Other Custom</option>
              </select>
            </div>
          </div>
          {uType === 'OTHER' && (
            <div className="form-group">
              <label className="form-label" htmlFor="u-custom-type">Custom Type Name *</label>
              <input id="u-custom-type" type="text" className="form-input" placeholder="e.g. Warehouse" value={uCustomType} onChange={(e) => setUCustomType(e.target.value)} required={uType === 'OTHER'} />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="u-price">Price (₹)</label>
              <input id="u-price" type="number" className="form-input" placeholder="Optional" value={uPrice} onChange={(e) => setUPrice(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="u-status">Status</label>
              <select id="u-status" className="form-input form-select" value={uStatus} onChange={(e) => setUStatus(e.target.value)}>
                <option value="VACANT">Vacant</option>
                <option value="BOOKED">Booked</option>
                <option value="SOLD">Sold</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="u-client">Client Name (if booked/sold)</label>
            <input id="u-client" type="text" className="form-input" placeholder="e.g. John Doe" value={uClientName} onChange={(e) => setUClientName(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card">
      <div className="card-body" style={{ padding: 'var(--space-4)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--space-2)',
        }}>
          {icon}
          {label}
        </div>
        <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-base)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

// Tasks tab subview
function ProjectTasksView({
  project,
  tasks,
  onToggleStatus,
  onDelete,
  onOpenCreateModal
}: {
  project: Project;
  tasks: any[];
  onToggleStatus: (id: string, current: string) => void;
  onDelete: (id: string) => void;
  onOpenCreateModal: () => void;
}) {
  const [filter, setFilter] = useState('All');
  const taskStatusFilters = ['All', 'To Do', 'In Progress', 'Done', 'Blocked'];

  const filterMap: Record<string, string> = {
    'To Do': 'TODO',
    'In Progress': 'IN_PROGRESS',
    'Done': 'DONE',
    'Blocked': 'BLOCKED'
  };

  const statusConfig: Record<string, { icon: typeof Circle; color: string; label: string }> = {
    TODO: { icon: Circle, color: 'var(--color-text-muted)', label: 'To Do' },
    IN_PROGRESS: { icon: Clock, color: 'var(--color-primary)', label: 'In Progress' },
    DONE: { icon: CheckCircle2, color: 'var(--color-success)', label: 'Done' },
    BLOCKED: { icon: AlertCircle, color: 'var(--color-danger)', label: 'Blocked' },
  };

  const filteredTasks = filter === 'All'
    ? tasks
    : tasks.filter(t => t.status === filterMap[filter]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h2 className="section-title" style={{ margin: 0 }}>Project Tasks Ledger</h2>
        <button className="btn btn-primary btn-sm" onClick={onOpenCreateModal}>
          <Plus size={16} /> Create Task
        </button>
      </div>

      {/* Filter chips */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-4)' }}>
        {taskStatusFilters.map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={<Circle size={36} />}
          title="No tasks matching filter"
          description="Create a task or change filter settings."
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filteredTasks.map((t) => {
            const StatusIcon = statusConfig[t.status]?.icon || Circle;
            return (
              <div key={t.id} className="list-card hover-row" id={`task-${t.id}`}>
                <div
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => onToggleStatus(t.id, t.status)}
                  title="Click to cycle status"
                >
                  <StatusIcon size={20} color={statusConfig[t.status]?.color || 'gray'} />
                </div>
                <div className="list-card-content" onClick={() => onToggleStatus(t.id, t.status)} style={{ cursor: 'pointer' }}>
                  <div className="list-card-title" style={{ textDecoration: t.status === 'DONE' ? 'line-through' : 'none', color: t.status === 'DONE' ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                    {t.title}
                  </div>
                  <div className="list-card-subtitle">
                    Assignee: {t.assignee?.name || 'Unassigned'}
                    {t.due_date && ` · Due: ${new Date(t.due_date).toLocaleDateString('en-GB')}`}
                  </div>
                </div>
                <div className="list-card-meta" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <span className="badge" style={{ background: '#F3F4F6', color: '#374151', textTransform: 'capitalize' }}>
                    {t.status.toLowerCase().replace('_', ' ')}
                  </span>
                  <button className="btn btn-ghost btn-sm text-danger btn-icon" onClick={() => onDelete(t.id)}>
                    <Trash2 size={16} color="#EF4444" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


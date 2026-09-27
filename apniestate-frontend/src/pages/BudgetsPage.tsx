import React, { useState, useEffect, useMemo, type FormEvent } from 'react';
import {
  Plus,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  HardHat,
  Package,
  Wrench,
  Users,
  Building,
  ShieldAlert,
  Search,
  RefreshCw,
  Info,
  X,
  Layers,
  ChevronDown,
  BarChart3,
  Percent,
  Coins
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import { budgetsApi, type Budget } from '@/api/budgets';
import { useProject } from '@/context/ProjectContext';


// ─── Utility Functions ─────────────────────────────────────────

function fmtRupees(n: number | null | undefined): string {
  if (n === null || n === undefined) return '₹0';
  const val = Math.round(n);
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(1)} K`;
  return `₹${val.toLocaleString('en-IN')}`;
}

function rupeesInWords(val: number): string {
  if (!val || val <= 0) return 'Zero Rupees';
  if (val >= 10000000) {
    const cr = (val / 10000000).toFixed(2);
    return `${cr} Crore Rupees`;
  }
  if (val >= 100000) {
    const lakh = (val / 100000).toFixed(2);
    return `${lakh} Lakh Rupees`;
  }
  if (val >= 1000) {
    const k = (val / 1000).toFixed(1);
    return `${k} Thousand Rupees`;
  }
  return `${val.toLocaleString('en-IN')} Rupees`;
}

// ─── Category Configuration (Simple English, No Hinglish) ──────

interface CategoryMeta {
  key: Budget['category'];
  name: string;
  description: string;
  icon: React.ReactNode;
  bgLight: string;
  borderLight: string;
  textColor: string;
  defaultShare: number; // for recommended preset calculation
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'MATERIALS',
    name: 'Materials',
    description: 'Cement, steel, sand, aggregate, bricks, tiles & paint',
    icon: <Package size={18} className="text-blue-600" />,
    bgLight: 'bg-blue-50/70',
    borderLight: 'border-blue-200',
    textColor: 'text-blue-700',
    defaultShare: 0.45,
  },
  {
    key: 'LABOUR',
    name: 'Labour & Workforce',
    description: 'Daily muster wages, masons, helpers, bar benders & overtime',
    icon: <HardHat size={18} className="text-amber-600" />,
    bgLight: 'bg-amber-50/70',
    borderLight: 'border-amber-200',
    textColor: 'text-amber-700',
    defaultShare: 0.25,
  },
  {
    key: 'SUBCONTRACT',
    name: 'Subcontracts & Contractors',
    description: 'Electrical, plumbing, fabrication & specialty work packages',
    icon: <Users size={18} className="text-indigo-600" />,
    bgLight: 'bg-indigo-50/70',
    borderLight: 'border-indigo-200',
    textColor: 'text-indigo-700',
    defaultShare: 0.12,
  },
  {
    key: 'EQUIPMENT',
    name: 'Equipment & Machinery',
    description: 'JCB, concrete mixer, crane rental, diesel fuel & operator',
    icon: <Wrench size={18} className="text-orange-600" />,
    bgLight: 'bg-orange-50/70',
    borderLight: 'border-orange-200',
    textColor: 'text-orange-700',
    defaultShare: 0.08,
  },
  {
    key: 'OVERHEAD',
    name: 'Site Overheads & Office',
    description: 'Site office setup, tea, water, municipal permits & petty cash',
    icon: <Building size={18} className="text-emerald-600" />,
    bgLight: 'bg-emerald-50/70',
    borderLight: 'border-emerald-200',
    textColor: 'text-emerald-700',
    defaultShare: 0.05,
  },
  {
    key: 'CONTINGENCY',
    name: 'Emergency Buffer (Contingency)',
    description: 'Reserve buffer for sudden price increases or rainy weather',
    icon: <ShieldAlert size={18} className="text-purple-600" />,
    bgLight: 'bg-purple-50/70',
    borderLight: 'border-purple-200',
    textColor: 'text-purple-700',
    defaultShare: 0.05,
  },
  {
    key: 'OTHER',
    name: 'Other Expenses',
    description: 'Any extra miscellaneous project expenses',
    icon: <Layers size={18} className="text-gray-600" />,
    bgLight: 'bg-gray-50/70',
    borderLight: 'border-gray-200',
    textColor: 'text-gray-700',
    defaultShare: 0.0,
  },
];

function getCategoryMeta(cat: string): CategoryMeta {
  const c = cat.toUpperCase();
  if (c === 'MATERIAL') return CATEGORIES[0];
  if (c === 'SUBCONTRACTS') return CATEGORIES[2];
  if (c === 'GENERAL' || c === 'OFFICE') return CATEGORIES[4];
  const found = CATEGORIES.find((m) => m.key === c);
  return found || CATEGORIES[6];
}

// ─── Custom Interactive Chart Tooltip ──────────────────────────

const BudgetChartTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 text-xs min-w-[210px] z-50 animate-in fade-in zoom-in-95 duration-100">
        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-1.5 mb-2">
          <p className="font-bold text-gray-900">{d.fullName}</p>
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
            d.isOverrun
              ? 'bg-red-100 text-red-800'
              : d.pct >= 80
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {d.isOverrun ? 'Overrun' : `${d.pct}% Used`}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-indigo-300" /> Planned Budget:
            </span>
            <strong className="text-gray-900">{fmtRupees(d.allocated)}</strong>
          </div>

          <div className="flex items-center justify-between text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-indigo-600" /> Money Spent:
            </span>
            <strong className="text-indigo-600">{fmtRupees(d.spent)}</strong>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-gray-500">
              {d.isOverrun ? 'Over Budget By:' : 'Money Left:'}
            </span>
            <strong className={d.isOverrun ? 'text-red-600' : 'text-emerald-700'}>
              {d.isOverrun ? `+${fmtRupees(d.overrunAmount)}` : fmtRupees(d.remaining)}
            </strong>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// ─── Main Component ────────────────────────────────────────────

export default function BudgetsPage() {
  const { activeProjectId, activeProject, projects, setActiveProjectId } = useProject();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'OVERRUN' | 'NEAR_LIMIT' | 'ON_TRACK'>('ALL');
  const [chartView, setChartView] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState<Budget['category']>('MATERIALS');
  const [formAllocated, setFormAllocated] = useState<number | ''>(0);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Preset Form
  const [presetTotalAmount, setPresetTotalAmount] = useState<number>(
    activeProject?.budget && activeProject.budget > 0 ? activeProject.budget : 5000000
  );
  const [applyingPreset, setApplyingPreset] = useState(false);

  // Success Notice
  const [notice, setNotice] = useState<string | null>(null);
  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  // Fetch real project budgets
  const fetchBudgets = async () => {
    if (!activeProjectId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await budgetsApi.getBudgetsByProject(activeProjectId);
      if (res.data) {
        setBudgets(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load project budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [activeProjectId]);

  useEffect(() => {
    if (activeProject?.budget && activeProject.budget > 0) {
      setPresetTotalAmount(activeProject.budget);
    }
  }, [activeProject]);

  // Aggregate Metrics
  const totalAllocated = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (b.allocated || 0), 0);
  }, [budgets]);

  const totalSpent = useMemo(() => {
    return budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  }, [budgets]);

  const moneyLeft = totalAllocated - totalSpent;
  const overallUtilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  // Overrun / Leakages
  const overruns = useMemo(() => {
    return budgets.filter((b) => b.allocated > 0 && b.spent > b.allocated);
  }, [budgets]);

  const totalLeakageAmount = useMemo(() => {
    return overruns.reduce((sum, b) => sum + (b.spent - b.allocated), 0);
  }, [overruns]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    return budgets.map((b) => {
      const meta = getCategoryMeta(b.category);
      const allocated = b.allocated || 0;
      const spent = b.spent || 0;
      const remaining = allocated - spent;
      const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
      const isOverrun = allocated > 0 && spent > allocated;

      return {
        id: b.id,
        category: b.category,
        name: meta.name.split(' ')[0], // short name e.g. "Materials", "Labour"
        fullName: meta.name,
        allocated,
        spent,
        remaining,
        pct,
        isOverrun,
        overrunAmount: isOverrun ? spent - allocated : 0,
      };
    });
  }, [budgets]);

  const topAllocatedItem = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.allocated - a.allocated)[0];
  }, [chartData]);

  const topSpentItem = useMemo(() => {
    if (chartData.length === 0) return null;
    return [...chartData].sort((a, b) => b.spent - a.spent)[0];
  }, [chartData]);


  // Filtering
  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const meta = getCategoryMeta(b.category);
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = meta.name.toLowerCase().includes(q);
        const matchDesc = (b.description || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }
      if (filter === 'OVERRUN') return b.allocated > 0 && b.spent > b.allocated;
      if (filter === 'NEAR_LIMIT') {
        const pct = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
        return pct >= 80 && pct <= 100;
      }
      if (filter === 'ON_TRACK') {
        const pct = b.allocated > 0 ? (b.spent / b.allocated) * 100 : 0;
        return pct < 80;
      }
      return true;
    });
  }, [budgets, search, filter]);

  // Modal Handlers
  const handleOpenCreate = () => {
    setSelectedBudget(null);
    setFormCategory('MATERIALS');
    setFormAllocated('');
    setFormDescription('');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setSelectedBudget(b);
    setFormCategory(b.category);
    setFormAllocated(b.allocated);
    setFormDescription(b.description || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveBudget = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;
    if (formAllocated === '' || Number(formAllocated) <= 0) {
      setFormError('Please enter a planned budget amount greater than 0.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      if (selectedBudget) {
        await budgetsApi.updateBudget(selectedBudget.id, {
          category: formCategory,
          allocated: Number(formAllocated),
          description: formDescription || null,
        });
        showNotice(`Budget for ${getCategoryMeta(formCategory).name} updated successfully.`);
      } else {
        await budgetsApi.createBudget({
          project_id: activeProjectId,
          category: formCategory,
          allocated: Number(formAllocated),
          description: formDescription || null,
        });
        showNotice(`Budget for ${getCategoryMeta(formCategory).name} saved successfully.`);
      }
      setShowModal(false);
      fetchBudgets();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save budget.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (id: string, catName: string) => {
    if (!confirm(`Are you sure you want to remove the budget for ${catName}?`)) return;
    try {
      await budgetsApi.deleteBudget(id);
      showNotice(`Budget for ${catName} removed.`);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Failed to remove budget.');
    }
  };

  const handleApplyPreset = async () => {
    if (!activeProjectId || presetTotalAmount <= 0) return;
    setApplyingPreset(true);
    try {
      await budgetsApi.applyPreset(activeProjectId, presetTotalAmount);
      showNotice(`Recommended budget of ${fmtRupees(presetTotalAmount)} configured across all key construction heads.`);
      setShowPresetModal(false);
      fetchBudgets();
    } catch (err: any) {
      alert(err.message || 'Failed to apply preset.');
    } finally {
      setApplyingPreset(false);
    }
  };

  // If no project selected
  if (!activeProjectId) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-lg mx-auto my-8 shadow-xs">
        <Layers size={36} className="text-gray-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Select a Project First</h3>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          Budgets are specific to each site project. Please select a project from above to view and configure its budget.
        </p>
        {projects && projects.length > 0 && (
          <div className="flex justify-center">
            <select
              value=""
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none cursor-pointer"
            >
              <option value="">-- Choose a Project --</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ─── SUCCESS NOTICE ─── */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-600 hover:text-emerald-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── HEADER & ACTIONS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Project Budget
            </span>
            <span className="text-xs font-bold text-gray-500 truncate max-w-xs">
              {activeProject?.name || 'Selected Project'}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1 leading-tight">
            Target Budgets & Connected Spending
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Set planned amounts for Labour, Materials, and Machines. Actual spending updates live from site records.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPresetModal(true)}
            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Automatically divide project budget into standard Indian construction heads"
          >
            <Sparkles size={13} className="text-indigo-600" />
            <span>Recommended Preset</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Budget Item</span>
          </button>
        </div>
      </div>

      {/* ─── TOP 4 METRIC CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Planned Budget */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Planned Budget</p>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">
            {fmtRupees(totalAllocated)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
            {rupeesInWords(totalAllocated)}
          </p>
        </div>

        {/* Money Spent */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Money Spent</p>
          <p className="text-lg sm:text-xl font-black text-indigo-600 mt-1">
            {fmtRupees(totalSpent)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
            Live from site logs & orders
          </p>
        </div>

        {/* Money Left */}
        <div className={`rounded-2xl border p-3.5 shadow-2xs ${
          moneyLeft < 0 ? 'bg-red-50/80 border-red-200' : 'bg-white border-gray-200'
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {moneyLeft < 0 ? 'Over Budget By' : 'Money Left (Balance)'}
          </p>
          <p className={`text-lg sm:text-xl font-black mt-1 ${
            moneyLeft < 0 ? 'text-red-700' : 'text-emerald-700'
          }`}>
            {moneyLeft < 0 ? `-${fmtRupees(Math.abs(moneyLeft))}` : fmtRupees(moneyLeft)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5 truncate">
            {moneyLeft < 0 ? 'Cost overrun detected' : `${Math.max(0, 100 - overallUtilization)}% balance available`}
          </p>
        </div>

        {/* Budget Health */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Budget Health</p>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              overruns.length > 0
                ? 'bg-red-100 text-red-800'
                : overallUtilization >= 80
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {overruns.length > 0 ? 'Cost Overrun' : overallUtilization >= 80 ? 'Near Limit' : 'On Track'}
            </span>
          </div>
          <p className="text-lg sm:text-xl font-black text-gray-900 mt-1">
            {overallUtilization}% <span className="text-xs font-semibold text-gray-400 font-normal">used</span>
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overruns.length > 0
                  ? 'bg-red-500'
                  : overallUtilization >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallUtilization)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ─── MONEY LEAKAGE ALERT BANNER ─── */}
      {overruns.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs animate-in fade-in">
          <div className="size-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs sm:text-sm font-bold text-red-900">
                Money Leakage Alert: {overruns.length} {overruns.length === 1 ? 'Category' : 'Categories'} Exceeded Planned Budget
              </h4>
              <span className="text-[10px] font-extrabold bg-red-200 text-red-800 px-2 py-0.5 rounded-md">
                Total Overrun: {fmtRupees(totalLeakageAmount)}
              </span>
            </div>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              Actual spending in {overruns.map((o) => getCategoryMeta(o.category).name).join(', ')} has crossed the allocated limit. Project Intelligence is analyzing this to prevent further money loss.
            </p>
          </div>
        </div>
      )}

      {/* ─── SMART BUDGET BAR GRAPH VISUAL ─── */}
      {budgets.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-2xs">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <BarChart3 size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900">
                    Budget Visual Analytics
                  </h3>
                  {topAllocatedItem && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">
                      Top Target: {topAllocatedItem.name} ({fmtRupees(topAllocatedItem.allocated)})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  Side-by-side comparison of planned targets against live site spending across categories
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center self-start sm:self-auto bg-gray-100/80 p-0.5 rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setChartView('AMOUNT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartView === 'AMOUNT'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Coins size={13} />
                <span>₹ Amount</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView('PERCENT')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  chartView === 'PERCENT'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Percent size={13} />
                <span>% Used</span>
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="w-full h-64 sm:h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'AMOUNT' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => fmtRupees(val)}
                    axisLine={false}
                    tickLine={false}
                    width={68}
                  />
                  <RechartsTooltip content={<BudgetChartTooltip />} />
                  <Bar
                    dataKey="allocated"
                    name="Planned Budget"
                    fill="#e0e7ff"
                    stroke="#818cf8"
                    strokeWidth={1}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="spent"
                    name="Money Spent"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  >
                    {chartData.map((entry, index) => {
                      let fillColor = '#4f46e5';
                      if (entry.isOverrun) fillColor = '#ef4444';
                      else if (entry.pct >= 80) fillColor = '#f59e0b';
                      return <Cell key={`cell-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 18, right: 12, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(val) => `${val}%`}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 20) * 20)]}
                    width={46}
                  />
                  <RechartsTooltip content={<BudgetChartTooltip />} />
                  <ReferenceLine
                    y={100}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '100% Target Limit',
                      position: 'top',
                      fill: '#ef4444',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                  <Bar
                    dataKey="pct"
                    name="% Budget Used"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={54}
                  >
                    {chartData.map((entry, index) => {
                      let fillColor = '#10b981';
                      if (entry.isOverrun) fillColor = '#ef4444';
                      else if (entry.pct >= 80) fillColor = '#f59e0b';
                      return <Cell key={`pct-cell-${index}`} fill={fillColor} />;
                    })}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Interactive Legend & Key Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-1 border-t border-gray-100 text-xs">
            <div className="flex flex-wrap items-center gap-3 text-gray-600">
              {chartView === 'AMOUNT' ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-indigo-100 border border-indigo-400" />
                    <span className="font-medium text-[11px]">Planned Target</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-indigo-600" />
                    <span className="font-medium text-[11px]">Spent (On Track)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-amber-500" />
                    <span className="font-medium text-[11px]">Near Limit (80%+)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-red-500" />
                    <span className="font-medium text-[11px]">Over Budget</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-emerald-500" />
                    <span className="font-medium text-[11px]">Normal (&lt;80%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-amber-500" />
                    <span className="font-medium text-[11px]">Caution (80–100%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-red-500" />
                    <span className="font-medium text-[11px]">Overrun (&gt;100%)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-red-600 font-semibold text-[11px]">
                    <span className="w-4 border-b-2 border-dashed border-red-500 inline-block" />
                    <span>100% Target Cap</span>
                  </div>
                </>
              )}
            </div>

            {/* Quick Spend ratio indicator */}
            <div className="text-[11px] text-gray-500 font-medium ml-auto">
              Total Spending: <strong className="text-gray-900">{fmtRupees(totalSpent)}</strong> of <strong className="text-gray-900">{fmtRupees(totalAllocated)}</strong> ({overallUtilization}%)
            </div>
          </div>
        </div>
      )}

      {/* ─── SEARCH & FILTER ROW ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'ALL'
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            All Items ({budgets.length})
          </button>

          {overruns.length > 0 && (
            <button
              type="button"
              onClick={() => setFilter('OVERRUN')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                filter === 'OVERRUN'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
              }`}
            >
              <AlertTriangle size={12} /> Over Budget ({overruns.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setFilter('NEAR_LIMIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'NEAR_LIMIT'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            Near Limit (80%+)
          </button>

          <button
            type="button"
            onClick={() => setFilter('ON_TRACK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filter === 'ON_TRACK'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white border border-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            On Track
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[200px]">
          <Search size={13} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search budget items..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {/* ─── BUDGET LIST / CARDS ─── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Loading project budgets...</p>
        </div>
      ) : filteredBudgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 sm:p-12 text-center">
          <Layers size={36} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-900">
            {budgets.length === 0 ? 'No Budgets Configured for This Project' : 'No Matching Budget Items Found'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
            {budgets.length === 0
              ? 'Set up target spending limits for Labour, Materials, Machinery, and Contractors so your team can track actual costs in real-time.'
              : 'Try changing your search term or filter pill above.'}
          </p>
          {budgets.length === 0 && (
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <button
                type="button"
                onClick={() => setShowPresetModal(true)}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} className="text-indigo-600" />
                <span>1-Click Recommended Setup</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Add Custom Budget Item</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredBudgets.map((b) => {
            const meta = getCategoryMeta(b.category);
            const spent = b.spent || 0;
            const allocated = b.allocated || 0;
            const remaining = allocated - spent;
            const pct = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
            const isOverrun = allocated > 0 && spent > allocated;
            const overrunAmount = isOverrun ? spent - allocated : 0;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl border p-4 transition-all shadow-2xs hover:shadow-xs ${
                  isOverrun ? 'border-red-200 bg-red-50/10' : 'border-gray-200'
                }`}
              >
                {/* Card Top: Icon, Name, and Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${meta.bgLight} ${meta.borderLight}`}>
                      {meta.icon}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {meta.name}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                        {b.description || meta.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isOverrun
                        ? 'bg-red-100 text-red-800'
                        : pct >= 80
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isOverrun ? 'Over Budget' : pct >= 80 ? 'Near Limit' : 'On Track'}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Edit amount"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBudget(b.id, meta.name)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Remove category"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Card Middle: 3 Numbers (Planned, Spent, Left) */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400">Planned</span>
                    <p className="text-xs font-bold text-gray-900 mt-0.5">{fmtRupees(allocated)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400">Spent</span>
                    <p className="text-xs font-bold text-indigo-700 mt-0.5">{fmtRupees(spent)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400">
                      {isOverrun ? 'Overrun' : 'Remaining'}
                    </span>
                    <p className={`text-xs font-bold mt-0.5 ${isOverrun ? 'text-red-700' : 'text-emerald-700'}`}>
                      {isOverrun ? `+${fmtRupees(overrunAmount)}` : fmtRupees(remaining)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Details */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-gray-500 font-medium">Spending Progress</span>
                    <span className={`font-bold ${isOverrun ? 'text-red-600' : 'text-gray-700'}`}>
                      {pct}% used
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverrun ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                {/* Overrun Leakage Note */}
                {isOverrun && (
                  <div className="mt-2.5 p-2 bg-red-50/80 border border-red-200 rounded-lg flex items-center gap-1.5 text-[10px] text-red-700 font-semibold">
                    <AlertTriangle size={12} className="text-red-500 shrink-0" />
                    <span>Spent is {fmtRupees(overrunAmount)} above planned limit!</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── ADD / EDIT BUDGET MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {selectedBudget ? 'Edit Budget Amount' : 'Add Category Budget'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Set target spending limit for {activeProject?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Budget Head / Category *
                </label>
                <div className="relative">
                  <select
                    disabled={!!selectedBudget}
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {getCategoryMeta(formCategory).description}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                    Planned Budget Amount (₹) *
                  </label>
                  {Number(formAllocated) > 0 && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {rupeesInWords(Number(formAllocated))}
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  required
                  placeholder="e.g. 500000"
                  value={formAllocated}
                  onChange={(e) => setFormAllocated(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/20"
                />

                {/* Quick Increment Buttons (Easy for 10th pass site supervisor) */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-medium">Quick Add:</span>
                  {[50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setFormAllocated((prev) => (Number(prev) || 0) + amt)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 rounded-md border border-gray-200 transition-colors cursor-pointer"
                    >
                      +{fmtRupees(amt)}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormAllocated(0)}
                    className="px-2 py-0.5 text-[10px] font-semibold text-gray-400 hover:text-red-600 ml-auto cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Scope Note / Purpose (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. G+1 structure mason wages, shuttering and daily muster"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 1-CLICK RECOMMENDED PRESET MODAL ─── */}
      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Recommended Project Budget Preset</h3>
                  <p className="text-[11px] text-gray-500">Standard Indian construction cost distribution</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Total Project Construction Budget (₹)
                </label>
                <input
                  type="number"
                  min="100000"
                  step="50000"
                  value={presetTotalAmount}
                  onChange={(e) => setPresetTotalAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-base font-black text-indigo-900 border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-400/20 bg-indigo-50/30"
                />
                <p className="text-xs font-semibold text-indigo-700 mt-1">
                  {rupeesInWords(presetTotalAmount)}
                </p>
              </div>

              {/* Preview Splits */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
                  How This Budget Will Be Allocated:
                </p>
                {CATEGORIES.filter((c) => c.defaultShare > 0).map((c) => {
                  const amt = Math.round(presetTotalAmount * c.defaultShare);
                  return (
                    <div key={c.key} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{c.name}</span>
                        <span className="text-[10px] text-gray-400">({Math.round(c.defaultShare * 100)}%)</span>
                      </div>
                      <span className="font-bold text-gray-900">{fmtRupees(amt)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-[11px] text-blue-800">
                <Info size={14} className="shrink-0 text-blue-600" />
                <span>You can edit or adjust each category individual amount anytime later.</span>
              </div>

              <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPresetModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={applyingPreset || presetTotalAmount <= 0}
                  onClick={handleApplyPreset}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {applyingPreset ? 'Applying...' : 'Apply Recommended Budget'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

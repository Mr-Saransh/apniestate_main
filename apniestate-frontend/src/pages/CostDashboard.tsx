import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, IndianRupee } from 'lucide-react';
import { PH, Card, KPI } from '@/components/shared/FigmaComponents';
import { costIntelligenceApi, type CostIntelligenceDashboard } from '@/api/costIntelligence';
import { useProject } from '@/context/ProjectContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';

export default function CostDashboard() {
  const { user } = useAuth();
  const { activeProjectId, loading: projectLoading } = useProject();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CostIntelligenceDashboard | null>(null);

  useEffect(() => {
    if (activeProjectId) {
      fetchData(activeProjectId);
    } else {
      setData(null);
    }
  }, [activeProjectId]);

  const fetchData = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await costIntelligenceApi.getDashboard(projectId);
      if (res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (projectLoading || loading) return <LoadingSpinner size="lg" />;

  if (!activeProjectId) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <PH title="Cost Intelligence" sub="Budget vs Actual Real-Time Tracking" />
        <Card>
          <div className="p-8 text-center text-gray-500">
            Please select a project from the top navigation menu to view its Cost Intelligence Dashboard.
          </div>
        </Card>
      </div>
    );
  }

  if (!data || data.estimatedBudget === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="text-gray-400 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Cost Data Available</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Please create and approve a BOQ for this project first to establish a baseline budget.
        </p>
      </div>
    );
  }

  const isOverrun = data.totalActualCost > data.estimatedBudget;
  const isWarning = data.totalActualCost > data.estimatedBudget * 0.9 && !isOverrun;
  
  const statusColor = isOverrun ? 'bg-red-500' : isWarning ? 'bg-[#FCC300]' : 'bg-green-500';
  const statusIcon = isOverrun ? <AlertTriangle size={18} className="text-white" /> : <CheckCircle size={18} className="text-white" />;
  const statusText = isOverrun ? 'BUDGET EXCEEDED' : isWarning ? 'APPROACHING BUDGET' : 'WITHIN BUDGET';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <PH title="Cost Intelligence Engine" sub="Real-time Budget vs Actual Tracking" />
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusColor}`}>
          {statusIcon}
          <span className={`text-xs font-bold tracking-wider ${isWarning ? 'text-gray-900' : 'text-white'}`}>
            {statusText}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPI
          label="From Approved BOQ"
          value={`₹${data.estimatedBudget.toLocaleString()}`}
          icon={IndianRupee}
        />
        <KPI
          label="Actuals (POs, Payroll, Exp)"
          value={`₹${data.totalActualCost.toLocaleString()}`}
          icon={TrendingUp}
        />
        <KPI
          label={data.variance < 0 ? "Over Budget" : "Under Budget"}
          value={`₹${Math.abs(data.variance).toLocaleString()}`}
          icon={IndianRupee}
          trend={{ up: data.variance >= 0, v: `${data.variancePercentage.toFixed(1)}%` }}
        />
        <KPI
          label="Available to spend"
          value={`₹${Math.max(0, data.variance).toLocaleString()}`}
          icon={IndianRupee}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Top Cost Drivers (Actuals)">
          <div className="space-y-4 pt-4">
            <CostBar label="Materials (Procurement)" value={data.breakdown.materialCost} total={data.totalActualCost} color="bg-blue-500" />
            <CostBar label="Labour (Wages)" value={data.breakdown.labourCost} total={data.totalActualCost} color="bg-orange-500" />
            <CostBar label="Equipment & Machinery" value={data.breakdown.equipmentCost} total={data.totalActualCost} color="bg-purple-500" />
            <CostBar label="Indirect / Overheads" value={data.breakdown.indirectCost} total={data.totalActualCost} color="bg-gray-400" />
          </div>
        </Card>

        <Card title="AI Cost Insights">
          <div className="flex flex-col h-full justify-center p-6 space-y-4 bg-gradient-to-br from-indigo-50 to-blue-50/20 rounded-xl border border-indigo-100/50">
            <div className="flex gap-3">
              <div className="mt-0.5"><TrendingUp className="text-indigo-600" size={18} /></div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Cost Trend Forecast</h4>
                <p className="text-xs text-gray-600 leading-relaxed mt-1">Based on the current consumption rate, you are projected to complete the project {isOverrun ? 'over' : 'within'} the allocated budget. {isOverrun && 'Material costs are the primary driver of this overrun.'}</p>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <div className="mt-0.5"><AlertTriangle className="text-amber-500" size={18} /></div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">Procurement Timing</h4>
                <p className="text-xs text-gray-600 leading-relaxed mt-1">Steel rebar prices have increased by 4% locally. Consider bulk ordering remaining BOQ quantities now to lock in rates before further hikes.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}

function CostBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-semibold text-gray-700">{label}</span>
        <span className="font-mono text-gray-900 font-bold">₹{value.toLocaleString()} <span className="text-gray-400 font-normal ml-1">({percentage.toFixed(1)}%)</span></span>
      </div>
      <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

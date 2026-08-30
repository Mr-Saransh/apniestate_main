import React, { useState, useEffect } from 'react';
import {
  X, Users, Zap, Scale, Sliders, CheckCircle2, AlertCircle, Sparkles,
  ArrowRight, UserCheck, ShieldCheck, RefreshCw, Check
} from 'lucide-react';
import { crmApi, type CrmTeamMember, type CrmLead } from '@/api/crm';

interface DistributeLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedLeadIds?: string[];
  allLeads?: CrmLead[];
  unassignedCount?: number;
}

export default function DistributeLeadsModal({
  isOpen,
  onClose,
  onSuccess,
  selectedLeadIds = [],
  allLeads = [],
  unassignedCount = 0,
}: DistributeLeadsModalProps) {
  const [teamMembers, setTeamMembers] = useState<CrmTeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  // Configuration
  const [scope, setScope] = useState<'SELECTED' | 'UNASSIGNED' | 'ALL'>('SELECTED');
  const [strategy, setStrategy] = useState<'ROUND_ROBIN' | 'LOAD_BALANCED' | 'CUSTOM'>('ROUND_ROBIN');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customCounts, setCustomCounts] = useState<Record<string, number>>({});

  const [distributing, setDistributing] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch team members on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchTeam = async () => {
      try {
        setLoadingTeam(true);
        const res = await crmApi.getTeam();
        if (res.success && res.data) {
          const eligible = res.data.members.filter(
            (m) => m.status === 'ACTIVE' && m.crm_role !== 'BUILDER'
          );
          setTeamMembers(eligible);
          setSelectedUserIds(eligible.map((m) => m.id));

          // Initialize custom counts
          const initCounts: Record<string, number> = {};
          eligible.forEach((m) => {
            initCounts[m.id] = 0;
          });
          setCustomCounts(initCounts);
        }
      } catch (err: any) {
        console.error('Failed to load team:', err);
      } finally {
        setLoadingTeam(false);
      }
    };

    fetchTeam();

    // Default scope
    if (selectedLeadIds.length > 0) {
      setScope('SELECTED');
    } else if (unassignedCount > 0) {
      setScope('UNASSIGNED');
    } else {
      setScope('ALL');
    }
  }, [isOpen, selectedLeadIds.length, unassignedCount]);

  if (!isOpen) return null;

  // Calculate number of leads to distribute
  let totalLeadsToDistribute = 0;
  if (scope === 'SELECTED') {
    totalLeadsToDistribute = selectedLeadIds.length;
  } else if (scope === 'UNASSIGNED') {
    totalLeadsToDistribute = unassignedCount || allLeads.filter((l) => !l.assigned_to).length;
  } else {
    totalLeadsToDistribute = allLeads.length;
  }

  const selectedMembers = teamMembers.filter((m) => selectedUserIds.includes(m.id));

  // Toggle user selection
  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      if (selectedUserIds.length === 1) return; // Keep at least one
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const selectAllUsers = () => setSelectedUserIds(teamMembers.map((m) => m.id));
  const deselectAllUsers = () => {
    if (teamMembers.length > 0) setSelectedUserIds([teamMembers[0].id]);
  };

  // Preview allocations calculation
  const previewAllocations: { userId: string; name: string; count: number; currentLeads: number }[] = [];
  if (selectedMembers.length > 0 && totalLeadsToDistribute > 0) {
    if (strategy === 'CUSTOM') {
      selectedMembers.forEach((m) => {
        previewAllocations.push({
          userId: m.id,
          name: m.name,
          count: customCounts[m.id] || 0,
          currentLeads: m.assigned_leads_count || 0,
        });
      });
    } else if (strategy === 'LOAD_BALANCED') {
      // Workload balanced preview
      const workloads = selectedMembers.map((m) => ({
        userId: m.id,
        name: m.name,
        current: m.assigned_leads_count || 0,
        assigned: 0,
      }));

      for (let i = 0; i < totalLeadsToDistribute; i++) {
        workloads.sort((a, b) => (a.current + a.assigned) - (b.current + b.assigned));
        workloads[0].assigned++;
      }

      workloads.forEach((w) => {
        previewAllocations.push({
          userId: w.userId,
          name: w.name,
          count: w.assigned,
          currentLeads: w.current,
        });
      });
    } else {
      // Round robin preview
      const base = Math.floor(totalLeadsToDistribute / selectedMembers.length);
      const remainder = totalLeadsToDistribute % selectedMembers.length;

      selectedMembers.forEach((m, idx) => {
        const count = base + (idx < remainder ? 1 : 0);
        previewAllocations.push({
          userId: m.id,
          name: m.name,
          count,
          currentLeads: m.assigned_leads_count || 0,
        });
      });
    }
  }

  const handleExecute = async () => {
    if (totalLeadsToDistribute === 0) {
      setErrorMsg('No leads available to distribute in the selected scope');
      return;
    }
    if (selectedUserIds.length === 0) {
      setErrorMsg('Please select at least one recipient team member');
      return;
    }

    setErrorMsg('');
    setResultMsg('');
    setDistributing(true);

    try {
      let leadIdsToSend: string[] | undefined = undefined;
      let distributeUnassigned = false;

      if (scope === 'SELECTED') {
        leadIdsToSend = selectedLeadIds;
      } else if (scope === 'UNASSIGNED') {
        distributeUnassigned = true;
      } else {
        leadIdsToSend = allLeads.map((l) => l.id);
      }

      const res = await crmApi.distributeLeads({
        lead_ids: leadIdsToSend,
        distribute_unassigned: distributeUnassigned,
        strategy,
        target_user_ids: selectedUserIds,
        custom_allocations:
          strategy === 'CUSTOM'
            ? selectedMembers.map((m) => ({ user_id: m.id, count: customCounts[m.id] || 0 }))
            : undefined,
      });

      if (res.success && res.data) {
        setResultMsg(res.data.message || 'Leads distributed successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        const err = typeof res.error === 'string' ? res.error : res.error?.message || 'Failed to distribute leads';
        setErrorMsg(err);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Distribution request failed');
    } finally {
      setDistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-gradient-to-tr from-[#2648E7] to-[#4F6DFF] text-white flex items-center justify-center shadow-md shadow-[#2648E7]/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Smart Lead Distribution</h2>
              <p className="text-xs text-slate-500">
                Automated & balanced lead allocation to telecallers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resultMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{resultMsg}</span>
            </div>
          )}

          {/* Step 1: Select Lead Pool */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              1. Select Leads Source
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('SELECTED')}
                disabled={selectedLeadIds.length === 0}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  scope === 'SELECTED'
                    ? 'border-[#2648E7] bg-blue-50/60 ring-2 ring-[#2648E7]/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span className="block text-[11px] font-bold text-slate-500">Selected Leads</span>
                <span className="block text-lg font-black text-slate-900 mt-0.5">
                  {selectedLeadIds.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope('UNASSIGNED')}
                disabled={unassignedCount === 0 && allLeads.filter((l) => !l.assigned_to).length === 0}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  scope === 'UNASSIGNED'
                    ? 'border-[#2648E7] bg-blue-50/60 ring-2 ring-[#2648E7]/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <span className="block text-[11px] font-bold text-slate-500">Unassigned Pool</span>
                <span className="block text-lg font-black text-amber-600 mt-0.5">
                  {unassignedCount || allLeads.filter((l) => !l.assigned_to).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  scope === 'ALL'
                    ? 'border-[#2648E7] bg-blue-50/60 ring-2 ring-[#2648E7]/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <span className="block text-[11px] font-bold text-slate-500">All List Leads</span>
                <span className="block text-lg font-black text-slate-900 mt-0.5">
                  {allLeads.length}
                </span>
              </button>
            </div>
          </div>

          {/* Step 2: Distribution Strategy */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              2. Choose Distribution Strategy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setStrategy('ROUND_ROBIN')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  strategy === 'ROUND_ROBIN'
                    ? 'border-[#2648E7] bg-blue-50/60 ring-2 ring-[#2648E7]/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-[#2648E7] mb-1">
                  <Zap size={16} />
                  <span className="text-xs font-black">Round-Robin</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Splits {totalLeadsToDistribute} leads evenly across chosen telecallers.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('LOAD_BALANCED')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  strategy === 'LOAD_BALANCED'
                    ? 'border-[#2648E7] bg-blue-50/60 ring-2 ring-[#2648E7]/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-indigo-600 mb-1">
                  <Scale size={16} />
                  <span className="text-xs font-black">Load-Balanced</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Gives more leads to telecallers with lower current lead counts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStrategy('CUSTOM')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  strategy === 'CUSTOM'
                    ? 'border-[#2648E7] bg-blue-50/60 ring-2 ring-[#2648E7]/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                  <Sliders size={16} />
                  <span className="text-xs font-black">Custom Split</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Manually define exact lead counts per telecaller.
                </p>
              </button>
            </div>
          </div>

          {/* Step 3: Select Telecallers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                3. Recipient Sales Team ({selectedUserIds.length}/{teamMembers.length} Selected)
              </label>
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#2648E7]">
                <button type="button" onClick={selectAllUsers} className="hover:underline">
                  Select All
                </button>
                <span>•</span>
                <button type="button" onClick={deselectAllUsers} className="hover:underline">
                  Clear
                </button>
              </div>
            </div>

            {loadingTeam ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading team members...</div>
            ) : teamMembers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                No active telecallers found in your company. Please create CRM members first.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {teamMembers.map((m) => {
                  const isSelected = selectedUserIds.includes(m.id);
                  const preview = previewAllocations.find((p) => p.userId === m.id);

                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleUser(m.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#2648E7]/60 bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-5 rounded-lg flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-[#2648E7] border-[#2648E7] text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>

                        <div className="size-8 rounded-xl bg-gradient-to-tr from-[#2648E7] to-[#4F6DFF] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {m.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{m.name}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600">
                              {m.crm_role === 'CRM_MANAGER' ? 'Manager' : 'Executive'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Current workload: <strong className="text-slate-700">{m.assigned_leads_count} leads</strong>
                          </p>
                        </div>
                      </div>

                      {/* Allocation display / input */}
                      {isSelected && (
                        <div>
                          {strategy === 'CUSTOM' ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min={0}
                                max={totalLeadsToDistribute}
                                value={customCounts[m.id] || 0}
                                onChange={(e) =>
                                  setCustomCounts({
                                    ...customCounts,
                                    [m.id]: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="w-16 px-2 py-1 text-xs font-bold text-center border border-[#2648E7] rounded-lg bg-white focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">leads</span>
                            </div>
                          ) : (
                            <span className="px-2 py-1 rounded-xl text-xs font-black bg-blue-100 text-[#2648E7]">
                              +{preview?.count || 0} leads
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 4: Live Summary */}
          {previewAllocations.length > 0 && totalLeadsToDistribute > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">Total Leads to Distribute</span>
                <span className="text-amber-400 font-black text-sm">{totalLeadsToDistribute} Leads</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-700/60">
                {previewAllocations.map((p) => (
                  <span
                    key={p.userId}
                    className="px-2 py-0.5 rounded-lg bg-white/10 text-[11px] font-medium text-slate-200"
                  >
                    {p.name}: <strong className="text-white">+{p.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={distributing || totalLeadsToDistribute === 0 || selectedUserIds.length === 0}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:opacity-95 shadow-md shadow-[#2648E7]/30 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {distributing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Distributing {totalLeadsToDistribute} Leads...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Distribute {totalLeadsToDistribute} Leads Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

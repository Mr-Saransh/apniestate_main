import React, { useState } from 'react';
import {
  Settings, Shield, Users, CheckCircle2, AlertCircle, Save,
  Building2, Sliders, BellRing, Database, Lock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CrmSettingsTab() {
  const { user } = useAuth();
  const [autoAssign, setAutoAssign] = useState(true);
  const [notifyOnNewLead, setNotifyOnNewLead] = useState(true);
  const [notifyOnFollowupOverdue, setNotifyOnFollowupOverdue] = useState(true);
  const [defaultCurrency, setDefaultCurrency] = useState('INR');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/20 border border-slate-200/80 shadow-md shadow-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#2648E7] text-white flex items-center justify-center shadow-md shadow-[#2648E7]/30 shrink-0">
            <Settings size={22} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              CRM Workspace Settings
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Configure lead assignment rules, sales notifications, and role permissions
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
          Builder Only
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs flex items-center gap-2 border border-emerald-200 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>CRM settings updated successfully.</span>
          </div>
        )}

        {/* Lead Assignment Rules */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders size={16} className="text-[#2648E7]" />
            <span>Lead Routing & Assignment</span>
          </h3>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-bold text-slate-800">Auto-assign Telecallers on Import</p>
                <p className="text-[11px] text-slate-400">Automatically assign imported leads round-robin to active telecallers</p>
              </div>
              <input
                type="checkbox"
                checked={autoAssign}
                onChange={(e) => setAutoAssign(e.target.checked)}
                className="size-4 text-[#2648E7] rounded focus:ring-[#2648E7]"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-bold text-slate-800">Strict Ownership Isolation</p>
                <p className="text-[11px] text-slate-400">Telecallers can only view leads explicitly assigned to their account</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                Enforced
              </span>
            </div>
          </div>
        </div>

        {/* Notifications & Reminders */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BellRing size={16} className="text-[#2648E7]" />
            <span>Alerts & Reminders</span>
          </h3>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="font-bold text-slate-800">New Lead Inquiry Alerts</p>
                <p className="text-[11px] text-slate-400">Send notifications to assigned executives when new leads are captured</p>
              </div>
              <input
                type="checkbox"
                checked={notifyOnNewLead}
                onChange={(e) => setNotifyOnNewLead(e.target.checked)}
                className="size-4 text-[#2648E7] rounded focus:ring-[#2648E7]"
              />
            </div>

            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-bold text-slate-800">Overdue Follow-up Reminders</p>
                <p className="text-[11px] text-slate-400">Alert CRM managers when follow-ups remain pending past due dates</p>
              </div>
              <input
                type="checkbox"
                checked={notifyOnFollowupOverdue}
                onChange={(e) => setNotifyOnFollowupOverdue(e.target.checked)}
                className="size-4 text-[#2648E7] rounded focus:ring-[#2648E7]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-md shadow-[#2648E7]/25 transition-all"
          >
            <Save size={15} />
            <span>Save CRM Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

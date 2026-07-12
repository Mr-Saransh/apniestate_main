import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { Users, Plus, Minus, CheckCircle2, Wrench, Fuel } from 'lucide-react';
import { apiClient } from '@/api/client';
import LabourRegister from '@/components/operations/LabourRegister';
import EquipmentRegister from '@/components/operations/EquipmentRegister';

interface LabourRow {
  id: string;
  name: string;
  emoji: string;
  present: number;
  halfDay: number;
  overtime: number;
  rate: number | null;
}

const LABOUR_INIT: LabourRow[] = [
  { id: "1", name: "Mistri", emoji: "🧱", present: 8, halfDay: 2, overtime: 3, rate: 650 },
  { id: "2", name: "Carpenter", emoji: "🪚", present: 4, halfDay: 1, overtime: 0, rate: 750 },
  { id: "3", name: "Helper", emoji: "👷", present: 12, halfDay: 0, overtime: 5, rate: 450 },
  { id: "4", name: "Electrician", emoji: "⚡", present: 2, halfDay: 0, overtime: 1, rate: null },
  { id: "5", name: "Painter", emoji: "🖌️", present: 3, halfDay: 1, overtime: 0, rate: 600 },
];



export default function OperationsWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject, activeProjectId } = useProject();
  const tab = searchParams.get('tab') || 'labour';
  
  const [labour, setLabour] = useState<LabourRow[]>(LABOUR_INIT);
  const [saved, setSaved] = useState(false);

  function change(id: string, field: "present" | "halfDay" | "overtime", delta: number) {
    setLabour((prev) => prev.map((l) => l.id === id ? { ...l, [field]: Math.max(0, l[field] + delta) } : l));
    setSaved(false);
  }

  const totalCost = labour.reduce((sum, l) => {
    if (!l.rate) return sum;
    return sum + l.present * l.rate + l.halfDay * l.rate * 0.5 + l.overtime * l.rate * 0.25;
  }, 0);



  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Users size={48} className="text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Project Selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Please select a project from the top bar to view operations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Tabs */}
      <div className="bg-white border-b border-border px-4 pt-4 pb-0 shrink-0 sticky top-0 z-10">
        <h2 className="text-base font-bold text-foreground mb-3" style={{ fontFamily: "var(--font-display)" }}>Operations</h2>
        <div className="flex gap-0">
          {[{ id: "labour", label: "Labour Register" }, { id: "equipment", label: "Equipment" }].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSearchParams({ tab: id }, { replace: true })}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === id ? "border-[#2648E7] text-[#2648E7]" : "border-transparent text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "labour" ? (
        <LabourRegister />
      ) : (
        <EquipmentRegister />
      )}
    </div>
  );
}

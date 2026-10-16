import React, { useState, useEffect } from 'react';
import { Calendar, X, Filter, ChevronDown } from 'lucide-react';
import {
  DATE_PRESETS,
  DatePresetKey,
  getDatePresetRange,
  formatDateRangeDisplay,
} from '@/utils/dateFilter';

export interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onChange: (from: string, to: string, presetLabel?: string) => void;
  allowedPresets?: DatePresetKey[];
  compact?: boolean;
  className?: string;
  label?: string;
  showQuickPills?: boolean;
}

export default function DateRangeFilter({
  fromDate,
  toDate,
  onChange,
  allowedPresets = ['all_time', 'today', 'this_week', 'this_month', 'last_month', 'last_30_days', 'custom'],
  compact = false,
  className = '',
  label = 'Date Filter',
  showQuickPills = true,
}: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<DatePresetKey>('all_time');

  // Determine which preset matches the current fromDate / toDate
  useEffect(() => {
    if (!fromDate && !toDate) {
      setActivePreset('all_time');
      return;
    }

    // Check if current from/to matches any preset
    let matched: DatePresetKey = 'custom';
    for (const p of allowedPresets) {
      if (p === 'all_time' || p === 'custom') continue;
      const range = getDatePresetRange(p);
      if (range.from === fromDate && range.to === toDate) {
        matched = p;
        break;
      }
    }
    setActivePreset(matched);
  }, [fromDate, toDate, allowedPresets]);

  const handlePresetSelect = (preset: DatePresetKey) => {
    setActivePreset(preset);
    if (preset === 'all_time') {
      onChange('', '', 'All Time');
    } else if (preset === 'custom') {
      // Keep current from/to as is
    } else {
      const range = getDatePresetRange(preset);
      const label = DATE_PRESETS.find((p) => p.key === preset)?.label || preset;
      onChange(range.from, range.to, label);
    }
  };

  const handleFromChange = (newFrom: string) => {
    setActivePreset('custom');
    onChange(newFrom, toDate, 'Custom');
  };

  const handleToChange = (newTo: string) => {
    setActivePreset('custom');
    onChange(fromDate, newTo, 'Custom');
  };

  const handleClear = () => {
    setActivePreset('all_time');
    onChange('', '', 'All Time');
  };

  const isFiltered = Boolean(fromDate || toDate);
  const presetsToDisplay = DATE_PRESETS.filter((p) => allowedPresets.includes(p.key));

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        <div className="flex items-center gap-1 bg-white border border-border rounded-lg px-2 py-1 text-xs shadow-2xs">
          <Calendar size={13} className="text-[#2648E7] shrink-0" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFromChange(e.target.value)}
            className="text-xs bg-transparent focus:outline-none text-foreground font-medium w-[110px]"
            title="Start Date"
            aria-label="Filter Start Date"
          />
          <span className="text-muted-foreground text-[10px]">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleToChange(e.target.value)}
            className="text-xs bg-transparent focus:outline-none text-foreground font-medium w-[110px]"
            title="End Date"
            aria-label="Filter End Date"
          />
          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-red-500 p-0.5 rounded transition-colors"
              title="Clear date filter"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Quick Presets Dropdown */}
        <select
          value={activePreset}
          onChange={(e) => handlePresetSelect(e.target.value as DatePresetKey)}
          className="bg-white border border-border rounded-lg px-2 py-1 text-xs font-semibold text-foreground focus:outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-2xs"
        >
          {presetsToDisplay.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-border p-3.5 shadow-2xs ${className}`}>
      {/* Header with status & clear button */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className="size-6 rounded-lg bg-[#2648E7]/10 flex items-center justify-center text-[#2648E7]">
            <Calendar size={13} />
          </div>
          <span className="text-xs font-bold text-foreground">{label}</span>
          {isFiltered && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2648E7] border border-blue-200">
              Active: {formatDateRangeDisplay(fromDate, toDate)}
            </span>
          )}
        </div>

        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            <X size={12} /> Clear Filter
          </button>
        )}
      </div>

      {/* Quick Preset Pills */}
      {showQuickPills && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2.5 hide-scrollbar">
          {presetsToDisplay.map((p) => {
            const isActive = activePreset === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => handlePresetSelect(p.key)}
                className={`
                  px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer
                  ${
                    isActive
                      ? 'bg-[#2648E7] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }
                `}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Inputs for precise start and end dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-[#2648E7] focus-within:bg-white transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 w-8">
            From
          </span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFromChange(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            aria-label="Filter From Date"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 focus-within:border-[#2648E7] focus-within:bg-white transition-colors">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 w-8">
            To
          </span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleToChange(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            aria-label="Filter To Date"
          />
        </div>
      </div>
    </div>
  );
}

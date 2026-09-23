import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  X,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Layers,
  Droplet,
  Zap,
  Paintbrush,
  ShieldAlert,
  Building2,
  Box,
  Check,
  Plus
} from 'lucide-react';
import { type BOQItemSummary, type BOQCategorySummary } from '@/api/purchase';
import { cleanNumeric } from '@/utils/constructionIntelligence';

export interface SelectedMaterialData {
  name: string;
  unit: string;
  rate?: number;
  planned?: number;
  used?: number;
  category?: string;
  isCustom?: boolean;
}

interface SmartMaterialSelectProps {
  value: string;
  isCustom: boolean;
  onSelect: (material: SelectedMaterialData | null, isCustom: boolean) => void;
  items: BOQItemSummary[];
  categories?: BOQCategorySummary[];
  placeholder?: string;
}

export default function SmartMaterialSelect({
  value,
  isCustom,
  onSelect,
  items = [],
  categories = [],
  placeholder = '-- Search or choose from Quantity of Materials --'
}: SmartMaterialSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Group items by category / table
  const groupedItems = useMemo(() => {
    const map: Record<string, BOQItemSummary[]> = {};
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        if (cat.items && cat.items.length > 0) {
          map[cat.name] = cat.items;
        }
      });
    } else {
      items.forEach(it => {
        const cat = it.category || 'General Work Estimation';
        if (!map[cat]) map[cat] = [];
        map[cat].push(it);
      });
    }
    return map;
  }, [categories, items]);

  const categoryNames = useMemo(() => Object.keys(groupedItems), [groupedItems]);

  // Flattened and filtered items based on search and category filter
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let pool: { category: string; item: BOQItemSummary }[] = [];

    Object.entries(groupedItems).forEach(([catName, catItems]) => {
      if (selectedCategoryFilter !== 'ALL' && selectedCategoryFilter !== catName) {
        return;
      }
      catItems.forEach(it => {
        pool.push({ category: catName, item: it });
      });
    });

    if (!q) return pool;

    return pool.filter(({ category, item }) => {
      const nameMatch = item.name.toLowerCase().includes(q);
      const catMatch = category.toLowerCase().includes(q);
      const remarksMatch = item.remarks ? item.remarks.toLowerCase().includes(q) : false;
      return nameMatch || catMatch || remarksMatch;
    });
  }, [groupedItems, searchQuery, selectedCategoryFilter]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const currentlySelectedItem = useMemo(() => {
    if (isCustom || !value) return null;
    return items.find(it => it.name === value) || null;
  }, [items, value, isCustom]);

  const getCategoryIcon = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('plumb') || lower.includes('sanit')) return <Droplet size={13} className="text-cyan-600" />;
    if (lower.includes('electr') || lower.includes('power')) return <Zap size={13} className="text-amber-500" />;
    if (lower.includes('paint') || lower.includes('finish')) return <Paintbrush size={13} className="text-rose-600" />;
    if (lower.includes('waterproof')) return <ShieldAlert size={13} className="text-blue-600" />;
    if (lower.includes('steel') || lower.includes('rebar')) return <Layers size={13} className="text-amber-700" />;
    if (lower.includes('concrete')) return <Building2 size={13} className="text-blue-700" />;
    return <Box size={13} className="text-[#2648E7]" />;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-left text-sm transition-all flex items-center justify-between gap-2 shadow-2xs hover:border-[#2648E7] ${
          isOpen ? 'border-[#2648E7] ring-2 ring-[#2648E7]/10' : 'border-border'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isCustom ? (
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                ➕
              </span>
              <div className="min-w-0">
                <span className="font-bold text-gray-900 block truncate">
                  {value ? `Custom: ${value}` : '[+ Custom / Unlisted Material]'}
                </span>
                <span className="text-[10px] text-amber-700 font-semibold block">
                  Out-of-catalog entry
                </span>
              </div>
            </div>
          ) : currentlySelectedItem ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <span className="size-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                {getCategoryIcon(currentlySelectedItem.category || '')}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 truncate block text-xs sm:text-sm">
                    {currentlySelectedItem.name}
                  </span>
                  {currentlySelectedItem.rate ? (
                    <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                      · ₹{currentlySelectedItem.rate}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  {(() => {
                    const remaining = Math.max(0, currentlySelectedItem.planned - currentlySelectedItem.used);
                    const isExhausted = currentlySelectedItem.planned > 0 && currentlySelectedItem.used >= currentlySelectedItem.planned;
                    if (isExhausted) {
                      return (
                        <span className="text-red-700 font-bold flex items-center gap-1">
                          <AlertTriangle size={11} className="text-red-600" />
                          100% Consumed ({currentlySelectedItem.used}/{currentlySelectedItem.planned} {currentlySelectedItem.unit})
                        </span>
                      );
                    }
                    return (
                      <span className="text-emerald-700 font-semibold">
                        {remaining.toLocaleString()} {currentlySelectedItem.unit} remaining (of {currentlySelectedItem.planned.toLocaleString()})
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs sm:text-sm font-medium">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-180 text-[#2648E7]' : ''}`}
        />
      </button>

      {/* Dropdown Flyout Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-border shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 flex flex-col max-h-[380px]">
          {/* Search Box */}
          <div className="p-2.5 border-b border-border bg-slate-50/80 sticky top-0 z-10 flex items-center gap-2">
            <Search size={15} className="text-muted-foreground shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search material (e.g. CPVC pipe, 16mm rebar, cement, tile)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs sm:text-sm focus:outline-none text-gray-900 placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="size-5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center text-xs"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick Category Filter Pills */}
          {categoryNames.length > 1 && (
            <div className="px-2.5 py-1.5 border-b border-border/60 bg-white flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('ALL')}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors ${
                  selectedCategoryFilter === 'ALL'
                    ? 'bg-[#2648E7] text-white shadow-2xs'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                All ({items.length})
              </button>
              {categoryNames.map(cat => {
                const count = groupedItems[cat]?.length || 0;
                const isSelected = selectedCategoryFilter === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#2648E7] text-white shadow-2xs'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    <span>{cat.split(' ')[0]}</span>
                    <span className="opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Items List */}
          <div className="overflow-y-auto flex-1 p-1.5 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="py-6 px-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">
                  No catalog material matching "<span className="font-semibold text-gray-800">{searchQuery}</span>"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onSelect({ name: searchQuery.trim(), unit: 'nos', isCustom: true }, true);
                    setIsOpen(false);
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#2648E7] rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
                >
                  <Plus size={13} /> Add "{searchQuery}" as Custom Material
                </button>
              </div>
            ) : (
              filteredItems.map(({ category, item }) => {
                const isSelected = !isCustom && value === item.name;
                const remaining = Math.max(0, item.planned - item.used);
                const isConsumed = item.planned > 0 && item.used >= item.planned;
                const usagePercent = item.planned > 0 ? Math.round((item.used / item.planned) * 100) : 0;

                return (
                  <button
                    key={item.id || item.name}
                    type="button"
                    onClick={() => {
                      onSelect(
                        {
                          name: item.name,
                          unit: item.unit,
                          rate: item.rate,
                          planned: item.planned,
                          used: item.used,
                          category: category,
                          isCustom: false
                        },
                        false
                      );
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-start justify-between gap-2.5 group ${
                      isSelected
                        ? 'bg-blue-50/80 border border-blue-200'
                        : isConsumed
                        ? 'hover:bg-red-50/40 bg-red-50/20'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-gray-900 group-hover:text-[#2648E7] transition-colors">
                          {item.name}
                        </span>
                        {item.rate ? (
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-medium">
                            ₹{item.rate}/{item.unit}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          {getCategoryIcon(category)} {category}
                        </span>
                        <span>·</span>
                        {isConsumed ? (
                          <span className="text-red-700 font-bold bg-red-100/70 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <AlertTriangle size={10} /> 100% Consumed ({item.used} {item.unit} used)
                          </span>
                        ) : item.used > 0 ? (
                          <span className="text-blue-800 font-semibold bg-blue-100/60 px-1.5 py-0.2 rounded">
                            {remaining.toLocaleString()} {item.unit} left ({usagePercent}% used)
                          </span>
                        ) : (
                          <span className="text-emerald-800 font-semibold bg-emerald-100/60 px-1.5 py-0.2 rounded">
                            {item.planned.toLocaleString()} {item.unit} planned
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center mt-1">
                      {isSelected ? (
                        <span className="size-5 rounded-full bg-[#2648E7] text-white flex items-center justify-center">
                          <Check size={12} />
                        </span>
                      ) : isConsumed ? (
                        <span className="text-[10px] text-red-600 font-black uppercase tracking-wider bg-red-100 px-1.5 py-0.5 rounded">
                          Over
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}

            {/* Custom Material Trigger */}
            <div className="pt-1.5 border-t border-border mt-1">
              <button
                type="button"
                onClick={() => {
                  onSelect({ name: '', unit: 'nos', isCustom: true }, true);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left transition-colors flex items-center gap-2 ${
                  isCustom ? 'bg-amber-100 text-amber-900 font-bold' : 'hover:bg-amber-50 text-amber-800'
                }`}
              >
                <div className="size-6 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center text-xs font-bold shrink-0">
                  <Plus size={14} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block">
                    [+ Custom / Unlisted Material]
                  </span>
                  <span className="text-[10px] text-amber-700/80 block">
                    Item not in estimation? Add and auto-register into Quantity of Materials
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * High-Impact Cost Intelligence Variance Component
 * Displays real-time cost variance, overrun percentage, and justification tags
 * when an item is ordered more than expected or when baseline is fully consumed.
 */
export function CostIntelligenceCard({
  material,
  quantity,
  onVarianceReasonChange,
  varianceReason
}: {
  material: BOQItemSummary | null;
  quantity: number | string;
  onVarianceReasonChange?: (reason: string) => void;
  varianceReason?: string;
}) {
  if (!material) return null;

  const planned = Number(material.planned) || 0;
  const used = Number(material.used) || 0;
  const rate = Number(material.rate) || 0;
  const currentReq = cleanNumeric(quantity);
  const remaining = Math.max(0, planned - used);
  const newTotal = used + currentReq;

  const isAlreadyExhausted = planned > 0 && used >= planned;
  const willExceed = planned > 0 && newTotal > planned;
  const excessQty = willExceed ? newTotal - planned : 0;
  const costVariance = excessQty * rate;
  const percentExceeded = planned > 0 ? ((excessQty / planned) * 100).toFixed(0) : '100';

  const VARIANCE_REASONS = [
    'Site Wastage / Breakage Allowance',
    'Architectural Drawing Revision',
    'Scope Addition / Extra Work',
    'Damaged Goods Replacement',
    'Contingency Site Requirement'
  ];

  if (!willExceed && !isAlreadyExhausted) {
    // Normal healthy baseline status
    return (
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-1.5 animate-in fade-in">
        <div className="flex items-center justify-between font-bold text-blue-950">
          <span className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-[#2648E7]" />
            Baseline Estimation Status
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
            {remaining.toLocaleString()} {material.unit} Remaining
          </span>
        </div>
        <div className="text-blue-800 flex justify-between text-[11px]">
          <span>Planned: <strong>{planned.toLocaleString()} {material.unit}</strong></span>
          <span>Procured so far: <strong>{used.toLocaleString()} {material.unit}</strong></span>
          {currentReq > 0 && (
            <span>Balance after order: <strong>{(remaining - currentReq).toFixed(1)} {material.unit}</strong></span>
          )}
        </div>
      </div>
    );
  }

  // Cost Intelligence Overrun / Variance Alert
  return (
    <div className="p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl text-xs space-y-3 animate-in fade-in shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
              Cost Intelligence Alert · Baseline Overrun
            </span>
            <span className="font-bold text-xs text-amber-950">
              {isAlreadyExhausted
                ? `100% of the approved baseline has already been consumed!`
                : `This order will exceed the approved planned quantity!`}
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-red-100 text-red-800 font-black text-[11px] rounded-full shrink-0 border border-red-200">
          +{percentExceeded}% Over Baseline
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 bg-white/80 rounded-xl border border-amber-200 text-[11px]">
        <div>
          <span className="text-muted-foreground block text-[10px]">Approved Planned</span>
          <strong className="text-gray-900">{planned.toLocaleString()} {material.unit}</strong>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Already Procured</span>
          <strong className="text-blue-900">{used.toLocaleString()} {material.unit}</strong>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Excess Quantity</span>
          <strong className="text-red-700">+{excessQty.toFixed(1)} {material.unit}</strong>
        </div>
        <div>
          <span className="text-muted-foreground block text-[10px]">Cost Variance</span>
          <strong className="text-red-700 font-black">
            {costVariance > 0 ? `+₹${costVariance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Budget Overrun'}
          </strong>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-amber-900 font-semibold">
          <span>0 {material.unit}</span>
          <span>Planned: {planned} {material.unit}</span>
          <span className="text-red-700 font-bold">Total with this order: {newTotal.toFixed(1)} {material.unit}</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${Math.min(100, (used / (newTotal || 1)) * 100)}%` }}
            className="h-full bg-blue-600 transition-all"
          />
          <div
            style={{ width: `${Math.min(100, (currentReq / (newTotal || 1)) * 100)}%` }}
            className="h-full bg-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Variance Reason Input & Quick Selector */}
      {onVarianceReasonChange && (
        <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
          <label className="text-[11px] font-bold text-amber-950 block">
            PM Variance Justification (Why is this item ordered more than expected?)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {VARIANCE_REASONS.map(reason => (
              <button
                key={reason}
                type="button"
                onClick={() => onVarianceReasonChange(reason)}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                  varianceReason === reason
                    ? 'bg-amber-800 text-white border-amber-900 shadow-2xs'
                    : 'bg-white hover:bg-amber-100/70 border-amber-300 text-amber-900'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Or type specific reason (e.g. Added extra 2 washrooms on 3rd floor)..."
            value={varianceReason || ''}
            onChange={e => onVarianceReasonChange(e.target.value)}
            className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-amber-600"
          />
        </div>
      )}
    </div>
  );
}

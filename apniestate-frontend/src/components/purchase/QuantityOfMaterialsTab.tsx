import React, { useState, useMemo } from 'react';
import {
  Layers,
  UploadCloud,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Building2,
  HardHat,
  Ruler,
  Truck,
  Box,
  AlertCircle,
  Sparkles,
  Droplet,
  Zap,
  Paintbrush,
  ShieldAlert,
  DoorClosed,
  Grid,
  Flame,
  FolderPlus,
  ArrowRight,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { purchaseApi, type BOQItemSummary, type BOQCategorySummary } from '@/api/purchase';
import { COMPLETE_BUILDER_SUITE } from './ImportEstimationModal';
import {
  normalizeUnit,
  cleanNumeric,
  detectDiscipline,
  INDUSTRY_DISCIPLINE_PRESETS
} from '@/utils/constructionIntelligence';

interface QuantityOfMaterialsTabProps {
  categories?: BOQCategorySummary[];
  items: BOQItemSummary[];
  projectName: string;
  projectId: string;
  onRefresh: () => void;
  onOpenImport: () => void;
}

export default function QuantityOfMaterialsTab({
  categories = [],
  items = [],
  projectName,
  projectId,
  onRefresh,
  onOpenImport
}: QuantityOfMaterialsTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedTables, setCollapsedTables] = useState<Record<string, boolean>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<BOQItemSummary>>({});
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [newRowData, setNewRowData] = useState({ name: '', planned: '', unit: 'cum', rate: '', remarks: '' });
  const [savingAction, setSavingAction] = useState(false);
  const [presetLoading, setPresetLoading] = useState(false);

  // Table management states
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [tableCreationMode, setTableCreationMode] = useState<'empty' | 'preset'>('empty');
  const [seedPresetTemplate, setSeedPresetTemplate] = useState<string>('none');
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renamedCatTitle, setRenamedCatTitle] = useState('');

  // Group items into disconnected tables
  const displayTables = useMemo(() => {
    if (categories && categories.length > 0) {
      const result = categories.map(cat => ({
        id: cat.id || cat.name,
        name: cat.name,
        items: cat.items || []
      }));

      // In case there are items with a category not in the categories list
      const knownCategoryNames = new Set(result.map(c => c.name.toLowerCase()));
      const orphanGrouped: Record<string, BOQItemSummary[]> = {};
      items.forEach(it => {
        const cat = it.category || detectDiscipline(it.name);
        if (!knownCategoryNames.has(cat.toLowerCase())) {
          if (!orphanGrouped[cat]) orphanGrouped[cat] = [];
          orphanGrouped[cat].push(it);
        }
      });
      Object.entries(orphanGrouped).forEach(([name, catItems]) => {
        result.push({
          id: name,
          name,
          items: catItems
        });
      });

      return result;
    }

    // Group flat items by category field or auto-detection
    const grouped: Record<string, BOQItemSummary[]> = {};
    items.forEach(it => {
      const cat = it.category || detectDiscipline(it.name);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(it);
    });

    return Object.entries(grouped).map(([name, catItems]) => ({
      id: name,
      name,
      items: catItems
    }));
  }, [categories, items]);

  // Overall Statistics
  const overallStats = useMemo(() => {
    let totalItems = 0;
    let totalEstimatedAmount = 0;
    let totalUsedItems = 0;

    displayTables.forEach(t => {
      t.items.forEach(it => {
        totalItems++;
        const itemAmount = (it.amount !== undefined && it.amount > 0)
          ? it.amount
          : (it.planned * (it.rate || 0));
        totalEstimatedAmount += itemAmount;
        if (it.used > 0) totalUsedItems++;
      });
    });

    return {
      totalItems,
      totalEstimatedAmount,
      totalTables: displayTables.length,
      totalUsedItems
    };
  }, [displayTables]);

  const toggleTable = (tableName: string) => {
    setCollapsedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  // Get visual icon for each disconnected table
  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('plumb') || lower.includes('sanitar') || lower.includes('drain')) {
      return <Droplet className="text-cyan-600" size={17} />;
    }
    if (lower.includes('electr') || lower.includes('power') || lower.includes('wire')) {
      return <Zap className="text-amber-500" size={17} />;
    }
    if (lower.includes('paint') || lower.includes('putty') || lower.includes('ceiling') || lower.includes('finish')) {
      return <Paintbrush className="text-rose-600" size={17} />;
    }
    if (lower.includes('waterproof') || lower.includes('damp proof') || lower.includes('dpc')) {
      return <ShieldAlert className="text-blue-600" size={17} />;
    }
    if (lower.includes('door') || lower.includes('window') || lower.includes('hardware') || lower.includes('glazing')) {
      return <DoorClosed className="text-stone-700" size={17} />;
    }
    if (lower.includes('floor') || lower.includes('tile') || lower.includes('granite') || lower.includes('marble')) {
      return <Grid className="text-emerald-600" size={17} />;
    }
    if (lower.includes('hvac') || lower.includes('fire') || lower.includes('safety')) {
      return <Flame className="text-red-600" size={17} />;
    }
    if (lower.includes('steel') || lower.includes('rebar') || lower.includes('reinforcement')) {
      return <Layers className="text-amber-700" size={17} />;
    }
    if (lower.includes('shutter') || lower.includes('formwork')) {
      return <Ruler className="text-purple-600" size={17} />;
    }
    if (lower.includes('earth') || lower.includes('excavation') || lower.includes('backfill')) {
      return <Truck className="text-orange-600" size={17} />;
    }
    if (lower.includes('brick') || lower.includes('masonry') || lower.includes('block')) {
      return <Box className="text-rose-700" size={17} />;
    }
    if (lower.includes('concrete')) {
      return <Building2 className="text-blue-700" size={17} />;
    }
    if (lower.includes('requisition') || lower.includes('material')) {
      return <FileSpreadsheet className="text-emerald-700" size={17} />;
    }
    return <HardHat className="text-[#2648E7]" size={17} />;
  };

  // Start inline editing
  const handleStartEdit = (item: BOQItemSummary) => {
    setEditingItemId(item.id);
    setEditFormData({
      name: item.name,
      planned: item.planned,
      unit: item.unit,
      rate: item.rate || 0,
      remarks: item.remarks || ''
    });
  };

  // Save inline edit
  const handleSaveEdit = async (itemId: string) => {
    if (!editFormData.name || editFormData.planned === undefined) return;
    setSavingAction(true);
    try {
      await purchaseApi.performAction('UPDATE_BOQ_ITEM', {
        itemId,
        name: editFormData.name.trim(),
        planned: cleanNumeric(editFormData.planned),
        unit: normalizeUnit(editFormData.unit),
        rate: cleanNumeric(editFormData.rate),
        remarks: editFormData.remarks ? editFormData.remarks.trim() : undefined
      });
      setEditingItemId(null);
      setEditFormData({});
      onRefresh();
    } catch (err) {
      console.error('Failed to update item:', err);
      alert('Failed to save material update');
    } finally {
      setSavingAction(false);
    }
  };

  // Delete item
  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from Quantity of Materials?`)) return;
    try {
      await purchaseApi.performAction('DELETE_BOQ_ITEM', { itemId });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  // Save new row to a category
  const handleSaveNewRow = async (categoryName: string) => {
    if (!newRowData.name || !newRowData.planned) {
      alert('Please provide an item description and planned quantity');
      return;
    }
    setSavingAction(true);
    try {
      const parsedQty = cleanNumeric(newRowData.planned);
      const parsedRate = cleanNumeric(newRowData.rate);
      await purchaseApi.performAction('CREATE_BOQ_ITEM', {
        projectId,
        categoryName,
        items: [{
          name: newRowData.name.trim(),
          planned: parsedQty,
          unit: normalizeUnit(newRowData.unit || 'nos'),
          rate: parsedRate,
          amount: parsedQty * parsedRate,
          remarks: newRowData.remarks ? newRowData.remarks.trim() : null
        }]
      });
      setAddingToCategory(null);
      setNewRowData({ name: '', planned: '', unit: 'cum', rate: '', remarks: '' });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to add material row');
    } finally {
      setSavingAction(false);
    }
  };

  // Add new Table / Category
  const handleCreateNewTable = async () => {
    const trimmedName = newTableName.trim();
    if (!trimmedName) {
      alert('Please enter a name for the new table / discipline.');
      return;
    }

    if (displayTables.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert(`A work table named "${trimmedName}" already exists.`);
      return;
    }

    setSavingAction(true);
    try {
      if (tableCreationMode === 'preset' && seedPresetTemplate !== 'none') {
        const preset = INDUSTRY_DISCIPLINE_PRESETS.find(p => p.id === seedPresetTemplate);
        if (preset && preset.suggestedItems.length > 0) {
          // Create table with seed master items (zero planned quantity awaiting site input)
          await purchaseApi.performAction('CREATE_BOQ_ITEM', {
            projectId,
            categoryName: trimmedName,
            items: preset.suggestedItems.map(it => ({
              name: it.name,
              planned: 0,
              unit: it.unit,
              rate: it.rate,
              amount: 0,
              remarks: it.remarks
            }))
          });
        } else {
          // Create empty category
          await purchaseApi.performAction('CREATE_BOQ_CATEGORY', {
            projectId,
            name: trimmedName
          });
        }
      } else {
        // Create clean empty category
        await purchaseApi.performAction('CREATE_BOQ_CATEGORY', {
          projectId,
          name: trimmedName
        });
      }

      setShowAddTableModal(false);
      setNewTableName('');
      setTableCreationMode('empty');
      setSeedPresetTemplate('none');
      setSearchQuery('');
      setSelectedFilter('ALL');
      setCollapsedTables(prev => ({ ...prev, [trimmedName]: false }));
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to create new work package table');
    } finally {
      setSavingAction(false);
    }
  };

  // Rename Table
  const handleRenameTable = async (categoryId: string) => {
    if (!renamedCatTitle.trim()) return;
    try {
      await purchaseApi.performAction('UPDATE_BOQ_CATEGORY', {
        categoryId,
        name: renamedCatTitle.trim()
      });
      setRenamingCatId(null);
      setRenamedCatTitle('');
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to rename table');
    }
  };

  // Delete Table
  const handleDeleteTable = async (categoryId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the entire work table "${name}" and all its contents?`)) return;
    try {
      await purchaseApi.performAction('DELETE_BOQ_CATEGORY', { categoryId, name, projectId });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete table');
    }
  };


  // 1-Click Load Master Multi-Discipline Builder Template
  const handleLoadCompleteSuite = async () => {
    if (!confirm('Load the Universal Master Multi-Discipline Template? This creates standardized work tables for all 10 construction disciplines (Civil, Rebars, Shuttering, Plumbing, Electrical, Painting, Waterproofing, Flooring, Doors/Windows, HVAC) with clean zero quantities ready for your actual project measurements.')) return;
    setPresetLoading(true);
    try {
      await purchaseApi.performAction('SAVE_BOQ_TABLES', {
        projectId,
        categories: COMPLETE_BUILDER_SUITE,
        replaceAll: items.length === 0
      });
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to load master builder template');
    } finally {
      setPresetLoading(false);
    }
  };

  // Filtered tables based on tab filter & search (supports searching both items and work table names)
  const filteredTables = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return displayTables
      .filter(t => selectedFilter === 'ALL' || t.name === selectedFilter)
      .map(t => {
        if (!q) return t;

        const tableNameMatches = t.name.toLowerCase().includes(q);
        const matchingItems = t.items.filter(it =>
          it.name.toLowerCase().includes(q) ||
          (it.remarks && it.remarks.toLowerCase().includes(q)) ||
          (it.unit && it.unit.toLowerCase().includes(q)) ||
          (it.code && it.code.toLowerCase().includes(q))
        );

        if (tableNameMatches) {
          // If work table name matches query:
          // Keep table in results. If items also match specifically, show them;
          // otherwise show all items in this matching work table.
          return {
            ...t,
            items: matchingItems.length > 0 ? matchingItems : t.items,
            _matchedByTable: true
          };
        }

        return {
          ...t,
          items: matchingItems,
          _matchedByTable: false
        };
      })
      .filter(t => {
        if (!q) {
          // When no search query, show all tables in this filter (including empty tables!)
          return true;
        }
        const tableNameMatches = t.name.toLowerCase().includes(q);
        return tableNameMatches || t.items.length > 0;
      });
  }, [displayTables, selectedFilter, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Top Header & Project Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#2648E7]/10 text-[#2648E7]">
              <Layers size={18} />
            </span>
            <h2 className="text-base font-bold text-foreground">
              Quantity of Materials
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {projectName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Civil engineering estimation, MEP schedules (Plumbing, Electrical), finishing, and material breakdowns.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddTableModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-border hover:bg-slate-50 text-foreground text-xs font-bold rounded-xl transition-all shadow-2xs"
          >
            <FolderPlus size={14} className="text-[#2648E7]" /> + New Work Table
          </button>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            <UploadCloud size={14} /> Import (PDF / Excel / Word)
          </button>

          <button
            onClick={handleLoadCompleteSuite}
            disabled={presetLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-950 border border-emerald-200 text-xs font-bold rounded-xl transition-all shadow-sm"
            title="Load the complete civil + MEP + finishing suite"
          >
            <Sparkles size={14} className="text-emerald-600" />
            {presetLoading ? 'Loading...' : 'Complete Builder Suite'}
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      {(overallStats.totalItems > 0 || displayTables.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3 bg-white border border-border flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Estimation</span>
            <div className="mt-1">
              <span className="text-base font-extrabold text-foreground">
                ₹{overallStats.totalEstimatedAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Budget baseline</span>
          </Card>

          <Card className="p-3 bg-white border border-border flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Materials & Items</span>
            <div className="mt-1">
              <span className="text-base font-extrabold text-[#2648E7]">
                {overallStats.totalItems}
              </span>
              <span className="text-xs text-muted-foreground ml-1">items planned</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Standardized catalog</span>
          </Card>

          <Card className="p-3 bg-white border border-border flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Work Packages</span>
            <div className="mt-1">
              <span className="text-base font-extrabold text-purple-700">
                {overallStats.totalTables}
              </span>
              <span className="text-xs text-muted-foreground ml-1">isolated tables</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Civil & MEP disciplines</span>
          </Card>

          <Card className="p-3 bg-white border border-border flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Procurement Linked</span>
            <div className="mt-1">
              <span className="text-base font-extrabold text-emerald-600">
                {overallStats.totalUsedItems}
              </span>
              <span className="text-xs text-muted-foreground ml-1">in procurement</span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-0.5">Linked to Requests/Orders</span>
          </Card>
        </div>
      )}

      {/* Disconnected Tables Filter Bar & Search */}
      {displayTables.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            {/* Category / Discipline Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors ${
                  selectedFilter === 'ALL'
                    ? 'bg-[#2648E7] text-white shadow-sm'
                    : 'bg-muted/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Tables ({overallStats.totalTables})
              </button>
              {displayTables.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedFilter(t.name)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    selectedFilter === t.name
                      ? 'bg-[#2648E7] text-white shadow-sm'
                      : 'bg-muted/80 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {getCategoryIcon(t.name)}
                  <span>{t.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedFilter === t.name ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground'
                  }`}>
                    {t.items.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Quick Search for Items and Work Tables */}
            <div className="relative shrink-0 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search item / work table..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-border rounded-xl pl-9 pr-8 py-1.5 text-xs font-medium text-foreground focus:outline-none focus:border-[#2648E7] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  title="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no tables exist */}
      {displayTables.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-dashed border-border rounded-2xl">
          <div className="size-16 rounded-3xl bg-[#2648E7]/10 flex items-center justify-center mx-auto mb-4 text-[#2648E7]">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="text-base font-bold text-foreground">No Quantity of Materials Found</h3>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto">
            Create your first work table to start organizing civil, plumbing, electrical, and finishing schedules. Or start with our verified standard builder templates.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              onClick={() => {
                setNewTableName('');
                setTableCreationMode('empty');
                setSeedPresetTemplate('none');
                setShowAddTableModal(true);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FolderPlus size={16} />
              + New Work Table
            </button>

            <button
              onClick={handleLoadCompleteSuite}
              disabled={presetLoading}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={16} className="text-emerald-600" />
              {presetLoading ? 'Loading Template...' : 'Load Master Builder Template'}
            </button>

            <button
              onClick={onOpenImport}
              className="w-full sm:w-auto px-5 py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <UploadCloud size={16} /> Import from PDF, Excel or Word
            </button>
          </div>
        </Card>
      ) : filteredTables.length === 0 ? (
        <Card className="p-8 text-center bg-white border border-dashed border-border rounded-2xl">
          <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Search size={22} />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Items or Work Tables Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No materials, specifications, or work tables matched "{searchQuery}".
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 px-4 py-1.5 text-xs font-bold bg-[#2648E7] text-white hover:bg-[#2648E7]/90 rounded-xl transition-all shadow-sm"
          >
            Clear Search
          </button>
        </Card>
      ) : (
        /* Disconnected Tables List */
        <div className="space-y-6">
          {filteredTables.map((table) => {
            const isCollapsed = !!collapsedTables[table.name];
            const tableTotalAmount = table.items.reduce((sum, it) => {
              const rowAmount = (it.amount !== undefined && it.amount > 0)
                ? it.amount
                : (it.planned * (it.rate || 0));
              return sum + rowAmount;
            }, 0);

            const isRenaming = renamingCatId === table.id;

            return (
              <Card key={table.name} className="overflow-hidden border border-border shadow-sm rounded-2xl bg-white">
                {/* Disconnected Table Header */}
                <div className="p-4 bg-slate-50/80 border-b border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="p-2 rounded-xl bg-white shadow-2xs border border-border/80 shrink-0">
                      {getCategoryIcon(table.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isRenaming ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={renamedCatTitle}
                              onChange={e => setRenamedCatTitle(e.target.value)}
                              className="text-xs font-bold bg-white border border-border rounded-lg px-2 py-1 outline-none"
                              placeholder="Table name..."
                            />
                            <button
                              onClick={() => handleRenameTable(table.id)}
                              className="p-1 rounded bg-emerald-600 text-white"
                              title="Save Name"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setRenamingCatId(null)}
                              className="p-1 rounded bg-slate-200 text-slate-700"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-foreground truncate">
                              {table.name}
                            </h3>
                            <button
                              onClick={() => {
                                setRenamingCatId(table.id);
                                setRenamedCatTitle(table.name);
                              }}
                              className="text-muted-foreground hover:text-[#2648E7] p-0.5"
                              title="Rename Table"
                            >
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-bold shrink-0">
                          {table.items.length} items
                        </span>
                        {(table as any)._matchedByTable && searchQuery && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-[#2648E7] font-bold border border-blue-200 shrink-0">
                            Matched Work Table
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                        Section Subtotal: <strong className="text-foreground">₹{tableTotalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setAddingToCategory(addingToCategory === table.name ? null : table.name)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-border text-foreground hover:bg-slate-50 transition-colors shadow-2xs"
                    >
                      <Plus size={13} className="text-[#2648E7]" /> Add Row
                    </button>

                    <button
                      onClick={() => handleDeleteTable(table.id, table.name)}
                      className="p-1 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Delete Table"
                    >
                      <Trash2 size={15} />
                    </button>

                    <button
                      onClick={() => toggleTable(table.name)}
                      className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-200/60 transition-colors"
                      title={isCollapsed ? 'Expand table' : 'Collapse table'}
                    >
                      {isCollapsed ? <ChevronDown size={17} /> : <ChevronUp size={17} />}
                    </button>
                  </div>
                </div>

                {/* Inline Add Row Form Drawer */}
                {addingToCategory === table.name && (
                  <div className="p-3.5 bg-blue-50/50 border-b border-blue-200/80 animate-in fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Plus size={13} className="text-[#2648E7]" /> Add Item to {table.name}
                      </span>
                      <button
                        onClick={() => setAddingToCategory(null)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Particulars / Material Description..."
                          value={newRowData.name}
                          onChange={e => setNewRowData({ ...newRowData, name: e.target.value })}
                          className="w-full text-xs font-medium bg-white border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#2648E7]"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Planned Qty..."
                          value={newRowData.planned}
                          onChange={e => setNewRowData({ ...newRowData, planned: e.target.value })}
                          className="w-full text-xs font-medium bg-white border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#2648E7]"
                        />
                      </div>
                      <div>
                        <select
                          value={newRowData.unit}
                          onChange={e => setNewRowData({ ...newRowData, unit: e.target.value })}
                          className="w-full text-xs font-medium bg-white border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#2648E7]"
                        >
                          <option value="cum">cum</option>
                          <option value="kg">kg</option>
                          <option value="Tonnes">Tonnes</option>
                          <option value="sqm">sqm</option>
                          <option value="sqft">sqft</option>
                          <option value="bags">bags</option>
                          <option value="Cft">Cft</option>
                          <option value="Running meter">Running meter</option>
                          <option value="nos">nos/pieces</option>
                          <option value="set">set</option>
                          <option value="Ltr">Ltr</option>
                          <option value="lumpsum">lumpsum</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="Rate ₹..."
                          value={newRowData.rate}
                          onChange={e => setNewRowData({ ...newRowData, rate: e.target.value })}
                          className="w-full text-xs font-medium bg-white border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-[#2648E7]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-blue-200/50">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. Specification, brand, floor)..."
                        value={newRowData.remarks}
                        onChange={e => setNewRowData({ ...newRowData, remarks: e.target.value })}
                        className="text-xs bg-transparent border-0 text-muted-foreground focus:outline-none flex-1 pr-2"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAddingToCategory(null)}
                          className="px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-slate-200/50 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNewRow(table.name)}
                          disabled={savingAction}
                          className="px-3 py-1 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-lg shadow-2xs"
                        >
                          {savingAction ? 'Saving...' : 'Add Material'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Table Content */}
                {!isCollapsed && (
                  <>
                    {table.items.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50/50">
                        <div className="size-12 rounded-2xl bg-blue-50 text-[#2648E7] flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                          <FolderPlus size={20} />
                        </div>
                        <h4 className="text-sm font-bold text-foreground">
                          Work table "{table.name}" is currently empty
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                          No materials or items added yet. Click "+ Add First Row" to start adding measurements, specifications, or rates.
                        </p>
                        <button
                          onClick={() => setAddingToCategory(table.name)}
                          className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                        >
                          <Plus size={14} /> + Add First Row
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/60 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                              <th className="py-2.5 px-3.5">Particulars of Items / Material</th>
                              <th className="py-2.5 px-3 w-20">Unit</th>
                              <th className="py-2.5 px-3 w-28 text-right">Planned Qty</th>
                              <th className="py-2.5 px-3 w-24 text-right">Rate (₹)</th>
                              <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                              <th className="py-2.5 px-3 w-24 text-right">Used / Ord.</th>
                              <th className="py-2.5 px-3 w-24 text-right">Remaining</th>
                              <th className="py-2.5 px-3 min-w-[140px]">Notes / Location</th>
                              <th className="py-2.5 px-3 w-16 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {table.items.map((item) => {
                              const isEditing = editingItemId === item.id;
                              const remaining = Math.max(0, item.planned - item.used);
                              const isExceeded = item.used > item.planned;
                              const rowAmount = (item.amount !== undefined && item.amount > 0)
                                ? item.amount
                                : (item.planned * (item.rate || 0));

                              if (isEditing) {
                                return (
                                  <tr key={item.id} className="bg-blue-50/40">
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        value={editFormData.name || ''}
                                        onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                        className="w-full text-xs font-semibold bg-white border border-border rounded-lg px-2 py-1 focus:border-[#2648E7] focus:outline-none"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        value={editFormData.unit || ''}
                                        onChange={e => setEditFormData({ ...editFormData, unit: e.target.value })}
                                        className="w-full text-xs bg-white border border-border rounded-lg px-2 py-1 text-center focus:border-[#2648E7] focus:outline-none"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        step="any"
                                        value={editFormData.planned !== undefined ? editFormData.planned : ''}
                                        onChange={e => setEditFormData({ ...editFormData, planned: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-xs bg-white border border-border rounded-lg px-2 py-1 text-right focus:border-[#2648E7] focus:outline-none"
                                      />
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="number"
                                        step="any"
                                        value={editFormData.rate !== undefined ? editFormData.rate : ''}
                                        onChange={e => setEditFormData({ ...editFormData, rate: parseFloat(e.target.value) || 0 })}
                                        className="w-full text-xs bg-white border border-border rounded-lg px-2 py-1 text-right focus:border-[#2648E7] focus:outline-none"
                                      />
                                    </td>
                                    <td className="py-2 px-3 text-right font-bold text-foreground">
                                      ₹{((Number(editFormData.planned) || 0) * (Number(editFormData.rate) || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </td>
                                    <td className="py-2 px-3 text-right text-muted-foreground">
                                      {item.used}
                                    </td>
                                    <td className="py-2 px-3 text-right font-semibold text-emerald-600">
                                      {Math.max(0, (Number(editFormData.planned) || 0) - item.used)}
                                    </td>
                                    <td className="py-2 px-3">
                                      <input
                                        type="text"
                                        value={editFormData.remarks || ''}
                                        onChange={e => setEditFormData({ ...editFormData, remarks: e.target.value })}
                                        placeholder="Remarks..."
                                        className="w-full text-xs bg-white border border-border rounded-lg px-2 py-1 focus:border-[#2648E7] focus:outline-none"
                                      />
                                    </td>
                                    <td className="py-2 px-3 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          onClick={() => handleSaveEdit(item.id)}
                                          disabled={savingAction}
                                          className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                                          title="Save"
                                        >
                                          <Check size={13} />
                                        </button>
                                        <button
                                          onClick={() => setEditingItemId(null)}
                                          className="p-1 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300"
                                          title="Cancel"
                                        >
                                          <X size={13} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }

                              return (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                                  <td className="py-2.5 px-3.5 font-semibold text-foreground">
                                    <div>{item.name}</div>
                                    {item.code && (
                                      <span className="text-[10px] text-muted-foreground font-mono">
                                        Code: {item.code}
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 text-muted-foreground font-medium">
                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                                      {item.unit}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold text-foreground">
                                    {item.planned.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-3 text-right text-muted-foreground">
                                    {item.rate && item.rate > 0 ? `₹${item.rate.toLocaleString('en-IN')}` : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-extrabold text-foreground">
                                    {rowAmount > 0 ? `₹${rowAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-medium text-muted-foreground">
                                    {item.used.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-bold">
                                    <span className={isExceeded ? 'text-rose-600' : 'text-emerald-700'}>
                                      {remaining.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[200px]" title={item.remarks || ''}>
                                    {item.remarks || '-'}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleStartEdit(item)}
                                        className="p-1 text-muted-foreground hover:text-[#2648E7] rounded hover:bg-[#2648E7]/10"
                                        title="Edit row"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteItem(item.id, item.name)}
                                        className="p-1 text-muted-foreground hover:text-red-600 rounded hover:bg-red-50"
                                        title="Delete row"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Work Package / Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#2648E7]/10 text-[#2648E7]">
                  <FolderPlus size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-foreground">Add New Work Table</h4>
                  <p className="text-[11px] text-muted-foreground">Create a custom work table or choose an industry discipline</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddTableModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            {/* Custom Work Table Name input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase flex items-center justify-between">
                <span>Work Table Name</span>
                {newTableName && (
                  <span className="text-[10px] text-[#2648E7] font-semibold lowercase">custom name</span>
                )}
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Type custom name (e.g. Boundary Wall, Basement Waterproofing, Clubhouse Civil...)"
                value={newTableName}
                onChange={e => setNewTableName(e.target.value)}
                className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-foreground focus:border-[#2648E7] outline-none shadow-2xs"
              />
            </div>

            {/* Table Type / Initial Content Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase">Initial Table Content</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTableCreationMode('empty');
                    setSeedPresetTemplate('none');
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    tableCreationMode === 'empty'
                      ? 'border-[#2648E7] bg-[#2648E7]/5 ring-1 ring-[#2648E7]'
                      : 'border-border bg-slate-50/60 hover:bg-slate-100 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className={tableCreationMode === 'empty' ? 'text-[#2648E7]' : 'text-muted-foreground'} />
                      Empty Table
                    </span>
                    {tableCreationMode === 'empty' && (
                      <span className="size-2 rounded-full bg-[#2648E7]"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    0 items. Start clean and add your custom materials & measurements.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTableCreationMode('preset');
                    if (seedPresetTemplate === 'none' && INDUSTRY_DISCIPLINE_PRESETS.length > 0) {
                      setSeedPresetTemplate(INDUSTRY_DISCIPLINE_PRESETS[0].id);
                      if (!newTableName.trim()) {
                        setNewTableName(INDUSTRY_DISCIPLINE_PRESETS[0].name);
                      }
                    }
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    tableCreationMode === 'preset'
                      ? 'border-[#2648E7] bg-[#2648E7]/5 ring-1 ring-[#2648E7]'
                      : 'border-border bg-slate-50/60 hover:bg-slate-100 text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles size={14} className={tableCreationMode === 'preset' ? 'text-[#2648E7]' : 'text-muted-foreground'} />
                      Starter Template
                    </span>
                    {tableCreationMode === 'preset' && (
                      <span className="size-2 rounded-full bg-[#2648E7]"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground leading-snug">
                    Pre-fill with verified industry starter items (0 initial qty).
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Discipline Presets / Suggestions */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  {tableCreationMode === 'preset' ? 'Select Discipline Preset' : 'Quick Discipline Name Suggestions'}
                </label>
                {newTableName && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewTableName('');
                      setSeedPresetTemplate('none');
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                  >
                    Clear Name
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                {INDUSTRY_DISCIPLINE_PRESETS.map(preset => {
                  const isSelected = (tableCreationMode === 'preset' && seedPresetTemplate === preset.id) ||
                    (tableCreationMode === 'empty' && newTableName === preset.name);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setNewTableName(preset.name);
                        if (tableCreationMode === 'preset') {
                          setSeedPresetTemplate(preset.id);
                        }
                      }}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'border-[#2648E7] bg-[#2648E7]/5 text-[#2648E7] font-bold'
                          : 'border-border bg-slate-50/50 hover:bg-slate-100 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold block truncate">{preset.name.split(',')[0]}</span>
                        {isSelected && <Check size={12} className="text-[#2648E7] shrink-0 ml-1" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {tableCreationMode === 'preset' 
                          ? `${preset.suggestedItems.length} starter materials` 
                          : 'Click to use name'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <span className="shrink-0 text-blue-600 mt-0.5">💡</span>
              <span>
                {tableCreationMode === 'empty'
                  ? 'An empty work table will be created. You can immediately add material rows with rates, quantities, and units.'
                  : 'This work table will be pre-populated with starter materials ready for your site measurements.'}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddTableModal(false)}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewTable}
                disabled={savingAction || !newTableName.trim()}
                className="px-5 py-2 bg-[#2648E7] hover:bg-[#2648E7]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
              >
                {savingAction 
                  ? 'Creating...' 
                  : tableCreationMode === 'empty' 
                    ? '+ Create Empty Table' 
                    : '+ Create Table with Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

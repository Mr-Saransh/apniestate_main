import { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Search, AlertTriangle, Plus, ArrowLeft, Layers, Calendar, BarChart3 } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Modal from '@/components/shared/Modal';
import StatCard from '@/components/shared/StatCard';
import { inventoryApi, type InventoryItem } from '@/api/inventory';
import { apiClient } from '@/api/client';

const categoryFilters = ['All', 'Material', 'Plumbing', 'Electrical', 'Finishing', 'Other'];

export default function InventoryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal and Form controls
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'transaction' | 'material'>('transaction');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown lists
  const [materials, setMaterials] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  // Transaction form states
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [txnType, setTxnType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  // Material form states
  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('pcs');
  const [newMatCategory, setNewMatCategory] = useState('Material');
  const [newMatDesc, setNewMatDesc] = useState('');

  const loadInventory = async () => {
    try {
      const res = await inventoryApi.getAll();
      if (res.data) {
        setInventory(res.data);
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [materialsRes, sitesRes] = await Promise.all([
        apiClient.get<any[]>('/materials'),
        apiClient.get<any[]>('/sites')
      ]);
      setMaterials(materialsRes.data || []);
      setSites(sitesRes.data || []);
    } catch (err) {
      console.error('Failed to load transaction metadata:', err);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      await Promise.all([loadInventory(), loadDropdowns()]);
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('create') === 'true') {
      setShowModal(true);
      setModalMode('transaction');
    }
  }, [location.search]);

  const resetForm = () => {
    setSelectedSiteId('');
    setSelectedMaterialId('');
    setTxnType('IN');
    setQuantity('');
    setNotes('');
    setFormError('');
    setModalMode('transaction');
    setNewMatName('');
    setNewMatUnit('pcs');
    setNewMatCategory('Material');
    setNewMatDesc('');
  };

  const handleTxnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId || !selectedMaterialId || !quantity) {
      setFormError('Please fill out all required fields.');
      return;
    }

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setFormError('Quantity must be a positive number.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      await inventoryApi.recordTransaction({
        site_id: selectedSiteId,
        material_id: selectedMaterialId,
        type: txnType,
        quantity: qtyNum,
        notes: notes || null
      });

      // Reload data
      await loadInventory();
      
      // Reset form & close modal
      resetForm();
      setShowModal(false);
      navigate('/inventory', { replace: true });
    } catch (err: any) {
      console.error('Failed to record stock transaction:', err);
      setFormError(err.response?.data?.message || 'Failed to save transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMaterialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMatName || !newMatUnit) {
      setFormError('Material Name and Unit are required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const res = await apiClient.post<any>('/materials', {
        name: newMatName,
        unit: newMatUnit,
        category: newMatCategory,
        description: newMatDesc || null
      });

      // Reload dropdowns
      await loadDropdowns();

      // Select newly created material
      if (res.data && res.data.id) {
        setSelectedMaterialId(res.data.id);
      }

      // Reset material form & go back to transaction form
      setNewMatName('');
      setNewMatUnit('pcs');
      setNewMatCategory('Material');
      setNewMatDesc('');
      setModalMode('transaction');
    } catch (err: any) {
      console.error('Failed to create new material:', err);
      setFormError(err.response?.data?.message || 'Failed to create material. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || item.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Calculate statistics
  const lowStockCount = inventory.filter(i => i.is_low_stock).length;
  
  const itemsWithUsage = inventory.filter(i => i.avg_daily_usage && i.avg_daily_usage > 0);
  const minDays = itemsWithUsage.length > 0 ? Math.min(...itemsWithUsage.map(i => i.days_remaining ?? 999)) : 999;
  const daysText = minDays === 999 ? 'N/A' : `${minDays} days`;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Physical Inventory</h1>
          <p className="page-subtitle">
            Track stocks, manage transactions, and view depletion warnings across sites.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard
          icon={<Layers size={20} />}
          label="Material Categories"
          value={new Set(inventory.map(i => i.name)).size}
          color="#3B82F6"
          bgColor="rgba(59, 130, 246, 0.1)"
        />
        <StatCard
          icon={<AlertTriangle size={20} />}
          label="Low Stock Items"
          value={lowStockCount}
          color={lowStockCount > 0 ? '#EF4444' : '#10B981'}
          bgColor={lowStockCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="Earliest Depletion"
          value={daysText}
          color={minDays < 15 ? '#EF4444' : '#10B981'}
          bgColor={minDays < 15 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Critical Stock Alerts"
          value={inventory.filter(i => i.is_low_stock && i.quantity <= (i.minQuantity * 0.5)).length}
          color="#F59E0B"
          bgColor="rgba(245, 158, 11, 0.1)"
        />
      </div>

      {/* Search and Filters */}
      <div style={{ marginBottom: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div className="search-input-wrapper" style={{ flex: 1, minWidth: '250px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Search material stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            id="search-inventory"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="filter-bar" style={{ marginBottom: 'var(--space-5)' }}>
        {categoryFilters.map((filter) => (
          <button
            key={filter}
            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Inventory List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package size={36} />}
          title="No inventory records found"
          description="Adjust your search or add a transaction to record stock items."
        />
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-body" style={{ padding: 0 }}>
            {filtered.map((item) => {
              const isLow = item.is_low_stock;
              const daysLeft = item.days_remaining;
              return (
                <div key={item.id} className="list-card hover-row" id={`inventory-${item.id}`}>
                  <div
                    className="list-card-icon"
                    style={{
                      background: isLow ? 'var(--color-danger-bg)' : 'var(--color-primary-50)',
                      color: isLow ? 'var(--color-danger)' : 'var(--color-primary)',
                    }}
                  >
                    {isLow ? <AlertTriangle size={20} /> : <Package size={20} />}
                  </div>
                  <div className="list-card-content">
                    <div className="list-card-title">{item.name}</div>
                    <div className="list-card-subtitle">
                      {item.site?.name || 'Unknown Site'} · {item.category}
                    </div>
                    {item.avg_daily_usage && item.avg_daily_usage > 0 ? (
                      <div className="text-muted" style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span>Daily usage: {item.avg_daily_usage.toFixed(1)} {item.unit}/day · Forecast: {daysLeft === 999 ? '999+' : daysLeft} days left</span>
                        {item.is_estimated && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#F59E0B',
                            background: 'rgba(245, 158, 11, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap'
                          }}
                          title="Based on industry averages. Will auto-switch to actual usage once enough project data is available."
                          >
                            ⚡ Estimated
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="list-card-meta" style={{ textAlign: 'right' }}>
                    <div className="list-card-value" style={{
                      color: isLow ? 'var(--color-danger)' : 'var(--color-text)',
                      fontWeight: 'bold'
                    }}>
                      {item.quantity} {item.unit}
                    </div>
                    {isLow && (
                      <div style={{ color: 'var(--color-danger)', fontSize: '11px', fontWeight: '500', marginTop: '2px' }}>
                        Low Stock Alert
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Modal Popup */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); navigate('/inventory', { replace: true }); }}
        title={modalMode === 'transaction' ? 'Record Stock Transaction' : 'Create New Material Type'}
        footer={
          modalMode === 'transaction' ? (
            <>
              <button 
                type="button"
                className="btn btn-secondary btn-3d btn-3d-secondary" 
                onClick={() => { setShowModal(false); resetForm(); navigate('/inventory', { replace: true }); }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn btn-primary btn-3d btn-3d-primary"
                onClick={handleTxnSubmit as any}
                disabled={saving || !selectedSiteId || !selectedMaterialId || !quantity}
                id="submit-record-transaction"
              >
                {saving ? 'Saving...' : 'Save Transaction'}
              </button>
            </>
          ) : (
            <>
              <button 
                type="button"
                className="btn btn-secondary btn-3d btn-3d-secondary" 
                onClick={() => { setModalMode('transaction'); setFormError(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button 
                type="submit"
                className="btn btn-primary btn-3d btn-3d-primary"
                onClick={handleMaterialSubmit as any}
                disabled={saving || !newMatName || !newMatUnit}
                id="submit-create-material"
              >
                {saving ? 'Creating...' : 'Create Material'}
              </button>
            </>
          )
        }
      >
        {modalMode === 'transaction' ? (
          <form onSubmit={handleTxnSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {formError && <div className="login-error"><span>{formError}</span></div>}

            <div className="form-group">
              <label className="form-label" htmlFor="txn-site">Site Location *</label>
              <select
                id="txn-site"
                className="form-input form-select"
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                required
              >
                <option value="">Select Site Location...</option>
                {sites.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-1)' }}>
                <label className="form-label" htmlFor="txn-material" style={{ marginBottom: 0 }}>Material *</label>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => { setModalMode('material'); setFormError(''); }}
                  style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', minHeight: 'unset', height: 'auto' }}
                >
                  <Plus size={12} /> New Material Type
                </button>
              </div>
              <select
                id="txn-material"
                className="form-input form-select"
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                required
              >
                <option value="">Select Material...</option>
                {materials.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="txn-type">Movement Type *</label>
                <select
                  id="txn-type"
                  className="form-input form-select"
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value as any)}
                  required
                >
                  <option value="IN">Stock In (+)</option>
                  <option value="OUT">Stock Out (-)</option>
                  <option value="ADJUST">Adjustment (+/-)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="txn-quantity">Quantity *</label>
                <input
                  id="txn-quantity"
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="Enter quantity"
                  className="form-input premium-input"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="txn-notes">Notes / Remarks</label>
              <textarea
                id="txn-notes"
                className="form-input premium-input"
                placeholder="e.g. Received from vendor XYZ, issued to foundation work..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </form>
        ) : (
          <form onSubmit={handleMaterialSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {formError && <div className="login-error"><span>{formError}</span></div>}

            <div className="form-group">
              <label className="form-label" htmlFor="mat-name">Material Name *</label>
              <input
                id="mat-name"
                type="text"
                className="form-input premium-input"
                placeholder="e.g. Concrete mix, Sand, Steel Rebar..."
                value={newMatName}
                onChange={(e) => setNewMatName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="mat-unit">Measurement Unit *</label>
                <input
                  id="mat-unit"
                  type="text"
                  className="form-input premium-input"
                  placeholder="e.g. bags, cft, kg, pcs, liters"
                  value={newMatUnit}
                  onChange={(e) => setNewMatUnit(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="mat-category">Category *</label>
                <select
                  id="mat-category"
                  className="form-input form-select"
                  value={newMatCategory}
                  onChange={(e) => setNewMatCategory(e.target.value)}
                  required
                >
                  <option value="Material">Material</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Finishing">Finishing</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="mat-desc">Description</label>
              <textarea
                id="mat-desc"
                className="form-input premium-input"
                placeholder="Specifications or brand information..."
                value={newMatDesc}
                onChange={(e) => setNewMatDesc(e.target.value)}
                rows={2}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

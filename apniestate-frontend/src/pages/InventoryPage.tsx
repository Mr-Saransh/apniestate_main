import React, { useState, useEffect, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Package, Plus, X, AlertTriangle } from 'lucide-react';
import { inventoryApi, type InventoryItem } from '@/api/inventory';
import { apiClient } from '@/api/client';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';

export default function InventoryPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal and Form controls
  const [showModal, setShowModal] = useState(false);
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

  const loadInventory = async () => {
    try {
      const res = await inventoryApi.getAll();
      if (res.data) setInventory(res.data);
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
    }
  }, [location.search]);

  const resetForm = () => {
    setSelectedSiteId('');
    setSelectedMaterialId('');
    setTxnType('IN');
    setQuantity('');
    setNotes('');
    setFormError('');
  };

  const handleTxnSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSiteId || !selectedMaterialId || !quantity) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    setSaving(true);
    setFormError('');
    try {
      await inventoryApi.recordTransaction({
        site_id: selectedSiteId,
        material_id: selectedMaterialId,
        type: txnType,
        quantity: Number(quantity),
        notes: notes || null
      });
      
      setShowModal(false);
      resetForm();
      loadInventory();
      navigate('/inventory', { replace: true });
    } catch (err: any) {
      setFormError(err.message || 'Transaction failed');
    } finally {
      setSaving(false);
    }
  };

  const filtered = inventory.filter((item: any) => 
    !searchQuery || 
    item.material?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.site?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = inventory.filter((i: any) => {
    const minThreshold = i.material?.min_threshold || 100;
    return i.quantity < minThreshold;
  }).length;
  
  const lowStockNames = inventory.filter((i: any) => {
    const minThreshold = i.material?.min_threshold || 100;
    return i.quantity < minThreshold;
  }).map((i: any) => `${i.material?.name} at ${i.site?.name}`).join(', ');

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Inventory" sub="Current stock across all site warehouses" />
      
      {lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700">{lowStockCount} materials below minimum threshold</p>
            <p className="text-[10px] text-red-500 mt-0.5">{lowStockNames}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearchQuery(e.target.value)}>
          <SrchBar placeholder="Search inventory..." />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3 h-3" /> Transaction
        </button>
      </div>

      <Card noPad>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No inventory items found</div>
        ) : (
          filtered.map((item: any, i) => {
            const minThreshold = item.material?.min_threshold || 100;
            const isCritical = item.quantity <= minThreshold * 0.25;
            const isLow = item.quantity < minThreshold && !isCritical;
            const status = isCritical ? "Critical" : isLow ? "Low" : "OK";
            const color = isCritical ? "red" : isLow ? "yellow" : "green";

            return (
              <div key={item.id || i} className={`flex items-center gap-3 px-4 py-3 ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{item.material?.name || 'Unknown'}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{item.site?.name || 'Unknown Site'}</p>
                </div>
                <div className="text-right mr-2 flex-shrink-0">
                  <p className="text-xs font-bold text-foreground">{item.quantity.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">{item.material?.unit || 'units'}</p>
                </div>
                <Chip color={color}>{status}</Chip>
              </div>
            );
          })
        )}
      </Card>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border">
              <h2 className="text-sm font-bold">New Inventory Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleTxnSubmit} className="p-4 overflow-y-auto space-y-4">
              {formError && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs">{formError}</div>}
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="radio" name="txntype" checked={txnType === 'IN'} onChange={() => setTxnType('IN')} className="text-primary" />
                    <span className="text-xs font-bold text-emerald-600">Stock IN</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-muted/50 transition-colors">
                    <input type="radio" name="txntype" checked={txnType === 'OUT'} onChange={() => setTxnType('OUT')} className="text-primary" />
                    <span className="text-xs font-bold text-red-600">Stock OUT</span>
                  </label>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Site *</label>
                  <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)}>
                    <option value="">Select a Site</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Material *</label>
                  <select required className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)}>
                    <option value="">Select a Material</option>
                    {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quantity *</label>
                  <input type="number" required min="1" step="0.01" className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes (Optional)</label>
                  <textarea className="w-full mt-1 p-2 bg-muted border border-border rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={txnType === 'OUT' ? "Where was it used?" : "Supplier / Bill details"} />
                </div>
              </div>
              
              <div className="border-t border-border flex gap-2 -mx-4 -mb-4 pt-4 px-4 bg-muted/30 rounded-b-2xl pb-4 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-primary text-white text-sm font-medium flex justify-center items-center hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {saving ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

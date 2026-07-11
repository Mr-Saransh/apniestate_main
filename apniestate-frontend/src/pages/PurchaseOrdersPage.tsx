import React, { useState, useEffect, type FormEvent } from 'react';
import { ShoppingCart, Calendar, Download, Plus, Trash2, IndianRupee } from 'lucide-react';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { purchaseOrdersApi, type PurchaseOrder } from '@/api/purchaseOrders';
import { vendorsApi, type Vendor } from '@/api/vendors';
import { apiClient } from '@/api/client';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useProject } from '@/context/ProjectContext';

export default function PurchaseOrdersPage() {
  const { activeProjectId } = useProject();
  const [search, setSearch] = useState('');
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Dropdown Data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);

  // Form State
  const [vendorId, setVendorId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeProjectId]);

  const fetchData = async () => {
    if (!activeProjectId) {
      setPos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [posRes, vendorsRes, materialsRes] = await Promise.all([
        purchaseOrdersApi.getPurchaseOrders({ project_id: activeProjectId }),
        vendorsApi.getVendors(),
        apiClient.get<any[]>('/materials')
      ]);
      if (posRes.data) setPos(posRes.data);
      if (vendorsRes.data) setVendors(vendorsRes.data);
      if (materialsRes.data) setMaterials(materialsRes.data);
    } catch (err) {
      console.error('Failed to fetch PO data', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setVendorId('');
    setDeliveryDate('');
    setNotes('');
    setItems([]);
    setFormError('');
  };

  const handleAddItem = () => {
    setItems([...items, { material_id: '', quantity: 1, unit_price: 0, gst_rate: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-fill price if material changes
    if (field === 'material_id') {
      const mat = materials.find(m => m.id === value);
      if (mat) {
        newItems[index].unit_price = mat.rate || 0;
      }
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    if (!vendorId) return setFormError("Vendor is required");
    if (items.length === 0) return setFormError("At least one item is required");
    if (items.some(i => !i.material_id || i.quantity <= 0)) {
      return setFormError("Please fill all item fields properly");
    }

    setSubmitting(true);
    try {
      await purchaseOrdersApi.createPurchaseOrder({
        vendor_id: vendorId,
        delivery_date: deliveryDate || null,
        notes,
        items: items.map(i => ({
          material_id: i.material_id,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          gst_rate: Number(i.gst_rate)
        }))
      });
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create PO');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = pos.filter(p => 
    p.po_number.toLowerCase().includes(search.toLowerCase()) || 
    (p.vendor?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatMoney = (val: number) => {
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)}L`;
    return `₹ ${val.toLocaleString()}`;
  };

  // Calculations for modal
  const subtotal = items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0);
  const totalGst = items.reduce((acc, i) => acc + (i.quantity * i.unit_price * (i.gst_rate / 100)), 0);
  const grandTotal = subtotal + totalGst;

  if (loading) return <LoadingSpinner size="lg" />;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <PH title="Purchase Orders" sub="Track material and service orders" />
      
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search by PO Number or Vendor..." />
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="px-3 py-2 bg-[#2648E7] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#2648E7]/90 transition-colors"
        >
          <ShoppingCart size={14} /> Create PO
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 mt-4">
          <ShoppingCart className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-900">No Purchase Orders Found</p>
          <p className="text-sm mt-1">Create a new purchase order to start tracking procurement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <Card key={p.id} noPad className="hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className="p-4 flex flex-col h-full gap-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 leading-snug">{p.vendor?.name || 'Unknown Vendor'}</h3>
                    <p className="text-[10px] font-mono text-gray-500 mt-0.5">{p.po_number}</p>
                  </div>
                  <Chip color={p.status === 'APPROVED' || p.status === 'SENT' ? 'green' : p.status === 'DRAFT' ? 'gray' : 'yellow'}>
                    {p.status}
                  </Chip>
                </div>
                
                <div className="text-lg font-black text-gray-900">
                  {formatMoney(p.total_amount)}
                </div>
                
                <div className="mt-auto pt-3 border-t border-gray-100 flex items-center gap-2 text-[11px] font-medium text-gray-500">
                  <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(p.created_at).toLocaleDateString()}</div>
                  <div className="flex-1" />
                  <button onClick={(e) => { e.stopPropagation(); alert(`Downloading PDF for ${p.po_number}...`) }} className="p-1.5 hover:bg-gray-100 text-gray-700 rounded transition-colors"><Download size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create Purchase Order"
        footer={
          <>
            <button className="btn btn-ghost text-gray-700" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</button>
            <button
              className="btn bg-[#2648E7] text-white hover:bg-[#2648E7]/90 ml-2"
              onClick={handleSubmit as any}
              disabled={submitting || !vendorId || items.length === 0}
            >
              {submitting ? 'Creating...' : 'Create PO'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="text-gray-900" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {formError && <div className="bg-red-50 text-red-600 p-2 text-sm rounded">{formError}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label font-medium text-gray-700 text-sm block mb-1">Vendor *</label>
              <select 
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label font-medium text-gray-700 text-sm block mb-1">Expected Delivery Date</label>
              <input 
                type="date" 
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm"
                value={deliveryDate} 
                onChange={(e) => setDeliveryDate(e.target.value)} 
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-sm text-gray-900">Line Items</h3>
              <button 
                type="button"
                onClick={handleAddItem}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded flex items-center gap-1 font-medium hover:bg-blue-100"
              >
                <Plus size={12} /> Add Item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end mb-2 p-3 bg-gray-50 rounded-lg border border-gray-100 relative">
                <div className="flex-1">
                  <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Material</label>
                  <select 
                    className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-xs"
                    value={item.material_id}
                    onChange={(e) => handleItemChange(index, 'material_id', e.target.value)}
                    required
                  >
                    <option value="">Select...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Qty</label>
                  <input 
                    type="number" min="1" step="0.01"
                    className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-xs"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <label className="text-[10px] text-gray-500 font-medium block mb-0.5">Rate (₹)</label>
                  <input 
                    type="number" min="0" step="0.01"
                    className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-xs"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <label className="text-[10px] text-gray-500 font-medium block mb-0.5">GST %</label>
                  <input 
                    type="number" min="0" step="0.1"
                    className="w-full px-2 py-1.5 bg-white text-gray-900 border border-gray-300 rounded text-xs"
                    value={item.gst_rate}
                    onChange={(e) => handleItemChange(index, 'gst_rate', e.target.value)}
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => handleRemoveItem(index)}
                  className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100 mb-0.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            
            {items.length === 0 && (
              <div className="text-center text-xs text-gray-400 py-4 italic">No items added yet.</div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Subtotal:</span>
              <span className="font-mono">₹ {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>GST Amount:</span>
              <span className="font-mono text-gray-500">₹ {totalGst.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Amount:</span>
              <span className="font-mono text-[#2648E7]">₹ {grandTotal.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="form-group mt-2">
            <label className="form-label font-medium text-gray-700 text-sm block mb-1">Internal Notes</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm"
              placeholder="Any specific delivery instructions..."
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}

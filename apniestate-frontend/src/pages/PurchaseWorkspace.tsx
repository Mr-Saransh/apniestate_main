import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { ShoppingCart, Plus, FileSpreadsheet, Package, ClipboardList, CheckCircle2, Archive, Truck, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { purchaseApi, type PurchaseSummaryResponse, type BOQItemSummary, type MaterialRequestSummary, type OrderSummary, type ReceivedSummary, type VendorSummary } from '@/api/purchase';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

type PurchaseTab = "boq" | "requests" | "quotations" | "orders" | "received" | "inventory" | "vendors";

const PURCHASE_TABS: { id: PurchaseTab; label: string; icon: React.ReactNode }[] = [
  { id: "boq", label: "BOQ", icon: <FileSpreadsheet size={14} /> },
  { id: "requests", label: "Requests", icon: <Package size={14} /> },
  { id: "quotations", label: "Quotations", icon: <ClipboardList size={14} /> },
  { id: "orders", label: "Orders", icon: <ShoppingCart size={14} /> },
  { id: "received", label: "Received", icon: <CheckCircle2 size={14} /> },
  { id: "inventory", label: "Inventory", icon: <Archive size={14} /> },
  { id: "vendors", label: "Vendors", icon: <Truck size={14} /> },
];

export default function PurchaseWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject, activeProjectId, loading: projectLoading } = useProject();
  const tab = (searchParams.get('tab') || 'requests') as PurchaseTab;

  const [data, setData] = useState<PurchaseSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const refreshData = () => {
    if (!activeProjectId) return;
    setLoading(true);
    // Append a timestamp to prevent aggressive browser caching
    purchaseApi.getSummary(`${activeProjectId}&t=${Date.now()}`)
      .then((res: any) => {
        console.log("PURCHASE SUMMARY DATA:", res.data);
        setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshData();
  }, [activeProjectId]);

  if (projectLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!activeProjectId || !activeProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShoppingCart size={48} className="text-muted-foreground opacity-40 mb-4" />
        <h2 className="text-xl font-bold text-foreground">No Project Selected</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs">Please select a project from the top bar to view purchase operations.</p>
      </div>
    );
  }

  const getNewButtonLabel = () => {
    switch (tab) {
      case 'boq': return 'Add BOQ Item';
      case 'vendors': return 'Add Vendor';
      case 'orders': return 'Create Order';
      default: return 'New Request';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Tab strip */}
      <div className="bg-white border-b border-border px-4 pt-4 pb-0 shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Purchase</h2>
          <button 
            onClick={() => setActiveModal(tab)}
            className="flex items-center gap-1.5 text-sm font-bold text-white px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>
            <Plus size={14} />{getNewButtonLabel()}
          </button>
        </div>
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {PURCHASE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSearchParams({ tab: t.id }, { replace: true })}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold border-b-2 shrink-0 transition-colors whitespace-nowrap ${
                tab === t.id ? "border-[#2648E7] text-[#2648E7]" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5">
          {tab === 'boq' && <BOQTab items={data?.boq_items || []} projectName={activeProject.name} />}
          {tab === 'requests' && <RequestsTab requests={data?.material_requests || []} onRefresh={refreshData} />}
          {tab === 'quotations' && <QuotationsTab />}
          {tab === 'orders' && <OrdersTab orders={data?.orders || []} />}
          {tab === 'received' && <ReceivedTab received={data?.received || []} />}
          {tab === 'inventory' && <InventoryTab items={data?.boq_items || []} />}
          {tab === 'vendors' && <VendorsTab vendors={data?.vendors || []} />}
        </div>
      </div>
      
      <PurchaseModals activeModal={activeModal} onClose={() => setActiveModal(null)} onRefresh={refreshData} projectId={activeProjectId!} />
    </div>
  );
}

function BOQTab({ items, projectName }: { items: BOQItemSummary[], projectName: string }) {
  if (items.length === 0) return <div className="text-center text-muted-foreground py-10">No BOQ items found.</div>;
  return (
    <div className="space-y-4">
      <SectionLabel>Bill of Quantities — {projectName}</SectionLabel>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-0">
          {/* Header */}
          <div className="contents">
            {["Material", "Unit", "Planned", "Used", "Left"].map((h) => (
              <div key={h} className="bg-muted px-3 py-2.5 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">
                {h}
              </div>
            ))}
          </div>
          {/* Rows */}
          {items.map((item, i) => {
            const remaining = item.planned - item.used;
            const pct = item.planned > 0 ? (item.used / item.planned) * 100 : 0;
            const low = pct > 80;
            const border = i > 0 ? "border-t border-border" : "";
            return (
              <div key={item.id} className="contents">
                <div className={`px-3 py-3 text-sm font-semibold text-foreground ${border}`}>{item.name}</div>
                <div className={`px-3 py-3 text-sm text-muted-foreground ${border}`}>{item.unit}</div>
                <div className={`px-3 py-3 text-sm text-foreground ${border}`}>{item.planned.toLocaleString()}</div>
                <div className={`px-3 py-3 text-sm ${low ? "text-amber-600 font-semibold" : "text-foreground"} ${border}`}>{item.used.toLocaleString()}</div>
                <div className={`px-3 py-3 text-sm font-bold ${remaining <= 0 ? "text-red-600" : "text-emerald-600"} ${border}`}>{remaining.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RequestsTab({ requests, onRefresh }: { requests: MaterialRequestSummary[], onRefresh: () => void }) {
  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await purchaseApi.performAction('UPDATE_REQUEST_STATUS', { requestId: id, status: approve ? 'APPROVED' : 'REJECTED' });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (id: string) => {
    try {
      await purchaseApi.performAction('UPDATE_REQUEST_STATUS', { requestId: id, status: 'PENDING_APPROVAL' });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const stageBadge = (stage: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING_APPROVAL: { label: "Needs Approval", cls: "bg-amber-50 text-amber-700" },
      QUOTATION: { label: "Getting Quotes", cls: "bg-blue-50 text-[#2648E7]" },
      DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600" },
      ORDERED: { label: "Ordered", cls: "bg-emerald-50 text-emerald-700" },
      APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700" },
    };
    const s = map[stage] ?? { label: stage, cls: "bg-gray-100 text-gray-600" };
    return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  if (requests.length === 0) return <div className="text-center text-muted-foreground py-10">No requests found.</div>;

  return (
    <div className="space-y-3">
      {requests.map((m) => (
        <Card key={m.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Package size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-sm text-foreground">{m.name}</p>
                {stageBadge(m.stage)}
              </div>
              <p className="text-sm text-muted-foreground">Quantity: {m.qty}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border flex gap-2">
            {m.stage === "PENDING_APPROVAL" && (
              <>
                <button onClick={() => handleApprove(m.id, true)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>Approve</button>
                <button onClick={() => handleApprove(m.id, false)} className="flex-1 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">Reject</button>
              </>
            )}
            {m.stage === "QUOTATION" && (
              <button className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>View Quotations</button>
            )}
            {(m.stage === "ORDERED" || m.stage === "APPROVED") && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
                <CheckCircle2 size={15} />{m.stage === "ORDERED" ? "Order placed" : "Approved"}
              </span>
            )}
            {m.stage === "DRAFT" && (
              <button onClick={() => handleSubmit(m.id)} className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>Submit for Approval</button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function QuotationsTab() {
  // Temporary static view for Quotations since API returns nested data and we don't have a specific request selected
  // In a real flow, you'd select a Material Request first.
  return (
    <div className="space-y-4">
      <SectionLabel>Sample Quotations — (Select a Request to view actuals)</SectionLabel>
      <div className="space-y-3">
        {[
          { vendor: "Shri Ram Traders", price: 380, total: 76000, rating: "4.8 ★", delivery: "3 days", recommended: true },
          { vendor: "Kumar Materials", price: 395, total: 79000, rating: "4.5 ★", delivery: "2 days", recommended: false },
        ].map((q) => (
          <Card key={q.vendor} className={`p-4 ${q.recommended ? "border-[#2648E7]/30" : ""}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-foreground">{q.vendor}</p>
                  {q.recommended && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Recommended</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{q.rating} · Delivery in {q.delivery}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">₹{q.price}/unit</p>
                <p className="text-sm text-muted-foreground">Total: ₹{q.total.toLocaleString()}</p>
              </div>
            </div>
            <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>
              Accept &amp; Create Purchase Order
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) return <div className="text-center text-muted-foreground py-10">No orders found.</div>;
  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <Card key={o.id} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0 pr-3">
              <p className="font-bold text-foreground">{o.name}</p>
              <p className="text-sm text-muted-foreground">{o.vendor}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-foreground">{o.amount}</p>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${o.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#2648E7]"}`}>
                {o.status}
              </span>
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Ordered: {o.date}</span>
            <span>ETA: {o.eta}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ReceivedTab({ received }: { received: ReceivedSummary[] }) {
  if (received.length === 0) return <div className="text-center text-muted-foreground py-10">No received items found.</div>;
  return (
    <div className="space-y-3">
      {received.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${r.quality === "GOOD" ? "bg-emerald-50" : "bg-red-50"}`}>
              {r.quality === "GOOD" ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Archive size={18} className="text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.vendor} · {r.received}</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.quality === "GOOD" ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>{r.quality}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InventoryTab({ items }: { items: BOQItemSummary[] }) {
  if (items.length === 0) return <div className="text-center text-muted-foreground py-10">No inventory to track. Add BOQ items first.</div>;
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const pct = item.planned > 0 ? (item.used / item.planned) * 100 : 0;
        const isLow = pct > 75;
        return (
          <Card key={item.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm text-foreground">{item.name}</p>
              {isLow && <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Running Low</span>}
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: isLow ? "#f59e0b" : "#2648E7" }} />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Used: {item.used.toLocaleString()} {item.unit}</span>
              <span>Remaining: {(item.planned - item.used).toLocaleString()} {item.unit}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function VendorsTab({ vendors }: { vendors: VendorSummary[] }) {
  if (vendors.length === 0) return <div className="text-center text-muted-foreground py-10">No vendors found.</div>;
  return (
    <div className="space-y-3">
      {vendors.map((v) => (
        <Card key={v.id} className="p-4 flex items-center gap-3">
          <div className="size-11 rounded-xl bg-[#2648E7]/8 flex items-center justify-center shrink-0">
            <Truck size={18} className="text-[#2648E7]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-foreground">{v.name}</p>
            <p className="text-xs text-muted-foreground">{v.category} · {v.rating} · {v.orders} orders</p>
          </div>
          {v.due !== "₹0" && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-red-600">{v.due}</p>
              <p className="text-[10px] text-muted-foreground">due</p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function PurchaseModals({ activeModal, onClose, onRefresh, projectId }: { activeModal: string | null, onClose: () => void, onRefresh: () => void, projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  if (!activeModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let action = '';
    if (activeModal === 'requests') action = 'CREATE_REQUEST';
    if (activeModal === 'boq') action = 'CREATE_BOQ_ITEM';
    if (activeModal === 'vendors') action = 'CREATE_VENDOR';
    
    try {
      await purchaseApi.performAction(action, { ...formData, projectId });
      onRefresh();
      onClose();
      setFormData({});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<string, string> = {
    requests: 'New Material Request',
    boq: 'Add BOQ Item',
    vendors: 'Add Vendor'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-background w-full max-w-md rounded-[32px] sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{titles[activeModal] || 'New Item'}</h2>
          <button onClick={onClose} className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-gray-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="purchase-form" onSubmit={handleSubmit} className="space-y-4">
            {activeModal === 'requests' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Material Name</label>
                  <input required type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] transition-all text-gray-900" placeholder="e.g. Cement OPC 53 Grade" value={formData.materialName || ''} onChange={e => setFormData({...formData, materialName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Quantity</label>
                    <input required type="number" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" placeholder="0" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Urgency</label>
                    <select className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" value={formData.urgency || 'NORMAL'} onChange={e => setFormData({...formData, urgency: e.target.value})}>
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {activeModal === 'boq' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Material / Description</label>
                  <input required type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" placeholder="e.g. River Sand" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Planned Qty</label>
                    <input required type="number" min="0" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" placeholder="0" value={formData.planned || ''} onChange={e => setFormData({...formData, planned: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Unit</label>
                    <select required className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})}>
                      <option value="" disabled>Select Unit</option>
                      <option value="kg">kg</option>
                      <option value="bags">bags</option>
                      <option value="cum">cum</option>
                      <option value="cft">cft</option>
                      <option value="m">m</option>
                      <option value="nos">nos</option>
                      <option value="lumpsum">lumpsum</option>
                      <option value="sqft">sqft</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Estimated Rate (₹)</label>
                  <input required type="number" min="0" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2648E7]/20 focus:border-[#2648E7] text-gray-900" placeholder="0" value={formData.rate || ''} onChange={e => setFormData({...formData, rate: e.target.value})} />
                </div>
              </>
            )}

            {activeModal === 'vendors' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Vendor Name</label>
                  <input required type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" placeholder="e.g. Shri Ram Traders" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Category</label>
                  <input required type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" placeholder="e.g. Cement & Sand" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Contact Phone (Optional)</label>
                  <input type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" placeholder="+91..." value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </>
            )}

            {activeModal !== 'requests' && activeModal !== 'boq' && activeModal !== 'vendors' && (
              <div className="py-4 text-center text-muted-foreground text-sm">
                This form is under construction.
              </div>
            )}
          </form>
        </div>

        <div className="px-6 py-4 border-t border-border bg-gray-50 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl font-bold text-sm text-foreground bg-white border border-border shadow-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="purchase-form" disabled={loading} className="flex-1 py-3 rounded-2xl font-bold text-sm text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#2648E7" }}>
            {loading ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
}

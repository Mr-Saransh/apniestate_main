import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, Plus, FileSpreadsheet, Package, ClipboardList, CheckCircle2, Archive, Truck, X, Trash2, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { purchaseApi, type PurchaseSummaryResponse, type BOQItemSummary, type MaterialRequestSummary, type OrderSummary, type ReceivedSummary, type VendorSummary, type ConsumptionLog } from '@/api/purchase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
        console.log("PURCHASE SUMMARY DATA:", res);
        // Sometimes the backend wraps in { data: ... }, sometimes it just returns the object directly.
        const payload = res.data ? res.data : res;
        setData(payload);
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
      case 'quotations': return 'Add Quotation';
      case 'received': return 'Receive Goods';
      case 'inventory': return 'Consume Material';
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
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold border-b-2 shrink-0 transition-colors whitespace-nowrap ${tab === t.id ? "border-[#2648E7] text-[#2648E7]" : "border-transparent text-muted-foreground hover:text-foreground"
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
          {tab === 'boq' && <BOQTab items={data?.boq_items || []} projectName={activeProject.name} onRefresh={refreshData} />}
          {tab === 'requests' && <RequestsTab requests={data?.material_requests || []} onRefresh={refreshData} />}
          {tab === 'quotations' && <QuotationsTab quotations={data?.quotations || []} />}
          {tab === 'orders' && <OrdersTab orders={data?.orders || []} />}
          {tab === 'received' && <ReceivedTab received={data?.received || []} />}
          {tab === 'inventory' && <InventoryTab items={data?.inventory || []} logs={data?.consumption_logs || []} />}
          {tab === 'vendors' && <VendorsTab vendors={data?.vendors || []} />}
        </div>
      </div>

      <PurchaseModals activeModal={activeModal} onClose={() => setActiveModal(null)} onRefresh={refreshData} projectId={activeProjectId!} data={data} />
    </div>
  );
}

function BOQTab({ items, projectName, onRefresh }: { items: BOQItemSummary[], projectName: string, onRefresh: () => void }) {
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this BOQ item?")) return;
    try {
      await purchaseApi.performAction('DELETE_BOQ_ITEM', { itemId: id });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  if (items.length === 0) return <div className="text-center text-muted-foreground py-10">No BOQ items found.</div>;
  return (
    <div className="space-y-4">
      <SectionLabel>Bill of Quantities — {projectName}</SectionLabel>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px_80px_40px] gap-0">
          {/* Header */}
          <div className="contents">
            {["Material", "Unit", "Planned", "Used", "Left", ""].map((h, idx) => (
              <div key={idx} className="bg-muted px-3 py-2.5 text-[11px] font-bold text-muted-foreground uppercase border-b border-border">
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
              <div key={item.id} className="contents group">
                <div className={`px-3 py-3 text-sm font-semibold text-foreground flex items-center ${border}`}>{item.name}</div>
                <div className={`px-3 py-3 text-sm text-muted-foreground flex items-center ${border}`}>{item.unit}</div>
                <div className={`px-3 py-3 text-sm text-foreground flex items-center ${border}`}>{item.planned.toLocaleString()}</div>
                <div className={`px-3 py-3 text-sm flex items-center ${low ? "text-amber-600 font-semibold" : "text-foreground"} ${border}`}>{item.used.toLocaleString()}</div>
                <div className={`px-3 py-3 text-sm font-bold flex items-center ${remaining <= 0 ? "text-red-600" : "text-emerald-600"} ${border}`}>{remaining.toLocaleString()}</div>
                <div className={`px-3 py-3 flex items-center justify-center ${border}`}>
                  <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RequestsTab({ requests, onRefresh }: { requests: MaterialRequestSummary[], onRefresh: () => void }) {
  const { user } = useAuth();
  const role = user?.role || 'BUILDER';
  
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
            {m.stage === "PENDING_APPROVAL" && role !== "SITE_SUPERVISOR" && (
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

function QuotationsTab({ quotations }: { quotations: any[] }) {
  if (quotations.length === 0) return <div className="text-center text-muted-foreground py-10">No quotations found.</div>;
  return (
    <div className="space-y-3">
      {quotations.map((q) => (
        <Card key={q.id} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-foreground">{q.vendor}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{q.material}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-foreground">{q.rate}/unit</p>
              <p className="text-sm text-muted-foreground">Total: {q.total}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={`px-2.5 py-1 rounded-full ${q.status === 'SUBMITTED' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-[#2648E7]'}`}>
              {q.status}
            </span>
          </div>
        </Card>
      ))}
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
  const handleDownloadPDF = async (r: ReceivedSummary) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Goods Receipt Note (GRN)", 14, 20);
    doc.setFontSize(11);
    doc.text(`GRN ID: ${r.id}`, 14, 30);
    doc.text(`Vendor: ${r.vendor}`, 14, 37);
    doc.text(`Date Received: ${r.received}`, 14, 44);
    doc.text(`Total Amount: ${r.amount}`, 14, 51);
    doc.text(`Quality Status: ${r.quality}`, 14, 58);

    if (r.fullItems && r.fullItems.length > 0) {
      const tableData = r.fullItems.map(item => [
        item.name,
        `${item.qty} ${item.unit}`,
        `₹${item.price.toLocaleString()}`,
        `₹${item.total.toLocaleString()}`
      ]);
      autoTable(doc, {
        startY: 65,
        head: [['Material', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
      });
    }

    if (r.billUrl) {
      const finalY = (doc as any).lastAutoTable?.finalY || 65;
      doc.text("Attached Bill:", 14, finalY + 15);
      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = r.billUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
        });

        // Basic scaling to fit page width (A4 is 210mm wide)
        const maxWidth = 180;
        const scale = maxWidth / img.width;
        const width = img.width * scale;
        const height = img.height * scale;

        // Add new page if image doesn't fit
        if (finalY + 20 + height > 280) {
          doc.addPage();
          doc.addImage(img, 'JPEG', 15, 20, width, height);
        } else {
          doc.addImage(img, 'JPEG', 15, finalY + 20, width, height);
        }
      } catch (err) {
        console.error("Failed to add image to PDF", err);
      }
    }

    doc.save(`GRN_${r.id}.pdf`);
  };

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
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.quality === "GOOD" ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>{r.quality}</span>
              <button onClick={() => handleDownloadPDF(r)} className="text-[#2648E7] hover:text-blue-800 flex items-center gap-1 text-xs font-semibold">
                <Download size={14} /> PDF
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function InventoryTab({ items, logs }: { items: any[], logs: ConsumptionLog[] }) {
  const [view, setView] = useState<'stock' | 'history'>('stock');

  return (
    <div className="space-y-4">
      <div className="flex p-1 bg-muted rounded-xl">
        <button
          onClick={() => setView('stock')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'stock' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Current Stock
        </button>
        <button
          onClick={() => setView('history')}
          className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${view === 'history' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Consumption History
        </button>
      </div>

      {view === 'stock' ? (
        items.length === 0 ? <div className="text-center text-muted-foreground py-10">No inventory found.</div> :
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm text-foreground">{item.material}</p>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Stock: <strong className="text-foreground">{item.stock}</strong></span>
                  <span>Reorder Level: {item.reorderLevel}</span>
                </div>
              </Card>
            ))}
          </div>
      ) : (
        logs.length === 0 ? <div className="text-center text-muted-foreground py-10">No consumption logs found.</div> :
          <div className="space-y-3">
            {logs.map((log) => (
              <Card key={log.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-foreground">{log.material}</p>
                    <p className="text-xs text-muted-foreground">{log.date} at {log.time}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-red-600">-{log.qty}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
      )}
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
            <p className="text-xs text-muted-foreground">{v.category} · {v.gst} · {v.orders} orders</p>
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

function PurchaseModals({ activeModal, onClose, onRefresh, projectId, data }: { activeModal: string | null, onClose: () => void, onRefresh: () => void, projectId: string, data: PurchaseSummaryResponse | null }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (activeModal && ['boq', 'quotations', 'orders', 'received'].includes(activeModal)) {
      setFormData({ items: [{}] });
    } else if (activeModal === 'inventory') {
      setFormData({ items: [] });
    } else {
      setFormData({});
    }
  }, [activeModal]);

  if (!activeModal) return null;

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleInventoryConsumeChange = (materialName: string, quantity: string) => {
    const qty = parseInt(quantity, 10);
    const existingItems = formData.items || [];
    
    if (!quantity || isNaN(qty) || qty <= 0) {
      setFormData({
        ...formData,
        items: existingItems.filter((i: any) => i.materialName !== materialName)
      });
    } else {
      const idx = existingItems.findIndex((i: any) => i.materialName === materialName);
      if (idx >= 0) {
        const newItems = [...existingItems];
        newItems[idx].quantity = qty;
        setFormData({ ...formData, items: newItems });
      } else {
        setFormData({ ...formData, items: [...existingItems, { materialName, quantity: qty }] });
      }
    }
  };

  const addItemRow = () => {
    setFormData({ ...formData, items: [...(formData.items || []), {}] });
  };

  const removeItemRow = (index: number) => {
    const newItems = [...(formData.items || [])];
    if (newItems.length === 1) return; // Keep at least one
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let action = '';
    if (activeModal === 'requests') action = 'CREATE_REQUEST';
    if (activeModal === 'boq') action = 'CREATE_BOQ_ITEM';
    if (activeModal === 'vendors') action = 'CREATE_VENDOR';
    if (activeModal === 'quotations') action = 'CREATE_QUOTATION';
    if (activeModal === 'orders') action = 'CREATE_PO';
    if (activeModal === 'received') action = 'RECEIVE_GOODS';
    if (activeModal === 'inventory') action = 'CONSUME_MATERIAL';

    try {
      let payload = { ...formData, projectId };
      if (activeModal === 'received' && formData.billFile) {
        const uploadData = new FormData();
        uploadData.append('file', formData.billFile);

        // Use the backend's signed cloudinary upload endpoint and rely on proxy for CORS
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_URL || '/api';
        const res = await fetch(`${API_BASE}/cloudinary/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: uploadData
        });
        if (!res.ok) throw new Error('Failed to upload bill to Cloudinary');
        const cloudRes = await res.json();
        payload.billUrl = cloudRes.result.secure_url;
        delete payload.billFile;
      }

      await purchaseApi.performAction(action, payload);
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
    vendors: 'Add Vendor',
    quotations: 'Add Quotation',
    orders: 'Create Purchase Order',
    received: 'Receive Goods (GRN)',
    inventory: 'Consume Material'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-background w-full max-w-xl rounded-[32px] sm:rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
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
                  <input required type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="e.g. Cement OPC 53 Grade" value={formData.materialName || ''} onChange={e => setFormData({ ...formData, materialName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Quantity</label>
                    <input required type="number" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="0" value={formData.quantity || ''} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Urgency</label>
                    <select className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" value={formData.urgency || 'NORMAL'} onChange={e => setFormData({ ...formData, urgency: e.target.value })}>
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
                <div className="mt-4 mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">BOQ Items</label>
                  <button type="button" onClick={addItemRow} className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted/50 border border-border rounded-xl relative group">
                      <button type="button" onClick={() => removeItemRow(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <input required type="text" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Material / Description (e.g. River Sand)" value={item.name || ''} onChange={e => handleItemChange(idx, 'name', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input required type="number" min="1" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Qty" value={item.planned || ''} onChange={e => handleItemChange(idx, 'planned', e.target.value)} />
                          <select required className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" value={item.unit || ''} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                            <option value="" disabled>Unit</option>
                            <option value="kg">kg</option>
                            <option value="bags">bags</option>
                            <option value="cum">cum</option>
                            <option value="cft">cft</option>
                            <option value="m">m</option>
                            <option value="nos">nos/pieces</option>
                            <option value="lumpsum">lumpsum</option>
                            <option value="sqft">sqft</option>
                          </select>
                          <input required type="number" min="0" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Rate (₹)" value={item.rate || ''} onChange={e => handleItemChange(idx, 'rate', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeModal === 'vendors' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Vendor Name</label>
                  <input required type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" placeholder="e.g. Shri Ram Traders" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Category</label>
                  <input required type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" placeholder="e.g. Cement & Sand" value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Contact Phone (Optional)</label>
                  <input type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" placeholder="+91..." value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </>
            )}

            {(activeModal === 'quotations' || activeModal === 'orders') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Vendor</label>
                  <select required className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" value={formData.vendorId || ''} onChange={e => setFormData({ ...formData, vendorId: e.target.value })}>
                    <option value="" disabled>Select Vendor</option>
                    {data?.vendors?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                {activeModal === 'quotations' ? (
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Delivery Time (Days)</label>
                    <input type="text" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" placeholder="e.g. 7 Days" value={formData.deliveryTime || ''} onChange={e => setFormData({ ...formData, deliveryTime: e.target.value })} />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">ETA (Date)</label>
                    <input type="date" className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none text-gray-900" value={formData.eta || ''} onChange={e => setFormData({ ...formData, eta: e.target.value })} />
                  </div>
                )}

                <div className="mt-4 mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">Items</label>
                  <button type="button" onClick={addItemRow} className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted/50 border border-border rounded-xl relative group">
                      <button type="button" onClick={() => removeItemRow(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                      <div className="space-y-3">
                        <input required type="text" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Material Name (e.g. TMT Steel 12mm)" value={item.materialName || ''} onChange={e => handleItemChange(idx, 'materialName', e.target.value)} />
                        <div className="grid grid-cols-3 gap-3">
                          <input required type="number" min="1" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Quantity" value={item.quantity || ''} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                          <select required className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" value={item.unit || ''} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                            <option value="" disabled>Unit</option>
                            <option value="kg">kg</option>
                            <option value="bags">bags</option>
                            <option value="cum">cum</option>
                            <option value="cft">cft</option>
                            <option value="m">m</option>
                            <option value="nos">nos/pieces</option>
                            <option value="lumpsum">lumpsum</option>
                            <option value="sqft">sqft</option>
                          </select>
                          <input required type="number" min="0" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Rate (₹)" value={item.rate || ''} onChange={e => handleItemChange(idx, 'rate', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeModal === 'received' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Purchase Order</label>
                  <select required className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" value={formData.poId || ''} onChange={e => {
                    setFormData({ ...formData, poId: e.target.value, items: [{}] }); // Reset items when PO changes, in reality we should auto-populate
                  }}>
                    <option value="" disabled>Select Purchase Order</option>
                    {data?.orders?.map(o => <option key={o.id} value={o.id}>{o.name} ({o.vendor})</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Quality Status</label>
                  <select className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" value={formData.quality || 'GOOD'} onChange={e => setFormData({ ...formData, quality: e.target.value })}>
                    <option value="GOOD">Good / Accepted</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="PARTIAL">Partial Damage</option>
                  </select>
                </div>

                <div className="mt-4 mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">Items Received</label>
                  <button type="button" onClick={addItemRow} className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1">
                    <Plus size={12} /> Add Item Row
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items?.map((item: any, idx: number) => (
                    <div key={idx} className="p-3 bg-muted/50 border border-border rounded-xl relative group flex gap-3">
                      <button type="button" onClick={() => removeItemRow(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                      <input required type="text" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Material Name from PO" value={item.poItemId || ''} onChange={e => handleItemChange(idx, 'poItemId', e.target.value)} />
                      <input required type="number" min="0" className="w-32 shrink-0 bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Recv Qty" value={item.receivedQty || ''} onChange={e => handleItemChange(idx, 'receivedQty', e.target.value)} />
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    * Normally this would auto-populate with the PO's items. For this demo, just enter the exact Material ID or Name corresponding to the PO item.
                  </p>
                </div>

                <div className="space-y-1.5 mt-4">
                  <label className="text-sm font-bold text-foreground">Upload Bill (Optional)</label>
                  <input type="file" accept="image/*,.pdf" className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#2648E7]/10 file:text-[#2648E7] hover:file:bg-[#2648E7]/20 transition-all cursor-pointer" onChange={e => setFormData({ ...formData, billFile: e.target.files?.[0] })} />
                </div>
              </>
            )}

            {activeModal === 'inventory' && (
              <>
                <div className="mt-4 mb-2">
                  <label className="text-sm font-bold text-foreground">Materials Consumed</label>
                  <p className="text-xs text-muted-foreground mt-1">Specify what you have consumed and how much. Only items with quantity &gt; 0 will be logged.</p>
                </div>
                <div className="space-y-2 mt-4 max-h-[350px] overflow-y-auto pr-2">
                  {data?.inventory?.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4">No inventory available to consume.</p>
                  ) : (
                    data?.inventory?.map(i => {
                      const selected = formData.items?.find((item: any) => item.materialName === i.material) || {};
                      return (
                        <div key={i.id} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-xl">
                          <div>
                            <p className="text-sm font-bold text-foreground">{i.material}</p>
                            <p className="text-xs text-muted-foreground">Available Stock: {i.stock}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              min="0" 
                              max={i.stock}
                              placeholder="Qty Consumed"
                              className="w-32 bg-white border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" 
                              value={selected.quantity || ''}
                              onChange={e => handleInventoryConsumeChange(i.material, e.target.value)}
                            />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </>
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

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, Plus, FileSpreadsheet, Package, ClipboardList,
  CheckCircle2, Archive, Truck, X, Trash2, Download, UploadCloud, Edit3, ArrowRight, PackageCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { purchaseApi, type PurchaseSummaryResponse, type BOQItemSummary, type MaterialRequestSummary, type OrderSummary, type ReceivedSummary, type VendorSummary, type ConsumptionLog } from '@/api/purchase';
import ImportBOQModal from '@/components/purchase/ImportBOQModal';
import VendorsPage from './VendorsPage';
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
  { id: "requests", label: "Requirements", icon: <Package size={14} /> },
  { id: "orders", label: "Orders", icon: <ShoppingCart size={14} /> },
  { id: "received", label: "Received", icon: <CheckCircle2 size={14} /> },
  { id: "inventory", label: "Inventory", icon: <Archive size={14} /> },
  { id: "vendors", label: "Vendors", icon: <Truck size={14} /> },
  { id: "quotations", label: "Quotations", icon: <ClipboardList size={14} /> },
];

export default function PurchaseWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject, activeProjectId, loading: projectLoading } = useProject();
  const tab = (searchParams.get('tab') || 'requests') as PurchaseTab;

  const [data, setData] = useState<PurchaseSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [orderPrefill, setOrderPrefill] = useState<{ materialName: string; quantity: number } | null>(null);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);

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
      {/* Visual Workflow Progression: Site Engg -> PM Review -> Order -> Received -> Inventory */}
      <div className="bg-white border-b border-border px-4 py-2 overflow-x-auto hide-scrollbar shrink-0">
        <div className="flex items-center gap-1 text-xs max-w-2xl mx-auto justify-between min-w-[500px]">
          {[
            { step: '1', title: 'Requirement', sub: 'Site Supervisor', tabKey: 'requests' },
            { step: '2', title: 'PM Review', sub: 'Approve / Modify', tabKey: 'requests' },
            { step: '3', title: 'Order', sub: 'Purchase Order', tabKey: 'orders' },
            { step: '4', title: 'Received', sub: 'GRN Inspection', tabKey: 'received' },
            { step: '5', title: 'Inventory', sub: 'Site Stock', tabKey: 'inventory' },
          ].map((s, idx) => (
            <React.Fragment key={s.step}>
              <button
                onClick={() => setSearchParams({ tab: s.tabKey }, { replace: true })}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
                  tab === s.tabKey ? 'bg-[#2648E7]/10 text-[#2648E7] font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className={`size-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  tab === s.tabKey ? 'bg-[#2648E7] text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {s.step}
                </span>
                <span className="text-[11px] font-semibold">{s.title}</span>
              </button>
              {idx < 4 && <span className="text-muted-foreground/30 text-xs">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tab strip */}
      <div className="bg-white border-b border-border px-4 pt-3 pb-0 shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Procurement</h2>
          <button
            onClick={() => setActiveModal(tab)}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-xl transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>
            <Plus size={14} />{getNewButtonLabel()}
          </button>
        </div>
        <div className="flex gap-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {PURCHASE_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setSearchParams({ tab: t.id }, { replace: true })}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold border-b-2 shrink-0 transition-colors whitespace-nowrap ${tab === t.id ? "border-[#2648E7] text-[#2648E7]" : "border-transparent text-muted-foreground hover:text-foreground"
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
          {tab === 'boq' && <BOQTab items={data?.boq_items || []} projectName={activeProject.name} onRefresh={refreshData} projectId={activeProjectId!} />}
          {tab === 'requests' && (
            <RequestsTab 
              requests={data?.material_requests || []} 
              onRefresh={refreshData}
              onConvertToOrder={(materialName, quantity) => {
                setOrderPrefill({ materialName, quantity });
                setActiveModal('orders');
              }}
            />
          )}
          {tab === 'quotations' && <QuotationsTab quotations={data?.quotations || []} />}
          {tab === 'orders' && (
            <OrdersTab 
              orders={data?.orders || []} 
              onReceiveOrder={(poId) => {
                setReceivePoId(poId);
                setActiveModal('received');
              }}
            />
          )}
          {tab === 'received' && <ReceivedTab received={data?.received || []} />}
          {tab === 'inventory' && <InventoryTab items={data?.inventory || []} logs={data?.consumption_logs || []} />}
          {tab === 'vendors' && <VendorsPage />}
        </div>
      </div>

      <PurchaseModals 
        activeModal={activeModal} 
        onClose={() => { setActiveModal(null); setOrderPrefill(null); setReceivePoId(null); }} 
        onRefresh={refreshData} 
        projectId={activeProjectId!} 
        data={data} 
        orderPrefill={orderPrefill} 
        initialPoId={receivePoId}
      />
    </div>
  );
}

function BOQTab({ items, projectName, onRefresh, projectId }: { items: BOQItemSummary[], projectName: string, onRefresh: () => void, projectId: string }) {
  const [showImport, setShowImport] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this BOQ item?")) return;
    try {
      await purchaseApi.performAction('DELETE_BOQ_ITEM', { itemId: id });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Bill of Quantities — {projectName}</SectionLabel>
        <button 
          onClick={() => setShowImport(true)} 
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2648E7]/10 hover:bg-[#2648E7]/20 text-[#2648E7] text-xs font-bold rounded-xl transition-colors mb-3 shadow-sm"
        >
          <UploadCloud size={14} /> Import BOQ (Revit / Excel)
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 bg-white rounded-2xl border border-border p-6">
          <FileSpreadsheet size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-bold text-foreground">No BOQ items added yet</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Import an existing schedule from Revit/Tekla or add items manually.</p>
          <button 
            onClick={() => setShowImport(true)} 
            className="px-4 py-2 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
          >
            <UploadCloud size={14} /> Import BOQ File
          </button>
        </div>
      ) : (
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
      )}

      <ImportBOQModal 
        isOpen={showImport} 
        onClose={() => setShowImport(false)} 
        onSuccess={onRefresh} 
        projectId={projectId} 
      />
    </div>
  );
}

function RequestsTab({ 
  requests, 
  onRefresh, 
  onConvertToOrder 
}: { 
  requests: MaterialRequestSummary[], 
  onRefresh: () => void, 
  onConvertToOrder: (materialName: string, quantity: number) => void 
}) {
  const { user } = useAuth();
  const role = user?.role || 'BUILDER';
  const [modifyingReq, setModifyingReq] = useState<MaterialRequestSummary | null>(null);
  const [newQty, setNewQty] = useState<string>('');
  const [modifyNotes, setModifyNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  
  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await purchaseApi.performAction('UPDATE_REQUEST_STATUS', { requestId: id, status: approve ? 'APPROVED' : 'REJECTED' });
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenModify = (req: MaterialRequestSummary) => {
    setModifyingReq(req);
    setNewQty(String(req.qty));
    setModifyNotes('');
  };

  const handleSaveModification = async (approveAlso: boolean) => {
    if (!modifyingReq) return;
    setSubmitting(true);
    try {
      await purchaseApi.performAction('MODIFY_REQUEST', {
        requestId: modifyingReq.id,
        quantity: parseFloat(newQty) || modifyingReq.qty,
        approvedQuantity: parseFloat(newQty) || modifyingReq.qty,
        status: approveAlso ? 'APPROVED' : undefined,
        notes: modifyNotes || undefined
      });
      setModifyingReq(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update requirement');
    } finally {
      setSubmitting(false);
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
      PENDING_APPROVAL: { label: "Pending PM Review", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
      QUOTATION: { label: "Getting Quotes", cls: "bg-blue-50 text-[#2648E7] border border-blue-200" },
      DRAFT: { label: "Draft", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
      ORDERED: { label: "Order Placed", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
      APPROVED: { label: "Approved", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    };
    const s = map[stage] ?? { label: stage, cls: "bg-gray-100 text-gray-600" };
    return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
  };

  if (requests.length === 0) return <div className="text-center text-muted-foreground py-10">No material requirements found.</div>;

  return (
    <div className="space-y-3">
      {requests.map((m) => (
        <Card key={m.id} className="p-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-[#2648E7]/10 flex items-center justify-center shrink-0">
              <Package size={18} className="text-[#2648E7]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-bold text-sm text-foreground">{m.name}</p>
                {stageBadge(m.stage)}
              </div>
              <p className="text-sm text-muted-foreground">Quantity: <strong className="text-foreground">{m.qty}</strong></p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.date}</p>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
            {m.stage === "PENDING_APPROVAL" && role !== "SITE_SUPERVISOR" && (
              <>
                <button onClick={() => handleApprove(m.id, true)} className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: "#2648E7" }}>
                  Approve
                </button>
                <button onClick={() => handleOpenModify(m)} className="px-3 py-2 rounded-xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 transition-colors flex items-center gap-1">
                  <Edit3 size={13} /> Modify
                </button>
                <button onClick={() => handleApprove(m.id, false)} className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                  Reject
                </button>
              </>
            )}

            {m.stage === "APPROVED" && (
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <CheckCircle2 size={15} /> Approved
                </span>
                <button
                  onClick={() => onConvertToOrder(m.name, parseInt(m.qty, 10) || 1)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <ShoppingCart size={13} /> Create Order
                </button>
              </div>
            )}

            {m.stage === "ORDERED" && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                <CheckCircle2 size={15} /> Purchase order generated
              </span>
            )}

            {m.stage === "DRAFT" && (
              <button onClick={() => handleSubmit(m.id)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: "#2648E7" }}>
                Submit for Approval
              </button>
            )}
          </div>
        </Card>
      ))}

      {/* Modify Requirement Dialog */}
      {modifyingReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border border-border shadow-2xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-foreground">Modify Requirement</h3>
              <button onClick={() => setModifyingReq(null)} className="p-1 hover:bg-muted rounded-lg"><X size={16} /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Material</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{modifyingReq.name}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Approved Quantity</label>
                <input 
                  type="number" 
                  min="0.1" 
                  step="any"
                  value={newQty} 
                  onChange={e => setNewQty(e.target.value)} 
                  className="w-full text-sm font-bold bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-[#2648E7]" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">PM Notes / Remarks</label>
                <input 
                  type="text" 
                  placeholder="Optional review note..."
                  value={modifyNotes} 
                  onChange={e => setModifyNotes(e.target.value)} 
                  className="w-full text-xs font-medium bg-muted/40 border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-[#2648E7]" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setModifyingReq(null)} className="px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted rounded-xl">Cancel</button>
              <button 
                disabled={submitting}
                onClick={() => handleSaveModification(false)} 
                className="px-3 py-2 text-xs font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl"
              >
                Save Changes
              </button>
              <button 
                disabled={submitting}
                onClick={() => handleSaveModification(true)} 
                className="px-3 py-2 text-xs font-bold bg-[#2648E7] hover:bg-[#2648E7]/90 text-white rounded-xl shadow-sm"
              >
                Save & Approve
              </button>
            </div>
          </div>
        </div>
      )}
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

function OrdersTab({ 
  orders, 
  onReceiveOrder 
}: { 
  orders: OrderSummary[]; 
  onReceiveOrder?: (poId: string) => void;
}) {
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
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <div className="flex gap-4">
              <span>Ordered: {o.date}</span>
              <span>ETA: {o.eta}</span>
            </div>
            {o.status !== "DELIVERED" && onReceiveOrder && (
              <button
                type="button"
                onClick={() => onReceiveOrder(o.id)}
                className="text-xs font-bold text-[#2648E7] hover:bg-[#2648E7]/10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors border border-[#2648E7]/20"
              >
                <PackageCheck size={13} /> Receive Goods
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function ReceivedTab({ received }: { received: ReceivedSummary[] }) {
  const handleDownloadPDF = async (r: ReceivedSummary) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    // Premium Header
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageW, 40, 'F');
    doc.setFillColor(38, 72, 231); // Brand blue
    doc.rect(0, 40, pageW, 4, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text("GOODS RECEIPT NOTE", 14, 24);

    doc.setFontSize(10);
    doc.setTextColor(180, 195, 255);
    doc.text(`GRN ID: ${r.id}`, 14, 32);

    doc.setFontSize(9);
    doc.text(`GENERATED`, pageW - 14, 20, { align: 'right' });
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`${new Date().toLocaleDateString('en-IN')}`, pageW - 14, 26, { align: 'right' });

    // Details Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text("Vendor Details", 14, 55);
    
    doc.setDrawColor(38, 72, 231);
    doc.setLineWidth(1);
    doc.line(14, 58, 40, 58);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text("Vendor Name:", 14, 68);
    doc.text("Date Received:", 14, 76);
    doc.text("Total Amount:", 110, 68);
    doc.text("Quality Status:", 110, 76);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(r.vendor, 45, 68);
    doc.text(r.received, 45, 76);
    doc.text(r.amount, 140, 68);
    doc.text(r.quality, 140, 76);

    let currentY = 85;

    if (r.fullItems && r.fullItems.length > 0) {
      const tableData = r.fullItems.map(item => [
        item.name,
        `${item.qty} ${item.unit}`,
        `₹${item.price.toLocaleString()}`,
        `₹${item.total.toLocaleString()}`
      ]);
      autoTable(doc, {
        startY: currentY,
        head: [['Material', 'Quantity', 'Unit Price', 'Total']],
        body: tableData,
        headStyles: { fillColor: [38, 72, 231] },
        styles: { fontSize: 9 },
      });
      currentY = (doc as any).lastAutoTable?.finalY || currentY;
    }

    if (r.billUrl) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("Attached Bill", 14, currentY + 15);
      doc.setDrawColor(38, 72, 231);
      doc.setLineWidth(1);
      doc.line(14, currentY + 18, 40, currentY + 18);

      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = r.billUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
        });

        const maxWidth = 180;
        const scale = maxWidth / img.width;
        const width = img.width * scale;
        const height = img.height * scale;

        if (currentY + 25 + height > pageH - 20) {
          doc.addPage();
          doc.addImage(img, 'JPEG', 15, 20, width, height);
        } else {
          doc.addImage(img, 'JPEG', 15, currentY + 25, width, height);
        }
      } catch (err) {
        console.error("Failed to add image to PDF", err);
      }
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, pageH - 15, pageW - 14, pageH - 15);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.text('Apni Estate - Premium Construction Management System', 14, pageH - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, { align: 'right' });
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


function PurchaseModals({ 
  activeModal, 
  onClose, 
  onRefresh, 
  projectId, 
  data, 
  orderPrefill,
  initialPoId 
}: { 
  activeModal: string | null; 
  onClose: () => void; 
  onRefresh: () => void; 
  projectId: string; 
  data: PurchaseSummaryResponse | null;
  orderPrefill?: { materialName: string; quantity: number } | null;
  initialPoId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setErrorMsg(null);
    if (!activeModal) {
      setFormData({});
      return;
    }

    if (activeModal === 'received') {
      const orders = data?.orders || [];
      const targetPo = (initialPoId ? orders.find(o => o.id === initialPoId) : null) || orders[0];
      if (targetPo) {
        const prefilledItems = (targetPo.items && targetPo.items.length > 0)
          ? targetPo.items.map(it => ({
              poItemId: it.id,
              materialId: it.materialId,
              materialName: it.materialName,
              unit: it.unit,
              orderedQty: it.orderedQty,
              pendingQty: it.pendingQty,
              receivedQty: it.pendingQty > 0 ? it.pendingQty : it.orderedQty
            }))
          : [{ poItemId: targetPo.id, materialName: targetPo.name, receivedQty: 1, unit: 'units' }];

        setFormData({
          poId: targetPo.id,
          quality: 'GOOD',
          items: prefilledItems
        });
      } else {
        setFormData({ quality: 'GOOD', items: [] });
      }
      return;
    }

    if (activeModal === 'orders' && orderPrefill) {
      setFormData({
        items: [{ materialName: orderPrefill.materialName, quantity: orderPrefill.quantity, unit: 'bags' }]
      });
      return;
    }

    if (['boq', 'quotations', 'orders'].includes(activeModal)) {
      setFormData({ items: [{}] });
      return;
    }

    if (activeModal === 'inventory') {
      setFormData({ items: [] });
      return;
    }

    setFormData({});
  }, [activeModal, orderPrefill, initialPoId, data]);

  if (!activeModal) return null;

  const handlePoChange = (selectedPoId: string) => {
    const selectedPo = data?.orders?.find(o => o.id === selectedPoId);
    if (selectedPo) {
      const prefilledItems = (selectedPo.items && selectedPo.items.length > 0)
        ? selectedPo.items.map(it => ({
            poItemId: it.id,
            materialId: it.materialId,
            materialName: it.materialName,
            unit: it.unit,
            orderedQty: it.orderedQty,
            pendingQty: it.pendingQty,
            receivedQty: it.pendingQty > 0 ? it.pendingQty : it.orderedQty
          }))
        : [{ poItemId: selectedPo.id, materialName: selectedPo.name, receivedQty: 1, unit: 'units' }];

      setFormData((prev: any) => ({
        ...prev,
        poId: selectedPoId,
        items: prefilledItems
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        poId: selectedPoId,
        items: []
      }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...(formData.items || [])];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleInventoryConsumeChange = (materialName: string, quantity: string, maxStock: number) => {
    const qty = parseInt(quantity, 10);
    const existingItems = formData.items || [];
    
    if (!quantity || isNaN(qty) || qty <= 0) {
      setFormData({
        ...formData,
        items: existingItems.filter((i: any) => i.materialName !== materialName)
      });
      return;
    }

    if (qty > maxStock) {
      setErrorMsg(`Cannot consume ${qty} of "${materialName}". Available stock is only ${maxStock}.`);
    } else {
      setErrorMsg(null);
    }

    const cappedQty = Math.min(qty, Math.max(0, maxStock));
    if (cappedQty <= 0) {
      setFormData({
        ...formData,
        items: existingItems.filter((i: any) => i.materialName !== materialName)
      });
      return;
    }

    const idx = existingItems.findIndex((i: any) => i.materialName === materialName);
    if (idx >= 0) {
      const newItems = [...existingItems];
      newItems[idx].quantity = cappedQty;
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({ ...formData, items: [...existingItems, { materialName, quantity: cappedQty }] });
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
    setErrorMsg(null);
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

      if (activeModal === 'received') {
        if (!payload.poId) {
          setErrorMsg('Please select a purchase order.');
          setLoading(false);
          return;
        }
        if (!payload.items || payload.items.length === 0) {
          setErrorMsg('No items selected to receive.');
          setLoading(false);
          return;
        }
        const validItems = payload.items.filter((it: any) => Number(it.receivedQty) > 0);
        if (validItems.length === 0) {
          setErrorMsg('Please enter a received quantity greater than 0 for at least one item.');
          setLoading(false);
          return;
        }
        payload.items = validItems;
      }

      if (activeModal === 'inventory') {
        const validItems = (payload.items || []).filter((it: any) => Number(it.quantity) > 0);
        if (validItems.length === 0) {
          setErrorMsg('Please specify at least one material with quantity greater than 0 to consume.');
          setLoading(false);
          return;
        }

        for (const it of validItems) {
          const invItem = data?.inventory?.find(i => i.material === it.materialName);
          const stock = invItem ? Number(invItem.stock) || 0 : 0;
          if (stock <= 0) {
            setErrorMsg(`Cannot consume "${it.materialName}". It is currently out of stock (0 available).`);
            setLoading(false);
            return;
          }
          if (Number(it.quantity) > stock) {
            setErrorMsg(`Cannot consume ${it.quantity} of "${it.materialName}". Available stock is only ${stock}.`);
            setLoading(false);
            return;
          }
        }
        payload.items = validItems;
      }

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
      setErrorMsg(null);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || err?.error || 'An error occurred while saving details.');
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
          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs font-semibold border border-red-200 mb-4 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button type="button" onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 p-1">
                <X size={14} />
              </button>
            </div>
          )}
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
                  {(!data?.orders || data.orders.length === 0) ? (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs border border-amber-200">
                      No purchase orders found for this project. Please create a purchase order first.
                    </div>
                  ) : (
                    <select
                      required
                      className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                      value={formData.poId || ''}
                      onChange={e => handlePoChange(e.target.value)}
                    >
                      <option value="" disabled>Select Purchase Order</option>
                      {data.orders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.vendor}) — {o.status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Quality Status</label>
                  <select
                    className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                    value={formData.quality || 'GOOD'}
                    onChange={e => setFormData({ ...formData, quality: e.target.value })}
                  >
                    <option value="GOOD">Good / Accepted</option>
                    <option value="PARTIAL">Partial Damage</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div className="mt-4 mb-2 flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-foreground">Items Received</label>
                    <p className="text-[11px] text-muted-foreground">
                      Auto-filled from order. Edit received quantities if partial delivery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        items: [
                          ...(formData.items || []),
                          { materialName: '', unit: 'units', orderedQty: 0, receivedQty: 1 }
                        ]
                      });
                    }}
                    className="text-xs font-bold text-[#2648E7] hover:underline flex items-center gap-1 shrink-0"
                  >
                    <Plus size={12} /> Add Item Row
                  </button>
                </div>

                <div className="space-y-3">
                  {(!formData.items || formData.items.length === 0) ? (
                    <div className="text-center p-4 bg-muted/30 border border-dashed border-border rounded-xl text-xs text-muted-foreground">
                      No items found in selected order. Click "+ Add Item Row" to enter manually.
                    </div>
                  ) : (
                    formData.items.map((item: any, idx: number) => {
                      const isPrepopulated = !!item.poItemId;
                      return (
                        <div key={idx} className="p-3.5 bg-muted/40 border border-border rounded-2xl relative group hover:border-[#2648E7]/40 transition-colors">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                            title="Remove this item"
                          >
                            <X size={14} />
                          </button>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                            <div className="flex-1 min-w-0">
                              {isPrepopulated ? (
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-foreground truncate">
                                      {item.materialName || 'Material Item'}
                                    </span>
                                    {item.unit && (
                                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-[#2648E7] font-semibold">
                                        {item.unit}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-0.5 flex gap-2">
                                    <span>Ordered: <strong>{item.orderedQty ?? '-'} {item.unit || ''}</strong></span>
                                    {item.pendingQty !== undefined && item.pendingQty !== item.orderedQty && (
                                      <span>· Remaining: <strong>{item.pendingQty}</strong></span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <input
                                  required
                                  type="text"
                                  className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900"
                                  placeholder="Material Name"
                                  value={item.materialName || ''}
                                  onChange={e => handleItemChange(idx, 'materialName', e.target.value)}
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                Recv Qty:
                              </label>
                              <div className="relative flex items-center">
                                <input
                                  required
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="w-24 bg-white border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-[#2648E7] text-right pr-2"
                                  value={item.receivedQty !== undefined ? item.receivedQty : ''}
                                  onChange={e => handleItemChange(idx, 'receivedQty', e.target.value)}
                                />
                                {item.unit && (
                                  <span className="text-xs text-muted-foreground ml-1.5">
                                    {item.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="space-y-1.5 mt-4">
                  <label className="text-sm font-bold text-foreground">Upload Bill / Challan (Optional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#2648E7]/10 file:text-[#2648E7] hover:file:bg-[#2648E7]/20 transition-all cursor-pointer"
                    onChange={e => setFormData({ ...formData, billFile: e.target.files?.[0] })}
                  />
                </div>
              </>
            )}

            {activeModal === 'inventory' && (
              <>
                <div className="mt-4 mb-2">
                  <label className="text-sm font-bold text-foreground">Materials Consumed</label>
                  <p className="text-xs text-muted-foreground mt-1">Specify what you have consumed and how much. Only items with available stock can be consumed.</p>
                </div>
                <div className="space-y-2 mt-4 max-h-[350px] overflow-y-auto pr-2">
                  {(!data?.inventory || data.inventory.length === 0) ? (
                    <p className="text-sm text-muted-foreground py-4">No inventory available to consume.</p>
                  ) : (
                    data.inventory.map(i => {
                      const stock = Number(i.stock) || 0;
                      const isOutOfStock = stock <= 0;
                      const selected = formData.items?.find((item: any) => item.materialName === i.material) || {};
                      return (
                        <div key={i.id} className={`flex items-center justify-between p-3.5 border rounded-2xl transition-colors ${isOutOfStock ? 'bg-muted/30 border-border/60 opacity-60' : 'bg-white border-border hover:border-[#2648E7]/40'}`}>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-foreground">{i.material}</p>
                              {isOutOfStock && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Available Stock: <strong className={isOutOfStock ? 'text-rose-600' : 'text-foreground'}>{i.stock}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isOutOfStock ? (
                              <span className="text-xs font-semibold text-muted-foreground italic px-3 py-1.5 bg-muted rounded-xl">
                                0 Available
                              </span>
                            ) : (
                              <div className="relative flex items-center">
                                <input 
                                  type="number" 
                                  min="1" 
                                  max={stock}
                                  placeholder="Qty to use"
                                  className="w-28 bg-white border border-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:border-[#2648E7] text-right" 
                                  value={selected.quantity || ''}
                                  onChange={e => handleInventoryConsumeChange(i.material, e.target.value, stock)}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
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
            {loading ? 'Saving...' : activeModal === 'received' ? 'Receive Goods' : activeModal === 'inventory' ? 'Consume Material' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
}

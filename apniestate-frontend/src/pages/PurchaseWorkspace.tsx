import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShoppingCart, Plus, FileSpreadsheet, Package, ClipboardList,
  CheckCircle2, Archive, Truck, X, Trash2, Download, UploadCloud, Edit3, ArrowRight, PackageCheck, Layers, FileText,
  Star, Clock, Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { purchaseApi, type PurchaseSummaryResponse, type BOQItemSummary, type MaterialRequestSummary, type OrderSummary, type ReceivedSummary, type VendorSummary, type ConsumptionLog } from '@/api/purchase';
import { vendorsApi } from '@/api/vendors';
import ImportEstimationModal from '@/components/purchase/ImportEstimationModal';
import QuantityOfMaterialsTab from '@/components/purchase/QuantityOfMaterialsTab';
import SmartMaterialSelect, { CostIntelligenceCard } from '@/components/purchase/SmartMaterialSelect';
import VendorsPage from './VendorsPage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { normalizeUnit, cleanNumeric, detectDiscipline } from '@/utils/constructionIntelligence';

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
      {children}
    </h3>
  );
}

type PurchaseTab = "boq" | "requests" | "quotations" | "orders" | "received" | "inventory" | "vendors";

const PURCHASE_TABS: { id: PurchaseTab; label: string; icon: React.ReactNode }[] = [
  { id: "boq", label: "Quantity of Materials", icon: <Layers size={14} /> },
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
  const [orderPrefill, setOrderPrefill] = useState<any | null>(null);
  const [receivePoId, setReceivePoId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Quick Rate Vendor state from ReceivedTab
  const [rateVendorTarget, setRateVendorTarget] = useState<{ id: string; name: string } | null>(null);
  const [vendorRatingScore, setVendorRatingScore] = useState(5);
  const [vendorRatingHover, setVendorRatingHover] = useState(0);
  const [vendorRatingComment, setVendorRatingComment] = useState('');
  const [selectedRatingTags, setSelectedRatingTags] = useState<string[]>([]);
  const [submittingVendorRating, setSubmittingVendorRating] = useState(false);
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);

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
      case 'boq': return 'Add Material';
      case 'vendors': return 'Add Vendor';
      case 'orders': return 'Create Order';
      case 'quotations': return 'Add Quotation';
      case 'received': return 'Receive Goods';
      case 'inventory': return 'Consume Material';
      default: return 'New Requirement';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Visual Workflow Progression: Baseline Qty of Materials -> Site Requirement -> Order -> Received -> Inventory */}
      <div className="bg-white border-b border-border px-4 py-2 overflow-x-auto hide-scrollbar shrink-0">
        <div className="flex items-center gap-1 text-xs max-w-2xl mx-auto justify-between min-w-[500px]">
          {[
            { step: '1', title: 'Qty of Materials', sub: 'Baseline Estimate', tabKey: 'boq' },
            { step: '2', title: 'Requirements', sub: 'Site Indents', tabKey: 'requests' },
            { step: '3', title: 'Orders', sub: 'Purchase Orders', tabKey: 'orders' },
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
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>Procurement & Materials</h2>
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
        <div className={`mx-auto px-4 py-5 ${tab === 'boq' ? 'max-w-6xl' : 'max-w-2xl'}`}>
          {tab === 'boq' && (
            <QuantityOfMaterialsTab 
              categories={data?.boq_categories}
              items={data?.boq_items || []} 
              projectName={activeProject.name} 
              projectId={activeProjectId!} 
              onRefresh={refreshData} 
              onOpenImport={() => setShowImportModal(true)} 
            />
          )}
          {tab === 'requests' && (
            <RequestsTab 
              requests={data?.material_requests || []} 
              onRefresh={refreshData}
              onConvertToOrder={(materialName, quantity, requestId) => {
                setOrderPrefill({ materialName, quantity, requestId });
                setActiveModal('orders');
              }}
            />
          )}
          {tab === 'quotations' && (
            <QuotationsTab 
              quotations={data?.quotations || []} 
              orders={data?.orders || []}
              projectName={activeProject.name}
              onOpenAddQuotation={() => setActiveModal('quotations')}
              onAcceptQuote={(quote) => {
                setOrderPrefill({
                  materialName: quote.material,
                  quantity: quote.quantity || 1,
                  unit: quote.unit || 'nos',
                  vendorId: quote.vendorId,
                  quotedRate: quote.numericRate || cleanNumeric(quote.rate),
                  quotationId: quote.id
                });
                setActiveModal('orders');
              }}
            />
          )}
          {tab === 'orders' && (
            <OrdersTab 
              orders={data?.orders || []} 
              projectName={activeProject.name}
              onReceiveOrder={(poId) => {
                setReceivePoId(poId);
                setActiveModal('received');
              }}
            />
          )}
          {tab === 'received' && (
            <ReceivedTab 
              received={data?.received || []} 
              onRateVendor={(vendorId, vendorName) => {
                setRateVendorTarget({ id: vendorId, name: vendorName });
                setVendorRatingScore(5);
                setVendorRatingHover(0);
                setVendorRatingComment('');
                setSelectedRatingTags([]);
                setRatingSuccessMsg(null);
              }}
            />
          )}
          {tab === 'inventory' && <InventoryTab items={data?.inventory || []} logs={data?.consumption_logs || []} />}
          {tab === 'vendors' && <VendorsPage />}
        </div>
      </div>

      <ImportEstimationModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          setShowImportModal(false);
          refreshData();
        }}
        projectId={activeProjectId!}
      />

      <PurchaseModals 
        activeModal={activeModal} 
        onClose={() => { setActiveModal(null); setOrderPrefill(null); setReceivePoId(null); }} 
        onRefresh={refreshData} 
        projectId={activeProjectId!} 
        data={data} 
        orderPrefill={orderPrefill} 
        initialPoId={receivePoId}
      />

      {/* Quick Rate Vendor Modal from ReceivedTab */}
      {rateVendorTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Star size={16} className="fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">Rate {rateVendorTarget.name}</h3>
                  <p className="text-[10px] text-muted-foreground">Goods Receipt Supplier Review</p>
                </div>
              </div>
              <button 
                onClick={() => setRateVendorTarget(null)} 
                className="size-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {ratingSuccessMsg ? (
                <div className="p-4 text-center space-y-2">
                  <div className="size-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={20} />
                  </div>
                  <p className="font-bold text-sm text-emerald-800">{ratingSuccessMsg}</p>
                </div>
              ) : (
                <>
                  <div className="text-center p-3 bg-muted/30 rounded-xl border border-border/80">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Delivery & Performance Rating
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setVendorRatingHover(star)}
                          onMouseLeave={() => setVendorRatingHover(0)}
                          onClick={() => setVendorRatingScore(star)}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            size={28}
                            className={`${
                              star <= (vendorRatingHover || vendorRatingScore)
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-foreground mt-1.5">
                      {vendorRatingScore === 5 && '⭐⭐⭐⭐⭐ 5/5 — On-Time & Prompt'}
                      {vendorRatingScore === 4 && '⭐⭐⭐⭐ 4/5 — Good Service'}
                      {vendorRatingScore === 3 && '⭐⭐⭐ 3/5 — Average'}
                      {vendorRatingScore === 2 && '⭐⭐ 2/5 — Slow Provider / Delayed'}
                      {vendorRatingScore === 1 && '⭐ 1/5 — Critical Delay or Damage'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground">Quick Tags</label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        '⚡ On-Time',
                        '🐢 Slow Provider',
                        '⏳ Arrived Late',
                        '📦 Good Quality',
                        '⚠️ Damaged',
                        '🤝 Helpful Driver'
                      ].map((tag) => {
                        const isSelected = selectedRatingTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSelectedRatingTags(prev => 
                                isSelected ? prev.filter(t => t !== tag) : [...prev, tag]
                              );
                            }}
                            className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#2648E7] text-white border-[#2648E7]'
                                : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                            }`}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-foreground">Delivery Comments</label>
                    <textarea
                      rows={2}
                      value={vendorRatingComment}
                      onChange={(e) => setVendorRatingComment(e.target.value)}
                      placeholder="e.g. Arrived 2 hours late. Truck driver was slow to deliver..."
                      className="w-full bg-white border border-border rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2648E7] text-gray-900"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-3 border-t border-border flex justify-end gap-2 bg-muted/10">
              <button
                type="button"
                onClick={() => setRateVendorTarget(null)}
                className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-lg cursor-pointer"
              >
                Close
              </button>
              {!ratingSuccessMsg && (
                <button
                  type="button"
                  disabled={submittingVendorRating}
                  onClick={async () => {
                    if (!rateVendorTarget) return;
                    setSubmittingVendorRating(true);
                    try {
                      const tags = selectedRatingTags.length > 0 ? `[${selectedRatingTags.join(', ')}] ` : '';
                      const comment = `${tags}${vendorRatingComment.trim()}`.trim() || undefined;
                      await vendorsApi.rateVendor(rateVendorTarget.id, vendorRatingScore, comment);
                      setRatingSuccessMsg(`Rating saved! ${vendorRatingScore} stars recorded for ${rateVendorTarget.name}.`);
                      setTimeout(() => {
                        setRateVendorTarget(null);
                        setRatingSuccessMsg(null);
                      }, 1200);
                    } catch (err: any) {
                      console.error('Failed to submit rating', err);
                      alert(err?.message || 'Failed to submit rating');
                    } finally {
                      setSubmittingVendorRating(false);
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-[#2648E7] text-white rounded-lg hover:bg-[#1d38b8] shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submittingVendorRating ? 'Saving...' : 'Submit Rating'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper: Export Procurement Price Variance & Savings PDF Report
function handleDownloadPriceVariancePDF(orders: OrderSummary[], projectName: string) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Premium Dark Header
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setFillColor(38, 72, 231); // Brand Blue
  doc.rect(0, 40, pageW, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("PROCUREMENT PRICE VARIANCE REPORT", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(190, 205, 255);
  doc.text(`Project: ${projectName} · Quoted Price vs Final Bought Price Analysis`, 14, 32);

  doc.setFontSize(9);
  doc.text(`GENERATED`, pageW - 14, 20, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`${new Date().toLocaleDateString('en-IN')}`, pageW - 14, 28, { align: 'right' });

  // Summary Metrics Section
  let totalQuoted = 0;
  let totalBought = 0;
  const rows: any[] = [];

  orders.forEach(o => {
    (o.items || []).forEach(it => {
      const quoted = it.quotedPrice && it.quotedPrice > 0 ? it.quotedPrice : (it.unitPrice || 0);
      const bought = it.unitPrice || 0;
      const qty = it.orderedQty || 1;
      const totalQuotedLine = quoted * qty;
      const totalBoughtLine = bought * qty;
      const diff = totalBoughtLine - totalQuotedLine;

      totalQuoted += totalQuotedLine;
      totalBought += totalBoughtLine;

      rows.push([
        it.materialName,
        o.vendor,
        `${qty} ${it.unit}`,
        `₹${quoted.toLocaleString('en-IN')}`,
        `₹${bought.toLocaleString('en-IN')}`,
        diff < 0 ? `Saved ₹${Math.abs(diff).toLocaleString('en-IN')}` : diff > 0 ? `+₹${diff.toLocaleString('en-IN')}` : 'Exact match',
        o.poNumber || o.name
      ]);
    });
  });

  const netSavings = totalQuoted - totalBought;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Quoted Value: ₹${totalQuoted.toLocaleString('en-IN')}`, 14, 52);
  doc.text(`Total Agreed PO Value: ₹${totalBought.toLocaleString('en-IN')}`, 100, 52);

  doc.setTextColor(netSavings >= 0 ? 22 : 220, netSavings >= 0 ? 101 : 38, netSavings >= 0 ? 52 : 38);
  doc.text(
    netSavings >= 0 
      ? `Net Negotiation Savings: +₹${netSavings.toLocaleString('en-IN')} (Negotiated under quote)` 
      : `Net Cost Variance: -₹${Math.abs(netSavings).toLocaleString('en-IN')} (Over quoted rate)`, 
    14, 
    60
  );

  autoTable(doc, {
    startY: 68,
    head: [['Material', 'Vendor', 'Qty', 'Quoted Rate', 'Final PO Rate', 'Variance / Savings', 'PO Ref']],
    body: rows.length > 0 ? rows : [['No procurement orders recorded yet', '-', '-', '-', '-', '-', '-']],
    headStyles: { fillColor: [38, 72, 231], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages ? (doc as any).internal.getNumberOfPages() : 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageH - 12, pageW - 14, pageH - 12);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('Apni Estate · Construction Procurement Intelligence', 14, pageH - 6);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 6, { align: 'right' });
  }

  doc.save(`Price_Variance_Report_${projectName.replace(/\s+/g, '_')}.pdf`);
}

function RequestsTab({ 
  requests, 
  onRefresh, 
  onConvertToOrder 
}: { 
  requests: MaterialRequestSummary[], 
  onRefresh: () => void, 
  onConvertToOrder: (materialName: string, quantity: number, requestId?: string) => void 
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
      ORDERED: { label: "Order Placed (Locked)", cls: "bg-blue-50 text-blue-800 border border-blue-200 font-bold" },
      APPROVED: { label: "Approved for Order", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
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
                  <CheckCircle2 size={15} /> Approved & Ready to Order
                </span>
                <button
                  onClick={() => onConvertToOrder(m.name, parseInt(m.qty, 10) || 1, m.id)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                >
                  <ShoppingCart size={13} /> Create Order
                </button>
              </div>
            )}

            {m.stage === "ORDERED" && (
              <div className="flex items-center justify-between w-full py-1.5 px-3 rounded-xl bg-blue-50/80 border border-blue-200">
                <span className="flex items-center gap-1.5 text-xs text-blue-800 font-bold">
                  <CheckCircle2 size={15} className="text-[#2648E7]" /> Purchase Order Generated
                </span>
                <span className="text-[11px] text-muted-foreground font-medium italic">
                  Requirement locked · duplicate order disabled
                </span>
              </div>
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

function QuotationsTab({ 
  quotations, 
  orders = [],
  projectName = 'Project',
  onAcceptQuote,
  onOpenAddQuotation
}: { 
  quotations: any[]; 
  orders?: OrderSummary[];
  projectName?: string;
  onAcceptQuote?: (quote: any) => void;
  onOpenAddQuotation?: () => void;
}) {
  // Group quotations by Material to compare side-by-side
  const groupedByMaterial = useMemo(() => {
    const map: Record<string, any[]> = {};
    quotations.forEach(q => {
      const mat = q.material || 'General Materials';
      if (!map[mat]) map[mat] = [];
      map[mat].push(q);
    });
    return map;
  }, [quotations]);

  // Overall negotiation metrics
  const varianceMetrics = useMemo(() => {
    let totalQuoted = 0;
    let totalBought = 0;
    let itemsTracked = 0;

    orders.forEach(o => {
      (o.items || []).forEach(it => {
        if (it.quotedPrice && it.quotedPrice > 0) {
          totalQuoted += (it.quotedPrice * (it.orderedQty || 1));
          totalBought += ((it.unitPrice || 0) * (it.orderedQty || 1));
          itemsTracked++;
        }
      });
    });

    return {
      totalQuoted,
      totalBought,
      savings: totalQuoted - totalBought,
      itemsTracked
    };
  }, [orders]);

  if (quotations.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-border p-6">
        <ClipboardList size={36} className="mx-auto text-muted-foreground/40 mb-3" />
        <h3 className="font-bold text-sm text-foreground">No Vendor Quotations Yet</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Get multiple vendor quotes before ordering to negotiate best rates and fulfill requirements.
        </p>
        {onOpenAddQuotation && (
          <button 
            onClick={onOpenAddQuotation}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2648E7] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#2648E7]/90 transition-all"
          >
            <Plus size={14} /> Add First Quotation
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price Variance & Negotiation Savings Card */}
      {varianceMetrics.itemsTracked > 0 && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50/50 to-emerald-50/50 border border-blue-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block">
                Procurement Cost Intelligence · Price Variance Tracker
              </span>
              <h4 className="text-sm font-bold text-foreground mt-0.5">
                Quoted Price vs Final Agreed Purchase Price
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Negotiation savings across {varianceMetrics.itemsTracked} ordered materials.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block">Net Negotiation Savings</span>
                <span className={`text-base font-black ${varianceMetrics.savings >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {varianceMetrics.savings >= 0 ? `+₹${varianceMetrics.savings.toLocaleString('en-IN')}` : `-₹${Math.abs(varianceMetrics.savings).toLocaleString('en-IN')}`}
                </span>
              </div>
              <button
                onClick={() => handleDownloadPriceVariancePDF(orders, projectName)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#2648E7] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#2648E7]/90 transition-all"
              >
                <Download size={13} /> PDF Report
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Comparison by Material */}
      {Object.entries(groupedByMaterial).map(([materialName, quotes]) => {
        // Find best quote (lowest rate or max fulfillment)
        const sortedQuotes = [...quotes].sort((a, b) => (a.numericRate || 0) - (b.numericRate || 0));
        const bestRateQuoteId = sortedQuotes[0]?.id;

        return (
          <div key={materialName} className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Package size={15} className="text-[#2648E7]" />
                {materialName}
                <span className="text-[11px] font-normal text-muted-foreground">
                  ({quotes.length} vendor {quotes.length === 1 ? 'quote' : 'quotes'})
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quotes.map((q) => {
                const isBestRate = q.id === bestRateQuoteId && quotes.length > 1;
                const isAccepted = q.status === 'ACCEPTED';

                return (
                  <Card key={q.id} className={`p-4 transition-all relative ${isAccepted ? 'bg-emerald-50/40 border-emerald-300' : isBestRate ? 'border-blue-300 bg-blue-50/20' : 'hover:border-border'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-sm text-foreground">{q.vendor}</p>
                          {q.vendorPhone && <span className="text-[10px] text-muted-foreground">({q.vendorPhone})</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Delivery: <strong className="text-foreground">{q.deliveryTime || 'Standard'}</strong>
                          {q.quantity ? ` · Qty: ${q.quantity} ${q.unit || ''}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-foreground">{q.rate}/unit</p>
                        <p className="text-xs text-muted-foreground">Total: {q.total}</p>
                      </div>
                    </div>

                    {/* Recommendation Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap my-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        ⭐ 100% Requirements Fulfilled
                      </span>
                      {isBestRate && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#2648E7] border border-blue-200">
                          💰 Lowest Quoted Rate
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAccepted ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {isAccepted ? 'ACCEPTED IN PO' : q.status}
                      </span>
                    </div>

                    {/* Order Action Button */}
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {q.date || 'Received'}
                      </span>
                      {isAccepted ? (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 size={14} /> PO Generated
                        </span>
                      ) : onAcceptQuote ? (
                        <button
                          type="button"
                          onClick={() => onAcceptQuote(q)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2648E7] hover:bg-[#2648E7]/90 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          <ShoppingCart size={13} /> Accept & Order
                        </button>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrdersTab({ 
  orders, 
  projectName = 'Project',
  onReceiveOrder 
}: { 
  orders: OrderSummary[]; 
  projectName?: string;
  onReceiveOrder?: (poId: string) => void;
}) {
  const [filter, setFilter] = useState<'pending' | 'delivered' | 'all'>('pending');

  const pendingOrders = orders.filter(o => o.status !== 'DELIVERED' && (!o.items || o.items.length === 0 || o.items.some(i => (i.pendingQty ?? i.orderedQty) > 0)));
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED' || (o.items && o.items.length > 0 && o.items.every(i => (i.pendingQty ?? 0) <= 0)));

  const displayedOrders = filter === 'pending' ? pendingOrders : filter === 'delivered' ? deliveredOrders : orders;

  // Calculate total negotiated savings across all orders
  const totalSavings = useMemo(() => {
    let saved = 0;
    orders.forEach(o => {
      (o.items || []).forEach(it => {
        if (it.quotedPrice && it.quotedPrice > (it.unitPrice || 0)) {
          saved += (it.quotedPrice - (it.unitPrice || 0)) * (it.orderedQty || 1);
        }
      });
    });
    return saved;
  }, [orders]);

  if (orders.length === 0) return <div className="text-center text-muted-foreground py-10">No orders found.</div>;

  return (
    <div className="space-y-4">
      {/* Top Controls: Filter Pills & Download Price Variance Report */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex p-1 bg-muted rounded-xl gap-1 flex-1">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${filter === 'pending' ? 'bg-background shadow text-[#2648E7]' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span>Active Orders</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === 'pending' ? 'bg-[#2648E7]/10 text-[#2648E7]' : 'bg-muted-foreground/20'}`}>
              {pendingOrders.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('delivered')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${filter === 'delivered' ? 'bg-background shadow text-emerald-700' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span>Delivered / Received</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${filter === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-muted-foreground/20'}`}>
              {deliveredOrders.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${filter === 'all' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <span>All</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted-foreground/20">
              {orders.length}
            </span>
          </button>
        </div>

        {/* Download Price Variance Report Button */}
        <button
          type="button"
          onClick={() => handleDownloadPriceVariancePDF(orders, projectName)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white border border-border hover:bg-slate-50 text-foreground transition-all shadow-2xs shrink-0"
          title="Download Quoted Price vs Final Bought Price Variance Report"
        >
          <Download size={13} className="text-[#2648E7]" />
          <span>Price Variance PDF Report</span>
          {totalSavings > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold">
              Saved ₹{totalSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          )}
        </button>
      </div>

      {displayedOrders.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 bg-white rounded-2xl border border-border p-6">
          <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
          <p className="font-bold text-foreground">
            {filter === 'pending' ? 'No pending orders waiting to be received!' : 'No orders in this view.'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filter === 'pending' ? 'All received items have moved to the Received & Inventory tabs.' : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((o) => {
            const isDelivered = o.status === "DELIVERED" || (o.items && o.items.length > 0 && o.items.every(i => (i.pendingQty ?? 0) <= 0));
            const isApproved = o.status === "APPROVED";

            return (
              <Card key={o.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{o.name}</p>
                      {o.poNumber && (
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {o.poNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{o.vendor}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-foreground">{o.amount}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      {isDelivered ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          DELIVERED
                        </span>
                      ) : isApproved ? (
                        <span 
                          className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1"
                          title="Approved purchase orders are legally locked against tampering"
                        >
                          🔒 APPROVED · LOCKED
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2648E7]">
                          {o.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items & Price Variance Breakdown */}
                {o.items && o.items.length > 0 && (
                  <div className="mb-3 p-3 bg-muted/40 rounded-xl space-y-2 border border-border/50">
                    {o.items.map((it, idx) => {
                      const itReceived = (it.receivedQty || 0) >= it.orderedQty || (it.pendingQty !== undefined && it.pendingQty <= 0);
                      const hasVariance = it.quotedPrice && it.unitPrice && it.quotedPrice !== it.unitPrice;
                      const isSaved = hasVariance && (it.unitPrice || 0) < (it.quotedPrice || 0);

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5 py-1 border-b border-border/40 last:border-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground">{it.materialName}</span>
                            <span className="text-muted-foreground font-medium">({it.orderedQty} {it.unit})</span>
                            
                            {/* Price Quoted vs Bought Variance Indicator */}
                            {it.quotedPrice ? (
                              <span className="text-[10px] text-muted-foreground bg-white px-2 py-0.5 rounded-md border border-border/60">
                                Quoted: ₹{it.quotedPrice} → Final: ₹{it.unitPrice}
                              </span>
                            ) : null}

                            {hasVariance && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSaved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                {isSaved ? `Negotiated Saving: -₹${((it.quotedPrice! - it.unitPrice!) * it.orderedQty).toLocaleString('en-IN')}` : `+₹${((it.unitPrice! - it.quotedPrice!) * it.orderedQty).toLocaleString('en-IN')} Price Variance`}
                              </span>
                            )}
                          </div>

                          <span className={`font-bold text-[11px] px-2 py-0.5 rounded-md self-start sm:self-center shrink-0 ${itReceived ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {itReceived ? `✓ Received (${it.receivedQty} ${it.unit})` : `Pending: ${it.pendingQty ?? it.orderedQty} ${it.unit}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex gap-4">
                    <span>Ordered: {o.date}</span>
                    <span>ETA: {o.eta}</span>
                  </div>
                  {!isDelivered && onReceiveOrder && (
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
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReceivedTab({ 
  received, 
  onRateVendor 
}: { 
  received: ReceivedSummary[]; 
  onRateVendor?: (vendorId: string, vendorName: string) => void;
}) {
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
    doc.text("GOODS RECEIPT NOTE (GRN)", 14, 24);

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
    doc.text("Delivery & Vendor Details", 14, 55);
    
    doc.setDrawColor(38, 72, 231);
    doc.setLineWidth(1);
    doc.line(14, 58, 55, 58);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text("Vendor Name:", 14, 68);
    doc.text("Delivery Date & Time:", 14, 76);
    doc.text("Total Value:", 110, 68);
    doc.text("Quality & Speed:", 110, 76);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(r.vendor, 45, 68);
    doc.text(`${r.received}${r.receivedTime ? ` at ${r.receivedTime}` : ''}`, 55, 76);
    doc.text(r.amount, 145, 68);
    const speedLabel = r.deliverySpeed === 'SLOW' ? 'Slow Provider' : r.deliverySpeed === 'DELAYED' ? 'Delayed' : 'On-Time';
    doc.text(`${r.quality} (${speedLabel})`, 145, 76);

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
      doc.text("Attached Bill / Challan", 14, currentY + 15);
      doc.setDrawColor(38, 72, 231);
      doc.setLineWidth(1);
      doc.line(14, currentY + 18, 55, currentY + 18);

      try {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = r.billUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
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
      doc.text('Apni Estate - Premium Construction ERP', 14, pageH - 8);
      doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, { align: 'right' });
    }

    doc.save(`GRN_${r.id}.pdf`);
  };

  if (received.length === 0) return <div className="text-center text-muted-foreground py-10">No received items found.</div>;
  return (
    <div className="space-y-3">
      {received.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${r.quality === "GOOD" ? "bg-emerald-50" : "bg-red-50"}`}>
                {r.quality === "GOOD" ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Archive size={18} className="text-red-500" />}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-foreground truncate">{r.name}</p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <span className="font-semibold text-foreground">{r.vendor}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar size={11} className="text-muted-foreground" />
                    {r.received}
                  </span>
                  {r.receivedTime && (
                    <span className="flex items-center gap-1 font-medium bg-muted/60 px-1.5 py-0.5 rounded text-[11px] text-foreground">
                      <Clock size={11} className="text-[#2648E7]" />
                      {r.receivedTime}
                    </span>
                  )}
                  {r.deliverySpeed === 'SLOW' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 shadow-2xs">
                      <span>🐢</span> Slow Provider
                    </span>
                  )}
                  {r.deliverySpeed === 'DELAYED' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
                      <span>⏳</span> Delayed Delivery
                    </span>
                  )}
                  {r.deliverySpeed === 'ON_TIME' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span>⚡</span> On-Time
                    </span>
                  )}
                </div>
                {r.remarks && (
                  <p className="text-[11px] text-muted-foreground mt-1 italic line-clamp-1">
                    Note: {r.remarks.replace(/\[(Time|Speed):[^\]]+\]/g, '').trim() || r.remarks}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.quality === "GOOD" ? "text-emerald-600 bg-emerald-50 border border-emerald-200" : "text-red-600 bg-red-50 border border-red-200"}`}>
                {r.quality}
              </span>
              {onRateVendor && (
                <button
                  type="button"
                  onClick={() => onRateVendor(r.vendorId || '', r.vendor)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Rate this supplier's punctuality and performance"
                >
                  <Star size={12} className="text-amber-500 fill-amber-500" /> Rate
                </button>
              )}
              <button 
                onClick={() => handleDownloadPDF(r)} 
                className="px-2.5 py-1 text-[#2648E7] hover:bg-blue-50 border border-blue-200/60 rounded-lg flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download size={13} /> PDF
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
  orderPrefill?: any;
  initialPoId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCustomMaterial, setIsCustomMaterial] = useState(false);

  const groupedBoqItems = useMemo(() => {
    const groups: Record<string, BOQItemSummary[]> = {};
    if (data?.boq_categories && data.boq_categories.length > 0) {
      data.boq_categories.forEach(cat => {
        groups[cat.name] = cat.items || [];
      });
    } else if (data?.boq_items && data.boq_items.length > 0) {
      data.boq_items.forEach(it => {
        const cat = it.category || 'Main Work Estimation';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(it);
      });
    }
    return groups;
  }, [data]);

  const eligibleOrders = useMemo(() => {
    return (data?.orders || []).filter(o => {
      if (o.status === 'DELIVERED') return false;
      if (o.items && o.items.length > 0) {
        return o.items.some(it => (it.pendingQty !== undefined ? it.pendingQty > 0 : (it.orderedQty - (it.receivedQty || 0)) > 0));
      }
      return true;
    });
  }, [data]);

  const allDisciplineOptions = useMemo(() => {
    const existing = Object.keys(groupedBoqItems);
    const standard = [
      'Plumbing & Sanitary Works',
      'Electrical & Low Voltage',
      'Painting & False Ceiling',
      'Waterproofing & Chemical Treatment',
      'Doors, Windows & Hardware',
      'Flooring & Tiling',
      'Reinforcement Schedule (TMT Rebars)',
      'Concrete Works',
      'Shuttering & Formwork',
      'Earthwork & Excavation',
      'Brickwork & Masonry',
      'HVAC & Fire Safety',
      'Material Requisition'
    ];
    return Array.from(new Set([...existing, ...standard]));
  }, [groupedBoqItems]);

  useEffect(() => {
    setErrorMsg(null);
    setIsCustomMaterial(false);
    if (!activeModal) {
      setFormData({});
      return;
    }

    if (activeModal === 'requests') {
      const hasBoq = data?.boq_items && data.boq_items.length > 0;
      setIsCustomMaterial(!hasBoq);
      const firstItem = hasBoq ? data.boq_items[0] : null;
      setFormData({
        materialName: firstItem ? firstItem.name : '',
        unit: firstItem ? firstItem.unit : 'cum',
        urgency: 'NORMAL'
      });
      return;
    }

    if (activeModal === 'boq') {
      setFormData({
        categoryName: 'Main Work Estimation',
        items: [{}]
      });
      return;
    }

    if (activeModal === 'received') {
      const now = new Date();
      const defaultTime = now.toTimeString().slice(0, 5); // "HH:mm"
      const defaultDate = now.toISOString().slice(0, 10); // "YYYY-MM-DD"

      const allOrders = data?.orders || [];
      const targetPo = (initialPoId ? allOrders.find(o => o.id === initialPoId) : null) || eligibleOrders[0];
      if (targetPo) {
        const pendingItems = (targetPo.items && targetPo.items.length > 0)
          ? targetPo.items.filter(it => (it.pendingQty !== undefined ? it.pendingQty > 0 : (it.orderedQty - (it.receivedQty || 0)) > 0))
          : [];

        const prefilledItems = pendingItems.length > 0
          ? pendingItems.map(it => ({
              poItemId: it.id,
              materialId: it.materialId,
              materialName: it.materialName,
              unit: it.unit,
              orderedQty: it.orderedQty,
              pendingQty: it.pendingQty,
              receivedQty: it.pendingQty
            }))
          : (targetPo.status === 'DELIVERED' || (targetPo.items && targetPo.items.length > 0))
            ? []
            : [{ poItemId: targetPo.id, materialName: targetPo.name, receivedQty: 1, unit: 'units' }];

        setFormData({
          poId: targetPo.id,
          quality: 'GOOD',
          deliveryDate: defaultDate,
          deliveryTime: defaultTime,
          deliverySpeed: 'ON_TIME',
          remarks: '',
          items: prefilledItems
        });
      } else {
        setFormData({
          quality: 'GOOD',
          deliveryDate: defaultDate,
          deliveryTime: defaultTime,
          deliverySpeed: 'ON_TIME',
          remarks: '',
          items: []
        });
      }
      return;
    }

    if (activeModal === 'orders' && orderPrefill) {
      const matchingBoq = data?.boq_items?.find(b => b.name === orderPrefill.materialName);
      setFormData({
        vendorId: orderPrefill.vendorId || '',
        quotationId: orderPrefill.quotationId || '',
        requestId: orderPrefill.requestId || '',
        orderMode: orderPrefill.quotationId ? 'quotation' : 'direct',
        items: [{
          materialName: orderPrefill.materialName || '',
          quantity: orderPrefill.quantity || '',
          unit: orderPrefill.unit || matchingBoq?.unit || 'bags',
          rate: orderPrefill.quotedRate || matchingBoq?.rate || '',
          quotedRate: orderPrefill.quotedRate || undefined,
          plannedRem: matchingBoq ? Math.max(0, matchingBoq.planned - matchingBoq.used) : undefined,
          boqItem: matchingBoq || null
        }]
      });
      return;
    }

    if (['quotations', 'orders'].includes(activeModal)) {
      setFormData({ orderMode: 'direct', items: [{}] });
      return;
    }

    if (activeModal === 'inventory') {
      setFormData({ items: [] });
      return;
    }

    setFormData({});
  }, [activeModal, orderPrefill, initialPoId, data, eligibleOrders]);

  if (!activeModal) return null;

  const handlePoChange = (selectedPoId: string) => {
    const selectedPo = data?.orders?.find(o => o.id === selectedPoId);
    if (selectedPo) {
      const pendingItems = (selectedPo.items && selectedPo.items.length > 0)
        ? selectedPo.items.filter(it => (it.pendingQty !== undefined ? it.pendingQty > 0 : (it.orderedQty - (it.receivedQty || 0)) > 0))
        : [];

      const prefilledItems = pendingItems.length > 0
        ? pendingItems.map(it => ({
            poItemId: it.id,
            materialId: it.materialId,
            materialName: it.materialName,
            unit: it.unit,
            orderedQty: it.orderedQty,
            pendingQty: it.pendingQty,
            receivedQty: it.pendingQty
          }))
        : (selectedPo.status === 'DELIVERED' || (selectedPo.items && selectedPo.items.length > 0))
          ? []
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
    setFormData((prev: any) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const updateItemRow = (index: number, updates: Record<string, any>) => {
    setFormData((prev: any) => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  };

  const getAvailableStock = (item: any): number => {
    if (!item) return 0;
    if (typeof item.availableQuantity === 'number') return item.availableQuantity;
    if (typeof item.stock === 'number') return item.stock;
    if (typeof item.stock === 'string') {
      const match = item.stock.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }
    return 0;
  };

  const handleInventoryConsumeChange = (inventoryItemId: string, materialName: string, quantity: string, maxStock: number) => {
    const qty = parseInt(quantity, 10);
    const existingItems = formData.items || [];
    
    if (!quantity || isNaN(qty) || qty <= 0) {
      setFormData((prev: any) => ({
        ...prev,
        items: (prev.items || []).filter((i: any) => (i.inventoryItemId ? i.inventoryItemId !== inventoryItemId : i.materialName !== materialName))
      }));
      return;
    }

    if (qty > maxStock) {
      setErrorMsg(`Cannot consume ${qty} of "${materialName}". Available stock is only ${maxStock}.`);
    } else {
      setErrorMsg(null);
    }

    const cappedQty = Math.min(qty, Math.max(0, maxStock));
    if (cappedQty <= 0) {
      setFormData((prev: any) => ({
        ...prev,
        items: (prev.items || []).filter((i: any) => (i.inventoryItemId ? i.inventoryItemId !== inventoryItemId : i.materialName !== materialName))
      }));
      return;
    }

    setFormData((prev: any) => {
      const itemsList = [...(prev.items || [])];
      const idx = itemsList.findIndex((i: any) => (i.inventoryItemId ? i.inventoryItemId === inventoryItemId : i.materialName === materialName));
      if (idx >= 0) {
        itemsList[idx] = { ...itemsList[idx], quantity: cappedQty, inventoryItemId, materialName };
      } else {
        itemsList.push({ inventoryItemId, materialName, quantity: cappedQty });
      }
      return { ...prev, items: itemsList };
    });
  };

  const addItemRow = () => {
    setFormData((prev: any) => ({
      ...prev,
      items: [...(prev.items || []), {}]
    }));
  };

  const removeItemRow = (index: number) => {
    setFormData((prev: any) => {
      const newItems = [...(prev.items || [])];
      if (newItems.length === 1) return prev; // Keep at least one
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
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

      if (activeModal === 'requests') {
        payload.quantity = cleanNumeric(payload.quantity);
        payload.unit = normalizeUnit(payload.unit || 'nos');
        if (formData.varianceReason) {
          payload.varianceReason = formData.varianceReason;
        }
        if (payload.addToBoq && payload.materialName) {
          const targetCategory = payload.customCategory || detectDiscipline(payload.materialName);
          try {
            await purchaseApi.performAction('CREATE_BOQ_ITEM', {
              projectId,
              categoryName: targetCategory,
              items: [{
                name: payload.materialName.trim(),
                planned: Number(payload.quantity) || 10,
                unit: payload.unit,
                rate: 0,
                remarks: formData.varianceReason
                  ? `Registered via Site Requirement [Variance: ${formData.varianceReason}]`
                  : 'Registered via Site Requirement'
              }]
            });
          } catch (regErr) {
            console.error('Auto baseline registration error:', regErr);
          }
        }
      }

      if (activeModal === 'boq') {
        payload.categoryName = payload.categoryName || 'Main Work Estimation';
        payload.items = (payload.items || []).map((it: any) => ({
          ...it,
          name: (it.name || '').trim(),
          planned: cleanNumeric(it.planned),
          unit: normalizeUnit(it.unit || 'nos'),
          rate: cleanNumeric(it.rate),
          remarks: it.remarks ? it.remarks.trim() : undefined
        }));
      }

      if (activeModal === 'orders') {
        payload.items = (payload.items || []).map((it: any) => ({
          ...it,
          materialName: (it.materialName || '').trim(),
          quantity: cleanNumeric(it.quantity),
          unit: normalizeUnit(it.unit || 'nos'),
          rate: cleanNumeric(it.rate),
          quotedRate: it.quotedRate ? cleanNumeric(it.quotedRate) : (cleanNumeric(it.rate) || 0),
          varianceReason: it.varianceReason || undefined
        }));
        if (formData.quotationId) payload.quotationId = formData.quotationId;
        if (formData.requestId) payload.requestId = formData.requestId;

        // Auto-register any custom items into Quantity of Materials baseline
        for (const it of (formData.items || [])) {
          if (it.isCustom && it.addToBoq !== false && it.materialName?.trim()) {
            const discipline = it.customCategory || detectDiscipline(it.materialName);
            try {
              await purchaseApi.performAction('CREATE_BOQ_ITEM', {
                projectId,
                categoryName: discipline,
                items: [{
                  name: it.materialName.trim(),
                  planned: cleanNumeric(it.quantity) || 10,
                  unit: normalizeUnit(it.unit || 'nos'),
                  rate: cleanNumeric(it.rate) || 0,
                  remarks: it.varianceReason 
                    ? `Auto-registered from PO [Variance: ${it.varianceReason}]`
                    : 'Auto-registered from Purchase Order'
                }]
              });
            } catch (regErr) {
              console.error('PO auto-registration error:', regErr);
            }
          }
        }
      }

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
        payload.deliveryDate = formData.deliveryDate || new Date().toISOString().slice(0, 10);
        payload.deliveryTime = formData.deliveryTime || new Date().toTimeString().slice(0, 5);
        payload.deliverySpeed = formData.deliverySpeed || 'ON_TIME';
        payload.remarks = formData.remarks || '';
      }

      if (activeModal === 'inventory') {
        const validItems = (payload.items || []).filter((it: any) => Number(it.quantity) > 0);
        if (validItems.length === 0) {
          setErrorMsg('Please specify at least one material with quantity greater than 0 to consume.');
          setLoading(false);
          return;
        }

        for (const it of validItems) {
          const invItem = data?.inventory?.find(i => (it.inventoryItemId ? i.id === it.inventoryItemId : i.material === it.materialName));
          const stock = getAvailableStock(invItem);
          const label = invItem?.material || it.materialName || 'Material';
          if (stock <= 0) {
            setErrorMsg(`Cannot consume "${label}". It is currently out of stock (0 available).`);
            setLoading(false);
            return;
          }
          if (Number(it.quantity) > stock) {
            setErrorMsg(`Cannot consume ${it.quantity} of "${label}". Available stock is only ${stock}.`);
            setLoading(false);
            return;
          }
        }
        payload.items = validItems.map((it: any) => ({
          inventoryItemId: it.inventoryItemId,
          materialName: it.materialName,
          quantity: Number(it.quantity)
        }));
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
    requests: 'New Material Requirement',
    boq: 'Add Material to Estimation',
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
                  <label className="text-sm font-bold text-foreground">Select Material</label>
                  <SmartMaterialSelect
                    value={formData.materialName || ''}
                    isCustom={Boolean(isCustomMaterial)}
                    items={data?.boq_items || []}
                    categories={data?.boq_categories || []}
                    onSelect={(selected, custom) => {
                      if (custom) {
                        setIsCustomMaterial(true);
                        setFormData((prev: any) => ({
                          ...prev,
                          materialName: selected?.name || '',
                          unit: selected?.unit || 'units',
                          varianceReason: ''
                        }));
                      } else if (selected) {
                        setIsCustomMaterial(false);
                        setFormData((prev: any) => ({
                          ...prev,
                          materialName: selected.name,
                          unit: selected.unit || 'units',
                          customCategory: selected.category || prev.customCategory,
                          varianceReason: ''
                        }));
                      } else {
                        setIsCustomMaterial(false);
                        setFormData((prev: any) => ({
                          ...prev,
                          materialName: '',
                          unit: 'units',
                          varianceReason: ''
                        }));
                      }
                    }}
                    placeholder="-- Search or pick from Quantity of Materials --"
                  />

                  {isCustomMaterial && (
                    <div className="mt-3 p-4 bg-muted/40 border border-border rounded-2xl space-y-3 animate-in fade-in">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">Custom Material Name</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. CPVC 1 inch pipe / Asian Paints Royale / Dr Fixit..."
                          value={formData.materialName || ''}
                          onChange={e => {
                            const newName = e.target.value;
                            const detected = detectDiscipline(newName);
                            setFormData((prev: any) => ({
                              ...prev,
                              materialName: newName,
                              customCategory: prev.userOverrodeCategory ? prev.customCategory : detected
                            }));
                          }}
                          className="w-full bg-white border border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-semibold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Standard Unit</label>
                          <select
                            value={formData.unit || 'nos'}
                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                          >
                            <option value="cum">cum (m³)</option>
                            <option value="kg">kg</option>
                            <option value="Tonnes">Tonnes</option>
                            <option value="bags">bags</option>
                            <option value="sqm">sqm (m²)</option>
                            <option value="sqft">sqft</option>
                            <option value="nos">nos / pieces</option>
                            <option value="Running meter">Running meter (Rmt)</option>
                            <option value="Cft">Cft</option>
                            <option value="Ltr">Ltr</option>
                            <option value="set">set</option>
                            <option value="lumpsum">lumpsum</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Discipline / Work Table</label>
                          <select
                            value={formData.customCategory || detectDiscipline(formData.materialName || '')}
                            onChange={e => setFormData({ ...formData, customCategory: e.target.value, userOverrodeCategory: true })}
                            className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                          >
                            {allDisciplineOptions.map(disc => (
                              <option key={disc} value={disc}>{disc}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <label className="flex items-start gap-2.5 p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.addToBoq !== false}
                          onChange={e => setFormData({ ...formData, addToBoq: e.target.checked })}
                          className="mt-0.5 rounded text-[#2648E7] focus:ring-[#2648E7] size-4"
                        />
                        <div className="text-xs text-blue-900 leading-tight">
                          <span className="font-bold">Auto-register into Quantity of Materials baseline</span>
                          <p className="text-[11px] text-blue-700/80 mt-0.5">
                            Adds to "{formData.customCategory || detectDiscipline(formData.materialName || '')}" table so inventory, POs, and GRNs track seamlessly.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">
                      Quantity {formData.unit ? `(${formData.unit})` : ''}
                    </label>
                    <input
                      required
                      type="number"
                      step="any"
                      min="0.01"
                      className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-bold"
                      placeholder="0"
                      value={formData.quantity || ''}
                      onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground">Urgency</label>
                    <select
                      className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900"
                      value={formData.urgency || 'NORMAL'}
                      onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent (Immediate Site Stoppage)</option>
                    </select>
                  </div>
                </div>

                {/* Real-time Cost Intelligence & Baseline Overrun Alert */}
                {(() => {
                  const selectedBoq = data?.boq_items?.find(it => it.name === formData.materialName);
                  if (!selectedBoq) return null;

                  return (
                    <CostIntelligenceCard
                      material={selectedBoq}
                      quantity={formData.quantity || 0}
                      varianceReason={formData.varianceReason}
                      onVarianceReasonChange={(reason) => {
                        setFormData((prev: any) => ({
                          ...prev,
                          varianceReason: reason
                        }));
                      }}
                    />
                  );
                })()}
              </>
            )}

            {activeModal === 'boq' && (
              <>
                <div className="space-y-1.5 mb-3">
                  <label className="text-sm font-bold text-foreground">Work Package / Discipline Table</label>
                  <select
                    className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                    value={formData.isCustomCat ? '__CUSTOM_NEW__' : (formData.categoryName || (allDisciplineOptions[0] || 'Main Work Estimation'))}
                    onChange={e => {
                      if (e.target.value === '__CUSTOM_NEW__') {
                        setFormData({ ...formData, isCustomCat: true, categoryName: '' });
                      } else {
                        setFormData({ ...formData, isCustomCat: false, categoryName: e.target.value });
                      }
                    }}
                  >
                    <optgroup label="📋 Work Tables">
                      {allDisciplineOptions.map(disc => (
                        <option key={disc} value={disc}>{disc}</option>
                      ))}
                    </optgroup>
                    <option value="__CUSTOM_NEW__">➕ [+ Create New Work Table]</option>
                  </select>

                  {formData.isCustomCat && (
                    <input
                      required
                      type="text"
                      className="w-full bg-white border border-border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 mt-2 font-medium"
                      placeholder="Type new work table / discipline name..."
                      value={formData.categoryName || ''}
                      onChange={e => setFormData({ ...formData, categoryName: e.target.value })}
                    />
                  )}
                </div>

                <div className="mt-4 mb-2 flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground">Items to Add</label>
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
                          <input required type="text" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Material / Description (e.g. 16mm TMT Bar)" value={item.name || ''} onChange={e => handleItemChange(idx, 'name', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input required type="number" min="0.1" step="any" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Qty" value={item.planned || ''} onChange={e => handleItemChange(idx, 'planned', e.target.value)} />
                          <select required className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" value={item.unit || ''} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                            <option value="" disabled>Unit</option>
                            <option value="cum">cum</option>
                            <option value="kg">kg</option>
                            <option value="Tonnes">Tonnes</option>
                            <option value="sqm">sqm</option>
                            <option value="bags">bags</option>
                            <option value="Cft">Cft</option>
                            <option value="Running meter">Running meter</option>
                            <option value="nos">nos/pieces</option>
                            <option value="sqft">sqft</option>
                            <option value="Ltr">Ltr</option>
                            <option value="set">set</option>
                            <option value="lumpsum">lumpsum</option>
                          </select>
                          <input required type="number" min="0" step="any" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900" placeholder="Rate (₹)" value={item.rate || ''} onChange={e => handleItemChange(idx, 'rate', e.target.value)} />
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
                {/* Mode Selector for Orders: Direct PO vs From Quotation */}
                {activeModal === 'orders' && (
                  <div className="p-3 bg-muted/40 border border-border rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                      Order Source
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, orderMode: 'direct', quotationId: '' }))}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                          formData.orderMode !== 'quotation'
                            ? 'bg-[#2648E7] text-white border-[#2648E7] shadow-sm'
                            : 'bg-white text-muted-foreground border-border hover:bg-muted/50'
                        }`}
                      >
                        Direct Purchase Order
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData((prev: any) => ({ ...prev, orderMode: 'quotation' }))}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                          formData.orderMode === 'quotation'
                            ? 'bg-[#2648E7] text-white border-[#2648E7] shadow-sm'
                            : 'bg-white text-muted-foreground border-border hover:bg-muted/50'
                        }`}
                      >
                        <FileText size={13} />
                        From Vendor Quotation {data?.quotations?.length ? `(${data.quotations.length})` : ''}
                      </button>
                    </div>

                    {formData.orderMode === 'quotation' && (
                      <div className="pt-2 animate-in fade-in">
                        <label className="text-xs font-bold text-foreground block mb-1">
                          Select Received Quotation
                        </label>
                        {(!data?.quotations || data.quotations.length === 0) ? (
                          <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                            No vendor quotations available yet. You can place a Direct PO or record a quote in the Quotations tab first.
                          </p>
                        ) : (
                          <select
                            className="w-full bg-white border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-[#2648E7] text-gray-900"
                            value={formData.quotationId || ''}
                            onChange={(e) => {
                              const qId = e.target.value;
                              const chosenQuote = data.quotations?.find(q => q.id === qId);
                              if (chosenQuote) {
                                const matchingVendor = data?.vendors?.find(v => v.name.toLowerCase() === chosenQuote.vendor.toLowerCase());
                                const matchingBoq = data?.boq_items?.find(b => b.name.toLowerCase() === chosenQuote.material.toLowerCase());
                                setFormData((prev: any) => ({
                                  ...prev,
                                  quotationId: qId,
                                  vendorId: matchingVendor ? matchingVendor.id : (chosenQuote.vendorId || prev.vendorId),
                                  items: [{
                                    materialName: chosenQuote.material,
                                    quantity: chosenQuote.quantity || 1,
                                    unit: matchingBoq?.unit || 'nos',
                                    quotedRate: chosenQuote.numericRate || 0,
                                    rate: chosenQuote.numericRate || 0,
                                    plannedRem: matchingBoq ? Math.max(0, matchingBoq.planned - matchingBoq.used) : undefined,
                                    boqItem: matchingBoq || null
                                  }]
                                }));
                              }
                            }}
                          >
                            <option value="">-- Choose a Vendor Quotation --</option>
                            {data.quotations.map(q => (
                              <option key={q.id} value={q.id}>
                                {q.vendor} — {q.material} ({q.rate}) · {q.status}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}

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
                    <div key={idx} className="p-3.5 bg-muted/40 border border-border rounded-2xl relative group">
                      <button type="button" onClick={() => removeItemRow(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={14} />
                      </button>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-foreground">Material</label>
                          <SmartMaterialSelect
                            value={item.materialName || ''}
                            isCustom={Boolean(item.isCustom)}
                            items={data?.boq_items || []}
                            categories={data?.boq_categories || []}
                            onSelect={(selected, custom) => {
                              if (custom) {
                                updateItemRow(idx, {
                                  isCustom: true,
                                  materialName: selected?.name || '',
                                  unit: selected?.unit || 'nos',
                                  plannedRem: undefined,
                                  boqItem: null,
                                  varianceReason: ''
                                });
                              } else if (selected) {
                                const rem = Math.max(0, (selected.planned || 0) - (selected.used || 0));
                                const found = data?.boq_items?.find(b => b.name === selected.name) || null;
                                updateItemRow(idx, {
                                  isCustom: false,
                                  materialName: selected.name,
                                  unit: selected.unit || 'nos',
                                  rate: (selected.rate && selected.rate > 0) ? selected.rate : (item.rate || ''),
                                  plannedRem: rem,
                                  boqItem: found,
                                  varianceReason: ''
                                });
                              } else {
                                updateItemRow(idx, {
                                  isCustom: false,
                                  materialName: '',
                                  unit: 'nos',
                                  boqItem: null,
                                  varianceReason: ''
                                });
                              }
                            }}
                            placeholder="-- Search or pick item --"
                          />

                          {item.isCustom && (
                            <div className="mt-2.5 p-3 bg-muted/40 border border-border rounded-xl space-y-2.5 animate-in fade-in">
                              <input
                                required
                                type="text"
                                className="w-full bg-white border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-semibold"
                                placeholder="Custom material name (e.g. CPVC 25mm pipe / Berger primer)..."
                                value={item.materialName || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  updateItemRow(idx, {
                                    materialName: val,
                                    customCategory: item.userOverrodeCategory ? item.customCategory : detectDiscipline(val)
                                  });
                                }}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] font-semibold text-muted-foreground">Discipline / Table</label>
                                  <select
                                    value={item.customCategory || detectDiscipline(item.materialName || '')}
                                    onChange={e => {
                                      updateItemRow(idx, {
                                        customCategory: e.target.value,
                                        userOverrodeCategory: true
                                      });
                                    }}
                                    className="w-full bg-white border border-border rounded-lg px-2.5 py-1.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-[#2648E7]"
                                  >
                                    {allDisciplineOptions.map(disc => (
                                      <option key={disc} value={disc}>{disc}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex items-center pt-3.5">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-blue-900 font-medium">
                                    <input
                                      type="checkbox"
                                      checked={item.addToBoq !== false}
                                      onChange={e => updateItemRow(idx, { addToBoq: e.target.checked })}
                                      className="rounded text-[#2648E7] size-3.5"
                                    />
                                    <span>Auto-register to QOM</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {activeModal === 'orders' ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Quantity</label>
                                <input required type="number" min="0.01" step="any" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-bold" placeholder="0" value={item.quantity || ''} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Unit</label>
                                <select required className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium" value={item.unit || ''} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                                  <option value="" disabled>Unit</option>
                                  <option value="kg">kg</option>
                                  <option value="bags">bags</option>
                                  <option value="cum">cum</option>
                                  <option value="cft">cft</option>
                                  <option value="Tonnes">Tonnes</option>
                                  <option value="Running meter">Running meter</option>
                                  <option value="m">m</option>
                                  <option value="nos">nos/pieces</option>
                                  <option value="sqft">sqft</option>
                                  <option value="sqm">sqm</option>
                                  <option value="Ltr">Ltr</option>
                                  <option value="set">set</option>
                                  <option value="lumpsum">lumpsum</option>
                                </select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Quoted Rate (₹) [Optional]</label>
                                <input type="number" min="0" step="any" className="w-full bg-slate-50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-700 font-medium" placeholder="e.g. 350" value={item.quotedRate !== undefined ? item.quotedRate : ''} onChange={e => handleItemChange(idx, 'quotedRate', e.target.value)} />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-[#2648E7] mb-1 block">Final Bought Rate (₹) *</label>
                                <input required type="number" min="0" step="any" className="w-full bg-white border-2 border-blue-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-bold" placeholder="0" value={item.rate || ''} onChange={e => handleItemChange(idx, 'rate', e.target.value)} />
                              </div>
                            </div>

                            {/* Live Price Variance Savings / Difference Display */}
                            {item.quotedRate !== undefined && item.quotedRate !== '' && item.rate !== undefined && item.rate !== '' && (
                              (() => {
                                const qRate = Number(item.quotedRate) || 0;
                                const bRate = Number(item.rate) || 0;
                                const qty = Number(item.quantity) || 1;
                                const diff = bRate - qRate;
                                const totalSaved = Math.abs(diff) * qty;

                                if (qRate <= 0) return null;
                                return (
                                  <div className={`p-2 rounded-xl text-xs flex items-center justify-between font-semibold border ${
                                    diff < 0
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : diff > 0
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-blue-50 text-blue-800 border-blue-200'
                                  }`}>
                                    <span>
                                      {diff < 0 
                                        ? `🎉 Negotiated Savings: ₹${Math.abs(diff).toLocaleString()}/${item.unit || 'unit'} below quote` 
                                        : diff > 0 
                                        ? `⚠️ Price Increase: +₹${diff.toLocaleString()}/${item.unit || 'unit'} above quote` 
                                        : `⚡ Exactly matches vendor quotation`}
                                    </span>
                                    {diff !== 0 && (
                                      <span className="font-bold">
                                        Total {diff < 0 ? 'Saved' : 'Cost'}: ₹{totalSaved.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Quantity</label>
                              <input required type="number" min="0.01" step="any" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-bold" placeholder="0" value={item.quantity || ''} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Unit</label>
                              <select required className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium" value={item.unit || ''} onChange={e => handleItemChange(idx, 'unit', e.target.value)}>
                                <option value="" disabled>Unit</option>
                                <option value="kg">kg</option>
                                <option value="bags">bags</option>
                                <option value="cum">cum</option>
                                <option value="cft">cft</option>
                                <option value="Tonnes">Tonnes</option>
                                <option value="Running meter">Running meter</option>
                                <option value="m">m</option>
                                <option value="nos">nos/pieces</option>
                                <option value="sqft">sqft</option>
                                <option value="sqm">sqm</option>
                                <option value="Ltr">Ltr</option>
                                <option value="set">set</option>
                                <option value="lumpsum">lumpsum</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-muted-foreground mb-1 block">Quoted Rate (₹)</label>
                              <input required type="number" min="0" step="any" className="w-full bg-white border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-bold" placeholder="0" value={item.rate || ''} onChange={e => handleItemChange(idx, 'rate', e.target.value)} />
                            </div>
                          </div>
                        )}

                        {/* Real-time Cost Intelligence Card for this line item */}
                        {(() => {
                          const boqMatch = item.boqItem || data?.boq_items?.find(b => b.name === item.materialName);
                          if (!boqMatch) return null;
                          return (
                            <CostIntelligenceCard
                              material={boqMatch}
                              quantity={item.quantity || 0}
                              varianceReason={item.varianceReason}
                              onVarianceReasonChange={(reason) => {
                                handleItemChange(idx, 'varianceReason', reason);
                              }}
                            />
                          );
                        })()}
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
                  ) : eligibleOrders.length === 0 ? (
                    <div className="p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200 font-semibold flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>All purchase orders for this project have already been received!</span>
                    </div>
                  ) : (
                    <select
                      required
                      className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                      value={formData.poId || ''}
                      onChange={e => handlePoChange(e.target.value)}
                    >
                      <option value="" disabled>Select Purchase Order</option>
                      {eligibleOrders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.vendor}) — {o.status}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Delivery Date & Arrival Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Calendar size={14} className="text-[#2648E7]" />
                      <span>Delivery Date</span>
                    </label>
                    <input
                      type="date"
                      required
                      className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                      value={formData.deliveryDate || ''}
                      onChange={e => setFormData({ ...formData, deliveryDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Clock size={14} className="text-[#2648E7]" />
                      <span>Delivery Time (Arrival)</span>
                    </label>
                    <input
                      type="time"
                      required
                      className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                      value={formData.deliveryTime || ''}
                      onChange={e => setFormData({ ...formData, deliveryTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Delivery Speed / Punctuality Assessment */}
                <div className="space-y-2 p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <span>Delivery Punctuality & Speed</span>
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Flags slow providers
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliverySpeed: 'ON_TIME' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        formData.deliverySpeed === 'ON_TIME' || !formData.deliverySpeed
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white border-border text-muted-foreground hover:border-emerald-300'
                      }`}
                    >
                      <span>⚡ On-Time</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliverySpeed: 'SLOW' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        formData.deliverySpeed === 'SLOW'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-white border-border text-muted-foreground hover:border-amber-300'
                      }`}
                    >
                      <span>🐢 Slow Provider</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, deliverySpeed: 'DELAYED' })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        formData.deliverySpeed === 'DELAYED'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-white border-border text-muted-foreground hover:border-rose-300'
                      }`}
                    >
                      <span>⏳ Delayed</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Capturing arrival time and provider speed flags unpunctual vendors across your projects.
                  </p>
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

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-foreground">Delivery Remarks / Gate Notes (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#2648E7] text-gray-900 font-medium"
                    placeholder="e.g. Challan #9821, truck DL-1AB-2291, arrived 2 hours late"
                    value={formData.remarks || ''}
                    onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                  />
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
                      {formData.poId 
                        ? 'All items in this order have already been received! Click "+ Add Item Row" if you want to add an unlisted item.' 
                        : 'No pending items found in selected order.'}
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
                      const stock = getAvailableStock(i);
                      const isOutOfStock = stock <= 0;
                      const selected = formData.items?.find((item: any) => item.inventoryItemId ? item.inventoryItemId === i.id : item.materialName === i.material) || {};
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
                              Available Stock: <strong className={isOutOfStock ? 'text-rose-600' : 'text-emerald-700'}>{i.stock}</strong>
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
                                  onChange={e => handleInventoryConsumeChange(i.id, i.material, e.target.value, stock)}
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
          <button 
            type="submit" 
            form="purchase-form" 
            disabled={loading || (activeModal === 'received' && (!formData.poId || !formData.items || formData.items.length === 0))} 
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50" 
            style={{ backgroundColor: "#2648E7" }}
          >
            {loading ? 'Saving...' : activeModal === 'received' ? 'Receive Goods' : activeModal === 'inventory' ? 'Consume Material' : 'Save Details'}
          </button>
        </div>
      </div>
    </div>
  );
}

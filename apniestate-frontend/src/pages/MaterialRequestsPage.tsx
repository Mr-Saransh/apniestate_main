import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';
import { Package, Plus, CheckCircle2 } from 'lucide-react';

interface MaterialRequest {
  id: string;
  site?: { name: string };
  material?: { name: string; unit: string; rate?: number };
  quantity: number;
  status: string;
  requester?: { name: string };
  created_at: string;
  notes?: string;
  priority?: "URGENT" | "HIGH" | "NORMAL" | "LOW";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{children}</p>
  );
}

export default function MaterialRequestsPage() {
  const { user } = useAuth();
  const { activeProjectId } = useProject();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReq, setNewReq] = useState({ materialName: '', quantity: 1, unit: '', priority: 'NORMAL', site_id: '', material_id: '' });

  const fetchRequests = () => {
    if (!activeProjectId) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    apiClient.get<any>(`/material-requests?project_id=${activeProjectId}`).then(res => {
      if (res.success && res.data) {
        setRequests(Array.isArray(res.data) ? res.data : res.data.data || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [activeProjectId]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProjectId) return;
    try {
      await apiClient.post('/material-requests', {
        site_id: newReq.site_id,
        material_id: newReq.material_id,
        quantity: Number(newReq.quantity),
        priority: newReq.priority,
        notes: `Requested: ${newReq.quantity} ${newReq.unit || 'units'} of ${newReq.materialName}`
      });
      setShowNewModal(false);
      fetchRequests();
    } catch (err) {
      console.error('Failed to create request', err);
    }
  };

  const handleApprove = async (id: string) => {
    await apiClient.patch(`/material-requests/${id}`, { status: 'APPROVED' });
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    await apiClient.patch(`/material-requests/${id}`, { status: 'REJECTED' });
    fetchRequests();
  };

  const stageBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      PENDING: { label: "Needs Approval", cls: "bg-amber-50 text-amber-700" },
      APPROVED: { label: "Approved", cls: "bg-blue-50 text-[#2648E7]" },
      REJECTED: { label: "Rejected", cls: "bg-red-50 text-red-700" },
      FULFILLED: { label: "Ordered", cls: "bg-emerald-50 text-emerald-700" },
      DELIVERED: { label: "Delivered", cls: "bg-emerald-50 text-emerald-700" },
    };
    const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
    return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${s.cls}`}>{s.label}</span>;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-[#2648E7] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between mb-2">
        <SectionLabel>All Requests</SectionLabel>
        {user?.role === 'SITE_SUPERVISOR' && (
          <button 
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 text-sm font-bold text-white px-3 py-1.5 rounded-xl shadow-sm"
            style={{ backgroundColor: "#2648E7" }}
          >
            <Plus size={14} />New Request
          </button>
        )}
      </div>

      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm bg-white rounded-2xl border border-border border-dashed">
            No material requests found.
          </div>
        ) : (
          requests.map((r, i) => {
            const itemName = r.material?.name || 'Unknown Material';
            const qty = `${r.quantity} ${r.material?.unit || 'units'}`;
            const date = new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

            return (
              <div key={r.id || i} className="bg-white rounded-2xl p-4 shadow-sm border border-border">
                <div className="flex items-start gap-3">
                  <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Package size={18} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm text-foreground truncate">{itemName}</p>
                      {stageBadge(r.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">Quantity: <span className="font-semibold text-foreground">{qty}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">{date} • {r.site?.name || 'Unknown Site'}</p>
                  </div>
                </div>
                
                {r.status === "PENDING" && (user?.role === 'BUILDER' || user?.role === 'ADMIN') && (
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    <button 
                      onClick={() => handleApprove(r.id)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 shadow-sm" 
                      style={{ backgroundColor: "#2648E7" }}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(r.id)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
                
                {r.status === "FULFILLED" && (
                  <div className="mt-3 pt-3 border-t border-border">
                     <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
                      <CheckCircle2 size={15} />Order placed successfully
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {user?.role !== 'SITE_SUPERVISOR' && (
        <button 
          onClick={() => setShowNewModal(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 rounded-2xl font-bold text-sm border-2 border-dashed border-border text-muted-foreground hover:border-[#2648E7] hover:text-[#2648E7] transition-colors"
        >
          <Plus size={16} />New Material Request
        </button>
      )}

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-foreground" style={{ fontFamily: "var(--font-display)" }}>Request Material</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Material Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cement, Bricks..."
                  className="w-full border border-border rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#2648E7]"
                  value={newReq.materialName}
                  onChange={(e) => setNewReq({...newReq, materialName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Quantity</label>
                  <input 
                    type="number" 
                    required min="1"
                    className="w-full border border-border rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#2648E7]"
                    value={newReq.quantity}
                    onChange={(e) => setNewReq({...newReq, quantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Unit</label>
                  <input 
                    type="text" 
                    required
                    placeholder="bags, kg..."
                    className="w-full border border-border rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#2648E7]"
                    value={newReq.unit}
                    onChange={(e) => setNewReq({...newReq, unit: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Priority</label>
                <select 
                  className="w-full border border-border rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#2648E7] bg-white"
                  value={newReq.priority}
                  onChange={(e) => setNewReq({...newReq, priority: e.target.value})}
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-6 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-colors shadow-sm"
                  style={{ backgroundColor: "#2648E7" }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { useAuth } from '@/context/AuthContext';

interface MaterialRequest {
  id: string;
  site?: { name: string };
  material?: { name: string; unit: string; rate?: number };
  quantity: number;
  status: string;
  requester?: { name: string };
  created_at: string;
  notes?: string;
  priority?: string;
}

export default function MaterialRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReq, setNewReq] = useState({ materialName: '', quantity: 1, priority: 'Normal' });

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/material-requests', {
        site_id: 'cl_demo_site_1',
        material_id: 'cl_demo_material_1',
        quantity: Number(newReq.quantity),
        priority: newReq.priority,
        notes: `Requested: ${newReq.materialName}`
      });
      setShowNewModal(false);
      fetchRequests();
    } catch (err) {
      console.error('Failed to create request', err);
    }
  };

  const fetchRequests = () => {
    setLoading(true);
    apiClient.get<any>('/material-requests').then(res => {
      if (res.success && res.data) {
        setRequests(Array.isArray(res.data) ? res.data : res.data.data || []);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, []);

  const filtered = requests.filter(r => 
    !search ||
    r.material?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.site?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const pending = requests.filter(r => r.status === 'PENDING').length;
  const approved = requests.filter(r => r.status === 'APPROVED').length;
  const rejected = requests.filter(r => r.status === 'REJECTED').length;

  const handleApprove = async (id: string) => {
    await apiClient.patch(`/material-requests/${id}`, { status: 'APPROVED' });
    fetchRequests();
  };

  const handleReject = async (id: string) => {
    await apiClient.patch(`/material-requests/${id}`, { status: 'REJECTED' });
    fetchRequests();
  };

  const priorityColor: Record<string, "red"|"yellow"|"blue"|"gray"> = { Urgent: "red", High: "yellow", Normal: "blue", Low: "gray" };
  const statusColor: Record<string, "red"|"yellow"|"blue"|"gray"|"green"> = { PENDING: "yellow", APPROVED: "green", REJECTED: "red", FULFILLED: "blue" };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PH title="Material Requests" sub={`${pending} pending · ${approved} approved this week`} />
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {[
          [pending.toString(), "Pending", "text-amber-600"], 
          [approved.toString(), "Approved", "text-emerald-600"], 
          [rejected.toString(), "Rejected", "text-red-500"]
        ].map(([v, l, cls]) => (
          <div key={l} className="bg-card border border-border rounded-xl p-3 text-center shadow-sm">
            <p className={`text-lg font-bold ${cls}`}>{v}</p>
            <p className="text-[10px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search requests..." />
        </div>
        {user?.role === 'SITE_SUPERVISOR' && (
          <button 
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-[#2648E7] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + New Request
          </button>
        )}
      </div>

      <Card noPad>
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No requests found</div>
        ) : (
          filtered.map((r, i) => {
            const itemName = `${r.material?.name || 'Unknown'} × ${r.quantity} ${r.material?.unit || 'units'}`;
            const reqId = r.id ? `MR-${r.id.split('_')[1] || r.id.substring(0, 4)}` : 'MR-XXXX';
            const rate = r.material?.rate || 0;
            const amt = rate * r.quantity;
            const amtStr = amt > 100000 ? `₨${(amt / 100000).toFixed(1)}L` : `₨${amt.toLocaleString()}`;
            
            return (
              <div key={r.id || i} className={`px-4 py-3 ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{itemName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{reqId} · {r.site?.name || 'Unknown'} · {r.requester?.name || 'System'}</p>
                  </div>
                  <span className="text-xs font-bold text-foreground flex-shrink-0">{amt > 0 ? amtStr : '-'}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip color={priorityColor[r.priority || 'Normal']}>{r.priority || 'Normal'}</Chip>
                  <Chip color={statusColor[r.status]}>{r.status}</Chip>
                  {r.status === "PENDING" && (user?.role === 'BUILDER' || user?.role === 'ADMIN') && (
                    <div className="ml-auto flex gap-1.5">
                      <button 
                        onClick={() => handleApprove(r.id)}
                        className="px-2 py-0.5 text-[10px] bg-emerald-500 text-white rounded font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(r.id)}
                        className="px-2 py-0.5 text-[10px] bg-red-100 text-red-600 rounded font-semibold hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </Card>

      {/* New Request Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold mb-4">Request Material</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Material Description</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 50 bags of Cement"
                  className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  value={newReq.materialName}
                  onChange={(e) => setNewReq({...newReq, materialName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Quantity</label>
                  <input 
                    type="number" 
                    required min="1"
                    className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    value={newReq.quantity}
                    onChange={(e) => setNewReq({...newReq, quantity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Priority</label>
                  <select 
                    className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-background"
                    value={newReq.priority}
                    onChange={(e) => setNewReq({...newReq, priority: e.target.value})}
                  >
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-lg transition-colors"
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

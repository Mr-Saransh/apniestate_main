import React, { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { PH, Card, Chip, SrchBar } from '@/components/shared/FigmaComponents';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';

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

export default function MaterialRequestsPage() {
  const { user } = useAuth();
  const { activeProjectId } = useProject();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newReq, setNewReq] = useState({ materialName: '', quantity: 1, unit: '', priority: 'NORMAL', site_id: '', material_id: '' });

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

  const priorityColor: Record<string, "red"|"yellow"|"blue"|"gray"> = { URGENT: "red", HIGH: "yellow", NORMAL: "blue", LOW: "gray" };
  const priorityLabel: Record<string, string> = { URGENT: "Urgent", HIGH: "High", NORMAL: "Normal", LOW: "Low" };
  const statusColor: Record<string, "red"|"yellow"|"blue"|"gray"|"green"> = { PENDING: "yellow", APPROVED: "green", REJECTED: "red", FULFILLED: "blue", DELIVERED: "blue" };

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
      
      <div className="grid grid-cols-3 gap-3">
        {[
          [pending.toString(), "Pending", "text-[#E85C1E]"], 
          [approved.toString(), "Approved", "text-[#0F9D58]"], 
          [rejected.toString(), "Rejected", "text-[#DB4437]"]
        ].map(([v, l, cls]) => (
          <div key={l} className="bg-white border border-border rounded-xl p-4 text-center shadow-sm flex flex-col justify-center items-center h-24">
            <p className={`text-2xl font-bold ${cls} mb-1`}>{v}</p>
            <p className="text-xs text-muted-foreground font-medium">{l}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <div className="flex-1" onChange={(e: any) => setSearch(e.target.value)}>
          <SrchBar placeholder="Search requests..." />
        </div>
        {user?.role === 'SITE_SUPERVISOR' && (
          <button 
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors whitespace-nowrap"
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
              <div key={r.id || i} className={`p-4 bg-white ${i < filtered.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-foreground truncate">{itemName}</p>
                    <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <span>{reqId}</span>
                      <span>·</span>
                      <span>{r.site?.name || 'Unknown'}</span>
                      <span>·</span>
                      <span>{r.requester?.name || 'System'}</span>
                    </p>
                  </div>
                  <span className="text-[15px] font-bold text-foreground flex-shrink-0">
                    {amt > 0 ? amtStr.replace('₨', 'Rs') : 'Rs0'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Chip color={priorityColor[r.priority || 'NORMAL']} >{priorityLabel[r.priority || 'NORMAL']}</Chip>
                  <Chip color={statusColor[r.status]} >
                    {r.status === 'PENDING' ? 'Pending' : r.status === 'APPROVED' ? 'Approved' : r.status === 'REJECTED' ? 'Rejected' : r.status}
                  </Chip>
                  
                  {r.status === "PENDING" && (user?.role === 'BUILDER' || user?.role === 'ADMIN') && (
                    <div className="ml-auto flex gap-2">
                      <button 
                        onClick={() => handleApprove(r.id)}
                        className="px-3 py-1.5 text-xs bg-[#2648E7] text-white rounded font-semibold hover:bg-[#1E3ED0] transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => handleReject(r.id)}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded font-semibold hover:bg-red-100 transition-colors"
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
                <label className="block text-xs font-semibold mb-1">Material Name</label>
                <input 
                  type="text" 
                  list="common-materials"
                  required
                  placeholder="e.g. Cement, Bricks, or type custom..."
                  className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  value={newReq.materialName}
                  onChange={(e) => setNewReq({...newReq, materialName: e.target.value})}
                />
                <datalist id="common-materials">
                  <option value="Cement" />
                  <option value="Steel Bars" />
                  <option value="Bricks" />
                  <option value="Sand" />
                  <option value="Plywood" />
                  <option value="Crush" />
                  <option value="Gravel" />
                </datalist>
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                  <label className="block text-xs font-semibold mb-1">Unit</label>
                  <select 
                    required
                    className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-background"
                    value={["bags", "kg", "tons", "cft", "pcs", "sheets", "liters"].includes(newReq.unit) ? newReq.unit : (newReq.unit ? 'other' : '')}
                    onChange={(e) => {
                      if (e.target.value !== 'other') {
                        setNewReq({...newReq, unit: e.target.value});
                      } else {
                        setNewReq({...newReq, unit: 'custom'});
                      }
                    }}
                  >
                    <option value="" disabled>Select unit...</option>
                    <option value="bags">bags</option>
                    <option value="kg">kg</option>
                    <option value="tons">tons</option>
                    <option value="cft">cft</option>
                    <option value="pcs">pcs</option>
                    <option value="sheets">sheets</option>
                    <option value="liters">liters</option>
                    <option value="other">Other (Specify)</option>
                  </select>
                  
                  {!["bags", "kg", "tons", "cft", "pcs", "sheets", "liters", ""].includes(newReq.unit) && (
                    <input 
                      type="text" 
                      required
                      autoFocus
                      placeholder="Type custom unit..."
                      className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary mt-2"
                      value={newReq.unit === 'custom' ? '' : newReq.unit}
                      onChange={(e) => setNewReq({...newReq, unit: e.target.value})}
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Priority</label>
                  <select 
                    className="w-full border border-border rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-primary bg-background"
                    value={newReq.priority}
                    onChange={(e) => setNewReq({...newReq, priority: e.target.value})}
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
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

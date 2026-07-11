import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, IndianRupee, Trash2 } from 'lucide-react';
import { PH, Card, Chip } from '@/components/shared/FigmaComponents';
import { boqApi, type BOQ } from '@/api/boq';
import Modal from '@/components/shared/Modal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/context/AuthContext';
import { useProject } from '@/context/ProjectContext';

export default function BOQApprovalsPage() {
  const { user } = useAuth();
  const { activeProjectId, loading: projectLoading } = useProject();
  const [loading, setLoading] = useState(false);
  const [boq, setBoq] = useState<BOQ | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  useEffect(() => {
    if (activeProjectId) {
      fetchData(activeProjectId);
    } else {
      setBoq(null);
    }
  }, [activeProjectId]);

  const fetchData = async (id: string) => {
    try {
      setLoading(true);
      const res = await boqApi.getBOQForProject(id);
      if (res.data) {
        setBoq(res.data);
      } else {
        setBoq(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!boq || !activeProjectId) return;
    if (boq.total_estimated_cost === 0) {
      alert("Cannot approve an empty BOQ with ₹0 total cost.");
      setShowApproveConfirm(false);
      return;
    }
    await boqApi.approveBOQ(boq.id);
    setShowApproveConfirm(false);
    fetchData(activeProjectId);
  };

  const handleDelete = async () => {
    if (!boq) return;
    if (confirm("Are you sure you want to completely delete this BOQ?")) {
      await boqApi.deleteBOQ(boq.id);
      setBoq(null);
    }
  };

  if (projectLoading || loading) return <LoadingSpinner size="lg" />;

  if (!activeProjectId) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
        <PH title="BOQ Approvals" sub="Review and Approve Project BOQ" />
        <Card noPad>
          <div className="p-8 text-center text-gray-500">
            Please select a project from the top navigation menu to view its BOQ approvals.
          </div>
        </Card>
      </div>
    );
  }

  const isApproved = boq?.status === 'APPROVED';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <PH title="BOQ Approvals" sub="Review and Approve Project BOQ" />
        {boq && (
          <Chip color={isApproved ? 'green' : 'yellow'}>{boq.status}</Chip>
        )}
      </div>

      {!boq ? (
        <Card noPad>
          <div className="p-8 text-center text-gray-500">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No BOQ has been drafted for this project yet.</p>
          </div>
        </Card>
      ) : (
        <Card noPad>
          <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2 bg-gray-50/50 rounded-t-xl">
            <h3 className="font-bold text-gray-900">
              {isApproved ? `Approved BOQ (Version ${boq.version})` : `Draft BOQ Review (Version ${boq.version})`}
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="font-mono text-lg font-black text-[#2648E7]">
                ₹ {boq.total_estimated_cost.toLocaleString()}
              </div>
              {!isApproved && (
                <button 
                  onClick={() => setShowApproveConfirm(true)} 
                  disabled={boq.total_estimated_cost === 0}
                  className={`px-4 py-2 rounded text-sm font-semibold flex gap-1 items-center ${
                    boq.total_estimated_cost > 0
                      ? "bg-green-500 text-white hover:bg-green-600" 
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                  title={boq.total_estimated_cost === 0 ? "Cannot approve a BOQ with ₹0 estimated cost" : ""}
                >
                  <CheckCircle size={16} /> Approve BOQ
                </button>
              )}
              <button onClick={handleDelete} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100" title="Delete BOQ">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          <div className="p-0 overflow-x-auto">
             {(!boq.categories || boq.categories.length === 0) && (
               <div className="p-8 text-center text-gray-500">
                 This BOQ is empty.
               </div>
             )}
             {boq.categories.map((cat, i) => (
                <div key={i} className="border-b border-gray-100 last:border-0 min-w-max">
                  <div className="bg-gray-50 px-4 py-2 font-semibold text-sm text-gray-800 border-y border-gray-200">
                    {cat.name}
                  </div>
                  <table className="w-full min-w-[800px] text-left text-sm text-gray-700">
                    <thead className="bg-gray-50/50 text-xs text-gray-500 font-medium">
                      <tr>
                        <th className="px-4 py-2 w-1/4">Description</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">Unit</th>
                        <th className="px-4 py-2">Material</th>
                        <th className="px-4 py-2">Labour</th>
                        <th className="px-4 py-2 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cat.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 w-1/3">
                            <span className="font-medium text-gray-900">{item.description}</span>
                            {item.code && <span className="ml-2 text-xs text-gray-500">{item.code}</span>}
                          </td>
                          <td className="px-4 py-3 w-32 font-mono text-xs">{item.quantity}</td>
                          <td className="px-4 py-3 text-xs">{item.unit}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">₹{item.material_rate}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">₹{item.labour_rate}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">₹{(item.total_amount || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             ))}
          </div>
        </Card>
      )}

      {/* Approval Modal */}
      <Modal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        title="Approve BOQ"
        footer={
          <>
            <button className="btn btn-ghost text-gray-700" onClick={() => setShowApproveConfirm(false)}>Cancel</button>
            <button className="btn bg-green-500 text-white hover:bg-green-600 ml-2" onClick={handleApprove}>Approve & Lock</button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          Approving this BOQ will lock it for the project and make it the baseline for the Cost Intelligence Engine. Are you sure you want to proceed?
        </p>
      </Modal>

    </div>
  );
}

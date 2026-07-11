import React from "react";
import { Package, Truck, AlertTriangle, FileText, IndianRupee } from "lucide-react";

export function ProcurementIntelligenceWidget({ data }: { data?: any }) {
  // Mock data mapping for now, but will receive real data from backend
  const pendingRequests = data?.pendingRequests || 12;
  const pendingRFQs = data?.pendingRFQs || 5;
  const pendingPOs = data?.pendingPOs || 8;
  const pendingDeliveries = data?.pendingDeliveries || 3;
  const lowStockAlerts = data?.lowStockAlerts || 14;
  const inventoryValue = data?.inventoryValue || 1250000;
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Procurement Engine</h2>
          <p className="text-[10px] text-gray-500 mt-0.5">Enterprise Material & Inventory Lifecycle</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5 text-gray-500">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Pending MRs</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{pendingRequests}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5 text-gray-500">
            <FileText className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Pending RFQs</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{pendingRFQs}</div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1.5 text-gray-500">
            <Truck className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Deliveries</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{pendingDeliveries}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5 text-orange-600">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Low Stock Alerts</span>
            </div>
          </div>
          <div className="text-lg font-bold text-orange-700">{lowStockAlerts} <span className="text-[10px] font-normal text-orange-600/70">items</span></div>
        </div>

        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <IndianRupee className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Inventory Value</span>
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-700">₹{(inventoryValue / 100000).toFixed(1)}L</div>
        </div>
      </div>
    </div>
  );
}

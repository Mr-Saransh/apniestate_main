import React from "react";
import { Package, Truck, AlertTriangle, FileCheck, ArrowRight } from "lucide-react";

export function SiteProcurementWidget({ data }: { data?: any }) {
  const pendingDeliveries = data?.pendingDeliveries || 2;
  const todaysDeliveries = data?.todaysDeliveries || 1;
  const lowStockAlerts = data?.lowStockAlerts || 5;
  const recentIssues = data?.recentIssues || 3;
  
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Site Material & Inventory</h2>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <Package className="w-5 h-5 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1 text-gray-500">
            <Truck className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Expected Today</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{todaysDeliveries}</div>
          {todaysDeliveries > 0 && (
            <a href="/grn/new" className="text-[10px] text-blue-600 font-medium hover:underline mt-1 block">
              Create GRN
            </a>
          )}
        </div>

        <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
          <div className="flex items-center gap-1.5 mb-1 text-orange-600">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Low Stock</span>
          </div>
          <div className="text-lg font-bold text-orange-700">{lowStockAlerts}</div>
          <a href="/material-requests/new" className="text-[10px] text-orange-600 font-medium hover:underline mt-1 block">
            Request Materials
          </a>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-gray-700 text-xs font-medium">
            <Truck className="w-4 h-4 text-gray-400" />
            Total Pending Deliveries
          </div>
          <span className="text-sm font-bold text-gray-900">{pendingDeliveries}</span>
        </div>
        
        <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2 text-gray-700 text-xs font-medium">
            <FileCheck className="w-4 h-4 text-gray-400" />
            Recent Material Issues
          </div>
          <span className="text-sm font-bold text-gray-900">{recentIssues}</span>
        </div>
      </div>
    </div>
  );
}

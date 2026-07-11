import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { FileCheck, ShoppingCart, ShoppingBag, Warehouse, Package, Truck } from 'lucide-react';

import BOQPage from './BOQPage';
import MaterialRequestsPage from './MaterialRequestsPage';
import PurchaseOrdersPage from './PurchaseOrdersPage';
import InventoryPage from './InventoryPage';
import VendorsPage from './VendorsPage';
import MaterialsPage from './MaterialsPage';

export default function PurchaseWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProject();
  
  const currentTab = searchParams.get('tab') || 'boq';
  
  const tabs = [
    { id: 'boq', label: 'BOQ', icon: FileCheck },
    { id: 'requests', label: 'Material Requests', icon: ShoppingCart },
    { id: 'orders', label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'inventory', label: 'Inventory (GRN)', icon: Warehouse },
    { id: 'vendors', label: 'Vendors', icon: Truck },
    { id: 'materials', label: 'Material Master', icon: Package },
  ];

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-slate-400 mb-4"><ShoppingCart size={48} /></div>
        <h2 className="text-xl font-semibold text-slate-700">No Project Selected</h2>
        <p className="text-slate-500 mt-2">Please select a project from the top bar to view purchase operations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Workspace Header & Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Purchase & Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">Manage BOQ, material requests, orders, and inventory.</p>
          </div>
        </div>
        
        <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-200">
          {tabs.map(tab => {
            const isActive = currentTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id }, { replace: true })}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {currentTab === 'boq' && <BOQPage />}
        {currentTab === 'requests' && <MaterialRequestsPage />}
        {currentTab === 'orders' && <PurchaseOrdersPage />}
        {currentTab === 'inventory' && <InventoryPage />}
        {currentTab === 'vendors' && <VendorsPage />}
        {currentTab === 'materials' && <MaterialsPage />}
      </div>
    </div>
  );
}

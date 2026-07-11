import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProject } from '@/context/ProjectContext';
import { Users, Truck, HardHat, ShieldCheck } from 'lucide-react';

import LabourRegister from '@/components/operations/LabourRegister';
import EquipmentPage from './EquipmentPage';
import SitesPage from './SitesPage';
import LabourCategoryConfig from '@/components/operations/LabourCategoryConfig';
import { useAuth } from '@/context/AuthContext';

export default function OperationsWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProject();
  const { user } = useAuth();
  
  const isBuilder = user?.role === 'BUILDER' || user?.role === 'ADMIN';

  const defaultTab = isBuilder ? 'config' : 'labour';
  const currentTab = searchParams.get('tab') || defaultTab;
  
  const allTabs = [
    { id: 'config', label: 'Labour Config', icon: Users, roles: ['BUILDER', 'ADMIN'] },
    { id: 'labour', label: 'Labour Register', icon: Users, roles: ['SITE_SUPERVISOR', 'PROJECT_MANAGER', 'BUILDER', 'ADMIN'] },
    { id: 'equipment', label: 'Equipment', icon: Truck, roles: ['SITE_SUPERVISOR', 'PROJECT_MANAGER', 'BUILDER', 'ADMIN'] },
    { id: 'sites', label: 'Sites', icon: HardHat, roles: ['BUILDER', 'ADMIN', 'PROJECT_MANAGER'] }
  ];

  const tabs = allTabs.filter(t => t.roles.includes(user?.role || ''));

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-slate-400 mb-4"><Users size={48} /></div>
        <h2 className="text-xl font-semibold text-slate-700">No Project Selected</h2>
        <p className="text-slate-500 mt-2">Please select a project from the top bar to view operations.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Site Operations</h1>
            <p className="text-sm text-slate-500 mt-1">Manage daily labour, equipment, and sites.</p>
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

      <div className="flex-1">
        {currentTab === 'config' && <LabourCategoryConfig />}
        {currentTab === 'labour' && <LabourRegister />}
        {currentTab === 'equipment' && <EquipmentPage />}
        {currentTab === 'sites' && <SitesPage />}
      </div>
    </div>
  );
}

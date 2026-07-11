import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TimelinePage from './TimelinePage';
import MilestonesPage from './MilestonesPage';
import DprPage from './DprPage';
import CalendarPage from './CalendarPage';
import { useProject } from '@/context/ProjectContext';
import { CalendarDays, Flag, FileText, Calendar } from 'lucide-react';

export default function ProgressWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProjectId } = useProject();
  const navigate = useNavigate();
  
  const currentTab = searchParams.get('tab') || 'timeline';
  
  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: CalendarDays },
    { id: 'milestones', label: 'Milestones', icon: Flag },
    { id: 'dpr', label: 'Daily Progress', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
  ];

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="text-slate-400 mb-4"><CalendarDays size={48} /></div>
        <h2 className="text-xl font-semibold text-slate-700">No Project Selected</h2>
        <p className="text-slate-500 mt-2">Please select a project from the top bar to view progress.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Workspace Header & Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Project Progress</h1>
            <p className="text-sm text-slate-500 mt-1">Track timelines, milestones, and daily reports.</p>
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
        {currentTab === 'timeline' && <TimelinePage />}
        {currentTab === 'milestones' && <MilestonesPage />}
        {currentTab === 'dpr' && <DprPage />}
        {currentTab === 'calendar' && <CalendarPage />}
      </div>
    </div>
  );
}

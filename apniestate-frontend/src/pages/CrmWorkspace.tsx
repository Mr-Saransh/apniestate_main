import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus, Sparkles
} from 'lucide-react';
import { crmApi, type CrmLead, type CrmAnalytics, type CrmFollowup, type CrmProperty } from '@/api/crm';

// Tabs
import CrmOverviewTab from '@/components/crm/CrmOverviewTab';
import CrmLeadsTab from '@/components/crm/CrmLeadsTab';
import CrmPipelineTab from '@/components/crm/CrmPipelineTab';
import CrmFollowupsTab from '@/components/crm/CrmFollowupsTab';
import CrmCustomersTab from '@/components/crm/CrmCustomersTab';
import CrmActivitiesTab from '@/components/crm/CrmActivitiesTab';
import CrmPropertiesTab from '@/components/crm/CrmPropertiesTab';

// Modals
import AddLeadModal from '@/components/crm/AddLeadModal';
import EditLeadModal from '@/components/crm/EditLeadModal';
import LeadDetailModal from '@/components/crm/LeadDetailModal';
import AddFollowupModal from '@/components/crm/AddFollowupModal';
import AddDealModal from '@/components/crm/AddDealModal';
import AddActivityModal from '@/components/crm/AddActivityModal';
import AddPropertyModal from '@/components/crm/AddPropertyModal';
import SharePropertyModal from '@/components/crm/SharePropertyModal';
import ImportLeadsModal from '@/components/crm/ImportLeadsModal';

type CrmTab = 'overview' | 'leads' | 'pipeline' | 'followups' | 'customers' | 'activities' | 'properties';

export default function CrmWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') || 'overview') as CrmTab;

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [followups, setFollowups] = useState<CrmFollowup[]>([]);
  const [analytics, setAnalytics] = useState<CrmAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<CrmLead | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const [isAddFollowupOpen, setIsAddFollowupOpen] = useState(false);
  const [followupLeadId, setFollowupLeadId] = useState<string | null>(null);

  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [dealLead, setDealLead] = useState<CrmLead | null>(null);

  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [isSharePropertyOpen, setIsSharePropertyOpen] = useState(false);
  const [sharingProperty, setSharingProperty] = useState<CrmProperty | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const fetchCrmData = async (silent = false) => {
    try {
      if (!silent && leads.length === 0) setLoading(true);
      const [leadsRes, followupsRes, analyticsRes] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getFollowups(),
        crmApi.getAnalytics(),
      ]);

      if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);
      if (followupsRes.success && followupsRes.data) setFollowups(followupsRes.data);
      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error('Failed to load CRM workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const handleOpenLeadDetail = (id: string) => {
    setSelectedLeadId(id);
    setIsDetailOpen(true);
  };

  const handleOpenEditLead = (lead: CrmLead) => {
    setEditingLead(lead);
    setIsEditLeadOpen(true);
  };

  const handleOpenAddFollowup = (leadId?: string) => {
    setFollowupLeadId(leadId || null);
    setIsAddFollowupOpen(true);
  };

  const handleOpenAddDeal = (lead?: CrmLead) => {
    setDealLead(lead || null);
    setIsAddDealOpen(true);
  };

  const handleOpenShareProperty = (property: CrmProperty) => {
    setSharingProperty(property);
    setIsSharePropertyOpen(true);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead? All associated follow-ups will also be removed.')) return;
    try {
      await crmApi.deleteLead(leadId);
      await fetchCrmData();
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 min-h-screen">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3.5 shrink-0 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2648E7] to-[#1e3bbd] flex items-center justify-center text-white shadow-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <h1 className="text-base lg:text-lg font-bold text-slate-900 leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {tab === 'overview' ? 'CRM Overview' :
                 tab === 'leads' ? 'Leads Directory' :
                 tab === 'pipeline' ? 'Sales Pipeline' :
                 tab === 'followups' ? 'Follow-up Reminders' :
                 tab === 'customers' ? 'Customers & Deals' :
                 tab === 'activities' ? 'Activities & Visits' :
                 tab === 'properties' ? 'Properties Catalog' : 'Real Estate CRM'}
              </h1>
              <p className="text-[11px] text-slate-400">Leads, Follow-ups, Pipeline & Sales Management</p>
            </div>
          </div>

          <button
            onClick={() => setIsAddLeadOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#2648E7] hover:bg-[#1e3bbd] shadow-sm transition-all active:scale-95"
          >
            <Plus size={14} /> Add Lead
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {tab === 'overview' && (
          <CrmOverviewTab
            analytics={analytics}
            leads={leads}
            followups={followups}
            onOpenAddLead={() => setIsAddLeadOpen(true)}
            onOpenAddFollowup={() => handleOpenAddFollowup()}
            onOpenAddDeal={() => handleOpenAddDeal()}
            onSelectLead={handleOpenLeadDetail}
            onNavigateTab={handleTabChange}
          />
        )}

        {tab === 'leads' && (
          <CrmLeadsTab
            leads={leads}
            loading={loading}
            onOpenAddLead={() => setIsAddLeadOpen(true)}
            onOpenImportLeads={() => setIsImportOpen(true)}
            onSelectLead={handleOpenLeadDetail}
            onOpenEditLead={handleOpenEditLead}
            onDeleteLead={handleDeleteLead}
          />
        )}

        {tab === 'pipeline' && (
          <CrmPipelineTab
            leads={leads}
            onSelectLead={handleOpenLeadDetail}
            onOpenAddLead={() => setIsAddLeadOpen(true)}
            onLeadUpdated={fetchCrmData}
          />
        )}

        {tab === 'followups' && (
          <CrmFollowupsTab
            followups={followups}
            onOpenAddFollowup={() => handleOpenAddFollowup()}
            onSelectLead={handleOpenLeadDetail}
            onFollowupUpdated={fetchCrmData}
          />
        )}

        {tab === 'customers' && (
          <CrmCustomersTab
            leads={leads}
            onOpenAddDeal={handleOpenAddDeal}
            onSelectLead={handleOpenLeadDetail}
          />
        )}

        {tab === 'activities' && (
          <CrmActivitiesTab
            leads={leads}
            onOpenAddActivity={() => setIsAddActivityOpen(true)}
            onSelectLead={handleOpenLeadDetail}
          />
        )}

        {tab === 'properties' && (
          <CrmPropertiesTab
            leads={leads}
            onOpenAddProperty={() => setIsAddPropertyOpen(true)}
            onOpenShareProperty={handleOpenShareProperty}
          />
        )}
      </div>

      {/* Modals & Drawers */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={() => {
          fetchCrmData();
        }}
      />

      <EditLeadModal
        lead={editingLead}
        isOpen={isEditLeadOpen}
        onClose={() => setIsEditLeadOpen(false)}
        onSuccess={() => {
          fetchCrmData();
        }}
      />

      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onLeadUpdated={() => fetchCrmData(true)}
        onOpenEdit={lead => {
          setIsDetailOpen(false);
          handleOpenEditLead(lead);
        }}
        onOpenAddFollowup={id => {
          handleOpenAddFollowup(id);
        }}
        onOpenAddDeal={lead => {
          handleOpenAddDeal(lead);
        }}
      />

      <AddFollowupModal
        leadId={followupLeadId}
        leads={leads}
        isOpen={isAddFollowupOpen}
        onClose={() => setIsAddFollowupOpen(false)}
        onSuccess={() => fetchCrmData(true)}
      />

      <AddDealModal
        lead={dealLead}
        leads={leads}
        isOpen={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
        onSuccess={() => fetchCrmData(true)}
      />

      <AddActivityModal
        leads={leads}
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        onSuccess={() => fetchCrmData(true)}
      />

      <AddPropertyModal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        onSuccess={() => fetchCrmData(true)}
      />

      <SharePropertyModal
        property={sharingProperty}
        leads={leads}
        isOpen={isSharePropertyOpen}
        onClose={() => setIsSharePropertyOpen(false)}
      />

      <ImportLeadsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => fetchCrmData(true)}
      />
    </div>
  );
}

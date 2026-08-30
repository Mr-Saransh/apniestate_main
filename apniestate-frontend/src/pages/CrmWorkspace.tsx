import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Sparkles,
  Lock,
  ArrowRight,
  Building2,
  Users,
  GitCommit,
  Clock,
  IndianRupee,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { crmApi, type CrmLead, type CrmAnalytics, type CrmFollowup, type CrmProperty } from '@/api/crm';
import { subscriptionApi, type CompanyEntitlements } from '@/api/subscription';
import { useAppMode } from '@/context/AppModeContext';
import { useAuth } from '@/context/AuthContext';
import { getUserCrmRole } from '@/config/crm-permissions';

// Tabs
import CrmOverviewTab from '@/components/crm/CrmOverviewTab';
import CrmLeadsTab from '@/components/crm/CrmLeadsTab';
import CrmPipelineTab from '@/components/crm/CrmPipelineTab';
import CrmFollowupsTab from '@/components/crm/CrmFollowupsTab';
import CrmCustomersTab from '@/components/crm/CrmCustomersTab';
import CrmActivitiesTab from '@/components/crm/CrmActivitiesTab';
import CrmPropertiesTab from '@/components/crm/CrmPropertiesTab';
import CrmTeamTab from '@/components/crm/CrmTeamTab';
import CrmReportsTab from '@/components/crm/CrmReportsTab';
import CrmSettingsTab from '@/components/crm/CrmSettingsTab';

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

type CrmTab =
  | 'overview'
  | 'leads'
  | 'pipeline'
  | 'followups'
  | 'customers'
  | 'activities'
  | 'properties'
  | 'team'
  | 'reports'
  | 'settings'
  | 'deals';

export default function CrmWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setMode } = useAppMode();
  const { user } = useAuth();
  const crmRole = getUserCrmRole(user);

  let rawTab = (searchParams.get('tab') || 'overview') as CrmTab;
  if (rawTab === 'deals') rawTab = 'customers';

  // Role tab authorization check
  if (crmRole === 'TELECALLER' && ['team', 'reports', 'settings', 'customers', 'properties'].includes(rawTab)) {
    if (rawTab === 'customers') {
      // Allow deals view under personal workspace
    } else {
      rawTab = 'overview';
    }
  } else if (crmRole === 'CRM_MANAGER' && rawTab === 'settings') {
    rawTab = 'overview';
  }

  const tab = rawTab;

  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [followups, setFollowups] = useState<CrmFollowup[]>([]);
  const [analytics, setAnalytics] = useState<CrmAnalytics | null>(null);
  const [entitlements, setEntitlements] = useState<CompanyEntitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCrmLocked, setIsCrmLocked] = useState(false);

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

      // Check entitlements first
      const entRes = await subscriptionApi.getEntitlements();
      if (entRes.success && entRes.data) {
        setEntitlements(entRes.data);
        if (!entRes.data.has_crm) {
          setIsCrmLocked(true);
          setLoading(false);
          return;
        }
      }

      const [leadsRes, followupsRes, analyticsRes] = await Promise.all([
        crmApi.getLeads(),
        crmApi.getFollowups(),
        crmApi.getAnalytics(),
      ]);

      if (leadsRes.success && leadsRes.data) setLeads(leadsRes.data);
      if (followupsRes.success && followupsRes.data) setFollowups(followupsRes.data);
      if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch (err: any) {
      if (err.message?.includes('CRM is available exclusively') || err.status === 403) {
        setIsCrmLocked(true);
      }
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
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await crmApi.deleteLead(leadId);
        fetchCrmData(true);
      } catch (err: any) {
        alert(err.message || 'Failed to delete lead');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50/50 min-h-[400px]">
        <div className="relative flex justify-center items-center">
          <div className="absolute animate-ping w-12 h-12 rounded-full bg-[#2648E7]/20" />
          <div className="w-8 h-8 rounded-full border-4 border-[#2648E7]/20 border-t-[#2648E7] animate-spin relative z-10" />
        </div>
      </div>
    );
  }

  // Locked CRM View (Subscription check)
  if (isCrmLocked) {
    return (
      <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-[#0B132B] to-[#1C2541] border border-white/10 p-8 md:p-12 text-white shadow-2xl text-center">
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#2648E7]/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-[#FCC300]/10 rounded-full blur-3xl pointer-events-none translate-y-1/2" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FCC300]/20 to-[#2648E7]/30 border border-white/20 flex items-center justify-center mx-auto shadow-inner">
              <Lock size={36} className="text-[#FCC300]" />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FCC300]/10 border border-[#FCC300]/30 text-[#FCC300] text-xs font-black uppercase tracking-wider mb-3">
                <Sparkles size={13} />
                <span>Enterprise Feature</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Unlock Real Estate CRM
              </h1>
              <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
                The full CRM & Sales Pipeline workspace is available exclusively on the <strong>₹1,00,000 Enterprise Plan</strong>.
                Accelerate buyer conversions, organize client follow-ups, and track unit bookings in one unified interface.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left pt-2 pb-4">
              {[
                { title: 'Omnichannel Lead Capture', desc: 'Direct, WhatsApp, social ads, walk-in inquiries' },
                { title: 'Visual Kanban Pipeline', desc: 'Drag-and-drop deals across qualification to booking' },
                { title: 'Automated Follow-ups', desc: 'Never miss buyer visits, scheduled calls, or payment reminders' },
                { title: 'Deals & Commission Tracking', desc: 'Token payments, builder commissions, & buyer ledgers' },
              ].map((f, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-white">{f.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => navigate('/subscription')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-extrabold text-sm bg-gradient-to-r from-[#2648E7] to-[#4F6DFF] hover:from-[#1e3bbd] hover:to-[#2648E7] text-white shadow-xl shadow-[#2648E7]/40 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={16} className="text-[#FCC300]" />
                <span>Upgrade to Enterprise Plan (₹1,00,000)</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => setMode('ERP')}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <Layers size={16} />
                <span>Back to Construction ERP</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="border-b border-slate-200/80 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Real Estate CRM
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
            {crmRole === 'TELECALLER'
              ? 'Manage your assigned leads, sales follow-ups, and property bookings'
              : crmRole === 'CRM_MANAGER'
              ? 'Manage sales team leads, telecallers, pipeline funnel, and performance'
              : 'Enterprise CRM Command Center: Leads, team hierarchy, and bookings'}
          </p>
        </div>
      </div>

      {/* Tab Contents */}
      {tab === 'overview' && (
        <CrmOverviewTab
          analytics={analytics}
          leads={leads}
          followups={followups}
          onOpenAddLead={() => setIsAddLeadOpen(true)}
          onOpenAddFollowup={() => handleOpenAddFollowup()}
          onOpenAddDeal={() => handleOpenAddDeal()}
          onOpenImportCsv={() => setIsImportOpen(true)}
          onOpenAddProperty={() => setIsAddPropertyOpen(true)}
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
          onRefreshLeads={() => fetchCrmData(true)}
        />
      )}

      {tab === 'pipeline' && (
        <CrmPipelineTab
          leads={leads}
          onSelectLead={handleOpenLeadDetail}
          onOpenAddLead={() => setIsAddLeadOpen(true)}
          onLeadUpdated={() => fetchCrmData(true)}
        />
      )}

      {tab === 'followups' && (
        <CrmFollowupsTab
          followups={followups}
          onOpenAddFollowup={() => handleOpenAddFollowup()}
          onSelectLead={handleOpenLeadDetail}
          onFollowupUpdated={() => fetchCrmData(true)}
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

      {tab === 'team' && (
        <CrmTeamTab
          onNavigateToLeads={(assignedToId) => {
            handleTabChange('leads');
          }}
        />
      )}

      {tab === 'reports' && (
        <CrmReportsTab
          analytics={analytics}
          leads={leads}
        />
      )}

      {tab === 'settings' && (
        <CrmSettingsTab />
      )}

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onSuccess={() => {
          setIsAddLeadOpen(false);
          fetchCrmData(true);
        }}
      />

      <EditLeadModal
        lead={editingLead}
        isOpen={isEditLeadOpen}
        onClose={() => {
          setIsEditLeadOpen(false);
          setEditingLead(null);
        }}
        onSuccess={() => {
          setIsEditLeadOpen(false);
          setEditingLead(null);
          fetchCrmData(true);
        }}
      />

      <LeadDetailModal
        leadId={selectedLeadId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedLeadId(null);
        }}
        onLeadUpdated={() => fetchCrmData(true)}
        onOpenEdit={(lead: CrmLead) => {
          setIsDetailOpen(false);
          handleOpenEditLead(lead);
        }}
        onOpenAddFollowup={(leadId: string) => {
          handleOpenAddFollowup(leadId);
        }}
        onOpenAddDeal={(lead: CrmLead) => {
          handleOpenAddDeal(lead);
        }}
      />

      <AddFollowupModal
        leadId={followupLeadId}
        leads={leads}
        isOpen={isAddFollowupOpen}
        onClose={() => {
          setIsAddFollowupOpen(false);
          setFollowupLeadId(null);
        }}
        onSuccess={() => {
          setIsAddFollowupOpen(false);
          setFollowupLeadId(null);
          fetchCrmData(true);
        }}
      />

      <AddDealModal
        lead={dealLead}
        leads={leads}
        isOpen={isAddDealOpen}
        onClose={() => {
          setIsAddDealOpen(false);
          setDealLead(null);
        }}
        onSuccess={() => {
          setIsAddDealOpen(false);
          setDealLead(null);
          fetchCrmData(true);
        }}
      />

      <AddActivityModal
        leads={leads}
        isOpen={isAddActivityOpen}
        onClose={() => setIsAddActivityOpen(false)}
        onSuccess={() => {
          setIsAddActivityOpen(false);
          fetchCrmData(true);
        }}
      />

      <AddPropertyModal
        isOpen={isAddPropertyOpen}
        onClose={() => setIsAddPropertyOpen(false)}
        onSuccess={() => {
          setIsAddPropertyOpen(false);
        }}
      />

      <SharePropertyModal
        property={sharingProperty}
        leads={leads}
        isOpen={isSharePropertyOpen}
        onClose={() => {
          setIsSharePropertyOpen(false);
          setSharingProperty(null);
        }}
      />

      <ImportLeadsModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => {
          setIsImportOpen(false);
          fetchCrmData(true);
        }}
      />
    </div>
  );
}

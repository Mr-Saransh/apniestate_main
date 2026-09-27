import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  X,
  Mic,
  MicOff,
  Sparkles,
  AlertTriangle,
  Trash2,
  Camera,
  Image as ImageIcon,
  Check,
  Search,
  ArrowRight,
  Loader2,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  dprApi,
  type DPR,
  type SmartDprAnalysisResult,
  type SmartDprMaterialSuggestion,
  type DprConsumptionPayload,
} from '@/api/dpr';
import { apiClient } from '@/api/client';
import { milestonesApi, type Milestone } from '@/api/milestones';
import { PH, Card, Badge, SrchBar, Button } from '@/components/shared/FigmaComponents';
import AttachmentUploader from '@/components/shared/AttachmentUploader';

interface Project {
  id: string;
  name: string;
}

interface Site {
  id: string;
  name: string;
  project_id: string;
}

interface SiteInventoryItem {
  id: string;
  material_id: string;
  name: string;
  category?: string;
  unit: string;
  quantity: number;
}

interface SelectedMaterialConsumption {
  material_id: string;
  name: string;
  unit: string;
  available_quantity: number;
  quantity: number;
  source: 'explicit' | 'inferred' | 'manual';
  notes?: string;
}

export default function DprPage() {
  const [dprs, setDprs] = useState<DPR[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterSiteId, setFilterSiteId] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDpr, setSelectedDpr] = useState<DPR | null>(null);

  // Form states
  const [formSiteId, setFormSiteId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formSummary, setFormSummary] = useState('');
  const [formWeather, setFormWeather] = useState('Sunny');
  const [formTemperature, setFormTemperature] = useState('');
  const [formWorkCompleted, setFormWorkCompleted] = useState('');
  const [formWorkInProgress, setFormWorkInProgress] = useState('');
  const [formTomorrowPlan, setFormTomorrowPlan] = useState('');
  const [formCompletionPercentage, setFormCompletionPercentage] = useState('');
  const [formReasonsForDelay, setFormReasonsForDelay] = useState('');
  const [formSafety, setFormSafety] = useState('');
  const [formQuality, setFormQuality] = useState('');
  const [formRemarks, setFormRemarks] = useState('');
  const [formMilestoneId, setFormMilestoneId] = useState('');

  // Smart DPR Input states
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [smartInputText, setSmartInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<SmartDprAnalysisResult | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Voice Recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const userWantsListeningRef = useRef(false);
  const restartTimeoutRef = useRef<any>(null);

  // Site inventory & Consumptions
  const [siteInventory, setSiteInventory] = useState<SiteInventoryItem[]>([]);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [consumptions, setConsumptions] = useState<SelectedMaterialConsumption[]>([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [materialSearchQuery, setMaterialSearchQuery] = useState('');
  const [selectedInventoryToAdd, setSelectedInventoryToAdd] = useState<SiteInventoryItem | null>(null);
  const [manualAddQty, setManualAddQty] = useState('');

  // Optional Photos
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load Initial Data
  const loadData = async () => {
    try {
      const [projectsRes, sitesRes, dprsRes] = await Promise.all([
        apiClient.get<Project[]>('/projects'),
        apiClient.get<Site[]>('/sites'),
        dprApi.getAll({ project_id: filterProjectId, site_id: filterSiteId }),
      ]);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (sitesRes.data) {
        setSites(sitesRes.data);
        if (sitesRes.data.length > 0 && !formSiteId) {
          setFormSiteId(sitesRes.data[0].id);
        }
      }
      if (dprsRes.data) setDprs(dprsRes.data);
    } catch (err) {
      console.error('Failed to load DPR page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterProjectId, filterSiteId]);

  // Load site-specific inventory & project milestones whenever formSiteId changes
  useEffect(() => {
    if (!formSiteId) {
      setSiteInventory([]);
      setProjectMilestones([]);
      return;
    }

    const currentSite = sites.find((s) => s.id === formSiteId);
    const projectId = currentSite?.project_id;

    // Load site inventory
    dprApi
      .getSiteInventory(formSiteId)
      .then((res) => {
        if (res.data) {
          const mapped: SiteInventoryItem[] = res.data.map((item: any) => ({
            id: item.id,
            material_id: item.material_id,
            name: item.name || item.material?.name || 'Unknown',
            category: item.category || item.material?.category || 'General',
            unit: item.unit || item.material?.unit || 'units',
            quantity: item.quantity != null ? item.quantity : 0,
          }));
          setSiteInventory(mapped);
        }
      })
      .catch((err) => console.error('Failed to load site inventory', err));

    // Load project milestones
    if (projectId) {
      milestonesApi
        .getAll(projectId)
        .then((res) => {
          if (res.data) setProjectMilestones(res.data);
        })
        .catch((err) => console.error('Failed to load project milestones', err));
    }
  }, [formSiteId, sites]);

  // Web Speech API initialization
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLang;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setSmartInputText((prev) => {
            const trimmedPrev = prev.trim();
            if (!trimmedPrev) return transcript.trim();
            return `${trimmedPrev} ${transcript.trim()}`;
          });
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Normal silence timeout in Chrome/Edge, not a fatal error
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          userWantsListeningRef.current = false;
          setIsListening(false);
          setSpeechError('Microphone permission blocked. Please allow microphone access in your browser address bar.');
          return;
        }
        if (event.error === 'audio-capture') {
          userWantsListeningRef.current = false;
          setIsListening(false);
          setSpeechError('No microphone detected. Please check your mic connection.');
          return;
        }
        if (event.error === 'network') {
          userWantsListeningRef.current = false;
          setIsListening(false);
          setSpeechError('Voice recognition network timeout. Please check your internet connection.');
          return;
        }
        console.warn('Speech recognition notice:', event.error);
      };

      recognition.onend = () => {
        if (userWantsListeningRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (userWantsListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (_) {}
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Could not initialize SpeechRecognition:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [speechLang]);

  const toggleSpeechRecognition = async () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('Voice input is unavailable in this browser. Please use text input instead.');
      return;
    }

    if (isListening) {
      userWantsListeningRef.current = false;
      setIsListening(false);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    } else {
      setSpeechError(null);
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (permErr: any) {
          if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
            setSpeechError('Microphone permission blocked. Please allow microphone access in your browser address bar.');
            return;
          }
        }
      }

      try {
        userWantsListeningRef.current = true;
        setIsListening(true);
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (err: any) {
        if (err.name === 'InvalidStateError') {
          userWantsListeningRef.current = true;
          setIsListening(true);
        } else {
          userWantsListeningRef.current = false;
          setIsListening(false);
          setSpeechError('Could not start microphone. Please try clicking again.');
        }
      }
    }
  };

  // AI Understand / Analyze Update
  const handleUnderstandUpdate = async () => {
    if (!smartInputText.trim()) {
      setFormError('Please speak or type a site update first.');
      return;
    }
    if (!formSiteId) {
      setFormError('Please select a site first to anchor inventory.');
      return;
    }

    setFormError('');
    setIsAnalyzing(true);
    setAiNotice(null);

    try {
      const currentSite = sites.find((s) => s.id === formSiteId);
      const res = await dprApi.smartAnalyze({
        text: smartInputText.trim(),
        site_id: formSiteId,
        project_id: currentSite?.project_id,
      });

      if (res.data) {
        setAiSuggestions(res.data);

        if (res.data.is_fallback) {
          setAiNotice('AI service is temporarily busy. Applied intelligent local keyword matching.');
        } else {
          setAiNotice('AI successfully understood your update and matched site inventory!');
        }

        // Pre-fill form fields with AI suggestions
        if (res.data.summary) setFormSummary(res.data.summary);
        if (res.data.work_completed) setFormWorkCompleted(res.data.work_completed);
        if (res.data.work_in_progress) setFormWorkInProgress(res.data.work_in_progress);
        if (res.data.tomorrow_plan) setFormTomorrowPlan(res.data.tomorrow_plan);
        if (res.data.reasons_for_delay) setFormReasonsForDelay(res.data.reasons_for_delay);
        if (res.data.safety_observations) setFormSafety(res.data.safety_observations);
        if (res.data.quality_observations) setFormQuality(res.data.quality_observations);
        if (res.data.weather) setFormWeather(res.data.weather);
        if (res.data.temperature) setFormTemperature(String(res.data.temperature));

        // Milestone suggestion
        if (res.data.milestone_suggestion) {
          setFormMilestoneId(res.data.milestone_suggestion.milestone_id);
          setFormCompletionPercentage(String(res.data.milestone_suggestion.completion_percentage));
        }

        // Material suggestions
        if (res.data.material_suggestions?.length > 0) {
          const newConsumptions: SelectedMaterialConsumption[] = res.data.material_suggestions.map(
            (s) => ({
              material_id: s.material_id,
              name: s.material_name,
              unit: s.unit,
              available_quantity: s.available_quantity,
              quantity: s.suggested_quantity,
              source: s.source,
              notes: s.notes,
            })
          );
          setConsumptions(newConsumptions);
        }
      }
    } catch (err: any) {
      console.error('Smart DPR analyze failed:', err);
      setFormError(err.message || 'Failed to analyze report with AI. You can still fill it manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Stock Validation Helper
  const checkStockValidation = () => {
    // Total requested per material_id
    const totals: Record<string, { name: string; requested: number; available: number; unit: string }> = {};

    for (const c of consumptions) {
      if (!totals[c.material_id]) {
        totals[c.material_id] = {
          name: c.name,
          requested: 0,
          available: c.available_quantity,
          unit: c.unit,
        };
      }
      totals[c.material_id].requested += Number(c.quantity) || 0;
    }

    const invalidItems = Object.values(totals).filter((item) => item.requested > item.available);
    return invalidItems;
  };

  // Update consumption item quantity
  const handleUpdateConsumptionQty = (index: number, newQty: string) => {
    const parsed = parseFloat(newQty) || 0;
    setConsumptions((prev) =>
      prev.map((c, i) => (i === index ? { ...c, quantity: parsed } : c))
    );
  };

  // Remove consumption item
  const handleRemoveConsumption = (index: number) => {
    setConsumptions((prev) => prev.filter((_, i) => i !== index));
  };

  // Manual Add Material to Consumptions
  const handleAddManualMaterial = () => {
    if (!selectedInventoryToAdd || !manualAddQty) return;
    const qty = parseFloat(manualAddQty);
    if (qty <= 0) return;

    // Check if already in list
    const existingIndex = consumptions.findIndex(
      (c) => c.material_id === selectedInventoryToAdd.material_id
    );

    if (existingIndex >= 0) {
      setConsumptions((prev) =>
        prev.map((c, i) =>
          i === existingIndex
            ? { ...c, quantity: c.quantity + qty }
            : c
        )
      );
    } else {
      setConsumptions((prev) => [
        ...prev,
        {
          material_id: selectedInventoryToAdd.material_id,
          name: selectedInventoryToAdd.name,
          unit: selectedInventoryToAdd.unit,
          available_quantity: selectedInventoryToAdd.quantity,
          quantity: qty,
          source: 'manual',
        },
      ]);
    }

    setSelectedInventoryToAdd(null);
    setManualAddQty('');
    setMaterialSearchQuery('');
    setShowAddMaterialModal(false);
  };

  // Photo handlers (Optional Evidence)
  const handlePhotoCaptureOrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCapturedPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit / Approve DPR
  const handleSubmitDpr = async (targetStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED') => {
    if (!formSiteId) {
      setFormError('Please select a site.');
      return;
    }
    if (!formSummary.trim()) {
      setFormError('Executive summary of today’s progress is required.');
      return;
    }

    // Rule #8: Stock Validation before approval
    if (targetStatus === 'APPROVED') {
      const invalidStock = checkStockValidation();
      if (invalidStock.length > 0) {
        const item = invalidStock[0];
        setFormError(
          `Insufficient stock. Available: ${item.available} ${item.unit}, Requested: ${item.requested} ${item.unit}`
        );
        return;
      }
    }

    setFormError('');
    setSubmitting(true);

    try {
      const site = sites.find((s) => s.id === formSiteId);
      const payloadConsumptions: DprConsumptionPayload[] = consumptions.map((c) => ({
        material_id: c.material_id,
        quantity: c.quantity,
        unit: c.unit,
        name: c.name,
        notes: c.notes,
        source: c.source,
      }));

      const res = await dprApi.create({
        project_id: site?.project_id,
        site_id: formSiteId,
        date: formDate,
        summary: formSummary.trim(),
        weather: formWeather || null,
        temperature: formTemperature ? parseFloat(formTemperature) : null,
        work_completed: formWorkCompleted || null,
        work_in_progress: formWorkInProgress || null,
        tomorrow_plan: formTomorrowPlan || null,
        completion_percentage: formCompletionPercentage ? parseFloat(formCompletionPercentage) : null,
        milestone_id: formMilestoneId || null,
        reasons_for_delay: formReasonsForDelay || null,
        safety_observations: formSafety || null,
        quality_observations: formQuality || null,
        remarks: formRemarks || null,
        status: targetStatus,
        photos: capturedPhotos,
        consumptions: payloadConsumptions,
      });

      if (res.data) {
        setSelectedDpr(res.data);
        setShowCreateModal(false);
        resetForm();
        loadData();

        if (targetStatus === 'APPROVED') {
          alert('Smart DPR Approved! Site Inventory, BOQ, Milestone, and Project Intelligence updated.');
        } else {
          setShowDetailModal(true);
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit Daily Progress Report');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSmartInputText('');
    setAiSuggestions(null);
    setAiNotice(null);
    setFormSummary('');
    setFormWorkCompleted('');
    setFormWorkInProgress('');
    setFormTomorrowPlan('');
    setFormCompletionPercentage('');
    setFormMilestoneId('');
    setFormReasonsForDelay('');
    setFormSafety('');
    setFormQuality('');
    setFormRemarks('');
    setConsumptions([]);
    setCapturedPhotos([]);
    setFormError('');
  };

  // Status Change for existing DPR
  const handleStatusChange = async (dpr: DPR, newStatus: 'SUBMITTED' | 'APPROVED') => {
    try {
      const res = await dprApi.update(dpr.id, { status: newStatus });
      loadData();
      if (res.data && selectedDpr?.id === dpr.id) {
        setSelectedDpr(res.data);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  };

  const filteredDprs = dprs.filter(
    (d) =>
      d.summary?.toLowerCase().includes(search.toLowerCase()) ||
      d.work_completed?.toLowerCase().includes(search.toLowerCase())
  );

  const invalidStockItems = checkStockValidation();
  const hasInsufficientStock = invalidStockItems.length > 0;

  // Filtered Site Inventory for manual search
  const filteredSiteInventory = siteInventory.filter((item) =>
    item.name.toLowerCase().includes(materialSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PH title="Daily Progress Reports" sub="Report once, review, approve, and update everything" />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            icon={<Sparkles size={16} className="text-amber-500" />}
          >
            New Smart DPR
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SrchBar placeholder="Search DPRs by summary or work completed..." onChange={(e: any) => setSearch(e.target.value)} />
        </div>
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-white text-gray-700"
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-white text-gray-700"
          value={filterSiteId}
          onChange={(e) => setFilterSiteId(e.target.value)}
        >
          <option value="">All Sites</option>
          {sites
            .filter((s) => !filterProjectId || s.project_id === filterProjectId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>
      </Card>

      {/* Timeline View */}
      <div className="space-y-6">
        {filteredDprs.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Sparkles size={32} className="mx-auto text-primary/40 mb-3" />
            <h3 className="font-semibold text-gray-800 text-base">No Daily Progress Reports found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Click &quot;New Smart DPR&quot; to speak or type today’s update. AI structures work and inventory consumption automatically.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-100 ml-4 pl-6 space-y-6">
            {filteredDprs.map((dpr) => (
              <div key={dpr.id} className="relative">
                <div
                  className={`absolute -left-[35px] w-6 h-6 rounded-full flex items-center justify-center border-4 border-white ${
                    dpr.status === 'APPROVED'
                      ? 'bg-green-500'
                      : dpr.status === 'SUBMITTED'
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                >
                  <CheckCircle size={12} className="text-white" />
                </div>

                <Card
                  className="p-5 hover:shadow-md transition-shadow cursor-pointer border border-gray-100/80"
                  onClick={() => {
                    setSelectedDpr(dpr);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        {dpr.site?.name}
                        <span className="text-gray-400 font-normal text-xs">
                          {dpr.site?.project?.name}
                        </span>
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {new Date(dpr.report_date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <User size={12} /> {dpr.submitter?.name}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        dpr.status === 'APPROVED'
                          ? 'success'
                          : dpr.status === 'SUBMITTED'
                          ? 'info'
                          : 'secondary'
                      }
                    >
                      {dpr.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{dpr.summary}</p>

                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {dpr.completion_percentage != null && (
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${dpr.completion_percentage}%` }}
                          />
                        </div>
                        <span className="font-semibold text-gray-700">
                          {dpr.completion_percentage}% Progress
                        </span>
                      </div>
                    )}

                    {dpr.weather && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                        Weather: {dpr.weather}
                      </span>
                    )}

                    {dpr.materials_consumed && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded font-medium">
                        Materials Logged
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE SMART DPR MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden bg-white shadow-2xl rounded-2xl border-0">
            {/* Modal Top Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Smart Daily Progress Report</h2>
                  <p className="text-[11px] text-gray-500">Report once → Review suggestions → Approve & Update everything</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in shake duration-300">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {aiNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>{aiNotice}</span>
                </div>
              )}

              {/* 1. Project & Site Selection & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Site * <span className="text-[10px] text-gray-400 font-normal">(anchors site inventory)</span>
                  </label>
                  <select
                    required
                    value={formSiteId}
                    onChange={(e) => setFormSiteId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  >
                    <option value="">-- Choose Site --</option>
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({projects.find((p) => p.id === s.project_id)?.name || 'Project'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Report Date *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>
              </div>

              {/* 2. SMART FIELD INPUT (Voice & Text) */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-blue-50/40 to-slate-50 rounded-2xl border border-indigo-100/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      Smart Field Input
                    </span>
                  </div>

                  {/* Mode Toggle & Language */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg p-0.5 bg-white border border-gray-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setInputMode('voice')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          inputMode === 'voice'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Mic size={12} /> Voice
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMode('text')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                          inputMode === 'text'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        ✍ Text
                      </button>
                    </div>

                    {inputMode === 'voice' && speechSupported && (
                      <select
                        value={speechLang}
                        onChange={(e) => setSpeechLang(e.target.value as any)}
                        className="text-[11px] px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 outline-none"
                      >
                        <option value="en-IN">English (India)</option>
                        <option value="hi-IN">Hindi (हिन्दी)</option>
                      </select>
                    )}
                  </div>
                </div>

                {!speechSupported && inputMode === 'voice' && (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    Voice input unavailable in this browser. Use text instead.
                  </p>
                )}

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    rows={3}
                    value={smartInputText}
                    onChange={(e) => setSmartInputText(e.target.value)}
                    placeholder="Enter or speak today's update. Example: 'Today second floor brickwork was completed. We used around 80 cement bags. Weather was sunny.'"
                    className="w-full px-3.5 py-2.5 bg-white border border-indigo-200/80 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none resize-none shadow-inner"
                  />

                  {inputMode === 'voice' && speechSupported && (
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100 shadow-lg'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start speaking'}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-gray-500">
                    {isListening ? (
                      <span className="text-red-600 font-semibold flex items-center gap-1.5 animate-pulse">
                        ● Listening... Speak now ({speechLang === 'hi-IN' ? 'Hindi' : 'English'})
                      </span>
                    ) : (
                      'Tip: Mention activities, quantities (e.g. 80 cement bags), or milestones.'
                    )}
                  </span>

                  <button
                    type="button"
                    disabled={isAnalyzing || !smartInputText.trim()}
                    onClick={handleUnderstandUpdate}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Understanding...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} /> Understand Update
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. AI SUGGESTED UPDATES SECTION */}
              {aiSuggestions && (
                <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle size={14} className="text-emerald-600" />
                      AI Suggested Updates
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      Review & adjust below before approval
                    </span>
                  </div>

                  {/* Work Suggestion */}
                  {aiSuggestions.work_completed && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100">
                      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                        Work Executed
                      </p>
                      <p className="text-xs font-semibold text-gray-800 mt-0.5">
                        ✓ {aiSuggestions.work_completed}
                      </p>
                    </div>
                  )}

                  {/* Milestone Suggestion */}
                  {aiSuggestions.milestone_suggestion && (
                    <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                          Project Milestone
                        </p>
                        <p className="text-xs font-semibold text-gray-800 mt-0.5">
                          ✓ {aiSuggestions.milestone_suggestion.name}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                        Suggested: {aiSuggestions.milestone_suggestion.status} (
                        {aiSuggestions.milestone_suggestion.completion_percentage}%)
                      </span>
                    </div>
                  )}

                  {/* Material Suggestions */}
                  {aiSuggestions.material_suggestions?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                        Material Consumption Suggestions
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {aiSuggestions.material_suggestions.map((m, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-3 rounded-xl border border-emerald-100 flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="text-xs font-bold text-gray-900">{m.material_name}</span>
                                <p className="text-[11px] text-gray-500">
                                  Available in site stock: <span className="font-semibold text-gray-700">{m.available_quantity} {m.unit}</span>
                                </p>
                              </div>
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                AI Suggested
                              </span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                              <span className="text-gray-500">Quantity:</span>
                              <span className="font-extrabold text-indigo-700">
                                {m.suggested_quantity} {m.unit}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unmatched materials notice */}
                  {aiSuggestions.unmatched_materials?.length > 0 && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <AlertTriangle size={13} className="text-amber-600" />
                        Unmatched Material Notice:
                      </p>
                      {aiSuggestions.unmatched_materials.map((u, i) => (
                        <p key={i} className="text-[11px] text-amber-800 pl-4">
                          • &quot;{u.material_name}&quot;: {u.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 4. WORK DETAILS (Detailed Form Fields) */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1">
                  Report Details
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Executive Summary *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Concise overview of today’s progress..."
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Weather</label>
                    <input
                      type="text"
                      value={formWeather}
                      onChange={(e) => setFormWeather(e.target.value)}
                      placeholder="e.g. Sunny, Clear"
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Temperature (°C)
                    </label>
                    <input
                      type="number"
                      value={formTemperature}
                      onChange={(e) => setFormTemperature(e.target.value)}
                      placeholder="e.g. 32"
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Completion %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formCompletionPercentage}
                      onChange={(e) => setFormCompletionPercentage(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Milestone Linkage */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Link Project Milestone (Optional)
                  </label>
                  <select
                    value={formMilestoneId}
                    onChange={(e) => setFormMilestoneId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">-- No Milestone Linked --</option>
                    {projectMilestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Current: {m.status}, {m.progress_percentage || 0}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Work Completed</label>
                  <textarea
                    rows={2}
                    value={formWorkCompleted}
                    onChange={(e) => setFormWorkCompleted(e.target.value)}
                    placeholder="Work executed on site today..."
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Work In Progress
                    </label>
                    <textarea
                      rows={2}
                      value={formWorkInProgress}
                      onChange={(e) => setFormWorkInProgress(e.target.value)}
                      placeholder="Ongoing activities..."
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Tomorrow’s Plan (Pending Work)
                    </label>
                    <textarea
                      rows={2}
                      value={formTomorrowPlan}
                      onChange={(e) => setFormTomorrowPlan(e.target.value)}
                      placeholder="Planned work for tomorrow..."
                      className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Reasons for Delay (if any)
                  </label>
                  <textarea
                    rows={1}
                    value={formReasonsForDelay}
                    onChange={(e) => setFormReasonsForDelay(e.target.value)}
                    placeholder="Weather, labour shortage, or material bottleneck..."
                    className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* 5. MATERIAL CONSUMPTION (Site-Scoped & Real-Time Validated) */}
              <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <Layers size={14} className="text-primary" />
                      Material Consumption
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Sourced exclusively from selected site inventory
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMaterialSearchQuery('');
                      setSelectedInventoryToAdd(null);
                      setManualAddQty('');
                      setShowAddMaterialModal(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-300 hover:border-primary text-gray-700 hover:text-primary text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Material
                  </button>
                </div>

                {/* Insufficient Stock Warning */}
                {hasInsufficientStock && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1 animate-in shake">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle size={14} className="text-red-600" />
                      Insufficient Stock Warning:
                    </p>
                    {invalidStockItems.map((item, idx) => (
                      <p key={idx} className="pl-4 text-[11px]">
                        • {item.name}: Available {item.available} {item.unit}, Requested{' '}
                        <span className="font-bold underline">{item.requested} {item.unit}</span>. Please reduce quantity to approve.
                      </p>
                    ))}
                  </div>
                )}

                {/* Consumption items table */}
                {consumptions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    No materials queued for consumption. Click &quot;+ Add Material&quot; or speak your update.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {consumptions.map((c, idx) => {
                      const isOverStock = c.quantity > c.available_quantity;
                      return (
                        <div
                          key={idx}
                          className={`p-3 bg-white rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                            isOverStock ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-900">{c.name}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  c.source === 'manual'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {c.source === 'manual' ? 'Manual' : 'AI Suggested'}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Available site stock:{' '}
                              <span className="font-semibold text-gray-700">
                                {c.available_quantity} {c.unit}
                              </span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <label className="text-xs text-gray-500">Qty:</label>
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={c.quantity}
                                onChange={(e) => handleUpdateConsumptionQty(idx, e.target.value)}
                                className={`w-20 px-2 py-1 border rounded-lg text-xs font-bold text-center outline-none ${
                                  isOverStock
                                    ? 'border-red-400 bg-red-50 text-red-900'
                                    : 'border-gray-300 focus:border-primary'
                                }`}
                              />
                              <span className="text-xs text-gray-600 font-medium">{c.unit}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveConsumption(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 6. SITE EVIDENCE — OPTIONAL (Photos) */}
              <div className="p-4 bg-gray-50/60 border border-gray-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                      <Camera size={14} className="text-primary" />
                      Site Evidence — Optional
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Submit with zero, one, or multiple photos. Both options are optional.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Camera Capture Input */}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={cameraInputRef}
                      className="hidden"
                      onChange={handlePhotoCaptureOrUpload}
                    />
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-gray-300 hover:border-primary text-gray-700 hover:text-primary text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Camera size={14} /> Capture Photo
                    </button>

                    {/* Standard File Upload */}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handlePhotoCaptureOrUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-gray-300 hover:border-primary text-gray-700 hover:text-primary text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <ImageIcon size={14} /> Upload Photo
                    </button>
                  </div>
                </div>

                {/* Photo Previews */}
                {capturedPhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {capturedPhotos.map((photoUrl, idx) => (
                      <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-gray-200 shadow-xs">
                        <img src={photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors opacity-90 group-hover:opacity-100"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70">
              <span className="text-xs text-gray-500">
                Rule: AI understands → Human approves → Apni Estate records the truth.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitDpr('DRAFT')}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Save Draft
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitDpr('SUBMITTED')}
                  className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                >
                  Submit DPR
                </button>

                <button
                  type="button"
                  disabled={submitting || hasInsufficientStock}
                  onClick={() => handleSubmitDpr('APPROVED')}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition-all flex items-center gap-1.5"
                  title={hasInsufficientStock ? 'Cannot approve: Insufficient stock' : 'Approve and propagate to Inventory, BOQ & Milestones'}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} /> Approve & Update Everything
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ADD MATERIAL MODAL (Strictly Site-Scoped Inventory Search) */}
      {showAddMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <Card className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border-0">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Search size={16} className="text-primary" /> Select Site Material
              </h3>
              <button
                onClick={() => setShowAddMaterialModal(false)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Search Site Inventory:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={materialSearchQuery}
                    onChange={(e) => setMaterialSearchQuery(e.target.value)}
                    placeholder="Search materials available on this site..."
                    className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    autoFocus
                  />
                  <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>

              {/* Inventory Results List */}
              <div className="max-h-48 overflow-y-auto border rounded-xl divide-y divide-gray-100 bg-white">
                {filteredSiteInventory.length === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-400">
                    Material not available in this site&apos;s inventory.
                  </div>
                ) : (
                  filteredSiteInventory.map((item) => {
                    const isSelected = selectedInventoryToAdd?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedInventoryToAdd(item)}
                        className={`p-3 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[11px] text-gray-500">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-700">
                            {item.quantity} {item.unit}
                          </p>
                          <span className="text-[10px] text-gray-400">Available</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quantity Input when selected */}
              {selectedInventoryToAdd && (
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-800">
                      {selectedInventoryToAdd.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      Available: {selectedInventoryToAdd.quantity} {selectedInventoryToAdd.unit}
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Consumption Quantity ({selectedInventoryToAdd.unit}):
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={manualAddQty}
                      onChange={(e) => setManualAddQty(e.target.value)}
                      placeholder={`e.g. 80`}
                      className="w-full px-3 py-1.5 border rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t bg-gray-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMaterialModal(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedInventoryToAdd || !manualAddQty || parseFloat(manualAddQty) <= 0}
                onClick={handleAddManualMaterial}
                className="px-4 py-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-lg"
              >
                Use Material
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* DETAIL & MEDIA MODAL */}
      {showDetailModal && selectedDpr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden bg-white rounded-2xl shadow-2xl border-0">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  DPR: {selectedDpr.site?.name}
                  <Badge
                    variant={
                      selectedDpr.status === 'APPROVED'
                        ? 'success'
                        : selectedDpr.status === 'SUBMITTED'
                        ? 'info'
                        : 'secondary'
                    }
                  >
                    {selectedDpr.status}
                  </Badge>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {new Date(selectedDpr.report_date).toLocaleDateString()} by {selectedDpr.submitter?.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedDpr.status === 'DRAFT' && (
                  <Button
                    onClick={() => handleStatusChange(selectedDpr, 'SUBMITTED')}
                    variant="primary"
                    size="sm"
                  >
                    Submit Report
                  </Button>
                )}
                {selectedDpr.status === 'SUBMITTED' && (
                  <Button
                    onClick={() => handleStatusChange(selectedDpr, 'APPROVED')}
                    variant="success"
                    size="sm"
                  >
                    Approve
                  </Button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 custom-scrollbar">
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1 mb-2">
                    Executive Summary
                  </h4>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedDpr.summary}</p>
                </div>

                {selectedDpr.work_completed && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1 mb-2">
                      Work Completed
                    </h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedDpr.work_completed}</p>
                  </div>
                )}

                {selectedDpr.tomorrow_plan && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1 mb-2">
                      Tomorrow’s Plan
                    </h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{selectedDpr.tomorrow_plan}</p>
                  </div>
                )}

                {/* Material Consumptions Logged */}
                {selectedDpr.material_consumptions && selectedDpr.material_consumptions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1 mb-2">
                      Material Consumption (Committed to Inventory)
                    </h4>
                    <ul className="text-sm text-gray-700 space-y-1.5">
                      {selectedDpr.material_consumptions.map((m: any, i: number) => (
                        <li key={i} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="font-semibold text-gray-800">{m.material?.name}</span>
                          <span className="font-extrabold text-indigo-700">
                            {m.quantity} {m.material?.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Labour Auto Summary */}
                {selectedDpr.attendance_data && typeof selectedDpr.attendance_data === 'object' && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1 mb-2">
                      Labour Summary (Auto-Generated)
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 bg-blue-50 rounded-xl text-center">
                        <p className="text-[11px] text-blue-600 font-semibold">Present</p>
                        <p className="text-base font-bold text-blue-900">
                          {selectedDpr.attendance_data.workersPresent || 0}
                        </p>
                      </div>
                      <div className="p-2.5 bg-red-50 rounded-xl text-center">
                        <p className="text-[11px] text-red-600 font-semibold">Absent</p>
                        <p className="text-base font-bold text-red-900">
                          {selectedDpr.attendance_data.workersAbsent || 0}
                        </p>
                      </div>
                      <div className="p-2.5 bg-purple-50 rounded-xl text-center">
                        <p className="text-[11px] text-purple-600 font-semibold">Overtime</p>
                        <p className="text-base font-bold text-purple-900">
                          {selectedDpr.attendance_data.totalOvertime || 0} hrs
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Media & Attachments panel */}
              <div className="w-full md:w-80 bg-gray-50 p-4 rounded-2xl space-y-5 border border-gray-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b pb-1 mb-3">
                    Media & Attachments
                  </h4>

                  {/* Attached Photos in report */}
                  {Array.isArray(selectedDpr.photos) && selectedDpr.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {selectedDpr.photos.map((pUrl: string, idx: number) => (
                        <img
                          key={idx}
                          src={pUrl}
                          alt="DPR Evidence"
                          className="w-full h-24 object-cover rounded-xl border border-gray-200"
                        />
                      ))}
                    </div>
                  )}

                  <AttachmentUploader
                    entityType="DPR"
                    entityId={selectedDpr.id}
                    category="Progress Photo"
                    readOnly={selectedDpr.status === 'APPROVED'}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

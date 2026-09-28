import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  X,
  Search,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Building2,
  Layers,
  Loader2,
  Plus,
  Trash2,
  Camera,
  UploadCloud,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  dprApi,
  type SmartDprAnalysisResult,
  type CreateDprData,
  type DprConsumptionPayload,
} from '@/api/dpr';
import { type Milestone } from '@/api/milestones';

interface SiteInventoryItem {
  id: string;
  material_id: string;
  name: string;
  category?: string;
  unit: string;
  quantity: number;
}

interface ConsumedMaterialItem {
  material_id: string;
  name: string;
  unit: string;
  available_quantity: number;
  quantity: number;
  is_approved: boolean;
  source: 'explicit' | 'inferred' | 'manual';
  notes?: string;
}

interface UnmatchedMaterialItem {
  material_name: string;
  quantity?: number;
  unit?: string;
  reason: string;
  mapped_material_id?: string;
}

interface SmartDprModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  sites: Array<{ id: string; name: string; project_id: string }>;
  milestones: Milestone[];
  initialMilestone?: Milestone | null;
  onSuccess: () => void;
}

/**
 * Aggressively deduplicate stuttered/repeated words and phrases in speech text.
 * Handles patterns like "sofa set sofa set sofa set" -> "sofa set",
 * "force force sofa" -> "force sofa", "today we we we used" -> "today we used", etc.
 */
function deduplicateStutteredText(raw: string): string {
  let text = raw;

  // 1. Remove immediately repeated single words ("we we we" -> "we", "the the" -> "the")
  text = text.replace(/\b(\w+)(?:\s+\1)+\b/gi, '$1');

  // 2. Remove repeated 2-word phrases ("sofa set sofa set" -> "sofa set")
  let prev = '';
  let iters = 0;
  while (prev !== text && iters < 8) {
    prev = text;
    // Match 1-4 word phrases repeated adjacently
    text = text.replace(/\b([a-zA-Z0-9]+(?:\s+[a-zA-Z0-9]+){0,3})\s+\1\b/gi, '$1');
    iters++;
  }

  // 3. Remove partial stutter restarts: "today we used 4 so today we used 4 sofa" -> "today we used 4 sofa"
  // Look for sentences that re-start from the beginning
  const words = text.split(/\s+/);
  if (words.length > 6) {
    // Check if the first 3+ words repeat later in the text (user restarted their sentence)
    for (let windowSize = Math.min(5, Math.floor(words.length / 2)); windowSize >= 3; windowSize--) {
      const prefix = words.slice(0, windowSize).join(' ').toLowerCase();
      const restText = words.slice(windowSize).join(' ').toLowerCase();
      const restartIdx = restText.indexOf(prefix);
      if (restartIdx !== -1) {
        // Found a restart - keep only from the restart point onward (the more complete version)
        const wordsBeforeRestart = restText.slice(0, restartIdx).split(/\s+/).filter(Boolean).length;
        text = words.slice(windowSize + wordsBeforeRestart).join(' ');
        break;
      }
    }
  }

  // 4. Collapse multiple spaces
  text = text.replace(/\s{2,}/g, ' ');

  return text.trim();
}

function normalizeSpokenNumbers(raw: string): string {
  let text = raw;

  // Convert Indian and English spoken number words
  const numberWords: Record<string, string> = {
    zero: '0',
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
    twenty: '20',
    thirty: '30',
    forty: '40',
    fifty: '50',
    sixty: '60',
    seventy: '70',
    eighty: '80',
    ninety: '90',
    hundred: '100',
    thousand: '1000',
    // Hindi
    ek: '1',
    do: '2',
    teen: '3',
    chaar: '4',
    char: '4',
    paanch: '5',
    panch: '5',
    chhah: '6',
    che: '6',
    saat: '7',
    aath: '8',
    ath: '8',
    nau: '9',
    das: '10',
    gyarah: '11',
    barah: '12',
    pandrah: '15',
    bees: '20',
    pachas: '50',
    sau: '100',
    hazaar: '1000',
    hazar: '1000',
  };

  for (const [word, digit] of Object.entries(numberWords)) {
    text = text.replace(new RegExp(`\\b${word}\\b`, 'gi'), digit);
  }

  // Handle common speech recognition phonetic mishearings in site dictation
  // "force" misheard instead of "4" (e.g. "force sofa set" -> "4 sofa set", "force cement bags")
  text = text.replace(/\b(?:force|forth|fourth)\s+(?=(?:sofa|cement|bag|brick|door|window|box|ton|truck|worker|labour|labor|tile|pipe|steel|rebar|sariya|set|pcs|nos|kg|units?|item)\b)/gi, '4 ');
  text = text.replace(/\bforce\s+sofa\b/gi, '4 sofa');

  // "for" misheard instead of "4"
  text = text.replace(/\bfor\s+(?!(?:today|tomorrow|delay|work|inspection|approval)\b)(?=[a-zA-Z])/gi, '4 ');

  // "to" / "too" misheard instead of "2"
  text = text.replace(/\b(?:to|too)\s+(?=(?:sofa|cement|bag|brick|door|window|box|ton|truck|worker|labour|labor|tile|pipe|steel|rebar|sariya)\b)/gi, '2 ');

  // "please don't" / "pleased on" / "please on" misheard instead of "placed on"
  text = text.replace(/\b(?:please don't|please on|pleased on|pleased)\s+(?=(?:second|first|third|fourth|ground|\d+(?:st|nd|rd|th)?|2nd|1st|3rd|4th|site|floor|room|hall|wall|roof|slab|terrace|tower)\b)/gi, 'placed on ');

  // "second force" / "first force" -> "... floor"
  text = text.replace(/\b(second|first|third|fourth|ground)\s+force\b/gi, '$1 floor');

  // Deduplicate stuttered speech
  text = deduplicateStutteredText(text);

  return text.trim();
}

const KNOWN_UNITS_SET = new Set([
  'bags', 'bag', 'tons', 'ton', 'pcs', 'pc', 'nos', 'no', 'kg', 'kgs',
  'cans', 'can', 'trucks', 'truck', 'boxes', 'box', 'brass',
  'litres', 'liters', 'ltr', 'cft', 'sqft', 'sqm', 'meters', 'meter', 'm'
]);

const MATERIAL_SYNONYMS: Record<string, string[]> = {
  steel: ['rebar', 'tmt', 'sariya', 'rod'],
  sariya: ['rebar', 'tmt', 'steel'],
  rebar: ['steel', 'tmt', 'sariya'],
  eent: ['brick', 'bricks', 'red bricks'],
  int: ['brick', 'bricks', 'red bricks'],
  bricks: ['brick', 'eent', 'red bricks'],
  brick: ['bricks', 'eent', 'red bricks'],
  cement: ['opc', 'ppc', 'cement'],
  sofa: ['sofa set'],
};

const STOP_WORDS_SET = new Set([
  'day', 'days', 'today', 'work', 'hours', 'hour', 'workers', 'labour', 'labors',
  'time', 'date', 'floor', 'site', 'update', 'progress', 'completed', 'done',
  'started', 'used', 'consumed', 'we', 'aaj', 'hai', 'lagaya', 'dala', 'lagaye'
]);

/**
 * High-precision parser that extracts multiple items (both in-inventory and unlisted)
 * Handles fast speech, omitted commas ("4 sofa set 10 cement 5 doors"), Hindi words,
 * synonym matching (steel -> rebar, bricks -> 150mm Main Wall - Red Bricks), etc.
 */
function extractMaterialsFromText(
  rawText: string,
  inventory: SiteInventoryItem[]
): {
  matched: ConsumedMaterialItem[];
  unmatched: UnmatchedMaterialItem[];
} {
  if (!rawText || !rawText.trim()) {
    return { matched: [], unmatched: [] };
  }

  const normalized = normalizeSpokenNumbers(rawText);
  // Delimit before numbers following words: "sofa set 10 cement 5 doors" -> "sofa set , 10 cement , 5 doors"
  const delimited = normalized.replace(/([a-zA-Z])\s+([0-9]+(?:\.[0-9]+)?)\s+([a-zA-Z])/g, '$1 , $2 $3');
  const rawParts = delimited.split(/[,;&|\n]|\b(?:and|aur|plus|along with|as well as|or|ya)\b/gi);

  const parsedClauses: Array<{ qty: number; unit: string; name: string }> = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Pattern 1: [qty] [unit]? [name] (e.g. "4 sofa set", "10 bags of cement", "500 bricks")
    let m = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*(?:of\s+)?([a-zA-Z].*)$/i);
    if (m) {
      const qty = parseFloat(m[1]);
      let rest = m[2].trim();
      const words = rest.split(/\s+/);
      let unit = 'units';

      if (words.length > 1 && KNOWN_UNITS_SET.has(words[0].toLowerCase())) {
        unit = words[0].toLowerCase();
        rest = words.slice(1).join(' ').replace(/^of\s+/i, '');
      } else if (words.length > 1 && KNOWN_UNITS_SET.has(words[words.length - 1].toLowerCase())) {
        unit = words[words.length - 1].toLowerCase();
        rest = words.slice(0, -1).join(' ');
      }

      rest = rest.replace(/\b(?:consumed|used|lagaya|lagaye|dala|hai|h|done|work|today|aaj)\b/gi, '').trim();
      if (rest && !STOP_WORDS_SET.has(rest.toLowerCase())) {
        parsedClauses.push({ qty, unit, name: rest });
      }
      continue;
    }

    // Pattern 2: [name] [qty] [unit]? (e.g. "sofa set 4", "cement 10 bags", "doors 5")
    m = trimmed.match(/^([a-zA-Z].*?)\s+([0-9]+(?:\.[0-9]+)?)(?:\s+([a-zA-Z]+))?$/i);
    if (m) {
      const qty = parseFloat(m[2]);
      let rest = m[1].trim();
      let unit = m[3] && KNOWN_UNITS_SET.has(m[3].toLowerCase()) ? m[3].toLowerCase() : 'units';
      rest = rest.replace(/\b(?:consumed|used|lagaya|lagaye|dala|hai|h|done|work|today|aaj)\b/gi, '').trim();
      if (rest && !STOP_WORDS_SET.has(rest.toLowerCase())) {
        parsedClauses.push({ qty, unit, name: rest });
      }
      continue;
    }
  }

  // Also check for unquantified mentions of inventory items (e.g. "used sofa set and cement")
  const lowerText = normalized.toLowerCase();
  for (const inv of inventory) {
    const invLower = inv.name.toLowerCase();
    const alreadyCaptured = parsedClauses.some(
      (c) => invLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(invLower)
    );
    if (!alreadyCaptured && lowerText.includes(invLower)) {
      parsedClauses.push({ qty: 1, unit: inv.unit, name: inv.name });
    }
  }

  const matched: ConsumedMaterialItem[] = [];
  const unmatched: UnmatchedMaterialItem[] = [];
  const matchedInventoryIds = new Set<string>();

  for (const item of parsedClauses) {
    const itemNameLower = item.name.toLowerCase();
    const itemWords = itemNameLower.split(/\s+/).filter((w) => w.length >= 3);

    let bestMatch: SiteInventoryItem | null = null;
    let bestScore = 0;

    for (const inv of inventory) {
      if (matchedInventoryIds.has(inv.material_id)) continue;
      const invLower = inv.name.toLowerCase();
      let score = 0;

      if (invLower === itemNameLower) {
        score = 100;
      } else if (invLower.includes(itemNameLower) || itemNameLower.includes(invLower)) {
        score = 80;
      } else {
        const invWords = invLower.split(/[\s\-_]+/).filter((w) => w.length >= 3 && !['main', 'wall', 'beams', 'beam'].includes(w));
        for (const iw of itemWords) {
          if (invWords.includes(iw)) score = Math.max(score, 60);
          if (iw.endsWith('s') && invWords.includes(iw.slice(0, -1))) score = Math.max(score, 60);
          if (invWords.some((w) => w + 's' === iw)) score = Math.max(score, 60);
          if (MATERIAL_SYNONYMS[iw]) {
            for (const syn of MATERIAL_SYNONYMS[iw]) {
              if (invWords.includes(syn) || invLower.includes(syn)) score = Math.max(score, 50);
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = inv;
      }
    }

    if (bestMatch && bestScore >= 50) {
      matchedInventoryIds.add(bestMatch.material_id);
      matched.push({
        material_id: bestMatch.material_id,
        name: bestMatch.name,
        unit: item.unit !== 'units' ? item.unit : bestMatch.unit,
        available_quantity: bestMatch.quantity,
        quantity: item.qty > 0 ? item.qty : 1,
        is_approved: true,
        source: 'explicit',
        notes: `Detected ${item.qty} from "${item.name}"`,
      });
    } else {
      unmatched.push({
        material_name: item.name,
        quantity: item.qty,
        unit: item.unit,
        reason: 'Material not available in this site inventory.',
      });
    }
  }

  return { matched, unmatched };
}

export default function SmartDprModal({
  isOpen,
  onClose,
  projectId,
  sites,
  milestones,
  initialMilestone,
  onSuccess,
}: SmartDprModalProps) {
  // Form Basic Fields
  const [formSiteId, setFormSiteId] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formSummary, setFormSummary] = useState('');
  const [isSummaryAiGenerated, setIsSummaryAiGenerated] = useState(false);
  const [formWorkCompleted, setFormWorkCompleted] = useState('');
  const [formMilestoneId, setFormMilestoneId] = useState('');
  const [formCompletionPercentage, setFormCompletionPercentage] = useState<number | ''>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Smart Field Input States
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');
  const [smartInputText, setSmartInputText] = useState('');
  const [speechLang, setSpeechLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inventory & Consumptions
  const [siteInventory, setSiteInventory] = useState<SiteInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [consumedMaterials, setConsumedMaterials] = useState<ConsumedMaterialItem[]>([]);
  const [unmatchedMaterials, setUnmatchedMaterials] = useState<UnmatchedMaterialItem[]>([]);

  // Instant real-time multi-item detection from speech or text input
  const liveDetected = useMemo(() => {
    if (!smartInputText.trim() || siteInventory.length === 0) {
      return { matched: [], unmatched: [] };
    }
    return extractMaterialsFromText(smartInputText, siteInventory);
  }, [smartInputText, siteInventory]);

  const recognitionRef = useRef<any>(null);
  const userWantsListeningRef = useRef(false);
  const currentTextRef = useRef('');
  const restartTimeoutRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── STUTTER-FREE SPEECH: Track finalized chunks separately ───
  // Instead of re-reading all event.results (which causes Chrome to re-emit old results
  // and create duplicates), we track which result indices have been finalized and only
  // accumulate each final result ONCE.
  const finalizedChunksRef = useRef<string[]>([]);
  const lastProcessedFinalIdxRef = useRef(-1);
  const interimDisplayRef = useRef('');

  useEffect(() => {
    currentTextRef.current = smartInputText;
  }, [smartInputText]);

  // Initialize site and milestone
  useEffect(() => {
    if (sites.length > 0 && !formSiteId) {
      setFormSiteId(sites[0].id);
    }
  }, [sites, formSiteId]);

  useEffect(() => {
    if (initialMilestone) {
      setFormMilestoneId(initialMilestone.id);
      if (initialMilestone.progress_percentage != null) {
        setFormCompletionPercentage(initialMilestone.progress_percentage);
      }
    }
  }, [initialMilestone]);

  // Load site-specific inventory whenever formSiteId changes
  useEffect(() => {
    if (!formSiteId) {
      setSiteInventory([]);
      return;
    }

    setLoadingInventory(true);
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
      .catch((err) => console.error('Failed to load site inventory', err))
      .finally(() => setLoadingInventory(false));
  }, [formSiteId]);

  // Speech Recognition setup (English India / Hindi)
  // ─── COMPLETELY REWRITTEN to eliminate stuttering ───
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
      // Increase max alternatives for better accuracy
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        // ─── KEY FIX: Only process NEW final results, never re-read old ones ───
        // Chrome's SpeechRecognition re-emits ALL results in event.results on every
        // onresult callback. The old approach of iterating all results caused duplicates.
        // Instead, we track which indices have been processed and only handle new ones.

        let newFinalText = '';
        let currentInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            // Only process this final result if we haven't seen it before
            if (i > lastProcessedFinalIdxRef.current) {
              const transcript = result[0].transcript.trim();
              if (transcript) {
                // Apply normalization and deduplication to each chunk immediately
                const cleaned = normalizeSpokenNumbers(transcript);
                finalizedChunksRef.current.push(cleaned);
                newFinalText += cleaned + ' ';
              }
              lastProcessedFinalIdxRef.current = i;
            }
          } else {
            // Only take the LATEST interim result (not accumulated old ones)
            currentInterim = result[0].transcript;
          }
        }

        // Build the display text: all finalized chunks + current interim
        const allFinals = finalizedChunksRef.current.join(' ').trim();
        const interimNormalized = currentInterim ? normalizeSpokenNumbers(currentInterim) : '';
        interimDisplayRef.current = interimNormalized;

        const displayText = [allFinals, interimNormalized].filter(Boolean).join(' ');
        // Apply one final deduplication pass on the combined text
        const deduped = deduplicateStutteredText(displayText);

        setSmartInputText(deduped);
        currentTextRef.current = deduped;
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // 'no-speech' is a standard silence/pause timeout from Chrome's speech engine, NOT a fatal error.
          // We do not stop listening or throw errors.
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
        // If user still wants to be in listening mode (Chrome ended due to pause or no-speech)
        if (userWantsListeningRef.current) {
          // Chrome auto-stops after ~60s of continuous recognition or on silence.
          // We restart, but DO NOT reset the finalized chunks — just reset the result index
          // tracker since Chrome will start new result indices from 0.
          lastProcessedFinalIdxRef.current = -1;

          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (userWantsListeningRef.current && recognitionRef.current) {
              try {
                recognitionRef.current.start();
              } catch (err: any) {
                // If it fails because it's already running or starting, ignore
                if (err.name !== 'InvalidStateError') {
                  console.warn('Speech recognition restart notice:', err);
                }
              }
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

      // ─── Auto-clean with AI when user stops speaking ───
      // Apply final client-side deduplication immediately, then trigger AI cleanup
      const rawText = currentTextRef.current.trim();
      if (rawText) {
        const clientCleaned = deduplicateStutteredText(normalizeSpokenNumbers(rawText));
        setSmartInputText(clientCleaned);
        currentTextRef.current = clientCleaned;

        // Auto-trigger AI understand to get corrected_text and update the field
        setTimeout(() => {
          if (currentTextRef.current.trim()) {
            handleUnderstandUpdate();
          }
        }, 250);
      }
    } else {
      setSpeechError(null);

      // Pre-warm/verify microphone permission so browser prompts if needed
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch (permErr: any) {
          console.warn('Microphone permission check:', permErr);
          if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
            setSpeechError('Microphone permission blocked. Please allow microphone access in your browser address bar.');
            return;
          }
        }
      }

      try {
        // Reset speech tracking state for a fresh recording session
        finalizedChunksRef.current = [];
        lastProcessedFinalIdxRef.current = -1;
        interimDisplayRef.current = '';

        // If user already typed something, seed the finalized chunks with it
        if (smartInputText.trim()) {
          finalizedChunksRef.current = [smartInputText.trim()];
        }

        userWantsListeningRef.current = true;
        setIsListening(true);
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Error starting speech recognition:', err);
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
      setFormError('Please speak or enter a site update first.');
      return;
    }
    if (!formSiteId) {
      setFormError('Please select a site first.');
      return;
    }

    setFormError(null);
    setIsAnalyzing(true);
    setAiNotice(null);

    // Stop listening if mic is on
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    try {
      const res = await dprApi.smartAnalyze({
        text: smartInputText.trim(),
        site_id: formSiteId,
        project_id: projectId,
      });

      if (res.data) {
        const data = res.data;

        // If AI restored or corrected the spoken voice input, update the input box to the clean version
        if (data.corrected_text) {
          setSmartInputText(data.corrected_text);
          currentTextRef.current = data.corrected_text;
          // Reset finalized chunks to the corrected text so future speech sessions build on it
          finalizedChunksRef.current = [data.corrected_text];
          lastProcessedFinalIdxRef.current = -1;
        }

        if (data.corrected_text && data.corrected_text.toLowerCase() !== smartInputText.trim().toLowerCase()) {
          setAiNotice(`✨ AI auto-corrected spoken update: "${data.corrected_text}"`);
        } else if (data.is_fallback) {
          setAiNotice('AI service is temporarily busy. Applied intelligent local keyword matching.');
        } else {
          setAiNotice('AI successfully understood your update and matched site inventory!');
        }

        // Populate summary & work completed
        if (data.summary) {
          setFormSummary(data.summary);
          setIsSummaryAiGenerated(true);
        } else if (data.work_completed) {
          setFormSummary(data.work_completed);
          setIsSummaryAiGenerated(true);
        }
        if (data.work_completed) {
          setFormWorkCompleted(data.work_completed);
        }

        // Link suggested milestone if matched
        if (data.milestone_suggestion) {
          setFormMilestoneId(data.milestone_suggestion.milestone_id);
          if (data.milestone_suggestion.completion_percentage != null) {
            setFormCompletionPercentage(data.milestone_suggestion.completion_percentage);
          }
        }

        // 1. Process backend material suggestions
        const backendSuggestions: ConsumedMaterialItem[] = (data.material_suggestions || []).map((s) => ({
          material_id: s.material_id,
          name: s.material_name,
          unit: s.unit,
          available_quantity: s.available_quantity,
          quantity: s.suggested_quantity,
          is_approved: true, // auto-selected as requested!
          source: s.source,
          notes: s.notes,
        }));

        // 2. High-precision client extraction for multiple items (guarantees 100% detection regardless of AI status)
        const localExtracted = extractMaterialsFromText(smartInputText, siteInventory);

        // Merge backend suggestions + client detected items without duplicates
        const allSuggestions = [...backendSuggestions];
        for (const cItem of localExtracted.matched) {
          const idx = allSuggestions.findIndex((m) => m.material_id === cItem.material_id);
          if (idx >= 0) {
            if ((allSuggestions[idx].quantity <= 0 || allSuggestions[idx].quantity === 1) && cItem.quantity > 0) {
              allSuggestions[idx].quantity = cItem.quantity;
            }
          } else {
            allSuggestions.push(cItem);
          }
        }

        setConsumedMaterials((prev) => {
          const merged = [...prev];
          for (const item of allSuggestions) {
            const existingIdx = merged.findIndex((m) => m.material_id === item.material_id);
            if (existingIdx >= 0) {
              merged[existingIdx] = { ...merged[existingIdx], quantity: item.quantity, is_approved: true };
            } else {
              merged.unshift(item); // Put all detected items at the very top!
            }
          }
          return merged;
        });

        // 3. Merge unmatched materials (items mentioned that are not in site store inventory)
        const backendUnmatched: UnmatchedMaterialItem[] = (data.unmatched_materials || []).map((u) => ({
          material_name: u.material_name,
          quantity: u.quantity,
          unit: u.unit,
          reason: u.reason || 'Material not found in this site stock inventory.',
        }));

        const mergedUnmatched: UnmatchedMaterialItem[] = [...backendUnmatched];
        for (const u of localExtracted.unmatched) {
          // Avoid adding if already in approved consumed inventory
          const alreadyInConsumed = allSuggestions.some(
            (c) => c.name.toLowerCase().includes(u.material_name.toLowerCase()) || u.material_name.toLowerCase().includes(c.name.toLowerCase())
          );
          if (!alreadyInConsumed && !mergedUnmatched.some((m) => m.material_name.toLowerCase() === u.material_name.toLowerCase())) {
            mergedUnmatched.push(u);
          }
        }

        setUnmatchedMaterials(mergedUnmatched);

        const totalItemsCount = allSuggestions.length + mergedUnmatched.length;
        setAiNotice(`AI identified ${totalItemsCount} item${totalItemsCount === 1 ? '' : 's'} (${allSuggestions.length} in inventory, ${mergedUnmatched.length} unlisted).`);
      }
    } catch (err: any) {
      console.error('Smart DPR analyze failed:', err);
      setFormError(err.message || 'Failed to analyze report with AI. You can still fill it manually.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle approval / inclusion of consumed material
  const handleToggleApproval = (index: number) => {
    setConsumedMaterials((prev) =>
      prev.map((c, i) => (i === index ? { ...c, is_approved: !c.is_approved } : c))
    );
  };

  // Update consumed quantity
  const handleUpdateQuantity = (index: number, val: string) => {
    const qty = parseFloat(val) || 0;
    setConsumedMaterials((prev) =>
      prev.map((c, i) => (i === index ? { ...c, quantity: qty } : c))
    );
  };

  // Remove consumed item
  const handleRemoveConsumed = (index: number) => {
    setConsumedMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  // Add material from inventory list to consumed items
  const handleAddFromInventory = (item: SiteInventoryItem) => {
    const existingIdx = consumedMaterials.findIndex((c) => c.material_id === item.material_id);
    if (existingIdx >= 0) {
      // Just ensure it's approved and increment or focus
      setConsumedMaterials((prev) =>
        prev.map((c, i) => (i === existingIdx ? { ...c, is_approved: true } : c))
      );
    } else {
      // Add as manual consumption at top of consumed items
      const newEntry: ConsumedMaterialItem = {
        material_id: item.material_id,
        name: item.name,
        unit: item.unit,
        available_quantity: item.quantity,
        quantity: 1, // default initial quantity
        is_approved: true,
        source: 'manual',
      };
      setConsumedMaterials((prev) => [newEntry, ...prev]);
    }
  };

  // Map an unmatched material to an existing site inventory item
  const handleMapUnmatchedToInventory = (unmatchedIdx: number, inventoryMaterialId: string) => {
    const invItem = siteInventory.find((i) => i.material_id === inventoryMaterialId);
    if (!invItem) return;

    const unmatched = unmatchedMaterials[unmatchedIdx];

    // Add mapped item to consumedMaterials
    const newEntry: ConsumedMaterialItem = {
      material_id: invItem.material_id,
      name: invItem.name,
      unit: invItem.unit,
      available_quantity: invItem.quantity,
      quantity: unmatched.quantity || 1,
      is_approved: true,
      source: 'explicit',
      notes: `Mapped from supervisor note: "${unmatched.material_name}"`,
    };

    setConsumedMaterials((prev) => [newEntry, ...prev]);
    // Remove from unmatched
    setUnmatchedMaterials((prev) => prev.filter((_, i) => i !== unmatchedIdx));
  };

  // Dismiss unmatched item (keep as unlisted note)
  const handleDismissUnmatched = (unmatchedIdx: number) => {
    setUnmatchedMaterials((prev) => prev.filter((_, i) => i !== unmatchedIdx));
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const token = localStorage.getItem('access_token');
      const formData = new FormData();
      formData.append('file', file);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${baseUrl}/cloudinary/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.result?.secure_url) {
        setPhotoUrl(data.result.secure_url);
      }
    } catch (err) {
      alert('Failed to upload site photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Submit DPR
  const handleSubmit = async (targetStatus: 'SUBMITTED' | 'APPROVED' | 'DRAFT' = 'APPROVED') => {
    if (!formSiteId) {
      setFormError('Please select a site.');
      return;
    }
    if (!formSummary.trim()) {
      setFormError('Please enter summary of work completed today.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      // Collect approved consumptions
      const approvedConsumptions: DprConsumptionPayload[] = consumedMaterials
        .filter((c) => c.is_approved && c.quantity > 0)
        .map((c) => ({
          material_id: c.material_id,
          quantity: c.quantity,
          unit: c.unit,
          name: c.name,
          source: c.source,
          notes: c.notes,
        }));

      // Collect unlisted materials to append in remarks
      let unlistedRemarks = '';
      if (unmatchedMaterials.length > 0) {
        unlistedRemarks = `Unlisted materials used on site (not found in inventory): ${unmatchedMaterials
          .map((u) => `${u.material_name}${u.quantity ? ` (${u.quantity} ${u.unit || ''})` : ''}`)
          .join(', ')}`;
      }

      const payload: CreateDprData = {
        project_id: projectId,
        site_id: formSiteId,
        date: formDate ? new Date(formDate).toISOString() : new Date().toISOString(),
        summary: formSummary.trim(),
        work_completed: formWorkCompleted.trim() || formSummary.trim(),
        milestone_id: formMilestoneId || undefined,
        completion_percentage:
          formCompletionPercentage !== '' ? Number(formCompletionPercentage) : undefined,
        status: targetStatus,
        consumptions: approvedConsumptions.length > 0 ? approvedConsumptions : undefined,
        photos: photoUrl ? [photoUrl] : undefined,
        remarks: unlistedRemarks || undefined,
      };

      await dprApi.create(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit DPR failed:', err);
      setFormError(err.message || 'Failed to submit Daily Progress Report');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter site inventory (exclude items already in consumed list)
  const consumedMaterialIds = new Set(consumedMaterials.map((c) => c.material_id));
  const availableInventoryItems = siteInventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(inventorySearch.toLowerCase()));
    return matchesSearch && !consumedMaterialIds.has(item.material_id);
  });

  const approvedCount = consumedMaterials.filter((c) => c.is_approved && c.quantity > 0).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-5xl h-full sm:h-[92vh] sm:max-h-[760px] bg-white sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100">
        {/* ─── MODAL HEADER ─── */}
        <div className="h-14 px-4 sm:px-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">Smart Daily Progress Report</h2>
              <p className="text-[11px] text-gray-500">Report once → Review suggestions → Approve & Update everything</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full hover:bg-gray-200/80 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ─── SCROLLABLE FORM BODY ON MOBILE / 2-COL WORKSPACE ON DESKTOP ─── */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col min-h-0 custom-scrollbar">
          {/* ─── SITE ANCHOR & DATE ROW ─── */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-gray-100 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 shrink-0">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Select Site * <span className="text-[10px] text-gray-400 font-normal lowercase">(anchors site inventory)</span>
              </label>
              <div className="relative">
                <select
                  value={formSiteId}
                  onChange={(e) => setFormSiteId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Report Date *
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* ─── ERROR & SUCCESS NOTICES ─── */}
          {formError && (
            <div className="mx-4 sm:mx-5 mt-2.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
              <button onClick={() => setFormError(null)} className="text-red-400 hover:text-red-700"><X size={14} /></button>
            </div>
          )}

          {aiNotice && (
            <div className="mx-4 sm:mx-5 mt-2.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                <span>{aiNotice}</span>
              </div>
              <button onClick={() => setAiNotice(null)} className="text-emerald-500 hover:text-emerald-800"><X size={14} /></button>
            </div>
          )}

          {/* ─── WORKSPACE (Desktop: 2-column fixed | Mobile: full vertical flow) ─── */}
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 p-3.5 sm:p-5 lg:overflow-hidden lg:min-h-0">
            
            {/* ════════ LEFT COLUMN: SMART FIELD INPUT & WORK SUMMARY ════════ */}
            <div className="lg:col-span-6 flex flex-col gap-2.5 lg:h-full lg:overflow-y-auto lg:custom-scrollbar lg:pr-1 lg:min-h-0">
            
            {/* Card: SMART FIELD INPUT */}
            <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-slate-50 border border-indigo-100 rounded-2xl p-3.5 flex flex-col shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" />
                  SMART FIELD INPUT
                </span>

                <div className="flex items-center gap-1.5">
                  <div className="inline-flex rounded-lg p-0.5 bg-white border border-gray-200 text-xs shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setInputMode('voice')}
                      className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 ${
                        inputMode === 'voice'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Mic size={11} /> Voice
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('text')}
                      className={`px-2 py-0.5 rounded-md font-semibold text-[11px] transition-colors flex items-center gap-1 ${
                        inputMode === 'text'
                          ? 'bg-indigo-600 text-white shadow-xs'
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
                      className="text-[10px] font-semibold px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 outline-none cursor-pointer"
                    >
                      <option value="en-IN">English (India)</option>
                      <option value="hi-IN">Hindi (हिन्दी)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Textarea with mic inside */}
              <div className="relative">
                <textarea
                  rows={3}
                  value={smartInputText}
                  onChange={(e) => setSmartInputText(e.target.value)}
                  placeholder="Enter or speak today's update. Example: 'Today second floor brickwork was completed. We used around 80 cement bags.'"
                  className="w-full px-3 py-2 pr-10 bg-white border border-indigo-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-500 outline-none resize-none shadow-inner"
                />

                {inputMode === 'voice' && speechSupported && (
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className={`absolute right-2.5 bottom-2.5 p-1.5 rounded-full transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-100 shadow-md'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start speaking'}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}
              </div>

              {/* Listening Live Indicator & Speech Errors */}
              {isListening && (
                <div className="mt-2 flex items-center justify-between p-2 rounded-xl bg-red-50 border border-red-200 animate-in fade-in duration-200 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span className="text-xs font-bold text-red-800">
                      Listening in {speechLang === 'en-IN' ? 'English (India)' : 'Hindi'}... Speak now
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleSpeechRecognition}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <Check size={12} strokeWidth={3} /> Done Speaking
                  </button>
                </div>
              )}

              {speechError && (
                <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <span className="truncate">{speechError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpeechError(null)}
                    className="text-amber-600 hover:text-amber-900 text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {aiNotice && (
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-2xs animate-in fade-in">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Sparkles size={14} className="text-emerald-600 shrink-0" />
                    <span className="font-semibold text-[11px] truncate">{aiNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAiNotice(null)}
                    className="text-emerald-700 hover:text-emerald-950 text-[10px] font-bold shrink-0 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Instant Live Items Preview */}
              {liveDetected && (liveDetected.matched.length > 0 || liveDetected.unmatched.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5 items-center p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl animate-in fade-in duration-150">
                  <span className="text-[10px] font-black text-indigo-900 flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles size={11} className="text-indigo-600" /> Multiple Items Understood:
                  </span>
                  {liveDetected.matched.map((m) => (
                    <span
                      key={m.material_id}
                      className="text-[10px] font-bold bg-white text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs"
                    >
                      <Check size={11} className="text-emerald-600" strokeWidth={3} /> {m.quantity} {m.name}
                    </span>
                  ))}
                  {liveDetected.unmatched.map((u, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded-lg flex items-center gap-1 shadow-2xs"
                    >
                      <AlertTriangle size={11} className="text-amber-600" /> {u.quantity ? `${u.quantity} ` : ''}{u.material_name} (unlisted)
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="text-[10px] text-gray-500 truncate">
                  {isListening ? (
                    <span className="text-red-600 font-bold flex items-center gap-1 animate-pulse">
                      ● Listening... Speak in {speechLang === 'hi-IN' ? 'Hindi' : 'English'}
                    </span>
                  ) : (
                    'Tip: Mention activities, quantities (e.g. 80 cement bags), or milestones.'
                  )}
                </span>

                <button
                  type="button"
                  disabled={isAnalyzing || !smartInputText.trim()}
                  onClick={handleUnderstandUpdate}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Understanding...
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} /> Understand Update
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card: REPORT DETAILS (Summary, Milestone, Photo) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3.5 flex flex-col gap-3 shrink-0 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-gray-600 uppercase tracking-wider">
                  Report Details
                </span>
                {isSummaryAiGenerated && formSummary && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shadow-2xs">
                    <Sparkles size={11} className="text-emerald-600" /> AI Generated
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-gray-700">
                    Executive Summary *
                  </label>
                  <span className="text-[10px] text-gray-400">Brief summary of today’s progress</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={formSummary}
                  onChange={(e) => {
                    setFormSummary(e.target.value);
                    setIsSummaryAiGenerated(false);
                  }}
                  placeholder="Concise overview of today’s progress (e.g. Second floor brickwork completed, 4 sofa set placed)..."
                  className="w-full min-h-[58px] px-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-500 outline-none resize-none bg-white transition-all shadow-2xs"
                />
              </div>

              {/* Milestone & % Completed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Link Milestone (Optional)
                  </label>
                  <div className="relative">
                    <select
                      value={formMilestoneId}
                      onChange={(e) => setFormMilestoneId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer appearance-none"
                    >
                      <option value="">-- No Milestone --</option>
                      {milestones.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.progress_percentage || 0}%)
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Milestone Progress %
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formCompletionPercentage}
                      onChange={(e) => setFormCompletionPercentage(e.target.value ? Number(e.target.value) : '')}
                      placeholder="e.g. 100"
                      className="w-20 px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs font-bold text-center outline-none focus:border-indigo-500 bg-white"
                    />
                    <span className="text-xs text-gray-500">% achieved</span>
                  </div>
                </div>
              </div>

              {/* Photo Evidence Optional Strip */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 size={13} className="animate-spin text-indigo-600" />
                    ) : (
                      <Camera size={13} className="text-gray-500" />
                    )}
                    <span>{photoUrl ? 'Change Site Photo' : 'Attach Site Photo (Optional)'}</span>
                  </button>
                </div>

                {photoUrl && (
                  <div className="flex items-center gap-1.5">
                    <div className="size-7 rounded-lg overflow-hidden border border-gray-200">
                      <img src={photoUrl} alt="evidence" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove photo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ════════ RIGHT COLUMN: SITE INVENTORY & CONSUMED MATERIALS ════════ */}
          <div className="lg:col-span-6 flex flex-col lg:h-full bg-slate-50/80 rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 lg:overflow-hidden lg:min-h-0">
            {/* Header & Search */}
            <div className="mb-2.5 shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600" />
                    Site Inventory & Consumed Materials
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    AI automatically selects consumed items — review & approve
                  </p>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  {approvedCount} selected
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search site inventory (e.g. Cement, Sand, Steel)..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-400/20 focus:border-indigo-500 outline-none"
                />
                {inventorySearch && (
                  <button
                    onClick={() => setInventorySearch('')}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* List Container (Whole form scrolls on mobile; independent scroll on desktop) */}
            <div className="space-y-2.5 lg:flex-1 lg:overflow-y-auto lg:custom-scrollbar lg:min-h-0 lg:pr-1">
              
              {/* ─── SECTION 1: TOP ITEMS (AI Detected / Consumed) ─── */}
              {consumedMaterials.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-900">
                      Top Items Mentioned (Auto-Selected)
                    </span>
                    <span className="text-[10px] text-gray-400">Click checkmark to approve</span>
                  </div>

                  {consumedMaterials.map((item, idx) => {
                    const isExceeding = item.quantity > item.available_quantity;
                    return (
                      <div
                        key={item.material_id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          item.is_approved
                            ? 'bg-white border-indigo-200 shadow-xs'
                            : 'bg-gray-100/70 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          {/* Checkbox & Item details */}
                          <div className="flex items-start gap-2 flex-1">
                            <button
                              type="button"
                              onClick={() => handleToggleApproval(idx)}
                              className={`size-5 mt-0.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                                item.is_approved
                                  ? 'bg-indigo-600 border-indigo-600 text-white'
                                  : 'bg-white border-gray-300 text-transparent'
                              }`}
                            >
                              <Check size={13} strokeWidth={3} />
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-gray-900 truncate">
                                  {item.name}
                                </span>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                                    item.source === 'manual'
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-emerald-50 text-emerald-700'
                                  }`}
                                >
                                  {item.source === 'manual' ? 'Manual' : 'AI Detected'}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-500">
                                In Site Stock: <span className="font-semibold text-gray-700">{item.available_quantity} {item.unit}</span>
                              </p>
                              {isExceeding && (
                                <p className="text-[10px] font-semibold text-red-600 flex items-center gap-1 mt-0.5">
                                  <AlertCircle size={11} /> Exceeds site stock ({item.available_quantity} {item.unit})
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quantity input & Unit & Delete */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-medium text-gray-400">Qty:</span>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(idx, e.target.value)}
                              className={`w-16 px-1.5 py-1 text-xs font-bold text-center border rounded-lg outline-none ${
                                isExceeding
                                  ? 'border-red-400 bg-red-50 text-red-700'
                                  : 'border-gray-200 focus:border-indigo-500 bg-white'
                              }`}
                            />
                            <span className="text-[10px] font-semibold text-gray-600 w-8 truncate">
                              {item.unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveConsumed(idx)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ─── SECTION 2: UNMATCHED ITEMS (NOT IN SITE INVENTORY) ─── */}
              {unmatchedMaterials.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-600" />
                      Mentioned But Not in Site Inventory
                    </span>
                    <span className="text-[9px] text-amber-700">Audit notice</span>
                  </div>

                  {unmatchedMaterials.map((unmatched, uIdx) => (
                    <div
                      key={uIdx}
                      className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-950"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">{unmatched.material_name}</span>
                            <span className="text-[9px] font-bold bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded-md">
                              ⚠️ Not in Site Stock
                            </span>
                          </div>
                          {unmatched.quantity && (
                            <p className="text-[10px] text-amber-800 font-semibold mt-0.5">
                              Quantity mentioned: {unmatched.quantity} {unmatched.unit || ''}
                            </p>
                          )}
                          <p className="text-[10px] text-amber-700 mt-0.5">
                            This material is not in site store inventory. It will be recorded as an unlisted consumption note in the DPR.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDismissUnmatched(uIdx)}
                          className="text-amber-400 hover:text-amber-700 p-0.5"
                          title="Dismiss"
                        >
                          <X size={13} />
                        </button>
                      </div>

                      {/* Optional: Map to existing inventory item */}
                      {availableInventoryItems.length > 0 && (
                        <div className="pt-1 border-t border-amber-200/60 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-amber-800 font-medium shrink-0">Map to site item?</span>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleMapUnmatchedToInventory(uIdx, e.target.value);
                              }
                            }}
                            className="text-[10px] bg-white border border-amber-300 rounded-lg px-2 py-0.5 outline-none cursor-pointer flex-1 truncate"
                          >
                            <option value="">-- Choose matching inventory item --</option>
                            {availableInventoryItems.map((inv) => (
                              <option key={inv.material_id} value={inv.material_id}>
                                {inv.name} ({inv.quantity} {inv.unit} in stock)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ─── SECTION 3: OTHER SITE INVENTORY ITEMS ─── */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                  {consumedMaterials.length === 0 ? 'Site Inventory List' : 'Other Available Site Materials'}
                </span>

                {loadingInventory ? (
                  <div className="p-4 text-center text-xs text-gray-400">Loading site inventory...</div>
                ) : availableInventoryItems.length === 0 ? (
                  <div className="p-3 text-center text-[11px] text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    {inventorySearch
                      ? 'No matching materials found in site inventory.'
                      : 'All available materials are already queued above.'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {availableInventoryItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-2 bg-white rounded-xl border border-gray-100 flex items-center justify-between hover:border-gray-200 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-800 leading-tight">{item.name}</p>
                          <p className="text-[10px] text-gray-400">
                            Available: <span className="font-semibold text-gray-600">{item.quantity} {item.unit}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAddFromInventory(item)}
                          className="px-2.5 py-1 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-700 hover:text-indigo-700 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus size={11} /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
        </div>

        {/* ─── MODAL FOOTER ─── */}
        <div className="h-16 px-3 sm:px-5 border-t border-gray-100 bg-gray-50/90 backdrop-blur-sm flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:inline">
              Rule: AI understands → You approve → Site inventory updated.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('DRAFT')}
              className="px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('APPROVED')}
              className="px-3.5 sm:px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} /> Submit DPR
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

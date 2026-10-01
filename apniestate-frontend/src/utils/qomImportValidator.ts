import { normalizeUnit, cleanNumeric, detectDiscipline } from './constructionIntelligence';

export interface CandidateRow {
  rawDescription: string;
  rawQuantity: any;
  rawUnit?: string;
  rawRate?: any;
  rawAmount?: any;
  rawCategory?: string;
  rawCode?: string;
  rawRemarks?: string;
  sourceSheet?: string;
  sourceLine?: number;
}

export interface ValidatedQOMItem {
  name: string;
  planned: number;
  unit: string;
  rate: number;
  amount: number;
  category: string;
  code?: string;
  remarks?: string;
}

export interface RejectedQOMRow {
  description: string;
  reason: string;
  rawQuantity?: any;
  rawUnit?: string;
  category?: string;
}

export interface QOMImportResult {
  accepted: ValidatedQOMItem[];
  rejected: RejectedQOMRow[];
  categories: {
    name: string;
    items: ValidatedQOMItem[];
  }[];
}

// Common units recognized in construction QOM / BOQ
const KNOWN_UNITS = new Set([
  'cum', 'cu.m', 'm3', 'm^3', 'cubic meter',
  'sqm', 'sq.m', 'm2', 'm^2', 'square meter',
  'sqft', 'sq.ft', 'sft', 'square feet',
  'kg', 'kgs', 'kilogram',
  'ton', 'tons', 'tonne', 'tonnes', 'mt',
  'bag', 'bags',
  'cft', 'cu.ft', 'cubic feet',
  'rmt', 'r.m', 'running meter', 'rm', 'meter', 'm', 'mtr', 'mtrs',
  'nos', 'no', 'nos.', 'pcs', 'pc', 'pieces', 'each', 'number', 'numbers',
  'set', 'sets',
  'ltr', 'litre', 'litres', 'liter', 'liters',
  'lot', 'lumpsum', 'ls', 'l.s.', 'job'
]);

/**
 * Checks if a string represents an obvious subtotal or total row.
 */
export function isSubtotalOrTotal(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    /^(sub[\s-]?total|grand[\s-]?total|total[\s:]|net[\s-]?total|total\b|summary|carried\s+(over|forward)|brought\s+forward|total\s+amount|amount\s+in\s+words)/i.test(t) ||
    t === 'total' ||
    t === 'sub total' ||
    t === 'subtotal' ||
    t === 'grand total'
  );
}

/**
 * Checks if a string represents document headers, footers, or page counters.
 */
export function isPageHeaderOrFooter(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    /^(page\s+\d+|sheet\s+\d+|printed\s+on|date\s*:|project\s*:|client\s*:|architect\s*:|consultant\s*:|contractor\s*:|tender\s+no|document\s+ref|bill\s+no[\s.:]|boq\s+ref)/i.test(t) ||
    /\bpage\s+\d+\s+of\s+\d+\b/i.test(t)
  );
}

/**
 * Checks if a string represents general notes, instructions, or specifications.
 */
export function isNoteOrInstruction(text: string): boolean {
  const t = text.trim().toLowerCase();
  return (
    /^(note[s]?\s*:|important\s*:|general\s+notes?|specifications?\s*:|scope\s+of\s+work|terms\s*(&|and)\s*conditions|measurement\s+basis|disclaimer)/i.test(t)
  );
}

/**
 * Checks if a string represents a serial number or indexing prefix only.
 */
export function isSerialNumberOnly(text: string): boolean {
  const t = text.trim();
  return (
    /^([0-9]+(\.[0-9]+)*[.:)]?|[a-z]\.|\([a-z0-9]\)|[ivx]+\.|\s*[-*•#]\s*)$/i.test(t) ||
    /^\d+$/.test(t)
  );
}

/**
 * Checks if a row looks like a section heading or category title.
 */
export function isSectionHeading(text: string, hasValidQty: boolean): boolean {
  const t = text.trim();
  // Explicit section title keywords
  if (/^(section\s+[0-9a-z]+|part\s+[0-9a-zivx]+|bill\s+no\.?\s*[0-9]+|schedule\s+[a-z0-9]+|division\s+[0-9]+)/i.test(t)) {
    return true;
  }
  // If no quantity and looks like a headline (all caps or short category phrase)
  if (!hasValidQty) {
    if (t.length >= 3 && t.length <= 60) {
      if (t === t.toUpperCase() && /[A-Z]/.test(t)) return true;
      if (/works|finishes|masonry|concrete|plumbing|electrical|doors|windows|carpentry|flooring|painting|hvac|earthwork|substructure|superstructure/i.test(t)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates candidate rows and separates them into accepted and rejected with clear reasons.
 */
export function processCandidateRows(rows: CandidateRow[], defaultCategory = 'General'): QOMImportResult {
  const accepted: ValidatedQOMItem[] = [];
  const rejected: RejectedQOMRow[] = [];
  let currentCategory = defaultCategory;

  for (const row of rows) {
    const rawDesc = String(row.rawDescription || '').trim();

    // 1. Check empty description
    if (!rawDesc || rawDesc.length < 2) {
      rejected.push({
        description: rawDesc || '(Blank row)',
        reason: 'Empty or blank description',
        category: row.rawCategory || currentCategory
      });
      continue;
    }

    // 2. Check serial number only
    if (isSerialNumberOnly(rawDesc)) {
      rejected.push({
        description: rawDesc,
        reason: 'Serial number or index only',
        category: row.rawCategory || currentCategory
      });
      continue;
    }

    // 3. Check Subtotal / Total rows
    if (isSubtotalOrTotal(rawDesc)) {
      rejected.push({
        description: rawDesc,
        reason: 'Subtotal or total summary row',
        category: row.rawCategory || currentCategory
      });
      continue;
    }

    // 4. Check Page Header / Footer / Metadata
    if (isPageHeaderOrFooter(rawDesc)) {
      rejected.push({
        description: rawDesc,
        reason: 'Page header, footer, or document metadata',
        category: row.rawCategory || currentCategory
      });
      continue;
    }

    // 5. Check Notes / Remarks / Scope
    if (isNoteOrInstruction(rawDesc)) {
      rejected.push({
        description: rawDesc,
        reason: 'Notes, terms, or specification clause',
        category: row.rawCategory || currentCategory
      });
      continue;
    }

    const qty = cleanNumeric(row.rawQuantity);
    const hasValidQty = !isNaN(qty) && qty > 0;

    // 6. Check Section Headings
    if (isSectionHeading(rawDesc, hasValidQty)) {
      // Use this heading to name the active category for upcoming items!
      currentCategory = rawDesc.replace(/^section\s+[0-9a-z]+\s*[:-]?\s*/i, '').trim() || rawDesc;
      rejected.push({
        description: rawDesc,
        reason: 'Section heading or category title (used for grouping)',
        category: currentCategory
      });
      continue;
    }

    // 7. Verify quantity
    if (!hasValidQty) {
      rejected.push({
        description: rawDesc,
        reason: 'Missing or zero quantity',
        rawQuantity: row.rawQuantity,
        category: row.rawCategory || currentCategory
      });
      continue;
    }

    // 8. Verify unit
    const rawUnit = String(row.rawUnit || '').trim().toLowerCase();
    const normalizedUnit = normalizeUnit(rawUnit || 'nos');
    
    // Check if unit is meaningful
    if (!rawUnit && !row.rawAmount && !row.rawRate) {
      rejected.push({
        description: rawDesc,
        reason: 'Missing unit of measurement',
        rawQuantity: qty,
        category: row.rawCategory || currentCategory
      });
      continue;
    }

    const rate = cleanNumeric(row.rawRate);
    const amount = cleanNumeric(row.rawAmount) || (qty * rate);

    const category = row.rawCategory || currentCategory || detectDiscipline(rawDesc);

    accepted.push({
      name: rawDesc,
      planned: qty,
      unit: normalizedUnit,
      rate: isNaN(rate) ? 0 : rate,
      amount: isNaN(amount) ? (qty * rate) : amount,
      category,
      code: row.rawCode,
      remarks: row.rawRemarks
    });
  }

  // Group accepted into categories
  const categoryMap: Record<string, ValidatedQOMItem[]> = {};
  accepted.forEach(item => {
    if (!categoryMap[item.category]) categoryMap[item.category] = [];
    categoryMap[item.category].push(item);
  });

  const categories = Object.entries(categoryMap).map(([name, items]) => ({
    name,
    items
  }));

  return {
    accepted,
    rejected,
    categories
  };
}

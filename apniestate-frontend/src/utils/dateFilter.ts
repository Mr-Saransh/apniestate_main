/**
 * Date filtering utilities for Apniestate
 * Supports robust range checks across ISO timestamps, formatted strings, and Date objects.
 */

export type DatePresetKey =
  | 'all_time'
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'last_30_days'
  | 'this_quarter'
  | 'custom';

export interface DatePresetOption {
  key: DatePresetKey;
  label: string;
}

export const DATE_PRESETS: DatePresetOption[] = [
  { key: 'all_time', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'this_week', label: 'This Week' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'this_quarter', label: 'This Quarter' },
  { key: 'custom', label: 'Custom' },
];

/**
 * Format a Date to YYYY-MM-DD (local timezone safe)
 */
export function formatDateToInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate from/to date strings for standard presets
 */
export function getDatePresetRange(preset: DatePresetKey): { from: string; to: string } {
  const now = new Date();
  const todayStr = formatDateToInput(now);

  switch (preset) {
    case 'today':
      return { from: todayStr, to: todayStr };

    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatDateToInput(y);
      return { from: yStr, to: yStr };
    }

    case 'this_week': {
      const d = new Date(now);
      // Monday as start of week (or Sunday if preferred in IN: day 1)
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return { from: formatDateToInput(monday), to: todayStr };
    }

    case 'this_month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: formatDateToInput(firstDay), to: todayStr };
    }

    case 'last_month': {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: formatDateToInput(firstDayLastMonth),
        to: formatDateToInput(lastDayLastMonth),
      };
    }

    case 'last_30_days': {
      const past30 = new Date(now);
      past30.setDate(past30.getDate() - 30);
      return { from: formatDateToInput(past30), to: todayStr };
    }

    case 'this_quarter': {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      return { from: formatDateToInput(startQuarter), to: todayStr };
    }

    case 'all_time':
    case 'custom':
    default:
      return { from: '', to: '' };
  }
}

/**
 * Parses any date representation (ISO, Date, DD MMM, YYYY-MM-DD, timestamp)
 */
export function parseFlexibleDate(val: string | Date | number | null | undefined): Date | null {
  if (val == null || val === '') return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }

  // 1. Direct standard parse
  const direct = new Date(val);
  if (!isNaN(direct.getTime())) return direct;

  // 2. Handle "14 Oct" or "14 Oct 2026" or "14-10-2026"
  const str = String(val).trim();
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10) - 1;
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Handle "14 Oct" (append current year)
  const monthNames: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const textDateMatch = str.match(/^(\d{1,2})\s+([A-Za-z]{3})(?:\s+(\d{4}))?$/i);
  if (textDateMatch) {
    const day = parseInt(textDateMatch[1], 10);
    const mStr = textDateMatch[2].toLowerCase();
    const month = monthNames[mStr];
    const year = textDateMatch[3] ? parseInt(textDateMatch[3], 10) : new Date().getFullYear();
    if (month !== undefined) {
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

/**
 * Check whether a date is within [fromDate, toDate] inclusive.
 * Handles boundary times properly: fromDate starts at 00:00:00.000,
 * toDate ends at 23:59:59.999.
 */
export function isWithinDateRange(
  itemDate: string | Date | number | null | undefined,
  fromDate?: string | null,
  toDate?: string | null
): boolean {
  if (!fromDate && !toDate) return true; // No filter active

  const parsed = parseFlexibleDate(itemDate);
  if (!parsed) return false;

  const itemTime = parsed.getTime();

  if (fromDate) {
    const from = new Date(`${fromDate}T00:00:00.000`);
    if (!isNaN(from.getTime()) && itemTime < from.getTime()) {
      return false;
    }
  }

  if (toDate) {
    const to = new Date(`${toDate}T23:59:59.999`);
    if (!isNaN(to.getTime()) && itemTime > to.getTime()) {
      return false;
    }
  }

  return true;
}

/**
 * Format a human-readable display string for the active date range.
 */
export function formatDateRangeDisplay(fromDate?: string | null, toDate?: string | null): string {
  if (!fromDate && !toDate) return 'All Time';

  const fmt = (dStr: string) => {
    const d = new Date(`${dStr}T00:00:00.000`);
    return isNaN(d.getTime())
      ? dStr
      : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (fromDate && toDate) {
    if (fromDate === toDate) return fmt(fromDate);
    return `${fmt(fromDate)} – ${fmt(toDate)}`;
  }
  if (fromDate) return `From ${fmt(fromDate)}`;
  if (toDate) return `Up to ${fmt(toDate)}`;
  return 'All Time';
}

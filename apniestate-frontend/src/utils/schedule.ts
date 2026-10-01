/**
 * Date-only and calendar-safe schedule status calculations.
 * Avoids timezone / time-of-day false delays by normalizing dates to YYYY-MM-DD.
 */

export function toDateOnlyString(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateSafe(d: Date | string | null | undefined): string {
  if (!d) return 'Not set';
  const str = toDateOnlyString(d);
  if (!str) return 'Not set';
  const [y, m, day] = str.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(day));
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export type ScheduleStatus = 'AHEAD' | 'ON_TIME' | 'DELAYED' | 'ON_TRACK' | 'AT_RISK' | 'PENDING';

export function getScheduleStatus(item: {
  status?: string | null;
  planned_start_date?: Date | string | null;
  planned_end_date?: Date | string | null;
  target_date?: Date | string | null;
  actual_start_date?: Date | string | null;
  actual_end_date?: Date | string | null;
  actual_date?: Date | string | null;
  progress_percentage?: number | null;
}): {
  status: ScheduleStatus;
  label: string;
  badgeClass: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string;
  actualEnd: string;
  daysVariance: number;
} {
  const plannedEndStr = toDateOnlyString(item.planned_end_date || item.target_date);
  const plannedStartStr = toDateOnlyString(item.planned_start_date);
  const actualEndStr = toDateOnlyString(item.actual_end_date || item.actual_date);
  const actualStartStr = toDateOnlyString(item.actual_start_date);
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let status: ScheduleStatus = 'PENDING';
  let daysVariance = 0;

  if (plannedEndStr && actualEndStr) {
    const diffMs = new Date(actualEndStr).getTime() - new Date(plannedEndStr).getTime();
    daysVariance = Math.round(diffMs / (1000 * 60 * 60 * 24));
  } else if (plannedEndStr) {
    const diffMs = new Date(todayStr).getTime() - new Date(plannedEndStr).getTime();
    daysVariance = Math.round(diffMs / (1000 * 60 * 60 * 24));
  }

  const currentStatus = (item.status || 'PENDING').toUpperCase();

  if (currentStatus === 'COMPLETED') {
    if (!plannedEndStr || !actualEndStr) {
      status = 'ON_TIME';
    } else if (actualEndStr < plannedEndStr) {
      status = 'AHEAD';
    } else if (actualEndStr === plannedEndStr) {
      status = 'ON_TIME';
    } else {
      status = 'DELAYED';
    }
  } else if (currentStatus === 'IN_PROGRESS') {
    if (!plannedEndStr) {
      status = 'ON_TRACK';
    } else if (todayStr > plannedEndStr) {
      status = 'DELAYED';
    } else if (todayStr === plannedEndStr && (item.progress_percentage || 0) < 100) {
      status = 'AT_RISK';
    } else {
      const targetTime = new Date(plannedEndStr).getTime();
      const todayTime = new Date(todayStr).getTime();
      const daysRemaining = Math.round((targetTime - todayTime) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 2 && (item.progress_percentage || 0) < 50) {
        status = 'AT_RISK';
      } else {
        status = 'ON_TRACK';
      }
    }
  } else {
    if (plannedEndStr && todayStr > plannedEndStr) {
      status = 'DELAYED';
    } else if (plannedStartStr && todayStr > plannedStartStr) {
      status = 'DELAYED';
    } else {
      status = 'PENDING';
    }
  }

  let label = 'Pending';
  let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (status) {
    case 'AHEAD':
      label = 'Ahead of Schedule';
      badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      break;
    case 'ON_TIME':
      label = 'On Time';
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
      break;
    case 'ON_TRACK':
      label = 'On Track';
      badgeClass = 'bg-blue-50 text-[#2648E7] border-blue-200 font-bold';
      break;
    case 'AT_RISK':
      label = 'At Risk';
      badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      break;
    case 'DELAYED':
      label = 'Delayed';
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      break;
    case 'PENDING':
    default:
      label = 'Scheduled';
      badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
      break;
  }

  return {
    status,
    label,
    badgeClass,
    plannedStart: formatDateSafe(plannedStartStr),
    plannedEnd: formatDateSafe(plannedEndStr),
    actualStart: formatDateSafe(actualStartStr),
    actualEnd: formatDateSafe(actualEndStr),
    daysVariance,
  };
}

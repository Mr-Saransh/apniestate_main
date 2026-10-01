/**
 * Date-only and calendar-safe schedule status calculations.
 * Avoids timezone / time-of-day false delays by normalizing dates to YYYY-MM-DD.
 */

export function toDateOnlyString(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  // Use UTC or local date component safely
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export type ScheduleStatus = 'AHEAD' | 'ON_TIME' | 'DELAYED' | 'ON_TRACK' | 'AT_RISK' | 'PENDING';

export function calculateScheduleStatus(item: {
  status?: string | null;
  planned_start_date?: Date | string | null;
  planned_end_date?: Date | string | null;
  target_date?: Date | string | null;
  actual_start_date?: Date | string | null;
  actual_end_date?: Date | string | null;
  actual_date?: Date | string | null;
  progress_percentage?: number | null;
}): {
  scheduleStatus: ScheduleStatus;
  plannedStartDate: string | null;
  plannedEndDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  daysVariance: number;
} {
  const plannedEndStr = toDateOnlyString(item.planned_end_date || item.target_date);
  const plannedStartStr = toDateOnlyString(item.planned_start_date);
  const actualEndStr = toDateOnlyString(item.actual_end_date || item.actual_date);
  const actualStartStr = toDateOnlyString(item.actual_start_date);
  
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let scheduleStatus: ScheduleStatus = 'PENDING';
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
      scheduleStatus = 'ON_TIME';
    } else if (actualEndStr < plannedEndStr) {
      scheduleStatus = 'AHEAD';
    } else if (actualEndStr === plannedEndStr) {
      scheduleStatus = 'ON_TIME';
    } else {
      scheduleStatus = 'DELAYED';
    }
  } else if (currentStatus === 'IN_PROGRESS') {
    if (!plannedEndStr) {
      scheduleStatus = 'ON_TRACK';
    } else if (todayStr > plannedEndStr) {
      scheduleStatus = 'DELAYED';
    } else if (todayStr === plannedEndStr && (item.progress_percentage || 0) < 100) {
      scheduleStatus = 'AT_RISK';
    } else {
      // Check if approaching deadline with low progress
      const targetTime = new Date(plannedEndStr).getTime();
      const todayTime = new Date(todayStr).getTime();
      const daysRemaining = Math.round((targetTime - todayTime) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 2 && (item.progress_percentage || 0) < 50) {
        scheduleStatus = 'AT_RISK';
      } else {
        scheduleStatus = 'ON_TRACK';
      }
    }
  } else {
    // PENDING or DELAYED
    if (plannedEndStr && todayStr > plannedEndStr) {
      scheduleStatus = 'DELAYED';
    } else if (plannedStartStr && todayStr > plannedStartStr) {
      scheduleStatus = 'DELAYED';
    } else {
      scheduleStatus = 'PENDING';
    }
  }

  return {
    scheduleStatus,
    plannedStartDate: plannedStartStr,
    plannedEndDate: plannedEndStr,
    actualStartDate: actualStartStr,
    actualEndDate: actualEndStr,
    daysVariance,
  };
}

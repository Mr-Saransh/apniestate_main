import { useState, useEffect, type FormEvent } from 'react';
import {
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreVertical,
  Check,
  Clock,
  X,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Modal from '@/components/shared/Modal';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';

interface WorkerRecord {
  id: string;
  name: string;
  trade: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE' | 'LATE' | 'UNMARKED';
  check_in: string | null;
  check_out: string | null;
  overtime_hours: number;
  is_half_day: boolean;
  is_late: boolean;
  notes: string | null;
  site_id: string | null;
  site_name: string | null;
  contractor_name: string | null;
  daily_rate: number;
}

interface Site {
  id: string;
  name: string;
  location: string;
  project_id: string;
}

export default function AttendancePage() {
  const [date, setDate] = useState(new Date());
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [workers, setWorkers] = useState<WorkerRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Download Report Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadType, setDownloadType] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [downloadMonth, setDownloadMonth] = useState(new Date().getMonth());
  const [downloadYear, setDownloadYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState(false);

  // Edit Single Worker Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<WorkerRecord | null>(null);
  const [editStatus, setEditStatus] = useState<WorkerRecord['status']>('PRESENT');
  const [editShift, setEditShift] = useState<'DAY' | 'NIGHT' | 'GENERAL'>('GENERAL');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editOT, setEditOT] = useState(0);
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const fetchSitesAndWorkers = async () => {
    try {
      const sitesRes = await apiClient.get<Site[]>('/sites');
      if (sitesRes.data) {
        setSites(sitesRes.data);
      }

      const dateStr = date.toISOString().split('T')[0];
      const params = new URLSearchParams();
      params.append('date', dateStr);
      if (selectedSiteId) {
        params.append('site_id', selectedSiteId);
      }

      const workersRes = await apiClient.get<WorkerRecord[]>(`/attendance?${params.toString()}`);
      if (workersRes.data) {
        setWorkers(workersRes.data.map(w => ({
          ...w,
          daily_rate: w.daily_rate || 0 
        })));
      }
    } catch (err) {
      console.error('Failed to load attendance page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchSitesAndWorkers();
  }, [date, selectedSiteId]);

  const handleStatusChange = async (workerId: string, status: WorkerRecord['status']) => {
    setWorkers(prev =>
      prev.map(w =>
        w.id === workerId
          ? {
              ...w,
              status,
              check_in: ['PRESENT', 'LATE', 'HALF_DAY'].includes(status) && !w.check_in ? new Date().toISOString() : w.check_in
            }
          : w
      )
    );

    try {
      await apiClient.post('/attendance', {
        worker_id: workerId,
        status,
        date: date.toISOString().split('T')[0],
        site_id: selectedSiteId || undefined
      });
    } catch (err) {
      console.error('Failed to mark worker attendance', err);
      fetchSitesAndWorkers();
    }
  };

  const openEditModal = (worker: WorkerRecord) => {
    setSelectedWorker(worker);
    setEditStatus(worker.status);
    setEditCheckIn(worker.check_in ? worker.check_in.slice(11, 16) : '09:00');
    setEditCheckOut(worker.check_out ? worker.check_out.slice(11, 16) : '18:00');
    setEditOT(worker.overtime_hours || 0);
    setEditNotes(worker.notes || '');
    setEditShift('GENERAL');
    setShowEditModal(true);
  };

  const handleSaveSingleWorker = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    setEditSaving(true);
    setEditError('');

    try {
      const dateStr = date.toISOString().split('T')[0];
      let checkInIso = null;
      let checkOutIso = null;

      if (['PRESENT', 'LATE', 'HALF_DAY'].includes(editStatus)) {
        checkInIso = new Date(`${dateStr}T${editCheckIn}:00`).toISOString();
        if (editCheckOut) {
          checkOutIso = new Date(`${dateStr}T${editCheckOut}:00`).toISOString();
        }
      }

      await apiClient.post('/attendance', {
        worker_id: selectedWorker.id,
        status: editStatus,
        date: dateStr,
        shift: editShift,
        check_in: checkInIso,
        check_out: checkOutIso,
        overtime_hours: Number(editOT),
        notes: editNotes || null,
        site_id: selectedSiteId || undefined
      });

      setShowEditModal(false);
      fetchSitesAndWorkers();
    } catch (err: any) {
      setEditError(err.message || 'Failed to save attendance correction');
    } finally {
      setEditSaving(false);
    }
  };

  const generateExcelSheet = (reportData: any, fromStr: string, toStr: string) => {
    const records = reportData.records || [];
    const workerSummaries = reportData.worker_summaries || [];
    
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    
    const monthName = fromDate.toLocaleDateString('en-US', { month: 'long' });
    const year = fromDate.getFullYear();
    
    const siteName = sites.find(s => s.id === selectedSiteId)?.name || 'All Sites';
    const supervisorName = localStorage.getItem('user') 
      ? JSON.parse(localStorage.getItem('user')!).name 
      : 'Site Supervisor';

    // Calculate dates between fromDate and toDate
    const dateList: string[] = [];
    const tempDate = new Date(fromDate);
    while (tempDate <= toDate) {
      dateList.push(tempDate.toISOString().split('T')[0]);
      tempDate.setDate(tempDate.getDate() + 1);
    }

    // Dynamic headers for dates
    const dateHeaders = dateList.map(dStr => {
      const dNum = new Date(dStr).getDate();
      return `<th style="background-color: #E5E7EB; font-weight: bold; text-align: center; border: 1px solid #CCCCCC;">${dNum}</th>`;
    }).join('\n');

    // Worker Rows
    let workerRows = '';
    let totalPresentSum = 0;
    let totalOTHoursSum = 0;
    let totalSalarySum = 0;

    workerSummaries.forEach((w: any) => {
      totalPresentSum += w.effective_days;
      totalOTHoursSum += w.overtime;
      totalSalarySum += w.total_wage;

      // Find attendance status for each date
      const dateCells = dateList.map(dStr => {
        const matching = records.find((r: any) => {
          if (!r.date) return false;
          const dPart = typeof r.date === 'string' ? r.date.split('T')[0] : new Date(r.date).toISOString().split('T')[0];
          return r.worker_id === w.worker_id && dPart === dStr;
        });

        let cellText = '-';
        if (matching) {
          const otText = matching.overtime_hours > 0 ? ` +${matching.overtime_hours}h` : '';
          if (matching.status === 'PRESENT') cellText = `P${otText}`;
          else if (matching.status === 'HALF_DAY') cellText = `H${otText}`;
          else if (matching.status === 'ABSENT') cellText = 'A';
          else if (matching.status === 'ON_LEAVE') cellText = 'L';
          else if (matching.status === 'LATE') cellText = `L${otText}`;
        }
        return `<td style="text-align: center; border: 1px solid #CCCCCC;">${cellText}</td>`;
      }).join('\n');

      const otRate = Math.round((w.daily_rate / 8) * 1.5);
      workerRows += `
        <tr>
          <td style="border: 1px solid #CCCCCC; font-weight: bold;">${w.worker_name}</td>
          <td style="border: 1px solid #CCCCCC; text-align: center;">${w.trade}</td>
          <td style="border: 1px solid #CCCCCC; text-align: right;">₹${w.daily_rate}</td>
          <td style="border: 1px solid #CCCCCC; text-align: right;">₹${otRate}</td>
          ${dateCells}
          <td style="border: 1px solid #CCCCCC; text-align: center; font-weight: bold;">${w.effective_days}</td>
          <td style="border: 1px solid #CCCCCC; text-align: center;">${w.overtime}</td>
          <td style="border: 1px solid #CCCCCC; text-align: right; font-weight: bold;">₹${Math.round(w.total_wage).toLocaleString('en-IN')}</td>
          <td style="border: 1px solid #CCCCCC; text-align: right;">₹0</td>
          <td style="border: 1px solid #CCCCCC; text-align: right; font-weight: bold; color: #16A34A;">₹${Math.round(w.total_wage).toLocaleString('en-IN')}</td>
        </tr>
      `;
    });

    const colspanDates = dateList.length;

    const htmlTable = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Attendance Sheet</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #CCCCCC; padding: 6px; font-family: Arial, sans-serif; font-size: 11px; }
        </style>
      </head>
      <body>
        <table>
          <!-- Brand Header -->
          <tr>
            <td colspan="${4 + colspanDates + 6}" style="text-align: center; font-size: 20px; font-weight: bold; padding: 12px 0;">
              Apni Estate
            </td>
          </tr>
          <tr>
            <td colspan="${Math.floor((4 + colspanDates + 6)/2)}" style="text-align: left; font-size: 12px; font-weight: bold; border: none;">
              Site: ${siteName}
            </td>
            <td colspan="${Math.ceil((4 + colspanDates + 6)/2)}" style="text-align: right; font-size: 12px; font-weight: bold; border: none;">
              Foreman: ${supervisorName}
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td colspan="${4 + colspanDates + 6}" style="background-color: #F4B400; color: #000000; font-size: 14px; font-weight: bold; text-align: center; padding: 8px 0; border: 1px solid #000;">
              Worker Attendance Sheet
            </td>
          </tr>
          <tr>
            <td colspan="${4 + colspanDates + 6}" style="background-color: #D1FAE5; font-size: 13px; font-weight: bold; text-align: center; padding: 6px 0; border: 1px solid #000;">
              ${downloadType === 'MONTH' ? `${monthName} ${year}` : `Year ${downloadYear}`}
            </td>
          </tr>

          <!-- Headers -->
          <tr>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">Name</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">Designation</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">Daily Charge</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">OT Rate</th>
            <th colspan="${colspanDates}" style="background-color: #E5E7EB; font-weight: bold; text-align: center; border: 1px solid #CCCCCC;">Dates</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">Present</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">OT Hours</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">Total Salary</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">Payment</th>
            <th rowspan="2" style="background-color: #E5E7EB; font-weight: bold; border: 1px solid #CCCCCC;">Balance</th>
          </tr>
          <tr>
            ${dateHeaders}
          </tr>

          <!-- Worker Rows -->
          ${workerRows}

          <!-- Grand Total Row -->
          <tr style="background-color: #F4B400; font-weight: bold;">
            <td colspan="4" style="text-align: right; border: 1px solid #000; font-weight: bold;">Grand Total</td>
            <td colspan="${colspanDates}" style="border: 1px solid #000;"></td>
            <td style="text-align: center; border: 1px solid #000; font-weight: bold;">${totalPresentSum}</td>
            <td style="text-align: center; border: 1px solid #000; font-weight: bold;">${totalOTHoursSum}</td>
            <td style="text-align: right; border: 1px solid #000; font-weight: bold;">₹${Math.round(totalSalarySum).toLocaleString('en-IN')}</td>
            <td style="text-align: right; border: 1px solid #000; font-weight: bold;">₹0</td>
            <td style="text-align: right; border: 1px solid #000; font-weight: bold;">₹${Math.round(totalSalarySum).toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlTable], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    const siteSlug = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const periodSlug = downloadType === 'MONTH' ? `${monthName}_${year}` : `${downloadYear}`;
    a.download = `apni_estate_attendance_${siteSlug}_${periodSlug}.xls`;
    a.click();
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      let fromStr = '';
      let toStr = '';
      if (downloadType === 'MONTH') {
        const lastDay = new Date(downloadYear, downloadMonth + 1, 0).getDate();
        fromStr = `${downloadYear}-${String(downloadMonth + 1).padStart(2, '0')}-01`;
        toStr = `${downloadYear}-${String(downloadMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else {
        fromStr = `${downloadYear}-01-01`;
        toStr = `${downloadYear}-12-31`;
      }

      const params = new URLSearchParams();
      params.append('from', fromStr);
      params.append('to', toStr);
      if (selectedSiteId) {
        params.append('site_id', selectedSiteId);
      }

      const res = await apiClient.get<any>(`/attendance/report?${params.toString()}`);
      if (res.data) {
        generateExcelSheet(res.data, fromStr, toStr);
        setShowDownloadModal(false);
      }
    } catch (err) {
      console.error('Failed to download report', err);
      alert('Failed to generate report.');
    } finally {
      setDownloading(false);
    }
  };

  // Metrics Formulas
  const totalMarked = workers.filter(w => w.status !== 'UNMARKED').length;
  const presentCount = workers.filter(w => ['PRESENT', 'LATE'].includes(w.status)).length;
  const halfDayCount = workers.filter(w => w.status === 'HALF_DAY').length;
  const absentCount = workers.filter(w => w.status === 'ABSENT').length;
  const leaveCount = workers.filter(w => w.status === 'ON_LEAVE').length;
  const overtimeCount = workers.filter(w => (w.overtime_hours || 0) > 0).length;
  
  const dailyLabourCost = workers.reduce((sum, w) => {
    let cost = 0;
    if (['PRESENT', 'LATE'].includes(w.status)) cost += w.daily_rate;
    if (w.status === 'HALF_DAY') cost += w.daily_rate / 2;
    // OT simplified estimation (assume daily rate / 8 is hourly rate)
    if (w.overtime_hours) cost += (w.daily_rate / 8) * w.overtime_hours * 1.5; 
    return sum + cost;
  }, 0);

  const totalWageLiability = workers.reduce((sum, w) => sum + (w.daily_rate || 0), 0);
  const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + (halfDayCount * 0.5)) / totalMarked) * 100) : 0;
  const laborUtilization = workers.length > 0 ? Math.round(((presentCount + (halfDayCount * 0.5)) / workers.length) * 100) : 0;

  // Weekly Strip Logic
  const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));

  if (loading && workers.length === 0) return <LoadingSpinner size="lg" />;

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: '260px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) var(--space-4) var(--space-2)' }}>
        <button className="btn btn-icon btn-ghost btn-sm" onClick={() => window.history.back()}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <h1 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
            Attendance: {selectedSiteId ? sites.find(s => s.id === selectedSiteId)?.name : 'All Sites'}
          </h1>
          <select 
            style={{ opacity: 0, position: 'absolute', width: '200px', cursor: 'pointer' }}
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
          >
            <option value="">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button className="btn btn-icon btn-ghost btn-sm" style={{ color: 'var(--color-primary)' }}>
          <UserCheck size={20} />
        </button>
      </div>
      
      <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
        {format(date, 'dd MMM yyyy')}
      </div>

      {/* Summary Card */}
      <div style={{ padding: '0 var(--space-4)' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
          color: 'white', 
          borderRadius: 'var(--radius-lg)', 
          padding: 'var(--space-4)', 
          boxShadow: 'var(--shadow-md)',
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', opacity: 0.8, marginBottom: '2px' }}>Total Cost</div>
              <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'bold', lineHeight: 1 }}>₹ {Math.round(dailyLabourCost).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: 'var(--font-size-sm)' }}>Present: {presentCount}</div>
              <div style={{ color: '#FCD34D', fontSize: 'var(--font-size-xs)' }}>Half Day: {halfDayCount}</div>
            </div>
          </div>
          
          <div style={{ 
            fontSize: 'var(--font-size-xs)', 
            opacity: 0.9, 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 'var(--space-2)', 
            borderTop: '1px solid rgba(255,255,255,0.2)', 
            paddingTop: 'var(--space-3)' 
          }}>
            <span>Abs: {absentCount}</span>
            <span>|</span>
            <span>Leave: {leaveCount}</span>
            <span>|</span>
            <span>OT: {overtimeCount}</span>
            <span>|</span>
            <span>Util: {laborUtilization}%</span>
          </div>
        </div>
      </div>

      {/* Weekly Strip */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '0 var(--space-4)',
        marginBottom: 'var(--space-4)'
      }}>
        {weekDays.map(day => {
          const isSelected = isSameDay(date, day);
          const isToday = isSameDay(new Date(), day);
          
          return (
            <div 
              key={day.toISOString()}
              onClick={() => setDate(day)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                opacity: isSelected ? 1 : 0.6,
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}>
                {format(day, 'EEE')}
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 'bold',
                background: isSelected ? 'var(--color-primary)' : (isToday ? 'rgba(10, 61, 145, 0.1)' : 'transparent'),
                color: isSelected ? 'white' : 'var(--color-text)',
                boxShadow: isSelected ? '0 4px 8px rgba(10, 61, 145, 0.3)' : 'none'
              }}>
                {format(day, 'dd')}
              </div>
              {/* Optional: dot indicator for marked days could go here */}
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
        Hidden/Leave Workers: {leaveCount} (Tap to manage)
      </div>

      {/* Workers List - High Density Mobile First */}
      <div style={{ padding: '0 var(--space-2)' }}>
        {workers.filter(w => w.status !== 'ON_LEAVE').map((worker) => (
          <div
            key={worker.id}
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-4)',
              marginBottom: 'var(--space-2)',
              boxShadow: 'var(--shadow-xs)',
              border: '1px solid var(--color-border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-2)'
            }}
          >
            {/* Worker Info */}
            <div style={{ flex: '1 1 120px', minWidth: 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {worker.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: '500' }}>{worker.trade}</span>
                <span>₹{worker.daily_rate}/day</span>
              </div>
              {worker.contractor_name && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {worker.contractor_name}
                </div>
              )}
            </div>

            {/* Action Buttons (P, H, A, OT) */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <TapButton 
                label="P" 
                active={['PRESENT', 'LATE'].includes(worker.status)} 
                color="#10B981" 
                onClick={() => handleStatusChange(worker.id, 'PRESENT')} 
              />
              <TapButton 
                label="H" 
                active={worker.status === 'HALF_DAY'} 
                color="#F59E0B" 
                onClick={() => handleStatusChange(worker.id, 'HALF_DAY')} 
              />
              <TapButton 
                label="A" 
                active={worker.status === 'ABSENT'} 
                color="#EF4444" 
                onClick={() => handleStatusChange(worker.id, 'ABSENT')} 
              />
              <button 
                onClick={() => openEditModal(worker)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: 'none',
                  background: worker.overtime_hours > 0 ? '#8B5CF6' : 'transparent',
                  color: worker.overtime_hours > 0 ? 'white' : 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                OT
              </button>
              
              <button 
                className="btn btn-ghost btn-icon btn-sm" 
                onClick={() => openEditModal(worker)}
                style={{ marginLeft: '4px', color: 'var(--color-text-muted)' }}
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Sticky Save & Download Buttons */}
      <div style={{ 
        position: 'fixed', 
        bottom: 'var(--bottom-nav-height)', 
        left: 0, 
        right: 0, 
        padding: 'var(--space-4)',
        background: 'linear-gradient(0deg, var(--color-bg) 70%, transparent 100%)',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className="btn btn-primary" 
            style={{ width: '100%', borderRadius: 'var(--radius-full)', padding: 'var(--space-3) 0', fontSize: 'var(--font-size-md)', boxShadow: 'var(--shadow-md)' }}
            onClick={() => {
              // Since it auto-saves, this just provides reassurance
              alert('Attendance data is automatically saved!');
            }}
          >
            Save Attendance
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', borderRadius: 'var(--radius-full)', padding: 'var(--space-3) 0', fontSize: 'var(--font-size-md)', border: '1px solid var(--color-border)', backgroundColor: '#FFFFFF' }}
            onClick={() => setShowDownloadModal(true)}
          >
            Download Attendance Report
          </button>
        </div>
      </div>

      {/* Edit Worker Details Modal */}
      {selectedWorker && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Attendance Details: ${selectedWorker.name}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveSingleWorker as any} disabled={editSaving}>
                {editSaving ? 'Saving...' : 'Save Correction'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveSingleWorker} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {editError && <div className="login-error"><span>{editError}</span></div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-status">Attendance Status</label>
                <select
                  id="edit-status"
                  className="form-input form-select"
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                >
                  <option value="PRESENT">Present (Full Day)</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LATE">Late Check In</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="UNMARKED">Unmarked (Delete Log)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-shift">Shift Type</label>
                <select
                  id="edit-shift"
                  className="form-input form-select"
                  value={editShift}
                  onChange={e => setEditShift(e.target.value as any)}
                >
                  <option value="GENERAL">General Shift</option>
                  <option value="DAY">Day Shift</option>
                  <option value="NIGHT">Night Shift</option>
                </select>
              </div>
            </div>

            {['PRESENT', 'LATE', 'HALF_DAY'].includes(editStatus) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-checkin">Check-In Time</label>
                  <input
                    id="edit-checkin"
                    type="time"
                    className="form-input"
                    value={editCheckIn}
                    onChange={e => setEditCheckIn(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-checkout">Check-Out Time</label>
                  <input
                    id="edit-checkout"
                    type="time"
                    className="form-input"
                    value={editCheckOut}
                    onChange={e => setEditCheckOut(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="edit-ot">Overtime Hours (OT)</label>
              <input
                id="edit-ot"
                type="number"
                step="0.5"
                min="0"
                max="12"
                className="form-input"
                value={editOT}
                onChange={e => setEditOT(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-notes">Verification Remarks / Notes</label>
              <input
                id="edit-notes"
                type="text"
                className="form-input"
                placeholder="Reason for late check-in or correction notes"
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
              />
            </div>

          </form>
        </Modal>
      )}

      {/* Download Attendance Modal */}
      <Modal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        title="Download Attendance Report"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowDownloadModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleDownloadReport} disabled={downloading}>
              {downloading ? 'Generating...' : 'Download excel'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="download-type">Report Period</label>
            <select
              id="download-type"
              className="form-input form-select"
              value={downloadType}
              onChange={e => setDownloadType(e.target.value as any)}
            >
              <option value="MONTH">Monthly Sheet</option>
              <option value="YEAR">Yearly Sheet</option>
            </select>
          </div>

          {downloadType === 'MONTH' && (
            <div className="form-group">
              <label className="form-label" htmlFor="download-month">Select Month</label>
              <select
                id="download-month"
                className="form-input form-select"
                value={downloadMonth}
                onChange={e => setDownloadMonth(Number(e.target.value))}
              >
                <option value={0}>January</option>
                <option value={1}>February</option>
                <option value={2}>March</option>
                <option value={3}>April</option>
                <option value={4}>May</option>
                <option value={5}>June</option>
                <option value={6}>July</option>
                <option value={7}>August</option>
                <option value={8}>September</option>
                <option value={9}>October</option>
                <option value={10}>November</option>
                <option value={11}>December</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="download-year">Select Year</label>
            <select
              id="download-year"
              className="form-input form-select"
              value={downloadYear}
              onChange={e => setDownloadYear(Number(e.target.value))}
            >
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>
          </div>
        </div>
      </Modal>

    </div>
  );
}

function TapButton({ label, active, color, onClick }: { label: string, active: boolean, color: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        border: active ? `none` : `1px solid transparent`,
        background: active ? color : '#F3F4F6',
        color: active ? 'white' : '#9CA3AF',
        fontSize: '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: active ? `0 2px 4px ${color}40` : 'none',
        transition: 'all 0.1s ease'
      }}
    >
      {label}
    </button>
  );
}

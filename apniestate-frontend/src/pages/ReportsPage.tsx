import React, { useState, useCallback } from 'react';
import {
  FileBarChart, IndianRupee, Package, Users, FileText,
  Download, Loader2, CheckCircle, AlertCircle, Layers
} from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/* ─── Helpers ────────────────────────────────────────────── */

function getToken() {
  return localStorage.getItem('access_token');
}

async function fetchReportData(type: string, projectId: string) {
  const token = getToken();
  const res = await fetch(
    `${API_BASE}/reports?type=${encodeURIComponent(type)}&project_id=${projectId}&_t=${Date.now()}`,
    { headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' } }
  );
  if (!res.ok) throw new Error('Failed to fetch report data');
  const json = await res.json();
  return json.data ?? json;
}

async function downloadCsv(type: string, projectId: string) {
  const token = getToken();
  const res = await fetch(
    `${API_BASE}/reports/download?project_id=${projectId}&type=${encodeURIComponent(type)}&_t=${Date.now()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error('Download failed');
  const filename =
    res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'report.csv';
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

/* ─── PDF Generator Helpers ──────────────────────────────── */

function addHeader(doc: jsPDF, title: string, projectName?: string) {
  const pageW = doc.internal.pageSize.getWidth();
  // Gradient bar
  doc.setFillColor(38, 72, 231);
  doc.rect(0, 0, pageW, 36, 'F');
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 36, pageW, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 18);

  if (projectName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(projectName, 14, 28);
  }

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageW - 14, 18, { align: 'right' });

  doc.setTextColor(0, 0, 0);
  return 48; // y position after header
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(38, 72, 231);
  doc.text(title, 14, y);
  doc.setDrawColor(38, 72, 231);
  doc.setLineWidth(0.5);
  doc.line(14, y + 2, doc.internal.pageSize.getWidth() - 14, y + 2);
  doc.setTextColor(0, 0, 0);
  return y + 10;
}

function addKVPairs(doc: jsPDF, pairs: [string, string | number][], startY: number) {
  let y = startY;
  doc.setFontSize(10);
  pairs.forEach(([label, value]) => {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(value), 80, y);
    y += 7;
  });
  return y;
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/* ─── Report-specific PDF generators ─────────────────────── */

async function generateProjectsPdf(projectId: string) {
  const data = await fetchReportData('projects', projectId);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Monthly Summary Report');

  y = addSectionTitle(doc, 'Overview', y);
  y = addKVPairs(doc, [
    ['Total Projects', data.total ?? 0],
    ['Active Projects', data.active ?? 0],
    ['Completed Projects', data.completed ?? 0],
    ['Avg Progress', `${data.avg_progress ?? 0}%`],
  ], y);

  if (data.projects?.length) {
    y += 5;
    y = addSectionTitle(doc, 'Project Details', y);
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Status', 'Progress', 'Tasks', 'Sites', 'Budget', 'Actual Cost', 'Delay (days)']],
      body: data.projects.map((p: any) => [
        p.name, p.status, `${p.progress ?? p.task_completion ?? 0}%`,
        `${p.completed_tasks ?? 0}/${p.total_tasks ?? 0}`,
        p.sites ?? 0,
        formatCurrency(p.budget), formatCurrency(p.actual_cost),
        p.delay_days ?? 0
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [38, 72, 231] },
    });
  }

  doc.save('monthly_summary_report.pdf');
}

async function generateFinancePdf(projectId: string) {
  const data = await fetchReportData('finance', projectId);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Finance Report');

  y = addSectionTitle(doc, 'Financial Overview', y);
  y = addKVPairs(doc, [
    ['Total Expenses', formatCurrency(data.total_expenses)],
    ['Total Payments', formatCurrency(data.total_payments)],
    ['Pending Expenses', formatCurrency(data.pending_expenses)],
    ['Approved Expenses', formatCurrency(data.approved_expenses)],
    ['Receivable', formatCurrency(data.receivable)],
    ['Payable', formatCurrency(data.payable)],
    ['Cash Flow', formatCurrency(data.cash_flow)],
  ], y);

  if (data.by_category?.length) {
    y += 5;
    y = addSectionTitle(doc, 'Category-wise Expenses', y);
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount']],
      body: data.by_category.map((c: any) => [c.category, formatCurrency(c.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
    });
  }

  doc.save('finance_report.pdf');
}

async function generateMaterialPdf(projectId: string) {
  const data = await fetchReportData('inventory', projectId);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Material / Inventory Report');

  y = addSectionTitle(doc, 'Inventory Overview', y);
  y = addKVPairs(doc, [
    ['Total Items', data.total_items ?? 0],
    ['Low Stock Items', data.low_stock_count ?? 0],
    ['Stock In (30 days)', data.total_stock_in_30d ?? 0],
    ['Stock Out (30 days)', data.total_stock_out_30d ?? 0],
    ['Daily Consumption Rate', (data.consumption_rate ?? 0).toFixed(1)],
  ], y);

  if (data.low_stock_items?.length) {
    y += 5;
    y = addSectionTitle(doc, 'Low Stock Items', y);
    autoTable(doc, {
      startY: y,
      head: [['Material', 'Site', 'Current Qty', 'Min Qty']],
      body: data.low_stock_items.map((i: any) => [
        i.material ?? '-', i.site ?? '-', i.quantity, i.min_quantity
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 119, 6] },
    });
  }

  doc.save('material_report.pdf');
}

async function generateLabourPdf(projectId: string) {
  const data = await fetchReportData('attendance', projectId);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Labour / Attendance Report');

  y = addSectionTitle(doc, 'Attendance Summary', y);
  y = addKVPairs(doc, [
    ['Total Records', data.total_records ?? 0],
    ['Present', data.present ?? 0],
    ['Absent', data.absent ?? 0],
    ['Half Day', data.half_day ?? 0],
    ['Late', data.late ?? 0],
    ['Total Overtime Hours', data.total_overtime_hours ?? 0],
    ['Attendance Rate', `${data.attendance_rate ?? 0}%`],
  ], y);

  doc.save('labour_report.pdf');
}

async function generateMilestonePdf(projectId: string) {
  const data = await fetchReportData('projects', projectId);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Milestone Progress Report');

  if (data.projects?.length) {
    data.projects.forEach((p: any) => {
      y = addSectionTitle(doc, p.name, y);
      y = addKVPairs(doc, [
        ['Status', p.status],
        ['Progress', `${p.progress ?? p.task_completion ?? 0}%`],
        ['Milestones', p.milestones ?? 0],
        ['Tasks Completed', `${p.completed_tasks ?? 0}/${p.total_tasks ?? 0}`],
        ['Delay (days)', p.delay_days ?? 0],
        ['Budget Variance', formatCurrency(p.budget_variance)],
      ], y);
      y += 5;
    });
  }

  doc.save('milestone_progress_report.pdf');
}

/* ─── Combined "All in One" PDF ──────────────────────────── */

async function generateAllInOnePdf(projectId: string) {
  const [projects, finance, inventory, attendance, workforce, vendors] = await Promise.all([
    fetchReportData('projects', projectId),
    fetchReportData('finance', projectId),
    fetchReportData('inventory', projectId),
    fetchReportData('attendance', projectId),
    fetchReportData('workforce', projectId),
    fetchReportData('vendors', projectId),
  ]);

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // ── Cover page ──
  doc.setFillColor(38, 72, 231);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Complete Project Report', pageW / 2, 100, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('All Reports Combined', pageW / 2, 115, { align: 'center' });
  doc.setFontSize(11);
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageW / 2, 135, { align: 'center' }
  );

  // Table of contents
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Contents', pageW / 2, 165, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const toc = [
    '1. Projects Overview',
    '2. Finance Report',
    '3. Inventory & Materials',
    '4. Labour & Attendance',
    '5. Workforce Summary',
    '6. Vendor Report',
  ];
  toc.forEach((item, i) => {
    doc.text(item, pageW / 2, 180 + i * 10, { align: 'center' });
  });

  // ── Page 2: Projects ──
  doc.addPage();
  let y = addHeader(doc, '1. Projects Overview');
  y = addKVPairs(doc, [
    ['Total Projects', projects.total ?? 0],
    ['Active', projects.active ?? 0],
    ['Completed', projects.completed ?? 0],
    ['Avg Progress', `${projects.avg_progress ?? 0}%`],
  ], y);
  if (projects.projects?.length) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Status', 'Progress', 'Tasks', 'Budget', 'Actual Cost']],
      body: projects.projects.map((p: any) => [
        p.name, p.status, `${p.progress ?? p.task_completion ?? 0}%`,
        `${p.completed_tasks ?? 0}/${p.total_tasks ?? 0}`,
        formatCurrency(p.budget), formatCurrency(p.actual_cost)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [38, 72, 231] },
    });
  }

  // ── Page 3: Finance ──
  doc.addPage();
  y = addHeader(doc, '2. Finance Report');
  y = addKVPairs(doc, [
    ['Total Expenses', formatCurrency(finance.total_expenses)],
    ['Total Payments', formatCurrency(finance.total_payments)],
    ['Pending Expenses', formatCurrency(finance.pending_expenses)],
    ['Cash Flow', formatCurrency(finance.cash_flow)],
    ['Receivable', formatCurrency(finance.receivable)],
    ['Payable', formatCurrency(finance.payable)],
  ], y);
  if (finance.by_category?.length) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Category', 'Amount']],
      body: finance.by_category.map((c: any) => [c.category, formatCurrency(c.amount)]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [16, 185, 129] },
    });
  }

  // ── Page 4: Inventory ──
  doc.addPage();
  y = addHeader(doc, '3. Inventory & Materials');
  y = addKVPairs(doc, [
    ['Total Items', inventory.total_items ?? 0],
    ['Low Stock', inventory.low_stock_count ?? 0],
    ['Stock In (30d)', inventory.total_stock_in_30d ?? 0],
    ['Stock Out (30d)', inventory.total_stock_out_30d ?? 0],
  ], y);
  if (inventory.low_stock_items?.length) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Material', 'Site', 'Qty', 'Min Qty']],
      body: inventory.low_stock_items.map((i: any) => [i.material, i.site, i.quantity, i.min_quantity]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [217, 119, 6] },
    });
  }

  // ── Page 5: Attendance ──
  doc.addPage();
  y = addHeader(doc, '4. Labour & Attendance');
  y = addKVPairs(doc, [
    ['Total Records', attendance.total_records ?? 0],
    ['Present', attendance.present ?? 0],
    ['Absent', attendance.absent ?? 0],
    ['Half Day', attendance.half_day ?? 0],
    ['Late', attendance.late ?? 0],
    ['Overtime Hours', attendance.total_overtime_hours ?? 0],
    ['Attendance Rate', `${attendance.attendance_rate ?? 0}%`],
  ], y);

  // ── Page 6: Workforce ──
  doc.addPage();
  y = addHeader(doc, '5. Workforce Summary');
  y = addKVPairs(doc, [
    ['Total Workers', workforce.total_workers ?? 0],
    ['Active', workforce.active_workers ?? 0],
    ['Assigned to Sites', workforce.assigned_to_sites ?? 0],
    ['Utilization Rate', `${workforce.utilization_rate ?? 0}%`],
    ['Daily Wage (Total)', formatCurrency(workforce.total_daily_wage)],
    ['Est. Monthly Wage', formatCurrency(workforce.estimated_monthly_wage)],
  ], y);
  if (workforce.by_trade?.length) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Trade', 'Count']],
      body: workforce.by_trade.map((t: any) => [t.trade, t.count]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [124, 58, 237] },
    });
  }

  // ── Page 7: Vendors ──
  doc.addPage();
  y = addHeader(doc, '6. Vendor Report');
  y = addKVPairs(doc, [
    ['Total Vendors', vendors.total_vendors ?? 0],
    ['Active', vendors.active_vendors ?? 0],
  ], y);
  if (vendors.vendors?.length) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Type', 'Category', 'Invoices', 'Total Paid', 'Rating']],
      body: vendors.vendors.map((v: any) => [
        v.name, v.type ?? '-', v.category ?? '-',
        v.invoices ?? 0, formatCurrency(v.total_paid), v.avg_rating ?? '-'
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [234, 88, 12] },
    });
  }

  doc.save('complete_project_report.pdf');
}

/* ─── Components ─────────────────────────────────────────── */

type BtnState = 'idle' | 'loading' | 'done' | 'error';

function StatusIcon({ state }: { state: BtnState }) {
  if (state === 'loading') return <Loader2 size={14} className="animate-spin" />;
  if (state === 'done') return <CheckCircle size={14} />;
  if (state === 'error') return <AlertCircle size={14} />;
  return null;
}

function ReportCard({
  icon,
  title,
  sub,
  bg,
  iconColor,
  onPdf,
  onExcel,
  featured = false,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  bg: string;
  iconColor: string;
  onPdf: () => Promise<void>;
  onExcel?: () => Promise<void>;
  featured?: boolean;
}) {
  const [pdfState, setPdfState] = useState<BtnState>('idle');
  const [excelState, setExcelState] = useState<BtnState>('idle');

  const handlePdf = async () => {
    setPdfState('loading');
    try {
      await onPdf();
      setPdfState('done');
      setTimeout(() => setPdfState('idle'), 2000);
    } catch {
      setPdfState('error');
      setTimeout(() => setPdfState('idle'), 3000);
    }
  };

  const handleExcel = async () => {
    if (!onExcel) return;
    setExcelState('loading');
    try {
      await onExcel();
      setExcelState('done');
      setTimeout(() => setExcelState('idle'), 2000);
    } catch {
      setExcelState('error');
      setTimeout(() => setExcelState('idle'), 3000);
    }
  };

  return (
    <div
      className={`
        relative group bg-white rounded-2xl border transition-all duration-300 overflow-hidden
        hover:shadow-lg hover:-translate-y-0.5
        ${featured
          ? 'border-indigo-200 shadow-md ring-1 ring-indigo-100 col-span-full'
          : 'border-gray-100 shadow-sm'
        }
      `}
    >
      {/* Decorative gradient top */}
      {featured && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      )}

      <div className={`p-5 ${featured ? 'flex flex-col sm:flex-row sm:items-center gap-5' : 'flex items-center gap-4'}`}>
        <div
          className={`
            shrink-0 flex items-center justify-center rounded-2xl
            ${featured ? 'size-16' : 'size-12'}
            ${bg}
          `}
          style={{ color: iconColor }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-bold text-gray-900 ${featured ? 'text-lg' : 'text-sm'}`}>
            {title}
          </p>
          <p className={`text-gray-500 mt-0.5 ${featured ? 'text-sm' : 'text-xs'}`}>
            {sub}
          </p>
        </div>

        <div className={`flex gap-2 shrink-0 ${featured ? 'sm:flex-col' : 'flex-col'}`}>
          <button
            onClick={handlePdf}
            disabled={pdfState === 'loading'}
            className={`
              flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl
              transition-all duration-200 min-w-[80px]
              ${pdfState === 'done'
                ? 'bg-green-500 text-white'
                : pdfState === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 shadow-sm hover:shadow'
              }
              disabled:opacity-70
            `}
          >
            <StatusIcon state={pdfState} />
            {pdfState === 'done' ? 'Done!' : pdfState === 'error' ? 'Failed' : pdfState === 'loading' ? 'Generating...' : 'PDF'}
          </button>

          {onExcel && (
            <button
              onClick={handleExcel}
              disabled={excelState === 'loading'}
              className={`
                flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl
                transition-all duration-200 min-w-[80px]
                ${excelState === 'done'
                  ? 'bg-green-100 text-green-700'
                  : excelState === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
                disabled:opacity-70
              `}
            >
              <StatusIcon state={excelState} />
              {excelState === 'done' ? 'Done!' : excelState === 'error' ? 'Failed' : excelState === 'loading' ? 'Downloading...' : 'Excel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────── */

export default function ReportsPage() {
  const { activeProjectId } = useProject();

  if (!activeProjectId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="size-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-5">
          <FileBarChart size={36} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">No Project Selected</h2>
        <p className="text-sm text-gray-500 mt-2 max-w-xs">
          Please select a project from the top bar to view and generate reports.
        </p>
      </div>
    );
  }

  const reports = [
    {
      icon: <Layers size={28} />,
      title: 'Complete Project Report',
      sub: 'All reports combined into a single comprehensive PDF — Projects, Finance, Materials, Labour, Workforce & Vendors',
      bg: 'bg-gradient-to-br from-indigo-50 to-purple-50',
      iconColor: '#4F46E5',
      featured: true,
      pdfFn: () => generateAllInOnePdf(activeProjectId),
    },
    {
      icon: <FileBarChart size={22} />,
      title: 'Monthly Summary',
      sub: 'Project overview, progress & task completion',
      bg: 'bg-indigo-50',
      iconColor: '#2648E7',
      csvType: 'Monthly Summary',
      pdfFn: () => generateProjectsPdf(activeProjectId),
    },
    {
      icon: <IndianRupee size={22} />,
      title: 'Finance Report',
      sub: 'Expenses, payments, cash flow & receivables',
      bg: 'bg-emerald-50',
      iconColor: '#059669',
      csvType: 'Finance Report',
      pdfFn: () => generateFinancePdf(activeProjectId),
    },
    {
      icon: <Package size={22} />,
      title: 'Material Report',
      sub: 'Inventory, low stock alerts & consumption',
      bg: 'bg-amber-50',
      iconColor: '#D97706',
      csvType: 'Material Report',
      pdfFn: () => generateMaterialPdf(activeProjectId),
    },
    {
      icon: <Users size={22} />,
      title: 'Labour Report',
      sub: 'Attendance, overtime & rate summary',
      bg: 'bg-purple-50',
      iconColor: '#7C3AED',
      csvType: 'Labour Report',
      pdfFn: () => generateLabourPdf(activeProjectId),
    },
    {
      icon: <FileBarChart size={22} />,
      title: 'Milestone Progress',
      sub: 'Timeline, milestones & DPR-based progress',
      bg: 'bg-sky-50',
      iconColor: '#0284C7',
      csvType: 'Milestone Progress Report',
      pdfFn: () => generateMilestonePdf(activeProjectId),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate PDF or Excel reports for the selected project
        </p>
      </div>

      {/* Section label */}
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
        Generate Report
      </p>

      {/* Report cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {reports.map((r) => (
          <ReportCard
            key={r.title}
            icon={r.icon}
            title={r.title}
            sub={r.sub}
            bg={r.bg}
            iconColor={r.iconColor}
            featured={r.featured}
            onPdf={r.pdfFn}
            onExcel={
              r.csvType
                ? () => downloadCsv(r.csvType!, activeProjectId)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

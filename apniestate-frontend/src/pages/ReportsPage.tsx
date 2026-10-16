import React, { useState, useCallback } from 'react';
import {
  FileBarChart, IndianRupee, Package, Users, FileText,
  Download, Loader2, CheckCircle, AlertCircle, Layers, Calendar
} from 'lucide-react';
import { useProject } from '@/context/ProjectContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DateRangeFilter from '@/components/shared/DateRangeFilter';
import { formatDateRangeDisplay } from '@/utils/dateFilter';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/* ─── Helpers ────────────────────────────────────────────── */

function getToken() {
  return localStorage.getItem('access_token');
}

async function fetchReportData(type: string, projectId: string, from?: string, to?: string) {
  const token = getToken();
  let url = `${API_BASE}/reports?type=${encodeURIComponent(type)}&project_id=${projectId}`;
  if (from) url += `&from=${encodeURIComponent(from)}&start_date=${encodeURIComponent(from)}`;
  if (to) url += `&to=${encodeURIComponent(to)}&end_date=${encodeURIComponent(to)}`;
  url += `&_t=${Date.now()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
  });
  if (!res.ok) throw new Error('Failed to fetch report data');
  const json = await res.json();
  return json.data ?? json;
}

async function downloadCsv(type: string, projectId: string, from?: string, to?: string) {
  const token = getToken();
  let url = `${API_BASE}/reports/download?project_id=${projectId}&type=${encodeURIComponent(type)}`;
  if (from) url += `&from=${encodeURIComponent(from)}&start_date=${encodeURIComponent(from)}`;
  if (to) url += `&to=${encodeURIComponent(to)}&end_date=${encodeURIComponent(to)}`;
  url += `&_t=${Date.now()}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Download failed');
  const filename =
    res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
    `${type.toLowerCase().replace(/\s+/g, '_')}${from && to ? `_${from}_to_${to}` : ''}.csv`;
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}

/* ─── PDF Generator Helpers ──────────────────────────────── */

function addHeader(doc: jsPDF, title: string, projectName?: string, dateRangeText?: string) {
  const pageW = doc.internal.pageSize.getWidth();
  // Premium dark header with brand blue accent
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageW, 46, 'F');
  doc.setFillColor(38, 72, 231); // Brand blue
  doc.rect(0, 46, pageW, 4, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 22);

  if (projectName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 195, 255);
    doc.text(`Project: ${projectName}`, 14, 31);
  }

  if (dateRangeText && dateRangeText !== 'All Time') {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 191, 36); // Amber-400 accent for active period
    doc.text(`PERIOD: ${dateRangeText.toUpperCase()}`, 14, 40);
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 195, 255);
    doc.text(`PERIOD: ALL TIME`, 14, 40);
  }

  doc.setFontSize(8);
  doc.setTextColor(180, 195, 255);
  doc.setFont('helvetica', 'normal');
  doc.text(`REPORT GENERATED`, pageW - 14, 18, { align: 'right' });
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    pageW - 14, 25, { align: 'right' }
  );

  doc.setTextColor(0, 0, 0);
  return 64; // y position after header
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(title.toUpperCase(), 14, y);
  
  // Premium dual-tone underline
  doc.setDrawColor(38, 72, 231);
  doc.setLineWidth(1.5);
  doc.line(14, y + 4, 44, y + 4);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(44, y + 4, doc.internal.pageSize.getWidth() - 14, y + 4);
  
  doc.setTextColor(0, 0, 0);
  return y + 14;
}

function addKVPairs(doc: jsPDF, pairs: [string, string | number][], startY: number) {
  let y = startY;
  doc.setFontSize(10);
  pairs.forEach(([label, value]) => {
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(`${label}:`, 16, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value), 80, y);
    y += 8;
  });
  return y;
}

function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages
    ? (doc as any).internal.getNumberOfPages()
    : (doc as any).getNumberOfPages
    ? (doc as any).getNumberOfPages()
    : doc.internal.pages.length - 1;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageH - 15, pageW - 14, pageH - 15);
    
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('Apni Estate - Premium Construction Management System', 14, pageH - 8);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 8, { align: 'right' });
  }
}

function formatCurrency(n: number | null | undefined) {
  if (n == null) return '₹0';
  return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

/* ─── Report-specific PDF generators ─────────────────────── */

async function generateProjectsPdf(projectId: string, projectName?: string, from?: string, to?: string) {
  const data = await fetchReportData('projects', projectId, from, to);
  const rangeText = formatDateRangeDisplay(from, to);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Monthly Summary Report', projectName, rangeText);

  y = addSectionTitle(doc, 'Overview', y);
  y = addKVPairs(doc, [
    ['Total Projects', data.total ?? 0],
    ['Active Projects', data.active ?? 0],
    ['Completed Projects', data.completed ?? 0],
    ['Avg Progress', `${data.avg_progress ?? 0}%`],
    ['Report Period', rangeText],
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

  addFooter(doc);
  const dateSuffix = from && to ? `_${from}_to_${to}` : '';
  doc.save(`monthly_summary_report${dateSuffix}.pdf`);
}

async function generateFinancePdf(projectId: string, projectName?: string, from?: string, to?: string) {
  const data = await fetchReportData('finance', projectId, from, to);
  const rangeText = formatDateRangeDisplay(from, to);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Finance Report', projectName, rangeText);

  y = addSectionTitle(doc, 'Financial Overview', y);
  const pairs: [string, string | number][] = [
    ['Report Period', rangeText],
    ['Total Expenses', formatCurrency(data.total_expenses)],
    ['Total Payments', formatCurrency(data.total_payments)],
    ['Pending Expenses', formatCurrency(data.pending_expenses)],
    ['Approved Expenses', formatCurrency(data.approved_expenses)],
    ['Receivable', formatCurrency(data.receivable)],
    ['Payable', formatCurrency(data.payable)],
    ['Net Cash Flow', formatCurrency(data.cash_flow)],
  ];
  if (data.total_labour_cost) {
    pairs.push(['Labour & Wages Cost', formatCurrency(data.total_labour_cost)]);
  }

  y = addKVPairs(doc, pairs, y);

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

  addFooter(doc);
  const dateSuffix = from && to ? `_${from}_to_${to}` : '';
  doc.save(`finance_report${dateSuffix}.pdf`);
}

async function generateMaterialPdf(projectId: string, projectName?: string, from?: string, to?: string) {
  const data = await fetchReportData('inventory', projectId, from, to);
  const rangeText = formatDateRangeDisplay(from, to);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Material / Inventory Report', projectName, rangeText);

  y = addSectionTitle(doc, 'Inventory Overview', y);
  y = addKVPairs(doc, [
    ['Report Period', rangeText],
    ['Total Items', data.total_items ?? 0],
    ['Low Stock Items', data.low_stock_count ?? 0],
    ['Stock In (Period)', data.total_stock_in_30d ?? 0],
    ['Stock Out (Period)', data.total_stock_out_30d ?? 0],
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

  addFooter(doc);
  const dateSuffix = from && to ? `_${from}_to_${to}` : '';
  doc.save(`material_report${dateSuffix}.pdf`);
}

async function generateLabourPdf(projectId: string, projectName?: string, from?: string, to?: string) {
  const data = await fetchReportData('attendance', projectId, from, to);
  const rangeText = formatDateRangeDisplay(from, to);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Labour / Attendance Report', projectName, rangeText);

  y = addSectionTitle(doc, 'Attendance Summary', y);
  const pairs: [string, string | number][] = [
    ['Report Period', rangeText],
    ['Total Records / Workers', data.total_records ?? 0],
    ['Present', data.present ?? 0],
    ['Absent', data.absent ?? 0],
    ['Half Day', data.half_day ?? 0],
    ['Late', data.late ?? 0],
    ['Total Overtime Hours', data.total_overtime_hours ?? 0],
    ['Attendance Rate', `${data.attendance_rate ?? 0}%`],
  ];
  if (data.total_labour_cost) {
    pairs.push(['Total Labour Cost', formatCurrency(data.total_labour_cost)]);
  }

  y = addKVPairs(doc, pairs, y);

  if (data.categories?.length) {
    y += 5;
    y = addSectionTitle(doc, 'Category-wise Labour Attendance', y);
    autoTable(doc, {
      startY: y,
      head: [['Trade / Category', 'Present', 'Half Day', 'OT Hours', 'Cost']],
      body: data.categories.map((c: any) => [
        c.name,
        c.present ?? 0,
        c.halfDay ?? 0,
        c.otHours ?? 0,
        formatCurrency(c.cost),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [124, 58, 237] },
    });
  }

  addFooter(doc);
  const dateSuffix = from && to ? `_${from}_to_${to}` : '';
  doc.save(`labour_report${dateSuffix}.pdf`);
}

async function generateMilestonePdf(projectId: string, projectName?: string, from?: string, to?: string) {
  const data = await fetchReportData('projects', projectId, from, to);
  const rangeText = formatDateRangeDisplay(from, to);
  const doc = new jsPDF();
  let y = addHeader(doc, 'Milestone Progress Report', projectName, rangeText);

  if (data.projects?.length) {
    data.projects.forEach((p: any) => {
      y = addSectionTitle(doc, p.name, y);
      y = addKVPairs(doc, [
        ['Report Period', rangeText],
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

  addFooter(doc);
  const dateSuffix = from && to ? `_${from}_to_${to}` : '';
  doc.save(`milestone_progress_report${dateSuffix}.pdf`);
}

/* ─── Combined "All in One" PDF ──────────────────────────── */

async function generateAllInOnePdf(projectId: string, projectName?: string, from?: string, to?: string) {
  const [projects, finance, inventory, attendance, workforce, vendors] = await Promise.all([
    fetchReportData('projects', projectId, from, to),
    fetchReportData('finance', projectId, from, to),
    fetchReportData('inventory', projectId, from, to),
    fetchReportData('attendance', projectId, from, to),
    fetchReportData('workforce', projectId, from, to),
    fetchReportData('vendors', projectId, from, to),
  ]);

  const rangeText = formatDateRangeDisplay(from, to);
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  // ── Cover page ──
  doc.setFillColor(38, 72, 231);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Complete Project Report', pageW / 2, 90, { align: 'center' });
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(projectName ? `Project: ${projectName}` : 'All Project Modules Combined', pageW / 2, 105, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(251, 191, 36);
  doc.text(`Period: ${rangeText}`, pageW / 2, 120, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageW / 2, 138, { align: 'center' }
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
  let y = addHeader(doc, '1. Projects Overview', projectName, rangeText);
  y = addKVPairs(doc, [
    ['Period', rangeText],
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
  y = addHeader(doc, '2. Finance Report', projectName, rangeText);
  const finPairs: [string, string | number][] = [
    ['Period', rangeText],
    ['Total Expenses', formatCurrency(finance.total_expenses)],
    ['Total Payments', formatCurrency(finance.total_payments)],
    ['Pending Expenses', formatCurrency(finance.pending_expenses)],
    ['Cash Flow', formatCurrency(finance.cash_flow)],
    ['Receivable', formatCurrency(finance.receivable)],
    ['Payable', formatCurrency(finance.payable)],
  ];
  if (finance.total_labour_cost) {
    finPairs.push(['Labour Cost', formatCurrency(finance.total_labour_cost)]);
  }
  y = addKVPairs(doc, finPairs, y);
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
  y = addHeader(doc, '3. Inventory & Materials', projectName, rangeText);
  y = addKVPairs(doc, [
    ['Period', rangeText],
    ['Total Items', inventory.total_items ?? 0],
    ['Low Stock', inventory.low_stock_count ?? 0],
    ['Stock In (Period)', inventory.total_stock_in_30d ?? 0],
    ['Stock Out (Period)', inventory.total_stock_out_30d ?? 0],
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
  y = addHeader(doc, '4. Labour & Attendance', projectName, rangeText);
  const attPairs: [string, string | number][] = [
    ['Period', rangeText],
    ['Total Records / Workers', attendance.total_records ?? 0],
    ['Present', attendance.present ?? 0],
    ['Absent', attendance.absent ?? 0],
    ['Half Day', attendance.half_day ?? 0],
    ['Late', attendance.late ?? 0],
    ['Overtime Hours', attendance.total_overtime_hours ?? 0],
    ['Attendance Rate', `${attendance.attendance_rate ?? 0}%`],
  ];
  if (attendance.total_labour_cost) {
    attPairs.push(['Labour Cost', formatCurrency(attendance.total_labour_cost)]);
  }
  y = addKVPairs(doc, attPairs, y);
  if (attendance.categories?.length) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Trade', 'Present', 'Half Day', 'OT Hours', 'Cost']],
      body: attendance.categories.map((c: any) => [
        c.name, c.present ?? 0, c.halfDay ?? 0, c.otHours ?? 0, formatCurrency(c.cost)
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [124, 58, 237] },
    });
  }

  // ── Page 6: Workforce ──
  doc.addPage();
  y = addHeader(doc, '5. Workforce Summary', projectName, rangeText);
  y = addKVPairs(doc, [
    ['Period', rangeText],
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
  y = addHeader(doc, '6. Vendor Report', projectName, rangeText);
  y = addKVPairs(doc, [
    ['Period', rangeText],
    ['Total Vendors', vendors.total_vendors ?? 0],
    ['Active', vendors.active_vendors ?? 0],
  ], y);
  if (vendors.vendors?.length) {
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Type', 'Category', 'Invoices', 'Total Paid', 'Rating']],
      body: vendors.vendors.map((v: any) => [
        v.name, v.type ?? '-', v.category ?? '-', v.invoices, formatCurrency(v.total_paid),
        v.avg_rating != null ? `★ ${v.avg_rating}` : 'N/A'
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [2, 132, 199] },
    });
  }

  addFooter(doc);
  const dateSuffix = from && to ? `_${from}_to_${to}` : '';
  doc.save(`complete_project_report${dateSuffix}.pdf`);
}

/* ─── Status icon helper ─────────────────────────────────── */

function StatusIcon({ state }: { state: 'idle' | 'loading' | 'done' | 'error' }) {
  if (state === 'loading') return <Loader2 size={14} className="animate-spin" />;
  if (state === 'done') return <CheckCircle size={14} className="text-white" />;
  if (state === 'error') return <AlertCircle size={14} className="text-white" />;
  return <Download size={14} />;
}

/* ─── Report Card Component ──────────────────────────────── */

interface ReportCardProps {
  icon: React.ReactNode;
  title: string;
  sub: string;
  bg: string;
  iconColor: string;
  featured?: boolean;
  onPdf: () => Promise<void>;
  onExcel?: () => Promise<void>;
  dateRangeText?: string;
}

function ReportCard({
  icon,
  title,
  sub,
  bg,
  iconColor,
  featured,
  onPdf,
  onExcel,
  dateRangeText,
}: ReportCardProps) {
  const [pdfState, setPdfState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [excelState, setExcelState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handlePdf = async () => {
    try {
      setPdfState('loading');
      await onPdf();
      setPdfState('done');
      setTimeout(() => setPdfState('idle'), 2500);
    } catch {
      setPdfState('error');
      setTimeout(() => setPdfState('idle'), 3000);
    }
  };

  const handleExcel = async () => {
    if (!onExcel) return;
    try {
      setExcelState('loading');
      await onExcel();
      setExcelState('done');
      setTimeout(() => setExcelState('idle'), 2500);
    } catch {
      setExcelState('error');
      setTimeout(() => setExcelState('idle'), 3000);
    }
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-5
        transition-all duration-200 hover:shadow-md hover:border-gray-200
        ${featured ? 'sm:col-span-2 ring-1 ring-indigo-500/10' : ''}
      `}
    >
      <div className={`flex items-start gap-4 ${featured ? 'sm:flex-row flex-col' : ''}`}>
        <div
          className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${bg}`}
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
          {dateRangeText && dateRangeText !== 'All Time' && (
            <p className="text-[11px] font-bold text-[#2648E7] mt-1.5 flex items-center gap-1">
              <Calendar size={11} /> {dateRangeText}
            </p>
          )}
        </div>

        <div className={`flex gap-2 shrink-0 ${featured ? 'sm:flex-col' : 'flex-col'}`}>
          <button
            onClick={handlePdf}
            disabled={pdfState === 'loading'}
            className={`
              flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl
              transition-all duration-200 min-w-[80px] cursor-pointer
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
                transition-all duration-200 min-w-[80px] cursor-pointer
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
  const { activeProjectId, activeProject } = useProject();
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [rangeLabel, setRangeLabel] = useState<string>('All Time');

  const handleDateChange = (from: string, to: string, label?: string) => {
    setFromDate(from);
    setToDate(to);
    setRangeLabel(label || formatDateRangeDisplay(from, to));
  };

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

  const projectName = activeProject?.name || 'Current Project';
  const displayRange = formatDateRangeDisplay(fromDate, toDate);

  const reports = [
    {
      icon: <Layers size={28} />,
      title: 'Complete Project Report',
      sub: 'All reports combined into a single comprehensive PDF — Projects, Finance, Materials, Labour, Workforce & Vendors',
      bg: 'bg-gradient-to-br from-indigo-50 to-purple-50',
      iconColor: '#4F46E5',
      featured: true,
      pdfFn: () => generateAllInOnePdf(activeProjectId, projectName, fromDate, toDate),
    },
    {
      icon: <FileBarChart size={22} />,
      title: 'Monthly Summary',
      sub: 'Project overview, progress & task completion',
      bg: 'bg-indigo-50',
      iconColor: '#2648E7',
      csvType: 'Monthly Summary',
      pdfFn: () => generateProjectsPdf(activeProjectId, projectName, fromDate, toDate),
    },
    {
      icon: <IndianRupee size={22} />,
      title: 'Finance Report',
      sub: 'Expenses, payments, cash flow & receivables',
      bg: 'bg-emerald-50',
      iconColor: '#059669',
      csvType: 'Finance Report',
      pdfFn: () => generateFinancePdf(activeProjectId, projectName, fromDate, toDate),
    },
    {
      icon: <Package size={22} />,
      title: 'Material Report',
      sub: 'Inventory, low stock alerts & consumption',
      bg: 'bg-amber-50',
      iconColor: '#D97706',
      csvType: 'Material Report',
      pdfFn: () => generateMaterialPdf(activeProjectId, projectName, fromDate, toDate),
    },
    {
      icon: <Users size={22} />,
      title: 'Labour Report',
      sub: 'Attendance, overtime & rate summary',
      bg: 'bg-purple-50',
      iconColor: '#7C3AED',
      csvType: 'Labour Report',
      pdfFn: () => generateLabourPdf(activeProjectId, projectName, fromDate, toDate),
    },
    {
      icon: <FileBarChart size={22} />,
      title: 'Milestone Progress',
      sub: 'Timeline, milestones & DPR-based progress',
      bg: 'bg-sky-50',
      iconColor: '#0284C7',
      csvType: 'Milestone Progress Report',
      pdfFn: () => generateMilestonePdf(activeProjectId, projectName, fromDate, toDate),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Report Generator</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate custom date-filtered PDF and Excel reports for <span className="font-semibold text-gray-900">{projectName}</span>
        </p>
      </div>

      {/* Date Range Selector */}
      <DateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onChange={handleDateChange}
        label="Report Date Range"
        allowedPresets={['all_time', 'today', 'this_week', 'this_month', 'last_month', 'last_30_days', 'this_quarter', 'custom']}
      />

      {/* Section label */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Available Reports
        </p>
        <span className="text-xs text-muted-foreground font-medium">
          Period: <strong className="text-foreground">{displayRange}</strong>
        </span>
      </div>

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
                ? () => downloadCsv(r.csvType!, activeProjectId, fromDate, toDate)
                : undefined
            }
            dateRangeText={displayRange}
          />
        ))}
      </div>
    </div>
  );
}

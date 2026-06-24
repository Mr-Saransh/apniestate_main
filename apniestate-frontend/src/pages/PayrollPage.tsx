import { useState, useEffect } from 'react';
import { Download, Calculator, Users, Filter, Calendar, Clock } from 'lucide-react';
import { payrollApi, type PayrollRecord } from '@/api/payroll';
import { apiClient } from '@/api/client';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/shared/StatCard';
import StatusBadge from '@/components/shared/StatusBadge';

export default function PayrollPage() {
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSiteId, setSelectedSiteId] = useState('');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchSitesAndPayroll = async () => {
    setLoading(true);
    try {
      const sitesRes = await apiClient.get<any[]>('/sites');
      if (sitesRes.data) setSites(sitesRes.data);

      const payrollRes = await payrollApi.getPayroll(selectedMonth, selectedYear, selectedSiteId);
      if (payrollRes.data) setRecords(payrollRes.data);
    } catch (err) {
      console.error('Failed to load payroll data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitesAndPayroll();
  }, [selectedMonth, selectedYear, selectedSiteId]);

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      await payrollApi.generatePayroll(selectedMonth, selectedYear, selectedSiteId);
      await fetchSitesAndPayroll();
      alert('Payroll calculated successfully!');
    } catch (err) {
      console.error('Failed to generate payroll', err);
      alert('Failed to generate payroll. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Worker Name', 'Trade', 'Site', 'Contractor', 'Daily Rate', 'Present', 'Half Days', 'Absent', 'Leave', 'OT Hours', 'Gross Pay', 'Net Pay'];
    const rows = records.map(r => [
      r.workerName,
      r.trade,
      r.siteName || 'All',
      r.contractorName || 'Direct',
      r.dailyRate,
      r.presentDays,
      r.halfDays,
      r.absentDays,
      r.leaveDays,
      r.overtimeHours,
      r.grossAmount,
      r.netAmount
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payroll_${months[selectedMonth - 1]}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const totalNetPay = records.reduce((sum, r) => sum + r.netAmount, 0);
  const totalWorkers = records.length;
  const totalOTHours = records.reduce((sum, r) => sum + r.overtimeHours, 0);

  return (
    <div className="animate-fade-in texture-grain" style={{ paddingBottom: 'var(--space-12)' }}>
      <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Payroll & Registers</h1>
          <p className="page-subtitle">Generate monthly attendance registers and calculate worker wages</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV} disabled={records.length === 0}>
            <Download size={18} />
            Export CSV
          </button>
          <button className="btn btn-primary" onClick={handleGeneratePayroll} disabled={generating}>
            <Calculator size={18} />
            {generating ? 'Calculating...' : 'Run Calculations'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg-warm)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <Calendar size={18} color="var(--color-text-secondary)" />
            <select
              className="form-input form-select"
              style={{ border: 'none', background: 'transparent', width: '130px', fontWeight: 'bold' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              className="form-input form-select"
              style={{ border: 'none', background: 'transparent', width: '90px', fontWeight: 'bold' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', background: 'var(--color-bg-warm)', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)' }}>
            <Filter size={18} color="var(--color-text-secondary)" />
            <select
              className="form-input form-select"
              style={{ border: 'none', background: 'transparent', width: '200px' }}
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
            >
              <option value="">All Sites</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
        <StatCard icon={<Users size={20} />} label="Calculated Workers" value={totalWorkers} color="#3B82F6" bgColor="rgba(59,130,246,0.1)" />
        <StatCard icon={<Calculator size={20} />} label="Total Wage Liability" value={`₹${totalNetPay.toLocaleString()}`} color="#10B981" bgColor="rgba(16,185,129,0.1)" />
        <StatCard icon={<Clock size={20} />} label="Total OT Hours" value={`${totalOTHours} hrs`} color="#F59E0B" bgColor="rgba(245,158,11,0.1)" />
      </div>

      {loading ? (
        <LoadingSpinner size="lg" />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Calculator size={36} />}
          title="No payroll records found"
          description={`Click 'Run Calculations' to generate the payroll for ${months[selectedMonth - 1]} ${selectedYear}.`}
          action={
            <button className="btn btn-primary" onClick={handleGeneratePayroll} disabled={generating}>
              Run Calculations
            </button>
          }
        />
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', minWidth: '800px' }}>
            <thead>
              <tr>
                <th>Worker</th>
                <th>Trade</th>
                <th>Daily Rate</th>
                <th>P / H / A</th>
                <th>OT (hrs)</th>
                <th>Gross Pay</th>
                <th>Net Payable</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map(record => (
                <tr key={record.id} className="hover-row">
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{record.workerName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{record.siteName || 'All Sites'}</div>
                  </td>
                  <td>{record.trade}</td>
                  <td>₹{record.dailyRate}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px', fontSize: '12px' }}>
                      <span style={{ color: '#10B981' }} title="Present">{record.presentDays}</span> /
                      <span style={{ color: '#F59E0B' }} title="Half Day">{record.halfDays}</span> /
                      <span style={{ color: '#EF4444' }} title="Absent">{record.absentDays}</span>
                    </div>
                  </td>
                  <td>{record.overtimeHours}</td>
                  <td>₹{record.grossAmount.toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>₹{record.netAmount.toLocaleString()}</td>
                  <td>
                    <StatusBadge status={record.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

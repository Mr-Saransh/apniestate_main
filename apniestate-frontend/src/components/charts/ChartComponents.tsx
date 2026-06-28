import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Custom tooltip to match premium dark UI theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'var(--color-surface, #1e293b)',
        border: '1px solid var(--color-border, #334155)',
        padding: '12px 16px',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
      }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-muted, #94a3b8)' }}>{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} style={{ margin: '4px 0', fontSize: '13px', fontWeight: 600, color: p.color || p.fill }}>
            {p.name}: {typeof p.value === 'number' && p.value > 1000 ? `₹${p.value.toLocaleString()}` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 1. Area Chart Widget
interface AreaChartProps {
  data: any[];
  xKey: string;
  dataKeys: string[];
  colors?: string[];
  height?: number;
}
export function AreaChartWidget({ data, xKey, dataKeys, colors = ['#3B82F6', '#10B981'], height = 280 }: AreaChartProps) {
  if (!data || data.length === 0) {
    return <EmptyStateMessage />;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {dataKeys.map((key, idx) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[idx] || '#3B82F6'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={colors[idx] || '#3B82F6'} stopOpacity={0.0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={xKey} stroke="var(--color-text-muted, #64748b)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--color-text-muted, #64748b)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          {dataKeys.map((key, idx) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx] || '#3B82F6'}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Bar Chart Widget
interface BarChartProps {
  data: any[];
  xKey: string;
  dataKeys: string[];
  colors?: string[];
  height?: number;
  stacked?: boolean;
}
export function BarChartWidget({ data, xKey, dataKeys, colors = ['#3B82F6', '#F59E0B'], height = 280, stacked = false }: BarChartProps) {
  if (!data || data.length === 0) {
    return <EmptyStateMessage />;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={xKey} stroke="var(--color-text-muted, #64748b)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--color-text-muted, #64748b)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          {dataKeys.map((key, idx) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[idx] || '#3B82F6'}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Line Chart Widget
interface LineChartProps {
  data: any[];
  xKey: string;
  dataKeys: string[];
  colors?: string[];
  height?: number;
}
export function LineChartWidget({ data, xKey, dataKeys, colors = ['#8B5CF6'], height = 280 }: LineChartProps) {
  if (!data || data.length === 0) {
    return <EmptyStateMessage />;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey={xKey} stroke="var(--color-text-muted, #64748b)" fontSize={11} tickLine={false} />
          <YAxis stroke="var(--color-text-muted, #64748b)" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
          {dataKeys.map((key, idx) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[idx] || '#8B5CF6'}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Donut / Pie Chart Widget
interface DonutChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  height?: number;
  innerRadius?: number;
}
export function DonutChartWidget({
  data,
  colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'],
  height = 240,
  innerRadius = 60
}: DonutChartProps) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return <EmptyStateMessage />;
  }

  return (
    <div style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={innerRadius + 20}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [`${value}`, 'Count']} />
          <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// 5. Progress Ring Widget
export function ProgressRingWidget({ percentage, size = 60, strokeWidth = 6, color = '#3B82F6' }: { percentage: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Foreground circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span style={{ position: 'absolute', fontSize: `${size * 0.22}px`, fontWeight: 700, color: 'var(--color-text)' }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

// 6. Mini Sparkline
export function SparklineWidget({ data, dataKey, color = '#3B82F6', width = 100, height = 30 }: { data: any[]; dataKey: string; color?: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Private helper empty state
function EmptyStateMessage() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: '160px',
      color: 'var(--color-text-muted, #64748b)',
      fontSize: '13px',
      fontWeight: 500,
      background: 'rgba(255,255,255,0.01)',
      border: '1px dashed var(--color-border, rgba(255,255,255,0.05))',
      borderRadius: '16px'
    }}>
      No analytics data found for this period
    </div>
  );
}

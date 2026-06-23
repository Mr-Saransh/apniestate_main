import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartOptions } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  data: number[];
  labels: string[];
  colors?: string[];
  title?: string;
}

export default function PieChart({ data, labels, colors, title }: PieChartProps) {
  const defaultColors = [
    'rgba(0, 102, 255, 0.85)', // primary
    'rgba(52, 199, 89, 0.85)', // success
    'rgba(255, 149, 0, 0.85)', // warning
    'rgba(255, 59, 48, 0.85)', // danger
    'rgba(142, 142, 147, 0.85)' // neutral
  ];

  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors || defaultColors,
        borderWidth: 0,
        hoverOffset: 8
      },
    ],
  };

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--color-text-muted)',
          font: {
            family: "'Inter', sans-serif",
            size: 12
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'var(--color-surface)',
        titleColor: 'var(--color-text)',
        bodyColor: 'var(--color-text-muted)',
        borderColor: 'var(--color-border)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 8,
        usePointStyle: true,
        cornerRadius: 8,
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
      {title && <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-text)' }}>{title}</h3>}
      <div style={{ flex: 1, position: 'relative' }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}

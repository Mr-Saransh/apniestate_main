import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend, type ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface BarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  title?: string;
  label?: string;
}

export default function BarChart({ data, labels, color, title, label }: BarChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        label: label || 'Value',
        data,
        backgroundColor: color || 'rgba(0, 102, 255, 0.85)',
        borderRadius: 6,
        barPercentage: 0.6,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'var(--color-border)',
        },
        ticks: {
          color: 'var(--color-text-muted)',
          font: { family: "'Inter', sans-serif" }
        },
        border: { display: false }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--color-text-muted)',
          font: { family: "'Inter', sans-serif" }
        },
        border: { display: false }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'var(--color-surface)',
        titleColor: 'var(--color-text)',
        bodyColor: 'var(--color-text-muted)',
        borderColor: 'var(--color-border)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
      }
    }
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', minHeight: '280px', display: 'flex', flexDirection: 'column' }}>
      {title && <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px', color: 'var(--color-text)' }}>{title}</h3>}
      <div style={{ flex: 1, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

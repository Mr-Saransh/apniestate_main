import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ProjectOverviewChartProps {
  labels: string[];
  planned: number[];
  actual: number[];
}

export default function ProjectOverviewChart({
  labels,
  planned,
  actual,
}: ProjectOverviewChartProps) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Planned',
        data: planned,
        backgroundColor: '#0A2091',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
      {
        label: 'Actual',
        data: actual,
        backgroundColor: '#004D40',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: {
            family: 'Poppins',
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: '#1A1A2E',
        titleFont: { family: 'Poppins', size: 13 },
        bodyFont: { family: 'Poppins', size: 12 },
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Poppins', size: 12 },
          color: '#6B7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: '#F0F1F5' },
        ticks: {
          font: { family: 'Poppins', size: 12 },
          color: '#6B7280',
        },
      },
    },
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
}

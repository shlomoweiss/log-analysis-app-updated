import React from 'react';
import { useSelector } from 'react-redux';
import { Chart as ChartJS, TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(TimeScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TimelineVisualization = () => {
  const { results } = useSelector(state => state.query);

  if (!results || results.length === 0) {
    return null;
  }

  // Group logs by time intervals (hourly)
  const groupedByTime = results.reduce((acc, log) => {
    const timestamp = new Date(log.timestamp);
    // Round to the nearest hour for grouping
    const hourKey = new Date(
      timestamp.getFullYear(),
      timestamp.getMonth(),
      timestamp.getDate(),
      timestamp.getHours()
    ).toISOString();
    
    if (!acc[hourKey]) {
      acc[hourKey] = 0;
    }
    acc[hourKey]++;
    return acc;
  }, {});

  // Sort timestamps
  const sortedTimestamps = Object.keys(groupedByTime).sort();

  const data = {
    labels: sortedTimestamps,
    datasets: [
      {
        label: 'Log Count',
        data: sortedTimestamps.map(timestamp => groupedByTime[timestamp]),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          tooltipFormat: 'PPP p'
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Log Count'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Log Timeline'
      }
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Timeline Visualization</h2>
      <div className="h-64">
        <Line options={options} data={data} />
      </div>
    </div>
  );
};

export default TimelineVisualization;

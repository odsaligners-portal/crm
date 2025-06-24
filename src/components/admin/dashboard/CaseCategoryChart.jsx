"use client";
import React from 'react';
import Chart from 'react-apexcharts';

const CaseCategoryChart = ({ series = [], labels = [] }) => {
  const options = {
    chart: {
      type: 'pie',
      height: 350,
    },
    labels: labels,
    dataLabels: {
      enabled: true,
      formatter: function (val, opts) {
        // Show the raw number count
        return opts.w.config.series[opts.seriesIndex];
      },
    },
    legend: {
      show: false, // Disable the default legend
    },
    colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f97316', '#ec4899', '#f59e0b', '#64748b'],
    tooltip: {
      custom: function({ series, seriesIndex, w }) {
        const label = w.globals.labels[seriesIndex];
        const value = series[seriesIndex];
        const color = w.globals.colors[seriesIndex];
        
        return `<div class="p-3 text-white font-semibold rounded" style="background-color: ${color};">
          <span>${label}: ${value} patients</span>
        </div>`;
      }
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800 transition-all duration-300 hover:shadow-2xl">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Case Category Breakdown</h3>
      <div className="flex justify-center items-center h-full">
        <Chart options={options} series={series} type="pie" width={320} />
      </div>

      {/* Custom Legend */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center text-sm">
            <span
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: options.colors[index % options.colors.length] }}
            ></span>
            <span className="text-gray-600 dark:text-gray-400">{label}:</span>
            <span className="font-semibold text-gray-800 dark:text-white ml-1.5">{series[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseCategoryChart; 
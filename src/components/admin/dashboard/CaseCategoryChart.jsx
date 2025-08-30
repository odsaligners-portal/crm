"use client";
import React from "react";
import Chart from "react-apexcharts";

const CaseCategoryChart = ({ series = [], labels = [] }) => {
  const options = {
    chart: {
      type: "pie",
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
    colors: [
      "#3b82f6",
      "#8b5cf6",
      "#10b981",
      "#f97316",
      "#ec4899",
      "#f59e0b",
      "#64748b",
    ],
    tooltip: {
      custom: function ({ series, seriesIndex, w }) {
        const label = w.globals.labels[seriesIndex];
        const value = series[seriesIndex];
        const color = w.globals.colors[seriesIndex];

        return `<div class="p-3 text-white font-semibold subpixel-antialiased rounded" style="background-color: ${color};">
          <span>${label}: ${value} patients</span>
        </div>`;
      },
    },
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Case Category Breakdown
      </h3>
      <div className="flex h-full items-center justify-center">
        <Chart options={options} series={series} type="pie" width={320} />
      </div>

      {/* Custom Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
        {labels.map((label, index) => (
          <div key={index} className="flex items-center text-sm">
            <span
              className="mr-2 h-3 w-3 rounded-full"
              style={{
                backgroundColor: options.colors[index % options.colors.length],
              }}
            ></span>
            <span className="text-gray-600 dark:text-gray-400">{label}:</span>
            <span className="ml-1.5 font-semibold text-gray-800 subpixel-antialiased dark:text-white">
              {series[index]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseCategoryChart;

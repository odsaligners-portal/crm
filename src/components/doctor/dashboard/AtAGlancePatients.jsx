"use client";
import React from "react";
import Chart from "react-apexcharts";
import Link from "next/link";

const Sparkline = ({ data }) => {
  const options = {
    chart: {
      type: "area",
      sparkline: { enabled: true },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      opacity: 0.3,
      colors: ["#3b82f6"],
    },
    yaxis: { min: 0 },
    colors: ["#3b82f6"],
  };
  const series = [{ name: "Comments", data }];
  return (
    <Chart
      options={options}
      series={series}
      type="area"
      height={50}
      width={120}
    />
  );
};

const AtAGlancePatients = ({ patients = [] }) => {
  const timeAgo = (date) => {
    if (!date) return "No activity";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    return Math.floor(seconds / 60) + "m ago";
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Patient Activity at a Glance
      </h3>
      <div className="space-y-2">
        {patients?.length > 0 ? (
          patients?.map(({ patient, lastActivity, sparklineData }) => (
            <Link
              href={`/doctor/patients/view-patient-details?id=${patient._id}`}
              key={patient._id}
            >
              <div className="flex cursor-pointer items-center justify-between rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-700">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900 subpixel-antialiased dark:text-white">
                    {patient.patientName || patient.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last active: {timeAgo(lastActivity)}
                  </p>
                </div>
                <div className="flex items-center">
                  <Sparkline data={sparklineData} />
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="p-3 text-sm text-gray-500 dark:text-gray-400">
            No recent patient activity to display.
          </p>
        )}
      </div>
    </div>
  );
};

export default AtAGlancePatients;

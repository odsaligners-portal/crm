import React from "react";
import { MdPerson, MdCheckCircle, MdPending, MdSchedule } from "react-icons/md";

const PlannerAtAGlance = ({ data }) => {
  if (!data) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
          Planner Activity at a Glance
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Loading planner activity data...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <h3 className="mb-6 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Planner Activity at a Glance
      </h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Recent Activity Summary */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Recent Activity
          </h4>
          <div className="space-y-3">
            {data.recentPatients?.length > 0 ? (
              data.recentPatients.slice(0, 3).map((patient, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
                >
                  <div className="flex-shrink-0">
                    <MdPerson className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {patient.patientName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {patient.caseStatus} •{" "}
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No recent patient activity
              </p>
            )}
          </div>
        </div>

        {/* Case Status Overview */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            Case Status Overview
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
              <div className="flex items-center space-x-2">
                <MdCheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Approved
                </span>
              </div>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {data.approvedCases || 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
              <div className="flex items-center space-x-2">
                <MdPending className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pending Approval
                </span>
              </div>
              <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {data.approvalPending || 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="flex items-center space-x-2">
                <MdSchedule className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Setup Pending
                </span>
              </div>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {data.setupPending || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      {data.recentActivity && data.recentActivity.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-4 text-lg font-medium text-gray-700 dark:text-gray-300">
            Recent Timeline
          </h4>
          <div className="space-y-3">
            {data.recentActivity.slice(0, 4).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="mt-1 flex-shrink-0">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlannerAtAGlance;

"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setLoading as setGlobalLoading } from "@/store/features/uiSlice";
import { useDispatch } from "react-redux";

export default function NotificationsManagePage() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state?.auth) || {};
  const [loading, setLoading] = useState({
    pendingApproval: false,
    monthlyReminder: false,
    expiryReminder30: false,
    expiryReminder0: false,
  });

  const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
  const isSuperAdmin =
    user && user.id && superAdminId && user.id === superAdminId;

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p>This page is only accessible to super administrators.</p>
        </div>
      </div>
    );
  }

  const handleTrigger = async (endpoint, key, label, body) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    dispatch(setGlobalLoading(true));

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: body || undefined,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          `${label} triggered successfully! ${data.emailsSent || data.message || ""}`,
        );
      } else {
        toast.error(data.error || `Failed to trigger ${label}`);
      }
    } catch (error) {
      console.error(`Error triggering ${label}:`, error);
      toast.error(`Failed to trigger ${label}: ${error.message}`);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
      dispatch(setGlobalLoading(false));
    }
  };

  const notificationServices = [
    {
      key: "pendingApproval",
      title: "Pending Approval Cases",
      description:
        "Send weekly reminder emails to admins, doctors, and distributors for cases pending approval (not on hold/cancelled).",
      endpoint: "/api/notifications/pending-approval",
      schedule: "Every week at 3:00 PM IST",
      icon: "📋",
    },
    {
      key: "monthlyReminder",
      title: "Monthly Follow-Up Reminder",
      description:
        "Send monthly reminder emails to doctors for active and approved cases to track treatment progress.",
      endpoint: "/api/notifications/monthly-reminder",
      schedule: "Monthly",
      icon: "📅",
    },
    {
      key: "expiryReminder30",
      title: "Case Expiry Reminder (30 Days)",
      description:
        "Send reminder emails to doctors 30 days before case expiry date.",
      endpoint: "/api/notifications/case-expiry-reminder",
      schedule: "Daily (30 days before expiry)",
      icon: "⏰",
      body: JSON.stringify({ daysBefore: 30 }),
    },
    {
      key: "expiryReminder0",
      title: "Case Expiry Notification",
      description:
        "Send notification emails to doctors on the day of case expiry.",
      endpoint: "/api/notifications/case-expiry-reminder",
      schedule: "Daily (on expiry date)",
      icon: "🔒",
      body: JSON.stringify({ daysBefore: 0 }),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-semibold subpixel-antialiased">
          Email Notifications Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manually trigger automated email notification services. These services
          also run automatically via cron jobs.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {notificationServices.map((service) => (
          <div
            key={service.key}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{service.icon}</span>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Schedule: {service.schedule}
                  </p>
                </div>
              </div>
            </div>

            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              {service.description}
            </p>

            <button
              onClick={() =>
                handleTrigger(
                  service.endpoint,
                  service.key,
                  service.title,
                  service.body,
                )
              }
              disabled={loading[service.key]}
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 font-semibold text-white transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading[service.key] ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Trigger Now"
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-300">
          📌 Note:
        </h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>
            Case Details Email is sent automatically when admin fills case start
            date & expiry date.
          </li>
          <li>
            All other notifications run automatically via cron jobs at scheduled
            times.
          </li>
          <li>
            Use these manual triggers for testing or to send notifications
            immediately.
          </li>
        </ul>
      </div>
    </div>
  );
}

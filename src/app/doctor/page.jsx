"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import dynamicImport from "next/dynamic";
import {
  MdFolderShared,
  MdHourglassEmpty,
  MdNotifications,
} from "react-icons/md";
import { setLoading } from "@/store/features/uiSlice";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import UpcomingEvents from "@/components/doctor/dashboard/UpcomingEvents";
import DoctorQuickLinks from "@/components/doctor/dashboard/QuickLinks";
// Dynamically import components that use browser-only APIs (like react-apexcharts)
const AtAGlancePatients = dynamicImport(
  () => import("@/components/doctor/dashboard/AtAGlancePatients"),
  { ssr: false },
);
const CaseCountdownTimer = dynamicImport(
  () => import("@/components/common/CaseCountdownTimer"),
  { ssr: false },
);

export const dynamic = "force-dynamic";

export default function DoctorDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const { token } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notification);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [atAGlanceData, setAtAGlanceData] = useState([]);
  const [casesWithEndDates, setCasesWithEndDates] = useState([]);
  const [loading, setLocalLoading] = useState(true);
  const dispatch = useDispatch();

  // Set isMounted to true after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const [statsRes, eventsRes, atAGlanceRes] = await Promise.all([
          fetch("/api/doctor/dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/events", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/doctor/dashboard/at-a-glance", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const statsResult = await statsRes.json();
        if (statsRes.ok) {
          setStats(statsResult.data);
          setCasesWithEndDates(statsResult.data?.casesWithEndDates || []);
        } else toast.error(statsResult.message || "Failed to fetch stats.");

        const eventsResult = await eventsRes.json();
        if (eventsRes.ok) setEvents(eventsResult);
        else toast.error(eventsResult.message || "Failed to fetch events.");

        const atAGlanceResult = await atAGlanceRes.json();
        if (atAGlanceRes.ok) setAtAGlanceData(atAGlanceResult.data);
        else
          toast.error(
            atAGlanceResult.message || "Failed to fetch at-a-glance data.",
          );
      } catch (error) {
        toast.error(error.message || "Failed to fetch dashboard data.");
      } finally {
        dispatch(setLoading(false));
        setLocalLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, dispatch]);

  if (!isMounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
        <span className="text-lg font-semibold text-gray-700 subpixel-antialiased dark:text-gray-200">
          Loading dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="My Patients"
          value={stats?.myPatients ?? "..."}
          icon={<MdFolderShared className="h-8 w-8" />}
          colorClass="bg-[#00b9fc]"
        />
        <MetricCard
          title="Pending Cases"
          value={stats?.pendingCases ?? "..."}
          icon={<MdHourglassEmpty className="h-8 w-8" />}
          colorClass="bg-[#eab308]"
        />
        <MetricCard
          title="Unread Notifications"
          value={unreadCount ?? "..."}
          icon={<MdNotifications className="h-8 w-8" />}
          colorClass="bg-[#22c55e]"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <AtAGlancePatients patients={atAGlanceData} />
        </div>
        <div className="space-y-6">
          {/* Case Countdown Timers */}
          {casesWithEndDates && casesWithEndDates.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">
                ⏰ Case Countdown Timers
              </h2>
              <div className="space-y-4">
                {casesWithEndDates.map((caseItem) => (
                  <CaseCountdownTimer
                    key={caseItem._id}
                    endDate={caseItem.caseEndDate}
                    startDate={caseItem.caseStartDate}
                    caseId={caseItem.caseId}
                    patientName={caseItem.patientName}
                  />
                ))}
              </div>
            </div>
          )}
          <DoctorQuickLinks />
          <UpcomingEvents events={events} />
        </div>
      </div>
    </div>
  );
}

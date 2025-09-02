"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import { MdPeople, MdEvent, MdApproval } from "react-icons/md";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import DistributerUpcomingEvents from "@/components/distributer/dashboard/DistributerUpcomingEvents";
import DistributerQuickLinks from "@/components/distributer/dashboard/DistributerQuickLinks";
import DistributerAtAGlance from "@/components/distributer/dashboard/DistributerAtAGlance";

export default function DistributerDashboard() {
  // Replace with real token/notification selectors if needed
  const { token } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notification);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;

      dispatch(setLoading(true));
      try {
        const statsRes = await fetchWithError(
          "/api/distributer/dashboard/stats",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        setStats(statsRes.data);
      } catch (error) {
        // fetchWithError handles all toasts
        console.error("Error fetching distributer dashboard stats:", error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchDashboardData();
  }, [token, dispatch]);

  useEffect(() => {
    // TODO: Replace with real API calls for distributer dashboard
    setTimeout(() => {
      setEvents([
        { _id: 1, name: "Annual Planning Meeting", eventDate: new Date() },
        {
          _id: 2,
          name: "Quarterly Review",
          eventDate: new Date(Date.now() + 86400000),
        },
      ]);
    }, 800);
  }, []);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
          Distributer Dashboard
        </h1>
        <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
          Overview of your doctors' patient cases and activities
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total Patients"
          value={stats?.totalPatients ?? "..."}
          icon={<MdPeople className="h-8 w-8" />}
          colorClass="from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Approved Cases"
          value={stats?.approvedCases ?? "..."}
          icon={<MdEvent className="h-8 w-8" />}
          colorClass="from-green-500 to-green-600"
        />
        <MetricCard
          title="Approval Pending"
          value={stats?.approvalPending ?? "..."}
          icon={<MdApproval className="h-8 w-8" />}
          colorClass="from-yellow-500 to-yellow-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DistributerAtAGlance data={stats} />
        </div>
        <div className="space-y-6">
          <DistributerQuickLinks />
          <DistributerUpcomingEvents events={events} />
        </div>
      </div>
    </div>
  );
}

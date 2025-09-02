"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import { MdPeople, MdPendingActions, MdApproval, MdEvent } from "react-icons/md";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import PlannerUpcomingEvents from "@/components/planner/dashboard/PlannerUpcomingEvents";
import PlannerQuickLinks from "@/components/planner/dashboard/QuickLinks";
import PlannerAtAGlance from "@/components/planner/dashboard/PlannerAtAGlance";

export default function PlannerDashboard() {
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
        const statsRes = await fetchWithError("/api/planner/dashboard/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats(statsRes.data);
      } catch (error) {
        // fetchWithError handles all toasts
        console.error("Error fetching planner dashboard stats:", error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchDashboardData();
  }, [token, dispatch]);

  useEffect(() => {
    // TODO: Replace with real API calls for planner dashboard
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
          <PlannerAtAGlance data={stats} />
        </div>
        <div className="space-y-6">
          <PlannerQuickLinks />
          <PlannerUpcomingEvents events={events} />
        </div>
      </div>
    </div>
  );
}

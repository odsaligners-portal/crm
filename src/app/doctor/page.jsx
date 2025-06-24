"use client";
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import MetricCard from '@/components/admin/dashboard/MetricCard';
import { MdFolderShared, MdHourglassEmpty, MdNotifications } from 'react-icons/md';
import Loader from '@/components/common/Loader';
import UpcomingEvents from '@/components/doctor/dashboard/UpcomingEvents';
import DoctorQuickLinks from '@/components/doctor/dashboard/QuickLinks';
import AtAGlancePatients from '@/components/doctor/dashboard/AtAGlancePatients';

export default function DoctorDashboard() {
  const { token } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notification);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [atAGlanceData, setAtAGlanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, eventsRes, atAGlanceRes] = await Promise.all([
          fetch('/api/doctor/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/doctor/dashboard/at-a-glance', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const statsResult = await statsRes.json();
        if (statsRes.ok) setStats(statsResult.data);
        else toast.error(statsResult.message || 'Failed to fetch stats.');

        const eventsResult = await eventsRes.json();
        if (eventsRes.ok) setEvents(eventsResult);
        else toast.error(eventsResult.message || 'Failed to fetch events.');

        const atAGlanceResult = await atAGlanceRes.json();
        if (atAGlanceRes.ok) setAtAGlanceData(atAGlanceResult.data);
        else toast.error(atAGlanceResult.message || 'Failed to fetch at-a-glance data.');

      } catch (error) {
        toast.error(error.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <span className="text-lg text-gray-700 dark:text-gray-200 font-semibold">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard title="My Patients" value={stats?.myPatients ?? '...'} icon={<MdFolderShared className="w-8 h-8" />} colorClass="from-cyan-500 to-cyan-600" />
        <MetricCard title="Pending Cases" value={stats?.pendingCases ?? '...'} icon={<MdHourglassEmpty className="w-8 h-8" />} colorClass="from-amber-500 to-amber-600" />
        <MetricCard title="Unread Notifications" value={unreadCount ?? '...'} icon={<MdNotifications className="w-8 h-8" />} colorClass="from-indigo-500 to-indigo-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <AtAGlancePatients patients={atAGlanceData} />
        </div>
        <div className="space-y-6">
          <DoctorQuickLinks />
          <UpcomingEvents events={events} />
        </div>
      </div>
    </div>
  );
}

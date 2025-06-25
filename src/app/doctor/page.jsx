"use client";
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import MetricCard from '@/components/admin/dashboard/MetricCard';
import { MdFolderShared, MdHourglassEmpty, MdNotifications } from 'react-icons/md';
import UpcomingEvents from '@/components/doctor/dashboard/UpcomingEvents';
import DoctorQuickLinks from '@/components/doctor/dashboard/QuickLinks';
import AtAGlancePatients from '@/components/doctor/dashboard/AtAGlancePatients';
import { fetchWithError } from '@/utils/apiErrorHandler';
import { setLoading } from '@/store/features/uiSlice';

export default function DoctorDashboard() {
  const { token } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notification);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [atAGlanceData, setAtAGlanceData] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const headers = { Authorization: `Bearer ${token}` };
        
        const statsResult = await fetchWithError('/api/doctor/dashboard/stats', { headers });
        if (statsResult) setStats(statsResult.data);

        const eventsResult = await fetchWithError('/api/events', { headers });
        if (eventsResult) setEvents(eventsResult);
        
        const atAGlanceResult = await fetchWithError('/api/doctor/dashboard/at-a-glance', { headers });
        if (atAGlanceResult) setAtAGlanceData(atAGlanceResult.data);

      } catch (error) {
        // fetchWithError already handles toasting the error.
        // You can add additional component-specific error logic here if needed.
        console.error("Failed to fetch all dashboard data:", error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

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

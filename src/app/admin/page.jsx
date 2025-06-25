"use client";
import CaseCategoryChart from '@/components/admin/dashboard/CaseCategoryChart';
import MetricCard from '@/components/admin/dashboard/MetricCard';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import RecentPatients from '@/components/admin/dashboard/RecentPatients';
import UserMap from '@/components/admin/dashboard/UserMap';
import { useEffect, useMemo, useState } from 'react';
import { MdLocalHospital, MdPeople, MdPersonAdd } from 'react-icons/md';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

export default function AdminDashboard() {
  const { token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [caseData, setCaseData] = useState({ series: [], labels: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes, locationsRes, caseDataRes] = await Promise.all([
          fetch('/api/admin/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/dashboard/recent-activity', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/dashboard/user-locations', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/dashboard/case-categories-distribution', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const statsResult = await statsRes.json();
        if (statsRes.ok) setStats(statsResult.data);
        else toast.error(statsResult.message || 'Failed to fetch stats.');

        const activityResult = await activityRes.json();
        if (activityRes.ok) setActivities(activityResult.data);
        else toast.error(activityResult.message || 'Failed to fetch activities.');

        const locationsResult = await locationsRes.json();
        if (locationsRes.ok) setLocations(locationsResult.data);
        else toast.error(locationsResult.message || 'Failed to fetch locations.');

        const caseDataResult = await caseDataRes.json();
        if (caseDataRes.ok) setCaseData(caseDataResult.data);
        else toast.error(caseDataResult.message || 'Failed to fetch case distribution.');

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

  const mapMarkers = useMemo(() => {
    return locations.map(loc => {
      const totalUsers = loc.patientCount + loc.doctorCount;
      return {
        latLng: loc.latLng,
        name: `${loc.country}: ${loc.patientCount} Patients, ${loc.doctorCount} Doctors`,
        // Dynamic radius for the marker based on user count
        style: { fill: "#4f46e5" } 
      };
    });
  }, [locations]);

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
        <MetricCard
          title="Total Patients"
          value={stats?.totalPatients ?? '...'}
          icon={<MdPeople className="w-8 h-8" />}
          colorClass="from-blue-500 to-blue-600"
        />
        <MetricCard
          title="Total Doctors"
          value={stats?.totalDoctors ?? '...'}
          icon={<MdLocalHospital className="w-8 h-8" />}
          colorClass="from-purple-500 to-purple-600"
        />
        <MetricCard
          title="New Patients (This Month)"
          value={stats?.newPatientsThisMonth ?? '...'}
          icon={<MdPersonAdd className="w-8 h-8" />}
          colorClass="from-green-500 to-green-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity activities={activities} />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <CaseCategoryChart series={caseData.series} labels={caseData.labels} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <UserMap markers={mapMarkers} />
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <RecentPatients />
        </div>
      </div>
    </div>
  );
}

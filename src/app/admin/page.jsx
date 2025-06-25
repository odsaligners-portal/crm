"use client";
import CaseCategoryChart from '@/components/admin/dashboard/CaseCategoryChart';
import MetricCard from '@/components/admin/dashboard/MetricCard';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import RecentPatients from '@/components/admin/dashboard/RecentPatients';
import UserMap from '@/components/admin/dashboard/UserMap';
import { setLoading } from '@/store/features/uiSlice';
import { fetchWithError } from '@/utils/apiErrorHandler';
import { useEffect, useMemo, useState } from 'react';
import { MdLocalHospital, MdPeople, MdPersonAdd } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';

export default function AdminDashboard() {
  const { token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [caseData, setCaseData] = useState({ series: [], labels: [] });
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const [statsRes, activityRes, locationsRes, caseDataRes] = await Promise.all([
          fetchWithError('/api/admin/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithError('/api/admin/dashboard/recent-activity', { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithError('/api/admin/dashboard/user-locations', { headers: { Authorization: `Bearer ${token}` } }),
          fetchWithError('/api/admin/dashboard/case-categories-distribution', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setStats(statsRes.data);
        setActivities(activityRes.data);
        setLocations(locationsRes.data);
        setCaseData(caseDataRes.data);

      } catch (error) {
        // fetchWithError handles all toasts
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (token) {
      fetchData();
    }
  }, [token, dispatch]);

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

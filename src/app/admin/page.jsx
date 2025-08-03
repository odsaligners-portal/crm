"use client";
import CaseCategoryChart from "@/components/admin/dashboard/CaseCategoryChart";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import RecentPatients from "@/components/admin/dashboard/RecentPatients";
import UserMap from "@/components/admin/dashboard/UserMap";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useEffect, useMemo, useState } from "react";
import {
  MdLocalHospital,
  MdPeople,
  MdPersonAdd,
  MdTrendingUp,
} from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminDashboard() {
  const { token } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [caseData, setCaseData] = useState({ series: [], labels: [] });
  const [isVisible, setIsVisible] = useState(false);
  const dispatch = useDispatch();
  const pathname = usePathname();

  // Trigger entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      dispatch(setLoading(true));
      try {
        const [statsRes, activityRes, locationsRes, caseDataRes] =
          await Promise.all([
            fetchWithError("/api/admin/dashboard/stats", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetchWithError("/api/admin/dashboard/recent-activity", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetchWithError("/api/admin/dashboard/user-locations", {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetchWithError(
              "/api/admin/dashboard/case-categories-distribution",
              { headers: { Authorization: `Bearer ${token}` } },
            ),
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
    return locations.map((loc) => {
      const totalUsers = loc.patientCount + loc.doctorCount;
      return {
        latLng: loc.latLng,
        name: `${loc.country}: ${loc.patientCount} Patients, ${loc.doctorCount} Doctors`,
        // Dynamic radius for the marker based on user count
        style: { fill: "#4f46e5" },
      };
    });
  }, [locations]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated Background */}
      <div className="pointer-events-none fixed inset-0">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/5"></div>

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"></div>
        <div className="animation-delay-2000 absolute right-1/4 bottom-1/4 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-pink-400/15 to-orange-400/15 blur-3xl"></div>
        <div className="animation-delay-4000 absolute top-1/2 right-1/3 h-64 w-64 animate-pulse rounded-full bg-gradient-to-r from-green-400/10 to-teal-400/10 blur-3xl"></div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 animate-ping rounded-full bg-blue-400/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div
        className={`relative z-10 space-y-8 p-6 transition-all duration-1000 ease-out ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* Dashboard Header */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-pink-600/10 blur-xl"></div>
          <div className="relative rounded-3xl border border-white/20 bg-white/70 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/70">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-75 blur"></div>
                <div className="relative rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                  <MdTrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-4xl font-bold text-transparent dark:from-white dark:via-blue-200 dark:to-purple-200">
                  Admin Dashboard
                </h1>
                <p className="mt-1 text-lg text-gray-600 dark:text-gray-400">
                  Real-time healthcare analytics and insights
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div
          className={`grid grid-cols-1 gap-8 transition-all duration-1000 ease-out sm:grid-cols-2 xl:grid-cols-3 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <div className="group relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-25 blur transition duration-500 group-hover:opacity-75"></div>
            <div className="relative">
              <MetricCard
                title="Total Patients"
                value={stats?.totalPatients ?? "..."}
                icon={<MdPeople className="h-8 w-8" />}
                colorClass="from-blue-500 to-blue-600"
              />
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 opacity-25 blur transition duration-500 group-hover:opacity-75"></div>
            <div className="relative">
              <MetricCard
                title="Total Doctors"
                value={stats?.totalDoctors ?? "..."}
                icon={<MdLocalHospital className="h-8 w-8" />}
                colorClass="from-purple-500 to-purple-600"
              />
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 opacity-25 blur transition duration-500 group-hover:opacity-75"></div>
            <div className="relative">
              <MetricCard
                title="New Patients (This Month)"
                value={stats?.newPatientsThisMonth ?? "..."}
                icon={<MdPersonAdd className="h-8 w-8" />}
                colorClass="from-green-500 to-green-600"
              />
            </div>
          </div>
        </div>

        {/* Enhanced Grid Layout */}
        <div
          className={`grid grid-cols-1 gap-8 transition-all duration-1000 ease-out lg:grid-cols-3 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          {/* Recent Activity - Enhanced Container */}
          <div className="group relative lg:col-span-2">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-xl transition duration-700 group-hover:opacity-100"></div>
            <div className="relative rounded-3xl border border-white/30 bg-white/80 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/80">
              <RecentActivity activities={activities} />
            </div>
          </div>

          {/* Sidebar Components */}
          <div className="space-y-8">
            {/* Quick Actions - Enhanced */}
            <div className="group relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 blur-xl transition duration-700 group-hover:opacity-100"></div>
              <div className="relative rounded-3xl border border-white/30 bg-white/80 p-6 shadow-2xl shadow-orange-500/10 backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/80">
                <QuickActions />
              </div>
            </div>

            {/* Case Category Chart - Enhanced */}
            <div className="group relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/20 to-green-500/20 opacity-0 blur-xl transition duration-700 group-hover:opacity-100"></div>
              <div className="relative rounded-3xl border border-white/30 bg-white/80 p-6 shadow-2xl shadow-teal-500/10 backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/80">
                <CaseCategoryChart
                  series={caseData.series}
                  labels={caseData.labels}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced User Map */}
        <div
          className={`transition-all duration-1000 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="group relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-xl transition duration-700 group-hover:opacity-100"></div>
            <div className="relative overflow-hidden rounded-3xl border border-white/30 bg-white/80 shadow-2xl shadow-blue-500/10 backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/80">
              <div className="absolute top-0 right-0 left-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              <UserMap markers={mapMarkers} />
            </div>
          </div>
        </div>

        {/* Enhanced Recent Patients */}
        <div
          className={`transition-all duration-1000 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          <div className="group relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-500/20 via-indigo-500/20 to-blue-500/20 opacity-0 blur-xl transition duration-700 group-hover:opacity-100"></div>
            <div className="relative rounded-3xl border border-white/30 bg-white/80 p-6 shadow-2xl shadow-violet-500/10 backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/80">
              <RecentPatients />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

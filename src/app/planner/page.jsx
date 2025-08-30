"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import { MdEvent, MdWidgets, MdNotifications } from "react-icons/md";
// import PlannerUpcomingEvents from '@/components/planner/dashboard/UpcomingEvents';
// import PlannerQuickLinks from '@/components/planner/dashboard/QuickLinks';
// import PlannerAtAGlance from '@/components/planner/dashboard/AtAGlance';
// import { setLoading } from '@/store/features/uiSlice';

export default function PlannerDashboard() {
  // Replace with real token/notification selectors if needed
  const { token } = useSelector((state) => state.auth);
  const { unreadCount } = useSelector((state) => state.notification);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [atAGlanceData, setAtAGlanceData] = useState([]);

  useEffect(() => {
    // TODO: Replace with real API calls for planner dashboard
    setTimeout(() => {
      setStats({
        myEvents: 12,
        widgets: 5,
      });
      setEvents([
        { _id: 1, name: "Annual Planning Meeting", eventDate: new Date() },
        {
          _id: 2,
          name: "Quarterly Review",
          eventDate: new Date(Date.now() + 86400000),
        },
      ]);
      setAtAGlanceData([
        {
          item: "Widget A",
          lastActivity: new Date(),
          sparklineData: [1, 2, 3, 2, 1, 0, 2],
        },
      ]);
    }, 800);
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="My Events"
          value={stats?.myEvents ?? "..."}
          icon={<MdEvent className="h-8 w-8" />}
          colorClass="from-green-500 to-green-600"
        />
        <MetricCard
          title="Widgets"
          value={stats?.widgets ?? "..."}
          icon={<MdWidgets className="h-8 w-8" />}
          colorClass="from-emerald-500 to-emerald-600"
        />
        <MetricCard
          title="Unread Notifications"
          value={unreadCount ?? "..."}
          icon={<MdNotifications className="h-8 w-8" />}
          colorClass="from-indigo-500 to-indigo-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* <PlannerAtAGlance data={atAGlanceData} /> */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
              Planner Activity at a Glance
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Planner widgets and analytics coming soon...
            </p>
          </div>
        </div>
        <div className="space-y-6">
          {/* <PlannerQuickLinks /> */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
              Quick Links
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Planner quick links coming soon...
            </p>
          </div>
          {/* <PlannerUpcomingEvents events={events} /> */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
              Upcoming Events
            </h3>
            <ul className="space-y-4">
              {events?.length > 0 ? (
                events?.slice(0, 5).map((event) => (
                  <li key={event._id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 pt-1">
                      <MdEvent className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 subpixel-antialiased dark:text-white">
                        {event.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(event.eventDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No upcoming events.
                </p>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

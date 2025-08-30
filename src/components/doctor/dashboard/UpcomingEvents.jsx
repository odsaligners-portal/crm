import React from "react";
import Link from "next/link";
import { MdCalendarToday } from "react-icons/md";

const UpcomingEvents = ({ events }) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Upcoming Events
      </h3>
      <ul className="space-y-4">
        {events?.length > 0 ? (
          events?.slice(0, 5).map((event) => (
            <li key={event._id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 pt-1">
                <MdCalendarToday className="h-5 w-5 text-blue-500" />
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
      <Link
        href="/doctor/events"
        className="mt-4 inline-block text-sm font-medium text-blue-600"
      >
        View All Events
      </Link>
    </div>
  );
};

export default UpcomingEvents;

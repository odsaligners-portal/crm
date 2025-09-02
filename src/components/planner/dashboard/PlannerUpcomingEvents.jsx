import React from "react";
import { MdEvent, MdSchedule, MdLocationOn } from "react-icons/md";

const PlannerUpcomingEvents = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
          Upcoming Events
        </h3>
        <div className="py-8 text-center">
          <MdEvent className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">
            No upcoming events scheduled
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Events will appear here when scheduled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Upcoming Events
      </h3>

      <div className="space-y-4">
        {events.slice(0, 5).map((event, index) => (
          <div
            key={event._id || index}
            className="group relative overflow-hidden rounded-xl border border-gray-100 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-700 dark:hover:bg-blue-900/10"
          >
            {/* Event indicator line */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

            <div className="flex items-start space-x-3">
              {/* Event icon */}
              <div className="flex-shrink-0">
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 p-2 text-white shadow-md">
                  <MdEvent className="h-5 w-5" />
                </div>
              </div>

              {/* Event details */}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-700 dark:text-white dark:group-hover:text-blue-300">
                  {event.name}
                </h4>

                <div className="mt-2 space-y-1">
                  {/* Date */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <MdSchedule className="h-3 w-3" />
                    <span>
                      {new Date(event.eventDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <MdSchedule className="h-3 w-3" />
                    <span>
                      {new Date(event.eventDate).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Location if available */}
                  {event.location && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <MdLocationOn className="h-3 w-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex-shrink-0">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View all events link */}
      {events.length > 5 && (
        <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
          <button className="w-full text-center text-sm text-blue-600 transition-colors duration-200 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
            View All Events ({events.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default PlannerUpcomingEvents;

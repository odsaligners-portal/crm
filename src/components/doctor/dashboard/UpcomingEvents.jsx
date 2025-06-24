import React from 'react';
import Link from 'next/link';
import { MdCalendarToday } from 'react-icons/md';

const UpcomingEvents = ({ events }) => {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Upcoming Events</h3>
      <ul className="space-y-4">
        {events?.length > 0 ? (
          events?.slice(0, 5).map((event) => (
            <li key={event._id} className="flex items-start space-x-4">
              <div className="flex-shrink-0 pt-1">
                <MdCalendarToday className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate dark:text-white">
                  {event.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(event.eventDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </li>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events.</p>
        )}
      </ul>
      <Link href="/doctor/events" className="mt-4 inline-block text-sm font-medium text-blue-600">
          View All Events
      </Link>
    </div>
  );
};

export default UpcomingEvents; 
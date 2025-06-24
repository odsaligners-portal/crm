import React from 'react';
import { MdPersonAdd, MdPerson, MdComment, MdEvent } from 'react-icons/md';

const activityIcons = {
  NEW_PATIENT: <MdPersonAdd className="w-5 h-5 text-green-500" />,
  NEW_DOCTOR: <MdPerson className="w-5 h-5 text-blue-500" />,
  NEW_COMMENT: <MdComment className="w-5 h-5 text-purple-500" />,
  NEW_EVENT: <MdEvent className="w-5 h-5 text-orange-500" />,
  default: <MdComment className="w-5 h-5 text-gray-500" />,
};

const RecentActivity = ({ activities }) => {
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
      <ul className="space-y-4">
        {activities.map((activity, index) => (
          <li key={index} className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {activityIcons[activity.type] || activityIcons.default}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                {activity.message}
              </p>
              <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                {timeAgo(activity.timestamp)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity; 
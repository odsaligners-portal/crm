import React from "react";
import { MdComment } from "react-icons/md";

const activityIcons = {
  NEW_COMMENT: <MdComment className="h-5 w-5 text-purple-500" />,
  default: <MdComment className="h-5 w-5 text-gray-500" />,
};

const RecentPatientActivity = ({ activities }) => {
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
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Recent Patient Activity
      </h3>
      <ul className="space-y-4">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <li key={index} className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {activityIcons[activity.type] || activityIcons.default}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {timeAgo(activity.timestamp)}
                </p>
              </div>
            </li>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent activity on your patients' cases.
          </p>
        )}
      </ul>
    </div>
  );
};

export default RecentPatientActivity;

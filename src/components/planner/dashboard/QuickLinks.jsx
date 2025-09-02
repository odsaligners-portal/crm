import React from "react";
import Link from "next/link";
import {
  MdPeople,
  MdPerson,
  MdEvent,
  MdNotifications,
  MdSchool,
  MdDescription,
  MdSettings,
} from "react-icons/md";

const PlannerQuickLinks = () => {
  const quickLinks = [
    {
      title: "Manage Patients",
      description: "View and manage patient cases",
      icon: <MdPeople className="h-6 w-6" />,
      href: "/planner/patients",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Profile Settings",
      description: "Update your profile information",
      icon: <MdPerson className="h-6 w-6" />,
      href: "/planner/profile",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Events & Calendar",
      description: "Manage your events and schedule",
      icon: <MdEvent className="h-6 w-6" />,
      href: "/planner/events",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: "Notifications",
      description: "View your notifications",
      icon: <MdNotifications className="h-6 w-6" />,
      href: "/planner/notifications",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Educational Material",
      description: "Access learning resources",
      icon: <MdSchool className="h-6 w-6" />,
      href: "/planner/educational-material",
      color: "from-teal-500 to-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20",
    },
    {
      title: "Terms & Conditions",
      description: "View terms and policies",
      icon: <MdDescription className="h-6 w-6" />,
      href: "/planner/terms-and-conditions",
      color: "from-gray-500 to-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-700",
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <h3 className="mb-6 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Quick Links
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {quickLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className={`group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg ${link.bgColor}`}
          >
            {/* Background gradient overlay */}
            <div
              className={`absolute inset-0 bg-gradient-to-r ${link.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
            ></div>

            <div className="relative flex items-center space-x-3">
              {/* Icon with gradient background */}
              <div
                className={`flex-shrink-0 rounded-lg bg-gradient-to-r ${link.color} p-2 text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
              >
                {link.icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-gray-900 transition-colors duration-200 group-hover:text-gray-700 dark:text-white dark:group-hover:text-gray-200">
                  {link.title}
                </h4>
                <p className="text-xs text-gray-500 transition-colors duration-200 group-hover:text-gray-600 dark:text-gray-400 dark:group-hover:text-gray-300">
                  {link.description}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="flex-shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div
                  className={`h-2 w-2 rounded-full bg-gradient-to-r ${link.color}`}
                ></div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Additional Info */}
      <div className="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
        <p className="text-center text-xs text-gray-600 dark:text-gray-400">
          Click any link above to quickly navigate to different sections of your
          planner dashboard.
        </p>
      </div>
    </div>
  );
};

export default PlannerQuickLinks;

import React from "react";
import Link from "next/link";
import {
  MdAddCircle,
  MdPersonAdd,
  MdEvent,
  MdDescription,
  MdNotifications,
} from "react-icons/md";

const QuickActions = () => {
  const actions = [
    {
      href: "/admin/patients/create-patient-record",
      label: "New Patient",
      icon: <MdPersonAdd className="h-6 w-6" />,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      href: "/admin/notifications",
      label: "Notifications",
      icon: <MdNotifications className="h-6 w-6" />,
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      href: "/admin/events",
      label: "Events",
      icon: <MdEvent className="h-6 w-6" />,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      href: "/admin/case-categories",
      label: "Case Categories",
      icon: <MdDescription className="h-6 w-6" />,
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex transform flex-col items-center justify-center rounded-lg p-4 text-white transition-transform hover:scale-105 ${action.color}`}
          >
            {action.icon}
            <span className="mt-2 text-center text-sm font-semibold">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

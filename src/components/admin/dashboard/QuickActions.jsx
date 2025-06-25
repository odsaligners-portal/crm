import React from 'react';
import Link from 'next/link';
import { MdAddCircle, MdPersonAdd, MdEvent, MdDescription, MdNotifications } from 'react-icons/md';

const QuickActions = () => {
  const actions = [
    {
      href: '/admin/patients/create-patient-record/step-1',
      label: 'New Patient',
      icon: <MdPersonAdd className="w-6 h-6" />,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      href: '/admin/notifications',
      label: 'Notifications',
      icon: <MdNotifications className="w-6 h-6" />,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      href: '/admin/events',
      label: 'Events',
      icon: <MdEvent className="w-6 h-6" />,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
        href: '/admin/case-categories',
        label: 'Case Categories',
        icon: <MdDescription className="w-6 h-6" />,
        color: 'bg-orange-500 hover:bg-orange-600',
    },
  ];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center justify-center p-4 text-white rounded-lg transition-transform transform hover:scale-105 ${action.color}`}
          >
            {action.icon}
            <span className="mt-2 text-sm font-semibold text-center">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickActions; 
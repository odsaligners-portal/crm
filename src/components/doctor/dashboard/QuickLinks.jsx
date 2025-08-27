import React from 'react';
import Link from 'next/link';
import { MdPersonAdd, MdSchool } from 'react-icons/md';

const DoctorQuickLinks = () => {
  const links = [
    {
      href: '/doctor/patients/create-patient-record',
      label: 'New Patient',
      icon: <MdPersonAdd className="w-8 h-8" />,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      href: '/doctor/tutorials',
      label: 'Tutorials',
      icon: <MdSchool className="w-8 h-8" />,
      color: 'bg-green-500 hover:bg-green-600',
    },
  ];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Links</h3>
      <div className="grid grid-cols-2 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center p-6 text-white rounded-lg transition-transform transform hover:scale-105 ${link.color}`}
          >
            {link.icon}
            <span className="mt-2 text-sm font-semibold text-center">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DoctorQuickLinks; 
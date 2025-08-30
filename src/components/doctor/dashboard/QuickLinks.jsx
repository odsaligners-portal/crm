import React from "react";
import Link from "next/link";
import { MdPersonAdd, MdSchool } from "react-icons/md";

const DoctorQuickLinks = () => {
  const links = [
    {
      href: "/doctor/patients/create-patient-record",
      label: "New Patient",
      icon: <MdPersonAdd className="h-8 w-8" />,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      href: "/doctor/tutorials",
      label: "Tutorials",
      icon: <MdSchool className="h-8 w-8" />,
      color: "bg-green-500 hover:bg-green-600",
    },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
      <h3 className="mb-4 text-xl font-semibold text-gray-800 subpixel-antialiased dark:text-white">
        Quick Links
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex transform flex-col items-center justify-center rounded-lg p-6 text-white transition-transform hover:scale-105 ${link.color}`}
          >
            {link.icon}
            <span className="mt-2 text-center text-sm font-semibold subpixel-antialiased">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default DoctorQuickLinks;

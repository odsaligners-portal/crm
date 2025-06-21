"use client";
import React from 'react';
import { 
  FaUser, FaEnvelope, FaPhone, FaVenusMars, FaFlag, 
  FaMapMarkedAlt, FaCity, FaBriefcase, FaUserMd, FaMapPin 
} from 'react-icons/fa';

export default function UserInfoCard({ userData }) {
  
  const userInfo = [
    { label: 'Full Name', value: userData.name, icon: <FaUser /> },
    { label: 'Email', value: userData.email, icon: <FaEnvelope /> },
    { label: 'Mobile', value: userData.mobile, icon: <FaPhone /> },
    { label: 'Gender', value: userData.gender, icon: <FaVenusMars /> },
    { label: 'Country', value: userData.country, icon: <FaFlag /> },
    { label: 'State', value: userData.state, icon: <FaMapMarkedAlt /> },
    { label: 'City', value: userData.city, icon: <FaCity /> },
    { label: 'Experience', value: `${userData.experience} years`, icon: <FaBriefcase /> },
    { label: 'Doctor Type', value: userData.doctorType, icon: <FaUserMd /> },
    { label: 'Address', value: userData.address, icon: <FaMapPin />, fullWidth: true },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Personal Information
        </h4>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
        {userInfo.map((info, index) => (
          <div key={index} className={`flex items-start gap-3 ${info.fullWidth ? 'sm:col-span-2' : ''}`}>
            {info.icon && <span className="mt-1 flex-shrink-0 text-gray-500">{info.icon}</span>}
            <div className="flex-grow">
              <p className="text-sm text-gray-500 dark:text-gray-400">{info.label}</p>
              <p className="font-medium text-gray-800 dark:text-white/90">{info.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

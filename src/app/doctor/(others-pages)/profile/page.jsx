'use client';

import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function Profile() {
  const [userData, setUserData] = useState({
    id: '',
    name: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetchWithError('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.user) {
          setUserData({
            id: response.user.id || '',
            name: response.user.name || '',
            email: response.user.email || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [token]);

  const handleProfileUpdate = (updatedData) => {
    setUserData(updatedData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserInfoCard userData={userData}/>
        </div>
      </div>
    </div>
  );
}

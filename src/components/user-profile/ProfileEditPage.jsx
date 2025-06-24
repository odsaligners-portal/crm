"use client"
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import ProfileEditForm from "@/components/user-profile/ProfileEditForm";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function ProfileEditPage() {
  const router = useRouter();
  const { token } = useSelector((state) => state.auth);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const res = await fetchWithError('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUserData(res.user || {});
      } catch (e) {
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userData) {
    return <div className="text-center text-red-500 mt-10">User not found.</div>;
  }

  // Determine redirect path based on user role
  const getProfilePath = () => {
    if (userData.role === 'admin') return '/admin/profile';
    if (userData.role === 'doctor') return '/doctor/profile';
    return '/';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 sm:p-12">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 mb-2 text-center drop-shadow-lg">Edit Profile</h2>
        <p className="text-center text-gray-500 dark:text-gray-300 mb-8">Update your details below</p>
        <ProfileEditForm initialValues={userData} onSuccess={() => router.push(getProfilePath())} />
      </div>
    </div>
  );
} 
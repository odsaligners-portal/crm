"use client";

import UserAddressCard from "@/components/user-profile/UserAddressCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { FaEdit } from "react-icons/fa";
import Link from "next/link";
import { setLoading } from "@/store/features/uiSlice";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserData = async () => {
      dispatch(setLoading(true));
      try {
        const response = await fetchWithError("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.user) {
          setUserData({
            id: response.user.id || "-",
            name: response.user.name || "-",
            email: response.user.email || "-",
            mobile: response.user.mobile || "-",
            gender: response.user.gender || "-",
            country: response.user.country || "-",
            state: response.user.state || "-",
            city: response.user.city || "-",
            experience: response.user.experience || "-",
            doctorType: response.user.doctorType || "-",
            address: response.user.address || "-",
            profilePicture: response.user.profilePicture || {
              url: "",
              fileKey: "",
              uploadedAt: null,
            },
          });
        }
      } catch (error) {
        // fetchWithError handles toast notifications
      } finally {
        dispatch(setLoading(false));
      }
    };

    if (token) {
      fetchUserData();
    }
  }, [token, dispatch]);

  if (!userData) {
    return null; // Render nothing while loading, global loader will be shown
  }

  return (
    <div>
      <div className="relative rounded-2xl border border-gray-200 bg-white p-5 lg:p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Edit Button */}
        <Link
          href="/admin/profile/edit"
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-md hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700"
          title="Edit Profile"
        >
          <FaEdit size={22} />
        </Link>
        <h3 className="mb-5 text-lg font-semibold text-gray-800 lg:mb-7 dark:text-white/90">
          Profile
        </h3>
        <div className="mb-8 flex flex-col items-center">
          {userData.profilePicture?.url ? (
            <img
              src={userData.profilePicture.url}
              alt="Profile"
              className="mb-2 h-32 w-32 rounded-full border-4 border-blue-400 object-cover shadow-lg"
            />
          ) : (
            <div className="mb-2 flex h-32 w-32 items-center justify-center rounded-full border-4 border-blue-200 bg-gradient-to-br from-blue-400 to-blue-200 text-4xl font-semibold text-white shadow-lg">
              {userData.name
                ? userData.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : "?"}
            </div>
          )}
        </div>
        <div className="space-y-6">
          <UserInfoCard userData={userData} />
        </div>
      </div>
    </div>
  );
}

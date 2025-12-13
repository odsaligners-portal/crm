"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import { FaUser, FaCity, FaMapMarkerAlt } from "react-icons/fa";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DistributerDoctorsPage() {
  const { token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchDoctors = async () => {
      dispatch(setLoading(true));
      setError(null);
      try {
        const data = await fetchWithError("/api/distributer/doctors", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setDoctors(data.doctors || []);
      } catch (err) {
        setError(err.message || "Failed to fetch doctors");
      } finally {
        dispatch(setLoading(false));
      }
    };
    if (token) {
      fetchDoctors();
    }
  }, [token, dispatch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-10 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-lg dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            My Doctors
          </h1>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            View all doctors associated with your account
          </p>
        </div>

        {error ? (
          <div className="flex h-40 items-center justify-center">
            <span className="text-lg font-semibold text-red-600 subpixel-antialiased">
              {error}
            </span>
          </div>
        ) : doctors.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <span className="text-lg font-semibold text-gray-600 subpixel-antialiased">
              No doctors found.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc) => (
              <div
                key={doc._id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-blue-100/50 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-200/50 dark:border-gray-700/50 dark:from-gray-800 dark:to-gray-900/50 dark:hover:border-blue-700/50 dark:hover:shadow-blue-900/20"
              >
                {/* Decorative Background Elements */}
                <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

                {/* Avatar */}
                <div className="relative mb-6 flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-75 blur transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-2xl font-bold text-white shadow-2xl transition-transform duration-300 group-hover:scale-110 dark:border-gray-800">
                      {getInitials(doc.name)}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-6 text-center">
                  <h3 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent drop-shadow-sm dark:from-blue-400 dark:to-purple-400">
                    {doc.name}
                  </h3>
                </div>

                {/* Details */}
                <div className="mt-auto flex flex-col gap-3 rounded-2xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-800/60">
                  <div className="flex items-start gap-3 rounded-lg bg-blue-50/50 p-3 transition-colors duration-200 group-hover:bg-blue-100/50 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/30">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                      <FaCity size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        City
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {doc.city}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg bg-purple-50/50 p-3 transition-colors duration-200 group-hover:bg-purple-100/50 dark:bg-purple-900/20 dark:group-hover:bg-purple-900/30">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                      <FaMapMarkerAlt size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Address
                      </p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {doc.address}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

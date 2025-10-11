"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import {
  FaBan,
  FaCheckCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SuspendAccountPage() {
  const { token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const dispatch = useDispatch();

  useEffect(() => {
    fetchDoctors();
  }, [token]);

  const fetchDoctors = async () => {
    dispatch(setLoading(true));
    setError(null);
    try {
      const data = await fetchWithError("/api/user/profile?role=doctor", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setDoctors(data.doctors || []);
    } catch (err) {
      setError(err.message || "Failed to fetch doctors");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleToggleSuspension = async (doctorId, currentStatus) => {
    setActionLoading((prev) => ({ ...prev, [doctorId]: true }));

    try {
      const action = currentStatus ? "unsuspend" : "suspend";
      const response = await fetch(
        `/api/admin/doctors/suspend?doctorId=${doctorId}&action=${action}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `✅ Doctor account ${action === "suspend" ? "suspended" : "reactivated"} successfully!`,
        );

        // Update the doctor's status in the list
        setDoctors(
          doctors.map((doc) =>
            doc._id === doctorId
              ? { ...doc, isSuspended: action === "suspend" }
              : doc,
          ),
        );
      } else {
        const errorData = await response.json();
        toast.error(
          `❌ ${errorData.message || "Failed to update account status"}`,
        );
      }
    } catch (err) {
      toast.error(`❌ ${err.message || "An error occurred"}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [doctorId]: false }));
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.phone?.includes(searchTerm),
  );

  const activeDoctors = filteredDoctors.filter((d) => !d.isSuspended);
  const suspendedDoctors = filteredDoctors.filter((d) => d.isSuspended);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-blue-700 drop-shadow-lg dark:text-white">
            Account Suspension Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Suspend or reactivate doctor accounts. Suspended doctors cannot log
            in.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <FaCheckCircle className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Active Doctors
                </p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {activeDoctors.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
                <FaBan className="text-2xl text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Suspended Doctors
                </p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {suspendedDoctors.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 p-3 dark:bg-gray-700">
                <svg
                  className="h-8 w-8 text-gray-600 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Doctors
                </p>
                <p className="text-3xl font-bold text-gray-700 dark:text-gray-300">
                  {doctors.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!error && filteredDoctors.length === 0 && (
          <div className="flex h-40 items-center justify-center">
            <span className="text-lg font-semibold text-gray-600 subpixel-antialiased dark:text-gray-400">
              {searchTerm
                ? "No doctors found matching your search."
                : "No doctors found."}
            </span>
          </div>
        )}

        {/* Doctors Table */}
        {!error && filteredDoctors.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase subpixel-antialiased dark:text-gray-300">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase subpixel-antialiased dark:text-gray-300">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase subpixel-antialiased dark:text-gray-300">
                      Location
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-700 uppercase subpixel-antialiased dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-700 uppercase subpixel-antialiased dark:text-gray-300">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDoctors.map((doctor) => (
                    <tr
                      key={doctor._id}
                      className={`transition-colors duration-150 ${
                        doctor.isSuspended
                          ? "bg-red-50/50 dark:bg-red-900/10"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      {/* Doctor Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {doctor.profilePicture?.url ? (
                            <img
                              src={doctor.profilePicture.url}
                              alt={doctor.name}
                              className="h-12 w-12 rounded-full border-2 border-blue-400 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-300 text-lg font-bold text-white">
                              {getInitials(doctor.name)}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-gray-900 subpixel-antialiased dark:text-white">
                              {doctor.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {doctor._id.slice(-8)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <FaEnvelope className="text-gray-400" />
                            {doctor.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <FaPhone className="text-gray-400" />
                            {doctor.phone || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <FaMapMarkerAlt className="text-gray-400" />
                          {doctor.city || "N/A"}
                          {doctor.city && doctor.country && ", "}
                          {doctor.country || ""}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {doctor.isSuspended ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                            <FaBan />
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                            <FaCheckCircle />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            handleToggleSuspension(
                              doctor._id,
                              doctor.isSuspended,
                            )
                          }
                          disabled={actionLoading[doctor._id]}
                          className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 ${
                            doctor.isSuspended
                              ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                              : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                          }`}
                        >
                          {actionLoading[doctor._id] ? (
                            <>
                              <svg
                                className="h-4 w-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Loading...
                            </>
                          ) : doctor.isSuspended ? (
                            <>
                              <FaCheckCircle className="transition-transform group-hover:scale-110" />
                              Reactivate
                            </>
                          ) : (
                            <>
                              <FaBan className="transition-transform group-hover:scale-110" />
                              Suspend
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

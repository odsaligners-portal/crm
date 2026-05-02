"use client";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { toast } from "react-toastify";
import { FaCheckCircle, FaBan, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ManageDistributerStatusPage() {
  const { token } = useSelector((state) => state.auth);
  const [distributers, setDistributers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [hasAccess, setHasAccess] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!token) {
        setHasAccess(false);
        return;
      }
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasAccess(!!data.user?.distributerAccess);
      } catch {
        setHasAccess(false);
      }
    };
    checkAccess();
  }, [token]);

  useEffect(() => {
    if (hasAccess) fetchDistributers();
  }, [hasAccess]);

  const fetchDistributers = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/distributers?limit=1000`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch distributers");
      setDistributers(data.distributers || []);
    } catch (err) {
      setError(err.message || "Failed to fetch distributers");
    }
  };

  const handleToggleStatus = async (id, currentIsActive) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch("/api/admin/distributers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, isActive: !currentIsActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to update status");

      setDistributers((prev) =>
        prev.map((d) => (d._id === id ? { ...d, isActive: !currentIsActive } : d)),
      );
      toast.success(
        `✅ Distributer account ${!currentIsActive ? "activated" : "deactivated"} successfully!`,
      );
    } catch (err) {
      toast.error(`❌ ${err.message || "An error occurred"}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (hasAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 subpixel-antialiased dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to view this page.
        </span>
      </div>
    );
  }

  if (hasAccess === null) return null;

  const filtered = distributers.filter(
    (d) =>
      d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.mobile?.includes(searchTerm),
  );

  const activeDistributers = filtered.filter((d) => d.isActive !== false);
  const inactiveDistributers = filtered.filter((d) => d.isActive === false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-blue-700 drop-shadow-lg dark:text-white">
            Distributer Status Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Activate or deactivate distributer accounts. Inactive distributers cannot log in.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <FaCheckCircle className="text-2xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                  {activeDistributers.length}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                  {inactiveDistributers.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <svg
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                  {distributers.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Empty */}
        {!error && filtered.length === 0 && (
          <div className="flex h-40 items-center justify-center">
            <span className="text-lg font-semibold text-gray-600 subpixel-antialiased dark:text-gray-400">
              {searchTerm ? "No distributers found matching your search." : "No distributers found."}
            </span>
          </div>
        )}

        {/* Table */}
        {!error && filtered.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase subpixel-antialiased dark:text-gray-300">
                      Distributer
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
                  {filtered.map((d) => {
                    const isActive = d.isActive !== false;
                    return (
                      <tr
                        key={d._id}
                        className={`transition-colors duration-150 ${
                          !isActive
                            ? "bg-red-50/50 dark:bg-red-900/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {/* Distributer Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {d.logo?.url ? (
                              <img
                                src={d.logo.url}
                                alt={d.name}
                                className="h-12 w-12 rounded-full border-2 border-blue-400 object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-300 text-lg font-bold text-white">
                                {getInitials(d.name)}
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-gray-900 subpixel-antialiased dark:text-white">
                                {d.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {d._id?.slice(-8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <FaEnvelope className="text-gray-400" />
                              {d.email || "N/A"}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <FaPhone className="text-gray-400" />
                              {d.mobile || "N/A"}
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <FaMapMarkerAlt className="text-gray-400" />
                            {d.city || "N/A"}
                            {d.city && d.country && ", "}
                            {d.country || ""}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4 text-center">
                          {isActive ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                              <FaCheckCircle />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700 dark:bg-red-900 dark:text-red-300">
                              <FaBan />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Toggle Button */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(d._id, isActive)}
                            disabled={actionLoading[d._id]}
                            className={`group inline-flex items-center gap-2 rounded-lg px-4 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 ${
                              isActive
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                            }`}
                          >
                            {actionLoading[d._id] ? (
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
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Loading...
                              </>
                            ) : isActive ? (
                              <>
                                <FaBan className="transition-transform group-hover:scale-110" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="transition-transform group-hover:scale-110" />
                                Activate
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

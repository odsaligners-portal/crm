"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import {
  FaTrash,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-toastify";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function DeleteDoctorPage() {
  const { token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

      // Fetch patient count for each doctor
      const doctorsWithPatientCount = await Promise.all(
        (data.doctors || []).map(async (doctor) => {
          try {
            const patientResponse = await fetch(
              `/api/admin/doctors/patient-count?doctorId=${doctor._id}`,
              {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              },
            );
              console.log(patientResponse);
            if (patientResponse.ok) {
              const patientData = await patientResponse.json();
              return { ...doctor, patientCount: patientData.count || 0 };
            }
            return { ...doctor, patientCount: 0 };
          } catch {
            return { ...doctor, patientCount: 0 };
          }
        }),
      );

      setDoctors(doctorsWithPatientCount);
    } catch (err) {
      setError(err.message || "Failed to fetch doctors");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleDeleteClick = (doctor) => {
    setSelectedDoctor(doctor);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDoctor) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/admin/doctors/delete?doctorId=${selectedDoctor._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `✅ Doctor and ${result.deletedPatientsCount || 0} associated patient(s) deleted successfully!`,
        );
        // Remove doctor from list
        setDoctors(doctors.filter((d) => d._id !== selectedDoctor._id));
        setIsDeleteModalOpen(false);
        setSelectedDoctor(null);
      } else {
        const errorData = await response.json();
        toast.error(`❌ ${errorData.message || "Failed to delete doctor"}`);
      }
    } catch (err) {
      toast.error(`❌ ${err.message || "An error occurred while deleting"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.phone?.includes(searchTerm),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-blue-700 drop-shadow-lg dark:text-white">
            Delete Doctor & Associated Patients
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Warning: Deleting a doctor will also permanently delete all their
            associated patient records.
          </p>
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
                      Total Patients
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
                      className="transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-800"
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

                      {/* Patient Count */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 dark:bg-blue-900">
                          <svg
                            className="h-4 w-4 text-blue-600 dark:text-blue-400"
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
                          <span className="font-semibold text-blue-700 subpixel-antialiased dark:text-blue-300">
                            {doctor.patientCount ?? 0}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteClick(doctor)}
                          className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-xl"
                        >
                          <FaTrash className="transition-transform group-hover:scale-110" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-[600px] overflow-hidden rounded-2xl border border-red-200 bg-white shadow-2xl dark:border-red-800 dark:bg-gray-900">
              {/* Modal Header */}
              <div className="border-b border-red-200 bg-red-50 px-6 py-4 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                    <FaExclamationTriangle className="text-2xl text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-900 subpixel-antialiased dark:text-red-100">
                      Confirm Deletion
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6">
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="mb-2 flex items-center gap-3">
                    {selectedDoctor.profilePicture?.url ? (
                      <img
                        src={selectedDoctor.profilePicture.url}
                        alt={selectedDoctor.name}
                        className="h-16 w-16 rounded-full border-2 border-red-400 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-300 text-xl font-bold text-white">
                        {getInitials(selectedDoctor.name)}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-gray-900 subpixel-antialiased dark:text-white">
                        {selectedDoctor.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedDoctor.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    ⚠️ Warning: This will permanently delete:
                  </p>
                  <ul className="ml-6 list-disc space-y-1">
                    <li>The doctor's account and profile</li>
                    <li>
                      <span className="font-semibold text-red-700 dark:text-red-400">
                        {selectedDoctor.patientCount || 0} patient record(s)
                      </span>{" "}
                      created by this doctor
                    </li>
                    <li>All associated case files and data</li>
                    <li>All communication history</li>
                  </ul>
                  <p className="mt-4 font-semibold">
                    Are you absolutely sure you want to proceed?
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedDoctor(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 font-semibold text-white shadow-lg transition-all duration-200 hover:from-red-600 hover:to-red-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin"
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
                      Deleting...
                    </span>
                  ) : (
                    "Yes, Delete Permanently"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

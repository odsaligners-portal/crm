"use client"
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FaPhone, FaCity, FaEnvelope } from "react-icons/fa";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import EyeIcon from "@/icons/eye.svg";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminDoctorsPage() {
  const { token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/user/profile?role=doctor", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error("Failed to fetch doctors");
        const data = await response.json();
        setDoctors(data.doctors || []);
      } catch (err) {
        setError(err.message || "Failed to fetch doctors");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-10 px-4">
      <h1 className="text-4xl font-extrabold text-blue-700 dark:text-white mb-12 text-center tracking-tight drop-shadow-lg">All Doctors</h1>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-blue-600 text-lg font-semibold">Loading doctors...</span>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-red-600 text-lg font-semibold">{error}</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <span className="text-gray-600 text-lg font-semibold">No doctors found.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center border border-blue-100 dark:border-gray-800 hover:shadow-blue-200 dark:hover:shadow-blue-900 transition-shadow duration-300 group overflow-hidden"
            >
              {/* View Icon Button */}
              <button
                className="absolute top-3 right-3 bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700 rounded-full p-2 shadow-md z-10"
                onClick={() => { setSelectedDoctor(doc); openModal(); }}
                title="View Details"
              >
                <EyeIcon width={22} height={22} className="text-blue-600 dark:text-blue-300" />
              </button>
              {/* User Badge/Avatar or Profile Picture */}
              {doc.profilePicture && doc.profilePicture.url ? (
                <img
                  src={doc.profilePicture.url}
                  alt={doc.name + " profile"}
                  className="w-20 h-20 rounded-full border-4 border-blue-400 shadow-lg object-cover mb-4 group-hover:scale-105 transition-transform duration-200 bg-white dark:bg-gray-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 dark:from-blue-800 dark:to-blue-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg mb-4 border-4 border-white dark:border-gray-900 group-hover:scale-105 transition-transform duration-200">
                  {getInitials(doc.name)}
                </div>
              )}
              {/* Name */}
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-1 text-center drop-shadow-sm">
                {doc.name}
              </div>
              {/* Type Badge */}
              <div className="mb-6">
                <span className="inline-block px-4 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs font-semibold tracking-wide shadow-sm border border-blue-200 dark:border-blue-700">
                  {doc.doctorType || "-"}
                </span>
              </div>
              {/* Details */}
              <div className="w-full flex flex-col gap-2 mt-2 px-2">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-sm">
                  <FaPhone className="text-blue-500 dark:text-blue-300" />
                  <span className="truncate">{doc.mobile || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-xs">
                  <FaCity className="text-blue-500 dark:text-blue-300 text-sm" />
                  <span className="truncate">{doc.city || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 text-xs">
                  <FaEnvelope className="text-blue-500 dark:text-blue-300 text-sm" />
                  <span className="truncate">{doc.email || "-"}</span>
                </div>
              </div>
              {/* Extra effect: Glow on hover */}
              <div className="absolute -inset-1 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-200/40 to-blue-400/10 blur-2xl z-0" />
            </div>
          ))}
        </div>
      )}
      {/* Modal for doctor details */}
      <Modal isOpen={isOpen} onClose={closeModal}>
        {selectedDoctor && (
          <div className="flex flex-col items-center justify-center p-4 max-w-lg w-full min-h-[60vh] mx-auto">
            <div className="flex flex-col items-center mb-6">
              {selectedDoctor.profilePicture && selectedDoctor.profilePicture.url ? (
                <img
                  src={selectedDoctor.profilePicture.url}
                  alt={selectedDoctor.name + " profile"}
                  className="w-32 h-32 rounded-full border-4 border-blue-400 shadow-lg object-cover mb-2"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 dark:from-blue-800 dark:to-blue-500 flex items-center justify-center text-white text-4xl font-bold mb-2 border-4 border-white dark:border-gray-900">
                  {getInitials(selectedDoctor.name)}
                </div>
              )}
            </div>
            <UserInfoCard userData={selectedDoctor} />
          </div>
        )}
      </Modal>
    </div>
  );
}

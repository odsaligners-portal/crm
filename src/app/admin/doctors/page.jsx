"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import { FaPhone, FaCity, FaEnvelope, FaEye } from "react-icons/fa";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import UserInfoCard from "@/components/user-profile/UserInfoCard";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminDoctorsPage() {
  const { token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { isOpen, openModal, closeModal } = useModal();
  const dispatch = useDispatch();

  useEffect(() => {
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
    fetchDoctors();
  }, [token, dispatch]);

  return (
    <div className="from-white-50 min-h-screen bg-gradient-to-br to-blue-50 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <h1 className="mb-12 text-center text-4xl font-extrabold tracking-tight text-blue-700 drop-shadow-lg dark:text-white">
        All Doctors
      </h1>
      {error ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-lg font-semibold text-red-600">{error}</span>
        </div>
      ) : doctors.length === 0 ? (
        <div className="flex h-40 items-center justify-center">
          <span className="text-lg font-semibold text-gray-600">
            No doctors found.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-3">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="group relative flex flex-col items-center overflow-hidden rounded-2xl border border-blue-100 bg-white p-8 shadow-2xl transition-shadow duration-300 hover:shadow-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-blue-900"
            >
              {/* View Icon Button */}
              <button
                className="absolute top-3 right-3 z-10 flex aspect-square h-10 w-10 items-center justify-center rounded-full bg-blue-100 p-0 shadow-md hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700"
                onClick={() => {
                  setSelectedDoctor(doc);
                  openModal();
                }}
                title="View Details"
              >
                <FaEye
                  size={22}
                  className="relative top-[1px] leading-none text-blue-600 dark:text-blue-300"
                />
              </button>
              {/* User Badge/Avatar or Profile Picture */}
              {doc.profilePicture && doc.profilePicture.url ? (
                <img
                  src={doc.profilePicture.url}
                  alt={doc.name + " profile"}
                  className="mb-4 h-20 w-20 rounded-full border-4 border-blue-400 bg-white object-cover shadow-lg transition-transform duration-200 group-hover:scale-105 dark:bg-gray-900"
                />
              ) : (
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-300 text-3xl font-extrabold text-white shadow-lg transition-transform duration-200 group-hover:scale-105 dark:border-gray-900 dark:from-blue-800 dark:to-blue-500">
                  {getInitials(doc.name)}
                </div>
              )}
              {/* Name */}
              <div className="mb-1 text-center text-2xl font-semibold text-blue-800 drop-shadow-sm dark:text-blue-200">
                {doc.name}
              </div>
              {/* Type Badge */}
              <div className="mb-6">
                <span className="inline-block rounded-full border border-blue-200 bg-blue-100 px-4 py-1 text-xs font-semibold tracking-wide text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-800 dark:text-blue-200">
                  {doc.doctorType || "-"}
                </span>
              </div>
              {/* Details */}
              <div className="mt-2 flex w-full flex-col gap-2 px-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <FaPhone className="text-blue-500 dark:text-blue-300" />
                  <span className="truncate">{doc.mobile || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <FaCity className="text-sm text-blue-500 dark:text-blue-300" />
                  <span className="truncate">{doc.city || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <FaEnvelope className="text-sm text-blue-500 dark:text-blue-300" />
                  <span className="truncate">{doc.email || "-"}</span>
                </div>
              </div>
              {/* Extra effect: Glow on hover */}
              <div className="pointer-events-none absolute -inset-1 z-0 rounded-2xl bg-gradient-to-br from-blue-200/40 to-blue-400/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      )}
      {/* Modal for doctor details */}
      <Modal isOpen={isOpen} onClose={closeModal}>
        {selectedDoctor && (
          <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center p-4">
            <div className="mb-6 flex flex-col items-center">
              {selectedDoctor.profilePicture &&
              selectedDoctor.profilePicture.url ? (
                <img
                  src={selectedDoctor.profilePicture.url}
                  alt={selectedDoctor.name + " profile"}
                  className="mb-2 h-32 w-32 rounded-full border-4 border-blue-400 object-cover shadow-lg"
                />
              ) : (
                <div className="mb-2 flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-300 text-4xl font-semibold text-white dark:border-gray-900 dark:from-blue-800 dark:to-blue-500">
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

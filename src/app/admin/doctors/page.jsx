"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import {
  FaPhone,
  FaCity,
  FaEnvelope,
  FaEye,
  FaFilter,
  FaGlobe,
  FaBuilding,
  FaTimes,
} from "react-icons/fa";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import { Country } from "country-state-city";
import Select from "react-select";

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminDoctorsPage() {
  const { token } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [distributers, setDistributers] = useState([]);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDistributer, setSelectedDistributer] = useState(null);
  const { isOpen, openModal, closeModal } = useModal();
  const dispatch = useDispatch();

  // Fetch distributers list
  useEffect(() => {
    const fetchDistributers = async () => {
      try {
        const data = await fetchWithError("/api/admin/distributers/list", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setDistributers(data.distributers || []);
      } catch (err) {
        console.error("Failed to fetch distributers:", err);
      }
    };
    if (token) {
      fetchDistributers();
    }
  }, [token]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      dispatch(setLoading(true));
      setError(null);
      try {
        const data = await fetchWithError("/api/user/profile?role=doctor", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setAllDoctors(data.doctors || []);
        setDoctors(data.doctors || []);
      } catch (err) {
        setError(err.message || "Failed to fetch doctors");
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchDoctors();
  }, [token, dispatch]);

  // Get unique countries from doctors
  const countryOptions = useMemo(() => {
    const countries = new Set();
    allDoctors.forEach((doc) => {
      if (doc.country) {
        countries.add(doc.country);
      }
    });
    return Array.from(countries)
      .sort()
      .map((country) => ({
        value: country,
        label: country,
      }));
  }, [allDoctors]);

  // Get distributer options
  const distributerOptions = useMemo(() => {
    return [
      { value: "", label: "All Distributers" },
      ...distributers.map((dist) => ({
        value: dist._id,
        label: dist.name,
      })),
    ];
  }, [distributers]);

  // Filter doctors based on selected filters
  useEffect(() => {
    let filtered = [...allDoctors];

    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(
        (doc) => doc.country === selectedCountry.value,
      );
    }

    // Filter by distributer
    if (selectedDistributer && selectedDistributer.value) {
      filtered = filtered.filter((doc) => {
        // Handle both string and ObjectId comparison
        const docDistributerId = doc.distributerId?.toString();
        const selectedId = selectedDistributer.value.toString();
        return docDistributerId === selectedId;
      });
    }

    setDoctors(filtered);
  }, [selectedCountry, selectedDistributer, allDoctors]);

  return (
    <div className="from-white-50 min-h-screen bg-gradient-to-br to-blue-50 px-4 py-10 dark:from-gray-900 dark:to-gray-800">
      <h1 className="mb-8 text-center text-4xl font-extrabold tracking-tight text-blue-700 drop-shadow-lg dark:text-white">
        All Doctors
      </h1>

      {/* Filters Section */}
      <div className="mx-auto mb-10 max-w-6xl">
        <div className="rounded-2xl border border-blue-100 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
          {/* Filter Header */}
          <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4 dark:border-gray-700">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
              <FaFilter size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Filter Doctors
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Narrow down your search by country or distributer
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Country Filter */}
            <div className="group">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FaGlobe className="text-blue-500" />
                Country
              </label>
              <Select
                options={countryOptions}
                value={selectedCountry}
                onChange={setSelectedCountry}
                isClearable
                placeholder="All Countries"
                className="text-sm"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "white",
                    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                    borderWidth: "2px",
                    borderRadius: "0.75rem",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
                      : "none",
                    "&:hover": { borderColor: "#3b82f6" },
                    transition: "all 0.2s",
                    minHeight: "44px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#9ca3af",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    zIndex: 9999,
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#3b82f6"
                      : state.isFocused
                        ? "#eff6ff"
                        : "white",
                    color: state.isSelected ? "white" : "#1f2937",
                    "&:active": { backgroundColor: "#3b82f6" },
                    cursor: "pointer",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#1f2937",
                  }),
                }}
                classNamePrefix="react-select"
              />
            </div>

            {/* Distributer Filter */}
            <div className="group">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <FaBuilding className="text-blue-500" />
                Distributer
              </label>
              <Select
                options={distributerOptions}
                value={selectedDistributer}
                onChange={setSelectedDistributer}
                isClearable
                placeholder="All Distributers"
                className="text-sm"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
                styles={{
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "white",
                    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                    borderWidth: "2px",
                    borderRadius: "0.75rem",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(59, 130, 246, 0.1)"
                      : "none",
                    "&:hover": { borderColor: "#3b82f6" },
                    transition: "all 0.2s",
                    minHeight: "44px",
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#9ca3af",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "0.75rem",
                    boxShadow:
                      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                    zIndex: 9999,
                  }),
                  menuPortal: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#3b82f6"
                      : state.isFocused
                        ? "#eff6ff"
                        : "white",
                    color: state.isSelected ? "white" : "#1f2937",
                    "&:active": { backgroundColor: "#3b82f6" },
                    cursor: "pointer",
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: "#1f2937",
                  }),
                }}
                classNamePrefix="react-select"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              {(selectedCountry || selectedDistributer) && (
                <button
                  onClick={() => {
                    setSelectedCountry(null);
                    setSelectedDistributer(null);
                  }}
                  className="group flex h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-gradient-to-r from-red-50 to-red-50 px-6 text-sm font-semibold text-red-600 shadow-md transition-all duration-200 hover:border-red-300 hover:from-red-100 hover:to-red-100 hover:shadow-lg active:scale-95 dark:border-red-800 dark:from-red-900/20 dark:to-red-900/20 dark:text-red-400 dark:hover:from-red-900/30 dark:hover:to-red-900/30"
                >
                  <FaTimes className="transition-transform group-hover:rotate-90" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Badges */}
          {(selectedCountry || selectedDistributer) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Active filters:
              </span>
              {selectedCountry && (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-300">
                  <FaGlobe size={10} />
                  {selectedCountry.label}
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
              {selectedDistributer && selectedDistributer.value && (
                <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700 shadow-sm dark:bg-purple-900/30 dark:text-purple-300">
                  <FaBuilding size={10} />
                  {selectedDistributer.label}
                  <button
                    onClick={() => setSelectedDistributer(null)}
                    className="ml-1 rounded-full p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800"
                  >
                    <FaTimes size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results count */}
        {doctors.length !== allDoctors.length && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm dark:bg-blue-900/20 dark:text-blue-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></span>
              Showing <span className="font-bold">{doctors.length}</span> of{" "}
              <span className="font-bold">{allDoctors.length}</span> doctors
            </div>
          </div>
        )}
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
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-blue-100/50 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-200/50 dark:border-gray-700/50 dark:from-gray-800 dark:to-gray-900/50 dark:hover:border-blue-700/50 dark:hover:shadow-blue-900/20"
            >
              {/* Decorative Background Elements */}
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

              {/* View Icon Button */}
              <button
                className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-0 shadow-lg transition-all duration-200 hover:scale-110 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl active:scale-95 dark:from-blue-600 dark:to-blue-700"
                onClick={() => {
                  setSelectedDoctor(doc);
                  openModal();
                }}
                title="View Details"
              >
                <FaEye size={18} className="text-white drop-shadow-sm" />
              </button>

              {/* User Badge/Avatar or Profile Picture */}
              <div className="relative mb-6">
                {doc.profilePicture && doc.profilePicture.url ? (
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-75 blur transition-opacity duration-300 group-hover:opacity-100" />
                    <img
                      src={doc.profilePicture.url}
                      alt={doc.name + " profile"}
                      className="relative h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-2xl transition-transform duration-300 group-hover:scale-110 dark:border-gray-800"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-75 blur transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-3xl font-extrabold text-white shadow-2xl transition-transform duration-300 group-hover:scale-110 dark:border-gray-800">
                      {getInitials(doc.name)}
                    </div>
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="mb-2 text-center">
                <h3 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-2xl font-bold text-transparent drop-shadow-sm dark:from-blue-400 dark:to-purple-400">
                  {doc.name}
                </h3>
              </div>

              {/* Type Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-1.5 text-xs font-bold tracking-wide text-blue-700 shadow-md transition-all duration-200 group-hover:border-blue-300 group-hover:shadow-lg dark:border-blue-700 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-blue-300">
                  <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                  {doc.doctorType || "General"}
                </span>
              </div>

              {/* Details */}
              <div className="mt-auto flex w-full flex-col gap-3 rounded-2xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-800/60">
                <div className="flex items-center gap-3 rounded-lg bg-blue-50/50 p-2.5 transition-colors duration-200 group-hover:bg-blue-100/50 dark:bg-blue-900/20 dark:group-hover:bg-blue-900/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                    <FaPhone size={12} />
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {doc.mobile || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-purple-50/50 p-2.5 transition-colors duration-200 group-hover:bg-purple-100/50 dark:bg-purple-900/20 dark:group-hover:bg-purple-900/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
                    <FaCity size={12} />
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {doc.city || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-lg bg-pink-50/50 p-2.5 transition-colors duration-200 group-hover:bg-pink-100/50 dark:bg-pink-900/20 dark:group-hover:bg-pink-900/30">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-md">
                    <FaEnvelope size={12} />
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                    {doc.email || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal for doctor details */}
      <Modal isOpen={isOpen} onClose={closeModal}>
        {selectedDoctor && (
          <div className="mx-auto flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-800">
            {/* Modal Header with Gradient Background */}
            <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 pb-8">
              {/* Decorative Elements */}
              <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-white/20 blur-3xl" />

              <div className="relative z-10 flex flex-col items-center">
                {/* Profile Picture */}
                <div className="relative my-6">
                  <div className="absolute -inset-2 rounded-full bg-white/30 blur-xl" />
                  {selectedDoctor.profilePicture &&
                  selectedDoctor.profilePicture.url ? (
                    <img
                      src={selectedDoctor.profilePicture.url}
                      alt={selectedDoctor.name + " profile"}
                      className="relative h-24 w-24 rounded-full border-4 border-white/50 object-cover shadow-2xl"
                    />
                  ) : (
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/50 bg-gradient-to-br from-white/90 to-white/70 text-3xl font-bold text-blue-600 shadow-2xl backdrop-blur-sm">
                      {getInitials(selectedDoctor.name)}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className="mb-2 text-2xl font-bold text-white drop-shadow-lg">
                  {selectedDoctor.name}
                </h2>

                {/* Doctor Type Badge */}
                {selectedDoctor.doctorType && (
                  <div className="rounded-full border-2 border-white/50 bg-white/20 px-3 py-1 backdrop-blur-sm">
                    <span className="text-xs font-semibold text-white">
                      {selectedDoctor.doctorType}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white p-4 dark:bg-gray-800">
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-lg dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                <UserInfoCard userData={selectedDoctor} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

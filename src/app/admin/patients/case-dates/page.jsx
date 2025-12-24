"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import { toast } from "react-toastify";
import useDebounce from "@/hooks/useDebounce";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import {
  MdCalendarToday,
  MdEdit,
  MdSearch,
  MdFilterList,
  MdCheckCircle,
  MdSchedule,
} from "react-icons/md";
// Format date helper function (date only, no time)
const formatDate = (dateString) => {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

export default function CaseDatesPage() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filter, setFilter] = useState("all"); // 'all', 'withEndDate', 'withoutEndDate'
  const [editingPatient, setEditingPatient] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const startDatePickerRef = useRef(null);
  const endDatePickerRef = useRef(null);
  const startDateFlatpickrRef = useRef(null);
  const endDateFlatpickrRef = useRef(null);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filter]);

  useEffect(() => {
    fetchPatients();
  }, [token, page, filter, debouncedSearchTerm]);

  const fetchPatients = async () => {
    if (!token) return;

    dispatch(setLoading(true));
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (filter === "withEndDate") {
        params.append("hasEndDate", "true");
      } else if (filter === "withoutEndDate") {
        params.append("hasEndDate", "false");
      }

      // Add search parameter if search term exists
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      const data = await fetchWithError(
        `/api/admin/patients/case-dates?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setPatients(data.patients || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    // Set start date
    if (patient.caseStartDate) {
      const date = new Date(patient.caseStartDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setStartDate(`${year}-${month}-${day}`);
    } else {
      setStartDate("");
    }
    // Set end date
    if (patient.caseEndDate) {
      const date = new Date(patient.caseEndDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      setEndDate(`${year}-${month}-${day}`);
    } else {
      setEndDate("");
    }
  };

  // Initialize flatpickr date pickers
  const initializeDatePickers = () => {
    if (!startDatePickerRef.current || !endDatePickerRef.current) return;

    // Destroy existing instances
    if (startDateFlatpickrRef.current) {
      try {
        startDateFlatpickrRef.current.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
      startDateFlatpickrRef.current = null;
    }
    if (endDateFlatpickrRef.current) {
      try {
        endDateFlatpickrRef.current.destroy();
      } catch (e) {
        // Ignore destroy errors
      }
      endDateFlatpickrRef.current = null;
    }

    // Get minimum dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const minStartDate = tomorrow;

    // Initialize start date picker
    try {
      startDateFlatpickrRef.current = flatpickr(startDatePickerRef.current, {
        dateFormat: "Y-m-d",
        defaultDate: startDate || null,
        minDate: minStartDate,
        static: false,
        clickOpens: true,
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            const date = selectedDates[0];
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const dateStr = `${year}-${month}-${day}`;
            setStartDate(dateStr);

            // Update end date min date
            if (endDateFlatpickrRef.current) {
              const minEndDate = new Date(date);
              minEndDate.setDate(minEndDate.getDate() + 1);
              minEndDate.setHours(0, 0, 0, 0);
              endDateFlatpickrRef.current.set("minDate", minEndDate);

              // Clear end date if it's now invalid
              if (endDate) {
                const end = new Date(endDate);
                end.setHours(0, 0, 0, 0);
                if (end <= date) {
                  setEndDate("");
                  endDateFlatpickrRef.current.clear();
                }
              }
            }
          } else {
            setStartDate("");
          }
        },
      });
    } catch (error) {
      console.error("Error initializing start date picker:", error);
    }

    // Initialize end date picker
    const minEndDate = startDate
      ? (() => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + 1);
          date.setHours(0, 0, 0, 0);
          return date;
        })()
      : minStartDate;

    try {
      endDateFlatpickrRef.current = flatpickr(endDatePickerRef.current, {
        dateFormat: "Y-m-d",
        defaultDate: endDate || null,
        minDate: minEndDate,
        static: false,
        clickOpens: true,
        onChange: (selectedDates) => {
          if (selectedDates.length > 0) {
            const date = selectedDates[0];
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            setEndDate(`${year}-${month}-${day}`);
          } else {
            setEndDate("");
          }
        },
      });
    } catch (error) {
      console.error("Error initializing end date picker:", error);
    }
  };

  // Initialize flatpickr when editing starts
  useEffect(() => {
    if (editingPatient) {
      // Small delay to ensure DOM is ready and state is updated
      const timer = setTimeout(() => {
        if (startDatePickerRef.current && endDatePickerRef.current) {
          initializeDatePickers();
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        // Cleanup on unmount or when editing ends
        if (startDateFlatpickrRef.current) {
          startDateFlatpickrRef.current.destroy();
          startDateFlatpickrRef.current = null;
        }
        if (endDateFlatpickrRef.current) {
          endDateFlatpickrRef.current.destroy();
          endDateFlatpickrRef.current = null;
        }
      };
    } else {
      // Cleanup when not editing
      if (startDateFlatpickrRef.current) {
        startDateFlatpickrRef.current.destroy();
        startDateFlatpickrRef.current = null;
      }
      if (endDateFlatpickrRef.current) {
        endDateFlatpickrRef.current.destroy();
        endDateFlatpickrRef.current = null;
      }
    }
  }, [editingPatient]);

  const handleSave = async () => {
    // Validate that end date is after start date if both are provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        toast.error("End date must be greater than start date");
        return;
      }
    }

    // Check if case is approved before allowing end date assignment
    if (endDate && editingPatient.caseStatus !== "approved") {
      toast.error("Case deadline can only be assigned if the case is approved");
      return;
    }

    setIsSaving(true);
    try {
      await fetchWithError("/api/admin/patients/case-dates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: editingPatient._id,
          caseStartDate: startDate || null,
          caseEndDate: endDate || null,
        }),
      });

      toast.success("Case dates updated successfully!");
      setEditingPatient(null);
      setStartDate("");
      setEndDate("");
      fetchPatients();
    } catch (error) {
      console.error("Failed to update dates:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingPatient(null);
    setStartDate("");
    setEndDate("");
  };

  // Get minimum date for start date (tomorrow)
  const getMinStartDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Get minimum date for end date (start date + 1 day, or tomorrow if no start date)
  const getMinEndDate = () => {
    if (startDate) {
      const minDate = new Date(startDate);
      minDate.setDate(minDate.getDate() + 1);
      return minDate.toISOString().split("T")[0];
    }
    return getMinStartDate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-10 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-lg dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            Case Date Management
          </h1>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Manage start and end dates for approved patient cases
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 rounded-2xl border border-blue-100 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <MdSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by patient name or case ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pr-4 pl-10 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <MdFilterList className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full appearance-none rounded-xl border-2 border-gray-200 bg-white py-3 pr-10 pl-10 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="all">All Cases</option>
                <option value="withoutEndDate">Without End Date</option>
                <option value="withEndDate">With End Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-100 via-white to-purple-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Case ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Patient Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Doctor
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    End Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {patients.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      No patients found
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr
                      key={patient._id}
                      className="transition-colors duration-200 hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {patient.caseId || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {patient.patientName || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {patient.userId?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {editingPatient?._id === patient._id ? (
                          <div className="relative">
                            <input
                              ref={startDatePickerRef}
                              type="text"
                              placeholder="Select start date"
                              readOnly
                              className="w-full cursor-pointer rounded-lg border-2 border-blue-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <MdCalendarToday className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-blue-500" />
                          </div>
                        ) : patient.caseStartDate ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <MdCalendarToday className="h-4 w-4 text-blue-500" />
                            <span>{formatDate(patient.caseStartDate)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Not set</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingPatient?._id === patient._id ? (
                          <div className="relative">
                            <input
                              ref={endDatePickerRef}
                              type="text"
                              placeholder="Select end date"
                              readOnly
                              className="w-full cursor-pointer rounded-lg border-2 border-blue-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <MdCalendarToday className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-blue-500" />
                          </div>
                        ) : patient.caseEndDate ? (
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                            <MdCheckCircle className="h-4 w-4" />
                            <span>{formatDate(patient.caseEndDate)}</span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                            <MdSchedule className="h-4 w-4" />
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingPatient?._id === patient._id ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={handleSave}
                              disabled={isSaving}
                              className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-green-600 disabled:opacity-50"
                            >
                              {isSaving ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={handleCancel}
                              disabled={isSaving}
                              className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-gray-600 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(patient)}
                            className="mx-auto flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-600"
                          >
                            <MdEdit className="h-4 w-4" />
                            {patient.caseEndDate ? "Edit" : "Assign"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import useDebounce from "@/hooks/useDebounce";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useDispatch } from "react-redux";
import { setLoading } from "@/store/features/uiSlice";

const STATUS_OPTIONS = ["in-progress", "midway", "completed"];

export default function ManagePatientStatusPage() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { token } = useSelector((state) => state.auth) || {};
  const dispatch = useDispatch();

  useEffect(() => {
    async function fetchPatients() {
      setError(null);
      try {
        const url = new URL(
          "/api/doctor/patients/manage-status",
          window.location.origin,
        );
        if (debouncedSearchTerm) {
          url.searchParams.append("search", debouncedSearchTerm);
        }
        dispatch(setLoading(true));
        const data = await fetchWithError(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPatients(data.patients || []);
      } catch (err) {
        setError(err.message || "Failed to fetch patients");
      } finally {
        dispatch(setLoading(false));
      }
    }
    if (token) fetchPatients();
  }, [token, debouncedSearchTerm, dispatch]);

  const handleStatusChange = async (patientId, newStatus) => {
    const toastId = toast.loading("Updating status...");
    dispatch(setLoading(true));
    try {
      await fetchWithError("/api/doctor/patients/manage-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId, status: newStatus }),
      });
      setPatients((prev) =>
        prev.map((p) =>
          p._id === patientId ? { ...p, progressStatus: newStatus } : p,
        ),
      );
      toast.dismiss(toastId);
      toast.success("Status updated successfully");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to update status");
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
            Manage Patient Progress
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
            View and update the status of your patients
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, city, or case ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>
      </div>
      <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />
      <div className="relative mx-auto w-full max-w-4xl overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[10px]">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                S.N.
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                CaseId
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                Name
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                City
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient, idx) => (
              <TableRow
                key={patient._id}
                className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-7 items-center text-[10px]`}
                style={{
                  fontFamily: "Inter, sans-serif",
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                <TableCell className="px-1 py-0.5 text-center font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                  {idx + 1}
                </TableCell>
                <TableCell className="px-1 py-0.5 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
                  {patient.caseId}
                </TableCell>
                <TableCell className="px-1 py-0.5 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
                  {patient.patientName || patient.name}
                </TableCell>
                <TableCell className="px-1 py-0.5 text-center font-medium">
                  {patient.city || "-"}
                </TableCell>
                <TableCell className="border p-2 text-center">
                  <select
                    value={patient.progressStatus || STATUS_OPTIONS[0]}
                    onChange={(e) =>
                      handleStatusChange(patient._id, e.target.value)
                    }
                    className="rounded border bg-white px-2 py-1 dark:bg-gray-800"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

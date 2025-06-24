"use client";
import { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import useDebounce from '@/hooks/useDebounce';

const STATUS_OPTIONS = ["in-progress", "midway", "completed"];

export default function ManagePatientStatusPage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { token } = useSelector((state) => state.auth) || {};

  useEffect(() => {
    async function fetchPatients() {
      if (!loading) {
        setIsSearching(true);
      }
      setError(null);
      try {
        const url = new URL('/api/admin/patients/manage-status', window.location.origin);
        if (debouncedSearchTerm) {
          url.searchParams.append('search', debouncedSearchTerm);
        }
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch patients");
        setPatients(data.patients || []);
      } catch (err) {
        setError(err.message || "Failed to fetch patients");
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }
    if (token) fetchPatients();
  }, [token, debouncedSearchTerm]);
  console.log(patients)
  const handleStatusChange = async (patientId, newStatus) => {
    setUpdating((prev) => ({ ...prev, [patientId]: true }));
    const toastId = toast.loading("Updating status...");
    try {
      const res = await fetch("/api/admin/patients/manage-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ patientId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      setPatients((prev) =>
        prev.map((p) => (p._id === patientId ? { ...p, progressStatus: newStatus } : p))
      );
      toast.dismiss(toastId);
      toast.success("Status updated successfully");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdating((prev) => ({ ...prev, [patientId]: false }));
    }
  };

  if (loading) return (
    <div className="p-5 lg:p-6 flex items-center justify-center h-64">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 rounded-full animate-spin border-t-brand-500"></div>
    </div>
  );
  if (error) return <div className="text-red-500 p-6">{error}</div>;

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
            Manage Patient Progress
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
            View and update the status of your patients
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, city, or case ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-gray-700 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>
      <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />
      <div className="relative rounded-xl border border-transparent bg-white/90 dark:bg-gray-900/80 shadow-xl mx-auto max-w-4xl w-full backdrop-blur-md overflow-x-auto">
        {isSearching && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-xl">
            <div className="w-12 h-12 border-4 border-t-4 border-gray-200 rounded-full animate-spin border-t-brand-500"></div>
          </div>
        )}
        <Table className="min-w-full text-[10px] font-sans mx-auto relative z-10">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl border-b-2 border-blue-200 dark:border-blue-900 backdrop-blur-sm">
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">S.N.</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">CaseId</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Name</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">City</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Status</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient, idx) => (
              <TableRow
                key={patient._id}
                className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp h-7 items-center text-[10px]`}
                style={{ fontFamily: 'Inter, sans-serif', animationDelay: `${idx * 30}ms` }}
              >
                <TableCell className="font-semibold text-gray-700 dark:text-gray-300 text-center py-0.5 px-1">{idx + 1}</TableCell>
                <TableCell className="font-semibold text-blue-600 dark:text-blue-300 text-center py-0.5 px-1">{patient.caseId}</TableCell>
                <TableCell className="font-semibold text-blue-600 dark:text-blue-300 text-center py-0.5 px-1">{patient.patientName || patient.name}</TableCell>
                <TableCell className="font-medium text-center py-0.5 px-1">{patient.city || '-'}</TableCell>
                <TableCell className="p-2 border text-center">
                  <select
                    value={patient.progressStatus || STATUS_OPTIONS[0]}
                    disabled={updating[patient._id]}
                    onChange={e => handleStatusChange(patient._id, e.target.value)}
                    className="rounded border px-2 py-1 bg-white dark:bg-gray-800"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
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
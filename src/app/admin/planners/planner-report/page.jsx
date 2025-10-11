"use client";
import Input from "@/components/form/input/InputField";
import Pagination from "@/components/tables/Pagination";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { MdDownload, MdSearch } from "react-icons/md";

export default function PlannerReport() {
  const [patients, setPatients] = useState([]);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const { token } = useSelector((state) => state.auth) || {};

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasPlannerAccess(false);
        return;
      }
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasPlannerAccess(!!data.user?.plannerAccess);
      } catch (err) {
        setHasPlannerAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  useEffect(() => {
    if (hasPlannerAccess) {
      fetchPatients();
    }
  }, [currentPage, hasPlannerAccess]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "50",
        search: search,
      });
      const data = await fetchWithError(`/api/admin/planner-report?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPatients(data.patients);
      setTotalPages(data.pagination.totalPages);
      setTotalPatients(data.pagination.totalPatients);
    } catch (err) {
      toast.error(err.message || "Failed to fetch planner report");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return "Invalid date";
    }
  };

  const calculateDelay = (deadline, submissionDate, isUploaded) => {
    if (!deadline || !submissionDate || !isUploaded) return null;

    const deadlineTime = new Date(deadline).getTime();
    const submissionTime = new Date(submissionDate).getTime();
    const difference = submissionTime - deadlineTime;

    if (difference <= 0) {
      return { text: "On Time", color: "text-green-600" };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    return {
      text: `Delayed by ${days}d ${hours}h`,
      color: "text-red-600",
    };
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      // Fetch all data without pagination for export
      const params = new URLSearchParams({
        page: "1",
        limit: "10000", // Large number to get all records
        search: search,
      });
      const data = await fetchWithError(`/api/admin/planner-report?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Prepare data for Excel
      const excelData = data.patients.map((patient) => {
        const delay = calculateDelay(
          patient.plannerDeadline,
          patient.stlFile?.uploadedAt,
          patient.stlFile?.uploaded,
        );
        return {
          "Case ID": patient.caseId,
          "Patient Name": patient.patientName,
          "Planner Name": patient.plannerId?.name || "N/A",
          "Planner Email": patient.plannerId?.email || "N/A",
          Location: `${patient.city}, ${patient.country}`,
          "Case Status": patient.caseStatus,
          "Assigned Date": patient.plannerAssignedAt
            ? new Date(patient.plannerAssignedAt).toLocaleString()
            : "Not set",
          Deadline: patient.plannerDeadline
            ? new Date(patient.plannerDeadline).toLocaleString()
            : "Not set",
          "Submission Date":
            patient.stlFile?.uploaded && patient.stlFile?.uploadedAt
              ? new Date(patient.stlFile.uploadedAt).toLocaleString()
              : "Not submitted yet",
          "Submission Status": patient.stlFile?.uploaded
            ? "Submitted"
            : "Pending",
          "Delay Status": delay ? delay.text : "N/A",
        };
      });

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws["!cols"] = [
        { wch: 12 }, // Case ID
        { wch: 20 }, // Patient Name
        { wch: 20 }, // Planner Name
        { wch: 25 }, // Planner Email
        { wch: 20 }, // Location
        { wch: 15 }, // Case Status
        { wch: 20 }, // Assigned Date
        { wch: 20 }, // Deadline
        { wch: 20 }, // Submission Date
        { wch: 15 }, // Submission Status
        { wch: 20 }, // Delay Status
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Planner Report");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `Planner_Report_${timestamp}.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      toast.success("Report exported successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  if (hasPlannerAccess === false) {
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

  if (hasPlannerAccess === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-blue-800 subpixel-antialiased dark:text-white">
            Planner Performance Report
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Track planner assignments, deadlines, and submission status
          </p>
        </div>
        <Button
          onClick={exportToExcel}
          disabled={loading || patients.length === 0}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MdDownload className="text-lg" />
          Export to Excel
        </Button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by case ID or patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MdSearch className="text-lg" />
            Search
          </Button>
        </div>
      </form>

      {/* Stats Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total Cases
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {totalPatients}
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {patients.filter((p) => p.stlFile?.uploaded).length}
          </p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {patients.filter((p) => !p.stlFile?.uploaded).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="before:border-gradient-to-r before:animate-border-glow relative overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 dark:bg-gray-900/80">
        <Table className="relative z-10 min-w-full text-xs">
          <TableHeader>
            <TableRow className="border-b-2 border-blue-200 bg-gradient-to-r from-blue-100 to-blue-50 dark:border-blue-900 dark:from-blue-900 dark:to-gray-900">
              <TableCell
                isHeader
                className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-200"
              >
                Case ID
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-200"
              >
                Patient Name
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-200"
              >
                Planner
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-200"
              >
                Location
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-200"
              >
                Assigned Date
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-200"
              >
                Deadline
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-left font-semibold text-blue-700 dark:text-blue-200"
              >
                Submission Date
              </TableCell>
              <TableCell
                isHeader
                className="px-3 py-2 text-center font-semibold text-blue-700 dark:text-blue-200"
              >
                Status
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-8 text-center text-gray-500"
                >
                  No data found
                </TableCell>
              </TableRow>
            ) : (
              patients.map((patient, idx) => {
                const delay = calculateDelay(
                  patient.plannerDeadline,
                  patient.stlFile?.uploadedAt,
                  patient.stlFile?.uploaded,
                );
                const isDelayed = delay && delay.color === "text-red-600";

                return (
                  <TableRow
                    key={patient._id}
                    className={`${
                      isDelayed
                        ? "border-l-4 border-red-500 bg-red-50/50 dark:border-red-500 dark:bg-red-900/20"
                        : idx % 2 === 1
                          ? "bg-blue-50/50 dark:bg-gray-900/30"
                          : "bg-white dark:bg-gray-900/50"
                    } transition-colors hover:bg-blue-100/70 dark:hover:bg-blue-900/40`}
                  >
                    <TableCell className="px-3 py-2 text-left font-semibold text-blue-600 dark:text-blue-300">
                      {patient.caseId}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-left">
                      {patient.patientName}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-left">
                      <div className="text-xs">
                        <div className="font-medium">
                          {patient.plannerId?.name || "N/A"}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {patient.plannerId?.email || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-left">
                      <div className="text-[10px]">
                        <div>{patient.city}</div>
                        <div className="text-gray-500">{patient.country}</div>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-left text-[10px]">
                      {formatDateTime(patient.plannerAssignedAt)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-left text-[10px]">
                      {formatDateTime(patient.plannerDeadline)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-left text-[10px]">
                      {patient.stlFile?.uploaded && patient.stlFile?.uploadedAt
                        ? formatDateTime(patient.stlFile.uploadedAt)
                        : "Not submitted yet"}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {patient.stlFile?.uploaded ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-[10px] font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
                            Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                            Pending
                          </span>
                        )}
                        {delay && (
                          <span
                            className={`text-[10px] font-semibold ${delay.color}`}
                          >
                            {delay.text}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}

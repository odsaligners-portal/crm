"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function PaymentStatus() {
  const { token } = useSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [filteredTotalPatients, setFilteredTotalPatients] = useState(0);
  const [filteredTotalPages, setFilteredTotalPages] = useState(1);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [editablePatients, setEditablePatients] = useState({});
  const [updatingPatientId, setUpdatingPatientId] = useState(null);
  const [hasPriceUpdateAccess, setHasPriceUpdateAccess] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasPriceUpdateAccess(false);
        return;
      }
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setHasPriceUpdateAccess(data.user?.priceUpdateAccess);
      } catch (err) {
        setHasPriceUpdateAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  const fetchPatients = async () => {
    dispatch(setLoading(true));
    try {
      let params;
      if (pendingOnly) {
        params = new URLSearchParams({
          page: "1",
          limit: "10000",
          sort: "latest",
          caseStatus: "approved",
          search: searchTerm,
        });
      } else {
        params = new URLSearchParams({
          page: currentPage.toString(),
          limit: "10",
          sort: "latest",
          caseStatus: "approved",
          search: searchTerm,
        });
      }

      const data = await fetchWithError(`/api/admin/patients?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const editable = {};
      const source = pendingOnly
        ? data.patients.filter((p) => (p.amount?.pending ?? 0) > 0)
        : data.patients;

      source.forEach((p) => {
        editable[p._id] = {
          total: p.amount?.total ?? 0,
          received: p.amount?.received ?? 0,
        };
      });

      setEditablePatients(editable);

      if (pendingOnly) {
        setFilteredPatients(source);
        setFilteredTotalPatients(source.length);
        setFilteredTotalPages(Math.ceil(source.length / 10) || 1);
        setCurrentPage(1);
      } else {
        setPatients(data.patients);
        setTotalPages(data.pagination.totalPages);
        setTotalPatients(data.pagination.totalPatients);
        setFilteredPatients([]);
        setFilteredTotalPatients(0);
        setFilteredTotalPages(1);
      }
    } catch (error) {
      // fetchWithError already handles toasts
    } finally {
      dispatch(setLoading(false));
    }
  };

  const updateAmount = async (patientId, payload) => {
    if (!patientId || (!payload.totalAmount && !payload.receivedAmount)) return;
    setUpdatingPatientId(patientId);
    try {
      await fetchWithError(
        `/api/admin/patients/update-payments?id=${patientId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );
      fetchPatients(); // refresh data after update
    } catch (error) {
      // already handled by fetchWithError
    } finally {
      setUpdatingPatientId(null);
    }
  };

  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line
  }, [currentPage, searchTerm, pendingOnly]);

  const displayedPatients = pendingOnly
    ? filteredPatients.slice((currentPage - 1) * 10, currentPage * 10)
    : patients;

  if (hasPriceUpdateAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to View This Page.
        </span>
      </div>
    );
  }
  if (hasPriceUpdateAccess === null) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      {/* Heading & Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
            Payment Status
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
            View payment status for all patients
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Search by name, city, or case ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-xs min-w-[300px] rounded-lg border border-blue-100 shadow-sm focus:ring-2 focus:ring-blue-300"
          />
          <Button
            type="button"
            className="h-10 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-4 font-semibold text-white shadow-md transition-transform hover:scale-105"
            onClick={() => fetchPatients()}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Pending Filter */}
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 font-semibold text-blue-700 dark:text-blue-200">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          Show only pending payments
        </label>
      </div>

      {/* Table */}
      <div className="before:border-gradient-to-r before:animate-border-glow relative mx-auto w-full max-w-6xl overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 sm:overflow-x-visible dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[10px]">
          {displayedPatients.length > 0 && (
            <>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Case ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Patient Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Location
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Total Payment
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Received
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 dark:text-blue-200"
                  >
                    Pending
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedPatients.map((patient, idx) => (
                  <TableRow
                    key={patient._id}
                    className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${
                      idx % 2 === 1
                        ? "bg-blue-50/50 dark:bg-gray-900/30"
                        : "bg-white/70 dark:bg-gray-900/50"
                    } animate-fadeInUp h-10 items-center`}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      animationDelay: `${idx * 30}ms`,
                    }}
                  >
                    <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 dark:text-blue-300">
                      {patient.caseId}
                    </TableCell>
                    <TableCell className="flex h-10 items-center justify-center gap-2 px-2 py-1 text-center font-medium">
                      {patient.patientName}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center">
                      <div className="text-[10px] leading-tight">
                        <div>{patient.city}</div>
                        <div className="text-[9px] text-gray-500">
                          {patient.country}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center font-semibold text-green-700 dark:text-green-300">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={
                            Number.isFinite(
                              editablePatients[patient._id]?.total,
                            )
                              ? editablePatients[patient._id]?.total
                              : 0
                          }
                          className="w-20 rounded border px-1 py-0.5 text-center text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                          onChange={(e) =>
                            setEditablePatients((prev) => ({
                              ...prev,
                              [patient._id]: {
                                ...prev[patient._id],
                                total: parseInt(e.target.value),
                              },
                            }))
                          }
                          onBlur={() =>
                            updateAmount(patient._id, {
                              totalAmount: editablePatients[patient._id]?.total,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.target.blur();
                          }}
                        />
                        {updatingPatientId === patient._id && (
                          <svg
                            className="ml-1 h-3 w-3 animate-spin text-blue-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                            />
                          </svg>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center font-semibold text-blue-700 dark:text-blue-300">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={
                            Number.isFinite(
                              editablePatients[patient._id]?.received,
                            )
                              ? editablePatients[patient._id]?.received
                              : 0
                          }
                          className="w-20 rounded border px-1 py-0.5 text-center text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                          onChange={(e) =>
                            setEditablePatients((prev) => ({
                              ...prev,
                              [patient._id]: {
                                ...prev[patient._id],
                                received: parseInt(e.target.value),
                              },
                            }))
                          }
                          onBlur={() =>
                            updateAmount(patient._id, {
                              receivedAmount:
                                editablePatients[patient._id]?.received,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") e.target.blur();
                          }}
                        />
                        {updatingPatientId === patient._id && (
                          <svg
                            className="ml-1 h-3 w-3 animate-spin text-blue-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                            />
                          </svg>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center font-semibold text-red-700 dark:text-red-300">
                      ₹{patient.amount?.pending ?? 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </>
          )}
        </Table>
      </div>

      {/* Pagination */}
      {(pendingOnly ? filteredTotalPages : totalPages) > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(
              currentPage * 10,
              pendingOnly ? filteredTotalPatients : totalPatients,
            )}{" "}
            of {pendingOnly ? filteredTotalPatients : totalPatients} patients
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of{" "}
              {pendingOnly ? filteredTotalPages : totalPages}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(
                    prev + 1,
                    pendingOnly ? filteredTotalPages : totalPages,
                  ),
                )
              }
              disabled={
                currentPage === (pendingOnly ? filteredTotalPages : totalPages)
              }
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* No Data */}
      {displayedPatients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            width="120"
            height="120"
            fill="none"
            className="mb-6 opacity-60"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              r="56"
              stroke="#3b82f6"
              strokeWidth="4"
              fill="#e0e7ff"
            />
            <path
              d="M40 80c0-11 9-20 20-20s20 9 20 20"
              stroke="#6366f1"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="60" cy="54" r="10" fill="#6366f1" />
          </svg>
          <div className="mb-2 text-2xl font-semibold text-blue-700 dark:text-blue-200">
            No patients found
          </div>
          <div className="mb-6 text-gray-500">
            Try adjusting your filters or add a new patient record.
          </div>
        </div>
      )}
    </div>
  );
}

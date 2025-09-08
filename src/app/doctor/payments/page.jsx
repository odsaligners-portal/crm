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
  const [userCountry, setUserCountry] = useState("");
  const [paymentLimit, setPaymentLimit] = useState("");
  const [currencySymbol, setCurrencySymbol] = useState("$");
  const dispatch = useDispatch();

  const fetchUserProfile = async () => {
    try {
      const response = await fetchWithError("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.user) {
        const country = response.user.country;
        setUserCountry(country);

        // Set payment limit based on country
        if (country && country.toLowerCase() === "india") {
          setPaymentLimit("₹50,000");
          setCurrencySymbol("₹");
        } else {
          setPaymentLimit("$1,000");
          setCurrencySymbol("$");
        }
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // Set default limit if API fails
      setPaymentLimit("$1,000");
      setCurrencySymbol("$");
    }
  };

  const fetchPatients = async () => {
    dispatch(setLoading(true));
    try {
      let params;
      if (pendingOnly) {
        params = new URLSearchParams({
          page: "1",
          limit: "10000", // fetch all for client-side filtering
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
      const data = await fetchWithError(`/api/patients?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (pendingOnly) {
        const filtered = data.patients.filter(
          (p) => (p.amount?.pending ?? 0) > 0,
        );
        setFilteredPatients(filtered);
        setFilteredTotalPatients(filtered.length);
        setFilteredTotalPages(Math.ceil(filtered.length / 10) || 1);
        setCurrentPage(1); // reset to first page when toggling filter
      } else {
        setPatients(data.patients);
        setTotalPages(data.pagination.totalPages);
        setTotalPatients(data.pagination.totalPatients);
        setFilteredPatients([]);
        setFilteredTotalPatients(0);
        setFilteredTotalPages(1);
      }
    } catch (error) {
      // fetchWithError already toasts
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchUserProfile();
    fetchPatients();
    // eslint-disable-next-line
  }, [currentPage, searchTerm, pendingOnly]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      {/* Payment Limit Banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-4 shadow-lg dark:border-amber-700/50 dark:from-amber-900/20 dark:to-yellow-900/20">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500">
              {currencySymbol === "₹" ? (
                <svg
                  className="h-6 w-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-800 dark:text-amber-200">
                Payment Limit
              </h3>
              <p className="text-amber-700 dark:text-amber-300">
                Maximum credit limit is{" "}
                <span className="font-bold text-amber-900 dark:text-amber-100">
                  {paymentLimit}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

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
            className="h-10 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-4 font-semibold text-white subpixel-antialiased shadow-md transition-transform hover:scale-105"
            onClick={() => fetchPatients()}
          >
            Search
          </Button>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={(e) => setPendingOnly(e.target.checked)}
            className="h-4 w-4 accent-blue-600"
          />
          Show only pending payments
        </label>
      </div>
      <div className="before:border-gradient-to-r before:animate-border-glow relative mx-auto w-full max-w-6xl overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 sm:overflow-x-visible dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[10px]">
          {(pendingOnly ? filteredPatients.length : patients.length) > 0 && (
            <>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Case ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Patient Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Location
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Total Payment
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Remaining Payment
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pendingOnly
                  ? filteredPatients.slice(
                      (currentPage - 1) * 10,
                      currentPage * 10,
                    )
                  : patients
                ).map((patient, idx) => (
                  <TableRow
                    key={patient._id}
                    className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-10 items-center`}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      animationDelay: `${idx * 30}ms`,
                    }}
                  >
                    <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
                      {patient.caseId}
                    </TableCell>
                    <TableCell className="flex h-10 items-center justify-center gap-2 px-2 py-1 text-center font-medium">
                      <span className="flex items-center">
                        {patient.patientName}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center">
                      <div className="text-[10px] leading-tight">
                        <div>{patient.city}</div>
                        <div className="text-[9px] text-gray-500">
                          {patient.country}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center font-semibold text-green-700 subpixel-antialiased dark:text-green-300">
                      ₹{patient.amount?.total ?? 0}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center font-semibold text-red-700 subpixel-antialiased dark:text-red-300">
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
      {(pendingOnly ? filteredPatients.length : patients.length) === 0 && (
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
          <div className="mb-2 text-2xl font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200">
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

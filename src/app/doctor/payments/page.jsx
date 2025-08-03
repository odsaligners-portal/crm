"use client";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { setLoading } from '@/store/features/uiSlice';
import { fetchWithError } from '@/utils/apiErrorHandler';

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
  const dispatch = useDispatch();

  const fetchPatients = async () => {
    dispatch(setLoading(true));
    try {
      let params;
      if (pendingOnly) {
        params = new URLSearchParams({
          page: '1',
          limit: '10000', // fetch all for client-side filtering
          sort: 'latest',
          caseStatus: 'approved',
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
        const filtered = data.patients.filter(p => (p.amount?.pending ?? 0) > 0);
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
    fetchPatients();
    // eslint-disable-next-line
  }, [currentPage, searchTerm, pendingOnly]);

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
            Payment Status
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
            View payment status for all patients
          </p>
        </div>
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Search by name, city, or case ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full min-w-[300px] max-w-xs shadow-sm rounded-lg border border-blue-100 focus:ring-2 focus:ring-blue-300"
          />
          <Button
            type="button"
            className="h-10 px-4 shadow-md bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
            onClick={() => fetchPatients()}
          >
            Search
          </Button>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-blue-700 dark:text-blue-200 font-semibold">
          <input
            type="checkbox"
            checked={pendingOnly}
            onChange={e => setPendingOnly(e.target.checked)}
            className="accent-blue-600 h-4 w-4"
          />
          Show only pending payments
        </label>
      </div>
      <div className="relative rounded-xl border border-transparent bg-white/90 dark:bg-gray-900/80 shadow-xl mx-auto max-w-6xl w-full backdrop-blur-md overflow-x-auto sm:overflow-x-visible before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-gradient-to-r before:from-blue-200 before:via-purple-100 before:to-blue-100 before:animate-border-glow before:pointer-events-none">
        <Table className="min-w-full text-[10px] font-sans mx-auto relative z-10">
          {(pendingOnly ? filteredPatients.length : patients.length) > 0 && (
            <>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl border-b-2 border-blue-200 dark:border-blue-900 backdrop-blur-sm">
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Case ID</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Patient Name</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Location</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Total Payment</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Remaining Payment</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(pendingOnly
                  ? filteredPatients.slice((currentPage - 1) * 10, currentPage * 10)
                  : patients
                ).map((patient, idx) => (
                  <TableRow
                    key={patient._id}
                    className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp h-10 items-center`}
                    style={{ fontFamily: 'Inter, sans-serif', animationDelay: `${idx * 30}ms` }}
                  >
                    <TableCell className="font-semibold text-blue-600 dark:text-blue-300 text-center py-1 px-2">{patient.caseId}</TableCell>
                    <TableCell className="h-10 flex justify-center items-center gap-2 font-medium text-center py-1 px-2">
                      <span className="flex items-center">{patient.patientName}</span>
                    </TableCell>
                    <TableCell className="text-center py-1 px-2">
                      <div className="text-[10px] leading-tight">
                        <div>{patient.city}</div>
                        <div className="text-gray-500 text-[9px]">{patient.country}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-1 px-2 font-bold text-green-700 dark:text-green-300">
                      ₹{patient.amount?.total ?? 0}
                    </TableCell>
                    <TableCell className="text-center py-1 px-2 font-bold text-red-700 dark:text-red-300">
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
            Showing {((currentPage - 1) * 10) + 1} to{" "}
            {Math.min(currentPage * 10, pendingOnly ? filteredTotalPatients : totalPatients)} of {pendingOnly ? filteredTotalPatients : totalPatients} patients
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {pendingOnly ? filteredTotalPages : totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pendingOnly ? filteredTotalPages : totalPages))}
              disabled={currentPage === (pendingOnly ? filteredTotalPages : totalPages)}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {((pendingOnly ? filteredPatients.length : patients.length) === 0) && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg width="120" height="120" fill="none" className="mb-6 opacity-60" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" stroke="#3b82f6" strokeWidth="4" fill="#e0e7ff" /><path d="M40 80c0-11 9-20 20-20s20 9 20 20" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" /><circle cx="60" cy="54" r="10" fill="#6366f1" /></svg>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">No patients found</div>
          <div className="text-gray-500 mb-6">Try adjusting your filters or add a new patient record.</div>
        </div>
      )}
    </div>
  );
} 
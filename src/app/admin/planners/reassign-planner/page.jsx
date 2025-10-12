"use client";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/select/SelectField";
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
import { Modal } from "@/components/ui/modal";

export default function ReassignPlanner() {
  const [patients, setPatients] = useState([]);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(false);
  const [planners, setPlanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterWithPlanner, setFilterWithPlanner] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedPlannerId, setSelectedPlannerId] = useState("");
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

  // When search or filter changes, reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterWithPlanner]);

  useEffect(() => {
    fetchPatients();
    fetchPlanners();
  }, [currentPage]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/patients?search=${encodeURIComponent(search)}&page=${currentPage}&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch patients");
      setPatients(data.patients || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalPatients(
        data.pagination?.totalPatients || data.patients?.length || 0,
      );
    } catch (err) {
      toast.error(err.message || "Failed to fetch patients");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlanners = async () => {
    try {
      const res = await fetch(`/api/admin/other-admins?role=planner`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch planners");
      setPlanners(data.admins || []);
    } catch (err) {
      toast.error(err.message || "Failed to fetch planners");
    }
  };

  const handleReassignClick = (patient, plannerId) => {
    if (!plannerId) {
      toast.error("Please select a planner");
      return;
    }
    setSelectedPatient(patient);
    setSelectedPlannerId(plannerId);
    setShowConfirmModal(true);
  };

  const handleConfirmReassign = async () => {
    if (!selectedPatient || !selectedPlannerId) return;

    setLoading(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch(`/api/admin/patients/reassign-planner`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          plannerId: selectedPlannerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reassign planner");
      toast.success(
        "Planner reassigned successfully! Case status reset to Setup Pending.",
      );
      fetchPatients();
    } catch (err) {
      toast.error(err.message || "Failed to reassign planner");
    } finally {
      setLoading(false);
      setSelectedPatient(null);
      setSelectedPlannerId("");
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      (!filterWithPlanner ||
        (p.plannerId && p.plannerId !== "" && p.plannerId !== null)) &&
      (!search ||
        p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        p.doctorName?.toLowerCase().includes(search.toLowerCase()) ||
        p.caseId?.toLowerCase().includes(search.toLowerCase())),
  );

  if (hasPlannerAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 subpixel-antialiased dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to View This Page.
        </span>
      </div>
    );
  }
  if (hasPlannerAccess === null) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-2 text-2xl font-semibold text-blue-800 subpixel-antialiased dark:text-white">
            Reassign Planner
          </h2>
          <p className="mb-2 text-gray-600 dark:text-gray-400">
            Reassign planners and reset case status to Setup Pending
          </p>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                  Important
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Reassigning a planner will:
                </p>
                <ul className="mt-1 list-inside list-disc text-sm text-amber-700 dark:text-amber-400">
                  <li>Change case status to "Setup Pending"</li>
                  <li>Reset file upload count remaining to 1</li>
                  <li>Clear STL file upload data</li>
                  <li>Set a new deadline for the planner</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-end gap-2">
            <Input
              placeholder="Search by patient, doctor, or case ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={fetchPatients} className="h-10">
              Search
            </Button>
          </div>
          <div className="mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filterWithPlanner}
                onChange={(e) => setFilterWithPlanner(e.target.checked)}
              />
              <span className="text-sm">
                Show only patients with assigned planner
              </span>
            </label>
          </div>
        </div>
      </div>
      <div className="before:border-gradient-to-r before:animate-border-glow relative mx-auto w-full overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 dark:bg-gray-900/80">
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
                Doctor Name
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                Current Planner
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                Case Status
              </TableCell>
              <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                New Planner
              </TableCell>
              {/* <TableCell
                isHeader
                className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
              >
                Action
              </TableCell> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center">
                  {filterWithPlanner
                    ? "No patients with assigned planners found."
                    : "No patients found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((patient, idx) => (
                <TableRow
                  key={patient._id}
                  className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-10 items-center`}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    animationDelay: `${idx * 30}ms`,
                  }}
                >
                  <TableCell className="px-2 py-1 text-center font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                    {(currentPage - 1) * 10 + idx + 1}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
                    {patient.caseId}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
                    {patient.patientName}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {patient.userId?.name || "-"}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    {patient.plannerId?.name || "-"}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        patient.caseStatus === "setup pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                          : patient.caseStatus === "approved"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : patient.caseStatus === "approval pending"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {patient.caseStatus || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-center font-medium">
                    <Select
                      value=""
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value) {
                          handleReassignClick(patient, value);
                        }
                      }}
                      options={[
                        ...planners.map((planner) => ({
                          label: planner.name,
                          value: planner._id,
                        })),
                      ]}
                      className="w-40"
                    />
                  </TableCell>
                  {/* <TableCell className="px-2 py-1 text-center">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        const selectElement = document.querySelector(
                          `[data-patient-id="${patient._id}"]`,
                        );
                        const plannerId = selectElement?.value;
                        if (plannerId) {
                          handleReassignClick(patient, plannerId);
                        } else {
                          toast.error("Please select a planner first");
                        }
                      }}
                      className="border-purple-400 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                    >
                      Reassign
                    </Button>
                  </TableCell> */}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, totalPatients)} of {totalPatients}{" "}
            patients
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPatient && (
        <Modal
          isOpen={showConfirmModal}
          onClose={() => {
            setShowConfirmModal(false);
            setSelectedPatient(null);
            setSelectedPlannerId("");
          }}
          title="Confirm Planner Reassignment"
        >
          <div className="p-6">
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <div className="flex items-start gap-3">
                <svg
                  className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300">
                    Warning: This action will reset the case
                  </h4>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    This will reset the case status to "Setup Pending" and clear
                    all STL file data.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <h4 className="mb-3 font-semibold text-gray-900 dark:text-white">
                Patient Information
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Case ID:</span>{" "}
                  {selectedPatient.caseId}
                </p>
                <p>
                  <span className="font-medium">Patient Name:</span>{" "}
                  {selectedPatient.patientName}
                </p>
                <p>
                  <span className="font-medium">Current Planner:</span>{" "}
                  {selectedPatient.plannerId?.name || "None"}
                </p>
                <p>
                  <span className="font-medium">New Planner:</span>{" "}
                  {planners.find((p) => p._id === selectedPlannerId)?.name ||
                    "Unknown"}
                </p>
                <p>
                  <span className="font-medium">Current Status:</span>{" "}
                  {selectedPatient.caseStatus}
                </p>
              </div>
            </div>

            <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>The following changes will be made:</p>
              <ul className="list-inside list-disc space-y-1 pl-4">
                <li>Case status will be changed to "Setup Pending"</li>
                <li>File upload count remaining will be set to 1</li>
                <li>STL file upload data will be cleared</li>
                <li>A new deadline will be set for the planner</li>
                <li>Both planners will receive email notifications</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedPatient(null);
                  setSelectedPlannerId("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReassign}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700"
              >
                Confirm Reassignment
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

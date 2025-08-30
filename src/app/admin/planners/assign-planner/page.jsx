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

export default function AssignPlanner() {
  const [patients, setPatients] = useState([]);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(false);
  const [planners, setPlanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterNoPlanner, setFilterNoPlanner] = useState(false);
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

  // When search or filter changes, reset to first page
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterNoPlanner]);

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

  const handleAssign = async (patientId, plannerId) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/patients/update-details?id=${patientId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plannerId }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign planner");
      toast.success("Planner assigned successfully!");
      fetchPatients();
    } catch (err) {
      toast.error(err.message || "Failed to assign planner");
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      (!filterNoPlanner ||
        !p.plannerId ||
        p.plannerId === "" ||
        p.plannerId === null) &&
      (!search ||
        p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        p.doctorName?.toLowerCase().includes(search.toLowerCase())),
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
            Assign Planner to Patients
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Assign planners to patients and manage assignments.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-end gap-2">
            <Input
              placeholder="Search by patient or doctor name..."
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
                checked={filterNoPlanner}
                onChange={(e) => setFilterNoPlanner(e.target.checked)}
              />
              <span className="text-sm">
                Show only patients with no planner
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
                Planner
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  No patients found.
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
                    {idx + 1}
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
                    <Select
                      value={patient.plannerId?._id || ""}
                      onChange={(e) =>
                        handleAssign(patient._id, e.target.value)
                      }
                      options={[
                        ...planners.map((planner) => ({
                          label: planner.name,
                          value: planner._id,
                        })),
                      ]}
                      className="w-40"
                    />
                  </TableCell>
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
    </div>
  );
}

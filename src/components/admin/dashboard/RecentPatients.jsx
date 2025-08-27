"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/store";
import { toast } from "react-toastify";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";
import { useDispatch } from "react-redux";
import { setLoading } from "@/store/features/uiSlice";

export default function RecentPatients() {
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!token) {
      return;
    }

    const fetchRecentPatients = async () => {
      dispatch(setLoading(true));
      try {
        const response = await fetch(
          `/api/admin/patients?page=1&limit=5&sort=latest`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) throw new Error("Failed to fetch patients");

        const patientsData = await response.json();

        setPatients(patientsData.patients);
      } catch (error) {
        toast.error(error.message || "Failed to fetch data");
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchRecentPatients();
  }, [token, dispatch]);

  const handleClick = () => {
    router.push("/admin/patients");
  };

  const handlePatientClick = (patientId) => {
    router.push(`/admin/patients/view-patient-details?id=${patientId}`);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Patients
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClick}
            className="text-theme-sm shadow-theme-xs inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            See all
          </button>
        </div>
      </div>
      {patients && patients.length > 0 ? (
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-2 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Patient Name & Case ID
                </TableCell>
                <TableCell
                  isHeader
                  className="py-2 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Assigned Personnel
                </TableCell>
                <TableCell
                  isHeader
                  className="py-2 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Location
                </TableCell>
                <TableCell
                  isHeader
                  className="py-2 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Case Details
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {patients?.map((patient) => (
                <TableRow
                  key={patient._id}
                  className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => handlePatientClick(patient._id)}
                >
                  <TableCell className="py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-md">
                        <AvatarText name={patient.patientName} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-800 dark:text-white/90">
                          {patient.patientName}
                        </p>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                          {patient.caseId}
                        </span>
                        {patient.createdAt && (
                          <div className="mt-1 text-[9px] text-gray-400 dark:text-gray-500">
                            Created:{" "}
                            {new Date(patient.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <div className="space-y-1">
                      {/* Doctor Assignment */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            patient.userId?.name
                              ? "bg-green-500"
                              : "bg-gray-300"
                          }`}
                          title={
                            patient.userId?.name
                              ? "Doctor assigned"
                              : "Doctor not assigned"
                          }
                        ></div>
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                            Doctor:
                          </div>
                          <div
                            className={`truncate text-[10px] ${
                              patient.userId?.name
                                ? "font-medium text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {patient.userId?.name || "Not assigned"}
                          </div>
                        </div>
                      </div>

                      {/* Planner Assignment */}
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            patient.plannerId?.name
                              ? "bg-blue-500"
                              : "bg-gray-300"
                          }`}
                          title={
                            patient.plannerId?.name
                              ? "Planner assigned"
                              : "Planner not assigned"
                          }
                        ></div>
                        <div className="flex items-center justify-center gap-0.5">
                          <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                            Planner:
                          </div>
                          <div
                            className={`truncate text-[10px] ${
                              patient.plannerId?.name
                                ? "font-medium text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {patient.plannerId?.name || "Not assigned"}
                          </div>
                        </div>
                      </div>

                      <hr className="my-1 border-t border-gray-100 mr-8" />

                      {/* Assignment Status Summary */}

                      <div
                        className={`text-[9px] ${
                          patient.userId?.name && patient.plannerId?.name
                            ? "text-green-600 dark:text-green-400"
                            : patient.userId?.name || patient.plannerId?.name
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {patient.userId?.name && patient.plannerId?.name
                          ? "✓ Fully assigned"
                          : patient.userId?.name || patient.plannerId?.name
                            ? "⚠ Partially assigned"
                            : "✗ Not assigned"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <div>{patient.city}</div>
                      <div className="text-[10px]">{patient.country}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs">
                    <div className="space-y-1">
                      {/* Case Type */}
                      <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Type:
                        </span>{" "}
                        {patient.caseType || "Not specified"}
                      </div>

                      {/* Case Category */}
                      <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Category:
                        </span>{" "}
                        {patient.caseCategory || "Not specified"}
                      </div>

                      {/* Package */}
                      <div className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                        <span className="text-gray-500 dark:text-gray-400">
                          Package:
                        </span>{" "}
                        {patient.selectedPrice || "Not specified"}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
            No Recent Patients
          </p>
          <Button
            onClick={() => router.push("/admin/patients")}
            className="rounded-lg bg-gradient-to-r from-green-400 to-green-600 px-4 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            View Patients
          </Button>
        </div>
      )}
    </div>
  );
}

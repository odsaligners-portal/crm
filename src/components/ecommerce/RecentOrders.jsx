"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/store";
import { toast } from "react-toastify";
import AvatarText from "../ui/avatar/AvatarText";
import Button from "../ui/button/Button";
import { PlusIcon } from "@/icons";

export default function RecentOrders() {
  const router = useRouter();
  const { token } = useAppSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    const fetchRecentPatients = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/patients?page=1&limit=5&sort=latest`,
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
        setIsLoading(false);
      }
    };

    fetchRecentPatients();
  }, [token]);

  const handleClick = () => {
    router.push("/doctor/patients");
  };

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pt-4 pb-3 sm:px-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Patients
            </h3>
          </div>
        </div>
        <div className="flex h-32 items-center justify-center">
          <div className="border-brand-500 h-8 w-8 animate-spin rounded-full border-b-2"></div>
        </div>
      </div>
    );
  }

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
                  className="text-theme-xs py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Patient Name & Case ID
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Location
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Treatment
                </TableCell>
                <TableCell
                  isHeader
                  className="text-theme-xs py-3 text-start font-medium text-gray-500 dark:text-gray-400"
                >
                  Case Category
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {patients?.map((patient) => (
                <TableRow key={patient._id} className="">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                        <AvatarText name={patient.patientName} />
                      </div>
                      <div>
                        <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {patient.patientName}
                        </p>
                        <span className="text-theme-xs text-gray-500 dark:text-gray-400">
                          {patient.caseId}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-theme-sm py-3 text-gray-500 dark:text-gray-400">
                    <div>
                      <div>{patient.city}</div>
                      <div className="text-theme-xs">{patient.country}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-theme-sm py-3 text-gray-500 dark:text-gray-400">
                    {patient.treatmentFor}
                  </TableCell>
                  <TableCell className="text-theme-sm py-3 text-gray-500 dark:text-gray-400">
                    <Badge size="sm">
                      {patient.caseCategory ? patient.caseCategory : " - "}
                    </Badge>
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
            onClick={() =>
              router.push("/doctor/patients/create-patient-record")
            }
            className="rounded-lg bg-gradient-to-r from-green-400 to-green-600 px-4 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      )}
    </div>
  );
}

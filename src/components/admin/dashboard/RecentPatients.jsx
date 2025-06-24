"use client"
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
import { useAppSelector } from '@/store/store';
import { toast } from 'react-toastify';
import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/icons";

export default function RecentPatients() {
  const router = useRouter();
  const { token } = useAppSelector(state => state.auth);
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
        const response = await fetch(`/api/admin/patients?page=1&limit=5&sort=latest`, {
            headers: { Authorization: `Bearer ${token}` },
        });

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
    router.push('/admin/patients');
  };
  
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
        <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Recent Patients
            </h3>
          </div>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Patients
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleClick} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>
      {patients && patients.length > 0 ? (
        <div className="max-w-full overflow-x-auto">
          <Table>
            {/* Table Header */}
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-2 font-medium text-gray-500 text-xs text-start dark:text-gray-400"
                >
                  Patient Name & Case ID
                </TableCell>
                <TableCell
                  isHeader
                  className="py-2 font-medium text-gray-500 text-xs text-start dark:text-gray-400"
                >
                  Location
                </TableCell>
                <TableCell
                  isHeader
                  className="py-2 font-medium text-gray-500 text-xs text-start dark:text-gray-400"
                >
                  Treatment
                </TableCell>
                <TableCell
                  isHeader
                  className="py-2 font-medium text-gray-500 text-xs text-start dark:text-gray-400"
                >
                  Case Category
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {patients?.map((patient) => (
                <TableRow key={patient._id} className="">
                  <TableCell className="py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-[40px] w-[40px] overflow-hidden rounded-md flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <AvatarText name={patient.patientName} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-xs dark:text-white/90">
                          {patient.patientName}
                        </p>
                        <span className="text-gray-500 text-[10px] dark:text-gray-400">
                          {patient.caseId}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-500 dark:text-gray-400">
                    <div>
                      <div>{patient.city}</div>
                      <div className="text-[10px]">{patient.country}</div>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-500 dark:text-gray-400">
                    {patient.treatmentFor}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-500 dark:text-gray-400">
                    <Badge size="sm">
                      {patient.caseCategory ? patient.caseCategory : ' - '}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">No Recent Patients</p>
          <Button
            onClick={() => router.push('/doctor/patients/create-patient-record/step-1')}
            className="px-4 py-2 shadow-md bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      )}
    </div>
  );
}

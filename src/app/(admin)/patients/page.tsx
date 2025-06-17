"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { PlusIcon } from "@/icons";

interface Patient {
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: {
      city: string;
      country: string;
    };
  };
  medicalInfo: {
    bloodType: string;
    chronicConditions: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ViewPatientRecords() {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const recordsPerPage = 10;

  const fetchPatients = async (page: number) => {
    try {
      const response = await fetch(
        `/api/patients?page=${page}&limit=${recordsPerPage}&search=${searchTerm}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data = await response.json();
      setPatients(data.patients);
      setTotalPages(Math.ceil(data.total / recordsPerPage));
      setIsLoading(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch patients");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(currentPage);
  }, [currentPage, searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Patient Records
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            View and manage patient records
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-full max-w-xs">
            <Input
              type="search"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={handleSearch}
              className="rounded-lg border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <Button 
            onClick={() => router.push("/patients/create-patient-record")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />Add Patient
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm sm:text-base">
            <thead className="hidden sm:table-header-group">
              <tr className="bg-gray-50 dark:bg-gray-800/50">
                <th className="px-4 py-4 text-left w-[20%]">Name</th>
                <th className="px-4 py-4 text-left w-[20%]">Contact</th>
                <th className="px-4 py-4 text-left w-[15%]">Location</th>
                <th className="px-4 py-4 text-left w-[20%]">Medical Info</th>
                {/* <th className="px-4 py-4 text-left w-[15%]">Created</th> */}
                <th className="px-4 py-4 text-right w-[10%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <svg className="h-12 w-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No patients found</p>
                      <p className="text-sm mt-1">Try adjusting your search or add a new patient</p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 transition-colors duration-150 sm:table-row flex flex-col sm:flex-row w-full sm:w-auto"
                  >
                    <td className="px-4 py-4 sm:table-cell flex-1">
                      <div className="sm:hidden font-semibold text-gray-500 mb-1">Name</div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {patient.personalInfo.firstName} {patient.personalInfo.lastName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {patient.personalInfo.gender} • {formatDate(patient.personalInfo.dateOfBirth)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:table-cell flex-1">
                      <div className="sm:hidden font-semibold text-gray-500 mb-1">Contact</div>
                      <div>
                        <p className="text-gray-900 dark:text-white truncate">
                          {patient.personalInfo.email}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {patient.personalInfo.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:table-cell flex-1">
                      <div className="sm:hidden font-semibold text-gray-500 mb-1">Location</div>
                      <div>
                        <p className="text-gray-900 dark:text-white truncate">
                          {patient.personalInfo.address.city}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {patient.personalInfo.address.country}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 sm:table-cell flex-1">
                      <div className="sm:hidden font-semibold text-gray-500 mb-1">Medical Info</div>
                      <div>
                        <p className="text-gray-900 dark:text-white truncate">
                          Blood Type: {patient.medicalInfo.bloodType}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {patient.medicalInfo.chronicConditions || "No conditions"}
                        </p>
                      </div>
                    </td>
                    {/* <td className="px-4 py-4 sm:table-cell flex-1">
                      <div className="sm:hidden font-semibold text-gray-500 mb-1">Created</div>
                      <div>
                        <p className="text-gray-900 dark:text-white truncate">
                          {formatDate(patient.createdAt)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                          Last updated: {formatDate(patient.updatedAt)}
                        </p>
                      </div>
                    </td> */}
                    <td className="px-4 py-4 sm:table-cell flex-1">
                      <div className="sm:hidden font-semibold text-gray-500 mb-1">Actions</div>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/patient/${patient._id}/details`)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/patient/${patient._id}/edit`)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

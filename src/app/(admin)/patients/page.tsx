"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { PlusIcon } from "@/icons";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import * as XLSX from 'xlsx';
import Select from "@/components/form/select/SelectField";

interface Patient {
  _id: string;
  patientName: string;
  age: number;
    gender: string;
  treatmentFor: string;
  country: string;
  state: string;
      city: string;
  caseCategory: string;
  caseType: string;
  extraction: {
    required: boolean;
    comments: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface FilterState {
  status: string;
  bloodType: string;
  gender: string;
  country: string;
  city: string;
  hasChronicConditions: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function ViewPatientRecords() {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const recordsPerPage = 10;

  // Filter state
  const [filters, setFilters] = useState({
    gender: "",
    country: "",
    city: "",
    caseCategory: "",
    caseType: "",
    startDate: "",
    endDate: "",
  });

  // Available filter options
  const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const genders = ["Male", "Female", "Other"];
  const statuses = ["Active", "Inactive"];
  const chronicConditionOptions = ["Yes", "No"];

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "25",
        search: searchTerm,
        ...filters,
      });

      const response = await fetch(`/api/patients?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch patients");
      }

      const data = await response.json();
      setPatients(data.patients);
      setTotalPages(data.pagination.totalPages);
      setTotalPatients(data.pagination.totalPatients);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      gender: "",
      country: "",
      city: "",
      caseCategory: "",
      caseType: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.gender) count++;
    if (filters.country) count++;
    if (filters.city) count++;
    if (filters.caseCategory) count++;
    if (filters.caseType) count++;
    if (filters.startDate || filters.endDate) count++;
    return count;
  };

  const exportToExcel = () => {
    const exportData = patients.map(patient => ({
      "Patient Name": patient.patientName,
      "Age": patient.age,
      "Gender": patient.gender,
      "Treatment For": patient.treatmentFor,
      "Country": patient.country,
      "State": patient.state,
      "City": patient.city,
      "Case Category": patient.caseCategory,
      "Case Type": patient.caseType,
      "Extraction Required": patient.extraction.required ? "Yes" : "No",
      "Extraction Comments": patient.extraction.comments,
      "Created Date": new Date(patient.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");
    
    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Patient Name
      { wch: 8 },  // Age
      { wch: 10 }, // Gender
      { wch: 15 }, // Treatment For
      { wch: 15 }, // Country
      { wch: 15 }, // State
      { wch: 15 }, // City
      { wch: 15 }, // Case Category
      { wch: 20 }, // Case Type
      { wch: 15 }, // Extraction Required
      { wch: 25 }, // Extraction Comments
      { wch: 15 }, // Created Date
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `patients_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Patient data exported successfully!");
  };

  const getFilterCount = () => {
    return Object.values(filters).filter(value => value !== "").length;
  };

  if (isLoading) {
    return (
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patients...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              Patient Records
            </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage and view all patient records
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToExcel} className="px-4 py-2">
            Export to Excel
                          </Button>
                          <Button
            onClick={() => router.push("/patients/create-patient-record")}
            className="px-4 py-2"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Patient
                </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-3">
          <Input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button>Search</Button>
        </form>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            value={filters.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
            options={[
              { label: "All Genders", value: "" },
              { label: "Male", value: "Male" },
              { label: "Female", value: "Female" },
              { label: "Other", value: "Other" },
            ]}
          />
          <Select
            value={filters.country}
            onChange={(e) => handleFilterChange("country", e.target.value)}
            options={[
              { label: "All Countries", value: "" },
              { label: "USA", value: "USA" },
              { label: "Canada", value: "Canada" },
              { label: "UK", value: "UK" },
            ]}
          />
          <Select
            value={filters.caseCategory}
            onChange={(e) => handleFilterChange("caseCategory", e.target.value)}
            options={[
              { label: "All Categories", value: "" },
              { label: "Flexi", value: "Flexi" },
              { label: "Premium", value: "Premium" },
              { label: "Elite", value: "Elite" },
            ]}
          />
          <Select
            value={filters.caseType}
            onChange={(e) => handleFilterChange("caseType", e.target.value)}
            options={[
              { label: "All Types", value: "" },
              { label: "Single Arch - Upper", value: "Single Arch - Upper" },
              { label: "Single Arch - Lower", value: "Single Arch - Lower" },
              { label: "Double Arch", value: "Double Arch" },
            ]}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              placeholder="Start Date"
            />
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              placeholder="End Date"
            />
          </div>
          <div className="flex items-center gap-2">
            {getFilterCount() > 0 && (
              <Badge color="info" className="text-xs">
                {getFilterCount()} filters active
              </Badge>
            )}
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeader>Patient Name</TableHeader>
              <TableHeader>Age</TableHeader>
              <TableHeader>Gender</TableHeader>
              <TableHeader>Treatment For</TableHeader>
              <TableHeader>Location</TableHeader>
              <TableHeader>Case Category</TableHeader>
              <TableHeader>Case Type</TableHeader>
              <TableHeader>Extraction</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader>Actions</TableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.map((patient) => (
              <TableRow key={patient._id}>
                <TableCell className="font-medium">
                  {patient.patientName}
                </TableCell>
                <TableCell>{patient.age}</TableCell>
                <TableCell>
                  <Badge
                    color={patient.gender === "Male" ? "primary" : "info"}
                  >
                    {patient.gender}
                  </Badge>
                </TableCell>
                <TableCell>{patient.treatmentFor}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{patient.city}</div>
                    <div className="text-gray-500">{patient.country}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    color={
                      patient.caseCategory === "Elite"
                        ? "primary"
                        : patient.caseCategory === "Premium"
                        ? "success"
                        : "light"
                    }
                  >
                    {patient.caseCategory}
                  </Badge>
                </TableCell>
                <TableCell>{patient.caseType}</TableCell>
                <TableCell>
                  <Badge
                    color={patient.extraction.required ? "error" : "info"}
                  >
                    {patient.extraction.required ? "Required" : "Not Required"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(patient.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/patient/${patient._id}/details`)}
                      size="sm"
                      variant="outline"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => router.push(`/patient/${patient._id}/edit`)}
                      size="sm"
                      variant="outline"
                    >
                      Edit
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * 25) + 1} to{" "}
            {Math.min(currentPage * 25, totalPatients)} of {totalPatients} patients
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
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {patients.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-gray-500">No patients found</div>
          <Button
            onClick={() => router.push("/patients/create-patient-record")}
            className="mt-4"
          >
            Add your first patient
          </Button>
        </div>
      )}
    </div>
  );
}

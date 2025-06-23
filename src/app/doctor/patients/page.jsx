"use client";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/select/SelectField";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { caseTypes, genders, treatmentForOptions } from "@/constants/data";
import { EyeIcon, PencilIcon, PlusIcon } from "@/icons";
import { countriesData } from "@/utils/countries";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as XLSX from 'xlsx';
import UploadModal from "@/components/admin/patients/UploadModal";
import ViewCommentsModal from "@/components/admin/patients/ViewCommentsModal";
import FileUploadModal, { ViewFilesModal } from '@/components/admin/patients/FileUploadModal';

const countries = Object.keys(countriesData);

export default function ViewPatientRecords() {
  const router = useRouter();
  const { token, role } = useSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isViewCommentsModalOpen, setIsViewCommentsModalOpen] = useState(false);
  const [patientForComments, setPatientForComments] = useState(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [fileUploadPatient, setFileUploadPatient] = useState(null);
  const [showViewFilesModal, setShowViewFilesModal] = useState(false);
  const [viewFilesPatient, setViewFilesPatient] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    gender: "",
    country: "",
    state: "",
    city: "",
    caseCategory: "",
    caseType: "",
    treatmentFor: "",
    selectedPrice: "",
    startDate: "",
    endDate: "",
  });

  const [caseCategories, setCaseCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sort: 'latest',
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
    } catch (error) {
      toast.error(error.message || "Failed to fetch patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    const fetchCaseCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const response = await fetch('/api/case-categories?active=true', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error('Failed to fetch case categories');
        const result = await response.json();
        setCaseCategories(result.data || []);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCaseCategories();
  }, [token]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      gender: "",
      country: "",
      state: "",
      city: "",
      caseCategory: "",
      caseType: "",
      selectedPrice: "",
      treatmentFor: "",
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
      "Case ID": patient.caseId,
      "Patient Name": patient.patientName,
      "Age": patient.age,
      "Gender": patient.gender,
      "Treatment For": patient.treatmentFor,
      "Country": patient.country,
      "State": patient.state,
      "City": patient.city,
      "Case Category": patient.caseCategory,
      "Case Type": patient.caseType,
      "Selected Price": patient.selectedPrice,
      "Extraction Required": patient.extraction.required ? "Yes" : "No",
      "Extraction Comments": patient.extraction.comments,
      "Chief Complaint": patient.chiefComplaint,
      "Files Uploaded": ((patient.scanFiles?.img1?.length || 0) + (patient.scanFiles?.img2?.length || 0) + (patient.scanFiles?.img3?.length || 0)),
      "Created Date": new Date(patient.createdAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Case ID
      { wch: 20 }, // Patient Name
      { wch: 8 },  // Age
      { wch: 10 }, // Gender
      { wch: 15 }, // Treatment For
      { wch: 15 }, // Country
      { wch: 15 }, // State 
      { wch: 15 }, // City
      { wch: 15 }, // Case Category
      { wch: 20 }, // Case Type
      { wch: 15 }, // Selected Price
      { wch: 15 }, // Extraction Required
      { wch: 25 }, // Extraction Comments
      { wch: 15 }, // Files Uploaded
      { wch: 15 }, // Created Date
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `patients_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Patient data exported successfully!");
  };

  const getFilterCount = () => {
    return Object.values(filters).filter(value => value !== "").length;
  };

  // Helper to get filter label
  const filterLabels = {
    gender: 'Gender',
    country: 'Country',
    state: 'State',
    city: 'City',
    caseCategory: 'Case Category',
    caseType: 'Case Type',
    selectedPrice: 'Package',
    treatmentFor: 'Treatment For',
    startDate: 'Start Date',
    endDate: 'End Date',
  };

  const handleOpenUploadModal = (patient) => {
    setSelectedPatient(patient);
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setSelectedPatient(null);
    setIsUploadModalOpen(false);
  };

  const handleOpenViewCommentsModal = (patient) => {
    setPatientForComments(patient);
    setIsViewCommentsModalOpen(true);
  };

  const handleCloseViewCommentsModal = () => {
    setPatientForComments(null);
    setIsViewCommentsModalOpen(false);
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
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
            Patient Records
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
            Manage and view all patient records
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToExcel} className="px-4 py-2 shadow-md bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform">
            Export to Excel
          </Button>
          <Button
            onClick={() => router.push("/doctor/patients/create-patient-record/step-1")}
            className="px-4 py-2 shadow-md bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-2 items-end">
          <Input
            type="text"
            placeholder="Search by name, city, or case ID..."
            value={searchTerm}
            onChange={(e) => {
              // Prevent + and - from being entered
              const value = e.target.value.replace(/[+-]/g, '');
              setSearchTerm(value);
            }}
            onKeyDown={e => {
              if (e.key === '+' || e.key === '-') {
                e.preventDefault();
              }
            }}
            onPaste={e => {
              const pasteText = e.clipboardData.getData('text');
              if (pasteText.includes('+') || pasteText.includes('-')) {
                e.preventDefault();
                setSearchTerm(pasteText.replace(/[+-]/g, ''));
              }
            }}
            className="w-full max-w-xs shadow-sm rounded-lg border border-blue-100 focus:ring-2 focus:ring-blue-300"
          />
          <Button
            type="button"
            variant="primary"
            className="h-10 px-4 w-1/4 shadow-md bg-gradient-to-r from-blue-100 to-blue-300 text-blue-800 font-semibold rounded-lg hover:scale-105 transition-transform"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
          <Button
            type="button"
            className="h-10 px-4 shadow-md bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-lg hover:scale-105 transition-transform"
            onClick={() => {
              setCurrentPage(1);
              fetchPatients();
            }}
          >
            Search
          </Button>
        </div>
        <div className={`transition-all duration-300 ${showFilters ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 overflow-hidden'} bg-white/80 dark:bg-gray-900/80 rounded-lg shadow-lg p-6 border-l-4 border-blue-200 dark:border-blue-800 backdrop-blur-md`}>  
          <form className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end" onSubmit={handleSearch}>
            <Select
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
              options={[...genders.map(g => ({ label: g, value: g }))]}
              label="Gender"
              className="w-full"
            />
            <Select
              value={filters.treatmentFor}
              onChange={(e) => handleFilterChange("treatmentFor", e.target.value)}
              options={[...treatmentForOptions.map(t => ({ label: t, value: t }))]}
              label="Treatment For"
              className="w-full"
            />
            <Select
              value={filters.country}
              onChange={(e) => {
                handleFilterChange("country", e.target.value);
                handleFilterChange("state", "");
              }}
              options={[...countries.map(c => ({ label: c, value: c }))]}
              label="Country"
              className="w-full"
            />
            <Select
              value={filters.state}
              onChange={(e) => handleFilterChange("state", e.target.value)}
              options={[
                ...((filters.country && (countriesData)[filters.country]) ? (countriesData)[filters.country].map((s) => ({ label: s, value: s })) : [])
              ]}
              label="State"
              className="w-full"
              disabled={!filters.country}
            />
            <Select
              value={filters.caseCategory}
              onChange={(e) => {
                handleFilterChange("caseCategory", e.target.value);
                handleFilterChange("selectedPrice", "");
              }}
              options={caseCategories.map(c => ({ label: c.category, value: c.category }))}
              label="Case Category"
              className="w-full"
            />
            <Select
              value={filters.caseType}
              onChange={(e) => handleFilterChange("caseType", e.target.value)}
              options={[...caseTypes.map(c => ({ label: c, value: c }))]}
              label="Case Type"
              className="w-full"
            />

            <div className="flex flex-col gap-1 w-full col-span-2">
              <label className="text-xs font-medium text-gray-600">Created Date</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full"
                />
                <span className="mx-1 text-gray-400">-</span>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full col-span-full justify-end mt-2">
              <Button type="submit" className="h-10 px-4 shadow bg-blue-500 text-white font-semibold rounded-lg hover:scale-105 transition-transform">Apply Filters</Button>
              <Button type="button" onClick={clearFilters} variant="outline" size="sm" className="h-10 px-4 shadow bg-white text-blue-700 font-semibold rounded-lg hover:scale-105 transition-transform">Reset</Button>
            </div>
          </form>
          {getFilterCount() > 0 && (
            <Badge color="info" className="text-xs mt-2">
              {getFilterCount()} filters active
            </Badge>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {getFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(filters).map(([key, value]) => (
            value ? (
              <Badge
                key={key}
                color="info"
                className="text-xs flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700 rounded-full shadow-sm"
              >
                <span className="font-semibold text-blue-700 dark:text-blue-200">{filterLabels[key] || key}:</span>
                <span className="text-blue-900 dark:text-blue-100">{value}</span>
                <button
                  type="button"
                  className="ml-1 text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 focus:outline-none"
                  onClick={() => handleFilterChange(key, "")}
                  aria-label={`Clear ${filterLabels[key] || key} filter`}
                >
                  ×
                </button>
              </Badge>
            ) : null
          ))}
        </div>
      )}

      <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />

      {/* Patients Table */}
      <div className="relative rounded-xl border border-transparent bg-white/90 dark:bg-gray-900/80 shadow-xl mx-auto max-w-6xl w-full backdrop-blur-md overflow-x-auto sm:overflow-x-visible before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-gradient-to-r before:from-blue-200 before:via-purple-100 before:to-blue-100 before:animate-border-glow before:pointer-events-none">
        {/* Subtle SVG pattern background */}
        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none"><defs><pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#3b82f6" /></pattern></defs><rect width="100%" height="100%" fill="url(#dots)" /></svg>
        <Table className="min-w-full text-[10px] font-sans mx-auto relative z-10">
          {patients.length > 0 && (
            <>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl border-b-2 border-blue-200 dark:border-blue-900 backdrop-blur-sm">
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Case ID</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Patient Name</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Location</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Comments</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Files</TableCell>
                  <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 py-1 px-2">Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient, idx) => (
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
                    <TableCell className="text-center py-1 px-2">
                      <div className="flex gap-1 justify-center">
                        <Button
                          onClick={() => handleOpenUploadModal(patient)}
                          size="xs"
                          variant="outline"
                          className="border-purple-400 text-purple-600 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 flex items-center gap-1 hover:scale-105 transition-transform shadow-sm p-1"
                        >
                          Upload
                        </Button>
                        <Button
                          onClick={() => handleOpenViewCommentsModal(patient)}
                          size="xs"
                          variant="outline"
                          className="border-blue-400 text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 flex items-center gap-1 hover:scale-105 transition-transform shadow-sm p-1"
                        >
                          See
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-1 px-2">
                      <div className="flex gap-1 justify-center">
                        <Button
                          onClick={() => {
                            setFileUploadPatient(patient);
                            setShowFileUploadModal(true);
                          }}
                          size="xs"
                          variant="outline"
                          className="border-purple-400 text-purple-600 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 flex items-center gap-1 hover:scale-105 transition-transform shadow-sm p-1"
                        >
                          Upload
                        </Button>
                        <Button
                          onClick={() => {
                            setViewFilesPatient(patient);
                            setShowViewFilesModal(true);
                          }}
                          size="xs"
                          variant="outline"
                          className="border-blue-400 text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 flex items-center gap-1 hover:scale-105 transition-transform shadow-sm p-1"
                        >
                          See Files
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-1 px-2">
                      <div className="flex gap-1 justify-center">
                        <Button
                          onClick={() => router.push(`/doctor/patients/view-patient-details?id=${patient._id}`)}
                          size="xs"
                          variant="outline"
                          className="border-blue-400 text-blue-600 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 flex items-center gap-1 hover:scale-105 transition-transform shadow-sm p-1"
                        >
                          <EyeIcon className="w-3 h-3" /> View
                        </Button>
                        <Button
                          onClick={() => router.push(`/doctor/patients/edit-patient-details?id=${patient._id}`)}
                          size="xs"
                          variant="outline"
                          className="border-green-400 text-green-600 hover:bg-green-100/60 dark:hover:bg-green-900/40 flex items-center gap-1 hover:scale-105 transition-transform shadow-sm p-1"
                        >
                          <PencilIcon className="w-3 h-3" /> Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </>
          )}
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((currentPage - 1) * 10) + 1} to{" "}
            {Math.min(currentPage * 10, totalPatients)} of {totalPatients} patients
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
        <div className="flex flex-col items-center justify-center py-16">
          <svg width="120" height="120" fill="none" className="mb-6 opacity-60" viewBox="0 0 120 120"><circle cx="60" cy="60" r="56" stroke="#3b82f6" strokeWidth="4" fill="#e0e7ff" /><path d="M40 80c0-11 9-20 20-20s20 9 20 20" stroke="#6366f1" strokeWidth="4" strokeLinecap="round" /><circle cx="60" cy="54" r="10" fill="#6366f1" /></svg>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">No patients found</div>
          <div className="text-gray-500 mb-6">Try adjusting your filters or add a new patient record.</div>
          <Button
            onClick={() => router.push("/doctor/patients/create-patient-record/step-1")}
            className="px-6 py-3 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-transform"
          >
            Add your first patient
          </Button>
        </div>
      )}

      {/* Modals */}
      {isUploadModalOpen && selectedPatient && (
        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          patient={selectedPatient}
          onSuccess={() => {
            handleCloseUploadModal();
            fetchPatients();
          }}
        />
      )}

      {isViewCommentsModalOpen && patientForComments && (
        <ViewCommentsModal
          isOpen={isViewCommentsModalOpen}
          onClose={handleCloseViewCommentsModal}
          patient={patientForComments}
        />
      )}

      <FileUploadModal
        isOpen={showFileUploadModal}
        onClose={() => {
          setShowFileUploadModal(false);
          setFileUploadPatient(null);
        }}
        patient={fileUploadPatient}
        token={token}
      />
      <ViewFilesModal
        isOpen={showViewFilesModal}
        onClose={() => {
          setShowViewFilesModal(false);
          setViewFilesPatient(null);
        }}
        patient={viewFilesPatient}
        token={token}
      />
    </div>
  );
}

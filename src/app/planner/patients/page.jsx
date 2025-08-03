"use client";
import FileUploadModal, { ViewFilesModal } from '@/components/admin/patients/FileUploadModal';
import UploadModal from "@/components/admin/patients/UploadModal";
import ViewCommentsModal from "@/components/admin/patients/ViewCommentsModal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/select/SelectField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { caseTypes, genders, treatmentForOptions } from "@/constants/data";
import { EyeIcon, PlusIcon } from "@/icons";
import { setLoading } from '@/store/features/uiSlice';
import { fetchWithError } from '@/utils/apiErrorHandler';
import { countriesData } from "@/utils/countries";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const countries = Object.keys(countriesData);

export default function PlannerPatientRecords() {
  const router = useRouter();
  const { token, role } = useSelector((state) => state.auth);
  const [patients, setPatients] = useState([]);
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
  const [modificationModalPatient, setModificationModalPatient] = useState(null);
  const dispatch = useDispatch();

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
    caseStatus: "",
  });

  const [caseCategories, setCaseCategories] = useState([]);

  const fetchPatients = async () => {
    dispatch(setLoading(true));
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sort: 'latest',
        search: searchTerm,
        ...filters,
      });
      const data = await fetchWithError(`/api/planner/patients?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPatients(data.patients);
      setTotalPages(data.pagination.totalPages);
      setTotalPatients(data.pagination.totalPatients);
    } catch (error) {
      // fetchWithError already toasts
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    const fetchCaseCategories = async () => {
      dispatch(setLoading(true));
      try {
        const result = await fetchWithError('/api/case-categories?active=true', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        setCaseCategories(result.data || []);
      } catch (err) {
        // fetchWithError already toasts
      } finally {
        dispatch(setLoading(false));
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

  // Use a stable date formatter for patient data only
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return '';
    }
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
      caseStatus: "",
    });
    setCurrentPage(1);
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
    caseStatus: 'Case Status',
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
            Patient Records
          </h1>
          <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
            Manage and view all patient records
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => {}}
            className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-4 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105"
          >
            Export to Excel
          </Button>
          <Button
            onClick={() =>
              router.push("/planner/patients/create-patient-record/step-1")
            }
            className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-4 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex items-end gap-2">
          <Input
            type="text"
            placeholder="Search by name, city, or case ID..."
            value={searchTerm}
            onChange={(e) => {
              // Prevent + and - from being entered
              const value = e.target.value.replace(/[+-]/g, "");
              setSearchTerm(value);
            }}
            onKeyDown={(e) => {
              if (e.key === "+" || e.key === "-") {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              const pasteText = e.clipboardData.getData("text");
              if (pasteText.includes("+") || pasteText.includes("-")) {
                e.preventDefault();
                setSearchTerm(pasteText.replace(/[+-]/g, ""));
              }
            }}
            className="w-full max-w-xs rounded-lg border border-blue-100 shadow-sm focus:ring-2 focus:ring-blue-300"
          />
          <Button
            type="button"
            variant="primary"
            className="h-10 w-1/4 rounded-lg bg-gradient-to-r from-blue-100 to-blue-300 px-4 font-semibold text-blue-800 shadow-md transition-transform hover:scale-105"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-4 font-semibold text-white shadow-md transition-transform hover:scale-105"
            onClick={() => {
              setCurrentPage(1);
              fetchPatients();
            }}
          >
            Search
          </Button>
        </div>
        <div
          className={`transition-all duration-300 ${showFilters ? "mt-4 max-h-[2000px] opacity-100" : "max-h-0 overflow-hidden opacity-0"} rounded-lg border-l-4 border-blue-200 bg-white/80 p-6 shadow-lg backdrop-blur-md dark:border-blue-800 dark:bg-gray-900/80`}
        >
          <form
            className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            onSubmit={handleSearch}
          >
            <Select
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
              options={[...genders.map((g) => ({ label: g, value: g }))]}
              label="Gender"
              className="w-full"
            />
            <Select
              value={filters.treatmentFor}
              onChange={(e) =>
                handleFilterChange("treatmentFor", e.target.value)
              }
              options={[
                ...treatmentForOptions.map((t) => ({ label: t, value: t })),
              ]}
              label="Treatment For"
              className="w-full"
            />
            <Select
              value={filters.country}
              onChange={(e) => {
                handleFilterChange("country", e.target.value);
                handleFilterChange("state", "");
              }}
              options={[...countries.map((c) => ({ label: c, value: c }))]}
              label="Country"
              className="w-full"
            />
            <Select
              value={filters.state}
              onChange={(e) => handleFilterChange("state", e.target.value)}
              options={[
                ...(filters.country && countriesData[filters.country]
                  ? countriesData[filters.country].map((s) => ({
                      label: s,
                      value: s,
                    }))
                  : []),
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
              options={caseCategories.map((c) => ({
                label: c.category,
                value: c.category,
              }))}
              label="Case Category"
              className="w-full"
            />
            <Select
              value={filters.caseType}
              onChange={(e) => handleFilterChange("caseType", e.target.value)}
              options={[...caseTypes.map((c) => ({ label: c, value: c }))]}
              label="Case Type"
              className="w-full"
            />
            <Select
              value={filters.caseStatus}
              onChange={(e) => handleFilterChange("caseStatus", e.target.value)}
              options={[
                { label: "Setup Pending", value: "setup pending" },
                { label: "Approval Pending", value: "approval pending" },
                { label: "Approved", value: "approved" },
                { label: "Rejected", value: "rejected" },
              ]}
              label="Case Status"
              className="w-full"
            />

            <div className="col-span-2 flex w-full flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">
                Created Date
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  className="w-full"
                />
                <span className="mx-1 text-gray-400">-</span>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  className="w-full"
                />
              </div>
            </div>
            <div className="col-span-full mt-2 flex w-full justify-end gap-2">
              <Button
                type="submit"
                className="h-10 rounded-lg bg-blue-500 px-4 font-semibold text-white shadow transition-transform hover:scale-105"
              >
                Apply Filters
              </Button>
              <Button
                type="button"
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="h-10 rounded-lg bg-white px-4 font-semibold text-blue-700 shadow transition-transform hover:scale-105"
              >
                Reset
              </Button>
            </div>
          </form>
          {getFilterCount() > 0 && (
            <Badge color="info" className="mt-2 text-xs">
              {getFilterCount()} filters active
            </Badge>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {getFilterCount() > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) =>
            value ? (
              <Badge
                key={key}
                color="info"
                className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs shadow-sm dark:border-blue-700 dark:bg-blue-900/40"
              >
                <span className="font-semibold text-blue-700 dark:text-blue-200">
                  {filterLabels[key] || key}:
                </span>
                <span className="text-blue-900 dark:text-blue-100">
                  {value}
                </span>
                <button
                  type="button"
                  className="ml-1 text-blue-400 hover:text-blue-700 focus:outline-none dark:hover:text-blue-200"
                  onClick={() => handleFilterChange(key, "")}
                  aria-label={`Clear ${filterLabels[key] || key} filter`}
                >
                  ×
                </button>
              </Badge>
            ) : null,
          )}
        </div>
      )}

      <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />

      {/* Patients Table */}
      <div className="before:border-gradient-to-r before:animate-border-glow relative mx-auto w-full max-w-6xl overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-blue-100 before:to-blue-100 sm:overflow-x-visible dark:bg-gray-900/80">
        {/* Subtle SVG pattern background */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="#22c55e" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <Table className="relative z-10 mx-auto min-w-full font-sans text-[10px]">
          {patients.length > 0 && (
            <>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
                  >
                    Case ID
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
                  >
                    Patient Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
                  >
                    Location
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
                  >
                    Comments
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
                  >
                    Files
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-bold text-blue-700 dark:text-blue-200"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient, idx) => (
                  <TableRow
                    key={patient._id}
                    className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp h-10 items-center`}
                    style={{
                      animationDelay: `${idx * 30}ms`,
                    }}
                  >
                    <TableCell className="px-2 py-1 text-center font-semibold text-blue-600 dark:text-blue-300">
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
                    <TableCell className="px-2 py-1 text-center">
                      <div className="flex justify-center gap-1">
                        {/* <Button
                          onClick={() => handleOpenUploadModal(patient)}
                          size="xs"
                          variant="outline"
                          className="border-purple-400 text-purple-600 hover:bg-purple-100/60 dark:hover:bg-purple-900/40 flex items-center gap-1 hover:scale-105 transition-transform shadow-sm p-1"
                        >
                          Upload
                        </Button> */}
                        <Button
                          onClick={() => handleOpenViewCommentsModal(patient)}
                          size="xs"
                          variant="outline"
                          className="flex items-center gap-1 border-blue-400 p-1 text-blue-600 shadow-sm transition-transform hover:scale-105 hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
                        >
                          View Comments
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center">
                      <div className="flex justify-center gap-1">
                        {patient.caseStatus !== "approved" &&
                        patient.caseStatus !== "rejected" ? (
                          <>
                            {patient?.fileUploadCount?.remianing !== 0 && (
                              <Button
                                onClick={() => {
                                  setFileUploadPatient(patient);
                                  setShowFileUploadModal(true);
                                }}
                                size="xs"
                                variant="outline"
                                className="flex items-center gap-1 border-purple-400 p-1 text-purple-600 shadow-sm transition-transform hover:scale-105 hover:bg-purple-100/60 dark:hover:bg-purple-900/40"
                              >
                                upload
                              </Button>
                            )}
                            <Button
                              onClick={() => {
                                setViewFilesPatient(patient);
                                setShowViewFilesModal(true);
                              }}
                              size="xs"
                              variant="outline"
                              className="flex items-center gap-1 border-blue-400 p-1 text-blue-600 shadow-sm transition-transform hover:scale-105 hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
                            >
                              See Files
                            </Button>
                          </>
                        ) : (
                          <span
                            className={`${patient.caseStatus === "approved" ? "bg-green-400" : "bg-red-400"} items-center rounded-3xl px-2 py-1 text-xs font-semibold text-white capitalize`}
                          >
                            {patient.caseStatus}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          onClick={() =>
                            router.push(
                              `/planner/patients/view-patient-details?id=${patient._id}`,
                            )
                          }
                          size="xs"
                          variant="outline"
                          className="flex items-center gap-1 border-blue-400 p-1 text-blue-600 shadow-sm transition-transform hover:scale-105 hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
                        >
                          <EyeIcon className="h-3 w-3" /> View
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
            Showing {(currentPage - 1) * 10 + 1} to{" "}
            {Math.min(currentPage * 10, totalPatients)} of {totalPatients}{" "}
            patients
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
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {patients.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          {/* Use a static SVG and text, no dynamic date or random values */}
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
              stroke="#22c55e"
              strokeWidth="4"
              fill="#bbf7d0"
            />
            <path
              d="M40 80c0-11 9-20 20-20s20 9 20 20"
              stroke="#22c55e"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="60" cy="54" r="10" fill="#22c55e" />
          </svg>
          <div className="mb-2 text-2xl font-bold text-blue-700 dark:text-blue-200">
            No patients found
          </div>
          <div className="mb-6 text-gray-500">
            Try adjusting your filters or add a new patient record.
          </div>
          <Button
            onClick={() =>
              router.push("/planner/patients/create-patient-record/step-1")
            }
            className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105"
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
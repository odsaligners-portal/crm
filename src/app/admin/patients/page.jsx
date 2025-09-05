"use client";
import UploadModal from "@/components/admin/patients/UploadModal";
import ViewCommentsModal from "@/components/admin/patients/ViewCommentsModal";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/select/SelectField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { caseTypes, genders, treatmentForOptions } from "@/constants/data";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { countriesData } from "@/utils/countries";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import FileUploadModal, {
  ViewFilesModal,
} from "@/components/admin/patients/FileUploadModal";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";

const countries = Object.keys(countriesData);

export default function ViewPatientRecords() {
  const router = useRouter();
  const { token, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [fileUploadPatient, setFileUploadPatient] = useState(null);
  const [showViewFilesModal, setShowViewFilesModal] = useState(false);
  const [viewFilesPatient, setViewFilesPatient] = useState(null);
  const [hasUserDeleteAccess, setHasUserDeleteAccess] = useState(false);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(false);
  const [planners, setPlanners] = useState([]);

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

  // Filter state
  const [filters, setFilters] = useState({
    gender: "",
    country: "",
    state: "",
    startDate: "",
    endDate: "",
    caseStatus: [],
  });

  const [caseCategories, setCaseCategories] = useState([]);

  const fetchPatients = async () => {
    dispatch(setLoading(true));
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sort: "latest",
        search: searchTerm,
        ...filters,
        // Handle caseStatus array for multi-select
        ...(filters.caseStatus.length > 0 && {
          caseStatus: filters.caseStatus.join(","),
        }),
      });
      // Remove caseStatus from filters to avoid duplicate
      if (filters.caseStatus.length > 0) {
        delete params.caseStatus;
        params.append("caseStatus", filters.caseStatus.join(","));
      }

      const data = await fetchWithError(`/api/admin/patients?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPatients(data.patients);
      setTotalPages(data.pagination.totalPages);
      setTotalPatients(data.pagination.totalPatients);
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm, filters]);

  useEffect(() => {
    const fetchPlanners = async () => {
      if (!hasPlannerAccess || !token) return;
      try {
        const data = await fetchWithError(
          "/api/admin/other-admins?role=planner",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setPlanners(data.admins || []);
      } catch (err) {
        // fetchWithError handles toast
        setPlanners([]);
      }
    };
    fetchPlanners();
  }, [hasPlannerAccess, token]);

  useEffect(() => {
    const fetchCaseCategories = async () => {
      dispatch(setLoading(true));
      try {
        const result = await fetchWithError(
          "/api/case-categories?active=true",
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        setCaseCategories(result.data || []);
      } catch (err) {
        // fetchWithError handles toast
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchCaseCategories();
  }, [token, dispatch]);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) return;
      dispatch(setLoading(true));
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasUserDeleteAccess(!!data.user?.userDeleteAccess);
        setHasPlannerAccess(!!data.user?.plannerAccess);
      } catch (err) {
        setHasUserDeleteAccess(false);
        setHasPlannerAccess(false);
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchAccess();
  }, [token, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDateToIST = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Kolkata",
    });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      gender: "",
      country: "",
      state: "",
      startDate: "",
      endDate: "",
      caseStatus: [],
    });
    setCurrentPage(1);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.gender) count++;
    if (filters.country) count++;
    if (filters.state) count++;
    if (filters.startDate || filters.endDate) count++;
    if (filters.caseStatus && filters.caseStatus.length > 0) count++;
    return count;
  };

  const getFilterCount = () => {
    return Object.values(filters).filter((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return value !== "";
    }).length;
  };

  const exportToExcel = () => {
    const exportData = patients.map((patient) => ({
      // Basic Patient Information
      "Case ID": patient.caseId,
      "Patient Name": patient.patientName,
      Age: patient.age,
      Gender: patient.gender,
      "Treatment For": patient.treatmentFor,

      // Location Information
      Country: patient.country,
      State: patient.state,
      City: patient.city,

      // Case Information
      "Case Category": patient.caseCategory,
      "Case Type": patient.caseType,
      "Single Arch Type": patient.singleArchType || "N/A",
      Package: patient.selectedPrice || "Not specified",
      "Case Status": patient.caseStatus || "Not specified",
      "Case Approval": patient.caseApproval ? "Yes" : "No",

      // Medical Information
      "Chief Complaint": patient.chiefComplaint || "Not specified",
      "Case Category Comments": patient.caseCategoryDetails || "Not specified",
      "Treatment Plan": patient.treatmentPlan || "Not specified",

      // Dental Examination - Hard Tissue
      "Caries Teeth":
        patient.dentalExamination?.cariesTeeth?.join(", ") || "None",
      "Missing Tooth Teeth":
        patient.dentalExamination?.missingToothTeeth?.join(", ") || "None",
      "Impacted Tooth Teeth":
        patient.dentalExamination?.impactedToothTeeth?.join(", ") || "None",
      "Supernumerary Tooth": patient.dentalExamination?.hasSupernumeraryTooth
        ? "Yes"
        : "No",
      "Supernumerary Description":
        patient.dentalExamination?.supernumeraryToothDescription || "N/A",
      "Supernumerary Teeth":
        patient.dentalExamination?.supernumeraryToothTeeth?.join(", ") || "N/A",
      "Endodontically Treated Teeth":
        patient.dentalExamination?.endodonticallyTreatedToothTeeth?.join(
          ", ",
        ) || "None",
      "Occlusal Wear Teeth":
        patient.dentalExamination?.occlusalWearTeeth?.join(", ") || "None",
      "Prosthesis Teeth":
        patient.dentalExamination?.prosthesisTeeth?.join(", ") || "None",
      "Prosthesis Comments":
        patient.dentalExamination?.prosthesisComments || "N/A",

      // Dental Examination - Soft Tissue
      Mucosa: patient.dentalExamination?.mucosa || "Not specified",
      Gingiva: patient.dentalExamination?.gingiva || "Not specified",
      Tongue: patient.dentalExamination?.tongue || "Not specified",
      Palate: patient.dentalExamination?.palate || "Not specified",
      "Floor of Mouth":
        patient.dentalExamination?.floorOfMouth || "Not specified",
      Lips: patient.dentalExamination?.lips || "Not specified",
      Cheeks: patient.dentalExamination?.cheeks || "Not specified",
      Tonsils: patient.dentalExamination?.tonsils || "Not specified",
      Throat: patient.dentalExamination?.throat || "Not specified",

      // Dental Examination - Functional Analysis
      "Mouth Opening":
        patient.dentalExamination?.mouthOpening || "Not specified",
      "Lateral Movement Right":
        patient.dentalExamination?.lateralMovementRight || "Not specified",
      "Lateral Movement Left":
        patient.dentalExamination?.lateralMovementLeft || "Not specified",
      Protrusion: patient.dentalExamination?.protrusion || "Not specified",
      Retrusion: patient.dentalExamination?.retrusion || "Not specified",
      "TMJ Clicking": patient.dentalExamination?.tmjClicking || "Not specified",
      "TMJ Pain": patient.dentalExamination?.tmjPain || "Not specified",
      "TMJ Tenderness":
        patient.dentalExamination?.tmjTenderness || "Not specified",

      // Dental Examination - Skeletal Analysis
      "Facial Form": patient.dentalExamination?.facialForm || "Not specified",
      "Facial Profile":
        patient.dentalExamination?.facialProfile || "Not specified",
      "Facial Symmetry":
        patient.dentalExamination?.facialSymmetry || "Not specified",
      "Nasolabial Angle":
        patient.dentalExamination?.nasolabialAngle || "Not specified",
      "Mentolabial Sulcus":
        patient.dentalExamination?.mentolabialSulcus || "Not specified",
      "Lip Competency":
        patient.dentalExamination?.lipCompetency || "Not specified",
      "Gingival Display":
        patient.dentalExamination?.gingivalDisplay || "Not specified",
      "Smile Arc": patient.dentalExamination?.smileArc || "Not specified",

      // Dental Examination - Dental Analysis
      Overjet: patient.dentalExamination?.overjet || "Not specified",
      Overbite: patient.dentalExamination?.overbite || "Not specified",
      Crossbite: patient.dentalExamination?.crossbite || "Not specified",
      "Open Bite": patient.dentalExamination?.openBite || "Not specified",
      "Midline Shift":
        patient.dentalExamination?.midlineShift || "Not specified",
      Crowding: patient.dentalExamination?.crowding || "Not specified",
      Spacing: patient.dentalExamination?.spacing || "Not specified",

      // Space Analysis
      "Space Required":
        patient.dentalExamination?.spaceRequired || "Not specified",
      "Space Available":
        patient.dentalExamination?.spaceAvailable || "Not specified",
      "Space Deficit":
        patient.dentalExamination?.spaceDeficit || "Not specified",
      "Space Surplus":
        patient.dentalExamination?.spaceSurplus || "Not specified",

      // How to Gain Space
      "IPR Type": patient.dentalExamination?.iprType || "Not specified",
      "IPR Measure": patient.dentalExamination?.iprMeasure || "Not specified",
      "Expansion Type":
        patient.dentalExamination?.expansionType || "Not specified",
      "Gain Space Extraction":
        patient.dentalExamination?.gainSpaceExtraction || "Not specified",
      "Extraction Type": patient.dentalExamination?.extractionType || "N/A",
      "Extraction Teeth":
        patient.dentalExamination?.gainSpaceExtractionTeeth?.join(", ") ||
        "N/A",
      "Gain Space Distalization":
        patient.dentalExamination?.gainSpaceDistalization || "Not specified",
      "Distalization Teeth":
        patient.dentalExamination?.gainSpaceDistalizationTeeth?.join(", ") ||
        "N/A",
      "Gain Space Proclination":
        patient.dentalExamination?.gainSpaceProclination || "Not specified",
      "Proclination Teeth":
        patient.dentalExamination?.gainSpaceProclinationTeeth?.join(", ") ||
        "N/A",

      // Extraction Details
      "Extraction Required": patient.dentalExamination?.extraction?.required
        ? "Yes"
        : "No",
      "Extraction Comments":
        patient.dentalExamination?.extraction?.comments || "N/A",

      // Additional Information
      "Nature of Availability":
        patient.dentalExamination?.natureOfAvailability || "Not specified",
      "Follow-up Months": patient.dentalExamination?.followUpMonths || "N/A",
      "Oral Habits": patient.dentalExamination?.oralHabits || "Not specified",
      "Other Habit Specification":
        patient.dentalExamination?.otherHabitSpecification || "N/A",
      "Family History":
        patient.dentalExamination?.familyHistory ||
        patient.familyHistory ||
        "Not specified",

      // File Information
      "Intraoral Photos":
        (patient.dentalExaminationFiles?.img1?.length || 0) +
        (patient.dentalExaminationFiles?.img2?.length || 0) +
        (patient.dentalExaminationFiles?.img3?.length || 0) +
        (patient.dentalExaminationFiles?.img4?.length || 0) +
        (patient.dentalExaminationFiles?.img5?.length || 0) +
        (patient.dentalExaminationFiles?.img6?.length || 0),
      "Facial Photos":
        (patient.dentalExaminationFiles?.img7?.length || 0) +
        (patient.dentalExaminationFiles?.img8?.length || 0) +
        (patient.dentalExaminationFiles?.img9?.length || 0),
      "X-ray Files":
        (patient.dentalExaminationFiles?.img10?.length || 0) +
        (patient.dentalExaminationFiles?.img11?.length || 0),
      "3D Models":
        (patient.dentalExaminationFiles?.model1?.length || 0) +
        (patient.dentalExaminationFiles?.model2?.length || 0),
      "Total Files":
        (patient.dentalExaminationFiles?.img1?.length || 0) +
        (patient.dentalExaminationFiles?.img2?.length || 0) +
        (patient.dentalExaminationFiles?.img3?.length || 0) +
        (patient.dentalExaminationFiles?.img4?.length || 0) +
        (patient.dentalExaminationFiles?.img5?.length || 0) +
        (patient.dentalExaminationFiles?.img6?.length || 0) +
        (patient.dentalExaminationFiles?.img7?.length || 0) +
        (patient.dentalExaminationFiles?.img8?.length || 0) +
        (patient.dentalExaminationFiles?.img9?.length || 0) +
        (patient.dentalExaminationFiles?.img10?.length || 0) +
        (patient.dentalExaminationFiles?.img11?.length || 0) +
        (patient.dentalExaminationFiles?.model1?.length || 0) +
        (patient.dentalExaminationFiles?.model2?.length || 0),

      // Modification Status
      Modified: patient.modification?.commentSubmitted ? "Yes" : "No",

      // Timestamps
      "Created Date": new Date(patient.createdAt).toLocaleDateString(),
      "Last Updated": new Date(
        patient.updatedAt || patient.createdAt,
      ).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patients");

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Case ID
      { wch: 20 }, // Patient Name
      { wch: 8 }, // Age
      { wch: 10 }, // Gender
      { wch: 15 }, // Treatment For
      { wch: 15 }, // Country
      { wch: 15 }, // State
      { wch: 15 }, // City
      { wch: 15 }, // Case Category
      { wch: 20 }, // Case Type
      { wch: 20 }, // Single Arch Type
      { wch: 20 }, // Package
      { wch: 15 }, // Case Status
      { wch: 15 }, // Case Approval
      { wch: 30 }, // Chief Complaint
      { wch: 25 }, // Case Category Comments
      { wch: 25 }, // Treatment Plan
      { wch: 20 }, // Caries Teeth
      { wch: 20 }, // Missing Tooth Teeth
      { wch: 20 }, // Impacted Tooth Teeth
      { wch: 20 }, // Supernumerary Tooth
      { wch: 25 }, // Supernumerary Description
      { wch: 20 }, // Supernumerary Teeth
      { wch: 25 }, // Endodontically Treated Teeth
      { wch: 20 }, // Occlusal Wear Teeth
      { wch: 20 }, // Prosthesis Teeth
      { wch: 25 }, // Prosthesis Comments
      { wch: 20 }, // Mucosa
      { wch: 20 }, // Gingiva
      { wch: 20 }, // Tongue
      { wch: 20 }, // Palate
      { wch: 20 }, // Floor of Mouth
      { wch: 20 }, // Lips
      { wch: 20 }, // Cheeks
      { wch: 20 }, // Tonsils
      { wch: 20 }, // Throat
      { wch: 20 }, // Mouth Opening
      { wch: 20 }, // Lateral Movement Right
      { wch: 20 }, // Lateral Movement Left
      { wch: 20 }, // Protrusion
      { wch: 20 }, // Retrusion
      { wch: 20 }, // TMJ Clicking
      { wch: 20 }, // TMJ Pain
      { wch: 20 }, // TMJ Tenderness
      { wch: 20 }, // Facial Form
      { wch: 20 }, // Facial Profile
      { wch: 20 }, // Facial Symmetry
      { wch: 20 }, // Nasolabial Angle
      { wch: 20 }, // Mentolabial Sulcus
      { wch: 20 }, // Lip Competency
      { wch: 20 }, // Gingival Display
      { wch: 20 }, // Smile Arc
      { wch: 20 }, // Overjet
      { wch: 20 }, // Overbite
      { wch: 20 }, // Crossbite
      { wch: 20 }, // Open Bite
      { wch: 20 }, // Midline Shift
      { wch: 20 }, // Crowding
      { wch: 20 }, // Spacing
      { wch: 20 }, // Space Required
      { wch: 20 }, // Space Available
      { wch: 20 }, // Space Deficit
      { wch: 20 }, // Space Surplus
      { wch: 20 }, // IPR Type
      { wch: 20 }, // IPR Measure
      { wch: 20 }, // Expansion Type
      { wch: 20 }, // Gain Space Extraction
      { wch: 20 }, // Extraction Type
      { wch: 20 }, // Extraction Teeth
      { wch: 20 }, // Gain Space Distalization
      { wch: 20 }, // Distalization Teeth
      { wch: 20 }, // Gain Space Proclination
      { wch: 20 }, // Proclination Teeth
      { wch: 20 }, // Extraction Required
      { wch: 30 }, // Extraction Comments
      { wch: 25 }, // Nature of Availability
      { wch: 15 }, // Follow-up Months
      { wch: 20 }, // Oral Habits
      { wch: 25 }, // Other Habit Specification
      { wch: 25 }, // Family History
      { wch: 15 }, // Intraoral Photos
      { wch: 15 }, // Facial Photos
      { wch: 15 }, // X-ray Files
      { wch: 15 }, // 3D Models
      { wch: 15 }, // Total Files
      { wch: 12 }, // Modified
      { wch: 15 }, // Created Date
      { wch: 15 }, // Last Updated
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(
      wb,
      `admin_patients_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Patient data exported successfully!");
  };

  // Helper to get filter label
  const filterLabels = {
    gender: "Gender",
    country: "Country",
    state: "State",
    startDate: "Start Date",
    endDate: "End Date",
    caseStatus: "Case Status",
  };

  // Case status options for multi-select
  const caseStatusOptions = [
    { label: "Setup Pending", value: "setup pending" },
    { label: "Approval Pending", value: "approval pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  // Handle multi-select changes
  const handleMultiSelectChange = (key, newValues) => {
    setFilters((prev) => ({ ...prev, [key]: newValues }));
    setCurrentPage(1);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    dispatch(setLoading(true));
    try {
      await fetchWithError(
        `/api/admin/patients/update-details?id=${patientToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Patient deleted successfully");
      setPatients((prev) => prev.filter((p) => p._id !== patientToDelete._id));
      setShowDeleteModal(false);
      setPatientToDelete(null);
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleAssignPlanner = async (patientId, plannerId) => {
    dispatch(setLoading(true));
    try {
      await fetchWithError(
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
      toast.success("Planner assigned successfully!");
      fetchPatients();
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
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
            stroke="#3b82f6"
            strokeWidth="4"
            fill="#e0e7ff"
          />
          <path
            d="M40 80c0-11 9-20 20-20s20 9 20 20"
            stroke="#6366f1"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="60" cy="54" r="10" fill="#6366f1" />
        </svg>
        <div className="mb-2 text-2xl font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200">
          No patients found
        </div>
        <div className="mb-6 text-gray-500">
          Try adjusting your filters or add a new patient record.
        </div>
        <Button
          onClick={() => router.push("/admin/patients/create-patient-record")}
          className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-6 py-3 font-semibold text-white subpixel-antialiased shadow-lg transition-transform hover:scale-105"
        >
          Add your first patient
        </Button>
      </div>
    );
  }

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
            onClick={exportToExcel}
            className="rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-4 py-2 font-semibold text-white subpixel-antialiased shadow-md transition-transform hover:scale-105"
          >
            Export to Excel
          </Button>
          <Button
            onClick={() => router.push("/admin/patients/create-patient-record")}
            className="rounded-lg bg-gradient-to-r from-green-400 to-green-600 px-4 py-2 font-semibold text-white subpixel-antialiased shadow-md transition-transform hover:scale-105"
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
            className="h-10 w-1/4 rounded-lg bg-gradient-to-r from-blue-100 to-blue-300 px-4 font-semibold text-blue-800 subpixel-antialiased shadow-md transition-transform hover:scale-105"
            onClick={() => setShowFilters((prev) => !prev)}
          >
            {showFilters ? "Hide Filters" : "Filters"}
          </Button>
          <Button
            type="button"
            className="h-10 rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 px-4 font-semibold text-white subpixel-antialiased shadow-md transition-transform hover:scale-105"
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
            className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
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

            {/* Case Status Multi-Select Filter */}
            <div className="col-span-full flex w-full flex-col gap-2">
              <label className="text-xs font-medium text-gray-600">
                Case Status
              </label>
              <div className="flex flex-wrap gap-2">
                {caseStatusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.caseStatus.includes(option.value)}
                      onChange={() => {
                        const newValues = filters.caseStatus.includes(
                          option.value,
                        )
                          ? filters.caseStatus.filter((v) => v !== option.value)
                          : [...filters.caseStatus, option.value];
                        handleMultiSelectChange("caseStatus", newValues);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-full mt-2 flex w-full justify-end gap-2">
              <Button
                type="submit"
                className="h-10 rounded-lg bg-blue-500 px-4 font-semibold text-white subpixel-antialiased shadow transition-transform hover:scale-105"
              >
                Apply Filters
              </Button>
              <Button
                type="button"
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="h-10 rounded-lg bg-white px-4 font-semibold text-blue-700 subpixel-antialiased shadow transition-transform hover:scale-105"
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
      {getActiveFiltersCount() > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              return (
                <Badge
                  key={key}
                  color="info"
                  className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs shadow-sm dark:border-blue-700 dark:bg-blue-900/40"
                >
                  <span className="font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200">
                    {filterLabels[key] || key}:
                  </span>
                  <span className="text-blue-900 dark:text-blue-100">
                    {value.join(", ")}
                  </span>
                  <button
                    type="button"
                    className="ml-1 text-blue-400 hover:text-blue-700 focus:outline-none dark:hover:text-blue-200"
                    onClick={() => handleMultiSelectChange(key, [])}
                    aria-label={`Clear ${filterLabels[key] || key} filter`}
                  >
                    ×
                  </button>
                </Badge>
              );
            } else if (value) {
              return (
                <Badge
                  key={key}
                  color="info"
                  className="flex items-center gap-1 rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs shadow-sm dark:border-blue-700 dark:bg-blue-900/40"
                >
                  <span className="font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200">
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
              );
            }
            return null;
          })}
        </div>
      )}

      <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />

      {/* Patients Table */}
      <div className="before:border-gradient-to-r before:animate-border-glow relative mx-auto w-full max-w-6xl overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 sm:overflow-x-visible dark:bg-gray-900/80">
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
              <circle cx="1" cy="1" r="1" fill="#3b82f6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <Table className="relative z-10 min-w-full font-sans text-[10px]">
          {patients.length > 0 && (
            <>
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
                    Case Date
                  </TableCell>
                  {/* <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Location
                  </TableCell> */}
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
                    Comments
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Files
                  </TableCell>
                  {hasPlannerAccess && (
                    <TableCell
                      isHeader
                      className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                    >
                      Planner
                    </TableCell>
                  )}
                  <TableCell
                    isHeader
                    className="px-2 py-1 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200"
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient, idx) => (
                  <TableRow
                    key={patient._id}
                    className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${
                      patient.modification?.commentSubmitted
                        ? "border-l-4 border-yellow-400 bg-yellow-50/80 dark:border-yellow-500 dark:bg-yellow-900/20"
                        : idx % 2 === 1
                          ? "bg-blue-50/50 dark:bg-gray-900/30"
                          : "bg-white/70 dark:bg-gray-900/50"
                    } animate-fadeInUp h-10 items-center`}
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
                    <TableCell className="flex h-10 items-center justify-center gap-2 px-2 py-1 text-center font-medium">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        {patient.patientName}
                        {patient.modification?.commentSubmitted && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                            Modified
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center font-medium whitespace-nowrap">
                      {patient.userId ? patient.userId.name : "N/A"}
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center font-medium">
                      {formatDateToIST(patient.createdAt)}
                    </TableCell>
                    {/* <TableCell className="px-2 py-1 text-center">
                      <div className="text-[10px] leading-tight">
                        <div>{patient.city}</div>
                        <div className="text-[9px] whitespace-nowrap text-gray-500">
                          {patient.country}
                        </div>
                      </div>
                    </TableCell> */}
                    <TableCell className="px-1 py-1 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                          patient.caseStatus === "approved"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                            : patient.caseStatus === "rejected"
                              ? "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300"
                              : patient.caseStatus === "approval pending"
                                ? "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
                                : patient.caseStatus === "setup pending"
                                  ? "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300"
                                  : "border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-400"
                        }`}
                      >
                        {patient.caseStatus || "Not specified"}
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          onClick={() => handleOpenUploadModal(patient)}
                          size="xs"
                          variant="outline"
                          className="flex items-center gap-1 border-purple-400 p-1 text-purple-600 shadow-sm transition-transform hover:scale-105 hover:bg-purple-100/60 dark:hover:bg-purple-900/40"
                        >
                          Add
                        </Button>
                        <Button
                          onClick={() => handleOpenViewCommentsModal(patient)}
                          size="xs"
                          variant="outline"
                          className="flex items-center gap-1 border-blue-400 p-1 text-blue-600 shadow-sm transition-transform hover:scale-105 hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
                        >
                          See
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-1 text-center">
                      <div className="flex justify-center gap-1 whitespace-nowrap">
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
                      </div>
                    </TableCell>
                    {hasPlannerAccess && (
                      <TableCell className="px-2 py-0 text-center">
                        <Select
                          value={patient.plannerId?._id || ""}
                          onChange={(e) =>
                            handleAssignPlanner(patient._id, e.target.value)
                          }
                          options={[
                            ...planners.map((planner) => ({
                              label: planner.name,
                              value: planner._id,
                            })),
                          ]}
                          className="h-5 !w-28 !px-0 !py-0 text-[9px]"
                        />
                      </TableCell>
                    )}
                    <TableCell className="px-2 py-1 text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          onClick={() =>
                            router.push(
                              `/admin/patients/view-patient-details?id=${patient._id}`,
                            )
                          }
                          size="xs"
                          variant="outline"
                          className="flex items-center gap-1 border-blue-400 p-1 text-blue-600 shadow-sm transition-transform hover:scale-105 hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
                        >
                          <EyeIcon className="h-3 w-3" /> View
                        </Button>
                        {hasUserDeleteAccess && (
                          <Button
                            onClick={() =>
                              router.push(
                                `/admin/patients/edit-patient-details?id=${patient._id}`,
                              )
                            }
                            size="xs"
                            variant="outline"
                            className="flex items-center gap-1 border-green-400 p-1 text-green-600 shadow-sm transition-transform hover:scale-105 hover:bg-green-100/60 dark:hover:bg-green-900/40"
                          >
                            <PencilIcon className="h-3 w-3" /> Edit
                          </Button>
                        )}
                        {hasUserDeleteAccess && (
                          <Button
                            onClick={() => {
                              setPatientToDelete(patient);
                              setShowDeleteModal(true);
                            }}
                            size="xs"
                            variant="outline"
                            className="flex items-center gap-1 border-red-400 p-1 text-red-600 shadow-sm transition-transform hover:scale-105 hover:bg-red-100/60 dark:hover:bg-red-900/40"
                          >
                            <TrashBinIcon className="h-3 w-3" /> Delete
                          </Button>
                        )}
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

      <ConfirmationModal
        isOpen={showDeleteModal && !!patientToDelete}
        onClose={() => {
          setShowDeleteModal(false);
          setPatientToDelete(null);
        }}
        onConfirm={handleDeletePatient}
        title="Delete Patient"
        message={
          patientToDelete
            ? `Are you sure you want to delete patient '${patientToDelete.patientName}'? This action cannot be undone.`
            : ""
        }
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={handleCloseUploadModal}
        patient={selectedPatient}
      />
      <ViewCommentsModal
        isOpen={isViewCommentsModalOpen}
        onClose={handleCloseViewCommentsModal}
        patient={patientForComments}
      />
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

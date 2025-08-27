"use client";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import {
  GlobeAltIcon,
  MapIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  DocumentArrowDownIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  HeartIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  CogIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import { useFileDownload } from "@/hooks/useFileDownload";
import { toast } from "react-toastify";

const luxuryBg = `fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center bg-white`;
const glassCard =
  "relative bg-white/95 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-8 mb-12 overflow-hidden";
const sectionHeader =
  "flex items-center gap-3 text-2xl md:text-3xl font-extrabold text-blue-700 mb-6 animate-fadeInUp";
const divider =
  "h-1 w-1/2 mx-auto my-8 bg-blue-100 rounded-full opacity-60 animate-pulse";
const fadeIn = "animate-fadeInUp";

const imageLabels = [
  "Upper arch",
  "Lower arch",
  "Anterior View",
  "Left View",
  "Right View",
  "Profile View",
  "Frontal View",
  "Smiling",
  "Panoramic Radiograph",
  "Lateral Radiograph",
  "Others",
  "Select PLY/TLS File to upload",
  "Select PLY/TLS File to upload",
];

export default function ViewPatientDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token, role } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("general");
  const [comments, setComments] = useState([]);
  const [patientFiles, setPatientFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [scanFilesSelected, setScanFilesSelected] = useState(new Set());

  // File download hook
  const {
    downloadingFiles,
    downloadProgress,
    downloadFile,
    downloadMultipleFiles,
    downloadSelectedFiles,
    downloadAllFiles,
    isDownloading,
    getDownloadProgress,
    hasActiveDownloads,
    totalDownloads,
  } = useFileDownload();

  const dispatch = useDispatch();

  useEffect(() => {
    if (!patientId) {
      toast.error("No patient ID provided");
      setError("No patient ID provided");
      return;
    }
    const fetchPatient = async () => {
      try {
        dispatch(setLoading(true));
        const result = await fetchWithError(
          `/api/patients/update-details?id=${encodeURIComponent(patientId).trim()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (result.error && result.error.includes("permission")) {
          toast.error(
            "You don't have permission to view this patient's details",
          );
          setError("Permission denied");
          return;
        }

        if (result.error) {
          toast.error(result.error);
          setError(result.error);
          return;
        }

        setData(result);
        toast.success("Patient details loaded successfully");
      } catch (e) {
        const errorMessage = e.message || "Failed to fetch patient details";
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchPatient();
  }, [patientId, token, dispatch]);

  useEffect(() => {
    if (patientId && activeTab === "comments") {
      fetchComments();
    }
  }, [patientId, activeTab]);

  useEffect(() => {
    if (patientId && activeTab === "scanFiles") {
      fetchPatientFiles();
    }
  }, [patientId, activeTab]);

  const fetchPatientFiles = async () => {
    try {
      const result = await fetchWithError(
        `/api/patients/files?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Check for permission issues
      if (result.error && result.error.includes("permission")) {
        toast.error("You don't have permission to view this patient's files");
        setPatientFiles([]);
        return;
      }

      if (result.success) {
        setPatientFiles(result.files || []);
        if (result.files && result.files.length > 0) {
          toast.success(`${result.files.length} files loaded successfully`);
        }
      } else {
        const errorMsg = result.message || "Failed to fetch patient files";
        toast.error(errorMsg);
        setPatientFiles([]);
      }
    } catch (e) {
      const errorMsg = e.message || "Error fetching patient files";
      toast.error(errorMsg);
      setPatientFiles([]);
    }
  };

  const fetchComments = async () => {
    try {
      const result = await fetchWithError(
        `/api/patients/comments?patientId=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Check for permission issues
      if (result.error && result.error.includes("permission")) {
        toast.error(
          "You don't have permission to view this patient's comments",
        );
        setComments([]);
        return;
      }

      if (result.comments) {
        setComments(result.comments);
        if (result.comments.length > 0) {
          toast.success(
            `${result.comments.length} comments loaded successfully`,
          );
        }
      } else {
        setComments([]);
      }
    } catch (e) {
      const errorMsg = e.message || "Error fetching comments";
      toast.error(errorMsg);
      setComments([]);
    }
  };

  if (error)
    return (
      <div className="py-8 text-center text-xl font-semibold text-red-500">
        {error}
      </div>
    );
  if (!data) return null;

  const {
    scanFiles = {},
    extraction = {},
    interproximalReduction = {},
    measureOfIPR = {},
  } = data;

  // Helper to get file name from URL
  const getFileNameFromUrl = (url) => {
    try {
      const path = new URL(url).pathname.split("/").pop() || "";
      return decodeURIComponent(path).substring(path.indexOf("-") + 1);
    } catch {
      return "file";
    }
  };

  const tabs = [
    {
      id: "general",
      label: "General Information",
      icon: <DocumentTextIcon className="h-5 w-5" />,
    },
    { id: "files", label: "Files", icon: <FolderIcon className="h-5 w-5" /> },
    {
      id: "scanFiles",
      label: "Scan Files",
      icon: <DocumentArrowDownIcon className="h-5 w-5" />,
    },
    {
      id: "comments",
      label: "Comments",
      icon: <ChatBubbleLeftRightIcon className="h-5 w-5" />,
    },
  ];

  const renderGeneralInformation = () => (
    <div className="space-y-10">
      {/* Section 1: Patient Information */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, type: "spring" }}
        className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3">
            <UserIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Patient Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 text-lg md:grid-cols-3">
          <div>
            <Label>Patient Name</Label>
            <Input value={data.patientName} disabled />
          </div>
          <div>
            <Label>Age</Label>
            <Input value={data.age} disabled />
          </div>
          <div>
            <Label>Gender</Label>
            <Select
              value={data.gender}
              options={[
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
                { label: "Other", value: "Other" },
              ]}
              disabled
            />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Phone Number</Label>
            <Input value={data.phoneNumber} disabled />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={data.email} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Date of Birth</Label>
            <Input value={data.dateOfBirth} disabled />
          </div>
          <div>
            <Label>Blood Group</Label>
            <Input value={data.bloodGroup} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Past Medical History</Label>
            <TextArea value={data.pastMedicalHistory} disabled />
          </div>
          <div>
            <Label>Past Dental History</Label>
            <TextArea value={data.pastDentalHistory} disabled />
          </div>
        </div>
        <div className="mt-6">
          <Label>Treatment For</Label>
          <div className="mt-2 flex gap-6">
            {["Clear Aligners", "Invisalign", "Braces"].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 ${data.treatmentFor === opt ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.treatmentFor === opt}
                  disabled
                  className={`accent-blue-500 ${data.treatmentFor === opt ? "ring-2 ring-blue-400" : ""}`}
                />
                <span
                  className={data.treatmentFor === opt ? "text-blue-700" : ""}
                >
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <Label>Emergency Contact</Label>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label className="text-sm text-gray-600">Name</Label>
              <Input value={data.emergencyContact?.name} disabled />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Phone</Label>
              <Input value={data.emergencyContact?.phone} disabled />
            </div>
            <div>
              <Label className="text-sm text-gray-600">Relationship</Label>
              <Input value={data.emergencyContact?.relationship} disabled />
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="group relative">
            <Label>
              <span className="inline-flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-500 group-hover:animate-bounce" />{" "}
                Country
              </span>
            </Label>
            <div className="relative rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/60 shadow-xl backdrop-blur-md transition-all group-hover:border-blue-500 group-hover:shadow-blue-200/60">
              <div className="flex min-h-[44px] w-full items-center rounded-xl border-none bg-transparent px-4 py-3 pr-10 text-base font-semibold text-gray-900">
                <GlobeAltIcon className="mr-2 h-6 w-6 text-blue-400 transition-transform group-hover:scale-125" />
                <span>{data.country || "-"}</span>
              </div>
            </div>
          </div>
          <div className="group relative">
            <Label>
              <span className="inline-flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-blue-500 group-hover:animate-bounce" />{" "}
                State/Province
              </span>
            </Label>
            <div className="relative rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/60 shadow-xl backdrop-blur-md transition-all group-hover:border-blue-500 group-hover:shadow-blue-200/60">
              <div className="flex min-h-[44px] w-full items-center rounded-xl border-none bg-transparent px-4 py-3 pr-10 text-base font-semibold text-gray-900">
                <MapIcon className="mr-2 h-6 w-6 text-blue-400 transition-transform group-hover:scale-125" />
                <span>{data.state || "-"}</span>
              </div>
            </div>
          </div>
          <div>
            <Label>City</Label>
            <Input value={data.city} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Primary Address</Label>
            <Input value={data.primaryAddress} disabled />
          </div>
          <div>
            <Label>Shipping Address</Label>
            <Input value={data.shippingAddress} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Billing Address</Label>
            <Input value={data.billingAddress} disabled />
          </div>
          <div>
            <Label>Shipping Address Type</Label>
            <Input value={data.shippingAddressType} disabled />
          </div>
        </div>
      </motion.div>
      <div className={divider} />
      {/* Section 2: Location Information */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.7, type: "spring" }}
        className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-green-100 p-3">
            <MapPinIcon className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Location Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="group relative">
            <Label>
              <span className="inline-flex items-center gap-2">
                <GlobeAltIcon className="h-5 w-5 text-blue-500 group-hover:animate-bounce" />
                Country
              </span>
            </Label>
            <div className="relative rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/60 shadow-xl backdrop-blur-md transition-all group-hover:border-blue-500 group-hover:shadow-blue-200/60">
              <div className="flex min-h-[44px] w-full items-center rounded-xl border-none bg-transparent px-4 py-3 pr-10 text-base font-semibold text-gray-900">
                <GlobeAltIcon className="mr-2 h-6 w-6 text-blue-400 transition-transform group-hover:scale-125" />
                <span>{data.country || "-"}</span>
              </div>
            </div>
          </div>
          <div className="group relative">
            <Label>
              <span className="inline-flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-blue-500 group-hover:animate-bounce" />
                State/Province
              </span>
            </Label>
            <div className="relative rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/60 shadow-xl backdrop-blur-md transition-all group-hover:border-blue-500 group-hover:shadow-blue-200/60">
              <div className="flex min-h-[44px] w-full items-center rounded-xl border-none bg-transparent px-4 py-3 pr-10 text-base font-semibold text-gray-900">
                <GlobeAltIcon className="mr-2 h-6 w-6 text-blue-400 transition-transform group-hover:scale-125" />
                <span>{data.state || "-"}</span>
              </div>
            </div>
          </div>
          <div>
            <Label>City</Label>
            <Input value={data.city} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Postal Code</Label>
            <Input value={data.postalCode} disabled />
          </div>
          <div>
            <Label>Timezone</Label>
            <Input value={data.timezone} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Primary Address</Label>
            <Input value={data.primaryAddress} disabled />
          </div>
          <div>
            <Label>Shipping Address</Label>
            <Input value={data.shippingAddress} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Billing Address</Label>
            <Input value={data.billingAddress} disabled />
          </div>
          <div>
            <Label>Shipping Address Type</Label>
            <Input value={data.shippingAddressType} disabled />
          </div>
        </div>
      </motion.div>

      {/* Section 3: Address Information */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7, type: "spring" }}
        className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-3">
            <MapPinIcon className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            Address Information
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Primary Address</Label>
            <Input value={data.primaryAddress} disabled />
          </div>
          <div>
            <Label>Shipping Address</Label>
            <Input value={data.shippingAddress} disabled />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Billing Address</Label>
            <Input value={data.billingAddress} disabled />
          </div>
          <div>
            <Label>Shipping Address Type</Label>
            <Input value={data.shippingAddressType} disabled />
          </div>
        </div>
      </motion.div>

      {/* Section 4: Case Information */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7, type: "spring" }}
        className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-orange-100 p-3">
            <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Case Information</h2>
        </div>
        <div className="mb-6">
          <Label>Chief Complaint</Label>
          <TextArea value={data.chiefComplaint} disabled />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Case Type</Label>
            <div className="mt-2 flex gap-6">
              <label
                className={`flex items-center gap-2 ${data.caseType && data.caseType.includes("Single") ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.caseType && data.caseType.includes("Single")}
                  disabled
                  className={`accent-blue-500 ${data.caseType && data.caseType.includes("Single") ? "ring-2 ring-blue-400" : ""}`}
                />
                <span
                  className={
                    data.caseType && data.caseType.includes("Single")
                      ? "text-blue-700"
                      : ""
                  }
                >
                  Single Arch
                </span>
              </label>
              <label
                className={`flex items-center gap-2 ${data.caseType === "Double Arch" ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.caseType === "Double Arch"}
                  disabled
                  className={`accent-blue-500 ${data.caseType === "Double Arch" ? "ring-2 ring-blue-400" : ""}`}
                />
                <span
                  className={
                    data.caseType === "Double Arch" ? "text-blue-700" : ""
                  }
                >
                  Double Arch
                </span>
              </label>
            </div>
            {data.caseType && data.caseType.includes("Single") && (
              <div className="mt-4">
                <Label>Arch</Label>
                <Input value={data.caseType} disabled />
              </div>
            )}
          </div>
          <div>
            <Label>Case Category</Label>
            {data.selectedPrice && <Input value={data.caseCategory} disabled />}
            {data.selectedPrice && (
              <div className="mt-4">
                <Label>Package</Label>
                <Input value={data.selectedPrice} disabled />
              </div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <Label>Case Category Comments</Label>
          <TextArea value={data.caseCategoryDetails} disabled />
        </div>
        <div className="mt-6">
          <Label>Treatment Plan</Label>
          <TextArea value={data.treatmentPlan} disabled />
        </div>
        <div className="mt-6">
          <Label>Extraction Required</Label>
          <div className="mt-2 flex gap-6">
            {["Yes", "No"].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 ${data.extraction?.required === (opt === "Yes") ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.extraction?.required === (opt === "Yes")}
                  disabled
                  className={`accent-blue-500 ${data.extraction?.required === (opt === "Yes") ? "ring-2 ring-blue-400" : ""}`}
                />
                <span
                  className={
                    data.extraction?.required === (opt === "Yes")
                      ? "text-blue-700"
                      : ""
                  }
                >
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <Label>Extraction Comments</Label>
          <TextArea value={data.extraction?.comments} disabled />
        </div>
        <div className="mt-6">
          <Label>Additional Comments</Label>
          <TextArea value={data.additionalComments} disabled />
        </div>
        <div className="mt-6">
          <Label>Midline</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {[
              "Adjust as Needed",
              "Correct through IPR",
              "Move to Left",
              "Move to Right",
              "None",
            ].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 ${data.midline === opt ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.midline === opt}
                  disabled
                  className={`accent-blue-500 ${data.midline === opt ? "ring-2 ring-blue-400" : ""}`}
                />
                <span className={data.midline === opt ? "text-blue-700" : ""}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <Label>Midline Comments</Label>
          <TextArea value={data.midlineComments} disabled />
        </div>
        <div className="mt-6">
          <Label>Arch Expansion</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {[
              "Move to Right",
              "Expand in Anterior",
              "Expand in Posterior",
              "No Expansion Required",
              "None",
            ].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 ${data.archExpansion === opt ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.archExpansion === opt}
                  disabled
                  className={`accent-blue-500 ${data.archExpansion === opt ? "ring-2 ring-blue-400" : ""}`}
                />
                <span
                  className={data.archExpansion === opt ? "text-blue-700" : ""}
                >
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6">
          <Label>Arch Expansion Comments</Label>
          <TextArea value={data.archExpansionComments} disabled />
        </div>
      </motion.div>

      {/* Section 5: IPR, Midline & Arch Expansion */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.7, type: "spring" }}
        className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3">
            <CogIcon className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            IPR, Midline & Arch Expansion
          </h2>
        </div>
        {/* IPR Section (modern pill checkboxes) */}
        <div className="mb-8 rounded-2xl border border-blue-100 bg-white/80 p-6 shadow">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="text-xl font-bold text-blue-700">
              Interproximal Reduction (IPR)
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: "detail1", label: "Anterior Region (3 To 3)" },
              { key: "detail2", label: "Posterior Region (Distal To Canine)" },
              { key: "detail3", label: "plan as required" },
              { key: "detail4", label: "No IPR" },
            ].map((opt) => {
              const checked = interproximalReduction?.[opt.key] === opt.label;
              return (
                <span
                  key={opt.key}
                  role="checkbox"
                  aria-checked={checked}
                  className={`flex items-center gap-2 rounded-full border px-5 py-2 shadow-sm transition-all select-none ${
                    checked
                      ? "border-blue-600 bg-gradient-to-r from-blue-500 to-blue-400 font-bold text-white"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  } ${!checked ? "hover:bg-blue-50" : ""} cursor-default`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled
                    className="hidden"
                  />
                  {checked && (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <span className="text-base">{opt.label}</span>
                </span>
              );
            })}
          </div>
        </div>
        {/* Measure of IPR Section (modern pill checkboxes) */}
        <div className="mb-8 rounded-2xl border border-blue-100 bg-white/80 p-6 shadow">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M4 12h16" />
              </svg>
            </span>
            <span className="text-xl font-bold text-blue-700">
              Measure of IPR
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { key: "detailA", label: "Upto 0.25mm/surface" },
              { key: "detailB", label: "0.25mm to 0.5mm/surface" },
              { key: "detailC", label: "Plan as required" },
            ].map((opt) => {
              const checked = measureOfIPR?.[opt.key] === opt.label;
              return (
                <span
                  key={opt.key}
                  role="checkbox"
                  aria-checked={checked}
                  className={`flex items-center gap-2 rounded-full border px-5 py-2 shadow-sm transition-all select-none ${
                    checked
                      ? "border-blue-600 bg-gradient-to-r from-blue-500 to-blue-400 font-bold text-white"
                      : "border-gray-300 bg-gray-50 text-gray-500"
                  } ${!checked ? "hover:bg-blue-50" : ""} cursor-default`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled
                    className="hidden"
                  />
                  {checked && (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <span className="text-base">{opt.label}</span>
                </span>
              );
            })}
          </div>
        </div>
        <div className="mb-6">
          <Label>Additional Comments</Label>
          <TextArea value={data.additionalComments} disabled />
        </div>
        <div className="mb-6">
          <Label>Midline</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {[
              "Adjust as Needed",
              "Correct through IPR",
              "Move to Left",
              "Move to Right",
              "None",
            ].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 ${data.midline === opt ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.midline === opt}
                  disabled
                  className={`accent-blue-500 ${data.midline === opt ? "ring-2 ring-blue-400" : ""}`}
                />
                <span className={data.midline === opt ? "text-blue-700" : ""}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <Label>Midline Comments</Label>
          <TextArea value={data.midlineComments} disabled />
        </div>
        <div className="mb-6">
          <Label>Arch Expansion</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {[
              "Move to Right",
              "Expand in Anterior",
              "Expand in Posterior",
              "No Expansion Required",
              "None",
            ].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-2 ${data.archExpansion === opt ? "font-bold text-blue-700" : "text-gray-500"}`}
              >
                <input
                  type="radio"
                  checked={data.archExpansion === opt}
                  disabled
                  className={`accent-blue-500 ${data.archExpansion === opt ? "ring-2 ring-blue-400" : ""}`}
                />
                <span
                  className={data.archExpansion === opt ? "text-blue-700" : ""}
                >
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <Label>Arch Expansion Comments</Label>
          <TextArea value={data.archExpansionComments} disabled />
        </div>
      </motion.div>
      <div className={divider} />
      {/* Section 4: Other */}
      <div className={glassCard + " " + fadeIn}>
        <div className={sectionHeader}>
          <SparklesIcon className="h-8 w-8 text-blue-400" /> Other
        </div>
        <div className="grid grid-cols-1 gap-6 text-lg md:grid-cols-2">
          <div>
            <Label>Privacy Accepted</Label>
            <div>
              {data.privacyAccepted ? (
                <span className="font-bold text-green-600">Yes</span>
              ) : (
                <span className="font-bold text-red-600">No</span>
              )}
            </div>
          </div>
          <div>
            <Label>Declaration Accepted</Label>
            <div>
              {data.declarationAccepted ? (
                <span className="font-bold text-green-600">Yes</span>
              ) : (
                <span className="font-bold text-red-600">No</span>
              )}
            </div>
          </div>
          <div>
            <Label>Case ID</Label>
            <div className="font-mono text-blue-900">{data.caseId}</div>
          </div>
          <div>
            <Label>Created Date</Label>
            <div className="font-mono text-gray-700">
              {data.createdAt
                ? new Date(data.createdAt).toLocaleDateString()
                : "-"}
            </div>
          </div>
          <div>
            <Label>Last Updated</Label>
            <div className="font-mono text-gray-700">
              {data.updatedAt
                ? new Date(data.updatedAt).toLocaleDateString()
                : "-"}
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <div
              className={`font-semibold ${
                data.status === "active"
                  ? "text-green-600"
                  : data.status === "inactive"
                    ? "text-red-600"
                    : "text-gray-600"
              }`}
            >
              {data.status || "Unknown"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFiles = () => {
    // Collect all files for download functionality
    const allFiles = [];
    Object.entries(scanFiles).forEach(([key, files]) => {
      if (Array.isArray(files) && files.length > 0) {
        files.forEach((file, index) => {
          if (file && file.fileUrl) {
            allFiles.push({
              ...file,
              category: key,
              categoryIndex: index,
              fileName: getFileNameFromUrl(file.fileUrl),
            });
          }
        });
      }
    });

    // Handle file selection
    const handleFileSelect = (fileId) => {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(fileId)) {
        newSelected.delete(fileId);
      } else {
        newSelected.add(fileId);
      }
      setSelectedFiles(newSelected);
    };

    // Handle select all
    const handleSelectAll = () => {
      if (selectedFiles.size === allFiles.length) {
        setSelectedFiles(new Set());
      } else {
        setSelectedFiles(new Set(allFiles.map((_, index) => index)));
      }
    };

    // Handle download single file - FILES TAB
    // Handle download single file using hook
    const handleDownloadFile = (fileUrl, fileName, fileIndex) => {
      return downloadFile(fileUrl, fileName, fileIndex);
    };

    // Handle download selected files using hook
    const handleDownloadSelected = async () => {
      if (selectedFiles.size === 0) return;

      try {
        const selectedFileList = Array.from(selectedFiles).map((index) => {
          const file = allFiles[index];
          const fileData = {
            ...file,
            id: index,
            fileUrl: file.fileUrl,
            fileName: file.fileName || getFileNameFromUrl(file.fileUrl),
          };

          return fileData;
        });

        if (!downloadMultipleFiles) {
          console.error("downloadMultipleFiles is not defined!");
          return;
        }

        const results = await downloadMultipleFiles(selectedFileList, 200);
      } catch (error) {
        console.error("Error in handleDownloadSelected:", error);
      }
    };

    // Handle download all files using hook
    const handleDownloadAll = async () => {
      try {
        const allFileList = allFiles.map((file, index) => {
          return {
            ...file,
            id: index,
            fileUrl: file.fileUrl,
            fileName: file.fileName || getFileNameFromUrl(file.fileUrl),
          };
        });

        if (!downloadMultipleFiles) {
          console.error("downloadMultipleFiles is not defined!");
          return;
        }

        const results = await downloadMultipleFiles(allFileList, 200);
      } catch (error) {
        console.error("Error in handleDownloadAll:", error);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, type: "spring" }}
        className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-100 p-3">
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Patient Files</h2>
        </div>

        {/* Download Controls */}
        {allFiles.length > 0 && (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 shadow-lg">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedFiles.size === allFiles.length}
                  onChange={handleSelectAll}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-blue-800">
                  Select All ({selectedFiles.size}/{allFiles.length})
                </span>
              </div>

              <button
                onClick={handleDownloadSelected}
                disabled={selectedFiles.size === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:hover:scale-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Selected ({selectedFiles.size})
              </button>

              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 focus:ring-4 focus:ring-blue-500/20"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download All Files
              </button>
            </div>
          </div>
        )}

        {/* Organized File Sections */}
        <div className="space-y-8">
          {/* Intraoral Photo Section - First 5 uploads (slots 0-4) */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <h3 className="mb-4 border-b border-blue-300 pb-2 text-xl font-semibold text-blue-800">
              📸 Intraoral Photo
            </h3>
            <p className="mb-4 text-sm text-blue-700">
              Patient's teeth and oral cavity images
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[...Array(5)].map((_, idx) => {
                const file = scanFiles[`img${idx + 1}`]?.[0];
                if (!file)
                  return (
                    <div key={idx} className="text-center">
                      <Label className="px-2 text-xs leading-tight break-words">
                        {imageLabels[idx]}
                      </Label>
                      <div className="flex h-36 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                        <div className="text-center">
                          <svg
                            className="mx-auto mb-2 h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-xs">No file</p>
                        </div>
                      </div>
                    </div>
                  );
                const fileUrl = file.fileUrl;
                let fileName = "";
                let fileExt = "";
                if (typeof fileUrl === "string") {
                  fileName = getFileNameFromUrl(fileUrl);
                  fileExt = fileName.split(".").pop()?.toLowerCase() || "";
                }
                return (
                  <div key={idx} className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(idx)}
                        onChange={() => handleFileSelect(idx)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label className="px-2 text-xs leading-tight break-words">
                        {imageLabels[idx]}
                      </Label>
                    </div>
                    {["jpg", "jpeg", "png"].includes(fileExt) ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={fileUrl || ""}
                          alt={fileName}
                          className="h-36 w-full rounded-2xl border-2 border-gray-200 object-contain shadow-lg"
                        />
                        <button
                          onClick={() =>
                            handleDownloadFile(fileUrl, fileName, idx)
                          }
                          disabled={isDownloading(idx)}
                          className="mt-2 text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Download image"
                        >
                          {isDownloading(idx) ? "Downloading..." : "Download"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-lg">
                        <svg
                          className="h-10 w-10 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="mt-2 text-xs break-words text-gray-500">
                          {fileName}
                        </p>
                        <button
                          onClick={() =>
                            handleDownloadFile(fileUrl, fileName, idx)
                          }
                          disabled={isDownloading(idx)}
                          className="mt-1 text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Download file"
                        >
                          {isDownloading(idx) ? "Downloading..." : "Download"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Facial Section - Next 3 uploads (slots 5-7) */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-6">
            <h3 className="mb-4 border-b border-green-300 pb-2 text-xl font-semibold text-green-800">
              👤 Facial
            </h3>
            <p className="mb-4 text-sm text-green-700">
              Patient's facial features and profile images
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, idx) => {
                const actualIdx = idx + 5;
                const file = scanFiles[`img${actualIdx + 1}`]?.[0];
                if (!file)
                  return (
                    <div key={actualIdx} className="text-center">
                      <Label className="px-2 text-xs leading-tight break-words">
                        {imageLabels[actualIdx]}
                      </Label>
                      <div className="flex h-36 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                        <div className="text-center">
                          <svg
                            className="mx-auto mb-2 h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-xs">No file</p>
                        </div>
                      </div>
                    </div>
                  );
                const fileUrl = file.fileUrl;
                let fileName = "";
                let fileExt = "";
                if (typeof fileUrl === "string") {
                  fileName = getFileNameFromUrl(fileUrl);
                  fileExt = fileName.split(".").pop()?.toLowerCase() || "";
                }
                return (
                  <div key={actualIdx} className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(actualIdx)}
                        onChange={() => handleFileSelect(actualIdx)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label>{imageLabels[actualIdx]}</Label>
                    </div>
                    {["jpg", "jpeg", "png"].includes(fileExt) ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={fileUrl || ""}
                          alt={fileName}
                          className="h-36 w-full rounded-2xl border-2 border-gray-200 object-contain shadow-lg"
                        />
                        <button
                          onClick={() =>
                            handleDownloadFile(fileUrl, fileName, actualIdx)
                          }
                          disabled={isDownloading(actualIdx)}
                          className="mt-2 text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Download image"
                        >
                          {isDownloading(actualIdx)
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-lg">
                        <svg
                          className="h-10 w-10 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="mt-2 text-xs text-gray-500">{fileName}</p>
                        <button
                          onClick={() =>
                            handleDownloadFile(fileUrl, fileName, actualIdx)
                          }
                          disabled={isDownloading(actualIdx)}
                          className="mt-1 text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Download file"
                        >
                          {isDownloading(actualIdx)
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-ray Section - Remaining 3 uploads (slots 8-10) */}
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
            <h3 className="mb-4 border-b border-purple-300 pb-2 text-xl font-semibold text-purple-800">
              🔬 X-ray
            </h3>
            <p className="mb-4 text-sm text-purple-700">
              Radiographic images for diagnostic purposes
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, idx) => {
                const actualIdx = idx + 8;
                const file = scanFiles[`img${actualIdx + 1}`]?.[0];
                if (!file)
                  return (
                    <div key={actualIdx} className="text-center">
                      <Label className="px-2 text-xs leading-tight break-words">
                        {imageLabels[actualIdx]}
                      </Label>
                      <div className="flex h-36 items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400">
                        <div className="text-center">
                          <svg
                            className="mx-auto mb-2 h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="text-xs">No file</p>
                        </div>
                      </div>
                    </div>
                  );
                const fileUrl = file.fileUrl;
                let fileName = "";
                let fileExt = "";
                if (typeof fileUrl === "string") {
                  fileName = getFileNameFromUrl(fileUrl);
                  fileExt = fileName.split(".").pop()?.toLowerCase() || "";
                }
                return (
                  <div key={actualIdx} className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(actualIdx)}
                        onChange={() => handleFileSelect(actualIdx)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Label>{imageLabels[actualIdx]}</Label>
                    </div>
                    {["jpg", "jpeg", "png"].includes(fileExt) ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={fileUrl || ""}
                          alt={fileName}
                          className="h-36 w-full rounded-2xl border-2 border-gray-200 object-contain shadow-lg"
                        />
                        <button
                          onClick={() =>
                            handleDownloadFile(fileUrl, fileName, actualIdx)
                          }
                          disabled={isDownloading(actualIdx)}
                          className="mt-2 text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Download image"
                        >
                          {isDownloading(actualIdx)
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-lg">
                        <svg
                          className="h-10 w-10 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="mt-2 text-xs text-gray-500">{fileName}</p>
                        <button
                          onClick={() =>
                            handleDownloadFile(fileUrl, fileName, actualIdx)
                          }
                          disabled={isDownloading(actualIdx)}
                          className="mt-1 text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Download file"
                        >
                          {isDownloading(actualIdx)
                            ? "Downloading..."
                            : "Download"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3D Models */}
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
          <h3 className="mb-4 border-b border-orange-300 pb-2 text-xl font-semibold text-orange-800">
            🎯 3D Models (PLY/STL)
          </h3>
          <p className="mb-4 text-sm text-orange-700">
            3D model files for treatment planning and visualization
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {[...Array(2)].map((_, idx) => {
              const file = scanFiles[`model${idx + 1}`]?.[0];
              if (!file)
                return (
                  <div key={idx} className="text-center">
                    <Label>{`Select PLY/STL File ${idx + 1}`}</Label>
                    <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                      No file
                    </div>
                  </div>
                );
              const fileUrl = file.fileUrl;
              let fileName = "";
              if (typeof fileUrl === "string") {
                fileName = getFileNameFromUrl(fileUrl);
              }
              return (
                <div key={idx} className="text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(idx + 11)} // Offset by 11 for model files
                      onChange={() => handleFileSelect(idx + 11)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label className="px-2 text-xs leading-tight break-words">{`Select PLY/STL File ${idx + 1}`}</Label>
                  </div>
                  <div className="flex h-32 w-full flex-col items-center justify-center rounded-xl border bg-white p-2 shadow">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="mb-2 h-10 w-10 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"
                      />
                    </svg>
                    <p className="mb-1 px-2 text-center text-xs font-medium break-words text-gray-700">
                      {fileName}
                    </p>
                    <button
                      onClick={() =>
                        handleDownloadFile(fileUrl, fileName, idx + 11)
                      }
                      disabled={isDownloading(idx + 11)}
                      className="text-xs text-blue-600 underline hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Download 3D model"
                    >
                      {isDownloading(idx + 11) ? "Downloading..." : "Download"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Summary */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h4 className="mb-3 text-lg font-semibold text-blue-800">
            File Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {
                  Object.values(scanFiles).filter(
                    (arr) => Array.isArray(arr) && arr.length > 0,
                  ).length
                }
              </div>
              <div className="text-blue-700">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {
                  Object.entries(scanFiles).filter(
                    ([key, arr]) =>
                      key.startsWith("img") &&
                      Array.isArray(arr) &&
                      arr.length > 0,
                  ).length
                }
              </div>
              <div className="text-green-700">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {
                  Object.entries(scanFiles).filter(
                    ([key, arr]) =>
                      key.startsWith("model") &&
                      Array.isArray(arr) &&
                      arr.length > 0,
                  ).length
                }
              </div>
              <div className="text-purple-700">3D Models</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {
                  Object.entries(scanFiles).filter(
                    ([key, arr]) => Array.isArray(arr) && arr.length === 0,
                  ).length
                }
              </div>
              <div className="text-orange-700">Empty Slots</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderScanFiles = () => {
    // Use patientFiles directly since they come from PatientFile model
    const allFiles = patientFiles.map((file, index) => ({
      ...file,
      // Ensure these properties are correctly mapped for downloads
      fileUrl: file.fileUrl,
      fileName: file.fileName,
      fileType: file.fileType,
      // Additional properties for display
      category: file.fileType || "Other",
      categoryIndex: index,
      uploadTime: file.uploadedAt || new Date().toISOString(),
    }));

    // Handle download single file using hook
    const handleDownloadFile = (fileUrl, fileName, fileIndex) => {
      // Test if the URL is accessible
      if (fileUrl) {
        fetch(fileUrl, { method: "HEAD" })
          .then((response) => {})
          .catch((error) => {
            console.error(`URL test failed for ${fileName}:`, error);
          });
      }

      return downloadFile(fileUrl, fileName, fileIndex);
    };

    // Sort files by upload time in descending order (newest first)
    allFiles.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

    // Helper function to get category display name
    const getCategoryDisplayName = (category) => {
      // For PatientFile model, category is the fileType
      if (category === "image") return "Image";
      if (category === "video") return "Video";
      if (category === "pdf") return "PDF Document";
      if (category === "other") return "Other File";
      return category.charAt(0).toUpperCase() + category.slice(1); // Capitalize first letter
    };

    // Helper function to get file type icon
    const getFileTypeIcon = (fileType) => {
      if (fileType === "image") {
        return (
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      } else if (fileType === "video") {
        return (
          <svg
            className="h-8 w-8 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
      } else if (fileType === "pdf") {
        return (
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        );
      } else if (["doc", "docx", "txt"].includes(fileType)) {
        return (
          <svg
            className="h-8 w-8 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      } else {
        return (
          <svg
            className="h-8 w-8 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.7, type: "spring" }}
        className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-100 p-3">
            <svg
              className="h-6 w-6 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Scan Files</h2>
        </div>

        {/* Download Controls for Scan Files */}
        {allFiles.length > 0 && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={scanFilesSelected.size === allFiles.length}
                  onChange={() => {
                    if (scanFilesSelected.size === allFiles.length) {
                      setScanFilesSelected(new Set());
                    } else {
                      setScanFilesSelected(
                        new Set(allFiles.map((_, index) => index)),
                      );
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-blue-800">
                  Select All ({scanFilesSelected.size}/{allFiles.length})
                </span>
              </div>

              <button
                onClick={async () => {
                  try {
                    if (scanFilesSelected.size === 0) return;

                    const selectedFileList = Array.from(scanFilesSelected)
                      .map((index) => {
                        const file = allFiles[index];

                        if (!file.fileUrl) {
                          console.error(`File ${index} has no fileUrl:`, file);
                          return null;
                        }

                        const fileData = {
                          ...file,
                          id: index,
                          fileUrl: file.fileUrl,
                          fileName:
                            file.fileName || getFileNameFromUrl(file.fileUrl),
                        };

                        return fileData;
                      })
                      .filter(Boolean); // Remove any null entries

                    if (selectedFileList.length === 0) {
                      alert("No valid files selected for download.");
                      return;
                    }

                    if (!downloadMultipleFiles) {
                      console.error("downloadMultipleFiles is not defined!");
                      return;
                    }

                    const results = await downloadMultipleFiles(
                      selectedFileList,
                      200,
                    );
                  } catch (error) {
                    console.error(
                      "Error in Scan Files download selected:",
                      error,
                    );
                  }
                }}
                disabled={scanFilesSelected.size === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download Selected ({scanFilesSelected.size})
              </button>

              <button
                onClick={async () => {
                  try {
                    const allFileList = allFiles
                      .map((file, index) => {
                        if (!file.fileUrl) {
                          console.error(`File ${index} has no fileUrl:`, file);
                          return null;
                        }

                        return {
                          ...file,
                          id: index,
                          fileUrl: file.fileUrl,
                          fileName:
                            file.fileName || getFileNameFromUrl(file.fileUrl),
                        };
                      })
                      .filter(Boolean); // Remove any null entries

                    if (allFileList.length === 0) {
                      alert("No valid files found for download.");
                      return;
                    }

                    if (!downloadMultipleFiles) {
                      console.error("downloadMultipleFiles is not defined!");
                      return;
                    }

                    const results = await downloadMultipleFiles(
                      allFileList,
                      200,
                    );
                  } catch (error) {
                    console.error("Error in Scan Files download all:", error);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download All Files
              </button>
            </div>
          </div>
        )}

        {allFiles.length === 0 ? (
          <div className="py-12 text-center">
            <DocumentArrowDownIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-500">
              No Scan Files Available
            </h3>
            <p className="text-gray-400">
              This patient doesn't have any scan files uploaded yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allFiles.map((file, index) => {
              const fileName =
                file.fileName || getFileNameFromUrl(file.fileUrl);
              const isImage = file.fileType === "image";
              const isPdf = file.fileType === "pdf";
              const isDocument = ["doc", "docx", "txt"].includes(file.fileType);
              const canPreview = isImage || isPdf || isDocument;

              return (
                <motion.div
                  key={`${file.category}-${file.categoryIndex}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:border-blue-300 hover:shadow-xl"
                >
                  {/* File Selection Checkbox */}
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={scanFilesSelected.has(index)}
                      onChange={() => {
                        const newSelected = new Set(scanFilesSelected);
                        if (newSelected.has(index)) {
                          newSelected.delete(index);
                        } else {
                          newSelected.add(index);
                        }
                        setScanFilesSelected(newSelected);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-500">
                      Select this file
                    </span>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {isImage ? (
                        <img
                          src={file.fileUrl}
                          alt={fileName}
                          className="h-20 w-20 rounded-lg border object-cover shadow-sm"
                        />
                      ) : isPdf ? (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-red-50">
                          <svg
                            className="h-12 w-12 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      ) : isDocument ? (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-blue-50">
                          <svg
                            className="h-12 w-12 text-blue-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg border bg-gray-50">
                          {getFileTypeIcon(file.fileType)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="text-lg font-semibold break-words text-gray-900">
                            {fileName}
                          </h4>
                          <p className="text-sm font-medium text-blue-600">
                            {getCategoryDisplayName(file.category)}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>
                            {new Date(file.uploadTime).toLocaleDateString()}
                          </div>
                          <div>
                            {new Date(file.uploadTime).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (!file.fileUrl) {
                              console.error("No fileUrl found for file:", file);
                              alert(
                                "File URL not found. Cannot download this file.",
                              );
                              return;
                            }
                            if (!fileName) {
                              console.error(
                                "No fileName found for file:",
                                file,
                              );
                              alert(
                                "File name not found. Cannot download this file.",
                              );
                              return;
                            }
                            handleDownloadFile(file.fileUrl, fileName, index);
                          }}
                          disabled={isDownloading(index)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {isDownloading(index) ? "Downloading..." : "Download"}
                        </button>

                        {canPreview && (
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            Preview
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Scan Files Summary */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h4 className="mb-3 text-lg font-semibold text-blue-800">
            Scan Files Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {allFiles.length}
              </div>
              <div className="text-blue-700">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allFiles.filter((f) => f.fileType === "image").length}
              </div>
              <div className="text-green-700">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {allFiles.filter((f) => f.fileType === "video").length}
              </div>
              <div className="text-purple-600">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {allFiles.filter((f) => f.fileType === "pdf").length}
              </div>
              <div className="text-orange-700">PDFs</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderComments = () => (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.7, type: "spring" }}
      className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-pink-100 p-3">
          <svg
            className="h-6 w-6 text-pink-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Patient Comments</h2>
      </div>

      {comments.length === 0 ? (
        <div className="py-12 text-center">
          <ChatBubbleLeftRightIcon className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-500">
            No Comments Yet
          </h3>
          <p className="text-gray-400">
            This patient doesn't have any comments yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment, index) => (
            <div
              key={comment._id || index}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">
                      {comment.commentedBy?.name?.charAt(0)?.toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {comment.commentedBy?.name || "Unknown User"}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {comment.commentedBy?.userType || "User"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    {comment.datetime
                      ? new Date(comment.datetime).toLocaleDateString()
                      : "Unknown Date"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {comment.datetime
                      ? new Date(comment.datetime).toLocaleTimeString()
                      : ""}
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div
                  className="prose prose-sm max-w-none leading-relaxed text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: (comment.comment || "").replace(
                      /<a /g,
                      '<a target="_blank" rel="noopener noreferrer" ',
                    ),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment Summary */}
      <div className="mt-8 rounded-2xl border border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50 p-6 shadow-lg">
        <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-pink-800">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Comment Summary
        </h4>
        <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-white/60 p-4 text-center backdrop-blur-sm">
            <div className="mb-1 text-3xl font-bold text-blue-600">
              {comments.length}
            </div>
            <div className="font-medium text-blue-700">Total Comments</div>
          </div>
          <div className="rounded-xl bg-white/60 p-4 text-center backdrop-blur-sm">
            <div className="mb-1 text-3xl font-bold text-green-600">
              {
                comments.filter((c) => c.commentedBy?.userType === "User")
                  .length
              }
            </div>
            <div className="font-medium text-green-700">From Doctors</div>
          </div>
          <div className="rounded-xl bg-white/60 p-4 text-center backdrop-blur-sm">
            <div className="mb-1 text-3xl font-bold text-purple-600">
              {
                comments.filter(
                  (c) => c.commentedBy?.userType === "Distributer",
                ).length
              }
            </div>
            <div className="font-medium text-purple-700">From Distributers</div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with Case ID */}
      {data?.caseId && (
        <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex justify-end">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 px-6 py-3 text-white shadow-lg">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="font-bold tracking-wide">
                  Case ID: {data.caseId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: "spring" }}
        >
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-2xl">
              <UserIcon className="h-12 w-12 text-white" />
            </div>
            <h1 className="mb-4 bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
              {data.patientName}
            </h1>
            <p className="mb-6 text-xl text-gray-600">
              Patient Details & Case Information
            </p>
          </div>
        </motion.div>

        {/* Enhanced Tab Navigation */}
        <div className="mb-12">
          <div className="flex flex-wrap justify-center gap-3 rounded-3xl border border-white/20 bg-white/90 p-3 shadow-2xl backdrop-blur-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-3 rounded-2xl px-8 py-4 font-bold transition-all duration-500 ${
                  activeTab === tab.id
                    ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                    : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
                }`}
              >
                <div
                  className={`rounded-xl p-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white/20"
                      : "bg-blue-100 group-hover:bg-blue-200"
                  }`}
                >
                  {tab.icon}
                </div>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === "general" && renderGeneralInformation()}
          {activeTab === "files" && renderFiles()}
          {activeTab === "scanFiles" && renderScanFiles()}
          {activeTab === "comments" && renderComments()}
        </div>
      </div>

      {/* Sticky footer with Back and Edit buttons */}
      {/* <div className="sticky bottom-0 z-20 mx-auto mt-8 flex w-full max-w-6xl flex-col items-center justify-end gap-4 border-t border-blue-100 bg-white px-2 py-8 sm:flex-row">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg bg-blue-50 px-6 py-3 font-semibold text-blue-700 shadow transition hover:bg-blue-100"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() =>
            router.push(`/doctor/patients/edit-patient-details?id=${data._id}`)
          }
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700"
        >
          Edit
        </button>
      </div> */}
    </div>
  );
}

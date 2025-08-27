"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";

import TeethSelector from "@/components/all/TeethSelector";
import { imageLabels } from "@/constants/data";
import {
  DocumentTextIcon,
  FolderIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";

// File Display Component
const FileDisplayComponent = ({ idx, patientData }) => {
  const getFileData = (idx) => {
    if (!patientData.dentalExaminationFiles) {
      return null;
    }

    const fileKeys = {
      0: "img1",
      1: "img2",
      2: "img3",
      3: "img4",
      4: "img5",
      5: "img6",
      6: "img7",
      7: "img8",
      8: "img9",
      9: "img10",
      10: "img11",
      11: "model1",
      12: "model2",
    };

    const key = fileKeys[idx];
    if (!key || !patientData.dentalExaminationFiles[key]) {
      return null;
    }

    const files = patientData.dentalExaminationFiles[key];
    return files && files.length > 0 ? files[0] : null;
  };

  const fileData = getFileData(idx);
  const isModelSlot = idx >= 11;
  const fileUrl = fileData?.fileUrl;

  if (!fileData) {
    return (
      <div className="group text-center">
        <label className="mb-3 block text-sm font-semibold text-gray-700">
          {idx < 11
            ? imageLabels[idx]
            : idx === 11
              ? "Select PLY/STL File 1"
              : "Select PLY/STL File 2"}
        </label>
        <div className="mt-2 flex h-36 w-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-500">No file uploaded</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group text-center">
      <label className="mb-3 block text-sm font-semibold text-gray-700">
        {idx < 11
          ? imageLabels[idx]
          : idx === 11
            ? "Select PLY/STL File 1"
            : "Select PLY/STL File 2"}
      </label>

      <div className="group relative mx-auto mt-2 max-w-xs">
        <div className="flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
          {!isModelSlot ? (
            <div className="relative h-full w-full">
              <img
                src={fileUrl}
                alt={`Image ${idx + 1}`}
                className="h-36 w-full rounded-xl object-contain"
              />
              {/* Download button for images */}
              <button
                onClick={() => {
                  if (fileUrl) {
                    // Open file in new tab
                    window.open(fileUrl, "_blank", "noopener,noreferrer");
                  } else {
                    toast.error("Missing file URL");
                  }
                }}
                className="absolute right-2 bottom-2 rounded-lg bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-lg transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                title="Download image"
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
              </button>
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-3">
              {/* 3D Model Icon */}
              <div className="mb-3 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
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
              </div>
              <p className="mb-2 text-center text-sm font-semibold break-all text-gray-700">
                3D Model {idx + 1}
              </p>
              <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                PLY/STL
              </div>
              <button
                onClick={() => {
                  if (fileUrl) {
                    // Open file in new tab
                    window.open(fileUrl, "_blank", "noopener,noreferrer");
                  } else {
                    toast.error("Missing file URL");
                  }
                }}
                className="mt-2 text-xs font-medium text-blue-600 underline transition-colors hover:text-blue-700"
                title="Open 3D model in new tab"
              >
                🔗
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ViewPatientDetails() {
  const [patientData, setPatientData] = useState(null);
  const [activeTab, setActiveTab] = useState("general");
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.ui);
  const { token } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [patientFiles, setPatientFiles] = useState([]);

  // Load patient data when component mounts
  useEffect(() => {
    const loadPatientData = async () => {
      const patientId = searchParams.get("id");
      if (patientId) {
        dispatch(setLoading(true));
        try {
          const response = await fetch(
            `/api/patients/update-details?id=${encodeURIComponent(patientId).trim()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          if (response.ok) {
            const data = await response.json();
            setPatientData(data);
          } else {
            const errorData = await response.json();
            const errorMessage = extractErrorMessage(errorData);
          }
        } catch (error) {
          toast.error("❌ Failed to load patient data");
        } finally {
          dispatch(setLoading(false));
        }
      }
    };
    loadPatientData();
  }, [searchParams, dispatch]);

  // Fetch comments when comments tab is active
  useEffect(() => {
    if (patientData?.caseId && activeTab === "comments") {
      fetchComments();
    }
  }, [patientData?.caseId, activeTab]);

  // Fetch patient files when scan files tab is active
  useEffect(() => {
    if (patientData?.caseId && activeTab === "scanFiles") {
      fetchPatientFiles();
    }
  }, [patientData?.caseId, activeTab]);

  // Helper function to extract error messages from API responses
  const extractErrorMessage = (errorData) => {
    if (typeof errorData === "string") return errorData;
    if (errorData?.message) return errorData.message;
    if (errorData?.error) return errorData.error;
    return "An unknown error occurred";
  };

  const fetchPatientFiles = async () => {
    try {
      const patientId = searchParams.get("id");
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
      const patientId = searchParams.get("id");
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
      } else {
        setComments([]);
      }
    } catch (e) {
      const errorMsg = e.message || "Error fetching comments";
      toast.error(errorMsg);
      setComments([]);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="mb-4 text-6xl text-red-500">⚠️</div>
          <p className="text-lg text-gray-600">No patient data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header with Case ID */}
      {patientData.caseId && (
        <div className="sticky top-20 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">
                {patientData.patientName}
              </h1>
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
                  Case ID: {patientData.caseId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Tab Navigation */}
      <div className="sticky top-41 z-10 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-nowrap justify-center gap-6 overflow-x-auto rounded-3xl border border-white/20 bg-white/90 p-3 shadow-2xl backdrop-blur-xl">
            <button
              onClick={() => {
                setActiveTab("general");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all duration-500 ${
                activeTab === "general"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "general"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
                <DocumentTextIcon className="h-5 w-5" />
              </div>
              <span className="text-sm">General Information</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("clinical");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all duration-500 ${
                activeTab === "clinical"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "clinical"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
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
                    d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                  />
                </svg>
              </div>
              <span className="text-sm">Clinical Information</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("files");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all duration-500 ${
                activeTab === "files"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "files"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
                <FolderIcon className="h-5 w-5" />
              </div>
              <span className="text-sm">Files</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("scanFiles");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all duration-500 ${
                activeTab === "scanFiles"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "scanFiles"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
              </div>
              <span className="text-sm">Scan Files</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("comments");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group flex items-center gap-2 rounded-2xl px-6 py-3 font-bold transition-all duration-500 ${
                activeTab === "comments"
                  ? "scale-105 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30"
                  : "text-gray-600 hover:scale-105 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              <div
                className={`rounded-xl p-2 transition-all duration-300 ${
                  activeTab === "comments"
                    ? "bg-white/20"
                    : "bg-blue-100 group-hover:bg-blue-200"
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </div>
              <span className="text-sm">Comments</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === "general" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h1 className="bg-gradient-to-r from-gray-800 via-blue-800 to-indigo-800 bg-clip-text text-4xl font-bold text-transparent">
                  General Information
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Patient's basic details and personal information
                </p>
              </div>

              <div className="space-y-8">
                {/* Patient Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-100 p-3">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Patient Information
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        Patient Name
                      </label>
                      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                        {patientData.patientName || "Not specified"}
                      </div>
                    </div>
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        Age
                      </label>
                      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                        {patientData.age || "Not specified"}
                      </div>
                    </div>
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        Gender
                      </label>
                      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                        {patientData.gender || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-green-100 p-3">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Location Information
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        Country
                      </label>
                      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                        {patientData.country || "Not specified"}
                      </div>
                    </div>
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        State/Province
                      </label>
                      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                        {patientData.state || "Not specified"}
                      </div>
                    </div>
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        City
                      </label>
                      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-gray-900">
                        {patientData.city || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
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
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Address Information
                    </h2>
                  </div>
                  <div className="space-y-6">
                    {/* Shipping Address */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shipping Address Type
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.shippingAddressType || "Not specified"}
                      </div>
                    </div>

                    {patientData.shippingAddressType === "Primary Address" ? (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Primary Address
                        </label>
                        <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.primaryAddress || "Not specified"}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          New Shipping Address
                        </label>
                        <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.shippingAddress || "Not specified"}
                        </div>
                      </div>
                    )}

                    {/* Billing Address */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Billing Address
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.billingAddress || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical History Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Medical History
                  </h2>
                  <div className="space-y-4">
                    <div className="group">
                      <label className="mb-3 block text-sm font-semibold text-gray-700">
                        Chief Complaint
                      </label>
                      <div className="min-h-[80px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.chiefComplaint ||
                          patientData.chiefComplaint ||
                          "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Past Medical History
                      </label>
                      <div className="min-h-[80px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.pastMedicalHistory ||
                          patientData.pastMedicalHistory ||
                          "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Past Dental History
                      </label>
                      <div className="min-h-[80px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.pastDentalHistory ||
                          patientData.pastDentalHistory ||
                          "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nature of Availability Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Nature of Availability
                  </h2>
                  <div className="space-y-3">
                    <div className="rounded-md bg-gray-50 p-3">
                      <span className="text-sm font-medium text-gray-700">
                        {patientData.dentalExamination?.natureOfAvailability ===
                        "local"
                          ? "Local – Available for regular follow-ups"
                          : patientData.dentalExamination
                                ?.natureOfAvailability === "traveling"
                            ? "Traveling – Available every " +
                              (patientData.dentalExamination?.followUpMonths ||
                                "___") +
                              " months for follow-up"
                            : "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Any Existing Oral Habits Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Any Existing Oral Habits
                  </h2>
                  <div className="space-y-3">
                    <div className="rounded-md bg-gray-50 p-3">
                      <span className="text-sm font-medium text-gray-700">
                        {patientData.dentalExamination?.oralHabits ===
                          "thumbSucking" && "Thumb Sucking"}
                        {patientData.dentalExamination?.oralHabits ===
                          "mouthBreathing" && "Mouth Breathing"}
                        {patientData.dentalExamination?.oralHabits ===
                          "lipSucking" && "Lip Sucking"}
                        {patientData.dentalExamination?.oralHabits ===
                          "bruxism" && "Bruxism"}
                        {patientData.dentalExamination?.oralHabits ===
                          "anyOtherHabit" &&
                          `Any Other: ${patientData.dentalExamination?.otherHabitSpecification || "Not specified"}`}
                        {patientData.dentalExamination?.oralHabits ===
                          "noHabit" && "No Habit"}
                        {!patientData.dentalExamination?.oralHabits &&
                          "Not specified"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Family History Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Family History
                  </h2>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Family History of any dental or skeletal malocclusions,
                      Cleft Lip/Palate Etc
                    </label>
                    <div className="min-h-[80px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                      {patientData.dentalExamination?.familyHistory ||
                        patientData.familyHistory ||
                        "Not specified"}
                    </div>
                  </div>
                </div>

                {/* Case Information Section */}
                <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-orange-100 p-3">
                      <svg
                        className="h-6 w-6 text-orange-600"
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
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      Case Information
                    </h2>
                  </div>
                  <div className="space-y-6">
                    {/* Case Type */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Case Type
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.caseType === "Single Arch"
                          ? patientData.singleArchType || "Not specified"
                          : patientData.caseType || "Not specified"}
                      </div>
                    </div>

                    {/* Case Category */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Case Category
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.caseCategory || "Not specified"}
                      </div>
                    </div>

                    {/* Package Selection */}
                    {patientData.selectedPrice && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Package
                        </label>
                        <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.selectedPrice}
                        </div>
                      </div>
                    )}

                    {/* Case Category Details */}
                    {patientData.caseCategoryDetails && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Case Category Comments
                        </label>
                        <div className="min-h-[80px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.caseCategoryDetails}
                        </div>
                      </div>
                    )}

                    {/* Treatment Plan */}
                    {patientData.treatmentPlan && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Treatment Plan
                        </label>
                        <div className="min-h-[80px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.treatmentPlan}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "clinical" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"
                    />
                  </svg>
                </div>
                <h1 className="bg-gradient-to-r from-gray-800 via-green-800 to-emerald-800 bg-clip-text text-4xl font-bold text-transparent">
                  Clinical Information
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Patient's dental examination and treatment details
                </p>
              </div>

              <div className="space-y-8">
                {/* Facial Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Facial
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Convex
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.facialConvex ||
                          "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Concave
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.facialConcave ||
                          "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Straight
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.facialStraight ||
                          "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lip Posture & Tonicity Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Lip Posture & Tonicity
                  </h2>
                  <div>
                    <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                      {patientData.dentalExamination?.lipPostureTonicity ||
                        "Not specified"}
                    </div>
                  </div>
                </div>

                {/* Lip Competence Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Lip Competence
                  </h2>
                  <div>
                    <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                      {patientData.dentalExamination?.lipCompetence ||
                        "Not specified"}
                    </div>
                  </div>
                </div>

                {/* TMJ Examination Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    TMJ Examination
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Max Opening
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.maxOpening ||
                          "Not specified"}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Any Other Comments
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.tmjComments ||
                          "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Soft Tissue Examination Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-semibold text-gray-700">
                    Soft Tissue Examination
                  </h2>
                  <div className="space-y-4">
                    {/* Gum Section */}
                    <div>
                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Gum
                          </label>
                          <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                            {patientData.dentalExamination?.gum ||
                              "Not specified"}
                          </div>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Frenal Attachment
                          </label>
                          <div className="space-y-3">
                            <div className="rounded-md bg-gray-50 p-3">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination
                                  ?.frenalAttachmentLocation &&
                                patientData.dentalExamination
                                  ?.frenalAttachmentType
                                  ? `${patientData.dentalExamination.frenalAttachmentLocation.charAt(0).toUpperCase() + patientData.dentalExamination.frenalAttachmentLocation.slice(1)} Frenal Attachment: ${patientData.dentalExamination.frenalAttachmentType}`
                                  : "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tongue Section */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Tongue
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.tongue ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* Oral Mucosa Section */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Oral Mucosa
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.oralMucosa ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* Gingival Recession Section */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Gingival Recession:
                      </label>
                      <div className="mb-4 rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination
                              ?.gingivalRecessionTeeth || []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Gingival Recession Comments:
                        </label>
                        <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.dentalExamination
                            ?.gingivalRecessionComments || "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Hard Tissue Examination Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Detailed Hard Tissue Examination
                  </h2>
                  <p className="mb-6 text-sm text-gray-500 italic">
                    Selected teeth for each condition:
                  </p>

                  <div className="space-y-8">
                    {/* Caries Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Caries (Select tooth)
                      </h3>
                      <div className="rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination?.cariesTeeth || []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>
                    </div>

                    {/* Missing Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Missing Tooth (Select tooth)
                      </h3>
                      <div className="rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination?.missingToothTeeth ||
                            []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>
                    </div>

                    {/* Impacted Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Impacted Tooth (Select tooth)
                      </h3>
                      <div className="rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination?.impactedToothTeeth ||
                            []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>
                    </div>

                    {/* Supernumerary Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Supernumerary Tooth
                      </h3>
                      <div className="space-y-4">
                        <div className="rounded-md bg-white p-3">
                          <span className="text-sm font-medium text-gray-700">
                            {patientData.dentalExamination
                              ?.hasSupernumeraryTooth
                              ? "Yes"
                              : patientData.dentalExamination
                                    ?.hasSupernumeraryTooth === false
                                ? "No"
                                : "Not specified"}
                          </span>
                        </div>

                        {patientData.dentalExamination
                          ?.hasSupernumeraryTooth && (
                          <>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Description of supernumerary teeth:
                              </label>
                              <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                                {patientData.dentalExamination
                                  ?.supernumeraryToothDescription ||
                                  "Not specified"}
                              </div>
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Select affected teeth:
                              </label>
                              <div className="rounded-md bg-white p-3">
                                <TeethSelector
                                  selectedTeeth={
                                    patientData.dentalExamination
                                      ?.supernumeraryToothTeeth || []
                                  }
                                  onTeethSelect={() => {}} // Read-only mode
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Endodontically Treated Tooth Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Endodontically Treated Tooth (Select tooth)
                      </h3>
                      <div className="rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination
                              ?.endodonticallyTreatedToothTeeth || []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>
                    </div>

                    {/* Occlusal Wear Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Occlusal Wear (Select tooth)
                      </h3>
                      <div className="rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination?.occlusalWearTeeth ||
                            []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>
                    </div>

                    {/* Prosthesis Section */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      <h3 className="mb-4 text-lg font-medium text-gray-700">
                        Prosthesis (Crown, Bridge, Implant - Select tooth)
                      </h3>
                      <div className="rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination?.prosthesisTeeth || []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>

                      {/* Prosthesis Comments */}
                      <div className="mt-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Comment (In case of ceramic crown or implant, please
                          specify):
                        </label>
                        <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.dentalExamination?.prosthesisComments ||
                            "Not specified"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maxillary Arc Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Maxillary Arc
                  </h2>
                  <div className="space-y-6">
                    {/* Shape */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shape:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.maxillaryArcShape ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* Arch Symmetry */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Symmetry:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.maxillaryArcSymmetry ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* Arch Alignment */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Alignment:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.maxillaryArcAlignment ||
                          "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mandibular Arch Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Mandibular Arch
                  </h2>
                  <div className="space-y-6">
                    {/* Shape */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shape:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.mandibularArcShape &&
                        Array.isArray(
                          patientData.dentalExamination.mandibularArcShape,
                        ) &&
                        patientData.dentalExamination.mandibularArcShape
                          .length > 0
                          ? patientData.dentalExamination.mandibularArcShape.join(
                              ", ",
                            )
                          : patientData.dentalExamination?.mandibularArcShape ||
                            "Not specified"}
                      </div>
                    </div>

                    {/* Arch Symmetry */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Symmetry:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.mandibularArcSymmetry ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* Arch Alignment */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Arch Alignment:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination
                          ?.mandibularArcAlignment || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Midline Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Midline
                  </h2>
                  <div className="space-y-6">
                    {/* Coincide with Facial Midline */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Coincide with Facial Midline:
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.midlineCoincide
                          ? patientData.dentalExamination.midlineCoincide
                              .charAt(0)
                              .toUpperCase() +
                            patientData.dentalExamination.midlineCoincide.slice(
                              1,
                            )
                          : "Not specified"}
                      </div>
                    </div>

                    {/* Shifted to Left */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shifted to Left:
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.midlineShiftedLeft
                          ? patientData.dentalExamination.midlineShiftedLeft
                              .charAt(0)
                              .toUpperCase() +
                            patientData.dentalExamination.midlineShiftedLeft.slice(
                              1,
                            )
                          : "Not specified"}
                      </div>
                    </div>

                    {/* Shifted to Right */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Shifted to Right:
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.midlineShiftedRight
                          ? patientData.dentalExamination.midlineShiftedRight
                              .charAt(0)
                              .toUpperCase() +
                            patientData.dentalExamination.midlineShiftedRight.slice(
                              1,
                            )
                          : "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Anterio Posterior Relationship Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Anterio Posterior Relationship
                  </h2>
                  <div className="space-y-6">
                    {/* Molar Relation */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Molar Relation:
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.molarRelation
                          ? `Class ${patientData.dentalExamination.molarRelation.replace("class", "")}`
                          : "Not specified"}
                      </div>

                      {/* Molar Relation Comments */}
                      {patientData.dentalExamination?.molarRelationComments && (
                        <div className="mt-3">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Molar Relation Comments:
                          </label>
                          <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                            {
                              patientData.dentalExamination
                                .molarRelationComments
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Canine Relation */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Canine Relation:
                      </label>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.canineRelation
                          ? `Class ${patientData.dentalExamination.canineRelation.replace("class", "")}`
                          : "Not specified"}
                      </div>

                      {/* Canine Relation Comments */}
                      {patientData.dentalExamination
                        ?.canineRelationComments && (
                        <div className="mt-3">
                          <label className="mb-2 block text-sm font-medium text-gray-700">
                            Canine Relation Comments:
                          </label>
                          <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                            {
                              patientData.dentalExamination
                                .canineRelationComments
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Overjet */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Overjet:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.overjet ||
                          "Not specified"}
                      </div>
                    </div>

                    {/* Overbite */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Overbite:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.overbite ||
                          "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transverse Relationship Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Transverse Relationship
                  </h2>
                  <p className="mb-4 text-sm text-gray-500 italic">
                    Selected teeth with Scissor Bite/Cross Bite:
                  </p>

                  <div className="space-y-6">
                    {/* Teeth Selection Chart */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Select Teeth with Transverse Issues:
                      </label>
                      <div className="rounded-md bg-white p-3">
                        <TeethSelector
                          selectedTeeth={
                            patientData.dentalExamination
                              ?.transverseRelationshipTeeth || []
                          }
                          onTeethSelect={() => {}} // Read-only mode
                        />
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Transverse Relationship Comments:
                      </label>
                      <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination
                          ?.transverseRelationshipComments || "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Treatment Plan for Patient Concern Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Treatment Plan
                  </h2>

                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Patient Concern:
                  </label>

                  <div className="space-y-6">
                    {/* Treatment Plan Checkboxes */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {[
                        { key: "treatmentPlanProtrusion", label: "Protrusion" },
                        { key: "treatmentPlanCrowding", label: "Crowding" },
                        { key: "treatmentPlanSpacing", label: "Spacing" },
                        { key: "treatmentPlanOpenBite", label: "Open Bite" },
                        { key: "treatmentPlanOverBite", label: "Over Bite" },
                        { key: "treatmentPlanOverJet", label: "Over Jet" },
                        {
                          key: "treatmentPlanMidlineShift",
                          label: "Midline Shift",
                        },
                        { key: "treatmentPlanUnderbite", label: "Underbite" },
                        {
                          key: "treatmentPlanAsymmetricJaw",
                          label: "Asymmetric Jaw",
                        },
                        {
                          key: "treatmentPlanGummySmile",
                          label: "Gummy Smile",
                        },
                        { key: "treatmentPlanCrossbite", label: "Crossbite" },
                        {
                          key: "treatmentPlanNarrowArch",
                          label: "Narrow Arch",
                        },
                        { key: "treatmentPlanClassI", label: "Class I" },
                        {
                          key: "treatmentPlanClassIIDiv1",
                          label: "Class II Div 1",
                        },
                        {
                          key: "treatmentPlanClassIIDiv2",
                          label: "Class II Div 2",
                        },
                        { key: "treatmentPlanClassIII", label: "Class III" },
                      ].map((item) => (
                        <div
                          key={item.key}
                          className={`rounded-lg border-2 p-3 text-center transition-all duration-200 ${
                            patientData.dentalExamination?.[item.key]
                              ? "border-blue-500 bg-blue-100 text-blue-700"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}
                        >
                          <span className="text-sm font-medium">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Comments */}
                    {patientData.dentalExamination?.treatmentPlanComments && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Treatment Plan Comments:
                        </label>
                        <div className="min-h-[80px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                          {patientData.dentalExamination.treatmentPlanComments}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* How to Gain Space Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-2xl font-semibold text-gray-700">
                    How to Gain Space
                  </h2>
                  <div className="space-y-8">
                    {/* IPR */}
                    <div className="flex flex-wrap justify-between space-y-6 pr-20">
                      {/* IPR Type Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          IPR/Interproximal Reduction
                        </h3>
                        <div className="rounded-md bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {patientData.dentalExamination?.iprType ||
                              "Not specified"}
                          </span>
                        </div>
                      </div>

                      {/* Measure of IPR Section */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Measure of IPR (preference)
                        </h3>
                        <div className="rounded-md bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {patientData.dentalExamination?.iprMeasure ||
                              "Not specified"}
                          </span>
                        </div>
                      </div>

                      {/* Expansion */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Expansion
                        </h3>
                        <div className="rounded-md bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {patientData.dentalExamination?.expansionType ||
                              "Not specified"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interproximal Reduction Details */}
                    {patientData.dentalExamination?.interproximalReduction && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Interproximal Reduction Details
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Detail 1:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination
                                  ?.interproximalReduction?.detail1 ||
                                  "Not specified"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Detail 2:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination
                                  ?.interproximalReduction?.detail2 ||
                                  "Not specified"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Detail 3:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination
                                  ?.interproximalReduction?.detail3 ||
                                  "Not specified"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Detail 4:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination
                                  ?.interproximalReduction?.detail4 ||
                                  "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Measure of IPR Details */}
                    {patientData.dentalExamination?.measureOfIPR && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Measure of IPR Details
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Detail A:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination?.measureOfIPR
                                  ?.detailA || "Not specified"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Detail B:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination?.measureOfIPR
                                  ?.detailB || "Not specified"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Detail C:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination?.measureOfIPR
                                  ?.detailC || "Not specified"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Extraction */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-lg font-medium text-gray-700">
                          Extraction:
                        </label>
                        <div className="rounded-md bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {patientData.dentalExamination?.gainSpaceExtraction
                              ? patientData.dentalExamination.gainSpaceExtraction
                                  .charAt(0)
                                  .toUpperCase() +
                                patientData.dentalExamination.gainSpaceExtraction.slice(
                                  1,
                                )
                              : "Not specified"}
                          </span>
                        </div>
                      </div>

                      {/* Extraction Type */}
                      {patientData.dentalExamination?.gainSpaceExtraction ===
                        "yes" && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">
                              Select Teeth for Extraction (Select tooth):
                            </label>
                            <div className="rounded-md bg-white p-3">
                              <TeethSelector
                                selectedTeeth={
                                  patientData.dentalExamination
                                    ?.gainSpaceExtractionTeeth || []
                                }
                                onTeethSelect={() => {}} // Read-only mode
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Extraction Details */}
                    {patientData.dentalExamination?.extraction && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-gray-700">
                          Extraction Details
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              Required:
                            </label>
                            <div className="rounded-md bg-gray-50 px-3 py-2">
                              <span className="text-sm font-medium text-gray-700">
                                {patientData.dentalExamination?.extraction
                                  ?.required
                                  ? "Yes"
                                  : "No"}
                              </span>
                            </div>
                          </div>
                          {patientData.dentalExamination?.extraction
                            ?.comments && (
                            <div>
                              <label className="mb-2 block text-sm font-medium text-gray-700">
                                Comments:
                              </label>
                              <div className="min-h-[60px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                                {
                                  patientData.dentalExamination.extraction
                                    .comments
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Distalization */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-lg font-medium text-gray-700">
                          Distalization:
                        </label>
                        <div className="rounded-md bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {patientData.dentalExamination
                              ?.gainSpaceDistalization
                              ? patientData.dentalExamination.gainSpaceDistalization
                                  .charAt(0)
                                  .toUpperCase() +
                                patientData.dentalExamination.gainSpaceDistalization.slice(
                                  1,
                                )
                              : "Not specified"}
                          </span>
                        </div>
                      </div>

                      {/* {patientData.dentalExamination?.gainSpaceDistalization ===
                        "yes" && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Select Teeth for Distalization (Select tooth):
                          </label>
                          <div className="rounded-md bg-white p-3">
                            <TeethSelector
                              selectedTeeth={
                                patientData.dentalExamination
                                  ?.gainSpaceDistalizationTeeth || []
                              }
                              onTeethSelect={() => {}} // Read-only mode
                            />
                          </div>
                        </div>
                      )} */}
                    </div>

                    {/* Proclination */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-lg font-medium text-gray-700">
                          Proclination:
                        </label>
                        <div className="rounded-md bg-gray-50 px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {patientData.dentalExamination
                              ?.gainSpaceProclination
                              ? patientData.dentalExamination.gainSpaceProclination
                                  .charAt(0)
                                  .toUpperCase() +
                                patientData.dentalExamination.gainSpaceProclination.slice(
                                  1,
                                )
                              : "Not specified"}
                          </span>
                        </div>
                      </div>

                      {/* {patientData.dentalExamination?.gainSpaceProclination ===
                        "yes" && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Select Teeth for Proclination (Select tooth):
                          </label>
                          <div className="rounded-md bg-white p-3">
                            <TeethSelector
                              selectedTeeth={
                                patientData.dentalExamination
                                  ?.gainSpaceProclinationTeeth || []
                              }
                              onTeethSelect={() => {}} // Read-only mode
                            />
                          </div>
                        </div>
                      )} */}
                    </div>
                  </div>
                </div>

                {/* Any Other Comments Section */}
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-6 text-xl font-semibold text-gray-700">
                    Any Other Comments
                  </h2>
                  <p className="mb-6 text-sm text-gray-500 italic">
                    Additional comments or observations:
                  </p>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Additional Comments:
                      </label>
                      <div className="min-h-[120px] rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900">
                        {patientData.dentalExamination?.anyOtherComments ||
                          "Not specified"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
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
                <h1 className="bg-gradient-to-r from-gray-800 via-purple-800 to-pink-800 bg-clip-text text-4xl font-bold text-transparent">
                  Files Upload
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Patient images, X-rays, and 3D models
                </p>
              </div>

              <div className="space-y-8">
                {/* Intraoral Photo Section - First 6 uploads (slots 0-5) */}
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-200 p-3">
                      <svg
                        className="h-6 w-6 text-blue-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-800">
                        📸 Intraoral Photo
                      </h2>
                      <p className="text-blue-600">
                        Upload photos of the patient's teeth and oral cavity
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <FileDisplayComponent
                        key={idx}
                        idx={idx}
                        patientData={patientData}
                      />
                    ))}
                  </div>
                </div>

                {/* Facial Section - Next 3 uploads (slots 6-8) */}
                <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-green-200 p-3">
                      <svg
                        className="h-6 w-6 text-green-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-green-800">
                        👤 Facial
                      </h2>
                      <p className="text-green-600">
                        Upload photos showing the patient's facial features and
                        profile
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {[6, 7, 8].map((idx) => (
                      <FileDisplayComponent
                        key={idx}
                        idx={idx}
                        patientData={patientData}
                      />
                    ))}
                  </div>
                </div>

                {/* X-ray Section - Remaining 2 uploads (slots 9-10) */}
                <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-purple-200 p-3">
                      <svg
                        className="h-6 w-6 text-purple-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-purple-800">
                        🔬 X-ray
                      </h2>
                      <p className="text-purple-600">
                        Upload radiographic images for diagnostic purposes
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {[9, 10].map((idx) => (
                      <FileDisplayComponent
                        key={idx}
                        idx={idx}
                        patientData={patientData}
                      />
                    ))}
                  </div>
                </div>

                {/* 3D Models Section */}
                <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-8 shadow-lg">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-orange-200 p-3">
                      <svg
                        className="h-6 w-6 text-orange-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-orange-800">
                        🎯 3D Models (PLY/STL)
                      </h2>
                      <p className="text-orange-600">
                        3D model files for treatment planning and visualization
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {[11, 12].map((idx) => (
                      <FileDisplayComponent
                        key={idx}
                        idx={idx}
                        patientData={patientData}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
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
                <h1 className="bg-gradient-to-r from-gray-800 via-purple-800 to-pink-800 bg-clip-text text-4xl font-bold text-transparent">
                  Comments
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Patient comments and notes
                </p>
              </div>

              {comments.length === 0 ? (
                <div className="py-12 text-center">
                  <svg
                    className="mx-auto mb-4 h-16 w-16 text-gray-400"
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
                              {comment.commentedBy?.name
                                ?.charAt(0)
                                ?.toUpperCase() || "U"}
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
                    <div className="font-medium text-blue-700">
                      Total Comments
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/60 p-4 text-center backdrop-blur-sm">
                    <div className="mb-1 text-3xl font-bold text-green-600">
                      {
                        comments.filter(
                          (c) => c.commentedBy?.userType === "User",
                        ).length
                      }
                    </div>
                    <div className="font-medium text-green-700">
                      From Doctors
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/60 p-4 text-center backdrop-blur-sm">
                    <div className="mb-1 text-3xl font-bold text-purple-600">
                      {
                        comments.filter(
                          (c) => c.commentedBy?.userType === "Distributer",
                        ).length
                      }
                    </div>
                    <div className="font-medium text-purple-700">
                      From Distributers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "scanFiles" && (
            <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
              <div className="mb-10 text-center">
                <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                  <svg
                    className="h-10 w-10 text-white"
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
                <h1 className="bg-gradient-to-r from-gray-800 via-purple-800 to-pink-800 bg-clip-text text-4xl font-bold text-transparent">
                  Scan Files
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  Patient scan files and documents
                </p>
              </div>

              {patientFiles.length === 0 ? (
                <div className="py-12 text-center">
                  <svg
                    className="mx-auto mb-4 h-16 w-16 text-gray-400"
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
                  <h3 className="mb-2 text-lg font-medium text-gray-500">
                    No Scan Files Available
                  </h3>
                  <p className="text-gray-400">
                    This patient doesn't have any scan files uploaded yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {patientFiles.map((file, index) => {
                      const displayFileName =
                        file.fileName || `Scan File ${index + 1}`;

                      const isImage = file.fileType === "image";
                      const isPdf = file.fileType === "pdf";
                      const isDocument = ["doc", "docx", "txt"].includes(
                        file.fileType,
                      );
                      const canPreview = isImage || isPdf || isDocument;

                      return (
                        <div
                          key={`${file.category}-${file.categoryIndex}-${index}`}
                          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:border-blue-300 hover:shadow-xl"
                        >
                          {/* File Selection Checkbox */}

                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {isImage ? (
                                <img
                                  src={file.fileUrl}
                                  alt={displayFileName}
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
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-start justify-between gap-6 text-justify">
                                <div>
                                  <h4
                                    className="text-lg font-semibold break-words text-gray-900"
                                    dangerouslySetInnerHTML={{
                                      __html: displayFileName,
                                    }}
                                  />
                                </div>
                                <div className="py-1 text-right text-sm whitespace-nowrap text-gray-500">
                                  <div>
                                    {file.uploadedAt
                                      ? new Date(
                                          file.uploadedAt,
                                        ).toLocaleDateString()
                                      : "Unknown Date"}
                                  </div>
                                  <div>
                                    {file.uploadedAt
                                      ? new Date(
                                          file.uploadedAt,
                                        ).toLocaleTimeString()
                                      : ""}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    if (!file.fileUrl) {
                                      toast.error(
                                        "File URL not found. Cannot open this file.",
                                      );
                                      return;
                                    }

                                    // Open file in new tab
                                    window.open(
                                      file.fileUrl,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  }}
                                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
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
                                  Download
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
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Scan Files Summary */}
              <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
                <h4 className="mb-3 text-lg font-semibold text-blue-800">
                  Scan Files Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {patientFiles.length}
                    </div>
                    <div className="text-blue-700">Total Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {
                        patientFiles.filter((f) => f.fileType === "image")
                          .length
                      }
                    </div>
                    <div className="text-green-700">Images</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {
                        patientFiles.filter((f) => f.fileType === "video")
                          .length
                      }
                    </div>
                    <div className="text-purple-600">Videos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {patientFiles.filter((f) => f.fileType === "pdf").length}
                    </div>
                    <div className="text-orange-700">PDFs</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

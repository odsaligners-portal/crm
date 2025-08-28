"use client";
import React, { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { storage } from "@/utils/firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { imageLabels } from "@/constants/data";

const ClinicImagesModal = ({
  isOpen,
  onClose,
  patientId,
  imageType,
  existingImages,
  onImagesUpdated,
}) => {
  const [imageUrls, setImageUrls] = useState(Array(11).fill(undefined));
  const [fileKeys, setFileKeys] = useState(Array(11).fill(undefined));
  const [progresses, setProgresses] = useState(Array(11).fill(0));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with existing images if updating
  React.useEffect(() => {
    if (existingImages && isOpen) {
      const newImageUrls = [...imageUrls];
      const newFileKeys = [...fileKeys];

      Object.keys(existingImages).forEach((key, index) => {
        const files = existingImages[key];
        if (files && files.length > 0) {
          newImageUrls[index] = files[0].fileUrl;
          newFileKeys[index] = files[0].fileKey;
        }
      });

      setImageUrls(newImageUrls);
      setFileKeys(newFileKeys);
    }
  }, [existingImages, isOpen]);

  // Reset state when modal opens/closes or image type changes
  React.useEffect(() => {
    if (isOpen) {
      // Reset all state when modal opens
      setImageUrls(Array(11).fill(undefined));
      setFileKeys(Array(11).fill(undefined));
      setProgresses(Array(11).fill(0));

      // Then populate with existing images if they exist
      if (existingImages) {
        const newImageUrls = Array(11).fill(undefined);
        const newFileKeys = Array(11).fill(undefined);

        Object.keys(existingImages).forEach((key, index) => {
          const files = existingImages[key];
          if (files && files.length > 0) {
            newImageUrls[index] = files[0].fileUrl;
            newFileKeys[index] = files[0].fileKey;
          }
        });

        setImageUrls(newImageUrls);
        setFileKeys(newFileKeys);
      }
    } else {
      // Clear state when modal closes
      setImageUrls(Array(11).fill(undefined));
      setFileKeys(Array(11).fill(undefined));
      setProgresses(Array(11).fill(0));
    }

    // Cleanup function to reset state when component unmounts
    return () => {
      setImageUrls(Array(11).fill(undefined));
      setFileKeys(Array(11).fill(undefined));
      setProgresses(Array(11).fill(0));
    };
  }, [isOpen, imageType, existingImages]);

  const handleFileUpload = async (file, idx) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!["jpg", "jpeg", "png"].includes(fileExtension)) {
      toast.error("❌ Invalid file type. Please use JPEG or PNG format.");
      return;
    }

    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const storagePath = `clinic-images/${imageType}/${patientId}/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) =>
        setProgresses((p) => {
          const n = [...p];
          n[idx] = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          return n;
        }),
      (error) => {
        toast.error(
          `❌ File upload failed: ${error.message || "Unknown error occurred"}`,
        );
        setProgresses((p) => {
          const n = [...p];
          n[idx] = 0;
          return n;
        });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrls((p) => {
            const n = [...p];
            n[idx] = downloadURL;
            return n;
          });
          setFileKeys((p) => {
            const n = [...p];
            n[idx] = storagePath;
            return n;
          });
          toast.success("✅ File uploaded successfully!");
        });
      },
    );
  };

  const handleDeleteFile = async (idx) => {
    const fileKey = fileKeys[idx];
    if (!fileKey) return;

    const fileRef = ref(storage, fileKey);
    try {
      await deleteObject(fileRef);
      setImageUrls((p) => {
        const n = [...p];
        n[idx] = undefined;
        return n;
      });
      setFileKeys((p) => {
        const n = [...p];
        n[idx] = undefined;
        return n;
      });
      setProgresses((p) => {
        const n = [...p];
        n[idx] = 0;
        return n;
      });
      toast.success("✅ File deleted successfully!");
    } catch (error) {
      toast.error(
        `❌ Failed to delete file: ${error.message || "Unknown error occurred"}`,
      );
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      const path = new URL(url).pathname.split("/").pop() || "";
      return decodeURIComponent(path).substring(path.indexOf("-") + 1);
    } catch {
      return "file";
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Prepare file data
      const fileData = {};
      for (let i = 0; i < 11; i++) {
        if (imageUrls[i]) {
          fileData[`img${i + 1}`] = [
            {
              fileUrl: imageUrls[i],
              fileKey: fileKeys[i],
              uploadedAt: new Date().toISOString(),
            },
          ];
        } else {
          fileData[`img${i + 1}`] = [];
        }
      }

      // Update patient record
      const response = await fetch(
        `/api/patients/update-details?id=${patientId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || "dummy-token"}`,
          },
          body: JSON.stringify({
            [imageType === "middle"
              ? "middleClinicImages"
              : "postClinicImages"]: fileData,
          }),
        },
      );

      if (response.ok) {
        toast.success(
          `✅ ${imageType === "middle" ? "Middle" : "Post"} clinic images updated successfully!`,
        );
        onImagesUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(`❌ ${errorData.message || "Failed to update images"}`);
      }
    } catch (error) {
      console.error("Error updating images:", error);
      toast.error(
        `❌ ${error.message || "An error occurred while updating images"}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const UploadComponent = ({ idx }) => {
    const onDrop = (acceptedFiles) =>
      acceptedFiles.length > 0 && handleFileUpload(acceptedFiles[0], idx);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false,
      accept: { "image/jpeg": [], "image/png": [] },
    });

    const fileUrl = imageUrls[idx];
    const fileName = fileUrl ? getFileNameFromUrl(fileUrl) : "";

    // Background images for different upload slots
    const backgroundImages = [
      "/images/upload/upper-arch.jpeg", // Upper arch
      "/images/upload/lower-arch.jpeg", // Lower arch
      "/images/upload/Anterior-View-Arch.jpeg", // Anterior View
      "/images/upload/Left-View.jpeg", // Left View
      "/images/upload/right-view.jpeg", // Right View
      "/images/upload/open-mouth-with-teeth.jpeg", // Open Mouth
      "/images/upload/profile.jpeg", // Profile View
      "/images/upload/frontal.jpeg", // Frontal View
      "/images/upload/smiling.jpeg", // Smiling
      "/images/upload/upper-arch.jpeg", // Additional slots
      "/images/upload/lower-arch.jpeg", // Additional slots
    ];

    const backgroundImage = backgroundImages[idx];

    return (
      <div className="group rounded-xl p-2 text-center transition-all duration-300 hover:bg-gray-50/50">
        <label className="mb-3 block text-sm font-semibold text-gray-700 transition-colors duration-200 group-focus-within:text-blue-600">
          {imageLabels[idx] || `Image ${idx + 1}`}
        </label>
        {!fileUrl ? (
          progresses[idx] > 0 ? (
            <div className="mt-2 w-full">
              <div className="mb-1 flex justify-between">
                <span className="text-sm font-medium text-blue-700">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-blue-700">
                  {Math.round(progresses[idx])}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${progresses[idx]}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`group/upload relative mt-2 flex h-56 w-full cursor-pointer appearance-none items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 hover:scale-105 focus:outline-none ${
                isDragActive
                  ? "scale-105 border-blue-500 bg-gradient-to-br from-blue-100 to-blue-200 shadow-xl ring-4 shadow-blue-500/30 ring-blue-500/20"
                  : "border-gray-300 bg-white/80 backdrop-blur-sm hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-lg"
              }`}
            >
              <input {...getInputProps()} />

              {/* Background Image */}
              {backgroundImage && (
                <div
                  className="absolute inset-0 transition-all duration-500 group-hover/upload:scale-105 group-hover/upload:opacity-70"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              )}

              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/85 via-white/70 to-white/50 transition-all duration-300 group-hover/upload:from-white/70 group-hover/upload:via-white/50 group-hover/upload:to-white/30" />

              <div className="relative z-10 flex flex-col items-center gap-2 py-2">
                <div
                  className={`rounded-full p-4 shadow-lg transition-all duration-300 ${
                    isDragActive
                      ? "scale-110 bg-blue-500 text-white shadow-blue-500/50"
                      : "bg-white/90 text-blue-600 group-hover/upload:scale-110 group-hover/upload:bg-blue-500 group-hover/upload:text-white group-hover/upload:shadow-blue-500/50"
                  }`}
                >
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <div className="mb-2 text-center">
                  <span className="block text-sm font-semibold text-gray-800 group-hover/upload:text-gray-900">
                    Drop file or{" "}
                    <span className="font-bold text-blue-600 underline group-hover/upload:text-blue-700">
                      browse
                    </span>
                  </span>
                  <span className="mt-1 block text-xs text-gray-600 group-hover/upload:text-gray-700">
                    JPEG, PNG
                  </span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="group relative mx-auto mt-2 max-w-xs">
            <div className="flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <img
                src={fileUrl}
                alt=""
                className="h-36 w-full rounded-xl object-contain"
              />
              <button
                type="button"
                onClick={() => handleDeleteFile(idx)}
                className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:shadow-xl"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-[1000000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              {imageType === "middle" ? "Middle" : "Post"} Clinic Images
            </h2>
            <p className="mt-2 text-gray-600">
              Upload and manage {imageType === "middle" ? "middle" : "post"}{" "}
              clinic images for patient {patientId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-8">
          {/* Intraoral Photo Section - First 6 uploads */}
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
                <h3 className="text-xl font-bold text-blue-800">
                  📸 Intraoral Photo
                </h3>
                <p className="text-blue-600">
                  Upload photos of the patient's teeth and oral cavity
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <UploadComponent key={idx} idx={idx} />
              ))}
            </div>
          </div>

          {/* Facial Section - Next 3 uploads */}
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
                <h3 className="text-xl font-bold text-green-800">👤 Facial</h3>
                <p className="text-green-600">
                  Upload photos showing the patient's facial features and
                  profile
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[6, 7, 8].map((idx) => (
                <UploadComponent key={idx} idx={idx} />
              ))}
            </div>
          </div>

          {/* X-ray Section - Remaining 2 uploads */}
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
                <h3 className="text-xl font-bold text-purple-800">🔬 X-ray</h3>
                <p className="text-purple-600">
                  Upload radiographic images for diagnostic purposes
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {[9, 10].map((idx) => (
                <UploadComponent key={idx} idx={idx} />
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? "Updating..." : "Update Images"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicImagesModal;

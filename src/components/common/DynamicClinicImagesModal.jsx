"use client";
import React, { useState, useRef, useEffect } from "react";
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
import { MdDelete, MdEdit, MdAdd, MdClose } from "react-icons/md";
import { imageLabels } from "@/constants/data";
import { safeId, safeKey } from "@/utils/safeId";

const DynamicClinicImagesModal = ({
  isOpen,
  onClose,
  patientId,
  imageType,
  existingImageSets = [],
  editingImageSetId = null,
  onImagesUpdated,
}) => {
  const [imageSets, setImageSets] = useState([]);
  const [editingSetId, setEditingSetId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with existing image sets
  useEffect(() => {
    if (isOpen) {
      if (
        editingImageSetId &&
        existingImageSets &&
        existingImageSets.length > 0
      ) {
        // Edit mode: show only the set being edited
        const setToEdit = existingImageSets.find(
          (set) => set._id === editingImageSetId,
        );
        if (setToEdit) {
          // Ensure all images have unique _id
          const processedSet = {
            ...setToEdit,
            images: (setToEdit.images || []).map((img, imgIdx) => ({
              ...img,
              _id: img._id || img.fileKey || `img-${imgIdx}-${Date.now()}`,
            })),
          };
          setImageSets([processedSet]);
          setEditingSetId(processedSet._id);
        } else {
          setImageSets([]);
        }
      } else if (existingImageSets && existingImageSets.length > 0) {
        // View all sets - ensure all images have unique _id
        const processedSets = existingImageSets.map((set) => ({
          ...set,
          images: (set.images || []).map((img, imgIdx) => ({
            ...img,
            _id:
              img._id ||
              img.fileKey ||
              `img-${set._id || "set"}-${imgIdx}-${Date.now()}`,
          })),
        }));
        setImageSets(processedSets);
      } else {
        setImageSets([]);
      }
    }
  }, [isOpen, existingImageSets, editingImageSetId]);

  const addNewImageSet = () => {
    const newSet = {
      _id: `temp-${uuidv4()}`,
      heading: "",
      description: "",
      images: [],
    };
    setImageSets([...imageSets, newSet]);
    setEditingSetId(newSet._id);
  };

  const updateImageSet = (setId, field, value) => {
    setImageSets((prev) =>
      prev.map((set) => (set._id === setId ? { ...set, [field]: value } : set)),
    );
  };

  const deleteImageSet = (setId) => {
    setImageSets((prev) => prev.filter((set) => set._id !== setId));
    if (editingSetId === setId) {
      setEditingSetId(null);
    }
  };

  const handleFileUpload = async (file, setId, idx) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";

    if (!["jpg", "jpeg", "png"].includes(fileExtension)) {
      toast.error("❌ Invalid file type. Please use JPEG or PNG format.");
      return;
    }

    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const storagePath = `clinic-images/${imageType}/${patientId}/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    // Create a temporary image object with progress tracking
    const tempImageId = `temp-img-${uuidv4()}`;
    const tempImage = {
      _id: tempImageId,
      fileUrl: null,
      fileKey: null,
      uploadedAt: null,
      progress: 0,
      idx: idx, // Store the index for this image slot
    };

    // Update or add image at the specific index
    setImageSets((prev) =>
      prev.map((set) => {
        if (set._id === setId) {
          const existingImages = set.images || [];
          // Check if there's already an image at this index
          const existingIndex = existingImages.findIndex(
            (img) => img.idx === idx,
          );
          if (existingIndex >= 0) {
            // Replace existing image at this index
            const newImages = [...existingImages];
            newImages[existingIndex] = tempImage;
            return { ...set, images: newImages };
          } else {
            // Add new image
            return { ...set, images: [...existingImages, tempImage] };
          }
        }
        return set;
      }),
    );

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImageSets((prev) =>
          prev.map((set) => {
            if (set._id === setId) {
              const images = set.images || [];
              return {
                ...set,
                images: images.map((img) =>
                  img._id === tempImageId
                    ? { ...img, progress, idx: idx }
                    : img,
                ),
              };
            }
            return set;
          }),
        );
      },
      (error) => {
        console.error("Upload error:", error);
        toast.error(
          `❌ File upload failed: ${error.message || "Unknown error occurred"}`,
        );
        setImageSets((prev) =>
          prev.map((set) => {
            if (set._id === setId) {
              const images = set.images || [];
              return {
                ...set,
                images: images.filter((img) => img._id !== tempImageId),
              };
            }
            return set;
          }),
        );
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setImageSets((prev) =>
            prev.map((set) => {
              if (set._id === setId) {
                const images = set.images || [];
                return {
                  ...set,
                  images: images.map((img) =>
                    img._id === tempImageId
                      ? {
                          ...img,
                          fileUrl: downloadURL,
                          fileKey: storagePath,
                          uploadedAt: new Date().toISOString(),
                          progress: 100,
                          idx: idx,
                        }
                      : img,
                  ),
                };
              }
              return set;
            }),
          );
          toast.success("✅ File uploaded successfully!");
        } catch (error) {
          console.error("Error getting download URL:", error);
          toast.error("❌ Failed to get download URL for uploaded file");
          setImageSets((prev) =>
            prev.map((set) => {
              if (set._id === setId) {
                const images = set.images || [];
                return {
                  ...set,
                  images: images.filter((img) => img._id !== tempImageId),
                };
              }
              return set;
            }),
          );
        }
      },
    );
  };

  const handleDeleteImage = async (setId, imageId, fileKey) => {
    if (fileKey) {
      const fileRef = ref(storage, fileKey);
      try {
        await deleteObject(fileRef);
      } catch (error) {
        console.error("Error deleting file from storage:", error);
      }
    }

    setImageSets((prev) =>
      prev.map((set) => {
        if (set._id === setId) {
          const images = set.images || [];
          // Filter out the image - use fileKey as primary identifier since it's most reliable
          const filteredImages = images.filter((img) => {
            // Primary: match by fileKey (most reliable)
            if (fileKey && img.fileKey) {
              return img.fileKey !== fileKey;
            }
            // Fallback: match by _id
            if (imageId && img._id) {
              return img._id !== imageId;
            }
            // If we can't identify the image, keep it (shouldn't happen)
            return true;
          });
          return { ...set, images: filteredImages };
        }
        return set;
      }),
    );
    toast.success("✅ Image deleted successfully!");
  };

  const handleSubmit = async () => {
    // Validate all sets have heading, description and at least one image
    for (const set of imageSets) {
      if (!set.heading || set.heading.trim() === "") {
        toast.error("❌ Please provide a heading for all image sets");
        return;
      }
      if (!set.description || set.description.trim() === "") {
        toast.error("❌ Please provide a description for all image sets");
        return;
      }
      if (!set.images || set.images.length === 0) {
        toast.error("❌ Each image set must have at least one image");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Prepare image sets data (remove temp IDs and progress)
      const imageSetsData = imageSets.map((set) => ({
        _id:
          set._id && typeof set._id === "string" && set._id.startsWith("temp-")
            ? undefined
            : set._id,
        heading: (set.heading || "").trim(),
        description: (set.description || "").trim(),
        images: (set.images || [])
          .filter((img) => img && img.fileUrl) // Only include uploaded images
          .map((img) => ({
            fileUrl: img.fileUrl,
            fileKey: img.fileKey,
            uploadedAt: img.uploadedAt,
            idx: img.idx, // Preserve the index for display
          })),
      }));

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
              : "postClinicImages"]: imageSetsData,
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

  const ImageUploadComponent = ({ setId, image, idx }) => {
    const onDrop = (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0], setId, idx);
      }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false,
      accept: { "image/jpeg": [], "image/png": [] },
    });

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
    const label = imageLabels[idx] || `Image ${idx + 1}`;

    if (image && image.fileUrl) {
      return (
        <div className="group relative">
          <label className="mb-3 block text-sm font-semibold text-gray-700">
            {label}
          </label>
          <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow-md transition-all duration-300 hover:scale-105">
            <img
              src={image.fileUrl}
              alt={label}
              className="h-36 w-full rounded-xl object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteImage(setId, image._id, image.fileKey);
              }}
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100 hover:scale-110 hover:bg-red-600 hover:shadow-xl"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    if (image && image.progress > 0 && image.progress < 100) {
      return (
        <div className="group rounded-xl p-2 text-center">
          <label className="mb-3 block text-sm font-semibold text-gray-700">
            {label}
          </label>
          <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
            <div className="mb-2 flex justify-between text-sm font-medium text-blue-700">
              <span>Uploading...</span>
              <span>{Math.round(image.progress)}%</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-200">
              <div
                className="h-2.5 rounded-full bg-blue-600"
                style={{ width: `${image.progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="group rounded-xl p-2 text-center transition-all duration-300 hover:bg-gray-50/50">
        <label className="mb-3 block text-sm font-semibold text-gray-700 subpixel-antialiased transition-colors duration-200 group-focus-within:text-blue-600">
          {label}
        </label>
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
              <span className="block text-sm font-semibold text-gray-800 subpixel-antialiased group-hover/upload:text-gray-900">
                Drop file or{" "}
                <span className="font-semibold text-blue-600 underline subpixel-antialiased group-hover/upload:text-blue-700">
                  browse
                </span>
              </span>
              <span className="mt-1 block text-xs text-gray-600 group-hover/upload:text-gray-700">
                JPEG, PNG
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-gray-800">
              {imageType === "middle" ? "Middle" : "Post"} Clinic Images
            </h2>
            <p className="mt-2 text-gray-600">
              Create and manage image sets with custom headings and descriptions
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <MdClose className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {imageSets.map((set, setIdx) => (
            <div
              key={safeKey(set._id, setIdx)}
              className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-lg"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  {editingSetId === set._id ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Heading *
                        </label>
                        <input
                          type="text"
                          value={set.heading}
                          onChange={(e) =>
                            updateImageSet(set._id, "heading", e.target.value)
                          }
                          placeholder="Enter heading for this image set"
                          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">
                          Description *
                        </label>
                        <textarea
                          value={set.description}
                          onChange={(e) =>
                            updateImageSet(
                              set._id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Enter description for this image set"
                          rows={3}
                          required
                          className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSetId(null)}
                          className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-gray-600"
                        >
                          Done
                        </button>
                        <button
                          onClick={() => deleteImageSet(set._id)}
                          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600"
                        >
                          <MdDelete className="mr-1 inline h-4 w-4" />
                          Delete Set
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800">
                            {set.heading || "Untitled Image Set"}
                          </h3>
                          {set.description && (
                            <p className="mt-2 text-sm text-gray-600">
                              {set.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingSetId(set._id)}
                            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-600"
                          >
                            <MdEdit className="mr-1 inline h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteImageSet(set._id)}
                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-600"
                          >
                            <MdDelete className="mr-1 inline h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {editingSetId === set._id && (
                <>
                  {/* Intraoral Photo Section - First 6 uploads */}
                  <div className="mb-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow-lg">
                    <div className="mb-4 flex items-center gap-3">
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
                        <h3 className="text-xl font-semibold text-blue-800">
                          📸 Intraoral Photo
                        </h3>
                        <p className="text-blue-600">
                          Upload photos of the patient's teeth and oral cavity
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const image = set.images?.find(
                          (img) => img.idx === idx,
                        );
                        return (
                          <ImageUploadComponent
                            key={idx}
                            setId={safeId(set._id)}
                            image={image}
                            idx={idx}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Facial Section - Next 3 uploads */}
                  <div className="mb-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 shadow-lg">
                    <div className="mb-4 flex items-center gap-3">
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
                        <h3 className="text-xl font-semibold text-green-800">
                          👤 Facial
                        </h3>
                        <p className="text-green-600">
                          Upload photos showing the patient's facial features
                          and profile
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                      {[6, 7, 8].map((idx) => {
                        const image = set.images?.find(
                          (img) => img.idx === idx,
                        );
                        return (
                          <ImageUploadComponent
                            key={idx}
                            setId={safeId(set._id)}
                            image={image}
                            idx={idx}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* X-ray Section - Remaining 2 uploads */}
                  <div className="mb-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 shadow-lg">
                    <div className="mb-4 flex items-center gap-3">
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
                        <h3 className="text-xl font-semibold text-purple-800">
                          🔬 X-ray
                        </h3>
                        <p className="text-purple-600">
                          Upload radiographic images for diagnostic purposes
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {[9, 10].map((idx) => {
                        const image = set.images?.find(
                          (img) => img.idx === idx,
                        );
                        return (
                          <ImageUploadComponent
                            key={idx}
                            setId={safeId(set._id)}
                            image={image}
                            idx={idx}
                          />
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
              {editingSetId !== set._id &&
                set.images &&
                set.images.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {set.images
                      .sort((a, b) => (a.idx || 0) - (b.idx || 0))
                      .map((image, imgIdx) => (
                        <ImageUploadComponent
                          key={safeKey(image._id, imgIdx)}
                          setId={safeId(set._id)}
                          image={image}
                          idx={image.idx}
                        />
                      ))}
                  </div>
                )}
            </div>
          ))}

          <button
            onClick={addNewImageSet}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-blue-50"
          >
            <MdAdd className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-lg font-semibold text-gray-700">
              Add New Image Set
            </p>
            <p className="text-sm text-gray-500">
              Create a new set with heading, description, and images
            </p>
          </button>
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
            disabled={isSubmitting || imageSets.length === 0}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Save Images"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DynamicClinicImagesModal;

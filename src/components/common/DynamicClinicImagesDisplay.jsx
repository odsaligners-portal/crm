"use client";
import React, { useState } from "react";
import { MdEdit, MdDelete, MdExpandMore, MdExpandLess } from "react-icons/md";
import { imageLabels } from "@/constants/data";
import { safeId, safeKey } from "@/utils/safeId";

const DynamicClinicImagesDisplay = ({
  imageSets = [],
  title,
  description,
  colorScheme,
  isExpanded,
  onToggle,
  sectionId,
  onEdit,
  onDelete,
  isCaseExpired = false,
}) => {
  const hasImages =
    imageSets &&
    imageSets.length > 0 &&
    imageSets.some((set) => set.images && set.images.length > 0);

  const downloadImage = (url) => {
    window.open(url, "_blank");
  };

  const handleDelete = (setId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this image set?")) {
      onDelete(setId);
    }
  };

  const handleEdit = (setId, e) => {
    e.stopPropagation();
    onEdit(setId);
  };

  return (
    <div
      className={`rounded-3xl border-2 ${colorScheme.border} ${colorScheme.bg} p-8 shadow-xl transition-all duration-500 ease-in-out hover:shadow-2xl`}
    >
      <div
        className="mb-6 flex cursor-pointer items-center gap-4 transition-all duration-300 hover:gap-5"
        onClick={() => onToggle(sectionId)}
      >
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorScheme.iconBg} shadow-lg transition-all duration-300 ${
            isExpanded ? "scale-110 rotate-180" : "hover:scale-105"
          }`}
        >
          {isExpanded ? (
            <MdExpandLess className={`h-7 w-7 ${colorScheme.iconColor}`} />
          ) : (
            <MdExpandMore className={`h-7 w-7 ${colorScheme.iconColor}`} />
          )}
        </div>
        <div className="flex-1">
          <h3
            className={`text-2xl font-bold subpixel-antialiased ${colorScheme.titleColor} transition-all duration-300 ${
              isExpanded ? "text-3xl" : ""
            }`}
          >
            {title}
          </h3>
          <p
            className={`mt-1 text-sm font-medium ${colorScheme.descriptionColor} transition-all duration-300 ${
              isExpanded ? "text-base" : ""
            }`}
          >
            {description}
          </p>
        </div>
      </div>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {!hasImages ? (
          <div className="py-8 text-center">
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${colorScheme.iconBg} mb-4`}
            >
              <svg
                className={`h-8 w-8 ${colorScheme.iconColor}`}
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
            <p
              className={`text-lg font-medium ${colorScheme.descriptionColor}`}
            >
              No images uploaded yet
            </p>
            <p className={`text-sm ${colorScheme.descriptionColor} mt-2`}>
              Click the section header to expand and view images when they're
              available
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {imageSets.map((set, setIdx) => (
              <div
                key={safeKey(set._id, setIdx)}
                className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-lg transition-all duration-300 hover:border-gray-300 hover:shadow-xl"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-3 flex items-start gap-3">
                      <div
                        className={`mt-2 h-2.5 w-2.5 rounded-full ${colorScheme.iconBg} flex-shrink-0 shadow-md`}
                      />
                      <div className="flex-1">
                        <h4 className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-2xl font-bold text-transparent">
                          {set.heading || "Untitled Image Set"}
                        </h4>
                        {set.description && (
                          <p className="mt-2.5 text-sm leading-relaxed font-medium text-gray-600">
                            {set.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  {!isCaseExpired && (
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleEdit(safeId(set._id), e)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
                      >
                        <MdEdit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDelete(safeId(set._id), e)}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:from-red-600 hover:to-red-700 hover:shadow-lg"
                      >
                        <MdDelete className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {set.images && set.images.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                    {set.images
                      .sort((a, b) => (a.idx || 0) - (b.idx || 0))
                      .map((image, idx) => {
                        const imageLabel =
                          image.idx !== undefined && image.idx !== null
                            ? imageLabels[image.idx]
                            : null;
                        return (
                          <div
                            key={safeKey(image._id, idx)}
                            className="group/image relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:border-gray-300 hover:shadow-2xl"
                          >
                            <div className="relative aspect-square overflow-hidden">
                              <img
                                src={image.fileUrl}
                                alt={imageLabel || `${set.heading} - Image`}
                                className="h-full w-full cursor-pointer object-cover transition-transform duration-500 group-hover/image:scale-110"
                                onClick={() => downloadImage(image.fileUrl)}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/image:opacity-100" />

                              {/* Image Label Badge */}
                              {imageLabel && (
                                <div className="absolute top-3 left-3 rounded-lg bg-black/75 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                                  {imageLabel}
                                </div>
                              )}

                              {/* Download Button */}
                              <div
                                className="absolute top-3 right-3 cursor-pointer rounded-full bg-white/90 p-2.5 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover/image:opacity-100 hover:scale-110 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(image.fileUrl);
                                }}
                              >
                                <svg
                                  className="h-5 w-5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                              </div>

                              {/* Date Overlay */}
                              {image.uploadedAt && (
                                <div className="absolute right-0 bottom-0 left-0 p-4 text-white opacity-0 transition-opacity duration-300 group-hover/image:opacity-100">
                                  <div className="flex items-center gap-2 text-xs">
                                    <svg
                                      className="h-3.5 w-3.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                      />
                                    </svg>
                                    <span className="font-medium">
                                      {new Date(
                                        image.uploadedAt,
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                      <svg
                        className="h-8 w-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                      No images in this set
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicClinicImagesDisplay;

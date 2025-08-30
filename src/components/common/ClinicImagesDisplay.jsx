"use client";
import React, { useState } from "react";
import { imageLabels } from "@/constants/data";

const ClinicImagesDisplay = ({
  images,
  title,
  description,
  colorScheme,
  isExpanded,
  onToggle,
  sectionId,
}) => {
  const hasImages =
    images &&
    Object.values(images).some((imgArray) => imgArray && imgArray.length > 0);

  const downloadImage = async (url, name) => {
    // const response = await fetch(url);
    // const blob = await response.blob();
    // const blobUrl = URL.createObjectURL(blob);

    // const link = document.createElement("a");
    // link.href = blobUrl;
    // link.download = name || "download";
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    // URL.revokeObjectURL(blobUrl);
    window.open(url, "_blank");
  };

  return (
    <div
      className={`rounded-2xl border-2 ${colorScheme.border} ${colorScheme.bg} p-8 shadow-lg transition-all duration-500 ease-in-out`}
    >
      <div
        className="mb-6 flex cursor-pointer items-center gap-3 transition-all duration-300"
        onClick={() => onToggle(sectionId)}
      >
        <div
          className={`rounded-xl ${colorScheme.iconBg} p-3 transition-all duration-300 ${isExpanded ? "rotate-180" : ""}`}
        >
          <svg
            className={`h-6 w-6 ${colorScheme.iconColor}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
        <div>
          <h3
            className={`text-xl font-semibold subpixel-antialiased ${colorScheme.titleColor} transition-all duration-300 ${isExpanded ? "text-2xl" : ""}`}
          >
            {title}
          </h3>
          <p
            className={`text-sm ${colorScheme.descriptionColor} transition-all duration-300 ${isExpanded ? "text-base" : ""}`}
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
          <div className="space-y-8">
            {/* Intraoral Photo Section - First 6 uploads */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-700 subpixel-antialiased">
                📸 Intraoral Photo
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const key = `img${idx + 1}`;
                  const findLabelKey = idx;
                  const imageArray = images[key];
                  const hasImage = imageArray && imageArray.length > 0;
                  const imageUrl = hasImage ? imageArray[0].fileUrl : null;
                  const label = imageLabels?.[findLabelKey];

                  return (
                    <div
                      key={key}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        hasImage
                          ? "border-green-200 bg-green-50 shadow-md"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {hasImage ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={label}
                            className="h-36 w-full cursor-pointer object-cover transition-transform duration-300"
                            onClick={() => downloadImage(imageUrl, label)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute right-0 bottom-0 left-0 p-3 text-white">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs opacity-90">
                              {new Date(
                                imageArray[0].uploadedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                            {label}
                          </div>
                          <div
                            className="absolute top-2 right-2 cursor-pointer rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                            onClick={() => downloadImage(imageUrl, label)}
                          >
                            <svg
                              className="h-4 w-4"
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
                        </>
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center">
                          <div className="text-center">
                            <div
                              className={`mx-auto mb-2 h-12 w-12 rounded-full ${colorScheme.iconBg} flex items-center justify-center`}
                            >
                              <svg
                                className={`h-6 w-6 ${colorScheme.iconColor}`}
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
                              className={`text-sm font-medium ${colorScheme.descriptionColor}`}
                            >
                              {label}
                            </p>
                            <p
                              className={`text-xs ${colorScheme.descriptionColor} opacity-75`}
                            >
                              No image Uploaded
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Facial Section - Next 3 uploads */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-700 subpixel-antialiased">
                👤 Facial
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {[6, 7, 8].map((idx) => {
                  const key = `img${idx + 1}`;
                  const findLabelKey = idx;
                  const imageArray = images[key];
                  const hasImage = imageArray && imageArray.length > 0;
                  const imageUrl = hasImage ? imageArray[0].fileUrl : null;
                  const label = imageLabels[findLabelKey] || `Image ${idx + 1}`;

                  return (
                    <div
                      key={key}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        hasImage
                          ? "border-green-200 bg-green-50 shadow-md"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {hasImage ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={label}
                            className="h-36 w-full cursor-pointer object-cover transition-transform duration-300"
                            onClick={() => downloadImage(imageUrl, label)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute right-0 bottom-0 left-0 p-3 text-white">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs opacity-90">
                              {new Date(
                                imageArray[0].uploadedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                            {label}
                          </div>
                          <div
                            className="absolute top-2 right-2 cursor-pointer rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                            onClick={() => downloadImage(imageUrl, label)}
                          >
                            <svg
                              className="h-4 w-4"
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
                        </>
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center">
                          <div className="text-center">
                            <div
                              className={`mx-auto mb-2 h-12 w-12 rounded-full ${colorScheme.iconBg} flex items-center justify-center`}
                            >
                              <svg
                                className={`h-6 w-6 ${colorScheme.iconColor}`}
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
                              className={`text-sm font-medium ${colorScheme.descriptionColor}`}
                            >
                              {label}
                            </p>
                            <p
                              className={`text-xs ${colorScheme.descriptionColor} opacity-75`}
                            >
                              No image Uploaded
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-ray Section - Remaining 2 uploads */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-700 subpixel-antialiased">
                🔬 X-ray
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {[9, 10].map((idx) => {
                  const key = `img${idx + 1}`;
                  const findLabelKey = idx;
                  const imageArray = images[key];
                  const hasImage = imageArray && imageArray.length > 0;
                  const imageUrl = hasImage ? imageArray[0].fileUrl : null;
                  const label = imageLabels[findLabelKey] || `Image ${idx + 1}`;

                  return (
                    <div
                      key={key}
                      className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                        hasImage
                          ? "border-green-200 bg-green-50 shadow-md"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {hasImage ? (
                        <>
                          <img
                            src={imageUrl}
                            alt={label}
                            className="h-36 w-full cursor-pointer object-cover transition-transform duration-300"
                            onClick={() => downloadImage(imageUrl, label)}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="absolute right-0 bottom-0 left-0 p-3 text-white">
                            <p className="text-sm font-medium">{label}</p>
                            <p className="text-xs opacity-90">
                              {new Date(
                                imageArray[0].uploadedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="absolute top-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                            {label}
                          </div>
                          <div
                            className="absolute top-2 right-2 cursor-pointer rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                            onClick={() => downloadImage(imageUrl, label)}
                          >
                            <svg
                              className="h-4 w-4"
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
                        </>
                      ) : (
                        <div className="flex h-36 w-full items-center justify-center">
                          <div className="text-center">
                            <div
                              className={`mx-auto mb-2 h-12 w-12 rounded-full ${colorScheme.iconBg} flex items-center justify-center`}
                            >
                              <svg
                                className={`h-6 w-6 ${colorScheme.iconColor}`}
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
                              className={`text-sm font-medium ${colorScheme.descriptionColor}`}
                            >
                              {label}
                            </p>
                            <p
                              className={`text-xs ${colorScheme.descriptionColor} opacity-75`}
                            >
                              No image Uploaded
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicImagesDisplay;

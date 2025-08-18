import { useState, useCallback } from "react";

/**
 * Utility function to get file extension and determine if it's a downloadable type
 */
const getFileInfo = (fileUrl, fileName) => {
  const url = fileUrl || "";
  const name = fileName || "";

  // Extract file extension from URL first (more reliable)
  let extension = "";
  let actualFileName = fileName;

  if (url.includes(".")) {
    const urlParts = url.split("?")[0].split("/");
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart.includes(".")) {
      extension = lastPart.split(".").pop().toLowerCase();
      // If fileName doesn't have the right extension, use the actual filename from URL
      if (!name.includes(".") || !name.toLowerCase().endsWith(extension)) {
        actualFileName = lastPart;
      }
    }
  }

  // Fallback to fileName extension if URL extraction failed
  if (!extension && name.includes(".")) {
    extension = name.split(".").pop().toLowerCase();
  }

  // Determine if file should force download
  const forceDownloadTypes = [
    "pdf",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "png",
    "ppt",
    "pptx",
    "txt",
    "zip",
    "rar",
    "7z",
  ];
  const shouldForceDownload = forceDownloadTypes.includes(extension);

  // Determine MIME type
  const mimeTypes = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    mp4: "video/mp4",
    avi: "video/x-msvideo",
    mov: "video/quicktime",
  };

  const mimeType = mimeTypes[extension] || "application/octet-stream";

  return {
    extension,
    shouldForceDownload,
    mimeType,
    actualFileName, // Return the corrected filename
    isImage: ["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(extension),
    isVideo: ["mp4", "avi", "mov", "wmv", "flv", "webm"].includes(extension),
    isDocument: [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
    ].includes(extension),
    isArchive: ["zip", "rar", "7z", "tar", "gz"].includes(extension),
  };
};

/**
 * Custom hook for handling file downloads with multiple fallback strategies
 * Supports single file downloads and bulk downloads with progress tracking
 */
export const useFileDownload = () => {
  const [downloadingFiles, setDownloadingFiles] = useState(new Set());
  const [downloadProgress, setDownloadProgress] = useState({});

  /**
   * Download a single file with multiple fallback strategies
   */
  const downloadFile = useCallback(async (fileUrl, fileName, fileId = null) => {
    if (fileId) {
      setDownloadingFiles((prev) => new Set(prev).add(fileId));
    }

    // Get file information to determine best download strategy
    const fileInfo = getFileInfo(fileUrl, fileName);

    // Use the corrected filename if available
    const downloadFileName = fileInfo.actualFileName || fileName;

    try {
      // Strategy 1: Try with fetch and blob (most reliable for forcing downloads)
      try {
        const response = await fetch(fileUrl, {
          mode: "cors",
          cache: "no-cache",
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = downloadFileName;
          link.style.display = "none";

          // Force download attributes based on file type
          link.setAttribute("download", downloadFileName);
          link.setAttribute("type", fileInfo.mimeType);

          // For documents and archives, force download
          if (fileInfo.shouldForceDownload) {
            link.setAttribute("target", "_self");
            link.setAttribute("rel", "noopener noreferrer");
          }

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up
          window.URL.revokeObjectURL(url);

          await new Promise((resolve) => setTimeout(resolve, 300));
          return { success: true, method: "fetch-blob" };
        }
      } catch (error) {
        console.error("Strategy 1 (fetch-blob) failed:", error);
        // Continue to next strategy instead of throwing
      }

      // Strategy 1.5: Special handling for Firebase Storage URLs
      if (
        fileUrl.includes("firebasestorage.googleapis.com") ||
        fileUrl.includes("firebase")
      ) {
        try {
          // For Firebase Storage, try multiple approaches

          // Approach 1: Try with no-cors fetch
          try {
            const response = await fetch(fileUrl, {
              mode: "no-cors",
              cache: "no-cache",
            });

            if (response.type === "opaque") {
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);

              const link = document.createElement("a");
              link.href = url;
              link.download = downloadFileName;
              link.style.display = "none";

              // Force download attributes based on file type
              link.setAttribute("download", downloadFileName);
              link.setAttribute("type", fileInfo.mimeType);

              // For documents and archives, force download
              if (fileInfo.shouldForceDownload) {
                link.setAttribute("target", "_self");
                link.setAttribute("rel", "noopener noreferrer");
              }

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Clean up
              window.URL.revokeObjectURL(url);

              await new Promise((resolve) => setTimeout(resolve, 300));
              return { success: true, method: "firebase-no-cors-blob" };
            }
          } catch (error) {
            console.error("Firebase no-cors approach failed:", error);
          }

          // Approach 2: Try with modified URL parameters
          try {
            // Add download parameter to force download
            const modifiedUrl = fileUrl.includes("?")
              ? `${fileUrl}&download=${encodeURIComponent(downloadFileName)}`
              : `${fileUrl}?download=${encodeURIComponent(downloadFileName)}`;

            const link = document.createElement("a");
            link.href = modifiedUrl;
            link.download = downloadFileName;
            link.style.display = "none";
            link.setAttribute("download", downloadFileName);
            link.setAttribute("type", fileInfo.mimeType);
            link.setAttribute("target", "_self");

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            await new Promise((resolve) => setTimeout(resolve, 300));
            return { success: true, method: "firebase-modified-url" };
          } catch (error) {
            console.error("Firebase modified URL approach failed:", error);
          }

          // Approach 3: Try with XMLHttpRequest (often bypasses CORS)
          try {
            return new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("GET", fileUrl, true);
              xhr.responseType = "blob";

              xhr.onload = function () {
                if (this.status === 200) {
                  const blob = this.response;
                  const url = window.URL.createObjectURL(blob);

                  const link = document.createElement("a");
                  link.href = url;
                  link.download = downloadFileName;
                  link.style.display = "none";
                  link.setAttribute("download", downloadFileName);
                  link.setAttribute("type", fileInfo.mimeType);

                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);

                  // Clean up
                  window.URL.revokeObjectURL(url);

                  setTimeout(() => {
                    resolve({ success: true, method: "firebase-xhr-blob" });
                  }, 300);
                } else {
                  reject(new Error(`XHR failed with status: ${this.status}`));
                }
              };

              xhr.onerror = function () {
                reject(new Error("XHR request failed"));
              };

              xhr.send();
            });
          } catch (error) {
            console.error("Firebase XHR approach failed:", error);
          }
        } catch (error) {
          console.error("Strategy 1.5 (firebase-blob) failed:", error);
        }
      }

      // Strategy 1.6: Special handling for image files (PNG, JPG, etc.)
      if (fileInfo.isImage) {
        try {
          // For images from Firebase Storage, try canvas approach
          if (fileUrl.includes("firebasestorage.googleapis.com")) {
            try {
              const img = new Image();
              img.crossOrigin = "anonymous";

              return new Promise((resolve, reject) => {
                img.onload = function () {
                  try {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;

                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                      if (blob) {
                        const url = window.URL.createObjectURL(blob);

                        const link = document.createElement("a");
                        link.href = url;
                        link.download = downloadFileName;
                        link.style.display = "none";
                        link.setAttribute("download", downloadFileName);
                        link.setAttribute("type", fileInfo.mimeType);

                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // Clean up
                        window.URL.revokeObjectURL(url);

                        setTimeout(() => {
                          resolve({
                            success: true,
                            method: "firebase-image-canvas",
                          });
                        }, 300);
                      } else {
                        reject(new Error("Failed to create blob from canvas"));
                      }
                    }, fileInfo.mimeType);
                  } catch (error) {
                    reject(error);
                  }
                };

                img.onerror = function () {
                  // Try without CORS
                  img.crossOrigin = "";
                  img.src = fileUrl;
                };

                // Try to load image with CORS
                img.src = fileUrl;
              });
            } catch (error) {
              console.error("Firebase image canvas approach failed:", error);
            }
          }

          // For regular images, try standard canvas approach
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";

            return new Promise((resolve, reject) => {
              img.onload = function () {
                try {
                  const canvas = document.createElement("canvas");
                  canvas.width = img.width;
                  canvas.height = img.height;

                  const ctx = canvas.getContext("2d");
                  ctx.drawImage(img, 0, 0);

                  canvas.toBlob((blob) => {
                    if (blob) {
                      const url = window.URL.createObjectURL(blob);

                      const link = document.createElement("a");
                      link.href = url;
                      link.download = downloadFileName;
                      link.style.display = "none";
                      link.setAttribute("download", downloadFileName);
                      link.setAttribute("type", fileInfo.mimeType);

                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);

                      // Clean up
                      window.URL.revokeObjectURL(url);

                      setTimeout(() => {
                        resolve({ success: true, method: "canvas-blob" });
                      }, 300);
                    } else {
                      reject(new Error("Failed to create blob from canvas"));
                    }
                  }, fileInfo.mimeType);
                } catch (error) {
                  reject(error);
                }
              };

              img.onerror = function () {
                reject(new Error("Failed to load image"));
              };

              // Try to load image with CORS
              img.src = fileUrl;

              // Fallback: if image fails to load, try without CORS
              setTimeout(() => {
                if (!img.complete) {
                  img.crossOrigin = "";
                  img.src = fileUrl;
                }
              }, 1000);
            });
          } catch (error) {
            console.error("Strategy 1.6 (canvas-blob) failed:", error);
          }
        } catch (error) {
          console.error("Strategy 1.6 (canvas-blob) failed:", error);
        }
      }

      // Strategy 2: Try with no-cors fetch and blob
      try {
        const response = await fetch(fileUrl, {
          mode: "no-cors",
          cache: "no-cache",
        });

        if (response.type === "opaque") {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);

          const link = document.createElement("a");
          link.href = url;
          link.download = downloadFileName;
          link.style.display = "none";

          // Force download attributes based on file type
          link.setAttribute("download", downloadFileName);
          link.setAttribute("type", fileInfo.mimeType);

          // For documents and archives, force download
          if (fileInfo.shouldForceDownload) {
            link.setAttribute("target", "_self");
            link.setAttribute("rel", "noopener noreferrer");
          }

          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up
          window.URL.revokeObjectURL(url);

          await new Promise((resolve) => setTimeout(resolve, 300));
          return { success: true, method: "no-cors-blob" };
        }
      } catch (error) {
        console.error("Strategy 2 (no-cors-blob) failed:", error);
      }

      // Strategy 3: Try direct download with enhanced attributes (bypass CORS)
      try {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = downloadFileName;
        link.style.display = "none";

        // Force download by setting multiple attributes
        link.setAttribute("download", downloadFileName);
        link.setAttribute("type", fileInfo.mimeType);
        link.setAttribute("target", "_self"); // Prevent opening in new tab

        // For documents and archives, add additional attributes
        if (fileInfo.shouldForceDownload) {
          link.setAttribute("rel", "noopener noreferrer");
          link.setAttribute(
            "data-downloadurl",
            `${fileInfo.mimeType}:${downloadFileName}:${fileUrl}`,
          );
        }

        // Add event listeners to prevent default behavior
        link.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await new Promise((resolve) => setTimeout(resolve, 300));
        return { success: true, method: "enhanced-direct" };
      } catch (error) {
        console.error("Strategy 3 (enhanced-direct) failed:", error);
      }

      // Strategy 4: Try with XMLHttpRequest and blob (alternative to fetch)
      try {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", fileUrl, true);
          xhr.responseType = "blob";

          xhr.onload = function () {
            if (this.status === 200) {
              const blob = this.response;
              const url = window.URL.createObjectURL(blob);

              const link = document.createElement("a");
              link.href = url;
              link.download = downloadFileName;
              link.style.display = "none";

              // Force download attributes based on file type
              link.setAttribute("download", downloadFileName);
              link.setAttribute("type", fileInfo.mimeType);

              // For documents and archives, force download
              if (fileInfo.shouldForceDownload) {
                link.setAttribute("target", "_self");
                link.setAttribute("rel", "noopener noreferrer");
              }

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);

              // Clean up
              window.URL.revokeObjectURL(url);

              setTimeout(() => {
                resolve({ success: true, method: "xhr-blob" });
              }, 300);
            } else {
              reject(new Error(`XHR failed with status: ${this.status}`));
            }
          };

          xhr.onerror = function () {
            reject(new Error("XHR request failed"));
          };

          xhr.send();
        });
      } catch (error) {
        console.error("Strategy 4 (xhr-blob) failed:", error);
      }

      // Strategy 5: Try with iframe approach (for problematic files)
      try {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = fileUrl;

        // Add event listener to detect when iframe loads
        iframe.onload = () => {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        };

        document.body.appendChild(iframe);

        // Remove iframe after a delay
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 5000);

        return { success: true, method: "iframe" };
      } catch (error) {
        console.error("Strategy 5 (iframe) failed:", error);
      }

      // Strategy 5.5: Try with data URL approach
      try {
        // Convert file to base64 data URL
        const response = await fetch(fileUrl, { mode: "no-cors" });
        if (response.type === "opaque") {
          const blob = await response.blob();
          const reader = new FileReader();

          return new Promise((resolve, reject) => {
            reader.onload = function () {
              try {
                const dataUrl = reader.result;
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = downloadFileName;
                link.style.display = "none";

                // Force download attributes based on file type
                link.setAttribute("download", downloadFileName);
                link.setAttribute("type", fileInfo.mimeType);

                // For documents and archives, force download
                if (fileInfo.shouldForceDownload) {
                  link.setAttribute("target", "_self");
                  link.setAttribute("rel", "noopener noreferrer");
                }

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                setTimeout(() => {
                  resolve({ success: true, method: "data-url" });
                }, 300);
              } catch (error) {
                reject(error);
              }
            };

            reader.onerror = function () {
              reject(new Error("FileReader failed"));
            };

            reader.readAsDataURL(blob);
          });
        }
      } catch (error) {
        console.error("Strategy 5.5 (data-url) failed:", error);
      }

      // Strategy 6: Try with window.open and immediate close (aggressive approach)
      try {
        const newWindow = window.open(
          fileUrl,
          "_blank",
          "width=1,height=1,scrollbars=no,resizable=no",
        );
        if (newWindow) {
          // Close the window immediately to prevent it from staying open
          setTimeout(() => {
            newWindow.close();
          }, 100);

          // Try to trigger download after window closes
          setTimeout(async () => {
            try {
              const link = document.createElement("a");
              link.href = fileUrl;
              link.download = downloadFileName;
              link.style.display = "none";
              link.setAttribute("download", downloadFileName);
              link.setAttribute("type", fileInfo.mimeType);

              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (e) {
              console.error("Post-window download failed:", e);
            }
          }, 200);

          return { success: true, method: "window-open" };
        }
      } catch (error) {
        console.error("Strategy 6 (window-open) failed:", error);
      }

      // Strategy 6.5: Final Firebase Storage fallback - create direct download link
      if (fileUrl.includes("firebasestorage.googleapis.com")) {
        try {
          // Create a visible download button that forces download
          const downloadButton = document.createElement("button");
          downloadButton.textContent = `📥 Download ${downloadFileName}`;
          downloadButton.style.cssText = `
            display: block;
            margin: 20px auto;
            padding: 15px 20px;
            border: 3px solid #2563eb;
            border-radius: 10px;
            background-color: #dbeafe;
            color: #1e40af;
            text-decoration: none;
            font-weight: bold;
            text-align: center;
            max-width: 400px;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            cursor: pointer;
          `;

          // Add click handler for direct download
          downloadButton.onclick = (e) => {
            e.preventDefault();

            // Try multiple download approaches
            const approaches = [
              // Approach 1: Direct link with download attribute
              () => {
                const link = document.createElement("a");
                link.href = fileUrl;
                link.download = downloadFileName;
                link.style.display = "none";
                link.setAttribute("download", downloadFileName);
                link.setAttribute("type", fileInfo.mimeType);
                link.setAttribute("target", "_self");

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              },

              // Approach 2: Modified URL with download parameter
              () => {
                const modifiedUrl = fileUrl.includes("?")
                  ? `${fileUrl}&download=${encodeURIComponent(downloadFileName)}`
                  : `${fileUrl}?download=${encodeURIComponent(downloadFileName)}`;

                const link = document.createElement("a");
                link.href = modifiedUrl;
                link.download = downloadFileName;
                link.style.display = "none";
                link.setAttribute("download", downloadFileName);
                link.setAttribute("type", fileInfo.mimeType);
                link.setAttribute("target", "_self");

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              },

              // Approach 3: Open in new tab and close immediately
              () => {
                const newTab = window.open(fileUrl, "_blank");
                if (newTab) {
                  setTimeout(() => newTab.close(), 100);
                }
              },
            ];

            // Try each approach
            approaches.forEach((approach, index) => {
              setTimeout(() => {
                try {
                  approach();
                } catch (error) {
                  console.error(
                    `Download approach ${index + 1} failed:`,
                    error,
                  );
                }
              }, index * 200);
            });

            // Show user instructions
            alert(
              `Download initiated! If the file doesn't download automatically:\n\n1. Right-click on this button\n2. Select "Save link as..."\n3. Choose your download location\n4. Click Save`,
            );
          };

          // Add hover effect
          downloadButton.onmouseenter = () => {
            downloadButton.style.backgroundColor = "#bfdbfe";
            downloadButton.style.transform = "scale(1.02)";
          };

          downloadButton.onmouseleave = () => {
            downloadButton.style.backgroundColor = "#dbeafe";
            downloadButton.style.transform = "scale(1)";
          };

          document.body.appendChild(downloadButton);

          // Remove button after 30 seconds
          setTimeout(() => {
            if (document.body.contains(downloadButton)) {
              document.body.removeChild(downloadButton);
            }
          }, 30000);

          return {
            success: false,
            method: "firebase-direct-link",
            message:
              "Firebase Storage direct download link created - click the blue button above to download",
          };
        } catch (error) {
          console.error("Strategy 6.5 (firebase-direct-link) failed:", error);
        }
      }

      // Strategy 7: Final fallback - create manual download link with instructions
      const manualLink = document.createElement("a");
      manualLink.href = fileUrl;
      manualLink.download = downloadFileName;
      manualLink.textContent = `📥 Download ${downloadFileName}`;
      manualLink.style.cssText = `
        display: block;
        margin: 20px auto;
        padding: 15px 20px;
        border: 3px solid #e53e3e;
        border-radius: 10px;
        background-color: #fed7d7;
        color: #c53030;
        text-decoration: none;
        font-weight: bold;
        text-align: center;
        max-width: 400px;
        font-size: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        cursor: pointer;
      `;

      // Add click handler for manual download
      manualLink.onclick = (e) => {
        e.preventDefault();

        // Try one more time with the manual link
        const tempLink = document.createElement("a");
        tempLink.href = fileUrl;
        tempLink.download = downloadFileName;
        tempLink.style.display = "none";
        tempLink.setAttribute("download", downloadFileName);
        tempLink.setAttribute("type", fileInfo.mimeType);

        // For documents and archives, force download
        if (fileInfo.shouldForceDownload) {
          tempLink.setAttribute("target", "_self");
          tempLink.setAttribute("rel", "noopener noreferrer");
        }

        document.body.appendChild(tempLink);
        tempLink.click();
        document.body.removeChild(tempLink);

        // Show user instructions
        alert(
          `If the file still doesn't download automatically:\n\n1. Right-click on this link\n2. Select "Save link as..."\n3. Choose your download location\n4. Click Save`,
        );
      };

      // Add hover effect
      manualLink.onmouseenter = () => {
        manualLink.style.backgroundColor = "#feb2b2";
        manualLink.style.transform = "scale(1.02)";
      };

      manualLink.onmouseleave = () => {
        manualLink.style.backgroundColor = "#fed7d7";
        manualLink.style.transform = "scale(1)";
      };

      document.body.appendChild(manualLink);

      // Remove manual link after 30 seconds
      setTimeout(() => {
        if (document.body.contains(manualLink)) {
          document.body.removeChild(manualLink);
        }
      }, 30000);

      return {
        success: false,
        method: "manual",
        message:
          "Manual download link created - click the red button above to download",
      };
    } catch (error) {
      console.error("All download strategies failed:", error);
      return { success: false, method: "failed", error: error.message };
    } finally {
      if (fileId) {
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
  }, []);

  /**
   * Download multiple files with progress tracking
   */
  const downloadMultipleFiles = useCallback(
    async (files, staggerDelay = 200) => {
      const results = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = file.id || `${file.fileUrl}-${i}`;

        // Update progress
        setDownloadProgress((prev) => ({
          ...prev,
          [fileId]: { status: "downloading", progress: 0 },
        }));

        try {
          const result = await downloadFile(
            file.fileUrl,
            file.fileName,
            fileId,
          );

          results.push({ ...file, ...result });

          // Update progress to completed
          setDownloadProgress((prev) => ({
            ...prev,
            [fileId]: { status: "completed", progress: 100 },
          }));

          // Stagger downloads to prevent browser blocking
          if (i < files.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, staggerDelay));
          }
        } catch (error) {
          console.error(`Failed to download ${file.fileName}:`, error);
          results.push({ ...file, success: false, error: error.message });

          // Update progress to failed
          setDownloadProgress((prev) => ({
            ...prev,
            [fileId]: { status: "failed", progress: 0, error: error.message },
          }));
        }
      }

      return results;
    },
    [downloadFile],
  );

  /**
   * Download selected files from a set of file IDs
   */
  const downloadSelectedFiles = useCallback(
    async (allFiles, selectedFileIds, staggerDelay = 200) => {
      // Ensure selectedFileIds is a Set or convert it
      const selectedIds =
        selectedFileIds instanceof Set
          ? selectedFileIds
          : new Set(selectedFileIds);

      const selectedFiles = allFiles.filter((_, index) =>
        selectedIds.has(index),
      );
      return await downloadMultipleFiles(selectedFiles, staggerDelay);
    },
    [downloadMultipleFiles],
  );

  /**
   * Download all files
   */
  const downloadAllFiles = useCallback(
    async (allFiles, staggerDelay = 200) => {
      return await downloadMultipleFiles(allFiles, staggerDelay);
    },
    [downloadMultipleFiles],
  );

  /**
   * Check if a specific file is currently downloading
   */
  const isDownloading = useCallback(
    (fileId) => {
      return downloadingFiles.has(fileId);
    },
    [downloadingFiles],
  );

  /**
   * Get download progress for a specific file
   */
  const getDownloadProgress = useCallback(
    (fileId) => {
      return downloadProgress[fileId] || { status: "idle", progress: 0 };
    },
    [downloadProgress],
  );

  /**
   * Clear all download progress
   */
  const clearDownloadProgress = useCallback(() => {
    setDownloadProgress({});
    setDownloadingFiles(new Set());
  }, []);

  return {
    // State
    downloadingFiles,
    downloadProgress,

    // Actions
    downloadFile,
    downloadMultipleFiles,
    downloadSelectedFiles,
    downloadAllFiles,

    // Utilities
    isDownloading,
    getDownloadProgress,
    clearDownloadProgress,

    // Derived state
    hasActiveDownloads: downloadingFiles.size > 0,
    totalDownloads: downloadingFiles.size,
  };
};

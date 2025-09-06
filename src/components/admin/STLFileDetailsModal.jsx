"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { BoxCubeIcon, DownloadIcon } from "@/icons";
import { FaCalendar } from "react-icons/fa";

const STLFileDetailsModal = ({ isOpen, onClose, patient, stlFile }) => {
  if (!stlFile || !stlFile.uploaded) {
    return null;
  }

  const handleDownload = () => {
    if (!stlFile.file?.url) return;

    // Open file in new tab
    window.open(stlFile.file.url, "_blank");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="max-h-[95vh] overflow-y-auto p-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
            <BoxCubeIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            STL File Details
          </h2>
        </div>

        {/* Patient Info Card */}
        <div className="mb-6 rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-4 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
              <span className="text-sm font-semibold text-white">
                {patient?.patientName?.charAt(0) || "P"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {patient?.patientName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Case ID: {patient?.caseId}
              </p>
            </div>
          </div>
        </div>

        {/* File Details */}
        <div className="space-y-6">
          {/* File Information */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex flex-col items-center space-y-3 rounded-lg bg-gray-50 p-6 dark:bg-gray-800">
                <Button
                  onClick={handleDownload}
                  disabled={!stlFile.file?.url}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 text-white shadow-lg transition-all duration-300 hover:from-green-600 hover:to-emerald-700"
                >
                  <div className="flex items-center space-x-2">
                    <DownloadIcon className="h-4 w-4" />
                    <span>View STL File</span>
                  </div>
                </Button>

                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <FaCalendar className="h-4 w-4" />
                  <span>Uploaded on {formatDate(stlFile.uploadedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          {stlFile.comment && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Description
              </h3>
              <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div
                  className="prose prose-sm max-w-none text-sm text-gray-700 dark:text-gray-300"
                  dangerouslySetInnerHTML={{ __html: stlFile.comment }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-6"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default STLFileDetailsModal;

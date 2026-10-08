"use client";
import { memo, useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Modal } from "@/components/ui/modal";
import PatientLatestComment from "@/components/shared/patients/PatientLatestComment";
import {
  formatDateIST,
  getCaseStatusClass,
  isCaseExpired,
} from "@/utils/patientCase";

const DetailItem = ({ label, children }) => (
  <div className="flex flex-col gap-1 rounded-lg bg-white/70 p-3 dark:bg-gray-800/50">
    <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {label}
    </dt>
    <dd className="text-sm font-semibold break-words text-gray-800 dark:text-gray-100">
      {children}
    </dd>
  </div>
);

export const PatientSummaryActionGroup = ({ label, children }) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
      {label}
    </span>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

const getPatientDetails = (patient) => {
  const isExpired = isCaseExpired(patient);
  return [
    { label: "Case ID", value: patient.caseId ?? "N/A" },
    { label: "Patient Name", value: patient.patientName ?? "N/A" },
    { label: "Country", value: patient.country || "N/A" },
    {
      label: "Case Status",
      value: (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${getCaseStatusClass(
            patient.caseStatus,
          )}`}
        >
          {patient.caseStatus || "Not specified"}
        </span>
      ),
    },
    { label: "Doctor Name", value: patient.userId?.name ?? "N/A" },
    { label: "Planner Name", value: patient.plannerId?.name ?? "Not assigned" },
    { label: "Case Date", value: formatDateIST(patient.createdAt) },
    {
      label: "Expiry",
      value: (
        <span className="inline-flex flex-wrap items-center gap-2">
          {formatDateIST(patient.caseEndDate)}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isExpired
                ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
            }`}
          >
            {isExpired ? "Expired" : "Active"}
          </span>
        </span>
      ),
    },
    {
      label: "Location",
      value: [patient.city, patient.state].filter(Boolean).join(", ") || "N/A",
    },
    {
      label: "Gender / Age",
      value: `${patient.gender || "N/A"} / ${patient.age ?? "N/A"}`,
    },
    { label: "Case Type", value: patient.caseType || "N/A" },
    { label: "Case Category", value: patient.caseCategory || "N/A" },
    {
      label: "STL File",
      value: patient.stlFile?.uploaded ? "Uploaded" : "Pending",
    },
  ];
};

/**
 * @param {Object} props
 * @param {Object|null} props.patient - modal is open while a patient is set
 * @param {() => void} props.onClose
 * @param {() => void} [props.onViewAllComments]
 * @param {Array<{label: string, value: React.ReactNode}>} [props.extraDetails]
 * @param {React.ReactNode} [props.children] - role-specific actions
 */
const PatientSummaryModal = ({
  patient,
  onClose,
  onViewAllComments,
  extraDetails = [],
  children,
}) => {
  const closeButtonRef = useRef(null);
  const isOpen = !!patient;

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  if (!patient) return null;

  const details = [...getPatientDetails(patient), ...extraDetails];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="mx-auto w-full max-w-3xl"
      showCloseButton={false}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-summary-title"
        className="flex max-h-[90vh] flex-col rounded-3xl border border-white/20 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 p-4 sm:p-6 dark:border-gray-700/50">
          <div className="min-w-0">
            <h2
              id="patient-summary-title"
              className="truncate text-xl font-extrabold tracking-tight text-blue-800 sm:text-2xl dark:text-white/90"
            >
              {patient.patientName}
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              Case ID: {patient.caseId ?? "N/A"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close patient summary"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors duration-200 hover:bg-gray-200 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col gap-6 overflow-y-auto p-4 sm:p-6">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {details.map(({ label, value }) => (
              <DetailItem key={label} label={label}>
                {value}
              </DetailItem>
            ))}
          </dl>

          <PatientLatestComment
            patientId={patient._id}
            onViewAll={onViewAllComments}
          />

          {children && (
            <section
              aria-labelledby="patient-summary-actions"
              className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white/70 p-4 dark:border-gray-700 dark:bg-gray-800/50"
            >
              <h3
                id="patient-summary-actions"
                className="text-sm font-semibold text-blue-800 dark:text-blue-200"
              >
                Actions
              </h3>
              {children}
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default memo(PatientSummaryModal);

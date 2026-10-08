export const isCaseExpired = (patient) =>
  !!patient?.caseEndDate && new Date(patient.caseEndDate) < new Date();

export const formatDateIST = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  });
};

export const formatDateTimeIST = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
};

const CASE_STATUS_CLASSES = {
  approved:
    "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300",
  rejected:
    "border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-300",
  "approval pending":
    "border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
  "setup pending":
    "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-300",
  modify:
    "border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
};

const DEFAULT_CASE_STATUS_CLASS =
  "border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/20 dark:text-slate-400";

export const getCaseStatusClass = (caseStatus) =>
  CASE_STATUS_CLASSES[caseStatus] ?? DEFAULT_CASE_STATUS_CLASS;

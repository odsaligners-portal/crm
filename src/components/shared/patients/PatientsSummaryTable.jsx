"use client";
import { memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EyeIcon } from "@/icons";
import { getCaseStatusClass } from "@/utils/patientCase";

const HEADER_CELL_CLASS =
  "px-3 py-2 font-semibold text-blue-700 subpixel-antialiased dark:text-blue-200";

const COLUMNS = ["Case ID", "Patient Name", "Country", "Case Status", "View"];

const getDefaultRowClassName = (patient, idx) => {
  if (patient.modification?.commentSubmitted) {
    return "border-l-4 border-yellow-400 bg-yellow-50/80 dark:border-yellow-500 dark:bg-yellow-900/20";
  }
  return idx % 2 === 1
    ? "bg-blue-50/50 dark:bg-gray-900/30"
    : "bg-white/70 dark:bg-gray-900/50";
};

/**
 * @param {Object} props
 * @param {Array<Object>} props.patients
 * @param {(patient: Object) => void} props.onView
 * @param {(patient: Object, idx: number) => string} [props.getRowClassName]
 */
const PatientsSummaryTable = ({ patients, onView, getRowClassName }) => {
  const resolveRowClassName = getRowClassName ?? getDefaultRowClassName;

  return (
    <Table className="relative z-10 mx-auto min-w-full font-sans text-xs">
      <TableHeader>
        <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
          {COLUMNS.map((column) => (
            <TableCell key={column} isHeader className={HEADER_CELL_CLASS}>
              {column}
            </TableCell>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient, idx) => (
          <TableRow
            key={patient._id}
            className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${resolveRowClassName(
              patient,
              idx,
            )} animate-fadeInUp h-12 items-center`}
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <TableCell className="px-3 py-2 text-center font-semibold text-blue-600 subpixel-antialiased dark:text-blue-300">
              {patient.caseId ?? "N/A"}
            </TableCell>
            <TableCell className="px-3 py-2 text-center font-medium text-gray-800 dark:text-gray-200">
              <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
                {patient.patientName}
                {patient.modification?.commentSubmitted && (
                  <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                    Modified
                  </span>
                )}
              </span>
            </TableCell>
            <TableCell className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">
              {patient.country || "N/A"}
            </TableCell>
            <TableCell className="px-3 py-2 text-center">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap capitalize ${getCaseStatusClass(
                  patient.caseStatus,
                )}`}
              >
                {patient.caseStatus || "Not specified"}
              </span>
            </TableCell>
            <TableCell className="px-3 py-2 text-center">
              <button
                type="button"
                onClick={() => onView(patient)}
                aria-label={`View summary for ${patient.patientName}`}
                title="View"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-300 bg-white text-blue-600 shadow-sm transition-all duration-200 ease-in-out hover:scale-105 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none active:scale-95 sm:h-9 sm:w-9 dark:border-blue-700 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-blue-900/40"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default memo(PatientsSummaryTable);

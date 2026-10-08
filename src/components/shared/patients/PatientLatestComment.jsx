"use client";
import { memo } from "react";
import useLatestPatientComment from "@/hooks/useLatestPatientComment";
import { formatDateTimeIST } from "@/utils/patientCase";

const CommentSkeleton = () => (
  <div className="animate-pulse space-y-2" aria-hidden="true">
    <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
    <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
    <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);

/**
 * @param {Object} props
 * @param {string} props.patientId
 * @param {() => void} [props.onViewAll]
 */
const PatientLatestComment = ({ patientId, onViewAll }) => {
  const { latestComment, isLoading, error } =
    useLatestPatientComment(patientId);

  const renderBody = () => {
    if (isLoading) return <CommentSkeleton />;
    if (error) {
      return (
        <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
          {error}
        </p>
      );
    }
    if (!latestComment) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No comments yet for this patient.
        </p>
      );
    }
    return (
      <>
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white">
            {latestComment.commentedBy?.name ?? "Unknown"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDateTimeIST(latestComment.datetime)}
          </p>
        </div>
        <div
          className="prose prose-sm dark:prose-invert line-clamp-4 max-w-none text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: latestComment.comment }}
        />
      </>
    );
  };

  return (
    <section
      aria-labelledby="latest-comment-heading"
      className="rounded-xl border border-gray-200 bg-white/70 p-4 dark:border-gray-700 dark:bg-gray-800/50"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3
          id="latest-comment-heading"
          className="text-sm font-semibold text-blue-800 dark:text-blue-200"
        >
          Last Comment
        </h3>
        {onViewAll && latestComment && (
          <button
            type="button"
            onClick={onViewAll}
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors duration-200 hover:bg-blue-50 focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:outline-none dark:text-blue-300 dark:hover:bg-blue-900/40"
          >
            View all
          </button>
        )}
      </div>
      {renderBody()}
    </section>
  );
};

export default memo(PatientLatestComment);

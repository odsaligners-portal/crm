"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function ViewAllComments() {
  const { token } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const dispatch = useDispatch();

  const fetchPatientComments = async () => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithError("/api/doctor/comments", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComments(data.comments || []);
    } catch (error) {
      // fetchWithError already toasts
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (token) {
      fetchPatientComments();
    }
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
          All Patient Comments
        </h1>
        <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
          A complete log of all comments for your patients.
        </p>
      </div>

      <div className="mb-8 h-2 w-full rounded-full bg-gradient-to-r from-blue-200 via-white to-blue-100 opacity-60 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800" />

      <div className="relative mx-auto w-full max-w-7xl overflow-x-auto rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md sm:overflow-x-visible dark:bg-gray-900/80">
        <Table className="relative z-10 mx-auto min-w-full font-sans text-xs">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 rounded-t-xl border-b-2 border-blue-200 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 shadow-lg backdrop-blur-sm dark:border-blue-900 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90">
              <TableCell
                isHeader
                className="p-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                S.N.
              </TableCell>
              <TableCell
                isHeader
                className="p-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Case ID
              </TableCell>
              <TableCell
                isHeader
                className="p-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Patient Name
              </TableCell>
              <TableCell
                isHeader
                className="w-2/5 p-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Comment
              </TableCell>
              <TableCell
                isHeader
                className="p-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Comment By
              </TableCell>
              <TableCell
                isHeader
                className="p-2 font-semibold text-blue-700 dark:text-blue-200"
              >
                Date
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment, idx) => (
              <TableRow
                key={comment._id || idx}
                className={`group transition-all duration-300 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? "bg-blue-50/50 dark:bg-gray-900/30" : "bg-white/70 dark:bg-gray-900/50"} animate-fadeInUp`}
              >
                <TableCell className="p-2 text-center align-middle font-medium text-gray-700 dark:text-gray-300">
                  {idx + 1}
                </TableCell>
                <TableCell className="p-2 text-center align-middle font-semibold text-blue-600 dark:text-blue-300">
                  {comment.caseId}
                </TableCell>
                <TableCell className="p-2 text-center align-middle font-medium">
                  {comment.patientName}
                </TableCell>
                <TableCell className="p-2 align-middle text-gray-800 dark:text-gray-200">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: (comment.comment || "").replace(
                        /<a /g,
                        '<a target="_blank" rel="noopener noreferrer" ',
                      ),
                    }}
                  />
                </TableCell>
                <TableCell className="p-2 text-center align-middle font-medium">
                  {comment.commentedBy?.name == "Doctor"
                    ? "You"
                    : comment.commentedBy?.name || "N/A"}
                </TableCell>
                <TableCell className="p-2 text-center align-middle font-medium">
                  {formatDate(comment.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg
            width="120"
            height="120"
            fill="none"
            className="mb-6 opacity-60"
            viewBox="0 0 120 120"
          >
            <path
              d="M60 6.5c-29.7 0-53.5 24.2-53.5 54s23.8 54 53.5 54 53.5-24.2 53.5-54-23.8-54-53.5-54zm0 100c-25.3 0-46-20.7-46-46s20.7-46 46-46 46 20.7 46 46-20.7 46-46 46z"
              fill="#e0e7ff"
            />
            <path
              d="M72.5 45.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3zM72.5 60.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3zM72.5 75.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3z"
              fill="#a5b4fc"
            />
            <text
              x="50%"
              y="90%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontSize="12"
              fill="#4338ca"
              className="font-semibold"
            >
              No comments found
            </text>
          </svg>
          <div className="mb-2 text-2xl font-semibold text-blue-700 dark:text-blue-200">
            No Comments Found
          </div>
          <p className="mb-6 text-gray-500">
            There are no comments associated with your patients yet.
          </p>
        </div>
      )}
    </div>
  );
}

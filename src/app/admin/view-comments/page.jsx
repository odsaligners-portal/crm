"use client";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function ViewAllCommentsAdmin() {
  const { token } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/comments', { // Use the new admin route
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllComments();
    }
  }, [token]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading All Comments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
          All Comments
        </h1>
        <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
          A complete log of all comments from all users.
        </p>
      </div>

      <div className="h-2 w-full bg-gradient-to-r from-blue-200 via-white to-blue-100 dark:from-blue-900 dark:via-gray-900 dark:to-blue-800 rounded-full mb-8 opacity-60" />

      <div className="relative rounded-xl border border-transparent bg-white/90 dark:bg-gray-900/80 shadow-xl mx-auto max-w-7xl w-full backdrop-blur-md overflow-x-auto sm:overflow-x-visible">
        <Table className="min-w-full text-xs font-sans mx-auto relative z-10">
          <TableHeader>
            <TableRow className="sticky top-0 z-20 bg-gradient-to-r from-blue-100/90 via-white/90 to-blue-200/90 dark:from-blue-900/90 dark:via-gray-900/90 dark:to-blue-800/90 shadow-lg rounded-t-xl border-b-2 border-blue-200 dark:border-blue-900 backdrop-blur-sm">
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 p-2">S.N.</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 p-2">Case ID</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 p-2">Patient Name</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 p-2 w-2/5">Comment</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 p-2">Comment By</TableCell>
              <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 p-2">Date</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.map((comment, idx) => (
              <TableRow
                key={comment._id || idx}
                className={`transition-all duration-300 group hover:bg-blue-100/70 dark:hover:bg-blue-900/40 ${idx % 2 === 1 ? 'bg-blue-50/50 dark:bg-gray-900/30' : 'bg-white/70 dark:bg-gray-900/50'} animate-fadeInUp`}
              >
                <TableCell className="font-medium text-gray-700 dark:text-gray-300 text-center p-2 align-middle">{idx + 1}</TableCell>
                <TableCell className="font-semibold text-blue-600 dark:text-blue-300 text-center p-2 align-middle">{comment.caseId}</TableCell>
                <TableCell className="font-medium text-center p-2 align-middle">{comment.patientName}</TableCell>
                <TableCell className="p-2 text-gray-800 dark:text-gray-200 align-middle">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: (comment.comment || '').replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ') }}
                  />
                </TableCell>
                <TableCell className="font-medium text-center p-2 align-middle">
                  {comment.commentedBy?.userType === 'admin' ? 'You' : comment.commentedBy?.name || 'N/A'}
                </TableCell>
                <TableCell className="font-medium text-center p-2 align-middle">{formatDate(comment.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {comments.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg width="120" height="120" fill="none" className="mb-6 opacity-60" viewBox="0 0 120 120"><path d="M60 6.5c-29.7 0-53.5 24.2-53.5 54s23.8 54 53.5 54 53.5-24.2 53.5-54-23.8-54-53.5-54zm0 100c-25.3 0-46-20.7-46-46s20.7-46 46-46 46 20.7 46 46-20.7 46-46 46z" fill="#e0e7ff"/><path d="M72.5 45.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3zM72.5 60.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3zM72.5 75.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3z" fill="#a5b4fc"/><text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#4338ca" className="font-semibold">No comments found</text></svg>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">No Comments Found</div>
          <p className="text-gray-500 mb-6">There are no comments in the system yet.</p>
        </div>
      )}
    </div>
  );
} 
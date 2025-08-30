"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MdAdd,
  MdVisibility,
  MdPerson,
  MdDescription,
  MdCalendarToday,
  MdClose,
  MdSearch,
  MdEdit,
  MdDelete,
} from "react-icons/md";
import SpecialCommentModal from "@/components/admin/special-comments/SpecialCommentModal";

export default function SpecialCommentsPage() {
  const { token, user, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // Function to fetch only the unread count
  const fetchUnreadCount = async () => {
    try {
      const unreadData = await fetchWithError(
        `/api/admin/special-comments/unread-count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTotalUnread(unreadData.totalUnread || 0);
    } catch (error) {
      // fetchWithError handles toast
    }
  };

  // Check if user can create, edit, or delete Production Comments
  useEffect(() => {
    const checkAccess = async () => {
      if (token) {
        try {
          const data = await fetchWithError("/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Super admin can always do everything, or admin with Production Comment access
          if (role === "super-admin" || data.user?.specialCommentAccess) {
            setCanCreate(true);
            setCanEdit(true);
            setCanDelete(true);
          }
        } catch (error) {
          // fetchWithError handles toast
        }
      }
    };

    checkAccess();
  }, [token, role]);

  const fetchComments = async (page = 1) => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithError(
        `/api/admin/special-comments?page=${page}&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setComments(data.comments || []);
      setPagination(data.pagination || {});

      // Fetch total unread count
      fetchUnreadCount();
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (token) {
      fetchComments(currentPage);
    }
  }, [token, currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleCreateComment = async (commentData) => {
    try {
      // Remove doctorId as it's now fetched automatically from patient
      const { doctorId, ...commentDataWithoutDoctor } = commentData;

      await fetchWithError("/api/admin/special-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentDataWithoutDoctor),
      });

      toast.success("Production Comment created successfully");
      setIsModalOpen(false);
      fetchComments(1); // Refresh first page and unread count
      setCurrentPage(1);
    } catch (error) {
      // fetchWithError handles toast
    }
  };

  const handleEditComment = async (commentData) => {
    try {
      // Remove doctorId as it's now fetched automatically from patient
      const { doctorId, ...commentDataWithoutDoctor } = commentData;

      await fetchWithError(
        `/api/admin/special-comments/edit?id=${selectedComment._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(commentDataWithoutDoctor),
        },
      );

      toast.success("Production Comment updated successfully");
      setIsEditModalOpen(false);
      setSelectedComment(null);
      fetchComments(currentPage); // Refresh current page and unread count
    } catch (error) {
      // fetchWithError handles toast
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      await fetchWithError(
        `/api/admin/special-comments/edit?id=${commentToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      toast.success("Production Comment deleted successfully");
      setIsDeleteModalOpen(false);
      setCommentToDelete(null);
      fetchComments(currentPage); // Refresh current page and unread count
    } catch (error) {
      // fetchWithError handles toast
    }
  };

  const handleViewComment = async (comment) => {
    setSelectedComment(comment);
    setIsViewModalOpen(true);

    // Mark as read if not already read
    if (!isCommentReadByUser(comment)) {
      try {
        await fetchWithError("/api/admin/special-comments", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ commentId: comment._id }),
        });

        // Update local state to mark as read
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === comment._id) {
              // Update the readBy array to mark current user as having read it
              const updatedReadBy = c.readBy.map((reader) =>
                reader.adminId === user?.id
                  ? { ...reader, readAt: new Date() }
                  : reader,
              );
              return { ...c, readBy: updatedReadBy };
            }
            return c;
          }),
        );

        // Refresh total unread count
        fetchUnreadCount();
      } catch (error) {
        // fetchWithError handles toast
      }
    }
  };

  const handleEditClick = (comment) => {
    setSelectedComment(comment);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setIsDeleteModalOpen(true);
  };

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

  const getStatusBadge = (isRead) => {
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          isRead
            ? "border border-green-200 bg-green-100 text-green-800"
            : "border border-yellow-200 bg-yellow-100 text-yellow-800"
        }`}
      >
        {isRead ? "✓ Read" : "● Unread"}
      </span>
    );
  };

  // Helper function to check if comment is read by current user
  const isCommentReadByUser = (comment) => {
    if (!comment.readBy || !Array.isArray(comment.readBy)) return false;
    return comment.readBy.some(
      (reader) => reader.adminId === user?.id && reader.readAt !== null,
    );
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "").substring(0, 100) + "...";
  };

  return (
    <div className="mx-auto">
      {/* Header Section */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:from-gray-800 dark:to-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Production Comments
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Important comments visible to all administrators
            </p>
          </div>

          {canCreate && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl"
            >
              <MdAdd className="text-xl" />
              Add Production Comment
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <MdDescription className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Comments
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {pagination.totalItems || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
              <MdVisibility className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unread
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {totalUnread}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-700">
                <TableCell className="px-6 py-4 font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                  Patient
                </TableCell>
                <TableCell className="px-6 py-4 font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                  Doctor
                </TableCell>
                <TableCell className="px-6 py-4 font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                  Status
                </TableCell>
                <TableCell className="px-6 py-4 font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                  Read Time
                </TableCell>
                <TableCell className="px-6 py-4 font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                  Created
                </TableCell>
                <TableCell className="px-6 py-4 font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <MdDescription className="mb-4 h-12 w-12 text-gray-400" />
                      <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                        No Production Comments found
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Create your first Production Comment to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                comments.map((comment, index) => (
                  <TableRow
                    key={comment._id}
                    className={`transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50/50 dark:bg-gray-700/50"
                    }`}
                  >
                    <TableCell className="px-6 py-4">
                      {comment.patientName ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {comment.patientName}
                          </div>
                          <div className="text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                            Case ID: {comment.patientId?.caseId || "N/A"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {comment.doctorName ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {comment.doctorName}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">
                          -
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(isCommentReadByUser(comment))}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const currentUserRead = comment.readBy?.find(
                          (reader) => reader.adminId === user?.id,
                        );
                        if (currentUserRead?.readAt) {
                          return (
                            <div className="text-sm text-green-600 dark:text-green-400">
                              {formatDate(currentUserRead.readAt)}
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-sm text-yellow-600 dark:text-yellow-400">
                              Not read yet
                            </div>
                          );
                        }
                      })()}
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                          <MdCalendarToday className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleViewComment(comment)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
                        >
                          <MdDescription className="h-4 w-4" />
                          View
                        </Button>
                        {canEdit && (
                          <Button
                            onClick={() => handleEditClick(comment)}
                            variant="outline"
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200"
                          >
                            <MdEdit className="h-4 w-4" />
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            onClick={() => handleDeleteClick(comment)}
                            variant="outline"
                            className="inline-flex items-center gap-2 rounded-lg border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition-colors duration-200 hover:border-red-300 hover:bg-red-50"
                          >
                            <MdDelete className="h-4 w-4" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {(pagination.currentPage - 1) * 5 + 1} to{" "}
                {Math.min(pagination.currentPage * 5, pagination.totalItems)} of{" "}
                {pagination.totalItems} results
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  variant="outline"
                  className="px-4 py-2 text-sm font-medium"
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNext}
                  variant="outline"
                  className="px-4 py-2 text-sm font-medium"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Comment Modal */}
      <SpecialCommentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateComment}
        mode="create"
      />

      {/* Edit Comment Modal */}
      <SpecialCommentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedComment(null);
        }}
        onSubmit={handleEditComment}
        mode="edit"
        comment={selectedComment}
      />

      {/* View Comment Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        size="4xl"
      >
        {selectedComment && (
          <div className="relative rounded-xl">
            {/* Header */}
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-8 py-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {selectedComment.title}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <MdPerson className="h-4 w-4 text-blue-500" />
                      <span>By: {selectedComment.createdByName}</span>
                    </div>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <MdCalendarToday className="h-4 w-4 text-green-500" />
                      <span>{formatDate(selectedComment.createdAt)}</span>
                    </div>
                    {selectedComment.patientName && (
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-blue-500">●</span>
                        <span>Patient: {selectedComment.patientName}</span>
                        {selectedComment.patientId?.caseId && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            (Case ID: {selectedComment.patientId.caseId})
                          </span>
                        )}
                      </div>
                    )}
                    {selectedComment.doctorName && (
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-green-500">●</span>
                        <span>Doctor: {selectedComment.doctorName}</span>
                        {selectedComment.doctorId?.email && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({selectedComment.doctorId.email})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Comment Content */}
            <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div
                  className="rounded-xl border border-gray-200 bg-gray-50 p-8 dark:border-gray-700 dark:bg-gray-800"
                  dangerouslySetInnerHTML={{ __html: selectedComment.comment }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white px-8 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(() => {
                    const currentUserRead = selectedComment.readBy?.find(
                      (reader) => reader.adminId === user?.id,
                    );
                    if (currentUserRead?.readAt) {
                      return (
                        <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                          <MdVisibility className="h-4 w-4" />
                          Read at: {formatDate(currentUserRead.readAt)}
                        </span>
                      );
                    } else {
                      return (
                        <span className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                          <MdVisibility className="h-4 w-4" />
                          Marked as read when opened
                        </span>
                      );
                    }
                  })()}
                </div>
                <Button
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-gray-600 text-white hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <div className="p-6">
          <div className="mb-6 text-center">
            <MdDelete className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
              Delete Production Comment
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Are you sure you want to delete this Production Comment? This
              action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteComment}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

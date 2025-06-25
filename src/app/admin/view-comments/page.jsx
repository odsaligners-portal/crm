"use client";
import ConfirmationModal from '@/components/common/ConfirmationModal';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { setLoading } from "@/store/features/uiSlice";
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function ViewAllCommentsAdmin() {
  const { token } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [hasCommentUpdateAccess, setHasCommentUpdateAccess] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [commentToEdit, setCommentToEdit] = useState(null);
  const [editDescription, setEditDescription] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const dispatch = useDispatch();

  const fetchAllComments = async () => {
    dispatch(setLoading(true));
    try {
      const data = await fetchWithError('/api/admin/comments', { // Use the new admin route
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setComments(data.comments || []);
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllComments();
      // Fetch access rights
      const fetchAccess = async () => {
        dispatch(setLoading(true));
        try {
          const data = await fetchWithError('/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });
          setHasCommentUpdateAccess(!!data.user?.commentUpdateAccess);
        } catch (err) {
          setHasCommentUpdateAccess(false);
          // fetchWithError will handle toast
        } finally {
          dispatch(setLoading(false));
        }
      };
      fetchAccess();
    }
  }, [token, dispatch]);

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

  const handleDeleteComment = async (commentId) => {
    setCommentToDelete(commentId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    dispatch(setLoading(true));
    try {
      await fetchWithError(`/api/admin/comments?id=${commentToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => prev.filter((c) => c._id !== commentToDelete));
      toast.success('Comment deleted successfully.');
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      setIsDeleteModalOpen(false);
      setCommentToDelete(null);
      dispatch(setLoading(false));
    }
  };

  const handleEditComment = (comment) => {
    setCommentToEdit(comment);
    setEditDescription(comment.comment);
    setEditorKey(prev => prev + 1); // force re-mount
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editDescription.trim()) {
      toast.error('Comment cannot be empty.');
      return;
    }
    dispatch(setLoading(true));
    try {
      const result = await fetchWithError('/api/admin/comments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: commentToEdit._id, comment: editDescription })
      });
      setComments((prev) => prev.map(c => c._id === commentToEdit._id ? { ...c, comment: result.data.comment } : c));
      toast.success('Comment updated successfully.');
      setEditModalOpen(false);
      setCommentToEdit(null);
      setEditDescription('');
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

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
              {hasCommentUpdateAccess && (
                <TableCell isHeader className="font-bold text-blue-700 dark:text-blue-200 p-2 text-center">Actions</TableCell>
              )}
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
                    dangerouslySetInnerHTML={{ __html: (comment.comment || '').replace(/<a /g, '<a target=\"_blank\" rel=\"noopener noreferrer\" ') }}
                  />
                </TableCell>
                <TableCell className="font-medium text-center p-2 align-middle">
                  {comment.commentedBy?.userType === 'admin' ? 'You' : comment.commentedBy?.name || 'N/A'}
                </TableCell>
                <TableCell className="font-medium text-center p-2 align-middle">{formatDate(comment.createdAt)}</TableCell>
                {hasCommentUpdateAccess && (
                  <TableCell className="p-2 align-middle text-center min-h-[48px]">
                    <div className="flex justify-center items-center gap-2 h-full">
                      <button className="p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 flex items-center justify-center" title="Edit" onClick={() => handleEditComment(comment)}>
                        <PencilIcon className="h-5 w-5 text-blue-500" />
                      </button>
                      <button className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-800 flex items-center justify-center" title="Delete" onClick={() => handleDeleteComment(comment._id)}>
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {comments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <svg width="120" height="120" fill="none" className="mb-6 opacity-60" viewBox="0 0 120 120"><path d="M60 6.5c-29.7 0-53.5 24.2-53.5 54s23.8 54 53.5 54 53.5-24.2 53.5-54-23.8-54-53.5-54zm0 100c-25.3 0-46-20.7-46-46s20.7-46 46-46 46 20.7 46 46-20.7 46-46 46z" fill="#e0e7ff"/><path d="M72.5 45.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3zM72.5 60.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3zM72.5 75.5h-25c-1.66 0-3 1.34-3 3s1.34 3 3 3h25c1.66 0 3-1.34 3-3s-1.34-3-3-3z" fill="#a5b4fc"/><text x="50%" y="90%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#4338ca" className="font-semibold">No comments found</text></svg>
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">No Comments Found</div>
          <p className="text-gray-500 mb-6">There are no comments in the system yet.</p>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setCommentToDelete(null); }}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to permanently delete this comment? This action cannot be undone."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />

      {editModalOpen && (
        <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} className="max-w-2xl w-full p-1" showCloseButton={false}>
          <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20">
            <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none"><defs><pattern id="modal-dots-edit" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#3b82f6" /></pattern></defs><rect width="100%" height="100%" fill="url(#modal-dots-edit)" /></svg>
            <div className="p-8 relative z-10">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">Edit Comment</h2>
                <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
                  Edit your comment below.
                </p>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="relative">
                  <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">Description</label>
                  <div className="relative">
                    <Editor
                      key={editorKey}
                      apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                      initialValue={editDescription}
                      init={{
                        height: 250,
                        menubar: false,
                        plugins: [
                          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                          'insertdatetime', 'media', 'table', 'help', 'wordcount'
                        ],
                        toolbar: 'undo redo | blocks | ' +
                          'bold italic forecolor | alignleft aligncenter ' +
                          'alignright alignjustify | bullist numlist outdent indent | ' +
                          'removeformat | help',
                        content_style: 'body { font-family:Inter,sans-serif; font-size:14px }',
                        skin: (document.documentElement.classList.contains('dark') ? "oxide-dark" : "oxide"),
                        content_css: (document.documentElement.classList.contains('dark') ? "dark" : "default"),
                      }}
                      onBlur={(e) => setEditDescription(e.target.getContent())}
                    />
                  </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                  <Button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    variant="secondary"
                    className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                  >
                    <XMarkIcon className="h-5 w-5" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!editDescription.trim()}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    <PaperAirplaneIcon className="h-5 w-5" />
                    Save
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
} 
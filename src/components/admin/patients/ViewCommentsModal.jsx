"use client";
import { Modal } from "@/components/ui/modal";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { XMarkIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import Button from "@/components/ui/button/Button";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from '@/store/features/uiSlice';

const ViewCommentsModal = ({ isOpen, onClose, patient }) => {
  const [comments, setComments] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const [caseId, setCaseId] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen && patient?._id) {
      const fetchComments = async () => {
        dispatch(setLoading(true));
        try {
          const response = await fetch(`/api/patients/comments?patientId=${patient._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const { comments, caseId } = await response.json();
            setComments(comments);
            setCaseId(caseId)
          } else {
            const errorData = await response.json();
            toast.error(errorData.message || "Failed to fetch comments.");
          }
        } catch (error) {
          console.error("Error fetching comments:", error);
          toast.error("An error occurred while fetching comments.");
        } finally {
          dispatch(setLoading(false));
        }
      };
      fetchComments();
    }
  }, [isOpen, patient, token]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl w-full"
      showCloseButton={false}
      alignTop={true}
    >
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20 flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700/50 shrink-0">
          <h2 className="text-2xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight flex items-center justify-center gap-3">
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
            Comments
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            For patient: <span className="font-bold text-purple-600 dark:text-purple-400">{patient?.patientName}</span>
          </p>
          {
            caseId ? <>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Case ID: <span className="font-bold text-purple-600 dark:text-purple-400">{caseId}</span>
              </p>
            </> : <></>
          }
          
        </div>
        
        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-grow">
          {comments?.length > 0 ? (
              comments.map((comment) => (
                  <div key={comment._id} className="p-4 mb-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex justify-between items-baseline mb-2">
                          <p className="font-bold text-gray-800 dark:text-white">
                              Commented By: {comment.commentedBy.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                          </p>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: comment.comment }}></div>
                  </div>
              ))
          ) : (
              <div className="text-center p-8 text-gray-500">No comments found for this patient.</div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 flex justify-end border-t border-gray-200 dark:border-gray-700/50 shrink-0">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
          >
            <XMarkIcon className="h-5 w-5" />
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ViewCommentsModal;
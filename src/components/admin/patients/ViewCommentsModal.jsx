"use client";
import { Modal } from "@/components/ui/modal";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { XMarkIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";
import Button from "@/components/ui/button/Button";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "@/store/features/uiSlice";

const ViewCommentsModal = ({ isOpen, onClose, patient }) => {
  const [comments, setComments] = useState([]);
  const { token } = useSelector((state) => state.auth);
  const [caseId, setCaseId] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen && patient?._id) {
      const fetchComments = async () => {
        dispatch(setLoading(true));
        try {
          const response = await fetch(
            `/api/patients/comments?patientId=${patient._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          if (response.ok) {
            const { comments, caseId } = await response.json();
            setComments(comments);
            setCaseId(caseId);
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
      className="w-full max-w-2xl"
      showCloseButton={false}
      alignTop={true}
    >
      <div className="relative flex max-h-[75vh] flex-col rounded-2xl border border-white/20 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl backdrop-blur-lg dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50">
        {/* Header */}
        <div className="shrink-0 border-b border-gray-200 p-6 text-center dark:border-gray-700/50">
          <h2 className="flex items-center justify-center gap-3 text-2xl font-extrabold tracking-tight text-blue-800 dark:text-white/90">
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
            Comments
          </h2>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            For patient:{" "}
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {patient?.patientName}
            </span>
          </p>
          {caseId ? (
            <>
              <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                Case ID:{" "}
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {caseId}
                </span>
              </p>
            </>
          ) : (
            <></>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-6">
          {(() => {
            if (!comments?.length) {
              return (
                <div className="p-8 text-center text-gray-500">
                  No comments found for this patient.
                </div>
              );
            }
            let modComment = null;
            let otherComments = comments;
            if (
              patient.modification &&
              patient.modification.commentSubmitted &&
              comments.length > 0
            ) {
              modComment = comments[comments.length - 1];
              otherComments = comments.slice(0, -1);
            }
            return (
              <>
                {modComment && (
                  <div
                    key={modComment._id}
                    className="mb-4 rounded-lg border border-green-300 bg-green-50 p-4 shadow-sm dark:border-green-700 dark:bg-green-900/30"
                  >
                    <div className="mb-2 flex items-baseline justify-between">
                      <p className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
                        Commented By: {modComment.commentedBy.name}
                        <span className="ml-2 rounded bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-800">
                          Modification
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(modComment.datetime).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: modComment.comment }}
                    ></div>
                  </div>
                )}
                {otherComments.map((comment) => (
                  <div
                    key={comment._id}
                    className="mb-4 rounded-lg border border-gray-200 bg-white/50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="mb-2 flex items-baseline justify-between">
                      <p className="flex items-center gap-2 font-semibold text-gray-800 dark:text-white">
                        Commented By: {comment.commentedBy.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.datetime).toLocaleString("en-IN", {
                          timeZone: "Asia/Kolkata",
                        })}
                      </p>
                    </div>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: comment.comment }}
                    ></div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-gray-200 p-6 dark:border-gray-700/50">
          <Button
            type="button"
            onClick={onClose}
            variant="secondary"
            className="flex transform items-center gap-2 rounded-lg bg-gray-200 px-6 py-2.5 text-gray-800 shadow-md transition-all duration-300 hover:scale-105 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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

"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  UserIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { Editor } from "@tinymce/tinymce-react";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "@/store/features/uiSlice";

const UploadModal = ({ isOpen, onClose, patient, isModification = false }) => {
  const [description, setDescription] = useState("");
  const dispatch = useDispatch();
  const [editorKey, setEditorKey] = useState(0); // Key to force re-render
  const { token } = useSelector((state) => state.auth);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription("");
      setEditorKey((prevKey) => prevKey + 1); // Change key to re-mount the editor
      setCommentSubmitted(false);
    }
  }, [isOpen, patient]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Comment cannot be empty.");
      return;
    }
    setFormLoading(true);
    dispatch(setLoading(true));
    try {
      if (isModification) {
        await fetch(`/api/patients/comments?patientId=${patient._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            comment: description,
            modification: isModification,
          }),
        });
        const response = await fetch(
          `/api/patients/update-details?id=${patient._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              modification: { commentSubmitted: true },
              caseStatus: "setup pending",
            }),
          },
        );
        if (response.ok) {
          toast.success("Modification comment submitted!");
          setCommentSubmitted(true);
          onClose();
        } else {
          const errorData = await response.json();
          toast.error(
            errorData.message || "Failed to submit modification comment.",
          );
        }
      } else {
        // Normal comment
        const response = await fetch(
          `/api/patients/comments?patientId=${patient._id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ comment: description }),
          },
        );
        if (response.ok) {
          toast.success("Comment added successfully!");
          onClose();
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "Failed to add comment.");
        }
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("An error occurred while submitting the comment.");
    } finally {
      dispatch(setLoading(false));
      setFormLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-2xl p-1"
      showCloseButton={false}
    >
      <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl backdrop-blur-lg dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50">
        {/* Subtle SVG pattern background */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.03]"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <defs>
            <pattern
              id="modal-dots"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="#3b82f6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#modal-dots)" />
        </svg>

        <div className="relative z-10 p-8">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
              Add Comment
            </h2>
            <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
              For patient:{" "}
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {patient?.patientName}
              </span>
            </p>
          </div>

          {patient && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">
                  Patient Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={patient.patientName}
                    disabled
                    className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 py-3 pr-4 pl-11 text-gray-500 shadow-inner dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  />
                </div>
              </div>

              <div className="relative">
                <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <div className="relative">
                  <PencilSquareIcon className="absolute top-5 left-4 h-5 w-5 text-gray-400" />
                  <Editor
                    key={editorKey}
                    apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY} // Replace with your free API key from tiny.cloud
                    initialValue=""
                    init={{
                      height: 250,
                      menubar: false,
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "help",
                        "wordcount",
                      ],
                      toolbar:
                        "undo redo | blocks | " +
                        "bold italic forecolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | help",
                      content_style: "body {font-size:14px }",
                      skin: document.documentElement.classList.contains("dark")
                        ? "oxide-dark"
                        : "oxide",
                      content_css: document.documentElement.classList.contains(
                        "dark",
                      )
                        ? "dark"
                        : "default",
                    }}
                    onEditorChange={(content, editor) =>
                      setDescription(content)
                    }
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="secondary"
                  className="flex transform items-center gap-2 rounded-lg bg-gray-200 px-6 py-3 text-gray-800 shadow-md transition-all duration-300 hover:scale-105 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="flex transform items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-purple-700 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      {isModification ? "Submiting Modification" : "Submiting"}
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-5 w-5" />
                      {isModification ? "Submit Modification" : "Submit"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadModal;

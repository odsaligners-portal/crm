"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { setLoading } from "@/store/features/uiSlice";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Editor } from "@tinymce/tinymce-react";

// Component for file dropzone per entry
const EntryFileDropzone = ({ entryId, files, onFilesChange }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    maxFiles: 3,
    onDrop: (acceptedFiles) => {
      if (files.length + acceptedFiles.length > 3) {
        toast.warning("You can only upload up to 3 files per entry.");
        return;
      }
      onFilesChange([...files, ...acceptedFiles]);
    },
  });

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${
          isDragActive
            ? "scale-[1.02] border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg dark:from-blue-900/20 dark:to-indigo-900/20"
            : "border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700 dark:hover:border-blue-500"
        }`}
      >
        <input {...getInputProps()} />
        {files.length > 0 ? (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 shadow-sm transition-all hover:shadow-md dark:from-green-900/30 dark:to-emerald-900/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="rounded-lg bg-red-100 p-2 text-red-600 transition-all hover:scale-110 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                  title="Remove file"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
            {files.length < 3 && (
              <div className="pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You can add {3 - files.length} more file
                  {3 - files.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 transition-transform duration-300 group-hover:scale-110 dark:from-blue-900/30 dark:to-indigo-900/30">
              <svg
                className={`h-8 w-8 transition-colors ${
                  isDragActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 group-hover:text-blue-500 dark:text-gray-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
                {isDragActive
                  ? "Drop your files here..."
                  : "Drag & drop files here"}
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                or click to browse files
              </p>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                Maximum 3 files per entry
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FileUploadModal = ({ isOpen, onClose, patient, token, onSuccess }) => {
  const [entries, setEntries] = useState([
    { id: Date.now().toString(), comment: "", files: [] },
  ]);
  const [loading, setLoading] = useState(false);
  const [editorKeys, setEditorKeys] = useState({});

  useEffect(() => {
    if (isOpen) {
      setEntries([{ id: Date.now().toString(), comment: "", files: [] }]);
      setEditorKeys({});
    }
  }, [isOpen, patient]);

  const addNewEntry = () => {
    const newId = Date.now().toString();
    setEntries([...entries, { id: newId, comment: "", files: [] }]);
    setEditorKeys((prev) => ({ ...prev, [newId]: Date.now() }));
  };

  const removeEntry = (entryId) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== entryId));
      const newKeys = { ...editorKeys };
      delete newKeys[entryId];
      setEditorKeys(newKeys);
    } else {
      toast.warning("At least one entry is required");
    }
  };

  const updateEntryComment = (entryId, comment) => {
    setEntries(entries.map((e) => (e.id === entryId ? { ...e, comment } : e)));
  };

  const updateEntryFiles = (entryId, files) => {
    setEntries(entries.map((e) => (e.id === entryId ? { ...e, files } : e)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient?._id) return;

    // Validate that at least one entry has either comment or files
    const hasValidEntry = entries.some(
      (entry) => entry.comment.trim() || entry.files.length > 0,
    );

    if (!hasValidEntry) {
      toast.error("Please add at least one comment or file");
      return;
    }

    setLoading(true);
    try {
      const { storage } = await import("@/utils/firebase");
      const { ref, uploadBytesResumable, getDownloadURL } = await import(
        "firebase/storage"
      );

      const allEntriesData = [];

      // Process each entry
      for (const entry of entries) {
        // Skip empty entries
        if (!entry.comment.trim() && entry.files.length === 0) continue;

        const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const uploadedFiles = [];

        // Upload files for this entry
        for (const file of entry.files) {
          const uniqueFileName = `${patient._id}-${Date.now()}-${file.name}`;
          const storagePath = `patients/${patient._id}/${uniqueFileName}`;
          const storageRef = ref(storage, storagePath);
          const uploadTask = uploadBytesResumable(storageRef, file);

          await new Promise((resolve, reject) => {
            uploadTask.on("state_changed", null, reject, resolve);
          });

          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);

          const mimeType = file.type;
          let fileTypeCategory = "other";
          if (mimeType.startsWith("image/")) {
            fileTypeCategory = "image";
          } else if (mimeType.startsWith("video/")) {
            fileTypeCategory = "video";
          } else if (mimeType === "application/pdf") {
            fileTypeCategory = "pdf";
          }

          uploadedFiles.push({
            fileName: entry.comment.trim() || file.name,
            fileType: fileTypeCategory,
            fileUrl,
            fileKey: storagePath,
            entryId,
          });
        }

        // If only comment (no files), create a file entry with just the comment
        if (entry.comment.trim() && entry.files.length === 0) {
          uploadedFiles.push({
            fileName: entry.comment,
            fileType: "text",
            fileUrl: "",
            fileKey: "",
            entryId,
            commentOnly: true,
          });
        }

        allEntriesData.push({
          entryId,
          comment: entry.comment.trim(),
          files: uploadedFiles,
        });
      }

      const response = await fetch("/api/patients/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient._id,
          entries: allEntriesData,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Failed to submit entry/entries");
        throw new Error(result.message || "Submission failed");
      }

      toast.success("Entry/entries submitted successfully!");
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Submission failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-4xl p-1"
      showCloseButton={false}
    >
      <div className="relative flex max-h-[90vh] flex-col overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 shadow-2xl backdrop-blur-lg dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/30">
        {/* Decorative background elements */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-blue-200/30 to-purple-200/30 blur-3xl dark:from-blue-800/20 dark:to-purple-800/20"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-200/30 to-pink-200/30 blur-3xl dark:from-indigo-800/20 dark:to-pink-800/20"></div>

        <div className="relative z-10 flex flex-col overflow-hidden">
          {/* Header - Fixed */}
          <div className="flex-shrink-0 p-8 pb-6">
            {/* Header Section */}
            <div className="mb-6 text-center">
              <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 shadow-lg">
                <svg
                  className="h-10 w-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h2 className="mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                Setup Entry Submission
              </h2>
              {patient && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm dark:bg-gray-800/80">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Patient:{" "}
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      {patient.patientName}
                    </span>
                  </span>
                  {patient.caseId && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Case ID: {patient.caseId}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8">
            <form
              id="upload-form"
              onSubmit={handleSubmit}
              className="space-y-6 pb-6"
            >
              <div className="space-y-6">
                {entries.map((entry, entryIndex) => (
                  <div
                    key={entry.id}
                    className="group relative rounded-2xl border-2 border-blue-200/50 bg-gradient-to-br from-white/90 to-blue-50/50 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-blue-300 hover:shadow-xl dark:border-blue-800/50 dark:from-gray-800/90 dark:to-blue-900/20"
                  >
                    {/* Entry number badge */}
                    <div className="absolute -top-3 -left-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-lg">
                      {entryIndex + 1}
                    </div>

                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                          Entry {entryIndex + 1}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Add comments and/or files for this entry
                        </p>
                      </div>
                      {entries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-all hover:scale-105 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Remove Entry
                        </button>
                      )}
                    </div>

                    <div className="space-y-5">
                      {/* Comments Section */}
                      <div className="rounded-xl bg-white/60 p-4 dark:bg-gray-800/60">
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <svg
                            className="h-5 w-5 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Set-Up Remark/Rx Remarks
                          <span className="ml-1 text-xs font-normal text-gray-500">
                            (Optional)
                          </span>
                        </label>
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                          <Editor
                            key={editorKeys[entry.id] || entry.id}
                            apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                            value={entry.comment}
                            onEditorChange={(content) =>
                              updateEntryComment(entry.id, content)
                            }
                            init={{
                              height: 220,
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
                              content_style:
                                "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; }",
                              skin: document.documentElement.classList.contains(
                                "dark",
                              )
                                ? "oxide-dark"
                                : "oxide",
                              content_css:
                                document.documentElement.classList.contains(
                                  "dark",
                                )
                                  ? "dark"
                                  : "default",
                            }}
                          />
                        </div>
                      </div>

                      {/* Files Section */}
                      <div className="rounded-xl bg-white/60 p-4 dark:bg-gray-800/60">
                        <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                          <svg
                            className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          Upload Files
                          <span className="ml-1 text-xs font-normal text-gray-500">
                            (Optional - Max 3 files)
                          </span>
                        </label>
                        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                          Supported formats: JPG, PNG, PDF, DOCX, DOC, TXT, MP4
                        </p>
                        <EntryFileDropzone
                          entryId={entry.id}
                          files={entry.files}
                          onFilesChange={(files) =>
                            updateEntryFiles(entry.id, files)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add More Button */}
              <div className="flex justify-center border-t border-gray-200 pt-6 dark:border-gray-700">
                <Button
                  type="button"
                  onClick={addNewEntry}
                  variant="outline"
                  className="group flex transform items-center gap-2 rounded-xl border-2 border-dashed border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-3 font-semibold text-blue-700 shadow-sm transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:from-blue-100 hover:to-indigo-100 hover:shadow-md dark:border-blue-600 dark:from-blue-900/30 dark:to-indigo-900/30 dark:text-blue-300 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50"
                >
                  <svg
                    className="h-5 w-5 transition-transform group-hover:rotate-90"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Another Entry
                </Button>
              </div>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 bg-white/50 p-6 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                disabled={loading}
                className="flex transform items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition-all duration-300 hover:scale-105 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="upload-form"
                disabled={loading}
                className={`group flex transform items-center gap-2 rounded-xl bg-gradient-to-r px-8 py-3 font-bold text-white shadow-lg transition-all duration-300 ${
                  loading
                    ? "cursor-not-allowed from-blue-300 to-purple-400"
                    : "from-blue-500 via-indigo-500 to-purple-600 hover:scale-105 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 hover:shadow-xl"
                } disabled:scale-100`}
              >
                {loading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>It's submitting, please wait...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Submit Entries</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const ViewFilesModal = ({ isOpen, onClose, patient, token }) => {
  const { user } = useSelector((state) => state.auth);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen && patient?._id) {
      dispatch(setLoading(true));
      setError("");
      fetch(`/api/patients/files?patientId=${patient._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setFiles(data.files);
          else {
            setError(data.message || "Failed to fetch files");
            toast.error(data.message || "Failed to fetch files");
          }
        })
        .catch(() => {
          setError("Failed to fetch files");
          toast.error("Failed to fetch files");
        })
        .finally(() => dispatch(setLoading(false)));
    } else {
      setFiles([]);
      setError("");
    }
  }, [isOpen, patient, token, dispatch]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-2xl p-1"
      showCloseButton={false}
    >
      <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl backdrop-blur-lg dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50">
        <div className="relative z-10 flex h-[600px] flex-col p-8">
          <div className="mb-6 flex-shrink-0 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
              Patient Files
            </h2>
            {patient && (
              <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
                For patient:{" "}
                <span className="font-semibold text-purple-600 subpixel-antialiased dark:text-purple-400">
                  {patient.patientName}
                </span>{" "}
                &nbsp;|&nbsp; Case ID:{" "}
                <span className="font-semibold text-blue-600 subpixel-antialiased dark:text-blue-400">
                  {patient.caseId}
                </span>
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="py-8 text-center text-red-500">{error}</div>
            ) : files.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                No files uploaded for this patient.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase dark:text-gray-300">
                        Uploader
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase dark:text-gray-300">
                        File Name
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase dark:text-gray-300">
                        Uploaded At
                      </th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                    {files.map((file) => (
                      <tr key={file._id}>
                        <td className="px-4 py-2 font-semibold text-gray-900 subpixel-antialiased dark:text-gray-100">
                          {/* {file.uploadedBy}  */}Planner
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          <div
                            className="max-w-xs"
                            dangerouslySetInnerHTML={{ __html: file.fileName }}
                          />
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(file.uploadedAt).toLocaleString()}
                        </td>
                        {user?.role !== "planner" && (
                          <td className="px-4 py-2">
                            <a
                              href={file.fileUrl}
                              download={file.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white shadow transition hover:bg-blue-700"
                            >
                              View File
                            </a>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-shrink-0 justify-end">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              className="transform rounded-lg bg-gray-200 px-6 py-3 text-gray-800 shadow-md transition-all duration-300 hover:scale-105 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FileUploadModal;

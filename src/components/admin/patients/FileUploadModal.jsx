"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { setLoading } from "@/store/features/uiSlice";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Editor } from "@tinymce/tinymce-react";

const FileUploadModal = ({ isOpen, onClose, patient, token }) => {
  const [fileName, setFileName] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // Key to force re-render

  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setFiles([]);
      setEditorKey((prevKey) => prevKey + 1); // Change key to re-mount the editor
    }
  }, [isOpen, patient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    maxFiles: 3,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 3) {
        toast.warning("You can only upload up to 3 files.");
      } else {
        setFiles(acceptedFiles);
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length || !fileName.trim() || !patient?._id) return;

    setLoading(true);
    try {
      const { storage } = await import("@/utils/firebase");
      const { ref, uploadBytesResumable, getDownloadURL } = await import(
        "firebase/storage"
      );

      const uploadedFiles = [];

      for (const file of files) {
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
          fileName,
          fileType: fileTypeCategory,
          fileUrl,
          fileKey: storagePath,
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
          files: uploadedFiles,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error("Failed to upload file(s)");
        throw new Error(result.message || "Upload failed");
      }

      toast.success("Files uploaded successfully!");
      onClose();
    } catch (error) {
      toast.error("Upload failed");
      alert(error.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="w-full max-w-md p-1"
      showCloseButton={false}
    >
      <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-2xl backdrop-blur-lg dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50">
        <div className="relative z-10 p-8">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
              Upload Files
            </h2>
            {patient && (
              <p className="mt-2 text-base font-medium text-gray-500 dark:text-gray-400">
                For patient:{" "}
                <span className="font-semibold text-purple-600 subpixel-antialiased dark:text-purple-400">
                  {patient.patientName}
                </span>
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                File Name
              </label>
              <Editor
                key={editorKey}
                apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                initialValue=""
                init={{
                  height: 200,
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
                onEditorChange={(content, editor) => setFileName(content)}
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-gray-700 subpixel-antialiased dark:text-gray-300">
                Upload up to 3 files(Must be JPG/PNG/PDF/DOCX/DOC/TXT/MP4)
              </label>
              <div
                {...getRootProps()}
                className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"}`}
              >
                <input {...getInputProps()} />
                {files.length > 0 ? (
                  <ul className="space-y-1 font-semibold text-green-700 subpixel-antialiased">
                    {files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">
                    Drag & drop files here, or click to select
                  </span>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="flex transform items-center gap-2 rounded-lg bg-gray-200 px-6 py-3 text-gray-800 shadow-md transition-all duration-300 hover:scale-105 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!fileName.trim() || !files.length || loading}
                className={`flex transform items-center gap-2 rounded-lg bg-gradient-to-r ${loading ? "from-blue-300 to-purple-400" : "from-blue-500 to-purple-600"} px-6 py-3 font-semibold text-white subpixel-antialiased shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-purple-700 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {loading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
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

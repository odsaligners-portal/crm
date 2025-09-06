"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { setLoading } from "@/store/features/uiSlice";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import dynamic from "next/dynamic";
import {
  FileIcon,
  UploadIcon,
  CheckCircleIcon,
  TrashBinIcon,
  ChatIcon,
  BoxCubeIcon,
  ArrowUpIcon,
} from "@/icons";
import { FaUpload } from "react-icons/fa";

// Dynamically import TinyMCE editor to avoid SSR issues
const Editor = dynamic(
  () =>
    import("@tinymce/tinymce-react").then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[200px] items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="text-gray-500 dark:text-gray-400">
          Loading editor...
        </div>
      </div>
    ),
  },
);

const STLUploadModal = ({ isOpen, onClose, patient, token, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [comment, setComment] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setComment("");
      setEditorKey((prevKey) => prevKey + 1);
    }
  }, [isOpen, patient]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: undefined, // Accept any file type
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        // Validate file size (100MB limit for any file type)
        if (selectedFile.size > 25 * 1024 * 1024) {
          toast.error("File size must be less than 25MB");
          return;
        }
        setFile(selectedFile);
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted", { file, patient: patient?._id, comment });

    if (!file || !patient?._id) {
      console.log("Validation failed", {
        hasFile: !!file,
        hasPatient: !!patient?._id,
      });
      return;
    }

    setIsUploading(true);
    dispatch(setLoading(true));

    try {
      const formData = new FormData();
      formData.append("stlFile", file);
      formData.append("patientId", patient._id);
      formData.append("comment", comment);

      const response = await fetch("/api/patients/stl-upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      toast.success("File uploaded successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      dispatch(setLoading(false));
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setComment("");
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="h-[80vh] overflow-y-auto p-8">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <BoxCubeIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            Upload STL File
          </h2>
        </div>

        {/* Patient Info Card */}
        <div className="mb-6 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:border-gray-600 dark:from-gray-800 dark:to-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500">
              <span className="text-sm font-semibold text-white">
                {patient?.patientName?.charAt(0) || "P"}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {patient?.patientName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Case ID: {patient?.caseId}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              <FileIcon className="mr-2 inline h-4 w-4" />
              Upload File
            </label>

            {file ? (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500">
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-200">
                        {file.name}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20"
                    disabled={isUploading}
                  >
                    <TrashBinIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                  isDragActive
                    ? "scale-[1.02] border-blue-400 bg-blue-50 shadow-lg dark:bg-blue-900/20"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/10"
                }`}
              >
                <input {...getInputProps()} />
                <div className="space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 transition-transform duration-300 group-hover:scale-110 dark:from-blue-900/30 dark:to-purple-900/30">
                    {isDragActive ? (
                      <ArrowUpIcon className="h-8 w-8 text-blue-500" />
                    ) : (
                      <FaUpload className="h-8 w-8 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <p className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                      {isDragActive
                        ? "Drop your file here..."
                        : "Drag & drop your file here"}
                    </p>
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                      or click to browse files
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              <ChatIcon className="mr-2 inline h-4 w-4" />
              Comments
            </label>
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
              {isMounted ? (
                <Editor
                  key={editorKey}
                  apiKey={process.env.NEXT_PUBLIC_TINY_EDITOR_API_KEY}
                  value={comment}
                  onEditorChange={setComment}
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
                    content_style:
                      "body { font-family: -apple-system, BlinkMacSystemFont, San Francisco, Segoe UI, Roboto, Helvetica Neue, sans-serif; font-size: 14px; }",
                    skin: document.documentElement.classList.contains("dark")
                      ? "oxide-dark"
                      : "oxide",
                    content_css: document.documentElement.classList.contains(
                      "dark",
                    )
                      ? "dark"
                      : "default",
                  }}
                />
              ) : (
                <div className="flex h-[200px] items-center justify-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    Loading editor...
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || isUploading}
              className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-700 hover:shadow-xl"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FaUpload className="h-4 w-4" />
                  <span>Upload File</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default STLUploadModal;

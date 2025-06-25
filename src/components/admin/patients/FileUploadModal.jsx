"use client";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useDropzone } from "react-dropzone";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useDispatch } from 'react-redux';
import { setLoading } from '@/store/features/uiSlice';

const FileUploadModal = ({ isOpen, onClose, patient, token }) => {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState("image");
  const [file, setFile] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      setFileName("");
      setFileType("");
      setFile(null);
    }
  }, [isOpen, patient]);

  const accept = fileType === 'image'
    ? { 'image/*': [] }
    : fileType === 'pdf'
    ? { 'application/pdf': [] }
    : { 'video/*': [] };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !fileName || !fileType || !patient?._id) return;
    dispatch(setLoading(true));
    try {
      // 1. Upload file to Firebase Storage
      const { storage } = await import('@/utils/firebase');
      const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
      const uniqueFileName = `${patient._id}-${Date.now()}-${file.name}`;
      const storagePath = `patients/${patient._id}/${uniqueFileName}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, resolve);
      });
      const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
      const fileKey = storagePath;
      // 2. Call API to save file record
      const response = await fetch('/api/patients/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient._id,
          fileName,
          fileType,
          fileUrl,
          fileKey,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        toast.error("Failed to upload file")
        throw new Error(result.message || 'Failed to upload file');
      }
      // Success
      toast.success("File Uploaded Successfully")
      onClose();
    } catch (error) {
      toast.error("Upload failed")
      alert(error.message || 'Upload failed');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full p-1"
      showCloseButton={false}
    >
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20">
        <div className="p-8 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">
              Upload File
            </h2>
            {patient && (
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
                For patient: <span className="font-bold text-purple-600 dark:text-purple-400">{patient.patientName}</span>
              </p>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">File Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-inner"
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">File Type</label>
              <select
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 py-3 px-4 text-gray-900 dark:text-gray-100 shadow-inner"
                value={fileType}
                onChange={e => { setFileType(e.target.value); setFile(null); }}
              required>
                <option value="">Select File Type</option>
                <option value="image">Image</option>
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block font-semibold text-gray-700 dark:text-gray-300">File Upload</label>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}>
                <input {...getInputProps()} />
                {file ? (
                  <div className="text-green-700 font-semibold">{file.name}</div>
                ) : (
                  <span className="text-gray-500">Drag & drop a file here, or click to select</span>
                )}
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-4">
              <Button
                type="button"
                onClick={onClose}
                variant="secondary"
                className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!fileName || !file}
                className="flex items-center gap-2 px-6 py-3 rounded-lg shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                Upload
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export const ViewFilesModal = ({ isOpen, onClose, patient, token }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen && patient?._id) {
      dispatch(setLoading(true));
      setError("");
      fetch(`/api/patients/files?patientId=${patient._id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl w-full p-1" showCloseButton={false}>
      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20">
        <div className="p-8 relative z-10">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight drop-shadow-lg">Patient Files</h2>
            {patient && (
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400 font-medium">
                For patient: <span className="font-bold text-purple-600 dark:text-purple-400">{patient.patientName}</span> &nbsp;|&nbsp; Case ID: <span className="font-bold text-blue-600 dark:text-blue-400">{patient.caseId}</span>
              </p>
            )}
          </div>
          {error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : files.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No files uploaded for this patient.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Uploader</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">File Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">File Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Uploaded At</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {files.map(file => (
                    <tr key={file._id}>
                      <td className="px-4 py-2 font-semibold text-gray-900 dark:text-gray-100">{file.uploadedBy}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{file.fileName}</td>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{file.fileType}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{new Date(file.uploadedAt).toLocaleString()}</td>
                      <td className="px-4 py-2">
                        <a
                          href={file.fileUrl}
                          download={file.fileName}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
                        >
                          View File
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-8 flex justify-end">
            <Button type="button" onClick={onClose} variant="secondary" className="px-6 py-3 rounded-lg shadow-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default FileUploadModal; 
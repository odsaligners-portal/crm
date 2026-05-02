"use client";

import ConfirmationModal from "@/components/common/ConfirmationModal";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { storage } from "@/utils/firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setLoading } from "@/store/features/uiSlice";
import { v4 as uuidv4 } from "uuid";
import { MdAdd, MdDelete, MdDownload, MdEdit, MdOpenInNew } from "react-icons/md";

const initialUpload = {
  fileUrl: "",
  fileKey: "",
  fileName: "",
  fileSize: 0,
};

export default function GenerateQrPage() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
  const isSuperAdmin =
    user && user.id && superAdminId && String(user.id) === String(superAdminId);

  const [records, setRecords] = useState([]);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedPdf, setUploadedPdf] = useState(initialUpload);
  const [editingRecordId, setEditingRecordId] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [qrPreviews, setQrPreviews] = useState({});

  const fetchRecords = async () => {
    if (!token) return;
    dispatch(setLoading(true));
    try {
      const data = await fetchWithError("/api/admin/qr-pdfs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(data.records || []);
    } catch (error) {
      setRecords([]);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchRecords();
    }
  }, [token, isSuperAdmin]);

  useEffect(() => {
    const generateQrs = async () => {
      const previews = {};
      await Promise.all(
        records.map(async (record) => {
          if (!record?.pdf?.fileUrl || !record?._id) return;
          try {
            previews[record._id] = await QRCode.toDataURL(record.pdf.fileUrl, {
              errorCorrectionLevel: "H",
              margin: 1,
              width: 360,
              color: {
                dark: "#111827",
                light: "#0000",
              },
            });
          } catch (error) {
            previews[record._id] = "";
          }
        }),
      );
      setQrPreviews(previews);
    };

    if (records.length) {
      generateQrs();
    } else {
      setQrPreviews({});
    }
  }, [records]);

  const handlePdfUpload = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    const fileKey = `qr-pdfs/${uuidv4()}-${file.name}`;
    const pdfRef = ref(storage, fileKey);
    const uploadTask = uploadBytesResumable(pdfRef, file);

    setUploading(true);
    setUploadProgress(0);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setUploading(false);
        toast.error(`Upload failed: ${error.message}`);
      },
      async () => {
        try {
          const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedPdf({
            fileUrl,
            fileKey,
            fileName: file.name,
            fileSize: file.size,
          });
          toast.success("PDF uploaded successfully.");
        } catch (error) {
          toast.error("Failed to get PDF URL after upload.");
        } finally {
          setUploading(false);
          setUploadProgress(100);
        }
      },
    );
  };

  const handleRemoveUploadedFile = async () => {
    if (!uploadedPdf.fileKey) return;

    try {
      await deleteObject(ref(storage, uploadedPdf.fileKey));
      setUploadedPdf(initialUpload);
      setUploadProgress(0);
      toast.success("Uploaded file removed.");
    } catch (error) {
      toast.error("Failed to remove uploaded file.");
    }
  };

  const resetForm = () => {
    setTitle("");
    setUploadedPdf(initialUpload);
    setUploadProgress(0);
    setEditingRecordId("");
    setIsFormModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }

    if (!editingRecordId && !uploadedPdf.fileUrl) {
      toast.error("Upload a PDF before saving.");
      return;
    }

    dispatch(setLoading(true));
    try {
      const payload = {
        title: title.trim(),
      };

      if (uploadedPdf.fileUrl) {
        payload.pdf = uploadedPdf;
      }

      if (editingRecordId) {
        await fetchWithError("/api/admin/qr-pdfs", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ...payload, id: editingRecordId }),
        });
        toast.success("QR PDF updated.");
      } else {
        await fetchWithError("/api/admin/qr-pdfs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        toast.success("QR PDF created.");
      }

      resetForm();
      fetchRecords();
    } catch (error) {
      if (uploadedPdf.fileKey && !editingRecordId) {
        await deleteObject(ref(storage, uploadedPdf.fileKey)).catch(() => null);
        setUploadedPdf(initialUpload);
      }
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleEdit = (record) => {
    setEditingRecordId(record._id);
    setTitle(record.title || "");
    setUploadedPdf(initialUpload);
    setUploadProgress(0);
    setIsFormModalOpen(true);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    dispatch(setLoading(true));
    try {
      await fetchWithError(`/api/admin/qr-pdfs?id=${recordToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("QR PDF deleted.");
      if (editingRecordId === recordToDelete._id) {
        resetForm();
      }
      fetchRecords();
    } catch (error) {
    } finally {
      setRecordToDelete(null);
      dispatch(setLoading(false));
    }
  };

  const openCreateModal = () => {
    setTitle("");
    setUploadedPdf(initialUpload);
    setUploadProgress(0);
    setEditingRecordId("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = async () => {
    if (uploadedPdf.fileKey && !editingRecordId) {
      await deleteObject(ref(storage, uploadedPdf.fileKey)).catch(() => null);
      setUploadedPdf(initialUpload);
      setUploadProgress(0);
    }
    setIsFormModalOpen(false);
    if (!editingRecordId) {
      setTitle("");
    }
    setEditingRecordId("");
  };

  const handleDownloadQr = async (record) => {
    try {
      const qrDataUrl = qrPreviews[record._id]
        ? qrPreviews[record._id]
        : await QRCode.toDataURL(record.pdf.fileUrl, {
            errorCorrectionLevel: "H",
            margin: 1,
            width: 1024,
            color: {
              dark: "#000000",
              light: "#0000",
            },
          });
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `${record.title || "qr-code"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error("Failed to generate QR image.");
    }
  };

  const fileSizeInMb = (size = 0) => (size / (1024 * 1024)).toFixed(2);

  if (!isSuperAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          Only super admin can access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Generate QR for PDFs
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            QR stays visible on every card and opens the PDF directly when
            scanned.
          </p>
        </div>
        <Button startIcon={<MdAdd />} onClick={openCreateModal}>
          Add New PDF
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-700 dark:bg-slate-900">
          <p className="text-gray-700 dark:text-gray-300">
            No QR PDF entries yet. Click{" "}
            <span className="font-semibold">Add New PDF</span> to create one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {records.map((record) => (
            <div
              key={record._id}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-slate-900"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {record.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {record.pdf?.fileName}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {fileSizeInMb(record.pdf?.fileSize)} MB
                </span>
              </div>

              <div className="mb-4 flex items-center justify-center rounded-xl bg-gray-50 p-3 dark:bg-slate-800">
                {qrPreviews[record._id] ? (
                  <img
                    src={qrPreviews[record._id]}
                    alt={`QR for ${record.title}`}
                    className="h-44 w-44 object-contain"
                  />
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Generating QR...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={record.pdf?.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-gray-900 px-3 py-3 text-xs font-medium text-white dark:bg-white dark:text-black"
                >
                  <MdOpenInNew className="text-sm" />
                  Open PDF
                </a>
                <Button
                  size="sm"
                  onClick={() => handleDownloadQr(record)}
                  startIcon={<MdDownload />}
                  className="w-full"
                >
                  Download QR
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(record)}
                  startIcon={<MdEdit />}
                  className="w-full"
                >
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => setRecordToDelete(record)}
                  className="inline-flex items-center justify-center gap-1 rounded-lg bg-red-600 px-3 py-3 text-xs font-medium text-white hover:bg-red-700"
                >
                  <MdDelete className="text-sm" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        className="max-w-2xl"
        showCloseButton
      >
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {editingRecordId ? "Edit QR PDF" : "Add QR PDF"}
          </h2>

          <div>
            <Label htmlFor="qr-title">Title</Label>
            <InputField
              id="qr-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter PDF title"
            />
          </div>

          <div>
            <Label htmlFor="qr-pdf-file">Upload PDF</Label>
            <input
              id="qr-pdf-file"
              type="file"
              accept="application/pdf"
              onChange={(e) => handlePdfUpload(e.target.files?.[0])}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
            />
            {uploading && (
              <p className="mt-2 text-sm text-blue-600">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            )}
            {!uploading && uploadedPdf.fileUrl && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <span>{uploadedPdf.fileName}</span>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={handleRemoveUploadedFile}
                >
                  Remove
                </Button>
              </div>
            )}
            {editingRecordId && !uploadedPdf.fileUrl && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Keep empty if you only want to update title.
              </p>
            )}
          </div>

          <div className="flex w-full gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeFormModal}
              className="w-1/2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploading} className="w-1/2">
              {editingRecordId ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleDelete}
        title="Delete QR PDF"
        message="Are you sure you want to delete this QR PDF entry? This will remove the PDF and QR record permanently."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
}

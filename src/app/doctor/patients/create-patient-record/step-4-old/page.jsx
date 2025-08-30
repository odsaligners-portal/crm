"use client";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { imageLabels, modelLabels } from "@/constants/data";
import { storage } from "@/utils/firebase";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";

export default function Step4Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [fileKeys, setFileKeys] = React.useState(Array(13).fill(undefined));
  const [imageUrls, setImageUrls] = React.useState(Array(13).fill(undefined));
  const [progresses, setProgresses] = React.useState(Array(13).fill(0));
  const [formData, setFormData] = React.useState({
    // Add all fields used in this step, e.g.:
    // field1: '',
    // field2: '',
  });

  useEffect(() => {
    if (!patientId) {
      toast.error("Please start from Step 1.");
      router.replace("/doctor/patients/create-patient-record");
    }
  }, [patientId, router]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (patientId) {
        dispatch(setLoading(true));
        try {
          const patientData = await fetchWithError(
            `/api/patients/update-details?id=${encodeURIComponent(patientId).trim()}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
          setFormData((prev) => ({ ...prev, ...patientData }));
        } catch (error) {
          // fetchWithError already toasts
        } finally {
          dispatch(setLoading(false));
        }
      }
    };
    fetchData();
  }, [patientId, token, dispatch]);

  const handleFileUpload = async (file, idx) => {
    if (!patientId) return;
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const isImageSlot = idx < 11;
    const isModelSlot = idx >= 11;

    if (
      (isImageSlot && !["jpg", "jpeg", "png"].includes(fileExtension)) ||
      (isModelSlot && !["ply", "stl"].includes(fileExtension))
    ) {
      toast.error("Invalid file type for this slot.");
      return;
    }

    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const storagePath = `patients/${patientId}/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
    dispatch(setLoading(true));

    uploadTask.on(
      "state_changed",
      (snapshot) =>
        setProgresses((p) => {
          const n = [...p];
          n[idx] = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          return n;
        }),
      (error) => {
        toast.error(`Upload failed: ${error.message}`);
        setProgresses((p) => {
          const n = [...p];
          n[idx] = 0;
          return n;
        });
        dispatch(setLoading(false));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrls((p) => {
            const n = [...p];
            n[idx] = downloadURL;
            return n;
          });
          setFileKeys((p) => {
            const n = [...p];
            n[idx] = storagePath;
            return n;
          });
          toast.success("File uploaded successfully");
          dispatch(setLoading(false));
        });
      },
    );
  };

  const handleDeleteFile = async (idx) => {
    const fileKey = fileKeys[idx];
    if (!fileKey) return;
    const fileRef = ref(storage, fileKey);
    dispatch(setLoading(true));
    try {
      await deleteObject(fileRef);
      setImageUrls((p) => {
        const n = [...p];
        n[idx] = undefined;
        return n;
      });
      setFileKeys((p) => {
        const n = [...p];
        n[idx] = undefined;
        return n;
      });
      setProgresses((p) => {
        const n = [...p];
        n[idx] = 0;
        return n;
      });
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete file: ${error.message}`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const prevStep = () =>
    router.push(
      `/doctor/patients/create-patient-record/step-3?id=${patientId}`,
    );

  const handleFinalSubmit = async () => {
    if (!patientId) return toast.error("No patient ID found");
    dispatch(setLoading(true));
    try {
      const scanFiles = {};
      imageUrls.forEach((url, idx) => {
        if (url && fileKeys[idx]) {
          const fieldName = idx < 11 ? `img${idx + 1}` : `model${idx - 10}`;
          scanFiles[fieldName] = [
            {
              fileUrl: url,
              fileKey: fileKeys[idx],
              uploadedAt: new Date().toISOString(),
            },
          ];
        }
      });
      await fetchWithError(`/api/patients/update-details?id=${patientId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scanFiles }),
      });
      toast.success("Patient record updated successfully");
      router.push("/doctor/patients");
    } catch (error) {
      // fetchWithError already toasts
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      const path = new URL(url).pathname.split("/").pop() || "";
      return decodeURIComponent(path).substring(path.indexOf("-") + 1);
    } catch {
      return "file";
    }
  };

  const UploadComponent = ({ idx }) => {
    const onDrop = (acceptedFiles) =>
      acceptedFiles.length > 0 && handleFileUpload(acceptedFiles[0], idx);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false,
      accept:
        idx < 11
          ? { "image/jpeg": [], "image/png": [] }
          : { "application/octet-stream": [".ply", ".stl"] },
    });
    const isModelSlot = idx >= 11;
    const fileUrl = imageUrls[idx];
    const fileName = fileUrl ? getFileNameFromUrl(fileUrl) : "";
    const fileExt = fileName.split(".").pop()?.toLowerCase();
    return (
      <div className="text-center">
        <Label>{idx < 11 ? imageLabels[idx] : modelLabels[idx - 11]}</Label>
        {!fileUrl ? (
          progresses[idx] > 0 ? (
            <div className="mt-2 w-full">
              <div className="mb-1 flex justify-between">
                <span className="text-sm font-medium text-blue-700">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-blue-700">
                  {Math.round(progresses[idx])}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${progresses[idx]}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`mt-2 flex h-32 w-full cursor-pointer appearance-none items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-white px-4 transition hover:border-gray-400 focus:outline-none ${isDragActive ? "border-blue-500 bg-blue-50" : ""}`}
            >
              <input {...getInputProps()} />
              <span className="flex items-center space-x-2">
                <span className="font-medium text-gray-600">
                  Drop file or{" "}
                  <span className="text-blue-600 underline">browse</span>
                </span>
              </span>
            </div>
          )
        ) : (
          <div className="group relative mx-auto mt-2 max-w-xs">
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border shadow-lg">
              {idx < 11 ? (
                <img
                  src={fileUrl}
                  alt=""
                  className="h-32 w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-2">
                  {/* 3D Model Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-2 h-10 w-10 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z"
                    />
                  </svg>
                  <p className="mb-1 text-xs font-medium break-all text-gray-700">
                    {fileName}
                  </p>
                  <a
                    href={fileUrl}
                    download={fileName}
                    className="text-xs text-blue-600 underline"
                    title="Download 3D model"
                  >
                    Download
                  </a>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDeleteFile(idx)}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-100 shadow-lg transition-opacity"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden py-8">
      {/* Animated glassmorphism background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="animate-spin-slow absolute -top-32 left-1/2 h-[90vw] w-[90vw] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-white/10 blur-3xl" />
        <div className="animate-float absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-200/40 via-blue-100/20 to-white/10 blur-2xl" />
        <div className="animate-float2 absolute right-0 bottom-0 h-1/2 w-1/2 rounded-full bg-gradient-to-tr from-blue-100/30 via-blue-300/20 to-white/10 blur-2xl" />
      </div>
      <div className="z-10 w-full max-w-4xl rounded-2xl bg-white p-8 shadow-lg">
        <div className="mt-2 mb-8 flex justify-end">
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text px-4 py-2 text-sm font-extrabold tracking-tight text-transparent drop-shadow-xl">
            Case Id: {formData?.caseId || patientId}
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-semibold text-gray-800">
          Step 4: File Upload
        </h1>
        <p className="mb-8 text-gray-500">
          Upload patient images and 3D models.
        </p>
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div>
            <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-700">
              Patient Images
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {imageLabels.map((_, idx) => (
                <UploadComponent key={idx} idx={idx} />
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-4 border-b pb-2 text-xl font-semibold text-gray-700">
              3D Models (PLY/STL)
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {modelLabels.map((_, idx) => (
                <UploadComponent key={idx + 11} idx={idx + 11} />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t pt-8">
            <Button onClick={prevStep} type="button" variant="outline">
              Previous
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={!imageUrls.some((url) => !!url)}
              type="submit"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

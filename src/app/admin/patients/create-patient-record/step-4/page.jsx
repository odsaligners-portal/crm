"use client";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { imageLabels, modelLabels } from "@/constants/data";
import { storage } from "@/utils/firebase";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

export default function Step4Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = React.useState(false);
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
      toast.error('Please start from Step 1.');
      router.replace('/admin/patients/create-patient-record/step-1');
    }
  }, [patientId, router]);
  
  React.useEffect(() => {
    const fetchData = async ()=>{
      if (patientId) {
        const response = await fetch(`/api/admin/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const patientData = await response.json();
          setFormData(prev => ({ ...prev, ...patientData }));
        }
      }
    }
    fetchData();
  }, [patientId, token]);

  const handleFileUpload = (file, idx) => {
    if (!patientId) return;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const isImageSlot = idx < 11;
    const isModelSlot = idx >= 11;

    if ((isImageSlot && !['jpg', 'jpeg', 'png'].includes(fileExtension)) || (isModelSlot && !['ply', 'stl'].includes(fileExtension))) {
      toast.error('Invalid file type for this slot.');
      return;
    }

    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const storagePath = `patients/${patientId}/${uniqueFileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed",
      (snapshot) => setProgresses(p => { const n = [...p]; n[idx] = (snapshot.bytesTransferred / snapshot.totalBytes) * 100; return n; }),
      (error) => {
        toast.error(`Upload failed: ${error.message}`);
        setProgresses(p => { const n = [...p]; n[idx] = 0; return n; });
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrls(p => { const n = [...p]; n[idx] = downloadURL; return n; });
          setFileKeys(p => { const n = [...p]; n[idx] = storagePath; return n; });
          toast.success("File uploaded successfully");
        });
      }
    );
  };
  
  const handleDeleteFile = async (idx) => {
    const fileKey = fileKeys[idx];
    if (!fileKey) return;
    setIsLoading(true);
    const fileRef = ref(storage, fileKey);
    try {
      await deleteObject(fileRef);
      setImageUrls(p => { const n = [...p]; n[idx] = undefined; return n; });
      setFileKeys(p => { const n = [...p]; n[idx] = undefined; return n; });
      setProgresses(p => { const n = [...p]; n[idx] = 0; return n; });
      toast.success("File deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete file: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const prevStep = () => router.push(`/admin/patients/create-patient-record/step-3?id=${patientId}`);
  
  const handleFinalSubmit = async () => {
    if (!patientId) return toast.error("No patient ID found");
    setIsLoading(true);
    try {
      const scanFiles = {};
      imageUrls.forEach((url, idx) => {
        if (url && fileKeys[idx]) {
          const fieldName = idx < 11 ? `img${idx + 1}` : `model${idx - 10}`;
          scanFiles[fieldName] = [{ fileUrl: url, fileKey: fileKeys[idx], uploadedAt: new Date().toISOString() }];
        }
      });
      const response = await fetch(`/api/admin/patients/update-details?id=${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ scanFiles }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to save file details");
      toast.success("Patient record updated successfully");
      router.push("/admin/patients");
    } catch (error) {
      toast.error(error.message || "Failed to save file details");
    } finally {
      setIsLoading(false);
    }
  };

  const getFileNameFromUrl = (url) => {
    try {
      const path = new URL(url).pathname.split('/').pop() || "";
      return decodeURIComponent(path).substring(path.indexOf('-') + 1);
    } catch { return "file"; }
  };

  const UploadComponent = ({ idx }) => {
    const onDrop = (acceptedFiles) => acceptedFiles.length > 0 && handleFileUpload(acceptedFiles[0], idx);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: idx < 11 ? { 'image/jpeg': [], 'image/png': [] } : { 'application/octet-stream': ['.ply', '.stl'] } });
    const isModelSlot = idx >= 11;
    const fileUrl = imageUrls[idx];
    const fileName = fileUrl ? getFileNameFromUrl(fileUrl) : '';
    const fileExt = fileName.split('.').pop()?.toLowerCase();
    return (
      <div className="text-center">
        <Label>{idx < 11 ? imageLabels[idx] : modelLabels[idx - 11]}</Label>
        {!fileUrl ? (
          progresses[idx] > 0 ? (
            <div className="w-full mt-2"><div className="flex justify-between mb-1"><span className="text-sm font-medium text-blue-700">Uploading...</span><span className="text-sm font-medium text-blue-700">{Math.round(progresses[idx])}%</span></div><div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progresses[idx]}%` }}></div></div></div>
          ) : (
            <div {...getRootProps()} className={`mt-2 flex justify-center items-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}><input {...getInputProps()} /><span className="flex items-center space-x-2"><span className="font-medium text-gray-600">Drop file or <span className="text-blue-600 underline">browse</span></span></span></div>
          )
        ) : (
          <div className="relative group max-w-xs mx-auto mt-2">
            <div className="rounded-xl shadow-lg border flex flex-col items-center justify-center h-32">
              {idx < 11 ? (
                <img src={fileUrl} alt="" className="w-full h-32 object-contain" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full p-2">
                  {/* 3D Model Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z" /></svg>
                  <p className="break-all text-xs font-medium text-gray-700 mb-1">{fileName}</p>
                  <a href={fileUrl} download={fileName} className="text-blue-600 underline text-xs" title="Download 3D model">Download</a>
                </div>
              )}
              <button type="button" onClick={() => handleDeleteFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-8 overflow-x-hidden">
      {/* Animated glassmorphism background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[90vw] h-[90vw] bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-white/10 rounded-full blur-3xl animate-spin-slow" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/40 via-blue-100/20 to-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-100/30 via-blue-300/20 to-white/10 rounded-full blur-2xl animate-float2" />
      </div>
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-8 z-10">
        <div className="flex justify-end mt-2 mb-8">
          <div className="text-sm border border-blue-200 rounded-lg px-4 py-2 font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight drop-shadow-xl">
            Case Id: {formData?.caseId || patientId}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Step 4: File Upload</h1>
        <p className="text-gray-500 mb-8">Upload patient images and 3D models.</p>
        <form className="space-y-8" onSubmit={e => e.preventDefault()}>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Patient Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{imageLabels.map((_, idx) => <UploadComponent key={idx} idx={idx} />)}</div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">3D Models (PLY/STL)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{modelLabels.map((_, idx) => <UploadComponent key={idx + 11} idx={idx + 11} />)}</div>
          </div>
          <div className="flex justify-between items-center gap-4 pt-8 border-t">
            <Button onClick={prevStep} type="button" variant="outline">Previous</Button>
            <Button onClick={handleFinalSubmit} disabled={isLoading || !imageUrls.some(url => !!url)} type="submit">{isLoading ? "Submitting..." : "Submit"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { setFiles, setForm } from "@/store/features/patientFormSlice";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

export default function Step4Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state: any) => state.auth);
  const formData = useAppSelector((state) => state.patientForm);
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      dispatch(setFiles(files));
    }
  };

  const prevStep = () => {
    router.push(`/patients/create-patient-record/step-3?id=${patientId}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scanFiles || formData.scanFiles.length === 0) {
      toast.error("Please upload at least one file.");
      return;
    }
    if (!patientId) {
      toast.error("No patient ID found");
      return;
    }
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== "scanFiles") {
          const value = (formData as any)[key];
          if (typeof value === "object") {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });
      formData.scanFiles.forEach((file) => {
        formDataToSend.append("scanFiles", file);
      });
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update patient record");
      }
      const data = await response.json();
      dispatch(setForm(data));
      toast.success("Patient record updated successfully");
      router.push("/patients");
    } catch (error: any) {
      toast.error(error.message || "Failed to update patient record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-gray-800 animate-slide-up">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600">Step 4 of 4</span>
            <span className="text-xs text-gray-400">File Upload</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: '100%' }} />
          </div>
        </div>
        {/* Heading & Description */}
        <h1 className="text-3xl font-bold text-blue-700 dark:text-white mb-1 tracking-tight">Step 4: File Upload</h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8 text-sm">Upload all relevant patient files. You can upload up to 3 files in PDF, JPG, PNG, or DOC format.</p>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <Label>Scan Files (Max 3 files)</Label>
              <div className="relative flex items-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 pr-12"
                />
                <ArrowUpTrayIcon className="w-6 h-6 absolute right-4 text-blue-400 pointer-events-none" />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX
              </p>
            </div>
            {formData.scanFiles.length > 0 && (
              <div>
                <Label>Selected Files:</Label>
                <ul className="mt-2 space-y-1">
                  {formData.scanFiles.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m7.5 0v10.5A2.25 2.25 0 0113.5 21h-3a2.25 2.25 0 01-2.25-2.25V9m7.5 0H6.75m8.25 0V5.25M6.75 9V5.25M6.75 9h10.5" /></svg>
                      {file.name} <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex justify-between pt-6">
            <Button onClick={prevStep} className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 text-base font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 17.25L3 12m0 0l3.75-5.25M3 12h18" /></svg>
              Previous
            </Button>
            <Button disabled={isLoading} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-base font-semibold">
              {isLoading ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Updating...</span>
              ) : (
                <span className="flex items-center gap-2">Update Patient Record <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 12m0 0l-3.75 5.25M21 12H3" /></svg></span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
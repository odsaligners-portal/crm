"use client";
import React, { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/route";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { setForm } from "@/store/features/patientFormSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

const UploadButton = generateUploadButton<OurFileRouter>();

export default function Step4Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state: any) => state.auth);
  const formData = useAppSelector((state) => state.patientForm);
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = React.useState(false);
  const [imageFiles, setImageFiles] = React.useState<any[]>(Array(13).fill([]));
  const [imageUrls, setImageUrls] = React.useState<(string | undefined)[]>(Array(13).fill(undefined));
  const [progresses, setProgresses] = React.useState<number[]>(Array(13).fill(0));
  const uploadRefs = Array.from({ length: 13 }, () => useRef<HTMLDivElement | null>(null));

  // Add labels for each image slot
  const imageLabels = [
    'Upper arch',
    'Lower arch',
    'Anterior View',
    'Left View',
    'Right View',
    'Profile View',
    'Frontal View',
    'Smiling',
    'Panoramic Radiograph',
    'Lateral Radiograph',
    'Others',
    'Select PLY/TLS File to upload',
    'Select PLY/TLS File to upload',
  ];

  const triggerUpload = (idx: number) => {
    const input = uploadRefs[idx].current?.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (input) input.click();
  };

  React.useEffect(() => {
    if (!patientId) {
      toast.error('Please start from Step 1.');
      router.replace('/patients/create-patient-record/step-1');
      return;
    }
  }, [patientId, router]);

  const handleUploadComplete = (res: any[], idx: number) => {
    // File type validation
    if (idx >= 11) {
      // Only allow .ply or .tls
      const file = res[0];
      if (file && !file.name.match(/\.(ply|tls)$/i)) {
        toast.error('Only PLY or TLS files are allowed for this slot.');
        return;
      }
    } else {
      // Only allow images (jpg, jpeg, png)
      const file = res[0];
      if (file && !file.name.match(/\.(jpg|jpeg|png)$/i)) {
        toast.error('Only JPG, JPEG, or PNG images are allowed for this slot.');
        return;
      }
    }
    setImageFiles(prev => {
      const newArr = [...prev];
      newArr[idx] = res;
      return newArr;
    });
    setImageUrls(prev => {
      const newArr = [...prev];
      newArr[idx] = res[0]?.url;
      return newArr;
    });
    setProgresses(prev => {
      const newArr = [...prev];
      newArr[idx] = 0;
      return newArr;
    });
  };

  const handleDeleteFile = async (idx: number) => {
    const fileArr = imageFiles[idx];
    if (!fileArr[0]?.key) return;
    setIsLoading(true);
    try {
      await fetch("/api/uploadthing/delete", {
        method: "POST",
        body: JSON.stringify({ key: fileArr[0].key }),
        headers: { "Content-Type": "application/json" }
      });
      setImageFiles(prev => {
        const newArr = [...prev];
        newArr[idx] = [];
        return newArr;
      });
      setImageUrls(prev => {
        const newArr = [...prev];
        newArr[idx] = undefined;
        return newArr;
      });
      setProgresses(prev => {
        const newArr = [...prev];
        newArr[idx] = 0;
        return newArr;
      });
      toast.success("File deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete file");
    } finally {
      setIsLoading(false);
    }
  };

  const prevStep = () => {
    router.push(`/patients/create-patient-record/step-3?id=${patientId}`);
  };

  const allFilesUploaded = imageFiles.some(arr => arr.length > 0);

  const handleFinalSubmit = async () => {
    if (!patientId) {
      toast.error("No patient ID found");
      return;
    }
    setIsLoading(true);
    try {
      const mapFile = (fileArr: any[]) => fileArr.length > 0 ? [{
        fileUrl: fileArr[0].url,
        fileKey: fileArr[0].key,
        uploadedAt: fileArr[0].serverData?.uploadedAt || new Date().toISOString(),
      }] : [];
      const scanFiles: Record<string, any[]> = {};
      for (let i = 0; i < 11; i++) {
        scanFiles[`img${i+1}`] = mapFile(imageFiles[i]);
      }
      scanFiles['model1'] = mapFile(imageFiles[11]);
      scanFiles['model2'] = mapFile(imageFiles[12]);
      const response = await fetch(`/api/patients/update-details?id=${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ scanFiles }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save file details");
      }
      const data = await response.json();
      dispatch(setForm(data));
      toast.success("File details saved successfully");
      router.push("/patients");
    } catch (error: any) {
      toast.error(error.message || "Failed to save file details");
    } finally {
      setIsLoading(false);
    }
  };

  const getFileInfo = (idx: number) => imageFiles[idx].length > 0 ? imageFiles[idx][0] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-gray-800 animate-slide-up">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600">Step 4 of 4</span>
            <span className="text-xs text-gray-400">File Upload</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: '100%' }} />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-blue-700 dark:text-white mb-1 tracking-tight">Step 4: File Upload</h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8 text-sm">Upload all relevant patient files. You can upload up to 3 files in PDF, JPG, PNG.</p>
        <form className="space-y-8 flex flex-col min-h-[400px]" onSubmit={e => e.preventDefault()}>
          <div className="space-y-2 flex-1">
            {[...Array(13)].map((_, idx) => (
              <div key={idx}>
                <Label>{imageLabels[idx] || `Upload File ${idx+1}`}</Label>
                {!imageUrls[idx] ? (
                  <>
                    <div className="relative border-b border-gray-200 pb-2">
                      <div ref={uploadRefs[idx]} className="absolute inset-0 opacity-0 pointer-events-none">
                        <UploadButton
                          endpoint="patientFiles"
                          input={{ patientId: patientId || '' }}
                          onClientUploadComplete={res => handleUploadComplete(res, idx)}
                          onUploadError={(error: any) => { toast.error(`${imageLabels[idx] || `File ${idx+1}`} upload failed: ${error.message}`); setProgresses(prev => { const arr = [...prev]; arr[idx] = 0; return arr; }); }}
                          onUploadProgress={progress => setProgresses(prev => { const arr = [...prev]; arr[idx] = progress; return arr; })}
                          appearance={{ button: "w-full", container: "w-full" }}
                          // File type validation for PLY/TLS can be handled in onClientUploadComplete or onUploadError if needed
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerUpload(idx)}
                        className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-blue-50 transition"
                      >
                        Choose a file
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {idx < 11 ? 'Accepted formats: JPG, JPEG, PNG.' : 'Accepted formats: PLY, TLS.'}
                    </p>
                  </>
                ) : (
                  <div className="relative group max-w-xs mx-auto mt-4">
                    <div className="rounded-xl shadow-lg border border-blue-100 bg-white dark:bg-gray-800 transition-all duration-300 overflow-hidden">
                      <img src={imageUrls[idx]} alt={`Uploaded Image ${idx+1}`} className="w-full h-40 object-contain bg-gray-50 dark:bg-gray-900 transition-all duration-300" />
                      <button
                        type="button"
                        onClick={() => handleDeleteFile(idx)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 shadow-lg transition-transform duration-200 scale-100 group-hover:scale-110 z-10"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      <div className="px-4 py-2 text-xs text-gray-600 dark:text-gray-300 flex flex-col items-center">
                        <span className="font-medium">{getFileInfo(idx)?.name || `Image ${idx+1}`}</span>
                        <span>{getFileInfo(idx)?.uploadedAt ? new Date(getFileInfo(idx).uploadedAt).toLocaleString() : ''}</span>
                      </div>
                    </div>
                  </div>
                )}
                {progresses[idx] > 0 && progresses[idx] < 100 && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progresses[idx]}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-blue-100 dark:border-gray-800">
            <Button onClick={prevStep} className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 text-base font-semibold w-full sm:w-auto">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 17.25L3 12m0 0l3.75-5.25M3 12h18" /></svg>
              Previous
            </Button>
            {allFilesUploaded && (
              <Button onClick={handleFinalSubmit} disabled={isLoading} className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 text-base font-semibold w-full sm:w-auto">
                {isLoading ? (
                  <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Submitting...</span>
                ) : (
                  <span className="flex items-center gap-2">Submit</span>
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
} 
"use client";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { storage } from "@/utils/firebase";
import { SparklesIcon, GlobeAltIcon, MapIcon } from "@heroicons/react/24/outline";
import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import ReactSelect from "react-select";
import { motion } from "framer-motion";

const sectionClass = "mb-8 p-6 rounded-2xl shadow bg-white/80 dark:bg-gray-900/80 border border-blue-100 dark:border-gray-800";

const priceOptions = {
  "Flexi": [
    { label: "Basic Plan - $999", value: "999" },
    { label: "Standard Plan - $1299", value: "1299" },
    { label: "Premium Plan - $1599", value: "1599" }
  ],
  "Premium": [
    { label: "Silver Plan - $1999", value: "1999" },
    { label: "Gold Plan - $2499", value: "2499" },
    { label: "Platinum Plan - $2999", value: "2999" }
  ],
  "Elite": [
    { label: "Executive Plan - $3499", value: "3499" },
    { label: "VIP Plan - $3999", value: "3999" },
    { label: "Luxury Plan - $4499", value: "4499" }
  ]
};

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
];
const modelLabels = ['Select PLY/STL File 1', 'Select PLY/STL File 2'];

type OptionType = { label: string; value: string };

const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" }
];
const caseCategoryOptions = [
  { label: "Flexi", value: "Flexi" },
  { label: "Premium", value: "Premium" },
  { label: "Elite", value: "Elite" }
];
const singleArchTypeOptions = [
  { label: "Single Upper Arch", value: "Single Upper Arch" },
  { label: "Single Lower Arch", value: "Single Lower Arch" }
];

const countriesData: Record<string, string[]> = {
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
  ],
  "Canada": [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador",
    "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island",
    "Quebec", "Saskatchewan", "Yukon"
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland"
  ],
  "Australia": [
    "Australian Capital Territory", "New South Wales", "Northern Territory", "Queensland",
    "South Australia", "Tasmania", "Victoria", "Western Australia"
  ],
  "Germany": [
    "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse",
    "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate",
    "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"
  ],
  "France": [
    "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire",
    "Corse", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandie", "Nouvelle-Aquitaine",
    "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur"
  ],
  "India": [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
    "West Bengal"
  ],
  "China": [
    "Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong", "Guangxi", "Guizhou",
    "Hainan", "Hebei", "Heilongjiang", "Henan", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu",
    "Jiangxi", "Jilin", "Liaoning", "Ningxia", "Qinghai", "Shaanxi", "Shandong", "Shanghai",
    "Shanxi", "Sichuan", "Tianjin", "Tibet", "Xinjiang", "Yunnan", "Zhejiang"
  ],
  "Japan": [
    "Aichi", "Akita", "Aomori", "Chiba", "Ehime", "Fukui", "Fukuoka", "Fukushima", "Gifu",
    "Gunma", "Hiroshima", "Hokkaido", "Hyogo", "Ibaraki", "Ishikawa", "Iwate", "Kagawa",
    "Kagoshima", "Kanagawa", "Kochi", "Kumamoto", "Kyoto", "Mie", "Miyagi", "Miyazaki",
    "Nagano", "Nagasaki", "Nara", "Niigata", "Oita", "Okayama", "Okinawa", "Osaka", "Saga",
    "Saitama", "Shiga", "Shimane", "Shizuoka", "Tochigi", "Tokushima", "Tokyo", "Tottori",
    "Toyama", "Wakayama", "Yamagata", "Yamaguchi", "Yamanashi"
  ],
  "Brazil": [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo",
    "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba",
    "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul",
    "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"
  ],
  "Mexico": [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
    "Coahuila", "Colima", "Ciudad de México", "Durango", "Estado de México", "Guanajuato", "Guerrero",
    "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
    "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas",
    "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
  ]
};
const countries = Object.keys(countriesData);

export default function EditPatientDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state: any) => state.auth);

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [fileKeys, setFileKeys] = useState<(string | undefined)[]>(Array(13).fill(undefined));
  const [imageUrls, setImageUrls] = useState<(string | undefined)[]>(Array(13).fill(undefined));
  const [progresses, setProgresses] = useState<number[]>(Array(13).fill(0));

  const [selectedCountry, setSelectedCountry] = useState(form?.country || "");
  const [selectedState, setSelectedState] = useState(form?.state || "");

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided");
      setLoading(false);
      return;
    }
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error("Failed to fetch patient");
        const result = await response.json();
        setForm(result);
        
        const loadedUrls = Array(13).fill(undefined);
        const loadedKeys = Array(13).fill(undefined);
        if (result.scanFiles) {
          for (let i = 0; i < 11; i++) {
            const file = result.scanFiles[`img${i + 1}`]?.[0];
            if (file) { loadedUrls[i] = file.fileUrl; loadedKeys[i] = file.fileKey; }
          }
          const model1 = result.scanFiles.model1?.[0];
          if (model1) { loadedUrls[11] = model1.fileUrl; loadedKeys[11] = model1.fileKey; }
          const model2 = result.scanFiles.model2?.[0];
          if (model2) { loadedUrls[12] = model2.fileUrl; loadedKeys[12] = model2.fileKey; }
        }
        setImageUrls(loadedUrls);
        setFileKeys(loadedKeys);
      } catch (e: any) { setError(e.message); } 
      finally { setLoading(false); }
    };
    fetchPatient();
  }, [patientId, token]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.includes(".")) {
      const [section, field] = name.split(".");
      setForm((prev: any) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      if (name === "caseCategory") {
        setForm((prev: any) => ({ ...prev, caseCategory: value, selectedPrice: "" }));
        return;
      }
      setForm((prev: any) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // Firebase file upload logic
  const handleFileUpload = (file: File, idx: number) => {
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

  const handleDeleteFile = async (idx: number) => {
    const fileKey = fileKeys[idx];
    if (!fileKey) return;
    setSaving(true);
    const fileRef = ref(storage, fileKey);
    try {
      await deleteObject(fileRef);
      setImageUrls(p => { const n = [...p]; n[idx] = undefined; return n; });
      setFileKeys(p => { const n = [...p]; n[idx] = undefined; return n; });
      setProgresses(p => { const n = [...p]; n[idx] = 0; return n; });
      toast.success("File deleted successfully");
    } catch (error: any) { toast.error(`Failed to delete file: ${error.message}`); } 
    finally { setSaving(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    const scanFiles: Record<string, any> = {};
    imageUrls.forEach((url, idx) => {
      if (url && fileKeys[idx]) {
        const fieldName = idx < 11 ? `img${idx + 1}` : `model${idx - 10}`;
        scanFiles[fieldName] = [{ fileUrl: url, fileKey: fileKeys[idx], uploadedAt: new Date().toISOString() }];
      }
    });
    const updatedForm = { ...form, scanFiles };
    try {
      const response = await fetch(`/api/patients/update-details?id=${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updatedForm),
      });
      if (!response.ok) throw new Error("Failed to save changes");
      toast.success("Changes saved successfully!");
      router.push('/patients');
    } catch (error: any) { toast.error(`Error saving: ${error.message}`); } 
    finally { setSaving(false); }
  };

  const getFileNameFromUrl = (url: string) => { try { const path = new URL(url).pathname.split('/').pop()!; return decodeURIComponent(path).substring(path.indexOf('-') + 1); } catch { return "file"; } };

  // Firebase Dropzone UploadComponent
  const UploadComponent = ({ idx }: { idx: number }) => {
    const onDrop = (acceptedFiles: File[]) => acceptedFiles.length > 0 && handleFileUpload(acceptedFiles[0], idx);
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

  if (loading) return <div className="flex justify-center items-center min-h-[40vh]">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!form) return null;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-16 px-2 overflow-x-hidden">
      {/* Animated glassmorphism background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[90vw] h-[90vw] bg-gradient-to-br from-blue-200/40 via-blue-100/30 to-white/10 rounded-full blur-3xl animate-spin-slow" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/40 via-blue-100/20 to-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-100/30 via-blue-300/20 to-white/10 rounded-full blur-2xl animate-float2" />
      </div>
      <div className="max-w-4xl w-full z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, type: 'spring' }}>
          <div className="text-center mb-12 animate-fadeInUp">
            <SparklesIcon className="w-12 h-12 mx-auto text-blue-700 drop-shadow-lg animate-bounce" />
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight mb-2 drop-shadow-xl">{form.patientName}</h1>
            <div className="text-lg md:text-xl text-blue-900 font-medium mb-2">Case Id : {form.caseId}</div>
          </div>
        </motion.div>
        <form className="max-w-4xl w-full z-10 space-y-10" onSubmit={handleSubmit}>
          {/* Section 1: Basic Details */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> Basic Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
              <div><Label>Patient Name</Label><Input name="patientName" value={form.patientName} onChange={handleChange} /></div>
              <div><Label>Age</Label><Input name="age" value={form.age} onChange={handleChange} /></div>
              <div><Label>Gender</Label><ReactSelect name="gender" options={genderOptions} value={genderOptions.find(opt => opt.value === form.gender) || null} onChange={(opt: OptionType | null) => handleChange({ target: { name: "gender", value: opt?.value } })} /></div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Past Medical History</Label><TextArea name="pastMedicalHistory" value={form.pastMedicalHistory} onChange={handleChange} /></div>
              <div><Label>Past Dental History</Label><TextArea name="pastDentalHistory" value={form.pastDentalHistory} onChange={handleChange} /></div>
            </div>
            <div className="mt-6">
              <Label>Treatment For</Label>
              <div className="flex gap-6 mt-2">
                {['Clear Aligners', 'Invisalign', 'Braces'].map(opt => (
                  <label key={opt} className="flex items-center gap-2">
                    <input type="radio" name="treatmentFor" value={opt} checked={form.treatmentFor === opt} onChange={handleChange} className="accent-blue-500" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group">
                <Label>
                  <span className="inline-flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-blue-500 group-focus-within:animate-bounce" /> Country
                  </span>
                </Label>
                <div className="relative bg-gradient-to-br from-blue-100/60 via-white/40 to-blue-200/40 dark:from-blue-900/40 dark:via-gray-900/60 dark:to-blue-800/40 rounded-2xl shadow-xl backdrop-blur-md border border-blue-200 dark:border-blue-800 group-focus-within:border-blue-500 group-focus-within:shadow-blue-200/60 transition-all">
                  <select
                    name="country"
                    value={form.country || ""}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border-none px-4 py-3 pr-10 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-md font-semibold text-base transition-colors duration-200"
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:scale-125 transition-transform">
                    <GlobeAltIcon className="w-6 h-6" />
                  </span>
                </div>
              </div>
              <div className="relative group">
                <Label>
                  <span className="inline-flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-500 group-focus-within:animate-bounce" /> State/Province
                  </span>
                </Label>
                <div className="relative bg-gradient-to-br from-blue-100/60 via-white/40 to-blue-200/40 dark:from-blue-900/40 dark:via-gray-900/60 dark:to-blue-800/40 rounded-2xl shadow-xl backdrop-blur-md border border-blue-200 dark:border-blue-800 group-focus-within:border-blue-500 group-focus-within:shadow-blue-200/60 transition-all">
                  <select
                    name="state"
                    value={form.state || ""}
                    onChange={handleChange}
                    required
                    disabled={!form.country}
                    className="w-full rounded-xl border-none px-4 py-3 pr-10 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 backdrop-blur-md font-semibold text-base disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-colors duration-200"
                  >
                    <option value="">Select State/Province</option>
                    {(form.country && countriesData[form.country]) && countriesData[form.country].map((state: string) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:scale-125 transition-transform">
                    <MapIcon className="w-6 h-6" />
                  </span>
                </div>
              </div>
              <div>
                <Label>City</Label>
                <Input name="city" value={form.city || ""} onChange={handleChange} />
              </div>
            </div>
            {/* Shipping Address Section */}
            <div className="mt-6">
              <Label>Shipping Address</Label>
              <div className="flex items-center space-x-6 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="shippingAddressType"
                    value="Primary Address"
                    checked={form.shippingAddressType === "Primary Address"}
                    onChange={handleChange}
                    className="mr-2 accent-blue-500"
                    required
                  />
                  Primary Address
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="shippingAddressType"
                    value="New Address"
                    checked={form.shippingAddressType === "New Address"}
                    onChange={handleChange}
                    className="mr-2 accent-blue-500"
                    required
                  />
                  New Address
                </label>
              </div>
              {form.shippingAddressType === "Primary Address" ? (
                <TextArea
                  name="primaryAddress"
                  value={form.primaryAddress || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter primary address"
                  className="focus:ring-2 focus:ring-blue-200"
                />
              ) : (
                <TextArea
                  name="shippingAddress"
                  value={form.shippingAddress || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter new shipping address"
                  className="focus:ring-2 focus:ring-blue-200"
                />
              )}
            </div>
            <div className="mt-6">
              <Label>Billing Address</Label>
              <TextArea
                name="billingAddress"
                value={form.billingAddress || ""}
                onChange={handleChange}
                rows={3}
                className="focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </motion.div>
          {/* Section 2: Chief Complaint & Case */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> Chief Complaint & Case</div>
            <div className="mb-6">
              <Label>Chief Complaint</Label>
              <TextArea name="chiefComplaint" value={form.chiefComplaint || ""} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Case Type</Label>
                <div className="flex gap-6 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="caseType"
                      value="Single Arch"
                      checked={form.caseType === "Single Arch" || form.caseType === "Single Upper Arch" || form.caseType === "Single Lower Arch"}
                      onChange={e => {
                        handleChange(e);
                        setForm((prev: any) => ({ ...prev, caseType: "Single Arch" }));
                      }}
                      className="accent-blue-500"
                    />
                    Single Arch
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="caseType"
                      value="Double Arch"
                      checked={form.caseType === "Double Arch"}
                      onChange={e => {
                        handleChange(e);
                        setForm((prev: any) => ({ ...prev, singleArchType: "", caseType: "Double Arch" }));
                      }}
                      className="accent-blue-500"
                    />
                    Double Arch
                  </label>
                </div>
                {(form.caseType === "Single Arch" || form.caseType === "Single Upper Arch" || form.caseType === "Single Lower Arch") && (
                  <div className="mt-4">
                    <Label>Arch</Label>
                    <ReactSelect
                      name="singleArchType"
                      options={singleArchTypeOptions}
                      value={singleArchTypeOptions.find(opt => opt.value === (form.singleArchType || form.caseType)) || null}
                      onChange={(opt: OptionType | null) => {
                        handleChange({ target: { name: "singleArchType", value: opt?.value } });
                        setForm((prev: any) => ({ ...prev, caseType: opt?.value }));
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>Case Category</Label>
                <ReactSelect
                  name="caseCategory"
                  options={caseCategoryOptions}
                  value={caseCategoryOptions.find(opt => opt.value === form.caseCategory) || null}
                  onChange={(opt: OptionType | null) => {
                    handleChange({ target: { name: "caseCategory", value: opt?.value } });
                    setForm((prev: any) => ({ ...prev, selectedPrice: null }));
                  }}
                />
                {form.caseCategory && (
                  <div className="mt-4">
                    <Label>Package</Label>
                    <ReactSelect
                      name="selectedPrice"
                      options={priceOptions[form.caseCategory as keyof typeof priceOptions] || []}
                      value={(priceOptions[form.caseCategory as keyof typeof priceOptions] || []).find(opt => opt.value === form.selectedPrice) || null}
                      onChange={(opt: OptionType | null) => setForm((prev: any) => ({ ...prev, selectedPrice: opt?.value }))}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <Label>Case Category Comments</Label>
              <TextArea name="caseCategoryDetails" value={form.caseCategoryDetails || ""} onChange={handleChange} />
            </div>
            <div className="mt-6">
              <Label>Treatment Plan</Label>
              <TextArea name="treatmentPlan" value={form.treatmentPlan || ""} onChange={handleChange} />
            </div>
            <div className="mt-6">
              <Label>Extraction Required</Label>
              <div className="flex gap-6 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="extraction.required"
                    value="true"
                    checked={form.extraction?.required === true}
                    onChange={e => setForm((prev: any) => ({ ...prev, extraction: { ...prev.extraction, required: true } }))}
                    className="accent-blue-500"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="extraction.required"
                    value="false"
                    checked={form.extraction?.required === false}
                    onChange={e => setForm((prev: any) => ({ ...prev, extraction: { ...prev.extraction, required: false } }))}
                    className="accent-blue-500"
                  />
                  No
                </label>
              </div>
            </div>
            <div className="mt-6">
              <Label>Extraction Comments</Label>
              <TextArea name="extraction.comments" value={form.extraction?.comments || ""} onChange={handleChange} />
            </div>
          </motion.div>
          {/* Section 3: IPR, Midline & Arch Expansion */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> IPR, Midline & Arch Expansion</div>
            {/* IPR Section (checkboxes) */}
            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Interproximal Reduction (IPR)
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interproximalReduction.detail1"
                        checked={form.interproximalReduction?.detail1 === "Anterior Region (3 To 3)"}
                        onChange={e => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "Anterior Region (3 To 3)" : ""
                          }
                        })}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Anterior Region (3 To 3)
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interproximalReduction.detail2"
                        checked={form.interproximalReduction?.detail2 === "Posterior Region (Distal To Canine)"}
                        onChange={e => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "Posterior Region (Distal To Canine)" : ""
                          }
                        })}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Posterior Region (Distal To Canine)
                    </label>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interproximalReduction.detail3"
                        checked={form.interproximalReduction?.detail3 === "plan as required"}
                        onChange={e => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "plan as required" : ""
                          }
                        })}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      plan as required
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interproximalReduction.detail4"
                        checked={form.interproximalReduction?.detail4 === "No IPR"}
                        onChange={e => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "No IPR" : ""
                          }
                        })}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      No IPR
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {/* Measure of IPR Section (checkboxes) */}
            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50 mb-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                Measure of IPR
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="measureOfIPR.detailA"
                        checked={form.measureOfIPR?.detailA === "Upto 0.25mm/surface"}
                        onChange={e => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "Upto 0.25mm/surface" : ""
                          }
                        })}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Upto 0.25mm/surface
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="measureOfIPR.detailC"
                        checked={form.measureOfIPR?.detailC === "Plan as required"}
                        onChange={e => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "Plan as required" : ""
                          }
                        })}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Plan as required
                    </label>
                  </div>
                </div>
                <div>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="measureOfIPR.detailB"
                        checked={form.measureOfIPR?.detailB === "0.25mm to 0.5mm/surface"}
                        onChange={e => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "0.25mm to 0.5mm/surface" : ""
                          }
                        })}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      0.25mm to 0.5mm/surface
                    </label>
                  </div>
                </div>
              </div>
            </div>
            {/* IPR Comments */}
            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50 mb-6">
              <div>
                <Label>IPR Comments</Label>
                <TextArea
                  name="additionalComments"
                  value={form.additionalComments || ""}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>
            <div className="mb-6">
              <Label>Midline</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {['Adjust as Needed', 'Correct through IPR', 'Move to Left', 'Move to Right', 'None'].map(opt => (
                  <label key={opt} className="flex items-center gap-2">
                    <input type="radio" name="midline" value={opt} checked={form.midline === opt} onChange={handleChange} className="accent-blue-500" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <Label>Midline Comments</Label>
              <TextArea name="midlineComments" value={form.midlineComments || ""} onChange={handleChange} />
            </div>
            <div className="mb-6">
              <Label>Arch Expansion</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {['Move to Right', 'Expand in Anterior', 'Expand in Posterior', 'No Expansion Required', 'None'].map(opt => (
                  <label key={opt} className="flex items-center gap-2">
                    <input type="radio" name="archExpansion" value={opt} checked={form.archExpansion === opt} onChange={handleChange} className="accent-blue-500" />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6">
              <Label>Arch Expansion Comments</Label>
              <TextArea name="archExpansionComments" value={form.archExpansionComments || ""} onChange={handleChange} />
            </div>
          </motion.div>
          {/* Section 4: Files */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> Files</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {imageLabels.map((_, idx) => (
                <UploadComponent key={idx} idx={idx} />
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">3D Models (PLY/STL)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {modelLabels.map((_, idx) => <UploadComponent key={idx + 11} idx={idx + 11} />)}
              </div>
            </div>
          </motion.div>
          <div className="flex justify-end gap-4 py-8">
            <Button type="button" onClick={() => router.back()} variant="outline" className="transition-transform hover:scale-105">Cancel</Button>
            <Button type="submit" disabled={saving} className="transition-transform hover:scale-105">{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
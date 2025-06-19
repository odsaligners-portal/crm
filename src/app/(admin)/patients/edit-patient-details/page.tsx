"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import TextArea from "@/components/form/input/TextArea";
import { useSelector } from "react-redux";
import { generateUploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/route";
import { toast } from "react-toastify";

const sectionClass = "mb-8 p-6 rounded-2xl shadow bg-white/80 dark:bg-gray-900/80 border border-blue-100 dark:border-gray-800";

const countriesData = {
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

const UploadButton = generateUploadButton<OurFileRouter>();

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

export default function EditPatientDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state: any) => state.auth);
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFiles, setImageFiles] = React.useState<any[]>(Array(13).fill([]));
  const [imageUrls, setImageUrls] = React.useState<(string | undefined)[]>(Array(13).fill(undefined));
  const [progresses, setProgresses] = React.useState<number[]>(Array(13).fill(0));
  const uploadRefs = Array.from({ length: 13 }, () => React.useRef<HTMLDivElement | null>(null));

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided");
      setLoading(false);
      return;
    }
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error("Failed to fetch patient");
        const result = await response.json();
        setForm(result);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId, token]);

  useEffect(() => {
    setImageFiles(prev => {
      const newArr = [...prev];
      newArr[0] = form?.scanFiles?.img1 || [];
      newArr[1] = form?.scanFiles?.img2 || [];
      newArr[2] = form?.scanFiles?.img3 || [];
      newArr[3] = form?.scanFiles?.img4 || [];
      newArr[4] = form?.scanFiles?.img5 || [];
      newArr[5] = form?.scanFiles?.img6 || [];
      newArr[6] = form?.scanFiles?.img7 || [];
      newArr[7] = form?.scanFiles?.img8 || [];
      newArr[8] = form?.scanFiles?.img9 || [];
      newArr[9] = form?.scanFiles?.img10 || [];
      newArr[10] = form?.scanFiles?.img11 || [];
      newArr[11] = form?.scanFiles?.model1 || [];
      newArr[12] = form?.scanFiles?.model2 || [];
      return newArr;
    });
    setImageUrls(prev => {
      const newArr = [...prev];
      newArr[0] = form?.scanFiles?.img1?.[0]?.fileUrl;
      newArr[1] = form?.scanFiles?.img2?.[0]?.fileUrl;
      newArr[2] = form?.scanFiles?.img3?.[0]?.fileUrl;
      newArr[3] = form?.scanFiles?.img4?.[0]?.fileUrl;
      newArr[4] = form?.scanFiles?.img5?.[0]?.fileUrl;
      newArr[5] = form?.scanFiles?.img6?.[0]?.fileUrl;
      newArr[6] = form?.scanFiles?.img7?.[0]?.fileUrl;
      newArr[7] = form?.scanFiles?.img8?.[0]?.fileUrl;
      newArr[8] = form?.scanFiles?.img9?.[0]?.fileUrl;
      newArr[9] = form?.scanFiles?.img10?.[0]?.fileUrl;
      newArr[10] = form?.scanFiles?.img11?.[0]?.fileUrl;
      newArr[11] = form?.scanFiles?.model1?.[0]?.fileUrl;
      newArr[12] = form?.scanFiles?.model2?.[0]?.fileUrl;
      return newArr;
    });
  }, [form?.scanFiles]);

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
      if (name === "country") {
        setForm((prev: any) => ({ ...prev, country: value, state: "" }));
        return;
      }
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

  const handleExtractionChange = (e: any) => {
    setForm((prev: any) => ({
      ...prev,
      extraction: {
        ...prev.extraction,
        required: e.target.value === "true",
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const scanFiles: Record<string, any[]> = {};
    for (let i = 0; i < 11; i++) {
      scanFiles[`img${i+1}`] = imageFiles[i].map((f: any) => ({
        fileUrl: f.url || f.fileUrl,
        fileKey: f.key || f.fileKey,
        uploadedAt: f.uploadedAt || new Date(),
      }));
    }
    scanFiles['model1'] = imageFiles[11].map((f: any) => ({
      fileUrl: f.url || f.fileUrl,
      fileKey: f.key || f.fileKey,
      uploadedAt: f.uploadedAt || new Date(),
    }));
    scanFiles['model2'] = imageFiles[12].map((f: any) => ({
      fileUrl: f.url || f.fileUrl,
      fileKey: f.key || f.fileKey,
      uploadedAt: f.uploadedAt || new Date(),
    }));

    const updatedForm = { ...form, scanFiles };

    try {
      const res = await fetch(`/api/patients/update-details?id=${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(updatedForm),
      });
      if (!res.ok) throw new Error("Failed to update patient");
      router.push(`/patients/view-patient-details?id=${patientId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const triggerUpload = (idx: number) => {
    const input = uploadRefs[idx].current?.querySelector('input[type="file"]') as HTMLInputElement | null;
    if (input) input.click();
  };

  const handleUploadComplete = (res: any[], idx: number) => {
    if (idx >= 11) {
      const file = res[0];
      if (file && !file.name.match(/\.(ply|tls)$/i)) {
        toast.error('Only PLY or TLS files are allowed for this slot.');
        return;
      }
    } else {
      const file = res[0];
      if (file && !file.name.match(/\.(jpg|jpeg|png)$/i)) {
        toast.error('Only JPG, JPEG, or PNG images are allowed for this slot.');
        return;
      }
    }
    setImageFiles((prev: any[]) => { const newArr = [...prev]; newArr[idx] = res; return newArr; });
    setImageUrls((prev: (string | undefined)[]) => { const newArr = [...prev]; newArr[idx] = res[0]?.url; return newArr; });
    setProgresses((prev: number[]) => { const newArr = [...prev]; newArr[idx] = 0; return newArr; });
  };

  const handleDeleteFile = async (idx: number) => {
    let fileArr, setFileArr, setImageUrl, setProgress;
    if (idx < 11) {
      fileArr = imageFiles[idx]; setFileArr = setImageFiles; setImageUrl = setImageUrls; setProgress = setProgresses;
    } else {
      fileArr = imageFiles[11]; setFileArr = setImageFiles; setImageUrl = setImageUrls; setProgress = setProgresses;
    }
    const fileKey = fileArr[0]?.key || fileArr[0]?.fileKey;
    if (!fileKey) return;
    setSaving(true);
    try {
      await fetch("/api/uploadthing/delete", {
        method: "POST",
        body: JSON.stringify({ key: fileKey }),
        headers: { "Content-Type": "application/json" }
      });
      setFileArr(prev => { const newArr = [...prev]; newArr[idx] = []; return newArr; });
      setImageUrl(prev => { const arr = [...prev]; arr[idx] = undefined; return arr; });
      setProgress(prev => { const arr = [...prev]; arr[idx] = 0; return arr; });
    } catch (error: any) {
      // Optionally show error
    } finally {
      setSaving(false);
    }
  };

  const getFileInfo = (idx: number) => imageFiles[idx] && imageFiles[idx].length > 0 ? imageFiles[idx][0] : null;

  if (loading) return <div className="flex justify-center items-center min-h-[40vh]">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!form) return null;

  const { scanFiles = {}, extraction = {}, interproximalReduction = {}, measureOfIPR = {} } = form;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-16 px-2">
      <div className="max-w-4xl w-full z-10">
        <form className="max-w-4xl w-full z-10 space-y-10" onSubmit={handleSubmit}>
          {/* Section 1: Basic Details */}
          <div className={sectionClass}>
            <div className="text-2xl font-bold text-blue-700 mb-6">Basic Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
              <div><Label>Patient Name</Label><Input name="patientName" value={form.patientName} onChange={handleChange} /></div>
              <div><Label>Age</Label><Input name="age" value={form.age} onChange={handleChange} /></div>
              <div><Label>Gender</Label><Select name="gender" value={form.gender} onChange={handleChange} options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'},{label:'Other',value:'Other'}]} /></div>
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
              <div>
                <Label>Country</Label>
                <Select
                  name="country"
                  value={form.country || ""}
                  onChange={handleChange}
                  options={[
                    { label: "Select Country", value: "" },
                    ...countries.map((country) => ({ label: country, value: country })),
                  ]}
                />
              </div>
              <div>
                <Label>State/Province</Label>
                <Select
                  name="state"
                  value={form.state || ""}
                  onChange={handleChange}
                  options={[
                    { label: "Select State/Province", value: "" },
                    ...(form.country && countriesData[form.country as keyof typeof countriesData]
                      ? countriesData[form.country as keyof typeof countriesData].map((state) => ({ label: state, value: state }))
                      : []),
                  ]}
                  disabled={!form.country}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input name="city" value={form.city || ""} onChange={handleChange} />
              </div>
            </div>
            {/* Shipping Address Section (step-1 logic) */}
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
          </div>
          <div className={sectionClass}>
            <div className="text-2xl font-bold text-blue-700 mb-6">Chief Complaint & Case</div>
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
                    <Select
                      name="singleArchType"
                      value={form.singleArchType || form.caseType}
                      onChange={e => {
                        handleChange(e);
                        setForm((prev: any) => ({ ...prev, caseType: e.target.value }));
                      }}
                      options={[
                        { label: "Single Upper Arch", value: "Single Upper Arch" },
                        { label: "Single Lower Arch", value: "Single Lower Arch" },
                      ]}
                    />
                  </div>
                )}
              </div>
              <div>
                <Label>Case Category</Label>
                <Select
                  name="caseCategory"
                  value={form.caseCategory || ""}
                  onChange={handleChange}
                  options={[
                    { label: "Flexi", value: "Flexi" },
                    { label: "Premium", value: "Premium" },
                    { label: "Elite", value: "Elite" },
                  ]}
                />
                {form.caseCategory && (
                  <div className="mt-4">
                    <Label>Package</Label>
                    <Select
                      name="selectedPrice"
                      value={form.selectedPrice || ""}
                      onChange={handleChange}
                      options={[
                        ...(priceOptions[form.caseCategory as keyof typeof priceOptions] || [])
                      ]}
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
                    onChange={handleExtractionChange}
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
                    onChange={handleExtractionChange}
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
          </div>
          <div className={sectionClass}>
            <div className="text-2xl font-bold text-blue-700 mb-6">IPR, Midline & Arch Expansion</div>
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
                {['Adjust as Needed', 'Correct through IPR', 'Move to Left', 'Move to Right'].map(opt => (
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
                {['Move to Right', 'Expand in Anterior', 'Expand in Posterior', 'No Expansion Required'].map(opt => (
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
          </div>
          <div className={sectionClass}>
            <div className="text-2xl font-bold text-blue-700 mb-6">Files</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        <img src={imageUrls[idx]} alt={`Uploaded File ${idx+1}`} className="w-full h-40 object-contain bg-gray-50 dark:bg-gray-900 transition-all duration-300" />
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
                          <span className="font-medium">{getFileInfo(idx)?.name || `File ${idx+1}`}</span>
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
          </div>
          <div className="flex justify-end gap-4 py-8">
            <Button type="button" onClick={() => router.back()} variant="outline">Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}



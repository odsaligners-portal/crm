"use client";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import { GlobeAltIcon, MapIcon, SparklesIcon } from "@heroicons/react/24/solid";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";

const luxuryBg = `fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center bg-white`;
const glassCard = "relative bg-white/95 backdrop-blur-xl border border-blue-200 rounded-3xl shadow-2xl p-8 mb-12 overflow-hidden";
const sectionHeader = "flex items-center gap-3 text-2xl md:text-3xl font-extrabold text-blue-700 mb-6 animate-fadeInUp";
const divider = "h-1 w-1/2 mx-auto my-8 bg-blue-100 rounded-full opacity-60 animate-pulse";
const fadeIn = "animate-fadeInUp";

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

export default function ViewPatientDetails() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) {
      setError("No patient ID provided");
      return;
    }
    const fetchPatient = async () => {
      dispatch(setLoading(true));
      try {
        const result = await fetchWithError(`/api/admin/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchPatient();
  }, [patientId, token, dispatch]);

  if (error) return <div className="text-red-500 text-center py-8 text-xl font-semibold">{error}</div>;
  if (!data) return null; // Or a loading skeleton

  const { scanFiles = {}, extraction = {}, interproximalReduction = {}, measureOfIPR = {} } = data;

  // Debug log for scanFiles and file URLs
  if (typeof window !== 'undefined') {
    Object.entries(scanFiles).forEach(([key, arr]) => {
      if (Array.isArray(arr) && arr.length > 0) {
        console.log(`Slot ${key}:`, arr[0].fileUrl);
      }
    });
  }

  // Helper to get file name from URL
  const getFileNameFromUrl = (url) => {
    try {
      const path = new URL(url).pathname.split('/').pop() || "";
      return decodeURIComponent(path).substring(path.indexOf('-') + 1);
    } catch { return "file"; }
  };

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
            <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight mb-2 drop-shadow-xl">{data.patientName}</h1>
            <div className="text-lg md:text-xl text-blue-900 font-medium mb-2">Case Id : {data.caseId}</div>
          </div>
        </motion.div>
        <form className="max-w-4xl w-full z-10 space-y-10">
          {/* Section 1: Basic Details */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> Basic Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
              <div><Label>Patient Name</Label><Input value={data.patientName} disabled /></div>
              <div><Label>Age</Label><Input value={data.age} disabled /></div>
              <div><Label>Gender</Label><Select value={data.gender} options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'},{label:'Other',value:'Other'}]} disabled /></div>
              {data.userId && (
                <div className="md:col-span-3 col-span-1">
                  <Label>Doctor</Label>
                  <div className="w-full px-4 py-3 bg-blue-50 rounded-xl font-semibold text-blue-900">
                    {data.userId.name} {data.userId.email && <span className="text-gray-500 text-sm ml-2">({data.userId.email})</span>}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Past Medical History</Label><TextArea value={data.pastMedicalHistory} disabled /></div>
              <div><Label>Past Dental History</Label><TextArea value={data.pastDentalHistory} disabled /></div>
            </div>
            <div className="mt-6">
              <Label>Treatment For</Label>
              <div className="flex gap-6 mt-2">
                {['Clear Aligners', 'Invisalign', 'Braces'].map(opt => (
                  <label key={opt} className={`flex items-center gap-2 ${data.treatmentFor === opt ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={data.treatmentFor === opt} disabled className={`accent-blue-500 ${data.treatmentFor === opt ? 'ring-2 ring-blue-400' : ''}`} />
                    <span className={data.treatmentFor === opt ? 'text-blue-700' : ''}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group">
                <Label>
                  <span className="inline-flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-blue-500 group-hover:animate-bounce" /> Country
                  </span>
                </Label>
                <div className="relative bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/60 rounded-2xl shadow-xl backdrop-blur-md border border-blue-200 group-hover:border-blue-500 group-hover:shadow-blue-200/60 transition-all">
                  <div className="w-full rounded-xl border-none px-4 py-3 pr-10 bg-transparent text-gray-900 flex items-center font-semibold text-base min-h-[44px]">
                    <GlobeAltIcon className="w-6 h-6 text-blue-400 mr-2 group-hover:scale-125 transition-transform" />
                    <span>{data.country || "-"}</span>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <Label>
                  <span className="inline-flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-500 group-hover:animate-bounce" /> State/Province
                  </span>
                </Label>
                <div className="relative bg-gradient-to-br from-blue-50/80 via-white/60 to-blue-100/60 rounded-2xl shadow-xl backdrop-blur-md border border-blue-200 group-hover:border-blue-500 group-hover:shadow-blue-200/60 transition-all">
                  <div className="w-full rounded-xl border-none px-4 py-3 pr-10 bg-transparent text-gray-900 flex items-center font-semibold text-base min-h-[44px]">
                    <MapIcon className="w-6 h-6 text-blue-400 mr-2 group-hover:scale-125 transition-transform" />
                    <span>{data.state || "-"}</span>
                  </div>
                </div>
              </div>
              <div><Label>City</Label><Input value={data.city} disabled /></div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Primary Address</Label><Input value={data.primaryAddress} disabled /></div>
              <div><Label>Shipping Address</Label><Input value={data.shippingAddress} disabled /></div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><Label>Billing Address</Label><Input value={data.billingAddress} disabled /></div>
              <div><Label>Shipping Address Type</Label><Input value={data.shippingAddressType} disabled /></div>
            </div>
          </motion.div>
          <div className={divider} />
          {/* Section 2: Chief Complaint & Case */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> Chief Complaint & Case</div>
            <div className="mb-6"><Label>Chief Complaint</Label><TextArea value={data.chiefComplaint} disabled /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Case Type</Label>
                <div className="flex gap-6 mt-2">
                  <label className={`flex items-center gap-2 ${data.caseType && data.caseType.includes('Single') ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={data.caseType && data.caseType.includes('Single')} disabled className={`accent-blue-500 ${data.caseType && data.caseType.includes('Single') ? 'ring-2 ring-blue-400' : ''}`} />
                    <span className={data.caseType && data.caseType.includes('Single') ? 'text-blue-700' : ''}>Single Arch</span>
                  </label>
                  <label className={`flex items-center gap-2 ${data.caseType === 'Double Arch' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={data.caseType === 'Double Arch'} disabled className={`accent-blue-500 ${data.caseType === 'Double Arch' ? 'ring-2 ring-blue-400' : ''}`} />
                    <span className={data.caseType === 'Double Arch' ? 'text-blue-700' : ''}>Double Arch</span>
                  </label>
                </div>
                {data.caseType && data.caseType.includes('Single') && (
                  <div className="mt-4">
                    <Label>Arch</Label>
                    <Input value={data.caseType} disabled />
                  </div>
                )}
              </div>
              <div>
                <Label>Case Category</Label>
                {data.selectedPrice && (
                  <Input value={data.caseCategory} disabled />
                )}
                {data.selectedPrice && (
                  <div className="mt-4">
                    <Label>Package</Label>
                    <Input value={data.selectedPrice} disabled />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6"><Label>Case Category Comments</Label><TextArea value={data.caseCategoryDetails} disabled /></div>
            <div className="mt-6"><Label>Treatment Plan</Label><TextArea value={data.treatmentPlan} disabled /></div>
            <div className="mt-6">
              <Label>Extraction Required</Label>
              <div className="flex gap-6 mt-2">
                {['Yes', 'No'].map(opt => (
                  <label key={opt} className={`flex items-center gap-2 ${data.extraction?.required === (opt === 'Yes') ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={data.extraction?.required === (opt === 'Yes')} disabled className={`accent-blue-500 ${data.extraction?.required === (opt === 'Yes') ? 'ring-2 ring-blue-400' : ''}`} />
                    <span className={data.extraction?.required === (opt === 'Yes') ? 'text-blue-700' : ''}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6"><Label>Extraction Comments</Label><TextArea value={data.extraction?.comments} disabled /></div>
          </motion.div>
          <div className={divider} />
          {/* Section 3: IPR, Midline & Arch Expansion */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> IPR, Midline & Arch Expansion</div>
            {/* IPR Section (modern pill checkboxes) */}
            <div className="mb-8 p-6 rounded-2xl shadow bg-white/80 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                </span>
                <span className="text-xl font-bold text-blue-700">Interproximal Reduction (IPR)</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'detail1', label: 'Anterior Region (3 To 3)' },
                  { key: 'detail2', label: 'Posterior Region (Distal To Canine)' },
                  { key: 'detail3', label: 'plan as required' },
                  { key: 'detail4', label: 'No IPR' },
                ].map(opt => {
                  const checked = interproximalReduction?.[opt.key] === opt.label;
                  return (
                    <span
                      key={opt.key}
                      role="checkbox"
                      aria-checked={checked}
                      className={`
                        flex items-center gap-2 px-5 py-2 rounded-full border transition-all select-none shadow-sm
                        ${checked
                          ? 'bg-gradient-to-r from-blue-500 to-blue-400 border-blue-600 text-white font-bold'
                          : 'bg-gray-50 border-gray-300 text-gray-500'}
                        ${!checked ? 'hover:bg-blue-50' : ''}
                        cursor-default
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled
                        className="hidden"
                      />
                      {checked && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="text-base">{opt.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            {/* Measure of IPR Section (modern pill checkboxes) */}
            <div className="mb-8 p-6 rounded-2xl shadow bg-white/80 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 12h16" /></svg>
                </span>
                <span className="text-xl font-bold text-blue-700">Measure of IPR</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'detailA', label: 'Upto 0.25mm/surface' },
                  { key: 'detailB', label: '0.25mm to 0.5mm/surface' },
                  { key: 'detailC', label: 'Plan as required' },
                ].map(opt => {
                  const checked = measureOfIPR?.[opt.key] === opt.label;
                  return (
                    <span
                      key={opt.key}
                      role="checkbox"
                      aria-checked={checked}
                      className={`
                        flex items-center gap-2 px-5 py-2 rounded-full border transition-all select-none shadow-sm
                        ${checked
                          ? 'bg-gradient-to-r from-blue-500 to-blue-400 border-blue-600 text-white font-bold'
                          : 'bg-gray-50 border-gray-300 text-gray-500'}
                        ${!checked ? 'hover:bg-blue-50' : ''}
                        cursor-default
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled
                        className="hidden"
                      />
                      {checked && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      <span className="text-base">{opt.label}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="mb-6"><Label>Additional Comments</Label><TextArea value={data.additionalComments} disabled /></div>
            <div className="mb-6">
              <Label>Midline</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {['Adjust as Needed', 'Correct through IPR', 'Move to Left', 'Move to Right', 'None' ].map(opt => (
                  <label key={opt} className={`flex items-center gap-2 ${data.midline === opt ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={data.midline === opt} disabled className={`accent-blue-500 ${data.midline === opt ? 'ring-2 ring-blue-400' : ''}`} />
                    <span className={data.midline === opt ? 'text-blue-700' : ''}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6"><Label>Midline Comments</Label><TextArea value={data.midlineComments} disabled /></div>
            <div className="mb-6">
              <Label>Arch Expansion</Label>
              <div className="flex flex-wrap gap-3 mt-2">
                {['Move to Right', 'Expand in Anterior', 'Expand in Posterior', 'No Expansion Required', 'None'].map(opt => (
                  <label key={opt} className={`flex items-center gap-2 ${data.archExpansion === opt ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={data.archExpansion === opt} disabled className={`accent-blue-500 ${data.archExpansion === opt ? 'ring-2 ring-blue-400' : ''}`} />
                    <span className={data.archExpansion === opt ? 'text-blue-700' : ''}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6"><Label>Arch Expansion Comments</Label><TextArea value={data.archExpansionComments} disabled /></div>
          </motion.div>
          <div className={divider} />
          {/* Section 4: Files */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7, type: 'spring' }} className="mb-8 p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-gray-900/70 border border-blue-200/60 dark:border-gray-800/80 backdrop-blur-xl hover:shadow-blue-200/40 transition-all">
            <div className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent mb-6 flex items-center gap-3"><SparklesIcon className="w-7 h-7 text-blue-400 animate-pulse" /> Files</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(11)].map((_, idx) => {
                const file = scanFiles[`img${idx + 1}`]?.[0];
                if (!file) return (
                  <div key={idx} className="text-center"><Label>{imageLabels[idx]}</Label><div className="h-32 flex items-center justify-center text-gray-400">No file</div></div>
                );
                const fileUrl = file.fileUrl;
                let fileName = '';
                let fileExt = '';
                if (typeof fileUrl === 'string') {
                  fileName = getFileNameFromUrl(fileUrl);
                  fileExt = fileName.split('.').pop()?.toLowerCase() || '';
                }
                return (
                  <div key={idx} className="text-center">
                    <Label>{imageLabels[idx]}</Label>
                    {['jpg','jpeg','png'].includes(fileExt) ? (
                      <div className="flex flex-col items-center">
                        <img src={fileUrl || ''} alt={fileName} className="w-full h-32 object-contain rounded-xl border shadow" />
                        <a href={fileUrl || ''} download={fileName} className="mt-2 text-blue-600 underline text-xs" title="Download image">Download</a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-32 w-full p-2 border rounded-xl shadow bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z" /></svg>
                        <p className="break-all text-xs font-medium text-gray-700 mb-1">{fileName}</p>
                        <a href={fileUrl || ''} download={fileName} className="text-blue-600 underline text-xs" title="Download 3D model">Download</a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">3D Models (PLY/STL)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, idx) => {
                  const file = scanFiles[`model${idx + 1}`]?.[0];
                  if (!file) return (
                    <div key={idx} className="text-center"><Label>{`Select PLY/STL File ${idx + 1}`}</Label><div className="h-32 flex items-center justify-center text-gray-400">No file</div></div>
                  );
                  const fileUrl = file.fileUrl;
                  let fileName = '';
                  let fileExt = '';
                  if (typeof fileUrl === 'string') {
                    fileName = getFileNameFromUrl(fileUrl);
                    fileExt = fileName.split('.').pop()?.toLowerCase() || '';
                  }
                  return (
                    <div key={idx} className="text-center">
                      <Label>{`Select PLY/STL File ${idx + 1}`}</Label>
                      <div className="flex flex-col items-center justify-center h-32 w-full p-2 border rounded-xl shadow bg-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l9 4.5v9L12 21l-9-4.5v-9L12 3z" /></svg>
                        <p className="break-all text-xs font-medium text-gray-700 mb-1">{fileName}</p>
                        <a href={fileUrl || ''} download={fileName} className="text-blue-600 underline text-xs" title="Download 3D model">Download</a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </form>
        <div className={divider} />
        <div className={glassCard + " " + fadeIn}>
          <div className={sectionHeader}><SparklesIcon className="w-8 h-8 text-blue-400" /> Other</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <div><Label>Privacy Accepted</Label><div>{data.privacyAccepted ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}</div></div>
            <div><Label>Declaration Accepted</Label><div>{data.declarationAccepted ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-red-600 font-bold">No</span>}</div></div>
            <div><Label>Case ID</Label><div className="font-mono text-blue-900">{data.caseId}</div></div>
          </div>
        </div>
      </div>
      {/* Sticky footer with Back and Edit buttons */}
      <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 justify-end items-center py-8 px-2 sticky bottom-0 bg-white z-20 border-t border-blue-100 mt-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 rounded-lg bg-blue-50 text-blue-700 font-semibold shadow hover:bg-blue-100 transition"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/patients/edit-patient-details?id=${data._id}`)}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

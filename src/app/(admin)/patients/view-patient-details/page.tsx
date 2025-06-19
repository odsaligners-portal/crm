"use client";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import { BriefcaseIcon, DocumentTextIcon, ShieldCheckIcon, SparklesIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

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
  const { token } = useSelector((state: any) => state.auth);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setData(result);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();
  }, [patientId, token]);

  if (loading) return <div className="flex justify-center items-center min-h-[40vh] text-3xl font-bold text-blue-700 animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500 text-center py-8 text-xl font-semibold">{error}</div>;
  if (!data) return null;

  const { scanFiles = {}, extraction = {}, interproximalReduction = {}, measureOfIPR = {} } = data;

  // Debug log for scanFiles and file URLs
  if (typeof window !== 'undefined') {
    console.log('scanFiles:', scanFiles);
    Object.entries(scanFiles).forEach(([key, arr]) => {
      if (Array.isArray(arr) && arr.length > 0) {
        console.log(`Slot ${key}:`, arr[0].fileUrl);
      }
    });
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center py-16 px-2">
      {/* Animated luxury background */}
      {/* <div className={luxuryBg} aria-hidden="true">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[80vw] h-[80vw] bg-gradient-to-br from-blue-100/60 via-blue-300/40 to-blue-200/20 rounded-full blur-3xl animate-spin-slow" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/40 via-blue-100/20 to-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-100/30 via-blue-300/20 to-white/10 rounded-full blur-2xl animate-float2" />
      </div> */}
      {/* Floating back button */}
      {/* <button onClick={() => router.back()} className="fixed top-36 left-8 z-20 bg-white border border-blue-300 rounded-full shadow-lg p-3 hover:scale-110 transition-transform flex items-center gap-2 text-blue-700 font-bold text-lg backdrop-blur-xl">
        <ArrowLeftIcon className="w-6 h-6" /> Back
      </button> */}
      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-12 animate-fadeInUp">
          <SparklesIcon className="w-12 h-12 mx-auto text-blue-700 drop-shadow-lg animate-bounce" />
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-700 tracking-tight mb-2">{data.patientName}</h1>
          <div className="text-lg md:text-xl text-blue-900 font-medium mb-2">Case Id : {data.caseId}</div>
        </div>
        <form className="max-w-4xl w-full z-10 space-y-10">
          {/* Section 1: Basic Details */}
          <div className={glassCard + " " + fadeIn}>
            <div className={sectionHeader}><UserCircleIcon className="w-8 h-8 text-blue-400" /> Basic Details</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
              <div><Label>Patient Name</Label><Input value={data.patientName} disabled /></div>
              <div><Label>Age</Label><Input value={data.age} disabled /></div>
              <div><Label>Gender</Label><Select value={data.gender} options={[{label:'Male',value:'Male'},{label:'Female',value:'Female'},{label:'Other',value:'Other'}]} disabled /></div>
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
              <div><Label>Country</Label><Input value={data.country} disabled /></div>
              <div><Label>State</Label><Input value={data.state} disabled /></div>
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
          </div>
          <div className={divider} />
          {/* Section 2: Chief Complaint & Case */}
          <div className={glassCard + " " + fadeIn}>
            <div className={sectionHeader}><BriefcaseIcon className="w-8 h-8 text-blue-400" /> Chief Complaint & Case</div>
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
                <Select value={data.caseCategory} options={[{label:'Flexi',value:'Flexi'},{label:'Premium',value:'Premium'},{label:'Elite',value:'Elite'}]} disabled />
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
          </div>
          <div className={divider} />
          {/* Section 3: IPR, Midline & Arch Expansion */}
          <div className={glassCard + " " + fadeIn}>
            <div className={sectionHeader}><DocumentTextIcon className="w-8 h-8 text-blue-400" /> IPR, Midline & Arch Expansion</div>
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
                {['Adjust as Needed', 'Correct through IPR', 'Move to Left', 'Move to Right'].map(opt => (
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
                {['Move to Right', 'Expand in Anterior', 'Expand in Posterior', 'No Expansion Required'].map(opt => (
                  <label key={opt} className={`flex items-center gap-2 ${data.archExpansion === opt ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                    <input type="radio" checked={data.archExpansion === opt} disabled className={`accent-blue-500 ${data.archExpansion === opt ? 'ring-2 ring-blue-400' : ''}`} />
                    <span className={data.archExpansion === opt ? 'text-blue-700' : ''}>{opt}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-6"><Label>Arch Expansion Comments</Label><TextArea value={data.archExpansionComments} disabled /></div>
          </div>
          <div className={divider} />
          {/* Section 4: Files */}
          <div className={glassCard + " " + fadeIn}>
            <div className={sectionHeader}><ShieldCheckIcon className="w-8 h-8 text-blue-400" /> Files</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 13 }).map((_, idx) => {
                const key = idx < 11 ? `img${idx+1}` : idx === 11 ? 'model1' : 'model2';
                const arr = scanFiles[key] || [];
                if (!arr.length) return null;
                const file = arr[0];
                const isImage = file.fileUrl;
                const isModel = file.fileUrl && file.fileUrl.match(/\.(ply|tls)$/i);
                return (
                  <div key={key} className="relative border-2 border-blue-200 rounded-2xl bg-white shadow-xl p-4 overflow-hidden group">
                    <div className="mb-2 font-semibold text-blue-700 text-center">{imageLabels[idx] || `File ${idx+1}`}</div>
                    {isImage ? (
                      <img src={file.fileUrl} alt={file.fileKey} className="w-full h-40 object-contain rounded-xl mb-2 shadow-lg border border-blue-100 bg-white" />
                    ) : isModel ? (
                      <div className="flex flex-col items-center justify-center h-40">
                        <svg className="w-12 h-12 text-blue-400 mb-2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                        <span className="text-blue-700 font-semibold">PLY/TLS file</span>
                        <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mt-1">Download Model</a>
                      </div>
                    ) : (
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className="block group-hover:scale-105 transition-transform duration-300 text-blue-600 underline text-center">
                        Download {imageLabels[idx] || `File ${idx+1}`}
                      </a>
                    )}
                    <div className="flex items-center justify-center gap-2 text-xs text-blue-500">
                      {file.uploadedAt && new Date(file.uploadedAt).toLocaleString()}
                      <a
                        href={`/api/download?url=${encodeURIComponent(file.fileUrl)}&filename=${encodeURIComponent((file.fileKey ? file.fileKey.split("/").pop() : `file-${key}`) + (isImage ? '.jpg' : ''))}`}
                        className="ml-2 p-1 rounded-full hover:bg-blue-100 transition"
                        title="Download file"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                        </svg>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
          onClick={() => router.push(`/patients/edit-patient-details?id=${data._id}`)}
          className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

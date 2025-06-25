"use client";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { archExpansionOptions, midlineOptions } from "@/constants/data";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function Step3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [patientDatails, setPatientDatails] = React.useState(null);

  // Local state for form data
  const [formData, setFormData] = React.useState({
    midline: "",
    midlineComments: "",
    archExpansion: "",
    archExpansionComments: "",
  });

  // Fetch patient data when component mounts and patientId exists
  React.useEffect(() => {
    if (!patientId) {
      toast.error('Please start from Step 1.');
      router.replace('/admin/patients/create-patient-record/step-1');
      return;
    }
  }, [patientId, router]);

  React.useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId || !token) return;
      dispatch(setLoading(true));
      try {
        const patientData = await fetchWithError(`/api/admin/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setPatientDatails(patientData);
        // Pre-fill local form state with fetched data
        setFormData((prev) => ({
          ...prev,
          midline: patientData.midline || "",
          midlineComments: patientData.midlineComments || "",
          archExpansion: patientData.archExpansion || "",
          archExpansionComments: patientData.archExpansionComments || "",
        }));
      } catch (error) {
        // fetchWithError handles toast
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchPatientData();
  }, [patientId, token, dispatch]);

  // Local handleChange for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      // Validation: require at least midline or archExpansion
      if (!formData.midline && !formData.archExpansion) {
        toast.error("Please select at least one option for Midline or Arch Expansion.");
        dispatch(setLoading(false));
        return;
      }
      // Save data to database using update-details API
      await fetchWithError(`/api/admin/patients/update-details?id=${encodeURIComponent(patientId || '').trim()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          midline: formData.midline,
          midlineComments: formData.midlineComments,
          archExpansion: formData.archExpansion,
          archExpansionComments: formData.archExpansionComments
        })
      });
      toast.success('Details updated successfully');
      // Proceed to next step
      router.push(`/admin/patients/create-patient-record/step-4?id=${patientId}`);
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };
  const prevStep = () => {
    router.push(`/admin/patients/create-patient-record/step-2?id=${patientId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-gray-800 animate-slide-up">
        {/* Progress Bar */}
        <div className="flex justify-end mt-8 mb-10">
          <div className="text-sm border border-blue-200 rounded-lg px-4 py-2 font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight drop-shadow-xl">Case Id: {patientDatails?.caseId || patientId}</div>
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600">Step 3 of 4</span>
            <span className="text-xs text-gray-400">Midline & Arch Expansion</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: '75%' }} />
          </div>
        </div>
        {/* Heading & Description */}
        <h1 className="text-3xl font-bold text-blue-700 dark:text-white mb-1 tracking-tight">Step 3: Midline & Arch Expansion</h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8 text-sm">Provide details about midline and arch expansion measurements to help us plan the treatment precisely.</p>
        
        <form className="space-y-8" onSubmit={nextStep}>
          <div className="space-y-6">
            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowsRightLeftIcon className="w-5 h-5 text-blue-400" /> 
                Midline & Arch Expansion
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
                <div>
                  <Label>Midline</Label>
                  <div className="space-y-2 mt-2">
                    {midlineOptions.map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="midline"
                          value={option}
                          checked={formData.midline === option}
                          onChange={handleChange}
                          className="mr-2 accent-blue-500 w-4 h-4"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
                
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <Label>Midline Comments</Label>
                  <TextArea
                    name="midlineComments"
                    value={formData.midlineComments}
                    onChange={handleChange}
                    rows={2}
                    className="focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
                <div>
                  <Label>Arch Expansion</Label>
                  <div className="space-y-2 mt-2">
                    {archExpansionOptions.map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="archExpansion"
                          value={option}
                          checked={formData.archExpansion === option}
                          onChange={handleChange}
                          className="mr-2 accent-blue-500 w-4 h-4"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div>
                  <Label>Arch Expansion Comments</Label>
                  <TextArea
                    name="archExpansionComments"
                    value={formData.archExpansionComments}
                    onChange={handleChange}
                    rows={2}
                    className="focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6">
            <Button 
              type="button"
              onClick={prevStep} 
              className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 text-base font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 17.25L3 12m0 0l3.75-5.25M3 12h18" />
              </svg>
              Previous
            </Button>
            <Button 
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              Next
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
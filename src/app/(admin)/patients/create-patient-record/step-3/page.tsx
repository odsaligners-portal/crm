"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { setField, setNestedField } from "@/store/features/patientFormSlice";
import { ArrowsRightLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Step3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state: any) => state.auth);
  const formData = useAppSelector((state) => state.patientForm);
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDataLoading, setIsDataLoading] = React.useState(false);
  const [patientDatails, setPatientDatails] = React.useState<any>(null);

  // Fetch patient data when component mounts and patientId exists
  React.useEffect(() => {
    if (!patientId) {
      toast.error('Please start from Step 1.');
      router.replace('/patients/create-patient-record/step-1');
      return;
    }
  }, [patientId, router]);

  React.useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId || !token) return;
      
      setIsDataLoading(true);
      try {
        const response = await fetch(`/api/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const patientData = await response.json();
          setPatientDatails(patientData);
          // Update form with fetched data
          if (patientData.midline) {
            dispatch(setField({ field: 'midline', value: patientData.midline }));
          }
          if (patientData.midlineComments) {
            dispatch(setField({ field: 'midlineComments', value: patientData.midlineComments }));
          }
          if (patientData.archExpansion) {
            dispatch(setField({ field: 'archExpansion', value: patientData.archExpansion }));
          }
          if (patientData.archExpansionComments) {
            dispatch(setField({ field: 'archExpansionComments', value: patientData.archExpansionComments }));
          }
        } else if (response.status === 404) {
          toast.error('Patient not found or you do not have permission to view this record');
        } else if (response.status === 401) {
          toast.error('Unauthorized access. Please log in again.');
        }
      } catch (error: any) {
        console.error('Error fetching patient data:', error);
        toast.error('Failed to load patient data. Please try again.');
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, token, dispatch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name.includes(".")) {
      const [section, field] = name.split(".");
      dispatch(setNestedField({ section, field, value: type === "number" ? Number(value) : value }));
    } else {
      dispatch(setField({ field: name, value: type === "number" ? Number(value) : value }));
    }
  };

  const nextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Validation: require at least midline or archExpansion
      if (!formData.midline && !formData.archExpansion) {
        toast.error("Please select at least one option for Midline or Arch Expansion.");
        return;
      }

      // Save data to database using update-details API
      const response = await fetch(`/api/patients/update-details?id=${encodeURIComponent(patientId || '').trim()}`, {
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

      if (!response.ok) {
        const error = await response.json();
        if (response.status === 404) {
          throw new Error('Patient not found or you do not have permission to modify this record');
        } else if (response.status === 401) {
          throw new Error('Unauthorized access. Please log in again.');
        } else {
          throw new Error(error.message || 'Failed to save data');
        }
      }

      toast.success('Details updated successfully');
      // Proceed to next step
      router.push(`/patients/create-patient-record/step-4?id=${patientId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const prevStep = () => {
    router.push(`/patients/create-patient-record/step-2?id=${patientId}`);
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
        
        {isDataLoading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-3">
              <svg className="animate-spin h-5 w-5 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-blue-700 dark:text-blue-300 font-medium">Loading patient data...</span>
            </div>
          </div>
        )}
        
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
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="midline"
                        value="Adjust as Needed"
                        checked={formData.midline === "Adjust as Needed"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Adjust as Needed
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="midline"
                        value="Correct through IPR"
                        checked={formData.midline === "Correct through IPR"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Correct through IPR
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="midline"
                        value="Move to Left"
                        checked={formData.midline === "Move to Left"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Move to Left
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="midline"
                        value="Move to Right"
                        checked={formData.midline === "Move to Right"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Move to Right
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="midline"
                        value="None"
                        checked={formData.midline === "None"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      None
                    </label>
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
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="archExpansion"
                        value="Move to Right"
                        checked={formData.archExpansion === "Move to Right"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Move to Right
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="archExpansion"
                        value="Expand in Anterior"
                        checked={formData.archExpansion === "Expand in Anterior"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Expand in Anterior
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="archExpansion"
                        value="Expand in Posterior"
                        checked={formData.archExpansion === "Expand in Posterior"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Expand in Posterior
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="archExpansion"
                        value="No Expansion Required"
                        checked={formData.archExpansion === "No Expansion Required"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      No Expansion Required
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="archExpansion"
                        value="None"
                        checked={formData.archExpansion === "None"}
                        onChange={handleChange}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      None
                    </label>
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
              disabled={isLoading} 
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-base font-semibold"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 12m0 0l-3.75 5.25M21 12H3" />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
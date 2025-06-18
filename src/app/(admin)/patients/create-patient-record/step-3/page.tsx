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
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";

export default function Step3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state: any) => state.auth);
  const formData = useAppSelector((state) => state.patientForm);
  const dispatch = useAppDispatch();
  const [isLoading] = React.useState(false);

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

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    // Validation: require at least midline or archExpansion
    if (!formData.midline && !formData.archExpansion) {
      toast.error("Please fill at least Midline or Arch Expansion.");
      return;
    }
    router.push(`/patients/create-patient-record/step-4?id=${patientId}`);
  };
  const prevStep = () => {
    router.push(`/patients/create-patient-record/step-2?id=${patientId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-gray-800 animate-slide-up">
        {/* Progress Bar */}
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
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <Label>Midline</Label>
                  <Input
                    type="text"
                    name="midline"
                    value={formData.midline}
                    onChange={handleChange}
                    className="focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <Label>Arch Expansion</Label>
                  <Input
                    type="text"
                    name="archExpansion"
                    value={formData.archExpansion}
                    onChange={handleChange}
                    className="focus:ring-2 focus:ring-blue-200"
                  />
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
            <Button onClick={prevStep} className="px-8 py-3 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg shadow-lg hover:from-blue-500 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 text-base font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 17.25L3 12m0 0l3.75-5.25M3 12h18" />
              </svg>
              Previous
            </Button>
            <Button disabled={isLoading} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-base font-semibold">
              Next
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 12m0 0l-3.75 5.25M21 12H3" />
              </svg>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
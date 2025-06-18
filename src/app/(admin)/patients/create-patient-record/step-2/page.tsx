"use client";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import TextArea from "@/components/form/input/TextArea";
import Input from "@/components/form/input/InputField";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { setField, setNestedField } from "@/store/features/patientFormSlice";
import { 
  ClipboardDocumentListIcon, 
  ChatBubbleLeftRightIcon, 
  CurrencyDollarIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon
} from "@heroicons/react/24/outline";

// Price configurations based on case category
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

export default function Step2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state: any) => state.auth);
  const formData = useAppSelector((state) => state.patientForm);
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name.includes(".")) {
      const [section, field] = name.split(".");
      dispatch(setNestedField({ section, field, value: type === "number" ? Number(value) : value }));
    } else {
      // Reset price when case category changes
      if (name === "caseCategory") {
        dispatch(setField({ field: "selectedPrice", value: "" }));
      }
      dispatch(setField({ field: name, value: type === "number" ? Number(value) : value }));
    }
  };

  const handleExtractionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setNestedField({
      section: "extraction",
      field: "required",
      value: e.target.value === "true",
    }));
  };

  const nextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validation
      if (!formData.caseCategory) {
        toast.error("Please select a case category.");
        return;
      }
      if (formData.extraction.required === undefined) {
        toast.error("Please specify if extraction is required.");
        return;
      }

      // Save data to database
      const response = await fetch(`/api/patients/${encodeURIComponent(patientId || '').trim()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          chiefComplaint: formData.chiefComplaint,
          caseType: formData.caseType,
          singleArchType: formData.singleArchType,
          caseCategory: formData.caseCategory,
          selectedPrice: formData.selectedPrice,
          extraction: formData.extraction,
          interproximalReduction: formData.interproximalReduction,
          measureOfIPR: formData.measureOfIPR
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save data');
      }

      // Proceed to next step
      router.push(`/patients/create-patient-record/step-3?id=${patientId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const prevStep = () => {
    router.push(`/patients/create-patient-record/step-1?id=${patientId}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-gray-800 animate-slide-up">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600">Step 2 of 4</span>
            <span className="text-xs text-gray-400">Chief Complaint & Case</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: '50%' }} />
          </div>
        </div>
        {/* Heading & Description */}
        <h1 className="text-3xl font-bold text-blue-700 dark:text-white mb-1 tracking-tight">Step 2: Chief Complaint & Case</h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8 text-sm">Tell us about the patient's chief complaint and case details. This helps us understand the treatment needs better.</p>
        <form className="space-y-8" onSubmit={nextStep}>
          <div className="space-y-6">
            <div>
              <Label>Chief Complaint</Label>
              <div className="relative">
                <TextArea
                  name="chiefComplaint"
                  value={formData.chiefComplaint}
                  onChange={handleChange}
                  rows={3}
                  className="pl-10 focus:ring-2 focus:ring-blue-200"
                />
                <ChatBubbleLeftRightIcon className="w-5 h-5 absolute left-3 top-3 text-blue-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label>Case Type *</Label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="caseType"
                      value="Single Arch"
                      checked={formData.caseType === "Single Arch"}
                      onChange={handleChange}
                      className="mr-2 accent-blue-500"
                      required
                    />
                    Single Arch
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="caseType"
                      value="Double Arch"
                      checked={formData.caseType === "Double Arch"}
                      onChange={handleChange}
                      className="mr-2 accent-blue-500"
                      required
                    />
                    Double Arch
                  </label>
                </div>
              </div>

              <div>
                {/* Show dropdown if Single Arch is selected */}
                {formData.caseType === "Single Arch" && (
                  <div className="mt-4">
                    <Label>Arch *</Label>
                    <Select
                      options={[
                        { label: "Upper Arch", value: "Upper Arch" },
                        { label: "Lower Arch", value: "Lower Arch" },
                      ]}
                      name="singleArchType"
                      value={formData.singleArchType || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
              <div>
                <Label>Case Category *</Label>
                <Select
                  options={[
                    { label: "Flexi", value: "Flexi" },
                    { label: "Premium", value: "Premium" },
                    { label: "Elite", value: "Elite" },
                  ]}
                  name="caseCategory"
                  value={formData.caseCategory}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Price Selection appears when case category is selected */}
              {formData.caseCategory && (
                <div className="mt-2">
                  <Label>Select Package *</Label>
                  <div className="relative">
                    <Select
                      options={[
                        ...(priceOptions[formData.caseCategory as keyof typeof priceOptions] || [])
                      ]}
                      name="selectedPrice"
                      value={formData.selectedPrice || ""}
                      onChange={handleChange}
                      required
                      className="pl-10"
                    />
                    <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>Case Category Comments</Label>
              <div className="relative">
                <TextArea
                  name="caseCategoryDetails"
                  value={formData.caseCategoryDetails}
                  onChange={handleChange}
                  rows={3}
                  className="pl-10 focus:ring-2 focus:ring-blue-200"
                />
                <ClipboardDocumentListIcon className="w-5 h-5 absolute left-3 top-3 text-blue-400" />
              </div>
            </div>

            <div>
              <Label>Treatment Plan</Label>
              <TextArea
                name="treatmentPlan"
                value={formData.treatmentPlan}
                onChange={handleChange}
                rows={3}
                className="focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label>Extraction Required *</Label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="extraction.required"
                      value="true"
                      checked={formData.extraction.required === true}
                      onChange={handleExtractionChange}
                      className="mr-2 accent-blue-500"
                    />
                    Yes
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="extraction.required"
                      value="false"
                      checked={formData.extraction.required === false}
                      onChange={handleExtractionChange}
                      className="mr-2 accent-blue-500"
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <Label>Extraction Comments</Label>
                <TextArea
                  name="extraction.comments"
                  value={formData.extraction.comments}
                  onChange={handleChange}
                  rows={3}
                  className="focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            {/* IPR Section */}
            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-400" /> 
                Interproximal Reduction (IPR)
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interproximalReduction.detail1"
                        checked={formData.interproximalReduction.detail1 === "true"}
                        onChange={(e) => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "true" : "false"
                          }
                        } as any)}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Anterior Region (3 To 3)
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interproximalReduction.detail2"
                        checked={formData.interproximalReduction.detail2 === "true"}
                        onChange={(e) => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "true" : "false"
                          }
                        } as any)}
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
                        checked={formData.interproximalReduction.detail3 === "true"}
                        onChange={(e) => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "true" : "false"
                          }
                        } as any)}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      plan as required
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="interproximalReduction.detail4"
                        checked={formData.interproximalReduction.detail4 === "true"}
                        onChange={(e) => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "true" : "false"
                          }
                        } as any)}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      No IPR
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Measure of IPR Section */}
            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowsRightLeftIcon className="w-5 h-5 text-blue-400" /> 
                Measure of IPR
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="measureOfIPR.detailA"
                        checked={formData.measureOfIPR.detailA === "0.3"}
                        onChange={(e) => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "0.3" : ""
                          }
                        } as any)}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      Upto 0.25mm/surface
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="measureOfIPR.detailA"
                        checked={formData.measureOfIPR.detailA === "0.4"}
                        onChange={(e) => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "0.4" : ""
                          }
                        } as any)}
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
                        checked={formData.measureOfIPR.detailB === "0.3"}
                        onChange={(e) => handleChange({
                          target: {
                            name: e.target.name,
                            value: e.target.checked ? "0.3" : ""
                          }
                        } as any)}
                        className="mr-2 accent-blue-500 w-4 h-4"
                      />
                      0.25mm to 0.5mm/surface
                    </label>
                   
                  </div>
                </div>
                
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <Button
              onClick={prevStep}
              variant="outline"
              className="flex items-center gap-2"
            >
              Previous
            </Button>
            <Button
              variant="primary"
              className="flex items-center gap-2"
              disabled={isLoading}
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
                'Next'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
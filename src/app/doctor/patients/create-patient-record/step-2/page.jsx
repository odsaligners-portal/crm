"use client";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { interproximalReductionOptions, measureOfIPROptions, singleArchTypeOptions } from '@/constants/data';
import {
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState } from "react";
import { useSelector } from "react-redux";
import ReactSelect from "react-select";
import { toast } from "react-toastify";

export default function Step2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = React.useState({
    chiefComplaint: '',
    caseType: '',
    singleArchType: '',
    caseCategory: '',
    selectedPrice: '',
    extraction: { required: false, comments: '' },
    interproximalReduction: { detail1: '', detail2: '', detail3: '', detail4: '' },
    measureOfIPR: { detailA: '', detailB: '', detailC: '' },
    caseCategoryDetails: '',
    treatmentPlan: '',
    additionalComments: '',
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDataLoading, setIsDataLoading] = React.useState(false);
  const [patientDatails, setPatientDatails] = React.useState(null);
  const [saving, setSaving] = useState(false);
  const [caseCategories, setCaseCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Fetch patient data when component mounts and patientId exists
  React.useEffect(() => {
    if (!patientId) {
      toast.error('Please start from Step 1.');
      router.replace('/doctor/patients/create-patient-record/step-1');
      return;
    }
  }, [patientId, router]);

  React.useEffect(() => {
    const fetchCaseCategories = async () => {
      if (!token) return;
      setIsCategoriesLoading(true);
      try {
        const response = await fetch('/api/case-categories?active=true', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch case categories');
        const result = await response.json();
        setCaseCategories(result.data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsCategoriesLoading(false);
      }
    };
    fetchCaseCategories();
  }, [token]);

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
          // Pre-fill local form state with fetched data
          setFormData(prev => ({
            ...prev,
            chiefComplaint: patientData.chiefComplaint || '',
            caseType: patientData.caseType || '',
            singleArchType: (patientData.caseType === 'Single Upper Arch' || patientData.caseType === 'Single Lower Arch') ? patientData.caseType : '',
            caseCategory: patientData.caseCategory || '',
            selectedPrice: patientData.selectedPrice || '',
            caseCategoryDetails: patientData.caseCategoryDetails || '',
            treatmentPlan: patientData.treatmentPlan || '',
            extraction: patientData.extraction || { required: false, comments: '' },
            interproximalReduction: patientData.interproximalReduction || { detail1: '', detail2: '', detail3: '', detail4: '' },
            measureOfIPR: patientData.measureOfIPR || { detailA: '', detailB: '', detailC: '' },
            additionalComments: patientData.additionalComments || '',
          }));
        } else if (response.status === 404) {
          toast.error('Patient not found or you do not have permission to view this record');
        } else if (response.status === 401) {
          toast.error('Unauthorized access. Please log in again.');
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast.error('Failed to load patient data. Please try again.');
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchPatientData();
  }, [patientId, token]);

  const caseCategoryOptions = caseCategories.map(cat => ({
    label: cat.category,
    value: cat.category,
  }));

  const priceOptions = caseCategories.reduce((acc, cat) => {
    acc[cat.category] = cat.plans.map(plan => ({ label: plan.label, value: plan.value }));
    return acc;
  }, {});

  // Local handleChange for all fields
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (name.startsWith('extraction.') || name.startsWith('interproximalReduction.') || name.startsWith('measureOfIPR.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    } else {
      if (name === "caseCategory") {
        setFormData(prev => ({ ...prev, selectedPrice: "" }));
      }
      setFormData(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    // Validation
    if (!formData.chiefComplaint) {
      toast.error("Chief Complaint is required.");
      return;
    }
    if (!formData.caseType) {
      toast.error("Case Type is required.");
      return;
    }
    if (formData.caseType === "Single Arch" && !formData.singleArchType) {
      toast.error("Please select an arch type.");
      return;
    }
    if (!formData.caseCategory) {
      toast.error("Case Category is required.");
      return;
    }
    if (!formData.selectedPrice) {
      toast.error("Package is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        chiefComplaint: formData.chiefComplaint,
        caseType: formData.singleArchType || formData.caseType, // Use singleArchType if it exists
        singleArchType: formData.singleArchType,
        caseCategory: formData.caseCategory,
        selectedPrice: formData.selectedPrice,
        caseCategoryDetails: formData.caseCategoryDetails,
        treatmentPlan: formData.treatmentPlan,
        extraction: formData.extraction,
        interproximalReduction: formData.interproximalReduction,
        measureOfIPR: formData.measureOfIPR,
        additionalComments: formData.additionalComments,
      };
      const response = await fetch(`/api/patients/update-details?id=${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Failed to save data");
      }
      toast.success("Data saved successfully!");
      router.push(`/doctor/patients/create-patient-record/step-3?id=${patientId}`);
    } catch (error) {
      toast.error(error.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/doctor/patients/create-patient-record/step-1?id=${patientId}`);
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
        
        <form className="space-y-8" onSubmit={handleNext}>
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
                      checked={formData.caseType === "Single Arch" || formData.caseType === "Single Upper Arch" || formData.caseType === "Single Lower Arch"}
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
                {/* Show dropdown if Single Arch is selected */}
                {(formData.caseType === "Single Arch" || formData.caseType === "Single Upper Arch" || formData.caseType === "Single Lower Arch") && (
                  <div className="mt-4">
                    <Label>Arch *</Label>
                    <ReactSelect
                      name="singleArchType"
                      options={singleArchTypeOptions}
                      value={singleArchTypeOptions.find(opt => opt.value === formData.singleArchType) || null}
                      onChange={(opt) => handleChange({ target: { name: 'singleArchType', value: opt?.value } })}
                    />
                  </div>
                )}
              </div>
            </div> 
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
              <div>
                <Label>Case Category *</Label>
                <ReactSelect
                  name="caseCategory"
                  options={caseCategoryOptions}
                  value={caseCategoryOptions.find(opt => opt.value === formData.caseCategory) || null}
                  onChange={(opt) => handleChange({ target: { name: 'caseCategory', value: opt?.value } })}
                  isLoading={isCategoriesLoading}
                />
              </div>

              {/* Price Selection appears when case category is selected */}
              {formData.caseCategory && (
                <div className="mt-2">
                  <Label>Package</Label>
                  <div className="relative">
                    <ReactSelect
                      name="selectedPrice"
                      options={priceOptions[formData.caseCategory] || []}
                      value={(priceOptions[formData.caseCategory] || []).find(opt => opt.value === formData.selectedPrice) || null}
                      onChange={(opt) => handleChange({ target: { name: 'selectedPrice', value: opt?.value } })}
                      isLoading={isCategoriesLoading}
                      styles={{
                        control: (base) => ({
                          ...base,
                          paddingLeft: "2rem",
                        }),
                      }}
                    />
                    <CurrencyDollarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
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
                      checked={formData.extraction?.required === true}
                      onChange={handleChange}
                      className="mr-2 accent-blue-500"
                    />
                    Yes
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="extraction.required"
                      value="false"
                      checked={formData.extraction?.required === false}
                      onChange={handleChange}
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
                  value={formData.extraction?.comments}
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
                {interproximalReductionOptions.map((option, index) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name={`interproximalReduction.detail${index + 1}`}
                      checked={formData.interproximalReduction[`detail${index + 1}`] === option}
                      onChange={(e) => handleChange({
                        target: {
                          name: e.target.name,
                          value: e.target.checked ? option : ""
                        }
                      })}
                      className="mr-2 accent-blue-500 w-4 h-4"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            {/* Measure of IPR Section */}
            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ArrowsRightLeftIcon className="w-5 h-5 text-blue-400" />
                Measure of IPR
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {measureOfIPROptions.map((option, index) => (
                  <label key={option} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name={`measureOfIPR.detail${String.fromCharCode(65 + index)}`}
                      checked={formData.measureOfIPR[`detail${String.fromCharCode(65 + index)}`] === option}
                      onChange={(e) => handleChange({
                        target: {
                          name: e.target.name,
                          value: e.target.checked ? option : ""
                        }
                      })}
                      className="mr-2 accent-blue-500 w-4 h-4"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50">
              <div>
                <Label>IPR Comments</Label>
                <TextArea
                  name="additionalComments"
                  value={formData.additionalComments}
                  onChange={handleChange}
                  rows={3}
                  className="focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

          </div>
          <div className="flex justify-between mt-8">
            <Button
              onClick={handleBack}
              variant="outline"
              className="flex items-center gap-2"
            >
              Previous
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
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
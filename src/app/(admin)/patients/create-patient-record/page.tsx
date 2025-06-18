"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import TextArea from "@/components/form/input/TextArea";

interface PatientFormData {
  // Section 1: Basic Details
  patientName: string;
  age: string;
    gender: string;
  pastMedicalHistory: string;
  pastDentalHistory: string;
  treatmentFor: string;
  country: string;
  state: string;
      city: string;
  primaryAddress: string;
  shippingAddressType: string;
  shippingAddress: string;
  billingAddress: string;

  // Section 2: Chief complaint & case
  chiefComplaint: string;
  caseType: string;
  caseCategory: string;
  caseCategoryDetails: string;
  treatmentPlan: string;
  extraction: {
    required: boolean;
    comments: string;
  };

  // Section 3: IPR and Midline & Arch Expansion
  interproximalReduction: {
    detail1: string;
    detail2: string;
    detail3: string;
    detail4: string;
  };
  measureOfIPR: {
    detailA: string;
    detailB: string;
    detailC: string;
  };
  additionalComments: string;
  midline: string;
  midlineComments: string;
  archExpansion: string;
  archExpansionComments: string;

  // Section 4: Files
  scanFiles: File[];

  // Form validation
  privacyAccepted: boolean;
  declarationAccepted: boolean;

  // Additional fields
  caseId?: string;
}

// Countries and states data
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

export default function CreatePatientRecord() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('caseId');
  const { token } = useSelector((state: any) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PatientFormData>({
    // Section 1: Basic Details
    patientName: "",
    age: "",
      gender: "",
    pastMedicalHistory: "",
    pastDentalHistory: "",
    treatmentFor: "",
    country: "",
    state: "",
        city: "",
    primaryAddress: "",
    shippingAddressType: "Primary Address",
    shippingAddress: "",
    billingAddress: "",

    // Section 2: Chief complaint & case
    chiefComplaint: "",
    caseType: "",
    caseCategory: "",
    caseCategoryDetails: "",
    treatmentPlan: "",
    extraction: {
      required: false,
      comments: "",
    },

    // Section 3: IPR and Midline & Arch Expansion
    interproximalReduction: {
      detail1: "",
      detail2: "",
      detail3: "",
      detail4: "",
    },
    measureOfIPR: {
      detailA: "",
      detailB: "",
      detailC: "",
    },
    additionalComments: "",
    midline: "",
    midlineComments: "",
    archExpansion: "",
    archExpansionComments: "",

    // Section 4: Files
    scanFiles: [],

    // Form validation
    privacyAccepted: false,
    declarationAccepted: false,

    // Additional fields
    caseId: undefined,
  });

  // Load existing patient data if ID exists
  useEffect(() => {
    const loadPatientData = async () => {
      if (patientId) {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/patients/${patientId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to load patient data');
          }

          const data = await response.json();
          console.log('Fetched patient data:', data);
          setFormData(prevData => ({
            ...prevData,
            ...data,
            // Defensive: ensure all fields are present
            patientName: data.patientName || '',
            age: data.age || '',
            gender: data.gender || '',
            pastMedicalHistory: data.pastMedicalHistory || '',
            pastDentalHistory: data.pastDentalHistory || '',
            treatmentFor: data.treatmentFor || '',
            country: data.country || '',
            state: data.state || '',
            city: data.city || '',
            primaryAddress: data.primaryAddress || '',
            shippingAddressType: data.shippingAddressType || '',
            shippingAddress: data.shippingAddress || '',
            billingAddress: data.billingAddress || '',
            privacyAccepted: data.privacyAccepted || false,
            declarationAccepted: data.declarationAccepted || false,
            chiefComplaint: data.chiefComplaint || '',
            caseType: data.caseType || '',
            caseCategory: data.caseCategory || '',
            caseCategoryDetails: data.caseCategoryDetails || '',
            treatmentPlan: data.treatmentPlan || '',
            extraction: data.extraction || { required: false, comments: '' },
            interproximalReduction: data.interproximalReduction || { detail1: '', detail2: '', detail3: '', detail4: '' },
            measureOfIPR: data.measureOfIPR || { detailA: '', detailB: '', detailC: '' },
            additionalComments: data.additionalComments || '',
            midline: data.midline || '',
            midlineComments: data.midlineComments || '',
            archExpansion: data.archExpansion || '',
            archExpansionComments: data.archExpansionComments || '',
            scanFiles: data.scanFiles || [],
            caseId: data.caseId || undefined,
          }));
        } catch (error) {
          console.error('Error loading patient data:', error);
          toast.error('Failed to load patient data');
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (patientId) {
      loadPatientData();
    }
  }, [patientId, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof PatientFormData] as any),
          [field]: type === 'number' ? Number(value) : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'number' ? Number(value) : value,
      }));
    }

    // Reset state when country changes
    if (name === 'country') {
      setFormData((prev) => ({
        ...prev,
        state: "",
      }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        scanFiles: files,
      }));
    }
  };

  const nextStep = async () => {
    // If on first step, validate and save data
    if (currentStep === 1) {
      // Validate checkboxes
      if (!formData.privacyAccepted || !formData.declarationAccepted) {
        toast.error("Please accept both privacy policy and declaration to continue");
        return;
      }

      setIsLoading(true);
      try {
        // Create basic details object for first step
        const basicDetails = {
          // Basic Details
          patientName: formData.patientName,
          age: formData.age,
          gender: formData.gender,
          pastMedicalHistory: formData.pastMedicalHistory || '',
          pastDentalHistory: formData.pastDentalHistory || '',
          treatmentFor: formData.treatmentFor,
          country: formData.country,
          state: formData.state,
          city: formData.city,
          primaryAddress: formData.primaryAddress || '',
          shippingAddressType: formData.shippingAddressType,
          shippingAddress: formData.shippingAddress || '',
          billingAddress: formData.billingAddress || '',
          privacyAccepted: formData.privacyAccepted,
          declarationAccepted: formData.declarationAccepted,
          
          // Initialize remaining fields with default values
          chiefComplaint: '',
          caseType: '',
          caseCategory: '',
          caseCategoryDetails: '',
          treatmentPlan: '',
          extraction: { required: false, comments: '' },
          interproximalReduction: {
            detail1: '',
            detail2: '',
            detail3: '',
            detail4: ''
          },
          measureOfIPR: {
            detailA: '',
            detailB: '',
            detailC: ''
          },
          additionalComments: '',
          midline: '',
          midlineComments: '',
          archExpansion: '',
          archExpansionComments: '',
          scanFiles: []
        };

        console.log('Sending data to create patient:', basicDetails);

        const response = await fetch("/api/patients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(basicDetails),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save patient record");
        }

        // Get the created patient ID from response and update URL
        const data = await response.json();
        console.log('Received response after creating patient:', data);

        // Update form data with the received data including caseId
        setFormData(prevData => ({
          ...prevData,
          ...data,
          caseId: data.caseId // Explicitly set caseId
        }));

        // Redirect to step 1 with the case ID
        router.push(`/patients/create-patient-record?id=${data.caseId}`);
        
        toast.success("Basic details saved successfully");
        setCurrentStep((prev) => Math.min(prev + 1, 4));
      } catch (error: any) {
        console.error("Error saving patient record:", error);
        toast.error(error.message || "Failed to save patient record");
      } finally {
        setIsLoading(false);
      }
    } else {
      // For other steps, just move to next step
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) {
      toast.error("No patient ID found");
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach((key) => {
        if (key !== 'scanFiles') {
          const value = formData[key as keyof PatientFormData];
          if (typeof value === 'object') {
            formDataToSend.append(key, JSON.stringify(value));
          } else {
            formDataToSend.append(key, String(value));
          }
        }
      });

      // Add files
      formData.scanFiles.forEach((file) => {
        formDataToSend.append('scanFiles', file);
      });

      const response = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update patient record");
      }

      toast.success("Patient record updated successfully");
      router.push("/patients");
    } catch (error: any) {
      toast.error(error.message || "Failed to update patient record");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {step}
      </div>
            {step < 4 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  currentStep > step ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-2 text-sm text-gray-600">
        {currentStep === 1 && "Basic Details"}
        {currentStep === 2 && "Chief Complaint & Case"}
        {currentStep === 3 && "IPR & Arch Expansion"}
        {currentStep === 4 && "Upload Files"}
      </div>
            </div>
  );

  const renderBasicDetails = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div>
          <Label>Patient Name *</Label>
              <Input
                type="text"
            name="patientName"
            value={formData.patientName}
            onChange={handleChange}
                required
              />
            </div>
            <div>
          <Label>Age *</Label>
              <Input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
                required
              />
            </div>
            <div>
          <Label>Gender *</Label>
              <Select
                options={[
                  { label: "Male", value: "Male" },
                  { label: "Female", value: "Female" },
                  { label: "Other", value: "Other" },
                ]}
                name="gender"
            value={formData.gender}
            onChange={handleChange}
                required
              />
            </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Past Medical History</Label>
          <TextArea
            name="pastMedicalHistory"
            value={formData.pastMedicalHistory}
            onChange={handleChange}
            rows={3}
          />
        </div>
            <div>
          <Label>Past Dental History</Label>
          <TextArea
            name="pastDentalHistory"
            value={formData.pastDentalHistory}
            onChange={handleChange}
            rows={3}
              />
            </div>
          </div>

      <div className="space-y-4">
        <Label>Treatment For *</Label>
        <div className="flex items-center space-x-6">
        <label className="flex items-center">
            <input
              type="radio"
              name="treatmentFor"
              value="Clear Aligners"
              checked={formData.treatmentFor === "Clear Aligners"}
              onChange={handleChange}
              className="mr-2"
              required
            />
            Clear Aligners
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="treatmentFor"
              value="Invisalign"
              checked={formData.treatmentFor === "Invisalign"}
              onChange={handleChange}
              className="mr-2"
              required
            />
            Invisalign
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="treatmentFor"
              value="Braces"
              checked={formData.treatmentFor === "Braces"}
              onChange={handleChange}
              className="mr-2"
              required
            />
            Braces
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div>
          <Label>Country *</Label>
          <Select
            options={[
              { label: "Select Country", value: "" },
              ...countries.map(country => ({ label: country, value: country }))
            ]}
            name="country"
            value={formData.country}
            onChange={handleChange}
                required
              />
            </div>
            <div>
          <Label>State/Province *</Label>
          <Select
            options={[
              { label: "Select State/Province", value: "" },
              ...(formData.country && countriesData[formData.country as keyof typeof countriesData] 
                ? countriesData[formData.country as keyof typeof countriesData].map(state => ({ label: state, value: state }))
                : [])
            ]}
            name="state"
            value={formData.state}
            onChange={handleChange}
                required
            disabled={!formData.country}
              />
            </div>
            <div>
          <Label>City *</Label>
              <Input
                type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
                required
              />
            </div>
      </div>

      <div className="space-y-4">
            <div>
          <Label>Shipping Address</Label>
          <div className="flex items-center space-x-6 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="shippingAddressType"
                value="Primary Address"
                checked={formData.shippingAddressType === "Primary Address"}
                onChange={handleChange}
                className="mr-2"
                required
              />
              Primary Address
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="shippingAddressType"
                value="New Address"
                checked={formData.shippingAddressType === "New Address"}
                onChange={handleChange}
                className="mr-2"
                required
              />
              New Address
            </label>
          </div>
          
          {formData.shippingAddressType === "Primary Address" ? (
            <TextArea
              name="primaryAddress"
              value={formData.primaryAddress}
              onChange={handleChange}
              rows={3}
              placeholder="Enter primary address"
            />
          ) : (
            <TextArea
              name="shippingAddress"
              value={formData.shippingAddress}
              onChange={handleChange}
              rows={3}
              placeholder="Enter new shipping address"
            />
          )}
        </div>

        <div>
          <Label>Billing Address</Label>
          <TextArea
            name="billingAddress"
            value={formData.billingAddress}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  const renderChiefComplaint = () => (
    <div className="space-y-6">
      <div>
        <Label>Chief Complaint</Label>
        <TextArea
          name="chiefComplaint"
          value={formData.chiefComplaint}
          onChange={handleChange}
          rows={3}
        />
      </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
          <Label>Case Type</Label>
          <Select
            options={[
              { label: "Single Arch - Upper", value: "Single Arch - Upper" },
              { label: "Single Arch - Lower", value: "Single Arch - Lower" },
              { label: "Double Arch", value: "Double Arch" },
            ]}
            name="caseType"
            value={formData.caseType}
            onChange={handleChange}
          />
        </div>
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
      </div>

      <div>
        <Label>Case Category Details</Label>
        <TextArea
          name="caseCategoryDetails"
          value={formData.caseCategoryDetails}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <div>
        <Label>Treatment Plan</Label>
        <TextArea
          name="treatmentPlan"
          value={formData.treatmentPlan}
          onChange={handleChange}
          rows={3}
        />
            </div>

      <div className="space-y-4">
        <div>
          <Label>Extraction Required *</Label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="extraction.required"
                value="true"
                checked={formData.extraction.required === true}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    extraction: {
                      ...prev.extraction,
                      required: e.target.value === "true",
                    },
                  }))
                }
                className="mr-2"
              />
              Yes
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="extraction.required"
                value="false"
                checked={formData.extraction.required === false}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    extraction: {
                      ...prev.extraction,
                      required: e.target.value === "true",
                    },
                  }))
                }
                className="mr-2"
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
          />
        </div>
      </div>
            </div>
  );

  const renderIPRAndArch = () => (
    <div className="space-y-6">
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Interproximal Reduction (IPR)</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <Label>Detail 1</Label>
              <Input
                type="text"
              name="interproximalReduction.detail1"
              value={formData.interproximalReduction.detail1}
              onChange={handleChange}
              />
            </div>
          <div>
            <Label>Detail 2</Label>
              <Input
                type="text"
              name="interproximalReduction.detail2"
              value={formData.interproximalReduction.detail2}
              onChange={handleChange}
              />
            </div>
          <div>
            <Label>Detail 3</Label>
              <Input
                type="text"
              name="interproximalReduction.detail3"
              value={formData.interproximalReduction.detail3}
              onChange={handleChange}
              />
            </div>
          <div>
            <Label>Detail 4</Label>
              <Input
                type="text"
              name="interproximalReduction.detail4"
              value={formData.interproximalReduction.detail4}
              onChange={handleChange}
              />
            </div>
          </div>
        </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Measure of IPR</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div>
            <Label>Detail A</Label>
            <Input
              type="text"
              name="measureOfIPR.detailA"
              value={formData.measureOfIPR.detailA}
              onChange={handleChange}
            />
          </div>
            <div>
            <Label>Detail B</Label>
              <Input
                type="text"
              name="measureOfIPR.detailB"
              value={formData.measureOfIPR.detailB}
              onChange={handleChange}
              />
            </div>
            <div>
            <Label>Detail C</Label>
            <Input
              type="text"
              name="measureOfIPR.detailC"
              value={formData.measureOfIPR.detailC}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Additional Comments</Label>
        <TextArea
          name="additionalComments"
          value={formData.additionalComments}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Midline & Arch Expansion</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <Label>Midline</Label>
              <Input
                type="text"
              name="midline"
              value={formData.midline}
              onChange={handleChange}
              />
            </div>
            <div>
            <Label>Arch Expansion</Label>
              <Input
              type="text"
              name="archExpansion"
              value={formData.archExpansion}
              onChange={handleChange}
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
            />
          </div>
          <div>
            <Label>Arch Expansion Comments</Label>
            <TextArea
              name="archExpansionComments"
              value={formData.archExpansionComments}
              onChange={handleChange}
              rows={2}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderFileUpload = () => (
    <div className="space-y-6">
      <div>
        <Label>Scan Files (Max 3 files)</Label>
        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileChange}
          className="w-full p-2 border border-gray-300 rounded-lg"
        />
        <p className="text-sm text-gray-500 mt-1">
          Accepted formats: PDF, JPG, JPEG, PNG, DOC, DOCX
        </p>
      </div>

      {formData.scanFiles.length > 0 && (
        <div>
          <Label>Selected Files:</Label>
          <ul className="mt-2 space-y-1">
            {formData.scanFiles.map((file, index) => (
              <li key={index} className="text-sm text-gray-600">
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-5 lg:p-6">
      {/* Show caseId banner if available and not on step 1 */}
      {formData.caseId && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-300 text-blue-900 font-semibold text-center text-lg">
          Case ID: {formData.caseId}
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Create New Patient Record
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Fill in the patient's details across four sections.
        </p>
      </div>

      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="space-y-8">
        {currentStep === 1 && renderBasicDetails()}
        {currentStep === 2 && renderChiefComplaint()}
        {currentStep === 3 && renderIPRAndArch()}
        {currentStep === 4 && renderFileUpload()}

        {/* Privacy and Declaration Checkboxes - Only on Step 1 */}
        {currentStep === 1 && (
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="privacyAccepted"
                checked={formData.privacyAccepted}
                onChange={handleCheckboxChange}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                required
              />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Privacy Policy *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  I have read and agree to the privacy policy. I understand that my personal information will be collected, used, and stored in accordance with applicable data protection laws.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                name="declarationAccepted"
                checked={formData.declarationAccepted}
                onChange={handleCheckboxChange}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                required
              />
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Declaration *
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  I declare that all the information provided in this form is true, accurate, and complete to the best of my knowledge. I understand that providing false information may result in the rejection of my application.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2"
          >
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              disabled={isLoading}
              className="px-6 py-2"
            >
              {currentStep === 1 && isLoading ? "Saving..." : "Next"}
            </Button>
          ) : (
            <Button
              disabled={isLoading}
              className="px-6 py-2"
            >
              {isLoading ? "Updating..." : "Update Patient Record"}
          </Button>
          )}
        </div>
      </form>
    </div>
  );
}

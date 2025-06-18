"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";
import TextArea from "@/components/form/input/TextArea";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { setField, setNestedField, setForm } from "@/store/features/patientFormSlice";
import { UserIcon, CalendarIcon, MapPinIcon, HomeIcon } from "@heroicons/react/24/outline";

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

export default function Step1() {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const dispatch = useAppDispatch();
  const formData = useAppSelector((state) => state.patientForm);
  const [isLoading, setIsLoading] = React.useState(false);

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
    if (name === "country") {
      dispatch(setField({ field: "state", value: "" }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    dispatch(setField({ field: name, value: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.privacyAccepted || !formData.declarationAccepted) {
      toast.error("Please accept both privacy policy and declaration to continue");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save patient record");
      }
      const data = await response.json();
      if (!data._id) throw new Error("No patient ID returned from server");
      dispatch(setForm(data));
      toast.success("Basic details saved successfully");
      router.push(`/patients/create-patient-record/step-2?id=${data._id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to save patient record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-gray-800 animate-slide-up">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-600">Step 1 of 4</span>
            <span className="text-xs text-gray-400">Basic Details</span>
          </div>
          <div className="w-full h-2 bg-blue-100 rounded-full">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500" style={{ width: '25%' }} />
          </div>
        </div>
        {/* Heading & Description */}
        <h1 className="text-3xl font-bold text-blue-700 dark:text-white mb-1 tracking-tight">Step 1: Basic Details</h1>
        <p className="text-gray-500 dark:text-gray-300 mb-8 text-sm">Let's start with the patient's basic information. Please fill out all required fields to continue.</p>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div>
                <Label>Patient Name *</Label>
                <div className="relative">
                  <Input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                  <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                </div>
              </div>
              <div>
                <Label>Age *</Label>
                <div className="relative">
                  <Input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                  <CalendarIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                </div>
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
                  className="focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <Label>Past Dental History</Label>
                <TextArea
                  name="pastDentalHistory"
                  value={formData.pastDentalHistory}
                  onChange={handleChange}
                  rows={3}
                  className="focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Treatment For *</Label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="treatmentFor"
                    value="Clear Aligners"
                    checked={formData.treatmentFor === "Clear Aligners"}
                    onChange={handleChange}
                    className="mr-2 accent-blue-500"
                    required
                  />
                  Clear Aligners
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="treatmentFor"
                    value="Invisalign"
                    checked={formData.treatmentFor === "Invisalign"}
                    onChange={handleChange}
                    className="mr-2 accent-blue-500"
                    required
                  />
                  Invisalign
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="treatmentFor"
                    value="Braces"
                    checked={formData.treatmentFor === "Braces"}
                    onChange={handleChange}
                    className="mr-2 accent-blue-500"
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
                <div className="relative">
                  <Input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="pl-10"
                  />
                  <MapPinIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Shipping Address</Label>
                <div className="flex items-center space-x-6 mb-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="shippingAddressType"
                      value="Primary Address"
                      checked={formData.shippingAddressType === "Primary Address"}
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
                      checked={formData.shippingAddressType === "New Address"}
                      onChange={handleChange}
                      className="mr-2 accent-blue-500"
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
                    className="focus:ring-2 focus:ring-blue-200"
                  />
                ) : (
                  <TextArea
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter new shipping address"
                    className="focus:ring-2 focus:ring-blue-200"
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
                  className="focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 p-4 border border-blue-100 dark:border-gray-700 rounded-lg bg-blue-50/50 dark:bg-gray-800/50 mt-6">
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
          <div className="flex justify-end pt-6">
            <Button
              disabled={isLoading}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center gap-2 text-base font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center gap-2"><span className="animate-spin">⏳</span> Saving...</span>
              ) : (
                <span className="flex items-center gap-2">Next <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L21 12m0 0l-3.75 5.25M21 12H3" /></svg></span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
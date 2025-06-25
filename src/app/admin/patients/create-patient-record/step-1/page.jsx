"use client";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { countriesData } from '@/utils/countries';
import { CalendarIcon, GlobeAltIcon, MapIcon, MapPinIcon, UserIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";

const countries = Object.keys(countriesData);

export default function Step1() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [patientDatails, setPatientDatails] = React.useState(null);
  const [formData, setFormData] = React.useState({
    patientName: '',
    age: '',
    gender: '',
    pastMedicalHistory: '',
    pastDentalHistory: '',
    treatmentFor: '',
    country: '',
    state: '',
    city: '',
    primaryAddress: '',
    shippingAddressType: 'Primary Address',
    shippingAddress: '',
    billingAddress: '',
    privacyAccepted: false,
    declarationAccepted: false,
  });
  const [doctors, setDoctors] = React.useState([]);

  // Fetch patient data when component mounts and patientId exists
  React.useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      dispatch(setLoading(true));
      try {
        const patientData = await fetchWithError(`/api/admin/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setPatientDatails(patientData);
        // Update form with fetched data
        if (patientData.patientName) {
          setFormData(prev => ({ ...prev, patientName: patientData.patientName }));
        }
        if (patientData.age) {
          setFormData(prev => ({ ...prev, age: patientData.age }));
        }
        if (patientData.gender) {
          setFormData(prev => ({ ...prev, gender: patientData.gender }));
        }
        if (patientData.pastMedicalHistory) {
          setFormData(prev => ({ ...prev, pastMedicalHistory: patientData.pastMedicalHistory }));
        }
        if (patientData.pastDentalHistory) {
          setFormData(prev => ({ ...prev, pastDentalHistory: patientData.pastDentalHistory }));
        }
        if (patientData.treatmentFor) {
          setFormData(prev => ({ ...prev, treatmentFor: patientData.treatmentFor }));
        }
        if (patientData.country) {
          setFormData(prev => ({ ...prev, country: patientData.country }));
        }
        if (patientData.state) {
          setFormData(prev => ({ ...prev, state: patientData.state }));
        }
        if (patientData.city) {
          setFormData(prev => ({ ...prev, city: patientData.city }));
        }
        if (patientData.primaryAddress) {
          setFormData(prev => ({ ...prev, primaryAddress: patientData.primaryAddress }));
        }
        if (patientData.shippingAddress) {
          setFormData(prev => ({ ...prev, shippingAddress: patientData.shippingAddress }));
        }
        if (patientData.shippingAddressType) {
          setFormData(prev => ({ ...prev, shippingAddressType: patientData.shippingAddressType }));
        }
        if (patientData.billingAddress) {
          setFormData(prev => ({ ...prev, billingAddress: patientData.billingAddress }));
        }
        if (patientData.privacyAccepted !== undefined) {
          setFormData(prev => ({ ...prev, privacyAccepted: patientData.privacyAccepted }));
        }
        if (patientData.declarationAccepted !== undefined) {
          setFormData(prev => ({ ...prev, declarationAccepted: patientData.declarationAccepted }));
        }
        if (patientData.userId) {
          setFormData(prev => ({ ...prev, userId: patientData.userId._id ? patientData.userId._id : patientData.userId }));
        }
      } catch (error) {
        // fetchWithError handles toast
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchPatientData();
  }, [patientId, token, dispatch]);

  // Fetch doctors for dropdown
  React.useEffect(() => {
    const fetchDoctors = async () => {
      dispatch(setLoading(true));
      try {
        const data = await fetchWithError('/api/user/profile?role=doctor', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDoctors(data.doctors || []);
      } catch (error) {
        setDoctors([]);
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchDoctors();
  }, [token, dispatch]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "number" ? Number(value) : value }));
    if (name === "country") {
      setFormData(prev => ({ ...prev, state: "" }));
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.privacyAccepted || !formData.declarationAccepted) {
      toast.error("Please accept both privacy policy and declaration to continue");
      return;
    }
    dispatch(setLoading(true));
    try {
      let response;
      const body = {
        patientName: formData.patientName,
        age: formData.age,
        gender: formData.gender,
        pastMedicalHistory: formData.pastMedicalHistory,
        pastDentalHistory: formData.pastDentalHistory,
        treatmentFor: formData.treatmentFor,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        primaryAddress: formData.primaryAddress,
        shippingAddress: formData.shippingAddress,
        shippingAddressType: formData.shippingAddressType,
        billingAddress: formData.billingAddress,
        privacyAccepted: formData.privacyAccepted,
        declarationAccepted: formData.declarationAccepted,
        userId: formData.userId
      };

      if (patientId) {
        response = await fetchWithError(`/api/admin/patients/update-details?id=${encodeURIComponent(patientId).trim()}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      } else {
        // Create new patient
        response = await fetchWithError("/api/admin/patients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }
      
      const currentPatientId = patientId || response._id;
      
      if (!currentPatientId) throw new Error("No patient ID returned from server");
      
      toast.success(patientId ? "Basic details updated successfully" : "Basic details saved successfully");
      router.push(`/admin/patients/create-patient-record/step-2?id=${currentPatientId}`);
    } catch (error) {
      // fetchWithError handles toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 py-8 animate-fade-in">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 relative overflow-hidden border border-blue-100 dark:border-gray-800 animate-slide-up">
        {/* Progress Bar */}
        {
          patientDatails && (
            <div className="flex justify-end mt-8 mb-10">
              <div className="text-sm border border-blue-200 rounded-lg px-4 py-2 font-extrabold bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text text-transparent tracking-tight drop-shadow-xl">Case Id: {patientDatails?.caseId || patientId}</div>
            </div>
          )
        }
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
            {/* Doctor Dropdown */}
            <div className="mt-6">
              <Label>Assign Doctor *</Label>
              <select
                name="userId"
                value={formData.userId || ''}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Doctor</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>{doc.name}</option>
                ))}
              </select>
            </div>
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
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
              <div>
                <Label>
                  <span className="inline-flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-blue-500" /> Country *
                  </span>
                </Label>
                <div className="relative">
                  <select
                    name="country"
                    value={formData.country || ""}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-blue-200 px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800 appearance-none shadow-sm"
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
                    <GlobeAltIcon className="w-5 h-5" />
                  </span>
                </div>
              </div>
              <div>
                <Label>
                  <span className="inline-flex items-center gap-2">
                    <MapIcon className="w-5 h-5 text-blue-500" /> State/Province *
                  </span>
                </Label>
                <div className="relative">
                  <select
                    name="state"
                    value={formData.state || ""}
                    onChange={handleChange}
                    required
                    disabled={!formData.country}
                    className="w-full rounded-lg border border-blue-200 px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800 appearance-none shadow-sm disabled:bg-gray-100"
                  >
                    <option value="">Select State/Province</option>
                    {(formData.country && countriesData[formData.country]) && countriesData[formData.country].map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-blue-400">
                    <MapIcon className="w-5 h-5" />
                  </span>
                </div>
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
          <div className="flex justify-end pt-8">
            <Button
              type="submit"
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              Save &amp; Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
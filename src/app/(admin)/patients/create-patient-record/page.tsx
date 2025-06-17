"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/select/SelectField";

interface PatientFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  medicalInfo: {
    bloodType: string;
    allergies: string;
    chronicConditions: string;
    currentMedications: string;
    previousSurgeries: string;
    familyHistory: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
}

type FormSection = keyof PatientFormData;
type AddressField = keyof PatientFormData["personalInfo"]["address"];

export default function CreatePatientRecord() {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
      },
    },
    medicalInfo: {
      bloodType: "",
      allergies: "",
      chronicConditions: "",
      currentMedications: "",
      previousSurgeries: "",
      familyHistory: "",
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    section: FormSection,
    subSection?: AddressField
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (subSection && section === "personalInfo") {
        return {
          ...prev,
          personalInfo: {
            ...prev.personalInfo,
            address: {
              ...prev.personalInfo.address,
              [name]: value,
            },
          },
        };
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value,
        },
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Format the data to match the schema
      const formattedData = {
        personalInfo: {
          firstName: formData.personalInfo.firstName,
          lastName: formData.personalInfo.lastName,
          dateOfBirth: new Date(formData.personalInfo.dateOfBirth),
          gender: formData.personalInfo.gender,
          email: formData.personalInfo.email,
          phone: formData.personalInfo.phone,
          address: {
            city: formData.personalInfo.address.city,
            country: formData.personalInfo.address.country,
          },
        },
        medicalInfo: {
          bloodType: formData.medicalInfo.bloodType,
          chronicConditions: formData.medicalInfo.chronicConditions || '',
        },
      };

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create patient record");
      }

      toast.success("Patient record created successfully");
      router.push("/patients");
    } catch (error: any) {
      toast.error(error.message || "Failed to create patient record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-5 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Create New Patient Record
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Fill in the patient's details to create a new record.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800">
          <h2 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <Label>First Name</Label>
              <Input
                type="text"
                name="firstName"
                value={formData.personalInfo.firstName}
                onChange={(e) => handleChange(e, "personalInfo")}
                required
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                type="text"
                name="lastName"
                value={formData.personalInfo.lastName}
                onChange={(e) => handleChange(e, "personalInfo")}
                required
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                name="dateOfBirth"
                value={formData.personalInfo.dateOfBirth}
                onChange={(e) => handleChange(e, "personalInfo")}
                required
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
                name="gender"
                value={formData.personalInfo.gender}
                onChange={(e) => handleChange(e, "personalInfo")}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.personalInfo.email}
                onChange={(e) => handleChange(e, "personalInfo")}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.personalInfo.phone}
                onChange={(e) => handleChange(e, "personalInfo")}
                required
              />
            </div>
          </div>

          <h3 className="mt-8 mb-4 text-md font-semibold text-gray-800 dark:text-white/90">
            Address
          </h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="lg:col-span-2">
              <Label>Street Address</Label>
              <Input
                type="text"
                name="street"
                value={formData.personalInfo.address.street}
                onChange={(e) => handleChange(e, "personalInfo", "street")}
                required
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                type="text"
                name="city"
                value={formData.personalInfo.address.city}
                onChange={(e) => handleChange(e, "personalInfo", "city")}
                required
              />
            </div>
            <div>
              <Label>State/Province</Label>
              <Input
                type="text"
                name="state"
                value={formData.personalInfo.address.state}
                onChange={(e) => handleChange(e, "personalInfo", "state")}
                required
              />
            </div>
            <div>
              <Label>Postal Code</Label>
              <Input
                type="text"
                name="postalCode"
                value={formData.personalInfo.address.postalCode}
                onChange={(e) => handleChange(e, "personalInfo", "postalCode")}
                required
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                type="text"
                name="country"
                value={formData.personalInfo.address.country}
                onChange={(e) => handleChange(e, "personalInfo", "country")}
                required
              />
            </div>
          </div>
        </div>

        {/* Medical Information Section */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800">
          <h2 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Medical Information
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <Label>Blood Type</Label>
              <Select
                options={[
                  { label: "A+", value: "A+" },
                  { label: "A-", value: "A-" },
                  { label: "B+", value: "B+" },
                  { label: "B-", value: "B-" },
                  { label: "AB+", value: "AB+" },
                  { label: "AB-", value: "AB-" },
                  { label: "O+", value: "O+" },
                  { label: "O-", value: "O-" },
                ]}
                name="bloodType"
                value={formData.medicalInfo.bloodType}
                onChange={(e) => handleChange(e, "medicalInfo")}
              >
                <option value="">Select Blood Type</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label>Allergies</Label>
              <Input
                type="text"
                name="allergies"
                value={formData.medicalInfo.allergies}
                onChange={(e) => handleChange(e, "medicalInfo")}
                placeholder="List any allergies (comma-separated)"
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Chronic Conditions</Label>
              <Input
                type="text"
                name="chronicConditions"
                value={formData.medicalInfo.chronicConditions}
                onChange={(e) => handleChange(e, "medicalInfo")}
                placeholder="List any chronic conditions (comma-separated)"
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Current Medications</Label>
              <Input
                type="text"
                name="currentMedications"
                value={formData.medicalInfo.currentMedications}
                onChange={(e) => handleChange(e, "medicalInfo")}
                placeholder="List current medications (comma-separated)"
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Previous Surgeries</Label>
              <Input
                type="text"
                name="previousSurgeries"
                value={formData.medicalInfo.previousSurgeries}
                onChange={(e) => handleChange(e, "medicalInfo")}
                placeholder="List previous surgeries (comma-separated)"
              />
            </div>
            <div className="lg:col-span-2">
              <Label>Family History</Label>
              <Input
                type="text"
                name="familyHistory"
                value={formData.medicalInfo.familyHistory}
                onChange={(e) => handleChange(e, "medicalInfo")}
                placeholder="List relevant family medical history"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800">
          <h2 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white/90">
            Emergency Contact
          </h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <Label>Contact Name</Label>
              <Input
                type="text"
                name="name"
                value={formData.emergencyContact.name}
                onChange={(e) => handleChange(e, "emergencyContact")}
                required
              />
            </div>
            <div>
              <Label>Relationship</Label>
              <Input
                type="text"
                name="relationship"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleChange(e, "emergencyContact")}
                required
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                name="phone"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleChange(e, "emergencyContact")}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.emergencyContact.email}
                onChange={(e) => handleChange(e, "emergencyContact")}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Patient Record"}
          </Button>
        </div>
      </form>
    </div>
  );
}

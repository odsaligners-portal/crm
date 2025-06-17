"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/select/SelectField";
import TextArea from "@/components/form/input/TextArea";

interface Patient {
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: {
      city: string;
      country: string;
    };
  };
  medicalInfo: {
    bloodType: string;
    chronicConditions: string;
  };
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["Male", "Female", "Other"];

export default function EditPatient({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Patient>({
    _id: "",
    personalInfo: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      email: "",
      phone: "",
      address: {
        city: "",
        country: "",
      },
    },
    medicalInfo: {
      bloodType: "",
      chronicConditions: "",
    },
  });

  useEffect(() => {
    const fetchPatient = async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch patient details");
        }

        const data = await response.json();
        // Format date to YYYY-MM-DD for input
        data.personalInfo.dateOfBirth = new Date(data.personalInfo.dateOfBirth)
          .toISOString()
          .split("T")[0];
        setFormData(data);
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch patient details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [params.id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/patients/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update patient");
      }

      toast.success("Patient updated successfully");
      router.push(`/patient/${params.id}/details`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update patient");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const [section, field] = name.split(".");

    if (section === "address") {
      setFormData((prev) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          address: {
            ...prev.personalInfo.address,
            [field]: value,
          },
        },
      }));
    } else if (section === "personalInfo" || section === "medicalInfo") {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Patient
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Update patient information
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm"
        >
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Input
              label="First Name"
              name="personalInfo.firstName"
              value={formData.personalInfo.firstName}
              onChange={handleChange}
              required
            />
            <Input
              label="Last Name"
              name="personalInfo.lastName"
              value={formData.personalInfo.lastName}
              onChange={handleChange}
              required
            />
            <Select
              label="Gender"
              name="personalInfo.gender"
              value={formData.personalInfo.gender}
              onChange={handleChange}
              required
              options={GENDERS.map((gender) => ({
                label: gender,
                value: gender,
              }))}
            />
            <Input
              label="Date of Birth"
              name="personalInfo.dateOfBirth"
              type="date"
              value={formData.personalInfo.dateOfBirth}
              onChange={handleChange}
              required
            />
            <Input
              label="Email"
              name="personalInfo.email"
              type="email"
              value={formData.personalInfo.email}
              onChange={handleChange}
              required
            />
            <Input
              label="Phone"
              name="personalInfo.phone"
              value={formData.personalInfo.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Medical Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Medical Information
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Select
              label="Blood Type"
              name="medicalInfo.bloodType"
              value={formData.medicalInfo.bloodType}
              onChange={handleChange}
              required
              options={BLOOD_TYPES.map((type) => ({
                label: type,
                value: type,
              }))}
            />
            <TextArea
              label="Chronic Conditions"
              name="medicalInfo.chronicConditions"
              value={formData.medicalInfo.chronicConditions}
              onChange={handleChange}
              placeholder="Enter any chronic conditions..."
            />
          </div>
        </div>

        {/* Location Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Location
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Input
              label="City"
              name="address.city"
              value={formData.personalInfo.address.city}
              onChange={handleChange}
              required
            />
            <Input
              label="Country"
              name="address.country"
              value={formData.personalInfo.address.country}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="px-6 py-2"
          >
            Cancel
          </Button>
          <Button
            disabled={isSaving}
            className="bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
} 
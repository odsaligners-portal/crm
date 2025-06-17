"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";

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
  createdAt: string;
  updatedAt: string;
}

export default function PatientDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setPatient(data);
      } catch (error: any) {
        toast.error(error.message || "Failed to fetch patient details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatient();
  }, [params.id, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-800 dark:text-white">
            Patient not found
          </p>
          <Button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 text-sm"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Patient Details
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            View detailed information about the patient
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm"
          >
            Back
          </Button>
          <Button
            onClick={() => router.push(`/patient/${params.id}/edit`)}
            className="bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Edit Patient
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Full Name
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.personalInfo.firstName} {patient.personalInfo.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Gender
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.personalInfo.gender}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Date of Birth
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {formatDate(patient.personalInfo.dateOfBirth)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Email
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.personalInfo.email}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Phone
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.personalInfo.phone}
              </p>
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Medical Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Blood Type
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.medicalInfo.bloodType}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chronic Conditions
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.medicalInfo.chronicConditions || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Location
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                City
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.personalInfo.address.city}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Country
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.personalInfo.address.country}
              </p>
            </div>
          </div>
        </div>

        {/* Record Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Record Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Created At
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {formatDate(patient.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Last Updated
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {formatDate(patient.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
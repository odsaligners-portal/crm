"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "@/components/ui/button/Button";

interface Patient {
  _id: string;
  patientName: string;
  age: number;
    gender: string;
  pastMedicalHistory: string;
  pastDentalHistory: string;
  treatmentFor: string;
  country: string;
  state: string;
      city: string;
  primaryAddress: string;
  shippingAddress: string;
  billingAddress: string;
  chiefComplaint: string;
  caseType: string;
  caseCategory: string;
  caseCategoryDetails: string;
  treatmentPlan: string;
  extraction: {
    required: boolean;
    comments: string;
  };
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
  scanFiles: Array<{
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function PatientDetails() {
  const params = useParams();
  const router = useRouter();
  const { token } = useSelector((state: any) => state.auth);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    if (params.id) {
    fetchPatient();
    }
  }, [params.id, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-5 lg:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading patient details...</div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-5 lg:p-6">
        <div className="text-center">
          <div className="text-lg text-gray-500">Patient not found</div>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Patient Details
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            View complete patient information
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push(`/patient/${patient._id}/edit`)}
            className="px-4 py-2"
          >
            Edit Patient
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="px-4 py-2"
          >
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Patient Name
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.patientName}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Age
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.age} years
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Gender
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.gender}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Treatment For
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.treatmentFor}
              </p>
            </div>
          </div>
        </div>

        {/* Medical History */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Medical History
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Past Medical History
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.pastMedicalHistory || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Past Dental History
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.pastDentalHistory || "None"}
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
                {patient.city}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                State
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.state}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Country
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.country}
              </p>
            </div>
          </div>
        </div>

        {/* Case Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Case Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Case Category
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.caseCategory}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Case Type
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.caseType}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Extraction Required
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.extraction.required ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </div>

        {/* Chief Complaint */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Chief Complaint & Treatment Plan
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chief Complaint
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.chiefComplaint || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Treatment Plan
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.treatmentPlan || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Case Category Details
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.caseCategoryDetails || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Extraction Comments
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.extraction.comments || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* IPR Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Interproximal Reduction (IPR)
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                IPR Details
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detail 1
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {patient.interproximalReduction.detail1 || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detail 2
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {patient.interproximalReduction.detail2 || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detail 3
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {patient.interproximalReduction.detail3 || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detail 4
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {patient.interproximalReduction.detail4 || "None"}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-lg font-medium text-gray-900 dark:text-white">
                Measure of IPR
              </h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detail A
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {patient.measureOfIPR.detailA || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detail B
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {patient.measureOfIPR.detailB || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Detail C
                  </p>
                  <p className="text-gray-900 dark:text-white">
                    {patient.measureOfIPR.detailC || "None"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Midline & Arch Expansion */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Midline & Arch Expansion
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Midline
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.midline || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Arch Expansion
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.archExpansion || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Midline Comments
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.midlineComments || "None"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Arch Expansion Comments
              </p>
              <p className="mt-1 text-gray-900 dark:text-white">
                {patient.archExpansionComments || "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Comments */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Additional Comments
          </h2>
          <p className="text-gray-900 dark:text-white">
            {patient.additionalComments || "None"}
          </p>
        </div>

        {/* Scan Files */}
        {patient.scanFiles && patient.scanFiles.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Scan Files
            </h2>
            <div className="space-y-2">
              {patient.scanFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {file.fileName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Uploaded: {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(file.fileUrl, '_blank')}
                    size="sm"
                    variant="outline"
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Record Information */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Record Information
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Created Date
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

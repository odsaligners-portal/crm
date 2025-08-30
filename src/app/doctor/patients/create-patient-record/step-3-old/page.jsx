"use client";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { archExpansionOptions, midlineOptions } from "@/constants/data";
import { ArrowsRightLeftIcon } from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";

export default function Step3Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { token } = useSelector((state) => state.auth);
  const [patientDatails, setPatientDatails] = React.useState(null);
  const dispatch = useDispatch();

  // Local state for form data
  const [formData, setFormData] = React.useState({
    midline: "",
    midlineComments: "",
    archExpansion: "",
    archExpansionComments: "",
  });

  // Fetch patient data when component mounts and patientId exists
  React.useEffect(() => {
    if (!patientId) {
      toast.error("Please start from Step 1.");
      router.replace("/doctor/patients/create-patient-record");
      return;
    }
  }, [patientId, router]);

  React.useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      dispatch(setLoading(true));
      try {
        const patientData = await fetchWithError(
          `/api/patients/update-details?id=${encodeURIComponent(patientId).trim()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setPatientDatails(patientData);
        setFormData((prev) => ({
          ...prev,
          midline: patientData.midline || "",
          midlineComments: patientData.midlineComments || "",
          archExpansion: patientData.archExpansion || "",
          archExpansionComments: patientData.archExpansionComments || "",
        }));
      } catch (error) {
        // fetchWithError already toasts
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchPatientData();
  }, [patientId, token, dispatch]);

  // Local handleChange for all fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = async (e) => {
    e.preventDefault();
    if (!formData.midline && !formData.archExpansion) {
      toast.error(
        "Please select at least one option for Midline or Arch Expansion.",
      );
      return;
    }
    dispatch(setLoading(true));
    try {
      await fetchWithError(
        `/api/patients/update-details?id=${encodeURIComponent(patientId || "").trim()}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            midline: formData.midline,
            midlineComments: formData.midlineComments,
            archExpansion: formData.archExpansion,
            archExpansionComments: formData.archExpansionComments,
          }),
        },
      );
      toast.success("Details updated successfully");
      router.push(
        `/doctor/patients/create-patient-record/step-4?id=${patientId}`,
      );
    } catch (error) {
      // fetchWithError already toasts
    } finally {
      dispatch(setLoading(false));
    }
  };
  const prevStep = () => {
    router.push(
      `/doctor/patients/create-patient-record/step-2?id=${patientId}`,
    );
  };

  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 py-8 dark:from-gray-900 dark:to-gray-800">
      <div className="animate-slide-up relative w-full max-w-3xl overflow-hidden rounded-2xl border border-blue-100 bg-white p-8 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        {/* Progress Bar */}
        <div className="mt-8 mb-10 flex justify-end">
          <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700 bg-clip-text px-4 py-2 text-sm font-extrabold tracking-tight text-transparent drop-shadow-xl">
            Case Id: {patientDatails?.caseId || patientId}
          </div>
        </div>
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">
              Step 3 of 4
            </span>
            <span className="text-xs text-gray-400">
              Midline & Arch Expansion
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-blue-100">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{ width: "75%" }}
            />
          </div>
        </div>
        {/* Heading & Description */}
        <h1 className="mb-1 text-3xl font-semibold tracking-tight text-blue-700 dark:text-white">
          Step 3: Midline & Arch Expansion
        </h1>
        <p className="mb-8 text-sm text-gray-500 dark:text-gray-300">
          Provide details about midline and arch expansion measurements to help
          us plan the treatment precisely.
        </p>

        <form className="space-y-8" onSubmit={nextStep}>
          <div className="space-y-6">
            <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <ArrowsRightLeftIcon className="h-5 w-5 text-blue-400" />
                Midline & Arch Expansion
              </h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
                <div>
                  <Label>Midline</Label>
                  <div className="mt-2 space-y-2">
                    {midlineOptions.map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center"
                      >
                        <input
                          type="radio"
                          name="midline"
                          value={option}
                          checked={formData.midline === option}
                          onChange={handleChange}
                          className="mr-2 h-4 w-4 accent-blue-500"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
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
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
                <div>
                  <Label>Arch Expansion</Label>
                  <div className="mt-2 space-y-2">
                    {archExpansionOptions.map((option) => (
                      <label
                        key={option}
                        className="flex cursor-pointer items-center"
                      >
                        <input
                          type="radio"
                          name="archExpansion"
                          value={option}
                          checked={formData.archExpansion === option}
                          onChange={handleChange}
                          className="mr-2 h-4 w-4 accent-blue-500"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-4">
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
            <Button
              type="button"
              onClick={prevStep}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-500 hover:to-blue-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 17.25L3 12m0 0l3.75-5.25M3 12h18"
                />
              </svg>
              Previous
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
            >
              Submit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

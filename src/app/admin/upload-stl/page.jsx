"use client";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { BoxCubeIcon } from "@/icons";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
 
export default function AdminUploadSTL() {
  const { token } = useSelector((state) => state.auth);
  const [caseId, setCaseId] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [patient, setPatient] = useState(null);
  const [planners, setPlanners] = useState([]);
  const [loadingPlanners, setLoadingPlanners] = useState(false);
  const [selectedPlannerId, setSelectedPlannerId] = useState("");
  const [isReassigning, setIsReassigning] = useState(false);
 
  const handleSearch = async (e) => {
    e.preventDefault();
 
    if (!caseId.trim()) {
      toast.error("Please enter a case ID");
      return;
    }
 
    setIsSearching(true);
 
    try {
      const response = await fetch(
        `/api/admin/patients/find-by-case-id?caseId=${encodeURIComponent(caseId.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
 
      const data = await response.json();
 
      if (!response.ok) {
        throw new Error(data.error || "Failed to find patient");
      }
 
      // Set patient data with the patientId from the response
      setPatient({
        _id: data.patientId,
        patientName: data.patientName,
        caseId: data.caseId,
      });
    } catch (error) {
      console.error("Error searching patient:", error);
      toast.error(error.message || "Failed to find patient");
      setPatient(null);
    } finally {
      setIsSearching(false);
    }
  };
 
  const fetchPlanners = async () => {
    if (!token) return;
    setLoadingPlanners(true);
    try {
      const res = await fetch("/api/admin/other-admins?role=planner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch planners");
      setPlanners(data.admins || []);
    } catch (err) {
      toast.error(err.message || "Failed to fetch planners");
      setPlanners([]);
    } finally {
      setLoadingPlanners(false);
    }
  };
 
  const handleReassign = async () => {
    if (!patient?._id) {
      toast.error("No patient selected");
      return;
    }
    if (!selectedPlannerId) {
      toast.error("Please select a planner");
      return;
    }
    setIsReassigning(true);
    try {
      const res = await fetch("/api/admin/patients/stl-reassign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: patient._id,
          plannerId: selectedPlannerId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reassign STL");
      toast.success("STL cleared and reassigned to planner successfully");
      // reset form
      setCaseId("");
      setPatient(null);
      setSelectedPlannerId("");
    } catch (err) {
      toast.error(err.message || "Failed to reassign STL");
    } finally {
      setIsReassigning(false);
    }
  };
 
  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <BoxCubeIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Reassign STL to Planner
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Clear the existing STL file and allow a planner to upload a new
              one
            </p>
          </div>
        </div>
 
        {/* Info Banner */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-blue-900 dark:text-blue-100">
                Important Information
              </h3>
              <ul className="list-disc pl-5 text-sm text-blue-800 dark:text-blue-200">
                <li>Reassignment clears existing STL file and comments.</li>
                <li>Planner will be able to upload a new STL immediately.</li>
                <li>
                  Planner deadline is recalculated based on configured SLA.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
 
      {/* Search Section */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
          Search Patient by Case ID
        </h2>
 
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <Input
              label="Case ID"
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              placeholder="Enter patient case ID"
              required
            />
          </div>
 
          <Button
            type="submit"
            disabled={isSearching}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md transition-all duration-300 hover:from-blue-600 hover:to-purple-700 hover:shadow-lg sm:w-auto"
          >
            {isSearching ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Searching...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <span>Search Patient</span>
              </div>
            )}
          </Button>
        </form>
      </div>
 
      {/* Patient Info and Reassign Section */}
      {patient && (
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Patient Information
          </h2>
 
          <div className="mb-6 space-y-3 rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-blue-50 p-4 dark:border-gray-600 dark:from-gray-700 dark:to-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white">
                <span className="text-lg font-bold">
                  {patient.patientName?.charAt(0) || "P"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {patient.patientName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Case ID: {patient.caseId}
                </p>
              </div>
            </div>
          </div>
 
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Planner
              </label>
              <select
                className="w-full rounded-xl border-2 border-gray-200 bg-white/80 px-4 py-3 text-gray-900 backdrop-blur-sm transition-all duration-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={selectedPlannerId}
                onChange={(e) => setSelectedPlannerId(e.target.value)}
                onFocus={() => planners.length === 0 && fetchPlanners()}
                disabled={loadingPlanners}
              >
                <option value="">
                  {loadingPlanners
                    ? "Loading planners..."
                    : planners.length === 0
                      ? "No planners available"
                      : "Select Planner"}
                </option>
                {planners.map((planner) => (
                  <option key={planner._id} value={planner._id}>
                    {planner.name} ({planner.email})
                  </option>
                ))}
              </select>
            </div>
 
            <div className="flex items-end gap-3">
              <Button
                onClick={handleReassign}
                disabled={isReassigning || !selectedPlannerId}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md transition-all duration-300 hover:from-green-600 hover:to-green-700 hover:shadow-lg disabled:opacity-60"
              >
                {isReassigning ? "Reassigning..." : "Reassign STL to Planner"}
              </Button>
 
              <Button
                onClick={() => {
                  setCaseId("");
                  setPatient(null);
                  setSelectedPlannerId("");
                }}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
 
      {/* No Results Message */}
      {!patient && caseId && !isSearching && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <svg
            className="mx-auto mb-4 h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            Search for a patient to begin
          </p>
        </div>
      )}
 
      {/* No modal needed for reassignment */}
    </div>
  );
}

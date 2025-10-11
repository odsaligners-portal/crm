"use client";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { MdAccessTime, MdEdit, MdSave } from "react-icons/md";

export default function DeadlineTimePage() {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [lastUpdatedBy, setLastUpdatedBy] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const { token } = useSelector((state) => state.auth) || {};

  // Check planner access
  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasPlannerAccess(false);
        return;
      }
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasPlannerAccess(!!data.user?.plannerAccess);
      } catch (err) {
        setHasPlannerAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  // Fetch existing deadline time
  useEffect(() => {
    if (hasPlannerAccess) {
      fetchDeadlineTime();
    }
  }, [hasPlannerAccess]);

  const fetchDeadlineTime = async () => {
    try {
      setFetching(true);
      const response = await fetch("/api/deadline-time", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok && data.data) {
        setDays(data.data.days || 0);
        setHours(data.data.hours || 0);
        setMinutes(data.data.minutes || 0);
        setTotalHours(data.data.totalHours || 0);
        setLastUpdated(data.data.updatedAt);
        setLastUpdatedBy(data.data.lastUpdatedBy?.name || "Unknown");
      } else {
        // If no data exists yet, enable editing mode automatically
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Failed to fetch deadline time", err);
      // Enable editing mode if fetch fails
      setIsEditing(true);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate that at least one value is greater than 0
    const numDays = Number(days) || 0;
    const numHours = Number(hours) || 0;
    const numMinutes = Number(minutes) || 0;

    if (numDays === 0 && numHours === 0 && numMinutes === 0) {
      toast.error("Please enter at least some time (days, hours, or minutes)");
      return;
    }

    // Validate ranges
    if (numDays < 0) {
      toast.error("Days cannot be negative");
      return;
    }
    if (numHours < 0 || numHours > 23) {
      toast.error("Hours must be between 0 and 23");
      return;
    }
    if (numMinutes < 0 || numMinutes > 59) {
      toast.error("Minutes must be between 0 and 59");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/deadline-time", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          days: numDays,
          hours: numHours,
          minutes: numMinutes,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update deadline time");
      }

      toast.success("Deadline time updated successfully!");
      setIsEditing(false);
      fetchDeadlineTime();
    } catch (err) {
      toast.error(err.message || "Failed to update deadline time");
    } finally {
      setLoading(false);
    }
  };

  // Access denied check
  if (hasPlannerAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 subpixel-antialiased dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to view this page.
        </span>
      </div>
    );
  }

  // Loading state
  if (hasPlannerAccess === null || fetching) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold text-blue-800 subpixel-antialiased dark:text-white">
          <MdAccessTime className="text-3xl" />
          Assign Deadline Time
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Set the default deadline duration for planner tasks using days, hours,
          and minutes. This can be set to any duration (e.g., 3 days, 72 hours,
          etc.).
        </p>
      </div>

      <div className="before:border-gradient-to-r before:animate-border-glow relative overflow-hidden rounded-xl border border-transparent bg-white/90 shadow-xl backdrop-blur-md before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:border-2 before:from-blue-200 before:via-purple-100 before:to-blue-100 dark:bg-gray-900/80">
        <div className="relative z-10 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Total Hours Display */}
            {totalHours > 0 && !isEditing && (
              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-900/20 dark:to-purple-900/20">
                <p className="text-center text-2xl font-bold text-blue-600 dark:text-blue-400">
                  Total: {totalHours.toFixed(2)} hours
                </p>
                <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">
                  {days > 0 && `${days} day${days > 1 ? "s" : ""}`}
                  {days > 0 && (hours > 0 || minutes > 0) && ", "}
                  {hours > 0 && `${hours} hour${hours > 1 ? "s" : ""}`}
                  {hours > 0 && minutes > 0 && ", "}
                  {minutes > 0 && `${minutes} minute${minutes > 1 ? "s" : ""}`}
                </p>
              </div>
            )}

            {/* Days Input */}
            <div>
              <label
                htmlFor="days"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Days
              </label>
              <input
                type="number"
                id="days"
                name="days"
                min="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:disabled:bg-gray-700"
                placeholder="0"
              />
            </div>

            {/* Hours Input */}
            <div>
              <label
                htmlFor="hours"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Hours (0-23)
              </label>
              <input
                type="number"
                id="hours"
                name="hours"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:disabled:bg-gray-700"
                placeholder="0"
              />
            </div>

            {/* Minutes Input */}
            <div>
              <label
                htmlFor="minutes"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Minutes (0-59)
              </label>
              <input
                type="number"
                id="minutes"
                name="minutes"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                disabled={!isEditing}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-400 dark:disabled:bg-gray-700"
                placeholder="0"
              />
            </div>

            {/* Last Updated Info */}
            {lastUpdated && (
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Last Updated:</span>{" "}
                  {new Date(lastUpdated).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Updated By:</span>{" "}
                  {lastUpdatedBy}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditing(true);
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white transition-all hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
                >
                  <MdEdit className="text-lg" />
                  Edit Time
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white transition-all hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <MdSave className="text-lg" />
                    {loading ? "Saving..." : "Save Time"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditing(false);
                      fetchDeadlineTime();
                    }}
                    disabled={loading}
                    className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 transition-all hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            {/* Info Message */}
            <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <span className="font-medium">Note:</span> This deadline
                duration setting cannot be deleted and will be used system-wide
                for planner tasks. You can set any combination of days, hours,
                and minutes.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

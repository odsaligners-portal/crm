"use client";
import React, { useState, useEffect } from "react";
import { MdTimer, MdCheckCircle, MdWarning } from "react-icons/md";

const CaseCountdownTimer = ({
  endDate,
  startDate,
  caseId,
  patientName,
  compact = false,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const end = new Date(endDate);
      const diff = end - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      setIsExpired(false);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!endDate) {
    return (
      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <MdTimer className="h-5 w-5" />
          <span className="text-sm font-medium">End date not assigned</span>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <div className="flex items-center justify-center gap-2 text-red-700 dark:text-red-400">
          <MdWarning className="h-5 w-5" />
          <span className="text-sm font-semibold">Case has expired</span>
        </div>
        {startDate && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-500">
            End date: {new Date(endDate).toLocaleString()}
          </p>
        )}
      </div>
    );
  }

  if (!timeRemaining) {
    return (
      <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
          <MdTimer className="h-5 w-5 animate-pulse" />
          <span className="text-sm font-medium">Calculating...</span>
        </div>
      </div>
    );
  }

  const isUrgent = timeRemaining.days < 7;
  const isVeryUrgent = timeRemaining.days < 3;

  // Compact version for header
  if (compact) {
    return (
      <div
        className={`inline-flex items-center justify-center gap-3 rounded-lg border px-4 py-2.5 shadow-sm ${
          isVeryUrgent
            ? "border-red-300 bg-gradient-to-r from-red-50 to-red-100 dark:border-red-800 dark:from-red-900/20 dark:to-red-800/20"
            : isUrgent
              ? "border-orange-300 bg-gradient-to-r from-orange-50 to-orange-100 dark:border-orange-800 dark:from-orange-900/20 dark:to-orange-800/20"
              : "border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100 dark:border-blue-800 dark:from-blue-900/20 dark:to-blue-800/20"
        }`}
      >
        <MdTimer
          className={`h-4 w-4 ${
            isVeryUrgent
              ? "text-red-600 dark:text-red-400"
              : isUrgent
                ? "text-orange-600 dark:text-orange-400"
                : "text-blue-600 dark:text-blue-400"
          }`}
        />
        <div className="flex items-center justify-center gap-1.5">
          <span
            className={`text-xs font-medium ${
              isVeryUrgent
                ? "text-red-700 dark:text-red-400"
                : isUrgent
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-blue-700 dark:text-blue-400"
            }`}
          >
            {isVeryUrgent ? "⚠️" : isUrgent ? "⏰" : "⏳"}
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={`text-lg font-bold ${
                isVeryUrgent
                  ? "text-red-700 dark:text-red-400"
                  : isUrgent
                    ? "text-orange-700 dark:text-orange-400"
                    : "text-blue-700 dark:text-blue-400"
              }`}
            >
              {String(timeRemaining.days).padStart(2, "0")}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">d</span>
            <span className="mx-0.5 text-gray-400">:</span>
            <span
              className={`text-lg font-bold ${
                isVeryUrgent
                  ? "text-red-700 dark:text-red-400"
                  : isUrgent
                    ? "text-orange-700 dark:text-orange-400"
                    : "text-blue-700 dark:text-blue-400"
              }`}
            >
              {String(timeRemaining.hours).padStart(2, "0")}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">h</span>
            <span className="mx-0.5 text-gray-400">:</span>
            <span
              className={`text-lg font-bold ${
                isVeryUrgent
                  ? "text-red-700 dark:text-red-400"
                  : isUrgent
                    ? "text-orange-700 dark:text-orange-400"
                    : "text-blue-700 dark:text-blue-400"
              }`}
            >
              {String(timeRemaining.minutes).padStart(2, "0")}
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">m</span>
          </div>
        </div>
      </div>
    );
  }

  // Full version for dashboard
  return (
    <div
      className={`rounded-xl border-2 p-4 ${
        isVeryUrgent
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
          : isUrgent
            ? "border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
            : "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
      }`}
    >
      <div className="mb-3 flex items-center justify-center gap-2">
        <MdTimer
          className={`h-5 w-5 ${
            isVeryUrgent
              ? "text-red-600 dark:text-red-400"
              : isUrgent
                ? "text-orange-600 dark:text-orange-400"
                : "text-blue-600 dark:text-blue-400"
          }`}
        />
        <span
          className={`text-sm font-semibold ${
            isVeryUrgent
              ? "text-red-700 dark:text-red-400"
              : isUrgent
                ? "text-orange-700 dark:text-orange-400"
                : "text-blue-700 dark:text-blue-400"
          }`}
        >
          {isVeryUrgent
            ? "⚠️ Urgent: Time Remaining"
            : isUrgent
              ? "⏰ Time Remaining"
              : "⏳ Time Remaining"}
        </span>
      </div>

      <div className="grid grid-cols-4 place-items-center gap-2">
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              isVeryUrgent
                ? "text-red-700 dark:text-red-400"
                : isUrgent
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-blue-700 dark:text-blue-400"
            }`}
          >
            {String(timeRemaining.days).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Days</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              isVeryUrgent
                ? "text-red-700 dark:text-red-400"
                : isUrgent
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-blue-700 dark:text-blue-400"
            }`}
          >
            {String(timeRemaining.hours).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Hours</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              isVeryUrgent
                ? "text-red-700 dark:text-red-400"
                : isUrgent
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-blue-700 dark:text-blue-400"
            }`}
          >
            {String(timeRemaining.minutes).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Mins</div>
        </div>
        <div className="text-center">
          <div
            className={`text-2xl font-bold ${
              isVeryUrgent
                ? "text-red-700 dark:text-red-400"
                : isUrgent
                  ? "text-orange-700 dark:text-orange-400"
                  : "text-blue-700 dark:text-blue-400"
            }`}
          >
            {String(timeRemaining.seconds).padStart(2, "0")}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Secs</div>
        </div>
      </div>

      {endDate && (
        <p className="mt-3 text-center text-xs text-gray-600 dark:text-gray-400">
          Ends: {new Date(endDate).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default CaseCountdownTimer;

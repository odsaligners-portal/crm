"use client";
import React, { useState, useEffect } from "react";
import { MdTimer, MdCalendarToday, MdWarning } from "react-icons/md";

const CaseTimeline = ({ startDate, endDate, compact = true }) => {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate countdown if end date exists
    if (endDate) {
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
      const interval = setInterval(calculateTimeRemaining, 1000); // Update every second

      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
      setIsExpired(false);
    }
  }, [endDate]);

  useEffect(() => {
    // Calculate progress if both dates exist
    if (startDate && endDate) {
      const calculateProgress = () => {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);
        const total = end - start;
        const elapsed = now - start;

        if (total <= 0) {
          setProgress(100);
          return;
        }

        const progressPercent = Math.min(
          100,
          Math.max(0, (elapsed / total) * 100),
        );
        setProgress(progressPercent);
      };

      calculateProgress();
      const interval = setInterval(calculateProgress, 60000); // Update every minute

      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  }, [startDate, endDate]);

  // Only show countdown timer if end date exists
  if (!endDate) {
    return (
      <div className="text-[9px] text-gray-500">
        <span>No end date</span>
      </div>
    );
  }

  const isUrgent = timeRemaining && timeRemaining.days < 7;
  const isVeryUrgent = timeRemaining && timeRemaining.days < 3;

  // Show countdown timer
  return (
    <div className="flex justify-center">
      {timeRemaining ? (
        <div
          className={`flex items-center justify-center gap-1 text-[9px] font-medium ${
            isExpired
              ? "text-red-600 dark:text-red-400"
              : isVeryUrgent
                ? "text-red-600 dark:text-red-400"
                : isUrgent
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-blue-600 dark:text-blue-400"
          }`}
        >
          {isExpired ? (
            <>
              <MdWarning className="h-3 w-3" />
              <span>Expired</span>
            </>
          ) : (
            <>
              <MdTimer className="h-3 w-3" />
              <span>
                {timeRemaining.days > 0
                  ? `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`
                  : timeRemaining.hours > 0
                    ? `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`
                    : `${timeRemaining.minutes}m ${timeRemaining.seconds}s`}
              </span>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center text-[9px] text-gray-500">
          <MdTimer className="mr-1 h-3 w-3 animate-pulse" />
          <span>Calculating...</span>
        </div>
      )}
    </div>
  );
};

export default CaseTimeline;

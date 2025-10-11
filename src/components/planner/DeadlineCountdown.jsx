"use client";
import { useEffect, useState } from "react";
import { MdAccessTime, MdWarning } from "react-icons/md";

export default function DeadlineCountdown({ deadline, assignedAt }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isBreached, setIsBreached] = useState(false);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const deadlineTime = new Date(deadline).getTime();
      const difference = deadlineTime - now;

      if (difference <= 0) {
        setIsBreached(true);
        const overdue = Math.abs(difference);
        const days = Math.floor(overdue / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (overdue % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60));

        return {
          days,
          hours,
          minutes,
          isOverdue: true,
        };
      }

      setIsBreached(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        days,
        hours,
        minutes,
        seconds,
        isOverdue: false,
      };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  // No deadline set
  if (!deadline) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <MdAccessTime className="text-sm" />
        <span>No deadline</span>
      </div>
    );
  }

  // Loading state
  if (timeLeft === null) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <MdAccessTime className="animate-spin text-sm" />
        <span>Loading...</span>
      </div>
    );
  }

  // Deadline breached
  if (isBreached || timeLeft.isOverdue) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
          <MdWarning className="animate-pulse text-sm" />
          <span>DEADLINE BREACH</span>
        </div>
        <div className="text-[10px] text-red-500 dark:text-red-400">
          Overdue by: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
        </div>
      </div>
    );
  }

  // Determine urgency level
  const totalMinutesLeft =
    timeLeft.days * 24 * 60 + timeLeft.hours * 60 + timeLeft.minutes;
  let urgencyClass = "text-green-600 dark:text-green-400";
  let bgClass = "bg-green-50 dark:bg-green-900/20";

  if (totalMinutesLeft < 60) {
    // Less than 1 hour
    urgencyClass = "text-red-600 dark:text-red-400";
    bgClass = "bg-red-50 dark:bg-red-900/20";
  } else if (totalMinutesLeft < 360) {
    // Less than 6 hours
    urgencyClass = "text-orange-600 dark:text-orange-400";
    bgClass = "bg-orange-50 dark:bg-orange-900/20";
  } else if (totalMinutesLeft < 1440) {
    // Less than 24 hours
    urgencyClass = "text-yellow-600 dark:text-yellow-400";
    bgClass = "bg-yellow-50 dark:bg-yellow-900/20";
  }

  return (
    <div
      className={`flex gap-0.5 rounded-md px-2 py-1 whitespace-nowrap ${bgClass}`}
    >
      <div
        className={`flex items-center gap-1 text-xs font-medium ${urgencyClass}`}
      >
        <MdAccessTime className="text-sm" />
      </div>
      <div className={`text-[11px] font-semibold ${urgencyClass}`}>
        {timeLeft.days > 0 && `${timeLeft.days}d `}
        {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </div>
    </div>
  );
}

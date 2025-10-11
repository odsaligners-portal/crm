"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/doctor/AppHeader";
import AppSidebar from "@/layout/doctor/AppSidebar";
import Backdrop from "@/layout/doctor/Backdrop";
import { useAppSelector, useAppDispatch } from "@/store/store";
import { logout } from "@/store/features/auth/authSlice";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import React from "react";

export default function DoctorLayout({ children }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, role, token } = useAppSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [isSuspended, setIsSuspended] = useState(false);

  // Check if user is authenticated and has doctor role
  useEffect(() => {
    if (!user || !role) {
      router.push("/signin");
      return;
    }

    if (role !== "doctor") {
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "super-admin") {
        router.push("/admin");
      } else if (role === "planner") {
        router.push("/planner");
      } else if (role === "distributer") {
        router.push("/distributer");
      } else {
        router.push("/signin");
      }
      return;
    }

    // Check for account suspension
    const checkSuspension = async () => {
      try {
        const response = await fetch("/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user?.isSuspended) {
            setIsSuspended(true);
            // Logout and redirect
            dispatch(logout());
            router.push("/signin");
            return;
          }
        } else if (response.status === 403) {
          const data = await response.json();
          if (data.isSuspended) {
            setIsSuspended(true);
            dispatch(logout());
            router.push("/signin");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking suspension:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSuspension();
  }, [user, role, token, router, dispatch]);

  // Show loading spinner while checking authentication or redirecting
  if (isLoading || !user || role !== "doctor") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="border-brand-500 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300"></div>
        </div>
      </div>
    );
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

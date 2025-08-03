"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/distributer/AppHeader";
import AppSidebar from "@/layout/distributer/AppSidebar";
import Backdrop from "@/layout/doctor/Backdrop";
import { useAppSelector } from "@/store/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PlannerLayout({ children }) {
  const router = useRouter();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, role } = useAppSelector((state) => state.auth);
  // Check if user is authenticated and has planner role
  useEffect(() => {
    if (!user || !role) {
      router.push("/signin");
      return;
    }

    if (role !== "distributer") {
      if (role === "admin") {
        router.push("/admin");
      } else if (role === "super-admin") {
        router.push("/admin");
      } else if (role === "doctor") {
        router.push("/doctor");
      } else if (role === "planner") {
        router.push("/planner");
      } else {
        router.push("/signin");
      }
      return;
    }
  }, [user, role, router]);

  // Show loading spinner while checking authentication or redirecting
  if (!user || role !== "distributer") {
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

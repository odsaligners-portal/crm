"use client";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/admin/AppHeader";
import AppSidebar from "@/layout/admin/AppSidebar";
import Backdrop from "@/layout/admin/Backdrop";
import { useAppSelector } from '@/store/store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from "react";

export default function AdminLayout({
  children,
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, role } = useAppSelector(state => state.auth);
  
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!user || !role) {
      router.push('/signin');
      return;
    }

    if (role === 'admin') {
      setIsAuthorized(true);
    } else if (role === 'doctor') {
      router.push('/doctor');
    } else if (role === 'super-admin') {
      router.push('/super-admin');
    } else {
      router.push('/signin');
    }
  }, [user, role, router]);

  // Return null to allow the global loader to be visible
  // while authorization is being checked.
  if (!isAuthorized) {
    return null;
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
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}

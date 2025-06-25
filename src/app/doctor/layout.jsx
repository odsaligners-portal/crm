"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/doctor/AppHeader";
import AppSidebar from "@/layout/doctor/AppSidebar";
import Backdrop from "@/layout/doctor/Backdrop";
import { useAppSelector } from '@/store/store';
import { useRouter } from 'next/navigation';
import React from "react";

export default function DoctorLayout({
  children,
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, role } = useAppSelector(state => state.auth);
  const router = useRouter();

  // Check if user is authenticated and has doctor role
  React.useEffect(() => {
    if (!user || !role) {
      router.push('/signin');
      return;
    } 

    if (role !== 'doctor') {
      if(role === 'admin'){
        router.push('/admin');
      }else if(role === 'super-admin'){
        router.push('/super-admin');
      }else{
        router.push('/signin');
      }
      return;
    }
  }, [user, role, router]);

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

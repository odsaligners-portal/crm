"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/admin/AppHeader";
import AppSidebar from "@/layout/admin/AppSidebar";
import Backdrop from "@/layout/admin/Backdrop";
import { useRouter } from "next/router";
import React from "react";

export default function AdminLayout({
  children,
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const { user, role } = useAppSelector(state => state.auth);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    // If user is authorized, stop loading
    setIsLoading(false);
  }, [user, role, router]);

  // Show loading spinner while checking authentication or redirecting
  if (isLoading || !user || role !== 'doctor') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {!user || !role ? 'Checking authentication...' : 'Redirecting...'}
          </div>
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

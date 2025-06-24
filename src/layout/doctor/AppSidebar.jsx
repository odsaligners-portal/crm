"use client";
import { useSidebar } from "@/context/SidebarContext";
import {
  HorizontaLDots
} from "@/icons/index";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback } from "react";
import {
  MdAdd, MdComment,
  MdDashboard,
  MdDescription,
  MdEvent,
  MdLogin,
  MdLoop,
  MdMenuBook,
  MdNotifications,
  MdPerson,
  MdPieChart,
  MdTableChart,
  MdVideoLibrary,
  MdWidgets
} from 'react-icons/md';
import { useSelector } from "react-redux";

const navItems = [
  {
    icon: <MdDashboard />,
    name: "Dashboard",
    path: "/doctor",
  },
  {
    icon: <MdTableChart />,
    name: "Patient Records",
    path: "/doctor/patients",
  },
  {
    icon: <MdAdd />,
    name: "Create Patient Record",
    path: "/doctor/patients/create-patient-record/step-1",
  },
  {
    icon: <MdLoop />,
    name: "Manage Patient Progress",
    path: "/doctor/patients/manage-status",
  },
  {
    icon: <MdNotifications />,
    name: "Notifications",
    path: "/doctor/notifications",
  },
  {
    icon: <MdComment />,
    name: "View Comments",
    path: "/doctor/view-comments",
  },
  {
    icon: <MdEvent />,
    name: "Events",
    path: "/doctor/events",
  },
  {
    icon: <MdMenuBook />,
    name: "Educational Material",
    path: "/doctor/educational-material",
  },
  {
    icon: <MdVideoLibrary />,
    name: "Tutorials",
    path: "/doctor/tutorials",
  },
  {
    icon: <MdPerson />,
    name: "User Profile",
    path: "/doctor/profile",
  },
  {
    icon: <MdDescription />,
    name: "Terms & Conditions",
    path: "/doctor/terms-and-conditions",
  },
];



const renderMenuItems = (
  navItems,
  menuType,
  isActive,
  isExpanded,
  isHovered,
  isMobileOpen,
  unreadCount
) => (
  <ul className="flex flex-col gap-4">
    {navItems.map((nav, index) => (
      <li key={nav.name}>
        {nav.subItems ? (
          null
        ) : (
          nav.path && (
            <Link
              href={nav.path}
              className={`menu-item group ${
                isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
              }`}
            >
              <span
                className={`${
                  isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                } relative`}
              >
                {nav.icon}
                {/* Unread notification badge for Notifications */}
                {nav.name === "Notifications" && unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 shadow-lg border-2 border-white animate-bounce z-10 min-w-[20px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
            </Link>
          )
        )}
      </li>
    ))}
  </ul>
);

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const unreadCount = useSelector((state) => state.notification.unreadCount);

  const isActive = useCallback((path) => path === pathname, [pathname]);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image
                className="dark:hidden"
                src="/logo.png"
                alt="Logo"
                width={150}
                height={40}
              />
              <Image
                className="hidden dark:block"
                src="/logo.png"
                alt="Logo"
                width={150}
                height={40}
              />
            </>
          ) : (
            <Image
              src="/logo.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "navItems", isActive, isExpanded, isHovered, isMobileOpen, unreadCount)}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
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
  MdMenuBook,
  MdPerson,
  MdPieChart,
  MdTableChart,
  MdVideoLibrary,
  MdWidgets
} from 'react-icons/md';

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

const othersItems = [
  {
    icon: <MdPieChart />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <MdWidgets />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <MdLogin />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

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
              <ul className="flex flex-col gap-4">
                {navItems.map((nav) => (
                  <li key={nav.name}>
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
                        }`}
                      >
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className={`menu-item-text`}>{nav.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
"use client";

import { useSidebar } from "@/context/SidebarContext";
import { HorizontaLDots } from "@/icons/index";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  MdDashboard,
  MdTableChart,
  MdEvent,
  MdMenuBook,
  MdPerson,
  MdDescription,
  MdNotifications,
  MdVideoLibrary,
} from "react-icons/md";
import { useSelector } from "react-redux";

const navItems = [
  {
    icon: <MdDashboard />,
    name: "Dashboard",
    path: "/planner",
  },
  {
    icon: <MdTableChart />,
    name: "Patient Records",
    path: "/planner/patients",
  },
  {
      icon: <MdNotifications />,
      name: "Notifications",
      path: "/planner/notifications",
    },
    {
      icon: <MdEvent />,
      name: "Events",
      path: "/planner/events",
    },
    {
      icon: <MdMenuBook />,
      name: "Educational Material",
      path: "/planner/educational-material",
    },
    {
      icon: <MdVideoLibrary />,
      name: "Tutorials",
      path: "/planner/tutorials",
    },
    {
      icon: <MdPerson />,
      name: "User Profile",
      path: "/planner/profile",
    },
    {
      icon: <MdDescription />,
      name: "Terms & Conditions",
      path: "/planner/terms-and-conditions",
    },
];

const renderMenuItems = (
  navItems,
  isActive,
  isExpanded,
  isHovered,
  isMobileOpen,
  unreadCount,
) => (
  <ul className="flex flex-col gap-4">
    {navItems.map((nav) => (
      <li key={nav.name}>
        {nav.path && (
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
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="menu-item-text">{nav.name}</span>
            )}
          </Link>
        )}
      </li>
    ))}
  </ul>
);

const AppSidebar = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const unreadCount = useSelector(
    (state) => state.notification?.unreadCount || 0,
  );
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isActive = useCallback((path) => pathname === path, [pathname]);

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-800 dark:bg-gray-900 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
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
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 flex text-xs leading-[20px] text-gray-400 uppercase ${
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

              {/* Avoid hydration mismatch */}
              {hasMounted &&
                renderMenuItems(
                  navItems,
                  isActive,
                  isExpanded,
                  isHovered,
                  isMobileOpen,
                  unreadCount,
                )}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;

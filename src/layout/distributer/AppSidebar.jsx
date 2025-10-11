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
    path: "/distributer",
  },
  {
    icon: <MdTableChart />,
    name: "Patient Records",
    path: "/distributer/patients",
  },
  {
    icon: <MdNotifications />,
    name: "Notifications",
    path: "/distributer/notifications",
  },
  {
    icon: <MdEvent />,
    name: "Events",
    path: "/distributer/events",
  },
  {
    icon: <MdMenuBook />,
    name: "Educational Material",
    path: "/distributer/educational-material",
  },
  {
    icon: <MdVideoLibrary />,
    name: "Tutorials",
    path: "/distributer/tutorials",
  },
  // {
  //   icon: <MdPerson />,
  //   name: "User Profile",
  //   path: "/distributer/profile",
  // },
  {
    icon: <MdDescription />,
    name: "Terms & Conditions",
    path: "/distributer/terms-and-conditions",
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
  const { token } = useSelector((state) => state.auth);
  const [hasMounted, setHasMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fetch distributor's logo
  useEffect(() => {
    const fetchDistributorLogo = async () => {
      if (!token) {
        setLogoUrl("/logo.jpeg");
        setIsLogoLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/distributer/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user?.logo?.url) {
            setLogoUrl(data.user.logo.url);
          } else {
            setLogoUrl("/logo.jpeg");
          }
        } else {
          setLogoUrl("/logo.jpeg");
        }
      } catch (error) {
        console.error("Failed to fetch distributor logo:", error);
        setLogoUrl("/logo.jpeg");
      } finally {
        setIsLogoLoading(false);
      }
    };

    fetchDistributorLogo();
  }, [token]);

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
          {isLogoLoading ? (
            <div
              className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${isExpanded || isHovered || isMobileOpen ? "h-10 w-36" : "h-8 w-8"}`}
            ></div>
          ) : (
            <>
              {isExpanded || isHovered || isMobileOpen ? (
                <div className="relative h-10 w-36">
                  <Image
                    fill
                    className="object-contain dark:hidden"
                    src={logoUrl}
                    alt="Logo"
                  />
                  <Image
                    fill
                    className="hidden object-contain dark:block"
                    src={logoUrl}
                    alt="Logo"
                  />
                </div>
              ) : (
                <div className="relative h-8 w-8">
                  <Image
                    fill
                    src={logoUrl}
                    alt="Logo"
                    className="object-contain"
                  />
                </div>
              )}
            </>
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

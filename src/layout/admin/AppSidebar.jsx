"use client";
import { useSidebar } from "@/context/SidebarContext";
import {
  MdDashboard, MdTableChart, MdAdd, MdComment, MdEvent, MdPerson, MdDescription, MdPieChart, MdWidgets, MdLogin, MdList, MdPageview, MdMenuBook, MdVideoLibrary,
  MdNotifications, MdAdminPanelSettings,
  MdLoop,
  MdLockReset
} from 'react-icons/md';
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon, HorizontaLDots } from "@/icons";
import { useSelector } from "react-redux";

const navItems = [
  {
    icon: <MdDashboard />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    name: "Patients",
    icon: <MdTableChart />,
    subItems: [{ name: "Patient Records", path: "/admin/patients", pro: false },{ name: "Create Patient Record", path: "/admin/patients/create-patient-record/step-1", pro: false },],
  },
  {
    icon: <MdList />,
    name: "Case Categories",
    path: "/admin/case-categories",
  },
  {
    name: "Events",
    icon: <MdEvent />,
    path: "/admin/events",
  },
  {
    icon: <MdNotifications />,
    name: "Notifications",
    path: "/admin/notifications",
  },
  {
    icon: <MdComment />,
    name: "View Comments",
    path: "/admin/view-comments",
  },
  {
    icon: <MdLoop />,
    name: "Manage Patient Progress",
    path: "/admin/patients/manage-status",
  },
  {
    icon: <MdPerson />,
    name: "Doctors",
    path: "/admin/doctors",
  },
  {
    icon: <MdLockReset />,
    name: "Change Doctor Password",
    path: "/admin/change-doctor-password",
  },
  {
    icon: <MdMenuBook />,
    name: "Educational Material",
    path: "/admin/educational-material",
  },
  {
    icon: <MdVideoLibrary />,
    name: "Tutorials",
    path: "/admin/tutorials",
  },
  {
    icon: <MdPerson />,
    name: "User Profile",
    path: "/admin/profile",
  },
  {
    icon: <MdDescription />,
    name: "Terms & Conditions",
    path: "/admin/terms-and-conditions",
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
  const { user, token } = useSelector((state) => state.auth) || {};
  const [hasPasswordAccess, setHasPasswordAccess] = useState(false);
  const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
  const isSuperAdmin = user && user.id && superAdminId && user.id === superAdminId;
  const unreadCount = useSelector((state) => state.notification.unreadCount);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setHasPasswordAccess(data.user.changeDoctorPasswordAccess);
        } else {
          setHasPasswordAccess(false);
        }
      } catch (error) {
        console.error("Failed to fetch access rights", error);
        setHasPasswordAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  // Dynamically add Admin dropdown for superadmin
  let tempNavItems = [...navItems];
  if (isSuperAdmin) {
    tempNavItems.splice(1, 0, {
      name: "Admin",
      icon: <MdAdminPanelSettings />,
      subItems: [
        { name: "Admin", path: "/admin/other-admins", pro: false },
        { name: "Create New Admin", path: "/admin/other-admins/create", pro: false },
      ],
    });
    // Insert 'Change Super Admin Password' after 'Change Doctor Password'
    const doctorPwdIdx = tempNavItems.findIndex(item => item.name === "Change Doctor Password");
    if (doctorPwdIdx !== -1) {
      tempNavItems.splice(doctorPwdIdx + 1, 0, {
        icon: <MdLockReset />,
        name: "Change Super Admin Password",
        path: "/admin/change-superadmin-password",
      });
    }
  }
  
  const dynamicNavItems = tempNavItems.filter(item => {
    if (item.name === "Change Doctor Password") {
      return hasPasswordAccess;
    }
    if (item.name === "Change Super Admin Password") {
      return isSuperAdmin;
    }
    return true;
  });

  const renderMenuItems = (
    navItems,
    menuType
  ) => (
    <ul className="flex flex-col gap-4">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group  ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={` ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className={`menu-item-text`}>{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200  ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`$${
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
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge `}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  const [openSubmenu, setOpenSubmenu] = useState({
    type: "main",
    index: 0,
  });
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  const isActive = useCallback((path) => path === pathname, [pathname]);

  useEffect(() => {
    // Check if the current path matches any submenu item
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? dynamicNavItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType,
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    // If no submenu item matches, close the open submenu
    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  useEffect(() => {
    // Set the height of the submenu items when the submenu is opened
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

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
              {renderMenuItems(dynamicNavItems, "main")}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
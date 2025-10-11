"use client";
import { useSidebar } from "@/context/SidebarContext";
import {
  MdDashboard,
  MdTableChart,
  MdAdd,
  MdComment,
  MdEvent,
  MdPerson,
  MdDescription,
  MdPieChart,
  MdWidgets,
  MdLogin,
  MdList,
  MdPageview,
  MdMenuBook,
  MdVideoLibrary,
  MdNotifications,
  MdAdminPanelSettings,
  MdLoop,
  MdLockReset,
  MdMoney,
  MdMoneyOffCsred,
  MdAttachMoney,
  MdManageAccounts,
} from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@/icons";
import { useSelector } from "react-redux";

const baseNavItems = [
  {
    icon: <MdDashboard />,
    name: "Dashboard",
    path: "/admin",
  },
  {
    name: "Patients",
    icon: <MdTableChart />,
    subItems: [
      { name: "Patient Records", path: "/admin/patients", pro: false },
      {
        name: "Create Patient Record",
        path: "/admin/patients/create-patient-record",
        pro: false,
      },
    ],
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
    name: "Patient Payments",
    icon: <MdAttachMoney />,
    subItems: [
      {
        name: "Update Case Amount",
        path: "/admin/update-patient-payments/case-amount",
        pro: false,
      },
      {
        name: "Update Patient Payments",
        path: "/admin/update-patient-payments",
        pro: false,
      },
    ],
  },
  {
    icon: <MdComment />,
    name: "View Comments",
    path: "/admin/view-comments",
  },
  {
    icon: <MdDescription />,
    name: "Production Comments",
    path: "/admin/special-comments",
  },
  // {
  //   icon: <MdLoop />,
  //   name: "Manage Patient Progress",
  //   path: "/admin/patients/manage-status",
  // },
  {
    name: "Doctors",
    icon: <MdPerson />,
    subItems: [
      { name: "View All Doctors", path: "/admin/doctors", pro: false },
      {
        name: "Suspend Account",
        path: "/admin/doctors/suspend-account",
        pro: false,
        requirePasswordAccess: true,
      },
      {
        name: "Delete Doctor",
        path: "/admin/doctors/delete-doctor",
        pro: false,
        requirePasswordAccess: true,
      },
    ],
  },
  {
    icon: <MdManageAccounts />,
    name: "Accounts Team",
    path: "/admin/accounts",
  },
  {
    name: "Planners",
    icon: <MdTableChart />,
    subItems: [
      {
        name: "Create A Planner",
        path: "/admin/planners/create-planner",
        pro: false,
      },
      { name: "View All Planners", path: "/admin/planners", pro: false },
      {
        name: "Assign Planner",
        path: "/admin/planners/assign-planner",
        pro: false,
      },
      {
        name: "Assign Deadline Time",
        path: "/admin/planners/deadline-time",
        pro: false,
        requirePlannerAccess: true,
      },
      {
        name: "Planner Report",
        path: "/admin/planners/planner-report",
        pro: false,
        requirePlannerAccess: true,
      },
    ],
  },
  {
    name: "Distributers",
    icon: <MdTableChart />,
    subItems: [
      {
        name: "Create A Distributer",
        path: "/admin/distributers/create-distributer",
        pro: false,
      },
      {
        name: "View All Distributers",
        path: "/admin/distributers",
        pro: false,
      },
      {
        name: "Assign Distributer",
        path: "/admin/distributers/assign-distributer",
        pro: false,
      },
    ],
  },
  {
    icon: <MdLockReset />,
    name: "Manage Passwords",
    path: "/admin/manage-passwords",
  },
  {
    icon: <MdDescription />,
    name: "Manage Terms & Conditions",
    path: "/admin/privacy-policies",
    requireDistributerAccess: true,
  },
  {
    icon: <MdPerson />,
    name: "User Profile",
    path: "/admin/profile",
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
];

const othersItems = [
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
  const unreadCount = useSelector((state) => state.notification.unreadCount);
  const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
  const isSuperAdmin =
    user && user.id && superAdminId && user.id === superAdminId;

  const [hasPasswordAccess, setHasPasswordAccess] = useState(false);
  const [hasDistributerAccess, setHasDistributerAccess] = useState(false);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(false);
  const [hasPriceUpdateAccess, setHasPriceUpdateAccess] = useState(false);
  const [hasAccountsAccess, setHasAccountsAccess] = useState(false);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.user) {
          setHasPasswordAccess(data.user.changeDoctorPasswordAccess);
          setHasDistributerAccess(data.user.distributerAccess);
          setHasPlannerAccess(data.user.plannerAccess);
          setHasPriceUpdateAccess(data.user.priceUpdateAccess);
          setHasAccountsAccess(data?.user?.addSalesPersonAccess);
        }
      } catch (err) {
        console.error("Failed to fetch access", err);
        setHasPasswordAccess(false);
        setHasDistributerAccess(false);
        setHasPlannerAccess(false);
        setHasPriceUpdateAccess(false);
        setHasAccountsAccess(false);
      }
    };
    fetchAccess();
  }, [token]);

  // Build dynamic nav items
  let tempNavItems = [...baseNavItems];

  if (!hasDistributerAccess) {
    tempNavItems = tempNavItems.filter((item) => item.name !== "Distributers");
  }
  if (!hasPlannerAccess) {
    tempNavItems = tempNavItems.filter((item) => item.name !== "Planners");
  }
  if (!hasPriceUpdateAccess) {
    tempNavItems = tempNavItems.filter(
      (item) => item.name !== "Patient Payments",
    );
  }
  if (!hasAccountsAccess) {
    tempNavItems = tempNavItems.filter((item) => item.name !== "Accounts Team");
  }

  if (isSuperAdmin) {
    tempNavItems.splice(1, 0, {
      name: "Admin",
      icon: <MdAdminPanelSettings />,
      subItems: [
        { name: "Admin", path: "/admin/other-admins", pro: false },
        {
          name: "Create New Admin",
          path: "/admin/other-admins/create",
          pro: false,
        },
      ],
    });
    const doctorPwdIdx = tempNavItems.findIndex(
      (item) => item.name === "Manage Passwords",
    );
    if (doctorPwdIdx !== -1) {
      tempNavItems.splice(doctorPwdIdx + 1, 0, {
        icon: <MdLockReset />,
        name: "Change Super Admin Password",
        path: "/admin/change-superadmin-password",
      });
    }
  }

  const dynamicNavItems = tempNavItems
    .filter((item) => {
      if (item.name === "Manage Passwords") return hasPasswordAccess;
      if (item.name === "Change Super Admin Password") return isSuperAdmin;
      if (item.requireDistributerAccess) return hasDistributerAccess;
      return true;
    })
    .map((item) => {
      // Filter sub-items based on access requirements
      if (item.subItems) {
        const filteredSubItems = item.subItems.filter((subItem) => {
          if (subItem.requirePlannerAccess) return hasPlannerAccess;
          if (subItem.requireDistributerAccess) return hasDistributerAccess;
          if (subItem.requirePasswordAccess) return hasPasswordAccess;
          return true;
        });

        // Special handling for Doctors menu - convert to single link if only one item
        if (item.name === "Doctors" && filteredSubItems.length === 1) {
          return {
            ...item,
            path: filteredSubItems[0].path,
            subItems: null,
          };
        }

        return { ...item, subItems: filteredSubItems };
      }
      return item;
    });

  // -------------------- UI state handlers below --------------------

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [subMenuHeight, setSubMenuHeight] = useState({});
  const subMenuRefs = useRef({});

  const isActive = useCallback((path) => path === pathname, [pathname]);

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? dynamicNavItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });
    if (!submenuMatched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prev) => ({
          ...prev,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index, menuType) => {
    setOpenSubmenu((prev) => {
      if (prev?.type === menuType && prev?.index === index) return null;
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (navItems, menuType) => (
    <ul className="flex flex-col gap-1">
      {navItems.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
              } ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}
            >
              <span
                className={`text-xl ${openSubmenu?.type === menuType && openSubmenu?.index === index ? "text-blue-600" : "text-gray-500"}`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="text-sm font-medium">{nav.name}</span>
                  <ChevronDownIcon
                    className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                      openSubmenu?.type === menuType &&
                      openSubmenu?.index === index
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </>
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                href={nav.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${
                  isActive(nav.path)
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                } ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}
              >
                <span
                  className={`relative text-xl ${isActive(nav.path) ? "text-white" : "text-gray-500"}`}
                >
                  {nav.icon}
                  {nav.name === "Notifications" && unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white subpixel-antialiased">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="text-sm font-medium">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1 ml-9 space-y-1 border-l border-gray-200 pl-3 dark:border-gray-700">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      href={subItem.path}
                      className={`block rounded-md px-3 py-2 text-sm transition-colors duration-200 ${
                        isActive(subItem.path)
                          ? "bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-blue-300"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        <span>{subItem.name}</span>
                        <span className="flex gap-1">
                          {subItem.new && (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-800 subpixel-antialiased dark:bg-green-900 dark:text-green-300">
                              NEW
                            </span>
                          )}
                          {subItem.pro && (
                            <span className="rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-800 subpixel-antialiased dark:bg-orange-900 dark:text-orange-300">
                              PRO
                            </span>
                          )}
                        </span>
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

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-4 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-700 dark:bg-slate-900 ${
        isExpanded || isMobileOpen
          ? "w-[280px]"
          : isHovered
            ? "w-[280px]"
            : "w-[70px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-6 ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}
      >
        <Link href="/" className="transition-all duration-200 hover:opacity-80">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="relative h-9 w-35">
              <Image
                fill
                src="/logo.jpeg"
                alt="Logo"
                className="object-contain"
              />
            </div>
          ) : (
            <div className="relative h-7 w-7">
              <Image
                fill
                src="/logo.jpeg"
                alt="Logo"
                className="rounded object-contain"
              />
            </div>
          )}
        </Link>
      </div>
      <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1">
          <div className="space-y-1">
            <div
              className={`mb-6 ${!isExpanded && !isHovered ? "flex justify-center" : ""}`}
            >
              {isExpanded || isHovered || isMobileOpen ? (
                <h2 className="text-xs font-semibold tracking-wide text-gray-500 uppercase subpixel-antialiased dark:text-gray-400">
                  Navigation
                </h2>
              ) : (
                <div className="h-px w-8 bg-gray-300 dark:bg-gray-600"></div>
              )}
            </div>
            {renderMenuItems(dynamicNavItems, "main")}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;

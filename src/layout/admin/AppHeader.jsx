"use client";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";

const AppHeader = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  // Add scroll effect for dynamic header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-99999 flex w-full transition-all duration-500 ease-out ${
        scrolled
          ? "border-b border-gray-200/50 bg-white/80 shadow-lg shadow-gray-900/5 backdrop-blur-xl dark:border-gray-700/50 dark:bg-gray-900/80"
          : "border-b border-gray-200/30 bg-gradient-to-r from-white via-gray-50/90 to-white dark:border-gray-700/30 dark:from-gray-900 dark:via-gray-800/90 dark:to-gray-900"
      } lg:border-b`}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-0 transition-opacity duration-700 hover:opacity-100 dark:from-blue-400/10 dark:via-purple-400/10 dark:to-pink-400/10"></div>

      <div className="relative flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-gray-200/50 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4 dark:border-gray-700/50">
          {/* Enhanced Toggle Button */}
          <button
            className="group relative z-99999 h-10 w-10 transform items-center justify-center rounded-xl border border-gray-200/60 bg-white/60 text-gray-600 backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:border-blue-300/50 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 lg:flex lg:h-11 lg:w-11 dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:border-blue-600/50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 dark:hover:shadow-blue-400/20"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 blur transition-opacity duration-300 group-hover:opacity-20"></div>

            <div className="relative transition-transform duration-300 group-hover:rotate-6">
              {isMobileOpen ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-all duration-300"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                    fill="currentColor"
                  />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="transition-all duration-300"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </div>
          </button>

          {/* Enhanced Logo */}
          <Link href="/" className="group lg:hidden">
            <div className="relative overflow-hidden rounded-lg p-1">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-0 blur transition-opacity duration-500 group-hover:opacity-100"></div>
              <Image
                width={154}
                height={32}
                className="relative z-10 transition-transform duration-300 group-hover:scale-105 dark:hidden"
                src="/logo.png"
                alt="Logo"
              />
              <Image
                width={154}
                height={32}
                className="relative z-10 hidden transition-transform duration-300 group-hover:scale-105 dark:block"
                src="/logo.png"
                alt="Logo"
              />
            </div>
          </Link>

          {/* Enhanced Menu Button */}
          <button
            onClick={toggleApplicationMenu}
            className="group relative z-99999 flex h-10 w-10 transform items-center justify-center rounded-xl border border-gray-200/60 bg-white/60 text-gray-700 backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:border-violet-300/50 hover:bg-gradient-to-br hover:from-violet-50 hover:to-indigo-50 hover:shadow-lg hover:shadow-violet-500/20 active:scale-95 lg:hidden dark:border-gray-700/60 dark:bg-gray-800/60 dark:text-gray-300 dark:hover:border-violet-600/50 dark:hover:from-violet-900/20 dark:hover:to-indigo-900/20 dark:hover:shadow-violet-400/20"
          >
            {/* Pulse effect */}
            <div className="absolute inset-0 animate-pulse rounded-xl bg-gradient-to-r from-violet-400 to-indigo-400 opacity-0 transition-opacity duration-500 group-hover:opacity-20"></div>

            <div className="relative transition-transform duration-300 group-hover:rotate-12">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-all duration-300"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </button>
        </div>

        {/* Enhanced Controls Section */}
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } w-full items-center justify-between gap-4 border-t border-gray-200/50 bg-white/40 px-5 py-4 shadow-lg shadow-gray-900/5 backdrop-blur-xl lg:flex lg:justify-end lg:border-t-0 lg:bg-transparent lg:px-0 lg:shadow-none lg:backdrop-blur-none dark:border-gray-700/50 dark:bg-gray-900/40`}
        >
          {/* Enhanced Controls Group */}
          <div className="2xsm:gap-4 flex items-center gap-3">
            {/* Wrapper with subtle animation */}
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200/50 bg-white/60 p-1 backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/60">
              {/* Language Switcher */}
              <LanguageSwitcher />
              <div className="transform transition-transform duration-300 hover:scale-110">
                <ThemeToggleButton />
              </div>
              <div className="h-6 w-px bg-gray-300/50 dark:bg-gray-600/50"></div>
              <div className="transform transition-transform duration-300 hover:scale-110">
                <NotificationDropdown />
              </div>
            </div>
          </div>

          {/* Enhanced User Area */}
          <div className="group relative">
            {/* Subtle glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-0 blur transition-opacity duration-500 group-hover:opacity-100"></div>
            <div className="relative transform transition-transform duration-300 hover:scale-105">
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Subtle bottom gradient line */}
      <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
    </header>
  );
};

export default AppHeader;
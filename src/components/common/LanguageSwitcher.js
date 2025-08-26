"use client";

import React, { useEffect, useRef, useState } from "react";
import { parseCookies, setCookie } from "nookies";

const COOKIE_NAME = "googtrans";

const LanguageSwitcher = () => {
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [languageConfig, setLanguageConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const checkConfig = () => {
      if (
        typeof window !== "undefined" &&
        window.__GOOGLE_TRANSLATION_CONFIG__
      ) {
        const cookies = parseCookies();
        const existingLanguageCookieValue = cookies[COOKIE_NAME];

        let languageValue =
          window.__GOOGLE_TRANSLATION_CONFIG__.defaultLanguage;

        if (existingLanguageCookieValue) {
          const sp = existingLanguageCookieValue.split("/");
          if (sp.length > 2) {
            languageValue = sp[2];
          }
        }

        setCurrentLanguage(languageValue);
        setLanguageConfig(window.__GOOGLE_TRANSLATION_CONFIG__);
        setIsLoading(false);
      } else {
        setTimeout(checkConfig, 100);
      }
    };

    checkConfig();
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle ESC key to close dropdown
  useEffect(() => {
    function handleEscapeKey(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    } else {
      document.removeEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen]);

  if (isLoading || !currentLanguage || !languageConfig) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200"></div>
      </div>
    );
  }

  const switchLanguage = (langCode) => {
    if (langCode === currentLanguage) return;

    setCookie(null, COOKIE_NAME, `/auto/${langCode}`, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    setCurrentLanguage(langCode);
    setIsOpen(false); // Close dropdown before reload
    window.location.reload();
  };

  const getCurrentLanguageData = () => {
    return (
      languageConfig.languages.find((lang) => lang.name === currentLanguage) ||
      languageConfig.languages.find(
        (lang) => lang.name === languageConfig.defaultLanguage,
      )
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        title="Translate page"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="text-lg">{getCurrentLanguageData()?.flag}</span>
        <span className="hidden sm:inline">
          {getCurrentLanguageData()?.title || "Translate"}
        </span>
        <svg
          className="h-4 w-4 transition-transform duration-200"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-[99999] mt-5 w-64 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-3 dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Select Language
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Translate the entire page
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {languageConfig.languages.map((language) => (
              <button
                key={language.name}
                onClick={() => switchLanguage(language.name)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentLanguage === language.name
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.title}</span>
                {currentLanguage === language.name && (
                  <svg
                    className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;

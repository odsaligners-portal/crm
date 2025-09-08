"use client";
import React from "react";
import {
  MdCheckCircle,
  MdEmail,
  MdAccessTime,
  MdSecurity,
} from "react-icons/md";

export default function RegistrationSuccessModal({
  isOpen,
  onClose,
  userData,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl scale-100 transform opacity-100 transition-all duration-300">
        {/* Outer glow effect */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 blur-xl"></div>

        {/* Main modal content */}
        <div className="relative rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/95">
          {/* Success Icon */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
              <MdCheckCircle className="h-12 w-12 text-white" />
            </div>
            <h2 className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
              Registration Successful!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome to our platform, Dr. {userData?.name}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Account Details */}
            <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-gray-700 dark:from-gray-700/50 dark:to-gray-600/50">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-800 dark:text-gray-200">
                <MdEmail className="mr-2 h-5 w-5 text-blue-600" />
                Your Account Details
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Name:
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">
                    Dr. {userData?.name}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Email:
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">
                    {userData?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Activation Notice */}
            <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-6 dark:border-amber-700/50 dark:from-amber-900/20 dark:to-yellow-900/20">
              <h3 className="mb-3 flex items-center text-lg font-semibold text-amber-800 dark:text-amber-200">
                <MdAccessTime className="mr-2 h-5 w-5 text-amber-600" />
                Account Activation
              </h3>
              <p className="text-amber-700 dark:text-amber-300">
                <strong>Thank you for your registration!</strong> Your account
                will be activated within 24 hours. You will receive another
                email once your account is ready to use.
              </p>
            </div>

            {/* Features Preview */}
            {/* <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 p-6 dark:border-gray-700 dark:from-purple-900/20 dark:to-pink-900/20">
              <h3 className="mb-4 text-lg font-semibold text-purple-800 dark:text-purple-200">
                🚀 What You Can Do
              </h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Patient Management
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Case Tracking
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    File Management
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Team Communication
                  </span>
                </div>
              </div>
            </div> */}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
            >
              Got it, Thanks!
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              For any queries, please write to us at{" "}
              <a
                href="mailto:info@odsaligners.com"
                className="text-blue-500 hover:text-blue-600"
              >
                info@odsaligners.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

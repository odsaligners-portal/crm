"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { setCredentials } from "@/store/features/auth/authSlice";
import {
  setNotifications,
  setNotificationUserId,
} from "@/store/features/notificationSlice";
import { setLoading } from "@/store/features/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function SignInForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.ui);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    distributer: isChecked ? true : false,
  });

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const payload = { ...formData };
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Login failed");
        return;
      }

      // Update Redux store with user data
      dispatch(
        setCredentials({
          user: data.user,
          token: data.token,
          role: data.user.role,
        }),
      );

      // Fetch notifications and set in Redux
      try {
        const notifRes = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${data.token}` },
        });

        if (notifRes.ok) {
          const notifData = await notifRes.json();

          const userId = data.user?.id;
          localStorage.setItem("userId", userId || "");

          if (userId) {
            dispatch(setNotificationUserId(userId));
          }

          dispatch(setNotifications(notifData.notifications || []));
        }
      } catch (e) {
        console.error("Failed to fetch notifications:", e);
      }

      toast.success("Successfully logged in!");

      // Role-based redirection
      const userRole = data.user.role;
      if (userRole === "admin") {
        router.push("/admin");
      } else if (userRole === "doctor") {
        router.push("/doctor");
      } else if (userRole === "planner") {
        router.push("/planner");
      } else if (userRole === "distributer") {
        router.push("/distributer");
      } else {
        toast.error("Invalid User Role");
        router.push("/signin"); // Default redirect
      }
    } catch (error) {
      // Error is already handled by fetchWithError
      console.error("Login error:", error);
      toast.error("An error occurred during login.");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="relative min-h-screen w-[500px] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/5">
      {/* Animated Background Elements */}
      <div className="pointer-events-none fixed inset-0">
        {/* Primary gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/5"></div>

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl"></div>
        <div className="animation-delay-2000 absolute right-1/4 bottom-1/4 h-80 w-80 animate-pulse rounded-full bg-gradient-to-r from-pink-400/15 to-orange-400/15 blur-3xl"></div>
        <div className="animation-delay-4000 absolute top-1/2 right-1/3 h-64 w-64 animate-pulse rounded-full bg-gradient-to-r from-green-400/10 to-teal-400/10 blur-3xl"></div>

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 animate-ping rounded-full bg-blue-400/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div
          className={`w-full transform transition-all duration-1000 ease-out ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* Enhanced Card Container */}
          <div className="group relative">
            {/* Outer glow effect */}
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100"></div>

            {/* Main card */}
            <div className="relative rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl shadow-blue-500/10 backdrop-blur-xl dark:border-gray-700/30 dark:bg-gray-800/80">
              {/* Logo/Brand Section */}
              <div className="mb-8 text-center">
                <h1 className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-3xl font-bold text-transparent subpixel-antialiased dark:from-white dark:via-blue-200 dark:to-purple-200">
                  Welcome Back
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2">
                {/* Email Field */}
                <div className="group/field space-y-2">
                  <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <MdEmail className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                    </div>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="pl-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-gray-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="group/field space-y-2">
                  <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <MdLock className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                    </div>
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="pr-12 pl-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors duration-200 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {showPassword ? (
                        <MdVisibilityOff className="h-5 w-5" />
                      ) : (
                        <MdVisibility className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Distributer Checkbox */}
                <div className="flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <Checkbox
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    checked={isChecked}
                    onChange={(checked) => {
                      setIsChecked(checked);
                      setFormData((prev) => ({
                        ...prev,
                        distributer: checked,
                      }));
                    }}
                    disabled={isLoading}
                  />
                  <Label className="cursor-pointer text-sm mb-0 text-gray-700 select-none dark:text-gray-300">
                    Sign in as a Distributer
                  </Label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover:translate-x-[100%]"></div>
                  <span className="relative font-semibold">
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
                  or
                </span>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
              </div>

              {/* Register Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{" "}
                  <Link
                    href="/register"
                    style={{ textDecoration: "none" }}
                    className="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Create one here
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © 2025. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

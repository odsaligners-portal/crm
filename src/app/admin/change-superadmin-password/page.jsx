"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";

export default function ChangeSuperAdminPasswordPage() {
  const { user, token } = useSelector((state) => state.auth) || {};
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const router = useRouter();
  const dispatch = useDispatch();
  const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;

  if (!user || user.id !== superAdminId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-xl text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-700 dark:text-gray-300">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleShow = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return toast.error("All fields are required.");
    }
    if (form.newPassword.length < 8) {
      return toast.error("New password must be at least 8 characters long.");
    }
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("New passwords do not match.");
    }
    dispatch(setLoading(true));
    try {
      await fetchWithError("/api/admin/superadmin/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      toast.success("Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="p-5 lg:p-10 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white/95 dark:bg-gray-900/95 rounded-2xl shadow-2xl p-10 border border-blue-200 dark:border-gray-800 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-blue-200 to-blue-400 dark:from-blue-900 dark:to-blue-700 rounded-full opacity-30 blur-2xl z-0 animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-purple-200 to-blue-300 dark:from-blue-800 dark:to-purple-900 rounded-full opacity-30 blur-2xl z-0 animate-pulse" />
        <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight mb-2 relative z-10 drop-shadow-lg">Change Super Admin Password</h1>
        <p className="mb-8 text-gray-500 dark:text-gray-400 relative z-10">Update your super admin account password below.</p>
        <div className="mb-6 relative z-10">
          <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Current Password</label>
          <div className="relative flex items-center">
            <input
              type={show.current ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 text-base pr-12 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => handleShow("current")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none">
              {show.current ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>
        <div className="mb-6 relative z-10">
          <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">New Password</label>
          <div className="relative flex items-center">
            <input
              type={show.new ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 text-base pr-12 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => handleShow("new")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none">
              {show.new ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>
        <div className="mb-10 relative z-10">
          <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-1">Confirm New Password</label>
          <div className="relative flex items-center">
            <input
              type={show.confirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-800 text-base pr-12 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => handleShow("confirm")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-300 focus:outline-none">
              {show.confirm ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-150 text-lg tracking-wide relative z-10"
        >
          Update Password
        </button>
      </form>
    </div>
  );
} 
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
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const router = useRouter();
  const dispatch = useDispatch();
  const superAdminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;

  if (!user || user.id !== superAdminId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-xl bg-white p-8 text-center shadow-xl dark:bg-gray-900">
          <h2 className="mb-2 text-2xl font-semibold text-red-600">
            Access Denied
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            You do not have permission to view this page.
          </p>
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
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      toast.success("Password updated successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5 lg:p-10 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-blue-200 bg-white/95 p-10 shadow-2xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/95"
      >
        <div className="absolute -top-10 -right-10 z-0 h-32 w-32 animate-pulse rounded-full bg-gradient-to-br from-blue-200 to-blue-400 opacity-30 blur-2xl dark:from-blue-900 dark:to-blue-700" />
        <div className="absolute -bottom-10 -left-10 z-0 h-32 w-32 animate-pulse rounded-full bg-gradient-to-tr from-purple-200 to-blue-300 opacity-30 blur-2xl dark:from-blue-800 dark:to-purple-900" />
        <h1 className="relative z-10 mb-2 text-3xl font-extrabold tracking-tight text-blue-800 drop-shadow-lg dark:text-white/90">
          Change Super Admin Password
        </h1>
        <p className="relative z-10 mb-8 text-gray-500 dark:text-gray-400">
          Update your super admin account password below.
        </p>
        <div className="relative z-10 mb-6">
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
            Current Password
          </label>
          <div className="relative flex items-center">
            <input
              type={show.current ? "text" : "password"}
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 pr-12 text-base shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => handleShow("current")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none dark:hover:text-blue-300"
            >
              {show.current ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>
        <div className="relative z-10 mb-6">
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              type={show.new ? "text" : "password"}
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 pr-12 text-base shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => handleShow("new")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none dark:hover:text-blue-300"
            >
              {show.new ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>
        <div className="relative z-10 mb-10">
          <label className="mb-1 block font-semibold text-gray-700 dark:text-gray-300">
            Confirm New Password
          </label>
          <div className="relative flex items-center">
            <input
              type={show.confirm ? "text" : "password"}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 pr-12 text-base shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400 dark:border-gray-700 dark:bg-gray-800"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => handleShow("confirm")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-blue-600 focus:outline-none dark:hover:text-blue-300"
            >
              {show.confirm ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="relative z-10 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-lg font-semibold tracking-wide text-white shadow-lg transition-all duration-150 hover:from-blue-700 hover:to-blue-600"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}

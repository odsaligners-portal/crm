"use client";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

export default function CreatePlanner() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
  });
  const [loading, setLoading] = useState(false);
  const [hasPlannerAccess, setHasPlannerAccess] = useState(false);
  const { token } = useSelector((state) => state.auth) || {};

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasPlannerAccess(false);
        return;
      }

      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasPlannerAccess(!!data.user?.plannerAccess);
      } catch (err) {
        setHasPlannerAccess(false);
      } finally {
      }
    };
    fetchAccess();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/other-admins/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, role: "planner" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create planner");
      toast.success("Planner created successfully!");
      setForm({ name: "", email: "", password: "", mobile: "" });
    } catch (err) {
      toast.error(err.message || "Failed to create planner");
    } finally {
      setLoading(false);
    }
  };

  if (hasPlannerAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to View This Page.
        </span>
      </div>
    );
  }
  if (hasPlannerAccess === null) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 max-w-lg rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">
      <h2 className="mb-6 text-2xl font-semibold text-blue-800 dark:text-white">
        Create a New Planner
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Phone Number"
          name="mobile"
          type="tel"
          value={form.mobile}
          onChange={handleChange}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Planner"}
        </Button>
      </form>
    </div>
  );
}

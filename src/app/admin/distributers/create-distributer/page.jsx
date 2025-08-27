"use client";
import React, { useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import { countriesData } from "@/utils/countries";
import Label from "@/components/form/Label";
import { useSelector } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";

export default function CreateDistributer() {
  const { token } = useSelector((state) => state.auth);
  const [hasDistributerAccess, setHasDistributerAccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    city: "",
    state: "",
    country: "",
    password: "",
    access: "view",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      const fetchAccess = async () => {
        if (!token) {
          setHasDistributerAccess(false);
          return;
        }
        try {
          const data = await fetchWithError("/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
  
          setHasDistributerAccess(data.user?.distributerAccess);
        } catch (err) {
          setHasDistributerAccess(false);
        }
      };
      fetchAccess();
    }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/distributers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to create distributer");
      toast.success("Distributer created successfully!");
      setForm({
        name: "",
        email: "",
        mobile: "",
        city: "",
        state: "",
        country: "",
        password: "",
        access: "view",
      });
    } catch (err) {
      toast.error(err.message || "Failed to create distributer");
    } finally {
      setLoading(false);
    }
  };

  const countries = Object.keys(countriesData);

  if (hasDistributerAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-bold text-red-600 dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to View This Page.
        </span>
      </div>
    );
  }
  if (hasDistributerAccess === null) {
    return null;
  }

  return (
    <div className="mx-auto mt-8 max-w-[75%] rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">
      <h2 className="mb-6 text-2xl font-bold text-blue-800 dark:text-white">
        Create a New Distributer
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input
              name="mobile"
              type="tel"
              value={form.mobile}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label>Country</Label>
            <select
              name="country"
              value={form.country}
              onChange={(e) => {
                handleChange(e);
                setForm((f) => ({ ...f, state: "" }));
              }}
              required
              className="w-full appearance-none rounded-lg border border-blue-200 bg-white px-4 py-2 pr-8 text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>State</Label>
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              required
              disabled={!form.country}
              className="w-full appearance-none rounded-lg border border-blue-200 bg-white px-4 py-2 pr-8 text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:bg-gray-100"
            >
              <option value="">Select State</option>
              {form.country &&
                countriesData[form.country] &&
                countriesData[form.country].map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <Label>City</Label>
            <Input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Access Level</Label>
            <select
              name="access"
              value={form.access}
              onChange={handleChange}
              required
              className="w-full appearance-none rounded-lg border border-blue-200 bg-white px-4 py-2 pr-8 text-gray-800 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="view">View Access</option>
              <option value="full">Full Access</option>
            </select>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Distributer"}
        </Button>
      </form>
    </div>
  );
}

"use client";
import React, { useEffect, useState } from "react";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";
import { countriesData } from "@/utils/countries";
import Label from "@/components/form/Label";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useDropzone } from "react-dropzone";
import { storage } from "@/utils/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { setLoading as setGlobalLoading } from "@/store/features/uiSlice";
import Image from "next/image";

export default function CreateDistributer() {
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
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
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFileKey, setLogoFileKey] = useState("");
  const [logoUploadedAt, setLogoUploadedAt] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setIsUploading(true);
    dispatch(setGlobalLoading(true));
    const fileKey = `distributers/logos/${file.name}-${Date.now()}`;
    const storageRef = ref(storage, fileKey);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Progress tracking can be added here if needed
      },
      (error) => {
        setIsUploading(false);
        dispatch(setGlobalLoading(false));
        toast.error("Upload failed: " + error.message);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setLogoUrl(url);
          setLogoFileKey(fileKey);
          setLogoUploadedAt(new Date().toISOString());
          toast.success("Logo uploaded successfully!");
        } catch (error) {
          toast.error("Failed to get download URL.");
        } finally {
          setIsUploading(false);
          dispatch(setGlobalLoading(false));
        }
      },
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    maxSize: 2 * 1024 * 1024, // 2MB limit
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        if (rejection.file.size > 2 * 1024 * 1024) {
          toast.error("File size must be less than 2MB");
        } else {
          toast.error("Invalid file type. Please upload an image.");
        }
      });
    },
  });

  const handleRemoveLogo = async () => {
    if (logoFileKey) {
      dispatch(setGlobalLoading(true));
      try {
        const imageRef = ref(storage, logoFileKey);
        await deleteObject(imageRef);
        toast.success("Logo deleted successfully.");
        setLogoUrl("");
        setLogoFileKey("");
        setLogoUploadedAt(null);
      } catch (err) {
        toast.error("Failed to delete logo.");
      } finally {
        dispatch(setGlobalLoading(false));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = {
        ...form,
        logo: {
          url: logoUrl,
          fileKey: logoFileKey,
          uploadedAt: logoUploadedAt,
        },
      };

      const res = await fetch("/api/admin/distributers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
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
      setLogoUrl("");
      setLogoFileKey("");
      setLogoUploadedAt(null);
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
        <span className="text-lg font-semibold text-red-600 subpixel-antialiased dark:text-red-400">
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
      <h2 className="mb-6 text-2xl font-semibold text-blue-800 subpixel-antialiased dark:text-white">
        Create a New Distributer
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload Section */}
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 dark:border-blue-800 dark:bg-blue-900/20">
          <Label className="mb-3 text-lg font-semibold">Distributer Logo</Label>
          {!logoUrl ? (
            <div
              {...getRootProps()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-blue-500"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center justify-center gap-3">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {isUploading ? (
                  <p className="text-sm text-blue-600">Uploading...</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {isDragActive
                        ? "Drop the logo here..."
                        : "Drag and drop logo here, or click to select"}
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
              <div className="relative h-16 w-24 overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-600">
                <Image
                  src={logoUrl}
                  alt="Distributer Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  Logo uploaded successfully
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {logoUploadedAt && new Date(logoUploadedAt).toLocaleString()}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={handleRemoveLogo}
                className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Remove
              </Button>
            </div>
          )}
        </div>

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

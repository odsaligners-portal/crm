"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/store";
import { setCredentials } from "@/store/features/auth/authSlice";
import { toast } from "react-toastify";
import { fetchWithError } from "@/utils/apiErrorHandler";
import Select from "react-select";
import { Country, State } from "country-state-city";
import { useDropzone } from "react-dropzone";
import { storage } from "@/utils/firebase";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { setLoading } from "@/store/features/uiSlice";
import { useSelector } from "react-redux";
import {
  MdEmail,
  MdLock,
  MdPerson,
  MdPhone,
  MdLocationOn,
  MdWork,
  MdVisibility,
  MdVisibilityOff,
} from "react-icons/md";
import OTPVerificationModal from "./OTPVerificationModal";

export default function SignUpForm({
  heading = "Registration",
  description = "Enter your details to create an account",
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useSelector((state) => state.ui);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    gender: "",
    country: null,
    state: null,
    city: "",
    experience: "",
    doctorType: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFileKey, setPhotoFileKey] = useState("");
  const [photoUploadedAt, setPhotoUploadedAt] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        value: country.isoCode,
        label: country.name,
      })),
    [],
  );

  const stateOptions = useMemo(() => {
    if (formData.country) {
      return State.getStatesOfCountry(formData.country.value).map((state) => ({
        value: state.isoCode,
        label: state.name,
      }));
    }
    return [];
  }, [formData.country]);

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const doctorTypeOptions = [
    { value: "Orthodontist", label: "Orthodontist" },
    { value: "General Dentist", label: "General Dentist" },
    { value: "Pediatric Dentist", label: "Pediatric Dentist" },
    { value: "Oral Surgeon", label: "Oral Surgeon" },
    { value: "Periodontist", label: "Periodontist" },
    { value: "Endodontist", label: "Endodontist" },
    { value: "Prosthodontist", label: "Prosthodontist" },
    { value: "Other", label: "Other" },
  ];

  const experienceOptions = [
    { value: "0-2 years", label: "0-2 years" },
    { value: "3-5 years", label: "3-5 years" },
    { value: "6-10 years", label: "6-10 years" },
    { value: "11-15 years", label: "11-15 years" },
    { value: "16-20 years", label: "16-20 years" },
    { value: "20+ years", label: "20+ years" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset state when country changes
      ...(name === "country" && { state: null }),
    }));
  };

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    dispatch(setLoading(true));
    const fileKey = `users/${file.name}-${Date.now()}`;
    const storageRef = ref(storage, fileKey);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // progress can be implemented later if needed
      },
      (error) => {
        dispatch(setLoading(false));
        alert("Upload failed: " + error.message);
      },
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setPhotoUrl(url);
          setPhotoFileKey(fileKey);
          setPhotoUploadedAt(new Date().toISOString());
        } catch (error) {
          toast.error("Failed to get download URL.");
        } finally {
          dispatch(setLoading(false));
        }
      },
    );
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleRemovePhoto = async () => {
    if (photoFileKey) {
      dispatch(setLoading(true));
      try {
        const imageRef = ref(storage, photoFileKey);
        await deleteObject(imageRef);
        toast.success("Profile image deleted from storage.");
        setPhotoUrl("");
        setPhotoFileKey("");
        setPhotoUploadedAt(null);
      } catch (err) {
        toast.error("Failed to delete image from storage.");
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isChecked) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const payload = {
        ...formData,
        country: formData.country?.label,
        state: formData.state?.label,
      };
      if (photoUrl && photoFileKey && photoUploadedAt) {
        payload.profilePicture = {
          url: photoUrl,
          fileKey: photoFileKey,
          uploadedAt: photoUploadedAt,
        };
      }
      delete payload.confirmPassword;

      const data = await fetchWithError("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Check if OTP verification is required
      if (data.requiresVerification) {
        setPendingEmail(data.email);
        setShowOTPModal(true);
        toast.success(
          "OTP sent to your email. Please verify to complete registration.",
        );
      } else {
        // Update Redux store with user data
        dispatch(
          setCredentials({
            user: data.user,
            token: data.token,
            role: data.user.role,
          }),
        );

        toast.success("Successfully registered!");
        router.push("/");
      }
    } catch (error) {
      // Error is already handled by fetchWithError
    }
  };

  const handleOTPVerify = async (otp) => {
    setIsVerifying(true);
    try {
      const data = await fetchWithError("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingEmail,
          otp: otp,
        }),
      });

      // Update Redux store with user data
      dispatch(
        setCredentials({
          user: data.user,
          token: data.token,
          role: data.user.role,
        }),
      );

      setShowOTPModal(false);
      toast.success("Email verified successfully! Welcome to our platform.");

      // Redirect to doctor dashboard (registration is for doctors only)
      router.push("/doctor");
    } catch (error) {
      // Error is already handled by fetchWithError
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await fetchWithError("/api/auth/verify-otp", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: pendingEmail,
        }),
      });
    } catch (error) {
      // Error is already handled by fetchWithError
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleCloseOTPModal = () => {
    setShowOTPModal(false);
    setPendingEmail("");
  };

  return (
    <div className="relative min-h-screen w-[900px] overflow-scroll bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/5">
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
                  {heading}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Profile Picture */}
                <div className="group/field space-y-2">
                  <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                    Profile Picture
                  </Label>
                  <div
                    {...getRootProps()}
                    className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-all duration-200 ${
                      isDragActive
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 bg-white/50 dark:border-gray-600 dark:bg-gray-700/50"
                    } hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10`}
                  >
                    <input {...getInputProps()} />
                    {photoUrl ? (
                      <div className="relative mb-2">
                        <img
                          src={photoUrl}
                          alt="Profile Preview"
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-blue-200 dark:ring-blue-700"
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute top-0 right-0 rounded-full bg-white p-1 shadow-lg transition-colors duration-200 hover:bg-red-100 dark:bg-gray-800 dark:hover:bg-red-900/20"
                          style={{ transform: "translate(40%, -40%)" }}
                          aria-label="Remove profile image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-red-600 dark:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="text-center text-gray-500 dark:text-gray-400">
                        Drop an image here, or click to select
                      </span>
                    )}
                  </div>
                </div>

                {/* Name and Email */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Full Name<span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MdPerson className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                      </div>
                      <Input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Email Address<span className="text-red-500">*</span>
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
                </div>

                {/* Mobile and Gender */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Mobile Number<span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MdPhone className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                      </div>
                      <Input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        placeholder="Enter your mobile number"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Gender<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      options={genderOptions}
                      value={genderOptions.find(
                        (option) => option.value === formData.gender,
                      )}
                      onChange={(option) =>
                        handleSelectChange("gender", option?.value)
                      }
                      placeholder="Select gender"
                      className="w-full"
                      classNamePrefix="select"
                      isSearchable={false}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#9ca3af",
                          },
                        }),
                      }}
                    />
                  </div>
                </div>

                {/* Country and State */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Country<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      options={countryOptions}
                      value={formData.country}
                      onChange={(option) =>
                        handleSelectChange("country", option)
                      }
                      placeholder="Select country"
                      className="w-full"
                      classNamePrefix="select"
                      isSearchable={true}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#9ca3af",
                          },
                        }),
                      }}
                    />
                  </div>

                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      State/Province<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      options={stateOptions}
                      value={formData.state}
                      onChange={(option) => handleSelectChange("state", option)}
                      placeholder="Select state"
                      className="w-full"
                      classNamePrefix="select"
                      isSearchable={true}
                      isDisabled={!formData.country}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#9ca3af",
                          },
                        }),
                      }}
                    />
                  </div>
                </div>

                {/* City and Experience */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      City<span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MdLocationOn className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                      </div>
                      <Input
                        type="text"
                        id="city"
                        name="city"
                        placeholder="Enter your city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Years of Experience<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      options={experienceOptions}
                      value={experienceOptions.find(
                        (option) => option.value === formData.experience,
                      )}
                      onChange={(option) =>
                        handleSelectChange("experience", option?.value)
                      }
                      placeholder="Select experience"
                      className="w-full"
                      classNamePrefix="select"
                      isSearchable={false}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#9ca3af",
                          },
                        }),
                      }}
                    />
                  </div>
                </div>

                {/* Doctor Type and Address */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Type of Doctor<span className="text-red-500">*</span>
                    </Label>
                    <Select
                      options={doctorTypeOptions}
                      value={doctorTypeOptions.find(
                        (option) => option.value === formData.doctorType,
                      )}
                      onChange={(option) =>
                        handleSelectChange("doctorType", option?.value)
                      }
                      placeholder="Select doctor type"
                      className="w-full"
                      classNamePrefix="select"
                      isSearchable={true}
                      styles={{
                        control: (provided, state) => ({
                          ...provided,
                          borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
                          boxShadow: state.isFocused
                            ? "0 0 0 2px rgba(59, 130, 246, 0.2)"
                            : "none",
                          "&:hover": {
                            borderColor: "#9ca3af",
                          },
                        }),
                      }}
                    />
                  </div>

                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Address<span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MdLocationOn className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                      </div>
                      <Input
                        type="text"
                        id="address"
                        name="address"
                        placeholder="Enter your address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Password and Confirm Password */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Password<span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MdLock className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                      </div>
                      <Input
                        placeholder="Create a password"
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

                  <div className="group/field space-y-2">
                    <Label className="text-sm font-medium text-gray-700 transition-colors duration-200 group-hover/field:text-blue-600 dark:text-gray-300">
                      Confirm Password<span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <MdLock className="h-5 w-5 text-gray-400 transition-colors duration-200 group-hover/field:text-blue-500" />
                      </div>
                      <Input
                        placeholder="Confirm password"
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-center space-x-3 rounded-lg p-3 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <Checkbox
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    checked={isChecked}
                    onChange={setIsChecked}
                    disabled={isLoading}
                  />
                  <Label className="mb-0 cursor-pointer text-sm text-gray-700 select-none dark:text-gray-300">
                    By creating an account means you agree to the{" "}
                    <Link
                      href="/terms"
                      className="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Terms and Conditions
                    </Link>
                    , and our{" "}
                    <Link
                      href="/privacy"
                      className="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isChecked || isLoading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-1000 group-hover:translate-x-[100%]"></div>
                  <span className="relative font-semibold">
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Creating Account...</span>
                      </div>
                    ) : (
                      "Create Account"
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

              {/* Sign In Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/signin"
                    style={{ textDecoration: "none" }}
                    className="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Sign in here
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

      {/* OTP Verification Modal */}
      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={handleCloseOTPModal}
        onVerify={handleOTPVerify}
        onResend={handleResendOTP}
        email={pendingEmail}
        isLoading={isVerifying}
      />
    </div>
  );
}

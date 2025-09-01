"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useMemo } from "react";
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

export default function SignUpForm({
  heading = "Registration",
  description = "Enter your details to create an account",
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading } = useSelector((state) => state.ui);
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
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
        console.error("Error deleting image from Firebase: ", err);
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

      // Update Redux store with user data
      dispatch(
        setCredentials({
          user: data.user,
          token: data.token,
          role: data.user.role,
        }),
      );

      toast.success("Successfully registered!");
      router.push("/"); // Redirect to dashboard after successful registration
    } catch (error) {
      // Error is already handled by fetchWithError
      console.error("Registration error:", error);
    }
  };

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center bg-cover bg-fixed bg-center"
      // style={{ backgroundImage: "url(/materials/bg-signin.jpg)" }}
    >
      <div className="mx-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white/60 p-4 px-8 shadow-2xl backdrop-blur-xs dark:bg-gray-900/60">
        <div className="mb-2">
          <h1 className="text-title-sm sm:text-title-md mb-2 text-center font-semibold text-gray-800 subpixel-antialiased dark:text-white/90">
            {heading}
          </h1>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4">
            {/* <!-- Profile Picture --> */}
            <div>
              <Label>Profile Picture</Label>
              <div
                {...getRootProps()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition ${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white dark:bg-gray-800"}`}
              >
                <input {...getInputProps()} />
                {photoUrl ? (
                  <div className="relative mb-2">
                    <img
                      src={photoUrl}
                      alt="Profile Preview"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="bg-opacity-80 absolute top-0 right-0 rounded-full bg-white p-1 shadow hover:bg-red-100"
                      style={{ transform: "translate(40%, -40%)" }}
                      aria-label="Remove profile image"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-red-600"
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
                  <span className="text-gray-500 dark:text-gray-400">
                    Drop an image here, or click to select
                  </span>
                )}
              </div>
            </div>

            {/* Name and Email in one row */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label>
                  Full Name<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex-1">
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Mobile and Gender in one row */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label>
                  Mobile Number<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  placeholder="Enter your mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex-1">
                <Label>
                  Gender<span className="text-error-500">*</span>
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
                />
              </div>
            </div>

            {/* Country and State in one row */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label>
                  Country<span className="text-error-500">*</span>
                </Label>
                <Select
                  options={countryOptions}
                  value={formData.country}
                  onChange={(option) => handleSelectChange("country", option)}
                  placeholder="Select country"
                  className="w-full"
                  classNamePrefix="select"
                  isSearchable={true}
                />
              </div>
              <div className="flex-1">
                <Label>
                  State/Province<span className="text-error-500">*</span>
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
                />
              </div>
            </div>

            {/* City and Experience in one row */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label>
                  City<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex-1">
                <Label>
                  Years of Experience<span className="text-error-500">*</span>
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
                />
              </div>
            </div>

            {/* Doctor Type and Address in one row */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label>
                  Type of Doctor<span className="text-error-500">*</span>
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
                />
              </div>
              <div className="flex-1">
                <Label>
                  Address<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Enter your address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password and Confirm Password in one row */}
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Label>
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Create a password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <Label>
                  Confirm Password<span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Confirm password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* <!-- Terms --> */}
            <div className="flex items-center gap-3">
              <Checkbox
                className="h-5 w-5"
                checked={isChecked}
                onChange={setIsChecked}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                By creating an account means you agree to the{" "}
                <Link
                  href="/terms"
                  className="text-gray-800 dark:text-white/90"
                >
                  Terms and Conditions
                </Link>
                , and our{" "}
                <Link
                  href="/privacy"
                  className="text-gray-800 dark:text-white/90"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* <!-- Button --> */}
            <div>
              <button
                type="submit"
                disabled={!isChecked || isLoading}
                className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Account
              </button>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-center text-sm font-normal text-gray-700 sm:text-start dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

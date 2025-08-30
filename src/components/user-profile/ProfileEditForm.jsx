"use client";
import React, { useState, useMemo } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
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
import { toast } from "react-toastify";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useSelector, useDispatch } from "react-redux";
import { setLoading } from "@/store/features/uiSlice";

export default function ProfileEditForm({ initialValues = {}, onSuccess }) {
  const { token } = useSelector((state) => state.auth);
  const { isLoading: isSubmitting } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: initialValues.name || "",
    email: initialValues.email || "",
    mobile: initialValues.mobile || "",
    gender: initialValues.gender || "",
    country: initialValues.country
      ? { value: initialValues.country, label: initialValues.country }
      : null,
    state: initialValues.state
      ? { value: initialValues.state, label: initialValues.state }
      : null,
    city: initialValues.city || "",
    experience: initialValues.experience || "",
    doctorType: initialValues.doctorType || "",
    address: initialValues.address || "",
  });
  const [photoUrl, setPhotoUrl] = useState(
    initialValues.profilePicture?.url || "",
  );
  const [photoFileKey, setPhotoFileKey] = useState(
    initialValues.profilePicture?.fileKey || "",
  );
  const [photoUploadedAt, setPhotoUploadedAt] = useState(
    initialValues.profilePicture?.uploadedAt || null,
  );

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
        // can be used for progress bar
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
        } catch (e) {
          toast.error("Failed to upload image");
        } finally {
          dispatch(setLoading(false));
        }
      },
    );
  };

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const res = await fetchWithError("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      toast.success("Profile updated!");

      if (onSuccess) onSuccess(res);
    } catch (error) {
      // Error handled by fetchWithError, but show toast here as well
      if (error && error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 p-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Profile Picture */}
        <div className="col-span-1 sm:col-span-3 md:col-span-3">
          <Label>Profile Picture</Label>
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition ${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white dark:bg-gray-800"}`}
          >
            <input {...getInputProps()} />
            {photoUrl ? (
              <>
                <div className="relative mb-2">
                  <img
                    src={photoUrl}
                    alt="Profile Preview"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="bg-opacity-80 absolute top-0 right-0 rounded-full bg-white p-1 shadow hover:bg-red-100"
                    style={{ transform: "translate(40%, -40%)" }}
                    disabled={isSubmitting}
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
              </>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                Drop an image here, or click to select
              </span>
            )}
          </div>
        </div>
        {/* Name */}
        <div>
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
        {/* Email (disabled) */}
        <div>
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
            disabled
            className="cursor-not-allowed bg-gray-100 opacity-70 dark:bg-gray-800"
          />
        </div>
        {/* Mobile */}
        <div>
          <Label>Mobile</Label>
          <Input
            type="text"
            id="mobile"
            name="mobile"
            placeholder="Enter your mobile number"
            value={formData.mobile}
            onChange={handleChange}
          />
        </div>
        {/* Gender */}
        <div>
          <Label>Gender</Label>
          <Select
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
            ]}
            value={
              formData.gender
                ? {
                    value: formData.gender,
                    label:
                      formData.gender.charAt(0).toUpperCase() +
                      formData.gender.slice(1),
                  }
                : null
            }
            onChange={(val) => handleSelectChange("gender", val?.value || "")}
            isClearable
            placeholder="Select gender"
          />
        </div>
        {/* Country */}
        <div>
          <Label>Country</Label>
          <Select
            options={countryOptions}
            value={formData.country}
            onChange={(val) => handleSelectChange("country", val)}
            isClearable
            placeholder="Select country"
          />
        </div>
        {/* State */}
        <div>
          <Label>State</Label>
          <Select
            options={stateOptions}
            value={formData.state}
            onChange={(val) => handleSelectChange("state", val)}
            isClearable
            placeholder="Select state"
          />
        </div>
        {/* City */}
        <div>
          <Label>City</Label>
          <Input
            type="text"
            id="city"
            name="city"
            placeholder="Enter your city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>
        {/* Experience */}
        <div>
          <Label>Experience</Label>
          <Input
            type="text"
            id="experience"
            name="experience"
            placeholder="Enter your experience"
            value={formData.experience}
            onChange={handleChange}
          />
        </div>
        {/* Doctor Type */}
        <div>
          <Label>Doctor Type</Label>
          <Input
            type="text"
            id="doctorType"
            name="doctorType"
            placeholder="Enter doctor type"
            value={formData.doctorType}
            onChange={handleChange}
          />
        </div>
        {/* Address */}
        <div className="md:col-span-3">
          <Label>Address</Label>
          <Input
            type="text"
            id="address"
            name="address"
            placeholder="Enter your address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className={`flex items-center gap-2 rounded-lg px-8 py-2 text-lg font-semibold text-white subpixel-antialiased shadow transition ${isSubmitting ? "cursor-not-allowed bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

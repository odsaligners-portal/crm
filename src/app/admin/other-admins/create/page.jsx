"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from '@/store/features/uiSlice';
import { toast } from 'react-toastify';
import { fetchWithError } from '@/utils/apiErrorHandler';
import Select from 'react-select';
import { Country, State } from 'country-state-city';
import { useDropzone } from 'react-dropzone';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { app as firebaseApp } from '@/utils/firebase';

export default function CreateAdminPage() {
  const heading = "Create New Admin";
  const description = "Enter details to create a new admin account";
  const router = useRouter();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { token } = useSelector((state) => state.auth) || {};
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    gender: '',
    country: null,
    state: null,
    city: '',
    experience: '',
    doctorType: '', 
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFileKey, setPhotoFileKey] = useState('');
  const [photoUploadedAt, setPhotoUploadedAt] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const countryOptions = useMemo(() => Country.getAllCountries().map(country => ({
    value: country.isoCode,
    label: country.name
  })), []);

  const stateOptions = useMemo(() => {
    if (formData.country) {
      return State.getStatesOfCountry(formData.country.value).map(state => ({
        value: state.isoCode,
        label: state.name
      }));
    }
    return [];
  }, [formData.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'country' && { state: null })
    }));
  };

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    dispatch(setLoading(true));
    setUploadProgress(0);
    const fileKey = `users/${file.name}-${Date.now()}`;
    const storage = getStorage(firebaseApp);
    const storageRef = ref(storage, fileKey);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed',
      (snapshot) => {
        setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      },
      (error) => {
        dispatch(setLoading(false));
        toast.error('Upload failed: ' + error.message);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setPhotoUrl(url);
        setPhotoFileKey(fileKey);
        setPhotoUploadedAt(new Date().toISOString());
        dispatch(setLoading(false));
        toast.success('Profile picture uploaded successfully.');
      }
    );
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    dispatch(setLoading(true));
    
    try {
      const payload = {
        ...formData,
        country: formData.country?.label,
        state: formData.state?.label,
        role: "admin",
      }
      if (photoUrl && photoFileKey && photoUploadedAt) {
        payload.profilePicture = {
          url: photoUrl,
          fileKey: photoFileKey,
          uploadedAt: photoUploadedAt,
        };
      }
      delete payload.confirmPassword;

      const data = await fetchWithError('/api/admin/other-admins/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      toast.success('Admin created successfully!');
      router.push('/admin/other-admins');
    } catch (error) {
      // fetchWithError will handle toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent">
      <div className="w-full max-w-3xl flex flex-col justify-center">
        <div className="mb-5 sm:mb-8">
          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            {heading}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
        <div>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3 sm:grid-cols-2">
              {/* <!-- Profile Picture --> */}
              <div className="col-span-1 md:col-span-3 sm:col-span-3">
                <Label>Profile Picture</Label>
                <div {...getRootProps()} className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer transition ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white dark:bg-gray-800'}`}>
                  <input {...getInputProps()} />
                  {photoUrl ? (
                    <img src={photoUrl} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover mb-2" />
                  ) : (
                    uploadProgress > 0 && uploadProgress < 100 ? (
                      <div className="text-xs text-blue-600 mt-2">Uploading... {Math.round(uploadProgress)}%</div>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Drop an image here, or click to select</span>
                    )
                  )}
                </div>
              </div>
              {/* <!-- Name --> */}
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
                />
              </div>
              {/* <!-- Email --> */}
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
                />
              </div>
              {/* <!-- Mobile --> */}
              <div>
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
                />
              </div>
              {/* <!-- Address --> */}
              <div>
                <Label>
                  Address
                </Label>
                <Input
                  type="text"
                  id="address"
                  name="address"
                  placeholder="Enter your full address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              {/* <!-- City --> */}
              <div>
                <Label>
                  City
                </Label>
                <Input
                  type="text"
                  id="city"
                  name="city"
                  placeholder="Enter your city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              {/* <!-- Country --> */}
              <div>
                <Label>
                  Country
                </Label>
                <Select
                  id="country"
                  name="country"
                  options={countryOptions}
                  value={formData.country}
                  onChange={(value) => handleSelectChange('country', value)}
                />
              </div>
              {/* <!-- State --> */}
              <div>
                <Label>
                  State
                </Label>
                <Select
                  id="state"
                  name="state"
                  options={stateOptions}
                  value={formData.state}
                  onChange={(value) => handleSelectChange('state', value)}
                  isDisabled={!formData.country}
                />
              </div>
              {/* <!-- Gender --> */}
              <div>
                <Label>
                  Gender
                </Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50 focus:border-brand-500 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:focus:border-brand-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {/* <!-- Experience --> */}
              <div>
                <Label>
                  Experience (in years)
                </Label>
                <Input
                  type="text"
                  id="experience"
                  name="experience"
                  placeholder="Enter your years of experience"
                  value={formData.experience}
                  onChange={handleChange}
                />
              </div>
              {/* <!-- Doctor's Type --> */}
              <div>
                <Label>
                  Doctor's Type
                </Label>
                <Input
                  type="text"
                  id="doctorType"
                  name="doctorType"
                  placeholder="Enter Doctor's type"
                  value={formData.doctorType}
                  onChange={handleChange}
                />
              </div>
              {/* <!-- Password --> */}
              <div>
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
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
              </div>
              {/* <!-- Confirm Password --> */}
              <div>
                <Label>
                  Confirm Password<span className="text-error-500">*</span>
                </Label>
                <Input
                  placeholder="Confirm your password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              {/* <!-- Button --> */}
              <div className="md:col-span-3">
                <div className="flex items-center justify-end">
                  <button
                    type="submit"
                    className="flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white-default-500 transition-colors duration-300 hover:bg-blue-700"
                  >
                    Create Admin
                  </button>
                </div>
              </div>
            </div>
          </form>
                        
        </div>
      </div>
    </div>
  );
}

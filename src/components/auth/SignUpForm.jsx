"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/store';
import { setCredentials } from '@/store/features/auth/authSlice';
import { toast } from 'react-toastify';
import { fetchWithError } from '@/utils/apiErrorHandler';
import Select from 'react-select';
import { Country, State } from 'country-state-city';

export default function SignUpForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      // Reset state when country changes
      ...(name === 'country' && { state: null })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isChecked) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const payload = {
        ...formData,
        country: formData.country?.label,
        state: formData.state?.label,
      }
      delete payload.confirmPassword;

      const data = await fetchWithError('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Update Redux store with user data
      dispatch(setCredentials({
        user: data.user,
        token: data.token,
        role: data.user.role
      }));

      toast.success('Successfully registered!');
      router.push('/'); // Redirect to dashboard after successful registration
    } catch (error) {
      // Error is already handled by fetchWithError
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-3/4 w-full overflow-y-auto no-scrollbar mt-12 mb-12">
      <div className="flex flex-col justify-center flex-1 w-full max-w-3xl mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your details to create an account
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3 sm:grid-cols-2">
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
                    required
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
                    required
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
                    required
                  />
                </div>
                {/* <!-- Address --> */}
                <div>
                  <Label>
                    Address<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Enter your full address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/* <!-- City --> */}
                <div>
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
                {/* <!-- Country --> */}
                <div>
                  <Label>
                    Country<span className="text-error-500">*</span>
                  </Label>
                  <Select
                    id="country"
                    name="country"
                    options={countryOptions}
                    value={formData.country}
                    onChange={(value) => handleSelectChange('country', value)}
                    required
                  />
                </div>
                {/* <!-- State --> */}
                <div>
                  <Label>
                    State<span className="text-error-500">*</span>
                  </Label>
                  <Select
                    id="state"
                    name="state"
                    options={stateOptions}
                    value={formData.state}
                    onChange={(value) => handleSelectChange('state', value)}
                    required
                    isDisabled={!formData.country}
                  />
                </div>
                {/* <!-- Gender --> */}
                <div>
                  <Label>
                    Gender<span className="text-error-500">*</span>
                  </Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
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
                    Experience (in years)<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="experience"
                    name="experience"
                    placeholder="Enter your years of experience"
                    value={formData.experience}
                    onChange={handleChange}
                    required
                  />
                </div>
                {/* <!-- Doctor's Type --> */}
                <div>
                  <Label>
                    Doctor's Type<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="doctorType"
                    name="doctorType"
                    placeholder="Enter Doctor's type"
                    value={formData.doctorType}
                    onChange={handleChange}
                    required
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
                {/* <!-- Terms --> */}
                <div className="flex items-center gap-3 md:col-span-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    By creating an account means you agree to the{" "}
                    <Link href="/terms" className="text-gray-800 dark:text-white/90">
                      Terms and Conditions
                    </Link>
                    , and our{" "}
                    <Link href="/privacy" className="text-gray-800 dark:text-white/90">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
                {/* <!-- Button --> */}
                <div className="md:col-span-3">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

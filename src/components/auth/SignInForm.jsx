"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { setCredentials } from '@/store/features/auth/authSlice';
import { setNotifications } from '@/store/features/notificationSlice';
import { setLoading } from '@/store/features/uiSlice';
import { useAppDispatch } from '@/store/store';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from "react";
import { toast } from 'react-toastify';

export default function SignInForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));
    try {
      const payload = { ...formData };
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Login failed');
        return;
      }
      
      // Update Redux store with user data
      dispatch(setCredentials({
        user: data.user,
        token: data.token,
        role: data.user.role
      }));

      // Fetch notifications and set in Redux
      try {
        const notifRes = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          dispatch(setNotifications(notifData.notifications || []));
        }
      } catch (e) { /* ignore */ }

      toast.success('Successfully logged in!');
      
      // Role-based redirection
      const userRole = data.user.role;
      if (userRole === 'admin') {
        router.push('/admin');
      } else if (userRole === 'doctor') {
        router.push('/doctor');
      } else {
        toast.error('Invalid User Role');
        router.push('/signin'); // Default redirect
      }
    } catch (error) {
      // Error is already handled by fetchWithError
      console.error('Login error:', error);
      toast.error('An error occurred during login.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: 'url(/materials/bg-signin.jpg)' }}>
        <div className="w-full max-w-md mx-auto p-8 rounded-2xl shadow-2xl backdrop-blur-xs bg-white/60 dark:bg-gray-900/60">
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md text-center">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Enter your email and password to sign in!
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
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
              {/* <!-- Password --> */}
              <div>
                <Label>
                  Password<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Enter your password"
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
              {/* <!-- Remember Me and Forgot Password --> */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Remember me
                  </p>
                </div>
              </div>
              {/* <!-- Button --> */}
              <div>
                <button 
                  type="submit"
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sign In
                </button>
              </div>
            </div>
          </form>
          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Register Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

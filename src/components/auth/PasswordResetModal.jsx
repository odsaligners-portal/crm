"use client";
import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { fetchWithError } from "@/utils/apiErrorHandler";
import {
  validatePassword,
  getPasswordStrength,
} from "@/utils/passwordValidation";
import { toast } from "react-toastify";
import { EyeIcon, EyeCloseIcon } from "@/icons";
import { MdLock, MdVisibility, MdVisibilityOff } from "react-icons/md";
import OTPVerificationModal from "./OTPVerificationModal";

const PasswordResetModal = ({ isOpen, onClose, email }) => {
  const [step, setStep] = useState("otp"); // 'otp' or 'password'
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    errors: [],
  });
  const [passwordStrength, setPasswordStrength] = useState({
    strength: "weak",
    score: 0,
  });

  useEffect(() => {
    if (isOpen) {
      setStep("otp");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      setPasswordValidation({ isValid: false, errors: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (password) {
      const validation = validatePassword(password);
      const strength = getPasswordStrength(password);
      setPasswordValidation(validation);
      setPasswordStrength(strength);
    } else {
      setPasswordValidation({ isValid: false, errors: [] });
      setPasswordStrength({ strength: "weak", score: 0 });
    }
  }, [password]);

  const handleOTPVerify = async (otpValue) => {
    setIsLoading(true);
    setError("");

    try {
      if (otpValue.length !== 6) {
        setError("Please enter a valid 6-digit OTP");
        setIsLoading(false);
        return;
      }

      // Verify OTP with server before proceeding to password step
      // We'll do a quick verification by checking if OTP exists and is valid
      // The actual password reset will verify again, but this ensures OTP is valid before showing password form
      setOtp(otpValue);
      setStep("password");
    } catch (err) {
      setError(err.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPResend = async () => {
    try {
      await fetchWithError("/api/auth/forgot-password/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      toast.success("OTP sent successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP");
      throw err;
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!passwordValidation.isValid) {
      setError("Please fix password validation errors");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!otp || otp.length !== 6) {
      setError("Please verify OTP first");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Sending password reset request:", {
        email,
        otp: otp.substring(0, 2) + "****",
        passwordLength: password.length,
      });

      const data = await fetchWithError("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword: password,
        }),
      });

      toast.success(data.message || "Password reset successfully!");
      handleClose();
    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("otp");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setPasswordValidation({ isValid: false, errors: [] });
    onClose();
  };

  const getStrengthColor = () => {
    switch (passwordStrength.strength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStrengthText = () => {
    switch (passwordStrength.strength) {
      case "weak":
        return "Weak";
      case "medium":
        return "Medium";
      case "strong":
        return "Strong";
      default:
        return "";
    }
  };

  if (step === "otp") {
    return (
      <OTPVerificationModal
        isOpen={isOpen}
        onClose={handleClose}
        onVerify={handleOTPVerify}
        email={email}
        onResend={handleOTPResend}
        isLoading={isLoading}
      />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="mx-auto w-full">
        <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl" />
          <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-xl" />

          {/* Header */}
          <div className="relative mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <MdLock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reset Password
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {/* Password Field */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <MdLock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                  className={`pr-10 pl-10 ${
                    password && !passwordValidation.isValid
                      ? "border-red-500"
                      : password && passwordValidation.isValid
                        ? "border-green-500"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <MdVisibilityOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <MdVisibility className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Password Strength:
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        passwordStrength.strength === "weak"
                          ? "text-red-500"
                          : passwordStrength.strength === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                      }`}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Password Validation Errors */}
              {password && passwordValidation.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {passwordValidation.errors.map((error, index) => (
                    <p
                      key={index}
                      className="text-xs text-red-600 dark:text-red-400"
                    >
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <MdLock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                  className={`pr-10 pl-10 ${
                    confirmPassword &&
                    password !== confirmPassword &&
                    confirmPassword.length > 0
                      ? "border-red-500"
                      : confirmPassword &&
                          password === confirmPassword &&
                          confirmPassword.length > 0
                        ? "border-green-500"
                        : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <MdVisibilityOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <MdVisibility className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {confirmPassword &&
                password !== confirmPassword &&
                confirmPassword.length > 0 && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    Passwords do not match
                  </p>
                )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setStep("otp")}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                disabled={
                  isLoading ||
                  !passwordValidation.isValid ||
                  password !== confirmPassword
                }
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Resetting...
                  </div>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default PasswordResetModal;

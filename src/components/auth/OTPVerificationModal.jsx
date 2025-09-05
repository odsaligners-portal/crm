"use client";
import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/button/Button";
import { toast } from "react-toastify";

const OTPVerificationModal = ({
  isOpen,
  onClose,
  onVerify,
  email,
  onResend,
  isLoading = false,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(["", "", "", "", "", ""]);
      setTimeLeft(60);
      // Focus first input when modal opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (timeLeft > 0 && isOpen) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isOpen]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all fields are filled - use setTimeout to ensure state is updated
    if (newOtp.every((digit) => digit !== "") && newOtp.join("").length === 6) {
      setTimeout(() => {
        const finalOtp = newOtp.join("");
        if (finalOtp.length === 6) {
          onVerify(finalOtp);
        }
      }, 0);
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const newOtp = [...otp];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    // Focus the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex((digit) => digit === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = () => {
    const otpString = otp.join("");
    if (otpString.length === 6) {
      onVerify(otpString);
    }
    // Remove the error toast as it was causing confusion
    // The parent component will handle validation errors
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
      setTimeLeft(60);
      toast.success("OTP sent successfully!");
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="animate-in fade-in-0 zoom-in-95 relative mx-4 w-full max-w-md duration-300">
        {/* Background Pattern */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />

        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl" />
        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-xl" />

        <div className="relative rounded-2xl border border-white/20 bg-white/80 p-8 shadow-2xl backdrop-blur-md dark:border-gray-700/50 dark:bg-gray-800/80">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verify Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              We've sent a 6-digit verification code to
            </p>
            <p className="font-medium text-blue-600 dark:text-blue-400">
              {email}
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Enter Verification Code
            </label>
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="h-12 w-12 rounded-xl border-2 border-gray-200 bg-white text-center text-xl font-bold text-gray-900 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleVerify}
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Verifying...
                </div>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the code?{" "}
                {timeLeft > 0 ? (
                  <span className="text-gray-500">Resend in {timeLeft}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isResending}
                    className="font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:opacity-50 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {isResending ? "Sending..." : "Resend Code"}
                  </button>
                )}
              </p>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <svg
                className="mt-0.5 h-4 w-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                For security reasons, this code will expire in 10 minutes.
                Please check your spam folder if you don't see the email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;

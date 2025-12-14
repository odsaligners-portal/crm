"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { setLoading } from "@/store/features/uiSlice";
import { toast } from "react-toastify";
import {
  MdContentCopy,
  MdRefresh,
  MdShare,
  MdLink,
  MdQrCode,
} from "react-icons/md";
import { FaUserFriends, FaCheckCircle } from "react-icons/fa";

export default function DistributerReferralPage() {
  const { token } = useSelector((state) => state.auth);
  const [referralData, setReferralData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchReferralCode = async () => {
      if (!token) return;

      dispatch(setLoading(true));
      try {
        const data = await fetchWithError("/api/distributer/referral", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReferralData(data);
      } catch (error) {
        console.error("Failed to fetch referral code:", error);
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchReferralCode();
  }, [token, dispatch]);

  const handleCopy = async () => {
    if (referralData?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralData.referralLink);
        setCopied(true);
        toast.success("Referral link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  };

  const handleCopyCode = async () => {
    if (referralData?.referralCode) {
      try {
        await navigator.clipboard.writeText(referralData.referralCode);
        toast.success("Referral code copied to clipboard!");
      } catch (error) {
        toast.error("Failed to copy code");
      }
    }
  };

  const handleRegenerate = async () => {
    if (
      !confirm(
        "Are you sure you want to regenerate your referral code? The old code will no longer work.",
      )
    ) {
      return;
    }

    setIsRegenerating(true);
    try {
      const data = await fetchWithError("/api/distributer/referral", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setReferralData(data);
      toast.success("Referral code regenerated successfully!");
    } catch (error) {
      console.error("Failed to regenerate referral code:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && referralData?.referralLink) {
      try {
        await navigator.share({
          title: "Join using my referral code",
          text: `Use my referral code ${referralData.referralCode} to sign up!`,
          url: referralData.referralLink,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback to copy
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-10 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent drop-shadow-lg dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
            Referral Program
          </h1>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            Share your unique referral code and grow your network
          </p>
        </div>

        {referralData && (
          <div className="space-y-6">
            {/* Referral Code Card */}
            <div className="group relative overflow-hidden rounded-3xl border border-blue-100/50 bg-gradient-to-br from-white to-blue-50/30 p-8 shadow-xl transition-all duration-300 hover:scale-[1.01] hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-200/50 dark:border-gray-700/50 dark:from-gray-800 dark:to-gray-900/50 dark:hover:border-blue-700/50 dark:hover:shadow-blue-900/20">
              {/* Decorative Elements */}
              <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 blur-3xl" />

              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white">
                      Your Referral Code
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share this code with others to get them signed up under
                      your account
                    </p>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl disabled:opacity-50"
                  >
                    <MdRefresh
                      className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
                    />
                    Regenerate
                  </button>
                </div>

                {/* Referral Code Display */}
                <div className="mb-6 rounded-2xl border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-purple-50 p-6 dark:border-blue-700 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
                    Referral Code
                  </div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text font-mono text-4xl font-bold text-transparent dark:from-blue-400 dark:to-purple-400">
                      {referralData.referralCode}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    >
                      <MdContentCopy className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="mb-6">
                  <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Referral Link
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 font-mono text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {referralData.referralLink}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                    >
                      {copied ? (
                        <>
                          <FaCheckCircle className="h-5 w-5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <MdContentCopy className="h-5 w-5" />
                          Copy Link
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-all duration-200 hover:bg-blue-100 hover:shadow-md dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30"
                  >
                    <MdShare className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* How It Works Card */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <h3 className="mb-6 text-xl font-bold text-gray-800 dark:text-white">
                How It Works
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <span className="font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-800 dark:text-white">
                      Share Your Code
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Share your unique referral code or link with anyone you
                      want to invite
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                    <span className="font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-800 dark:text-white">
                      They Sign Up
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      When someone registers using your referral code, they'll
                      automatically be associated with your account
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-red-600 text-white">
                    <span className="font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold text-gray-800 dark:text-white">
                      Manage Your Network
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View and manage all users who signed up using your
                      referral code from your dashboard
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

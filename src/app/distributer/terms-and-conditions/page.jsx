"use client";
import React, { useState, useEffect } from "react";
import { terms } from "@/constants/data";
import { useSelector } from "react-redux";

const TermsAndConditionsPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [termsContent, setTermsContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [distributorName, setDistributorName] = useState("");

  useEffect(() => {
    const fetchTerms = async () => {
      if (!token) {
        // No token, show default terms
        setTermsContent(null);
        setLoading(false);
        return;
      }

      try {
        // First, get the distributor's profile to get their own ID
        const profileResponse = await fetch("/api/distributer/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const distributerId = profileData.user?.id;

          if (distributerId) {
            // Fetch distributor's own terms
            const termsResponse = await fetch(
              `/api/privacy-policies?distributerId=${distributerId}&active=true`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (termsResponse.ok) {
              const termsData = await termsResponse.json();
              if (termsData.data) {
                setTermsContent(termsData.data);
                setDistributorName(profileData.user?.name || "");
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching terms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading terms...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-4 sm:p-6 md:p-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl leading-tight font-extrabold text-gray-800 md:text-5xl dark:text-white">
            Terms and <span className="text-blue-600">Conditions</span>
          </h1>
          {distributorName && (
            <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
              {distributorName} Terms
            </p>
          )}
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Last updated:{" "}
            {termsContent?.updatedAt
              ? new Date(termsContent.updatedAt).toLocaleDateString()
              : new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          {termsContent ? (
            // Show distributor-specific terms
            <div className="transform overflow-hidden rounded-2xl border border-gray-200/50 bg-white shadow-lg transition-shadow duration-300 ease-in-out dark:border-gray-700/50 dark:bg-gray-800/50">
              <div className="p-8">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900 subpixel-antialiased dark:text-white">
                  {termsContent.title}
                </h2>
                <div
                  className="prose prose-gray dark:prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: termsContent.content }}
                />
              </div>
            </div>
          ) : (
            // Show default terms from constants
            terms.map((term, index) => (
              <div
                key={index}
                className="transform overflow-hidden rounded-2xl border border-gray-200/50 bg-white shadow-lg transition-shadow duration-300 ease-in-out hover:-translate-y-1 hover:shadow-2xl dark:border-gray-700/50 dark:bg-gray-800/50"
              >
                <div className="p-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900 subpixel-antialiased dark:text-white">
                    {term.title}
                  </h2>
                  <p className="leading-relaxed whitespace-pre-line text-gray-600 dark:text-gray-300">
                    {term.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;

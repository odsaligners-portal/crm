import React from "react";
import { terms } from "@/constants/data";

const TermsAndConditionsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-4 sm:p-6 md:p-12 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl leading-tight font-extrabold text-gray-800 md:text-5xl dark:text-white">
            Terms and <span className="text-blue-600">Conditions</span>
          </h1>
          <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8">
          {terms.map((term, index) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;

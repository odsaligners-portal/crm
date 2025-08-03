import React from "react";
import { terms } from "@/constants/data";

const TermsAndConditionsPage = () => {
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-950 p-4 sm:p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white leading-tight">
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
              className="bg-white dark:bg-gray-800/50 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out overflow-hidden border border-gray-200/50 dark:border-gray-700/50 transform hover:-translate-y-1"
            >
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {term.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
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
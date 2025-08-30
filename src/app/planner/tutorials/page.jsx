import React from "react";

const tutorials = [
  {
    name: "How To Create An Account For ODS Aligners Case Submission?",
    url: "https://www.youtube.com/embed/GMy2Bxig8xM",
    watch: "https://www.youtube.com/watch?v=GMy2Bxig8xM",
  },
  {
    name: "How To Submit/Upload A Case Online For ODS Clear Aligners?",
    url: "https://www.youtube.com/embed/GObQTEw9aN4",
    watch: "https://www.youtube.com/watch?v=GObQTEw9aN4",
  },
];

export default function TutorialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-blue-800 dark:text-white/90">
        Tutorials
      </h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {tutorials.map((vid) => (
          <div
            key={vid.url}
            className="flex flex-col rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-400 subpixel-antialiased dark:text-blue-200">
                {vid.name}
              </span>
              {/* <a
                href={vid.watch}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold subpixel-antialiased"
              >
                Watch on YouTube
              </a> */}
            </div>
            <div className="flex min-h-[350px] flex-1 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <iframe
                src={vid.url}
                title={vid.name}
                width="100%"
                height="350"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full rounded-lg border-0"
              ></iframe>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

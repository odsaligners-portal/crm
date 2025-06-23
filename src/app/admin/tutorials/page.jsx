import React from 'react';

const tutorials = [
  {
    name: 'How To Create An Account For ODS Aligners Case Submission?',
    url: 'https://www.youtube.com/embed/GMy2Bxig8xM',
    watch: 'https://www.youtube.com/watch?v=GMy2Bxig8xM',
  },
  {
    name: 'How To Submit/Upload A Case Online For ODS Clear Aligners?',
    url: 'https://www.youtube.com/embed/GObQTEw9aN4',
    watch: 'https://www.youtube.com/watch?v=GObQTEw9aN4',
  },
];

export default function TutorialsPage() {
  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 mb-8 text-center">Tutorials</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {tutorials.map((vid) => (
          <div key={vid.url} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-blue-400 dark:text-blue-200">{vid.name}</span>
              {/* <a
                href={vid.watch}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold"
              >
                Watch on YouTube
              </a> */}
            </div>
            <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden min-h-[350px]">
              <iframe
                src={vid.url}
                title={vid.name}
                width="100%"
                height="350"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0 rounded-lg"
              ></iframe>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

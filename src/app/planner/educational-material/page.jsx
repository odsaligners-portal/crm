import React from 'react';

const materials = [
    {
        name: 'Case Submission Form',
        file: '/materials/Case-Submission-Form.pdf',
    },
    {
        name: 'ODS Aligners Booklet',
        file: '/materials/ODS-Aligners-Booklet.pdf',
    },
    {
        name: 'Patient Instructions',
        file: '/materials/Patient-Instructions.pdf',
    },
    {
        name: 'Successful Cases',
        file: '/materials/Successfull-Cases.pdf',
    },
];

export default function EducationalMaterialPage() {
    return (
        <div className="p-8 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
            <h1 className="text-3xl font-extrabold text-blue-800 dark:text-white/90 mb-8 text-center">Educational Materials</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {materials.map((mat) => (
                    <div key={mat.file} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-200">{mat.name}</h2>
                            <a
                                href={mat.file}
                                download
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold"
                            >
                                Download
                            </a>
                        </div>
                        <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden min-h-[350px]">
                            <object
                                data={mat.file}
                                type="application/pdf"
                                width="100%"
                                height="350px"
                                className="w-full h-full"
                            >
                                <p className="text-gray-500 text-center">PDF preview not available. <a href={mat.file} download className="underline">Download PDF</a></p>
                            </object>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

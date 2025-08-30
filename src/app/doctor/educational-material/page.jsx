import React from "react";

const materials = [
  {
    name: "Case Submission Form",
    file: "/materials/Case-Submission-Form.pdf",
  },
  {
    name: "ODS Aligners Booklet",
    file: "/materials/ODS-Aligners-Booklet.pdf",
  },
  {
    name: "Patient Instructions",
    file: "/materials/Patient-Instructions.pdf",
  },
  {
    name: "Successful Cases",
    file: "/materials/Successfull-Cases.pdf",
  },
];

export default function EducationalMaterialPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 dark:from-gray-900 dark:via-gray-950 dark:to-blue-900">
      <h1 className="mb-8 text-center text-3xl font-extrabold text-blue-800 dark:text-white/90">
        Educational Materials
      </h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {materials.map((mat) => (
          <div
            key={mat.file}
            className="flex flex-col rounded-xl bg-white p-6 shadow-lg dark:bg-gray-900"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-blue-700 dark:text-blue-200">
                {mat.name}
              </h2>
              <a
                href={mat.file}
                download
                className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-blue-700"
              >
                Download
              </a>
            </div>
            <div className="flex min-h-[350px] flex-1 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <object
                data={mat.file}
                type="application/pdf"
                width="100%"
                height="350px"
                className="h-full w-full"
              >
                <p className="text-center text-gray-500">
                  PDF preview not available.{" "}
                  <a href={mat.file} download className="underline">
                    Download PDF
                  </a>
                </p>
              </object>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

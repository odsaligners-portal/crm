'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUploadCloud, FiTrash2 } from 'react-icons/fi';
import Image from 'next/image';

const ImageUpload = ({ onFileChange }) => {
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onFileChange(file);
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
    },
    multiple: false,
  });

  const removeImage = (e) => {
    e.stopPropagation(); // prevent opening file dialog
    setPreview(null);
    onFileChange(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
      <div
        {...getRootProps()}
        className={`relative w-full h-64 border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors duration-200 ease-in-out
        ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'}`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <>
            <Image src={preview} alt="Event preview" layout="fill" objectFit="cover" className="rounded-lg" />
            <button
              onClick={removeImage}
              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
              aria-label="Remove image"
            >
              <FiTrash2 size={20} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center">
            <FiUploadCloud className="w-12 h-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive ? 'Drop the image here ...' : "Drag 'n' drop an image here, or click to select"}
            </p>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload; 
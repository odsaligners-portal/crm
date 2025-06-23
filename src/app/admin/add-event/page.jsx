'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '@/utils/firebase';
import { useDropzone } from 'react-dropzone';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

import DatePicker from '@/components/form/date-picker';
import InputField from '@/components/form/input/InputField';
import Button from '@/components/ui/button/Button';
import Label from '@/components/form/Label';

const AddEventPage = () => {
  const { token } = useSelector((state) => state.auth);
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for the single file upload
  const [imageUrl, setImageUrl] = useState(null);
  const [fileKey, setFileKey] = useState(null);
  const [progress, setProgress] = useState(0);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'

  const handleFileUpload = (file) => {
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
    let type = null;
    if (imageExtensions.includes(fileExtension)) {
      type = 'image';
    } else if (videoExtensions.includes(fileExtension)) {
      type = 'video';
    } else {
      toast.error('Invalid file type. Please upload an image or video.');
      return;
    }

    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const storagePath = `events/${uniqueFileName}`;
    const storageRef = ref(getStorage(app), storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed",
      (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        toast.error(`Upload failed: ${error.message}`);
        setProgress(0);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrl(downloadURL);
          setFileKey(storagePath);
          setFileType(type);
          toast.success("File uploaded successfully");
          setProgress(100);
        });
      }
    );
  };
  
  const handleDeleteFile = async () => {
    if (!fileKey) return;
    const fileRef = ref(getStorage(app), fileKey);
    try {
      await deleteObject(fileRef);
      setImageUrl(null);
      setFileKey(null);
      setProgress(0);
      toast.success("Image deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete image: ${error.message}`);
    }
  };
  
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    console.log(name,
      description,
      eventDate,
       imageUrl,fileKey )
    if (!name || !description || !eventDate || !imageUrl) {
      toast.error("Please fill all fields and upload an image or video.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          eventDate,
          image: { fileUrl: imageUrl, fileKey: fileKey, fileType: fileType },
        }),
      });

      if (!response.ok) {
        // If server returns error, delete the uploaded image
        await handleDeleteFile();
        throw new Error((await response.json()).message || "Failed to create event");
      }
      
      toast.success("Event added successfully!");
      router.push('/admin/events');

    } catch (error) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const UploadComponent = () => {
    const onDrop = (acceptedFiles) => acceptedFiles.length > 0 && handleFileUpload(acceptedFiles[0]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif'], 'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'] } });
    
    return (
      <div className="text-center">
        <Label>Event Image/Video</Label>
        {!imageUrl ? (
          progress > 0 && progress < 100 ? (
            <div className="w-full mt-2">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-blue-700">Uploading...</span>
                <span className="text-sm font-medium text-blue-700">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <div {...getRootProps()} className={`mt-2 flex justify-center items-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}>
              <input {...getInputProps()} />
              <span className="flex items-center space-x-2">
                <span className="font-medium text-gray-600">Drop image or video file or <span className="text-blue-600 underline">browse</span></span>
              </span>
            </div>
          )
        ) : (
          <div className="relative group max-w-xs mx-auto mt-2">
            <div className="rounded-xl shadow-lg border flex flex-col items-center justify-center h-48">
              {fileType === 'image' ? (
                <img src={imageUrl} alt="Event" className="w-full h-full object-contain rounded-xl" />
              ) : fileType === 'video' ? (
                <video src={imageUrl} controls className="w-full h-full object-contain rounded-xl" />
              ) : null}
              <button type="button" onClick={handleDeleteFile} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-80 hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Event</h1>
      <form onSubmit={handleFinalSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <InputField
          label="Event Name"
          placeholder="Enter event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <Label>Event Description</Label>
          <textarea
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            rows="4"
            placeholder="Enter event description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>
        <div>
          <Label>Event Date</Label>
          <DatePicker
            id="event-date"
            selectedDate={eventDate}
            onChange={(date) => setEventDate(date)}
          />
        </div>
        <UploadComponent />
        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" disabled={isSubmitting || (progress > 0 && progress < 100)}>
            {isSubmitting ? 'Submitting...' : 'Submit Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddEventPage;
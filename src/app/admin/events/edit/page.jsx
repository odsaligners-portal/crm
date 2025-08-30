"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { app } from "@/utils/firebase";
import { useDropzone } from "react-dropzone";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";

import DatePicker from "@/components/form/date-picker";
import InputField from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";

const EditPage = () => {
  const { token } = useSelector((state) => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");
  const dispatch = useDispatch();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(new Date());
  const [hasEventUpdateAccess, setHasEventUpdateAccess] = useState(null);

  // State for the single file upload
  const [imageUrl, setImageUrl] = useState(null);
  const [fileKey, setFileKey] = useState(null);
  const [progress, setProgress] = useState(0);
  const [originalFileKey, setOriginalFileKey] = useState(null);
  const [fileType, setFileType] = useState(null); // 'image' or 'video'

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId || !token) return;
      dispatch(setLoading(true));
      try {
        const event = await fetchWithError(`/api/events?id=${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(event.name || "");
        setDescription(event.description || "");
        setEventDate(event.eventDate ? new Date(event.eventDate) : new Date());
        setImageUrl(event.image?.fileUrl || null);
        setFileKey(event.image?.fileKey || null);
        setOriginalFileKey(event.image?.fileKey || null);
        setFileType(event.image?.fileType || null);
      } catch (error) {
        // fetchWithError will handle toast
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchEvent();
    // eslint-disable-next-line
  }, [eventId, token, dispatch]);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) {
        setHasEventUpdateAccess(false);
        return;
      }
      dispatch(setLoading(true));
      try {
        const data = await fetchWithError("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasEventUpdateAccess(!!data.user?.eventUpdateAccess);
      } catch (err) {
        setHasEventUpdateAccess(false);
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchAccess();
  }, [token, dispatch]);

  const handleFileUpload = (file) => {
    if (!file) return;
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const imageExtensions = ["jpg", "jpeg", "png", "gif"];
    const videoExtensions = ["mp4", "mov", "avi", "webm", "mkv"];
    let type = null;
    if (imageExtensions.includes(fileExtension)) {
      type = "image";
    } else if (videoExtensions.includes(fileExtension)) {
      type = "video";
    } else {
      toast.error("Invalid file type. Please upload an image or video.");
      return;
    }
    const uniqueFileName = `${uuidv4()}-${file.name}`;
    const storagePath = `events/${uniqueFileName}`;
    const storageRef = ref(getStorage(app), storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);
    dispatch(setLoading(true));
    uploadTask.on(
      "state_changed",
      (snapshot) =>
        setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
      (error) => {
        toast.error(`Upload failed: ${error.message}`);
        setProgress(0);
        dispatch(setLoading(false));
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setImageUrl(downloadURL);
          setFileKey(storagePath);
          setFileType(type);
          toast.success("File uploaded successfully");
          setProgress(100);
          dispatch(setLoading(false));
        });
      },
    );
  };

  const handleDeleteFile = async () => {
    if (!fileKey) return;
    const fileRef = ref(getStorage(app), fileKey);
    dispatch(setLoading(true));
    try {
      await deleteObject(fileRef);
      setImageUrl(null);
      setFileKey(null);
      setFileType(null);
      setProgress(0);
      toast.success("Image deleted successfully");
    } catch (error) {
      toast.error(`Failed to delete image: ${error.message}`);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description || !eventDate || !imageUrl) {
      toast.error("Please fill all fields and upload an image or video.");
      return;
    }
    dispatch(setLoading(true));
    try {
      await fetchWithError(`/api/admin/events?id=${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          eventDate,
          image: { fileUrl: imageUrl, fileKey: fileKey, fileType: fileType },
        }),
      });

      // If the uploaded file was new, try to delete the old one
      if (originalFileKey && fileKey !== originalFileKey) {
        try {
          const oldFileRef = ref(getStorage(app), originalFileKey);
          await deleteObject(oldFileRef);
        } catch (error) {
          // Non-critical error, just log it
          console.warn("Failed to delete old event image:", error);
        }
      }

      toast.success("Event updated successfully!");
      router.push("/admin/events");
    } catch (error) {
      // If server returns error, delete the uploaded image if it was new
      if (fileKey && fileKey !== originalFileKey) {
        const newFileRef = ref(getStorage(app), fileKey);
        await deleteObject(newFileRef);
      }
      // fetchWithError will handle toast
    } finally {
      dispatch(setLoading(false));
    }
  };

  const UploadComponent = () => {
    const onDrop = (acceptedFiles) =>
      acceptedFiles.length > 0 && handleFileUpload(acceptedFiles[0]);
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      multiple: false,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".gif"],
        "video/*": [".mp4", ".mov", ".avi", ".webm", ".mkv"],
      },
    });
    return (
      <div className="text-center">
        <Label>Event Image/Video</Label>
        {!imageUrl ? (
          progress > 0 && progress < 100 ? (
            <div className="mt-2 w-full">
              <div className="mb-1 flex justify-between">
                <span className="text-sm font-medium text-blue-700">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-blue-700">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-2.5 rounded-full bg-blue-600"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div
              {...getRootProps()}
              className={`mt-2 flex h-32 w-full cursor-pointer appearance-none items-center justify-center rounded-md border-2 border-dashed border-gray-300 bg-white px-4 transition hover:border-gray-400 focus:outline-none ${isDragActive ? "border-blue-500 bg-blue-50" : ""}`}
            >
              <input {...getInputProps()} />
              <span className="flex items-center space-x-2">
                <span className="font-medium text-gray-600">
                  Drop image or video file or{" "}
                  <span className="text-blue-600 underline">browse</span>
                </span>
              </span>
            </div>
          )
        ) : (
          <div className="group relative mx-auto mt-2 max-w-xs">
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border shadow-lg">
              {fileType === "image" ? (
                <img
                  src={imageUrl}
                  alt="Event"
                  className="h-full w-full rounded-xl object-contain"
                />
              ) : fileType === "video" ? (
                <video
                  src={imageUrl}
                  controls
                  className="h-full w-full rounded-xl object-contain"
                />
              ) : null}
              <button
                type="button"
                onClick={handleDeleteFile}
                className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-80 shadow-lg transition-opacity hover:opacity-100"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (hasEventUpdateAccess === false) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <span className="text-lg font-semibold text-red-600 dark:text-red-400">
          Access Denied
        </span>
        <span className="mt-2 text-gray-600 dark:text-gray-300">
          You do not have permission to edit events.
        </span>
      </div>
    );
  }
  if (hasEventUpdateAccess === null) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-semibold">Edit Event</h1>
      <form
        onSubmit={handleFinalSubmit}
        className="space-y-6 rounded-lg bg-white p-6 shadow-md"
      >
        <InputField
          label="Event Name"
          placeholder="Enter event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div>
          <Label>Event Description</Label>
          <textarea
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
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
        <div className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={progress > 0 && progress < 100}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditPage;

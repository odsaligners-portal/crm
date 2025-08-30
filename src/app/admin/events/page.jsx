"use client";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { useModal } from "@/hooks/useModal";
import { PencilIcon, TrashBinIcon } from "@/icons";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FiCalendar, FiUser } from "react-icons/fi";
import { MdAdd } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

const EventsPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const [eventToDelete, setEventToDelete] = useState(null);
  const { isOpen, openModal, closeModal } = useModal();
  const [hasEventUpdateAccess, setHasEventUpdateAccess] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchEvents = async () => {
      dispatch(setLoading(true));
      try {
        const data = await fetchWithError("/api/events", {
          // Use the new admin route
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEvents(data);
      } catch (error) {
        // fetchWithError will handle toast
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchEvents();
  }, [dispatch, token]);

  useEffect(() => {
    const fetchAccess = async () => {
      if (!token) return;
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

  // Delete event handler
  const handleDeleteEvent = (eventId) => {
    setEventToDelete(eventId);
    openModal();
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    dispatch(setLoading(true));
    try {
      await fetchWithError(`/api/admin/events?id=${eventToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEvents((prev) => prev.filter((e) => e._id !== eventToDelete));
      toast.success("Event deleted successfully.");
    } catch (error) {
      // fetchWithError will handle toast
    } finally {
      dispatch(setLoading(false));
      setEventToDelete(null);
      closeModal();
    }
  };

  const featuredEvent = events[0];
  const otherEvents = events.slice(1);

  // Combine featured and other events for grid
  const allEvents = events;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-extrabold text-gray-900 md:text-5xl dark:text-white">
            Our Events
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Join us for our upcoming events and connect with the community.
          </p>
          {hasEventUpdateAccess && (
            <button
              onClick={() => router.push("/admin/add-event")}
              className="mx-auto mt-6 flex items-center justify-center rounded-lg bg-gradient-to-r from-green-400 to-green-600 px-5 py-2 font-semibold text-white shadow-md transition-transform hover:scale-105"
            >
              <MdAdd className="mr-2 text-lg" /> Add Event
            </button>
          )}
        </header>

        {allEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {allEvents.map((event) => (
              <div
                key={event._id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800"
              >
                <div className="relative h-56 w-full">
                  {event.image.fileType === "video" ? (
                    <video
                      src={event.image.fileUrl}
                      controls
                      className="h-full w-full rounded-t-2xl object-cover"
                      style={{ height: "100%", width: "100%" }}
                    />
                  ) : (
                    <Image
                      src={event.image.fileUrl}
                      alt={event.name}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-500 hover:scale-105"
                    />
                  )}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    {hasEventUpdateAccess && (
                      <>
                        <Link href={`/admin/events/edit?id=${event._id}`}>
                          <button className="rounded-full bg-white p-2 shadow-md hover:bg-gray-100">
                            <PencilIcon className="h-5 w-5 text-gray-600" />
                          </button>
                        </Link>
                        <button
                          className="rounded-full bg-white p-2 shadow-md hover:bg-gray-100"
                          onClick={() => handleDeleteEvent(event._id)}
                        >
                          <TrashBinIcon className="h-5 w-5 text-red-500" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-indigo-500 dark:text-indigo-400">
                      {new Date(event.eventDate) > new Date()
                        ? "Upcoming Event"
                        : "Successful Event"}
                    </p>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {event.name}
                    </h3>
                    <div className="mb-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <FiCalendar className="mr-2" />
                      <span>
                        {new Date(event.eventDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="mb-4 h-20 overflow-hidden text-sm text-gray-600 dark:text-gray-300">
                      {event.description}
                    </p>
                  </div>
                  <div className="flex items-center border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <FiUser className="mr-2" />
                    <span>
                      By: <span className="font-medium">Admin</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-white py-20 text-center shadow-md dark:bg-gray-800">
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-white">
              No Events Scheduled
            </h2>
            <p className="text-md mt-2 text-gray-500 dark:text-gray-400">
              Please check back later for exciting new events!
            </p>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={isOpen}
        onClose={closeModal}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to permanently delete this event? This action cannot be undone and all event data will be lost."
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
};

export default EventsPage;

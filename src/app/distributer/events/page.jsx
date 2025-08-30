"use client";
import { setLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FiCalendar, FiUser } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";

const EventsPage = () => {
  const { token } = useSelector((state) => state.auth);
  const [events, setEvents] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchEvents = async () => {
      dispatch(setLoading(true));
      try {
        const data = await fetchWithError("/api/events", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEvents(data);
      } catch (error) {
        // fetchWithError already toasts
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchEvents();
  }, [token, dispatch]);

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
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-indigo-500 subpixel-antialiased dark:text-indigo-400">
                      {new Date(event.eventDate) > new Date()
                        ? "Upcoming Event"
                        : "Successful Event"}
                    </p>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900 subpixel-antialiased dark:text-white">
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
            <h2 className="text-2xl font-semibold text-gray-700 subpixel-antialiased dark:text-white">
              No Events Scheduled
            </h2>
            <p className="text-md mt-2 text-gray-500 dark:text-gray-400">
              Please check back later for exciting new events!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;

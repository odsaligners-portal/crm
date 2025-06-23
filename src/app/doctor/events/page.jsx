'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';

const EventsPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/events', { // Use the new admin route
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setEvents(data);
                } else if (response.status === 401) {
                    toast.error("You must be logged in to view events.");
                } else {
                    toast.error('Failed to fetch events.');
                }
            } catch (error) {
                toast.error('An error occurred while fetching events.');
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <FaSpinner className="animate-spin text-4xl text-indigo-500" />
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading Events...</p>
            </div>
        );
    }

    // Combine featured and other events for grid
    const allEvents = events;

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-gray-900 dark:text-white">Our Events</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">Join us for our upcoming events and connect with the community.</p>
                </header>

                {allEvents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {allEvents.map((event) => (
                            <div key={event._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                                <div className="relative h-56 w-full">
                                    {event.image.fileType === 'video' ? (
                                        <video
                                            src={event.image.fileUrl}
                                            controls
                                            className="w-full h-full object-cover rounded-t-2xl"
                                            style={{ height: '100%', width: '100%' }}
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
                                <div className="p-6 flex flex-col flex-1 justify-between">
                                    <div>
                                        <p className="text-sm text-indigo-500 dark:text-indigo-400 font-bold mb-2">
                                            {new Date(event.eventDate) > new Date() ? 'Upcoming Event' : 'Successful Event'}
                                        </p>
                                        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{event.name}</h3>
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                                            <FiCalendar className="mr-2" />
                                            <span>{new Date(event.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm h-20 overflow-hidden">{event.description}</p>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center">
                                        <FiUser className="mr-2" />
                                        <span>By: <span className="font-medium">Admin</span></span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-white">No Events Scheduled</h2>
                        <p className="text-md text-gray-500 dark:text-gray-400 mt-2">Please check back later for exciting new events!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsPage;
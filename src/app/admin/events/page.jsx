'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { PencilIcon, TrashBinIcon } from '@/icons';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useModal } from '@/hooks/useModal';

const EventsPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventToDelete, setEventToDelete] = useState(null);
    const { isOpen, openModal, closeModal } = useModal();
    const [modalLoading, setModalLoading] = useState(false);

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

    // Delete event handler
    const handleDeleteEvent = (eventId) => {
        setEventToDelete(eventId);
        openModal();
    };

    const confirmDelete = async () => {
        if (!eventToDelete) return;
        setModalLoading(true);
        try {
            const response = await fetch(`/api/admin/events?id=${eventToDelete}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                setEvents((prev) => prev.filter((e) => e._id !== eventToDelete));
                toast.success('Event deleted successfully.');
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to delete event.');
            }
        } catch (error) {
            toast.error('An error occurred while deleting the event.');
        } finally {
            setModalLoading(false);
            setEventToDelete(null);
            closeModal();
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
                <FaSpinner className="animate-spin text-4xl text-indigo-500" />
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Loading Events...</p>
            </div>
        );
    }

    const featuredEvent = events[0];
    const otherEvents = events.slice(1);

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
                                    <Image
                                        src={event.image.fileUrl}
                                        alt={event.name}
                                        layout="fill"
                                        objectFit="cover"
                                        className="transition-transform duration-500 hover:scale-105"
                                    />
                                    <div className="absolute top-4 right-4 flex space-x-2">
                                        <Link href={`/admin/events/edit?id=${event._id}`}>
                                            <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100">
                                                <PencilIcon className="h-5 w-5 text-gray-600" />
                                            </button>
                                        </Link>
                                        <button
                                            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                                            onClick={() => handleDeleteEvent(event._id)}
                                        >
                                            <TrashBinIcon className="h-5 w-5 text-red-500" />
                                        </button>
                                    </div>
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
            <ConfirmationModal
                isOpen={isOpen}
                onClose={() => { if (!modalLoading) { setEventToDelete(null); closeModal(); } }}
                onConfirm={confirmDelete}
                title="Delete Event"
                message="Are you sure you want to permanently delete this event? This action cannot be undone and all event data will be lost."
                confirmButtonText={modalLoading ? 'Deleting...' : 'Delete'}
                cancelButtonText="Cancel"
                confirmButtonProps={{ disabled: modalLoading }}
                cancelButtonProps={{ disabled: modalLoading }}
            />
        </div>
    );
};

export default EventsPage;
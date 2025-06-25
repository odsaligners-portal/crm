'use client';
import ConfirmationModal from '@/components/common/ConfirmationModal';
import { useModal } from '@/hooks/useModal';
import { PencilIcon, TrashBinIcon } from '@/icons';
import { setLoading } from '@/store/features/uiSlice';
import { fetchWithError } from '@/utils/apiErrorHandler';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { MdAdd } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

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
                const data = await fetchWithError('/api/events', { // Use the new admin route
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
                const data = await fetchWithError('/api/user/profile', {
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
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setEvents((prev) => prev.filter((e) => e._id !== eventToDelete));
            toast.success('Event deleted successfully.');
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
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-2 text-gray-900 dark:text-white">Our Events</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300">Join us for our upcoming events and connect with the community.</p>
                    {hasEventUpdateAccess && (
                        <button
                            onClick={() => router.push('/admin/add-event')}
                            className="mt-6 flex items-center justify-center px-5 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white font-semibold rounded-lg shadow-md hover:scale-105 transition-transform mx-auto"
                        >
                            <MdAdd className="mr-2 text-lg" /> Add Event
                        </button>
                    )}
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
                                    <div className="absolute top-4 right-4 flex space-x-2">
                                        {hasEventUpdateAccess && (
                                            <>
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
                                            </>
                                        )}
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
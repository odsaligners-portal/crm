"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { setNotifications, markAsRead } from '@/store/features/notificationSlice';
import { fetchWithError } from '@/utils/apiErrorHandler';
import { setLoading } from '@/store/features/uiSlice';

export default function DoctorNotificationsPage() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const notifications = useSelector((state) => state.notification.notifications);
  const [error, setError] = useState(null);
  const [creatorNames, setCreatorNames] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalComment, setModalComment] = useState(null);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      dispatch(setLoading(true));
      setError(null);
      try {
        const data = await fetchWithError("/api/notifications", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        dispatch(setNotifications(data.notifications || []));
        // Fetch creator names for doctor notifications (one by one)
        const doctorIds = Array.from(new Set((data.notifications || [])
          .filter(n => n.commentedBy && n.commentedBy !== 'admin')
          .map(n => n.commentedBy)));
        const nameMap = {};
        for (const id of doctorIds) {
          if (!creatorNames[id]) {
            try {
              const userData = await fetchWithError(`/api/user/profile?id=${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (userData.user && userData.user.name) {
                nameMap[id] = userData.user.name;
              }
            } catch (e) {}
          } else {
            nameMap[id] = creatorNames[id];
          }
        }
        if (Object.keys(nameMap).length > 0) setCreatorNames(prev => ({ ...prev, ...nameMap }));
      } catch (err) {
        setError(err.message || "Failed to fetch notifications");
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [token, dispatch]);

  const handleViewComment = async (patientCommentId, commentId, notificationId) => {
    setModalOpen(true);
    setModalError(null);
    setModalComment(null);
    try {
      dispatch(setLoading(true));
      const data = await fetchWithError(`/api/patients/comments?patientCommentId=${patientCommentId}&commentId=${commentId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
      });
      setModalComment(data.comment);
      // Mark notification as read
      if (notificationId) {
        await fetchWithError('/api/notifications', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ notificationId }),
        });
        dispatch(markAsRead(notificationId));
      }
    } catch (err) {
      setModalError(err.message || 'Failed to fetch comment details');
    } finally {
      dispatch(setLoading(false));
    }
  };
  function getCreatorLabel(n) {
    if (!n.commentedBy || n.commentedBy === 'admin') return 'Admin';
    const name = creatorNames[n.commentedBy];
    return name ? `Doctor: ${name}` : 'Doctor';
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      {error ? (
        <div className="text-red-500">{error}</div>
      ) : notifications.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <div className="space-y-4">
          {notifications
            .slice()
            .sort((a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1))
            .map((n, idx) => (
              <div
                key={n._id}
                className={`relative group p-2 md:p-3 rounded-xl flex items-center justify-between transition-all duration-300 cursor-pointer
                  ${n.read
                    ? "bg-white/60 backdrop-blur-md border border-gray-200/70 shadow-md hover:shadow-lg hover:-translate-y-1"
                    : "bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-transparent bg-clip-padding shadow-xl hover:scale-[1.025] hover:shadow-blue-200 animate-fade-in"}
                `}
                style={
                  !n.read
                    ? {
                        borderImage: 'linear-gradient(135deg, #3b82f6 0%, #a78bfa 100%) 1',
                        boxShadow: '0 4px 24px 0 rgba(59,130,246,0.10), 0 1.5px 8px 0 rgba(168,139,250,0.10)'
                      }
                    : {
                        background: 'rgba(255,255,255,0.6)',
                        border: '1.5px solid rgba(209,213,219,0.7)',
                        boxShadow: '0 2px 12px 0 rgba(156,163,175,0.10)'
                      }
                }
              >
                <div className="flex items-start gap-2">
                  {/* Unread blue dot indicator with glow */}
                  {!n.read && (
                    <span className="mt-1 w-2.5 h-2.5 bg-gradient-to-tr from-blue-500 to-purple-400 rounded-full inline-block shadow-[0_0_8px_1px_rgba(59,130,246,0.4)] animate-pulse"></span>
                  )}
                  {/* Read check icon */}
                  {n.read && (
                    <svg className="mt-1 w-3 h-3 text-green-400 opacity-70" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  )}
                  <div>
                    <div className={`text-sm md:text-base ${n.read ? "font-medium text-gray-700" : "font-bold text-blue-900"}`}>{n.title}</div>
                    <div className="text-[11px] md:text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString()}</div>
                    <div className="text-[11px] md:text-xs text-gray-600 mt-0.5">Created by: {getCreatorLabel(n)}</div>
                    <button
                      className={`mt-2 px-2 py-1 rounded text-[11px] md:text-xs font-semibold shadow transition-all duration-200
                        ${n.read
                          ? "bg-gray-200/80 text-gray-500 hover:bg-gray-300/90 hover:text-gray-700"
                          : "bg-gradient-to-r from-blue-600 to-purple-500 text-white hover:from-blue-700 hover:to-purple-600 shadow-lg hover:shadow-xl"}
                      `}
                      onClick={() => handleViewComment(n.patientCommentId, n.commentId, n._id)}
                    >
                        View Comment
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end min-w-[40px]">
                  {n.read ? (
                    <span className="text-[11px] text-gray-400 font-medium tracking-wide">Read</span>
                  ) : (
                    <span className="text-[11px] text-blue-600 font-bold tracking-wide animate-pulse">Unread</span>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-2xl w-full" showCloseButton={false} alignTop={true}>
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/50 shadow-2xl backdrop-blur-lg border border-white/20 flex flex-col max-h-[75vh]">
          {/* Header */}
          <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700/50 shrink-0">
            <h2 className="text-2xl font-extrabold text-blue-800 dark:text-white/90 tracking-tight flex items-center justify-center gap-3">
              <ChatBubbleLeftRightIcon className="h-7 w-7" />
              Comments
            </h2>
            {modalComment && (
              <>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                  For patient: <span className="font-bold text-purple-600 dark:text-purple-400">{modalComment.patientName}</span>
                </p>
              </>
            )}
          </div>
          {/* Content Body */}
          <div className="p-6 overflow-y-auto flex-grow">
            {modalError ? (
              <div className="text-red-500">{modalError}</div>
            ) : modalComment ? (
              <div className="p-4 mb-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex justify-between items-baseline mb-2">
                  <p className="font-bold text-gray-800 dark:text-white">
                    Commented By: {modalComment.commentedBy?.name || modalComment.commentedBy?.userType || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {modalComment.datetime ? new Date(modalComment.datetime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''}
                  </p>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <span dangerouslySetInnerHTML={{ __html: modalComment.comment }} />
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-gray-500">No comment found.</div>
            )}
          </div>
          {/* Footer */}
          <div className="p-6 flex justify-end border-t border-gray-200 dark:border-gray-700/50 shrink-0">
            <Button
              type="button"
              onClick={() => setModalOpen(false)}
              variant="secondary"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg shadow-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
            >
              <XMarkIcon className="h-5 w-5" />
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 
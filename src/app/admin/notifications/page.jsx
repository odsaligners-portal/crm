"use client";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button/Button';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

export default function NotificationsPage() {
  const { token } = useSelector((state) => state.auth);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatorNames, setCreatorNames] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalComment, setModalComment] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/notifications", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        setNotifications(data.notifications || []);
        
        // Fetch creator names for doctor notifications (one by one)
        const doctorIds = Array.from(new Set((data.notifications || [])
          .filter(n => n.commentedBy && n.commentedBy !== 'admin')
          .map(n => n.commentedBy)));
        const nameMap = {};
        for (const id of doctorIds) {
          if (!creatorNames[id]) {
            const userRes = await fetch(`/api/user/profile?id=${id}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              if (userData.user && userData.user.name) {
                nameMap[id] = userData.user.name;
              }
            }
          } else {
            nameMap[id] = creatorNames[id];
          }
        }
        if (Object.keys(nameMap).length > 0) setCreatorNames(prev => ({ ...prev, ...nameMap }));
      } catch (err) {
        setError(err.message || "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [token]);
 
  const handleViewComment = async (patientCommentId, commentId) => {
    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    setModalComment(null);
    
    try {
      const res = await fetch(`/api/patients/comments?patientCommentId=${patientCommentId}&commentId=${commentId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
      if (!res.ok) throw new Error('Failed to fetch comment details');
      const data = await res.json();
      setModalComment(data.comment);
    } catch (err) {
      setModalError(err.message || 'Failed to fetch comment details');
    } finally {
      setModalLoading(false);
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
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : notifications.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-lg shadow flex items-center justify-between ${n.read ? "bg-gray-100" : "bg-blue-50 border-l-4 border-blue-500"}`}
            >
              <div>
                <div className="font-semibold text-lg">{n.title}</div>
                <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
                <div className="text-xs text-gray-700 mt-1">Created by: {getCreatorLabel(n)}</div>
                <button
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  onClick={() => handleViewComment(n.patientCommentId, n.commentId)}
                >
                    View Comment
                </button>
              </div>
              <div>
                {n.read ? (
                  <span className="text-xs text-gray-400">Read</span>
                ) : (
                  <span className="text-xs text-blue-600 font-bold">Unread</span>
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
            {modalLoading ? (
              <div className="text-center p-8">Loading comments...</div>
            ) : modalError ? (
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

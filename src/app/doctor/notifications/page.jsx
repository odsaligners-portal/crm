"use client";

import {
  markAsRead,
  setNotifications,
} from "@/store/features/notificationSlice";
import { setLoading as setGlobalLoading } from "@/store/features/uiSlice";
import { fetchWithError } from "@/utils/apiErrorHandler";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const notifications = useSelector(
    (state) => state.notification.notifications,
  );

  const [creatorNames, setCreatorNames] = useState({});

  // Detect if the current user has read a notification
  const isNotificationRead = (notification) => {
    return (
      notification.recipients?.find((r) => r.id === user?.id)?.read === true
    );
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      dispatch(setGlobalLoading(true));
      try {
        const data = await fetchWithError("/api/notifications", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const notifications = data.notifications || [];
        dispatch(setNotifications(notifications));

        const nameMap = {};
        notifications.forEach((n) => {
          const { commentedBy } = n;
          if (commentedBy?.id && commentedBy.name) {
            nameMap[commentedBy.id] = commentedBy.name;
          }
        });

        setCreatorNames((prev) => ({ ...prev, ...nameMap }));
      } catch (err) {
        // Toast handled inside fetchWithError
      } finally {
        dispatch(setGlobalLoading(false));
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 300000); // 5 min
    return () => clearInterval(interval);
  }, [token, dispatch]);

  const handleMarkAsRead = async (notificationId) => {
    if (!notificationId) return;
    dispatch(setGlobalLoading(true));
    try {
      await fetchWithError("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });
      dispatch(markAsRead({ notificationId, userId: user?.id }));
    } catch (err) {
      // optional toast
    } finally {
      dispatch(setGlobalLoading(false));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Notifications</h1>
      {notifications.length === 0 ? (
        <div>No notifications found.</div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n) => {
            const isRead = n.recipients?.find((r) => r.user === user.id)?.read;
            return (
              <div
                key={n._id}
                className={`group relative flex items-center justify-between rounded-xl p-3 transition-all duration-300 ${
                  isRead
                    ? "border border-gray-200/70 bg-white/60 shadow-md backdrop-blur-md hover:-translate-y-1 hover:shadow-lg"
                    : "animate-fade-in border-2 border-transparent bg-gradient-to-br from-blue-50 via-white to-purple-50 bg-clip-padding shadow-xl hover:scale-[1.025] hover:shadow-blue-200"
                }`}
              >
                <div className="flex items-start gap-2">
                  {!isRead ? (
                    <span className="mt-1 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-gradient-to-tr from-blue-500 to-purple-400 shadow-[0_0_8px_1px_rgba(59,130,246,0.4)]"></span>
                  ) : (
                    <svg
                      className="mt-1 h-3 w-3 text-green-400 opacity-70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  <div>
                    <div
                      className={`text-sm md:text-base ${
                        isRead
                          ? "font-medium text-gray-700"
                          : "font-bold text-blue-900"
                      }`}
                    >
                      {n.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-400 md:text-xs">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-600 md:text-xs">
                      Created by:{" "}
                      {creatorNames[n.commentedBy?.id] ||
                        n.commentedBy?.name ||
                        "Unknown"}
                    </div>

                    {!isRead && (
                      <button
                        className="mt-2 rounded bg-gradient-to-r from-blue-600 to-purple-500 px-3 py-1 text-xs font-semibold text-white shadow-lg transition hover:from-blue-700 hover:to-purple-600 hover:shadow-xl"
                        onClick={() => handleMarkAsRead(n._id)}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex min-w-[40px] flex-col items-end">
                  <span
                    className={`text-[11px] font-bold tracking-wide ${
                      isRead
                        ? "font-medium text-gray-400"
                        : "animate-pulse text-blue-600"
                    }`}
                  >
                    {isRead ? "Read" : "Unread"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

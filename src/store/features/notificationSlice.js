import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  notifications: [],
  unreadCount: 0,
  userId: null, 
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;

      // Calculate unread count for current user
      state.unreadCount = action.payload.reduce((count, notif) => {
        const recipient = notif.recipients?.find(
          (r) => r.user === localStorage.getItem("userId"),
        );
        return recipient && !recipient.read ? count + 1 : count;
      }, 0);
    },

    markAsRead: (state, action) => {
      const { notificationId, userId } = action.payload; 
      const notif = state.notifications.find((n) => n._id === notificationId);
      if (notif) {
        const recipient = notif.recipients?.find(
          (read) => read.user === userId,
        );
        if (recipient && !recipient.read) {
          recipient.read = true;

          // Recalculate unread count
          state.unreadCount = state.notifications.reduce((count, notif) => {
            const recipient = notif.recipients?.find(
              (r) => r.user === userId,
            );
            return recipient && !recipient.read ? count + 1 : count;
          }, 0);
        }
      }
    },

    setUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },

    setNotificationUserId: (state, action) => {
      state.userId = action.payload; // set once after login
    },
  },
});

export const {
  setNotifications,
  markAsRead,
  setUnreadCount,
  setNotificationUserId,
} = notificationSlice.actions;

export default notificationSlice.reducer;

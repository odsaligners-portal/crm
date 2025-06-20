import { createSlice } from '@reduxjs/toolkit';

// Load initial state from localStorage if available
const loadState = () => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
    };
  }

  try {
    const serializedUser = localStorage.getItem('user');
    const serializedToken = localStorage.getItem('token');
    return {
      user: serializedUser ? JSON.parse(serializedUser) : null,
      token: serializedToken || null,
    };
  } catch (err) {
    return {
      user: null,
      token: null,
    };
  }
};

const initialState = loadState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      }

      // Set cookies
      const maxAge = 30 * 24 * 60 * 60; // 30 days
      document.cookie = `token=${action.payload.token}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
      document.cookie = `userRole=${action.payload.user.role}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }

      // Clear cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer; 
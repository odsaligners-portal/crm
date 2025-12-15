import { createSlice } from "@reduxjs/toolkit";

// Load initial state from localStorage if available
const loadState = () => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      role: null,
    };
  }

  try {
    const serializedUser = localStorage.getItem("user");
    const serializedToken = localStorage.getItem("token");
    const serializedRole = localStorage.getItem("role");

    let parsedUser = null;
    if (serializedUser) {
      try {
        parsedUser = JSON.parse(serializedUser);
        // Ensure it's a plain object, not a class instance or function
        parsedUser = JSON.parse(JSON.stringify(parsedUser));
      } catch (parseError) {
        console.error("Error parsing user from localStorage:", parseError);
        parsedUser = null;
      }
    }

    return {
      user: parsedUser,
      token: serializedToken || null,
      role: serializedRole || null,
    };
  } catch (err) {
    console.error("Error loading state from localStorage:", err);
    return {
      user: null,
      token: null,
      role: null,
    };
  }
};

const initialState = loadState();

// Helper function to sanitize user object for serialization
const sanitizeUser = (user) => {
  if (!user) return null;

  // Create a plain object, removing any non-serializable properties
  const sanitized = JSON.parse(JSON.stringify(user));
  return sanitized;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      // Sanitize user object to ensure it's serializable
      const sanitizedUser = sanitizeUser(action.payload.user);
      state.user = sanitizedUser;
      state.token = action.payload.token;
      state.role = sanitizedUser?.role || action.payload.user?.role;

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(sanitizedUser));
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("role", state.role);
      }

      // Set cookies
      if (typeof window !== "undefined") {
        const maxAge = 30 * 24 * 60 * 60; // 30 days
        document.cookie = `token=${action.payload.token}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
        document.cookie = `userRole=${state.role}; path=/; max-age=${maxAge}; SameSite=Strict; Secure`;
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }

      // Clear cookies
      document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      document.cookie =
        "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

import { createSlice } from "@reduxjs/toolkit";

// Helper function to recursively convert all _id fields and objects to primitives
const convertIdsToStrings = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(convertIdsToStrings);
  }
  if (typeof obj === "object") {
    // Check if it's a Date object
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    // Check if it has a toString method (like ObjectId) and is not a plain object
    if (
      obj.toString &&
      typeof obj.toString === "function" &&
      obj.constructor &&
      obj.constructor.name !== "Object"
    ) {
      return String(obj);
    }
    const result = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key === "_id" && obj[key] && typeof obj[key] === "object") {
          // If _id is an object (like ObjectId), convert to string
          result[key] = String(obj[key]);
        } else {
          result[key] = convertIdsToStrings(obj[key]);
        }
      }
    }
    return result;
  }
  return obj;
};

// Helper function to sanitize user object for serialization
const sanitizeUser = (user) => {
  if (!user) return null;

  try {
    // First, convert to JSON string and back to remove any non-serializable properties
    let sanitized = JSON.parse(JSON.stringify(user));

    // Recursively ensure all _id fields and nested objects are properly converted
    sanitized = convertIdsToStrings(sanitized);
    return sanitized;
  } catch (error) {
    console.error("Error sanitizing user object:", error);
    return null;
  }
};

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
        // Sanitize the user object to ensure all nested objects are primitives
        parsedUser = sanitizeUser(parsedUser);
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
      if (typeof window !== "undefined") {
        document.cookie =
          "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        document.cookie =
          "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
      }
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;

import jwt from "jsonwebtoken";
import User from "../models/User";

export const protect = async (req) => {
  try {
    const authorization = req.headers.get("authorization");
    if (!authorization || !authorization.startsWith("Bearer ")) {
      return { success: false, error: "Not authorized to access this route" };
    }
    const token = authorization.split(" ")[1];

    if (!token) {
      return {
        success: false,
        error: "Not authorized to access this route",
      };
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return {
          success: false,
          error: "User not found",
        };
      }

      // Check if account is suspended (only for doctors, not admins)
      if (user.role === "doctor" && user.isSuspended) {
        return {
          success: false,
          error:
            "Your account has been suspended. Please contact the administrator.",
          isSuspended: true,
        };
      }

      return {
        success: true,
        user,
      };
    } catch (err) {
      return {
        success: false,
        error: "Not authorized to access this route",
        err: err.message,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export const admin = async (req) => {
  try {
    const authResult = await protect(req);
    if (!authResult.success) {
      return authResult;
    }
    if (authResult.user.role !== "admin") {
      return {
        success: false,
        error: "Not authorized as an admin",
      };
    }

    return {
      success: true,
      user: authResult.user,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export async function verifyAuth(request) {
  try {
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return { success: false, error: "No token provided" };
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: "Invalid token", err: error };
  }
}

export default { protect, admin };

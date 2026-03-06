import { NextResponse } from "next/server";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";

export async function GET(req) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json(
        { isSuperAdmin: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Check if user is superadmin (compare as strings; support both env vars)
    const superadminId =
      process.env.SUPER_ADMIN_ID ||
      process.env.NEXT_PUBLIC_SUPER_ADMIN_ID ||
      "";
    const userId = authResult.user?.id ?? authResult.user?._id ?? "";
    const isSuperAdmin =
      !!superadminId && String(userId).trim() === String(superadminId).trim();

    return NextResponse.json({
      isSuperAdmin,
      success: true,
    });
  } catch (error) {
    console.error("Error checking superadmin status:", error);
    return NextResponse.json(
      { isSuperAdmin: false, message: "Server error" },
      { status: 500 },
    );
  }
}

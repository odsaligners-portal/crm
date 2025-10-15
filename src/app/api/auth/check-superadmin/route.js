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

    // Check if user is superadmin
    const superadminId = process.env.NEXT_PUBLIC_SUPER_ADMIN_ID;
    const isSuperAdmin = superadminId && authResult.user.id === superadminId;

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

import dbConnect from "@/app/api/config/db";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import Notification from "@/app/api/models/Notification";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();

    const authResult = await verifyAuth(req);
    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.user.id;

    const notifications = await Notification.find({
      recipients: {
        $elemMatch: {
          user: userId,
        },
      },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ success: true, notifications });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(req) {

  await dbConnect();

  const authResult = await verifyAuth(req);

  if (!authResult.success) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = authResult.user.id;

  try {

    const { notificationId } = await req.json();

    if (!notificationId) {
      return NextResponse.json(
        { message: "Notification ID is required" },
        { status: 400 },
      );
    }
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        "recipients.user": userId,
      },
      {
        $set: { "recipients.$.read": true },
      },
      { new: true },
    );

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ success: true, notification });
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "Failed to update notification" },
      { status: 500 },
    );
  }
}

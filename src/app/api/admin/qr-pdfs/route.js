import { NextResponse } from "next/server";
import dbConnect from "@/app/api/config/db";
import QrPdf from "@/app/api/models/QrPdf";
import { verifyAuth } from "@/app/api/middleware/authMiddleware";
import { app } from "@/utils/firebase";
import { deleteObject, getStorage, ref } from "firebase/storage";

const storage = getStorage(app);

const isSuperAdminUser = (userId) => {
  const superAdminId =
    process.env.SUPER_ADMIN_ID || process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || "";
  return (
    !!superAdminId && String(userId).trim() === String(superAdminId).trim()
  );
};

const verifySuperAdmin = async (request) => {
  const authResult = await verifyAuth(request);

  if (!authResult.success || authResult.user.role !== "admin") {
    return { success: false, status: 401, message: "Unauthorized" };
  }

  const userId = authResult.user?.id ?? authResult.user?._id;
  if (!isSuperAdminUser(userId)) {
    return {
      success: false,
      status: 403,
      message: "Only super admin can manage QR PDFs",
    };
  }

  return { success: true, userId };
};

export async function GET(request) {
  try {
    const adminCheck = await verifySuperAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { message: adminCheck.message },
        { status: adminCheck.status },
      );
    }

    await dbConnect();
    const records = await QrPdf.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ records }, { status: 200 });
  } catch (error) {
    console.error("Error fetching QR PDFs:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const adminCheck = await verifySuperAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { message: adminCheck.message },
        { status: adminCheck.status },
      );
    }

    await dbConnect();
    const { title, pdf } = await request.json();

    if (!title?.trim() || !pdf?.fileUrl || !pdf?.fileKey || !pdf?.fileName) {
      return NextResponse.json(
        { message: "Title and uploaded PDF are required" },
        { status: 400 },
      );
    }

    const record = await QrPdf.create({
      title: title.trim(),
      pdf: {
        fileUrl: pdf.fileUrl,
        fileKey: pdf.fileKey,
        fileName: pdf.fileName,
        fileSize: Number(pdf.fileSize || 0),
      },
      createdBy: adminCheck.userId,
      updatedBy: adminCheck.userId,
    });

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    console.error("Error creating QR PDF:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const adminCheck = await verifySuperAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { message: adminCheck.message },
        { status: adminCheck.status },
      );
    }

    await dbConnect();
    const { id, title, pdf } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const existing = await QrPdf.findById(id);
    if (!existing) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 });
    }

    if (title?.trim()) {
      existing.title = title.trim();
    }

    if (pdf?.fileUrl && pdf?.fileKey && pdf?.fileName) {
      const oldFileKey = existing.pdf?.fileKey;
      existing.pdf = {
        fileUrl: pdf.fileUrl,
        fileKey: pdf.fileKey,
        fileName: pdf.fileName,
        fileSize: Number(pdf.fileSize || 0),
      };
      if (oldFileKey && oldFileKey !== pdf.fileKey) {
        const oldPdfRef = ref(storage, oldFileKey);
        await deleteObject(oldPdfRef).catch(() => null);
      }
    }

    existing.updatedBy = adminCheck.userId;
    await existing.save();

    return NextResponse.json({ record: existing }, { status: 200 });
  } catch (error) {
    console.error("Error updating QR PDF:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const adminCheck = await verifySuperAdmin(request);
    if (!adminCheck.success) {
      return NextResponse.json(
        { message: adminCheck.message },
        { status: adminCheck.status },
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const existing = await QrPdf.findById(id);
    if (!existing) {
      return NextResponse.json({ message: "Record not found" }, { status: 404 });
    }

    if (existing.pdf?.fileKey) {
      const pdfRef = ref(storage, existing.pdf.fileKey);
      await deleteObject(pdfRef).catch(() => null);
    }

    await QrPdf.findByIdAndDelete(id);
    return NextResponse.json(
      { message: "Record deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting QR PDF:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

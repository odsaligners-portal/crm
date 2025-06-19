import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function POST(req: NextRequest) {
  const { key } = await req.json();
  if (!key) return NextResponse.json({ error: "No key provided" }, { status: 400 });
  const result = await utapi.deleteFiles(key);
  return NextResponse.json(result);
} 
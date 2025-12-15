import { NextResponse } from "next/server";

/**
 * Cron job endpoint handler
 * This endpoint can be called by external cron services (Vercel Cron, cron-job.org, etc.)
 *
 * Usage:
 * - Weekly pending approval: POST /api/cron?job=pending-approval
 * - Monthly reminder: POST /api/cron?job=monthly-reminder
 * - Case expiry reminder (30 days): POST /api/cron?job=expiry-reminder&daysBefore=30
 * - Case expiry notification (0 days): POST /api/cron?job=expiry-reminder&daysBefore=0
 */

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const job = searchParams.get("job");
    const daysBefore = searchParams.get("daysBefore");

    // Verify cron secret key or Vercel cron header
    const authHeader = req.headers.get("authorization");
    const vercelCronHeader = req.headers.get("x-vercel-cron");
    const cronSecret =
      process.env.NEXT_PUBLIC_CRON_SECRET_KEY || "cron-secret-key";

    // Allow Vercel cron jobs (they send x-vercel-cron header) or valid auth token
    const isVercelCron = vercelCronHeader === "1";
    const isValidAuth = authHeader && authHeader === `Bearer ${cronSecret}`;

    if (!isVercelCron && !isValidAuth) {
      return NextResponse.json(
        {
          error: "Unauthorized - Invalid cron secret or not a Vercel cron job",
        },
        { status: 401 },
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: "Job parameter is required" },
        { status: 400 },
      );
    }

    let response;
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";

    switch (job) {
      case "pending-approval":
        response = await fetch(
          `${baseUrl}/api/notifications/pending-approval`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cronSecret}`,
            },
          },
        );
        break;

      case "monthly-reminder":
        response = await fetch(
          `${baseUrl}/api/notifications/monthly-reminder`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cronSecret}`,
            },
          },
        );
        break;

      case "expiry-reminder":
        const days = daysBefore ? parseInt(daysBefore, 10) : 30;
        response = await fetch(
          `${baseUrl}/api/notifications/case-expiry-reminder`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cronSecret}`,
            },
            body: JSON.stringify({ daysBefore: days }),
          },
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown job: ${job}` },
          { status: 400 },
        );
    }

    const data = await response.json();
    return NextResponse.json({
      success: response.ok,
      job,
      result: data,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// Also support GET for easier testing
export async function GET(req) {
  return POST(req);
}

# How Cron Jobs Work - Complete Workflow

This document explains the complete flow of how all cron jobs work in the system.

## Overview

The cron system consists of 4 automated email notification jobs that run on different schedules:

1. **Pending Approval Cases** - Weekly (Monday 3:00 PM IST)
2. **Monthly Follow-Up Reminder** - Monthly (1st of every month at 3:00 PM IST)
3. **Case Expiry Reminder (30 days)** - Daily (3:00 PM IST)
4. **Case Expiry Notification (0 days)** - Daily (3:00 PM IST)

---

## Complete Workflow

### Step 1: Vercel Cron Scheduler

When you deploy to Vercel, the `vercel.json` file automatically registers cron jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron?job=pending-approval",
      "schedule": "30 9 * * 1" // Every Monday at 9:30 AM UTC (3:00 PM IST)
    },
    {
      "path": "/api/cron?job=monthly-reminder",
      "schedule": "30 9 1 * *" // 1st of every month at 9:30 AM UTC
    },
    {
      "path": "/api/cron?job=expiry-reminder&daysBefore=30",
      "schedule": "30 9 * * *" // Every day at 9:30 AM UTC
    },
    {
      "path": "/api/cron?job=expiry-reminder&daysBefore=0",
      "schedule": "30 9 * * *" // Every day at 9:30 AM UTC
    }
  ]
}
```

**What happens:**

- Vercel's cron service automatically calls these endpoints at the scheduled times
- Vercel adds a special header `x-vercel-cron: 1` to authenticate the request
- No manual setup required after deployment

---

### Step 2: Cron Router (`/api/cron`)

When Vercel calls the cron endpoint, it hits `/api/cron/route.js`:

**Flow:**

1. **Authentication Check:**

   ```javascript
   // Checks for Vercel cron header OR valid auth token
   const vercelCronHeader = req.headers.get("x-vercel-cron");
   const isVercelCron = vercelCronHeader === "1";
   ```

   - ✅ If `x-vercel-cron: 1` → Authenticated (from Vercel)
   - ✅ If `Authorization: Bearer <SECRET>` → Authenticated (external cron)
   - ❌ Otherwise → Rejected (401 Unauthorized)

2. **Job Routing:**

   ```javascript
   switch (job) {
     case "pending-approval":
     // Calls /api/notifications/pending-approval
     case "monthly-reminder":
     // Calls /api/notifications/monthly-reminder
     case "expiry-reminder":
     // Calls /api/notifications/case-expiry-reminder
   }
   ```

3. **Internal API Call:**
   - Makes a POST request to the specific notification API
   - Passes the cron secret key for authentication
   - Returns the result

---

### Step 3: Notification API Routes

Each notification API route handles the actual email sending:

#### 3.1 Pending Approval Cases (`/api/notifications/pending-approval`)

**What it does:**

1. Queries database for all cases with `caseStatus: "approval pending"`
2. Groups cases by doctor
3. Gets all admins and distributers
4. Sends emails:
   - **Doctors:** Only their pending cases
   - **Admins:** All pending cases
   - **Distributers:** All pending cases

**Email Template:** `getPendingApprovalEmailTemplate()`

- Shows count of pending cases
- Lists all pending cases with patient name, case ID, and registration date
- Includes link to review cases

**Schedule:** Every Monday at 3:00 PM IST

---

#### 3.2 Monthly Reminder (`/api/notifications/monthly-reminder`)

**What it does:**

1. Queries database for all active cases:
   - `caseStatus: "approved"`
   - Has `caseStartDate` and `caseEndDate`
   - `caseEndDate` is in the future (not expired)
2. For each case, sends reminder email to the doctor

**Email Template:** `getMonthlyReminderEmailTemplate()`

- Reminds doctor to follow up on treatment progress
- Requests clinical images and progress comments
- Mentions aligner batch requests
- Notes processing time (5-7 working days)

**Schedule:** 1st of every month at 3:00 PM IST

---

#### 3.3 Case Expiry Reminder - 30 Days (`/api/notifications/case-expiry-reminder?daysBefore=30`)

**What it does:**

1. Calculates target date: Today + 30 days
2. Queries database for cases expiring exactly in 30 days:
   - `caseStatus: "approved"`
   - `caseEndDate` matches the target date
3. Sends reminder email to each doctor

**Email Template:** `getCaseExpiryReminderEmailTemplate()`

- Warns that case expires in 30 days
- Reminds about complimentary revisions (Premium/Elite packages)
- Notes that cases after expiry will be treated as new
- Mentions that remaining aligners will lapse

**Schedule:** Daily at 3:00 PM IST (checks for cases expiring in 30 days)

---

#### 3.4 Case Expiry Notification - Today (`/api/notifications/case-expiry-reminder?daysBefore=0`)

**What it does:**

1. Gets today's date
2. Queries database for cases expiring today:
   - `caseStatus: "approved"`
   - `caseEndDate` is today
3. Sends expiry notification email to each doctor

**Email Template:** `getCaseExpiredEmailTemplate()`

- Notifies that case has expired and is closed
- States no further revisions can be submitted
- Mentions that new treatment requires a fresh case

**Schedule:** Daily at 3:00 PM IST (checks for cases expiring today)

---

### Step 4: Email Sending

All notification APIs use the `sendEmail()` function from `/api/utils/mailer.js`:

**Process:**

1. Uses Nodemailer with SMTP configuration
2. Sends HTML emails using templates from `/api/utils/emailTemplates.js`
3. Handles errors gracefully (logs but doesn't fail the entire job)
4. Returns count of emails sent

**Email Configuration:**

- Host: `smtp.titan.email` (or from `EMAIL_HOST`)
- Port: `587` (or from `EMAIL_PORT`)
- Authentication: From `EMAIL_USER` and `EMAIL_PASS`

---

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel Cron Scheduler (vercel.json)                      │
│  - Runs at scheduled times (UTC)                          │
│  - Adds x-vercel-cron: 1 header                           │
└──────────────────┬────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  /api/cron (Cron Router)                                    │
│  1. Authenticates request                                   │
│  2. Routes to correct notification API                      │
│  3. Makes internal API call with secret key                 │
└──────────────────┬────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌───────────────┐    ┌──────────────────────┐
│ Pending       │    │ Monthly Reminder    │
│ Approval      │    │ Expiry Reminder     │
│ API           │    │ Expiry Notification │
└───────┬───────┘    └──────────┬──────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Database Query       │
        │  - Find matching cases│
        │  - Populate user data │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Email Template       │
        │  - Generate HTML      │
        │  - Format data        │
        └───────────┬───────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Send Email           │
        │  - Nodemailer         │
        │  - SMTP Server        │
        └───────────────────────┘
```

---

## Manual Triggering

Super admins can manually trigger any cron job from:

- **URL:** `/admin/notifications/manage`
- **How it works:**
  1. User clicks "Trigger Now" button
  2. Frontend makes POST request to notification API
  3. Uses user's auth token (not cron secret)
  4. Same email sending process as cron jobs

---

## Error Handling

**At Each Level:**

1. **Cron Router:** Catches errors and returns JSON response
2. **Notification APIs:** Try-catch around email sending
3. **Email Sending:** Logs errors but continues with other emails
4. **Database:** Errors are caught and returned as 500 responses

**Result:** If one email fails, others still get sent. The system is resilient.

---

## Time Zone Handling

**Important:** All cron schedules are in UTC (Vercel requirement)

- **IST Time:** 3:00 PM IST = 9:30 AM UTC
- **Schedule Format:** `30 9 * * 1` = 9:30 AM UTC on Monday
- **Conversion:** IST = UTC + 5:30

---

## Testing

You can test cron jobs manually:

```bash
# Test pending approval
curl -X POST "http://localhost:3000/api/cron?job=pending-approval" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"

# Test monthly reminder
curl -X POST "http://localhost:3000/api/cron?job=monthly-reminder" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"

# Test expiry reminder (30 days)
curl -X POST "http://localhost:3000/api/cron?job=expiry-reminder&daysBefore=30" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"

# Test expiry notification (today)
curl -X POST "http://localhost:3000/api/cron?job=expiry-reminder&daysBefore=0" \
  -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"
```

Or use the superadmin page at `/admin/notifications/manage`

---

## Summary

1. **Vercel Cron** → Calls `/api/cron` at scheduled times
2. **Cron Router** → Authenticates and routes to notification API
3. **Notification API** → Queries database and prepares emails
4. **Email Templates** → Generates HTML email content
5. **Email Sender** → Sends emails via SMTP
6. **Result** → Returns success/failure with email count

All cron jobs work automatically after deployment to Vercel. No manual intervention needed!

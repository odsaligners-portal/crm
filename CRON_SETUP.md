# Email Notifications Cron Jobs Setup

This document explains how to set up automated email notifications using cron jobs.

## Overview

The system includes the following automated email notifications:

1. **Pending Approval Cases** - Weekly reminder (Every Monday at 3:00 PM IST)
2. **Monthly Follow-Up Reminder** - Monthly reminder for active cases
3. **Case Expiry Reminder (30 days)** - Daily check for cases expiring in 30 days
4. **Case Expiry Notification** - Daily check for cases expiring today

## Environment Variables

Add the following to your `.env` file:

```env
NEXT_PUBLIC_CRON_SECRET_KEY=your-secure-random-string-here
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**Important:**

- Generate a secure random string for `NEXT_PUBLIC_CRON_SECRET_KEY` and keep it secret.
- **Security Note:** While this variable uses the `NEXT_PUBLIC_` prefix, it's only used in server-side API routes and is not exposed to the client. However, for better security practices, consider using a server-only environment variable (without `NEXT_PUBLIC_`) if your deployment platform supports it.

## Cron Job Setup

### Option 1: Vercel Cron (Recommended for Vercel deployments)

A `vercel.json` file has been created in your project root with the following cron configuration:

```json
{
  "crons": [
    {
      "path": "/api/cron?job=pending-approval",
      "schedule": "30 9 * * 1"
    },
    {
      "path": "/api/cron?job=monthly-reminder",
      "schedule": "30 9 1 * *"
    },
    {
      "path": "/api/cron?job=expiry-reminder&daysBefore=30",
      "schedule": "30 9 * * *"
    },
    {
      "path": "/api/cron?job=expiry-reminder&daysBefore=0",
      "schedule": "30 9 * * *"
    }
  ]
}
```

**Note:**

- Vercel cron uses UTC time. For 3:00 PM IST (UTC+5:30), the schedule is set to `30 9 * * 1` (9:30 AM UTC = 3:00 PM IST on Monday).
- Vercel automatically authenticates cron jobs using the `x-vercel-cron` header, so no manual Authorization header is needed.
- After deploying to Vercel, the cron jobs will be automatically set up and run according to the schedule.

### Option 2: External Cron Service (cron-job.org, EasyCron, etc.)

Set up the following cron jobs:

#### 1. Pending Approval Cases (Weekly - Monday 3:00 PM IST)

- **URL:** `https://your-domain.com/api/cron?job=pending-approval`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET_KEY`
- **Schedule:** `0 9 * * 1` (UTC) or `0 15 * * 1` (IST)

#### 2. Monthly Reminder (1st of every month)

- **URL:** `https://your-domain.com/api/cron?job=monthly-reminder`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET_KEY`
- **Schedule:** `0 9 1 * *` (UTC) or `0 15 1 * *` (IST)

#### 3. Case Expiry Reminder - 30 Days (Daily)

- **URL:** `https://your-domain.com/api/cron?job=expiry-reminder&daysBefore=30`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET_KEY`
- **Schedule:** `0 9 * * *` (UTC) or `0 15 * * *` (IST)

#### 4. Case Expiry Notification - Today (Daily)

- **URL:** `https://your-domain.com/api/cron?job=expiry-reminder&daysBefore=0`
- **Method:** POST
- **Headers:** `Authorization: Bearer YOUR_CRON_SECRET_KEY`
- **Schedule:** `0 9 * * *` (UTC) or `0 15 * * *` (IST)

### Option 3: Server Cron (Linux/Unix)

Add to your crontab (`crontab -e`):

```bash
# Pending Approval Cases - Every Monday at 3:00 PM IST
0 15 * * 1 curl -X POST "https://your-domain.com/api/cron?job=pending-approval" -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"

# Monthly Reminder - 1st of every month at 3:00 PM IST
0 15 1 * * curl -X POST "https://your-domain.com/api/cron?job=monthly-reminder" -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"

# Case Expiry Reminder - 30 Days (Daily at 3:00 PM IST)
0 15 * * * curl -X POST "https://your-domain.com/api/cron?job=expiry-reminder&daysBefore=30" -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"

# Case Expiry Notification - Today (Daily at 3:00 PM IST)
0 15 * * * curl -X POST "https://your-domain.com/api/cron?job=expiry-reminder&daysBefore=0" -H "Authorization: Bearer YOUR_CRON_SECRET_KEY"
```

## Manual Trigger (Super Admin)

Super admins can manually trigger any notification from:

- **URL:** `/admin/notifications/manage`
- **Access:** Only accessible to super-admin users

## Testing

You can test the cron jobs manually using curl:

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

{
  "crons": [
    {
      "path": "/api/cron?job=pending-approval",
      "schedule": "30 9 * * 1"
    },
    {
      "path": "/api/cron?job=monthly-reminder",
      "schedule": "30 9 1 * *"
    },
    {
      "path": "/api/cron?job=expiry-reminder&daysBefore=30",
      "schedule": "30 9 * * *"
    },
    {
      "path": "/api/cron?job=expiry-reminder&daysBefore=0",
      "schedule": "30 9 * * *"
    }
  ]
}


## Time Zone Notes

- **IST (Indian Standard Time):** UTC+5:30
- **3:00 PM IST = 9:30 AM UTC**
- Adjust cron schedules based on your server's timezone

## Troubleshooting

1. **401 Unauthorized:** Check that `CRON_SECRET_KEY` matches in both environment and cron job headers
2. **No emails sent:** Verify email configuration in `.env` (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)
3. **Wrong time:** Ensure cron schedule accounts for timezone differences
4. **Missing cases:** Check that cases meet the criteria (e.g., "approval pending" status, not on hold/cancelled)

## Email Templates

All email templates are located in:

- `src/app/api/utils/emailTemplates.js`

You can customize the templates as needed.

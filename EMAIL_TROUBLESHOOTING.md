# Email Authentication Troubleshooting Guide

## Common Authentication Errors

### Error: `535 5.7.8 Error: authentication failed`

This error means the email server rejected your credentials. Here are the most common solutions:

---

## Solution 1: Use App Password (If 2FA is Enabled)

If your email account has Two-Factor Authentication (2FA) enabled, you **must** use an App Password instead of your regular password.

### For Gmail:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Use this 16-character password in `EMAIL_PASS`

### For Other Providers:

- Check your email provider's documentation for app password generation
- Most providers require app passwords when 2FA is enabled

---

## Solution 2: Verify Email Credentials Format

### ✅ Correct Format:

```env
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password-or-app-password
```

### ❌ Common Mistakes:

- Using username instead of full email: `EMAIL_USER=username` (wrong)
- Missing quotes for special characters: `EMAIL_PASS=pass@word` (wrong)
- Extra spaces: `EMAIL_USER= email@example.com ` (wrong)

### ✅ Correct with Special Characters:

```env
EMAIL_PASS="your@password#here"
# OR
EMAIL_PASS='your@password#here'
```

---

## Solution 3: Check Email Provider Settings

### For Titan Email (smtp.titan.email):

**Port 587 (STARTTLS - Recommended):**

```env
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
```

**Port 465 (SSL):**

```env
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=465
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-password
```

### For Gmail:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password  # Must be app password if 2FA enabled
```

### For Outlook/Office 365:

```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

---

## Solution 4: Verify Environment Variables

Make sure your `.env` file has all required variables:

```env
# Required
EMAIL_HOST=smtp.titan.email
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password

# Optional (for FROM field)
EMAIL_FROM_NAME="Your Company Name"
EMAIL_FROM_ADDRESS=your-email@example.com
```

**Important:**

- Restart your development server after changing `.env` file
- In production (Vercel), add these as environment variables in the dashboard
- Never commit `.env` file to git

---

## Solution 5: Test Email Configuration

The updated mailer now includes connection verification. Check your console logs for:

- ✅ `Email sent successfully: <message-id>` - Working!
- ❌ `Authentication failed` - Check credentials
- ❌ `Connection failed` - Check host/port

---

## Solution 6: Check Firewall/Network

Some networks or firewalls block SMTP connections:

- Try from a different network
- Check if your hosting provider allows SMTP outbound connections
- Some corporate networks block port 587/465

---

## Solution 7: Enable "Less Secure Apps" (Not Recommended)

**⚠️ Warning:** Only use this for testing, not production.

Some email providers (like older Gmail accounts) may require enabling "Less secure app access". However, this is deprecated and not recommended. Use App Passwords instead.

---

## Quick Checklist

Before reporting an issue, verify:

- [ ] `EMAIL_USER` is the full email address (e.g., `user@example.com`)
- [ ] `EMAIL_PASS` is correct (or app password if 2FA enabled)
- [ ] `EMAIL_HOST` matches your email provider
- [ ] `EMAIL_PORT` is correct (587 for STARTTLS, 465 for SSL)
- [ ] No extra spaces in environment variables
- [ ] Special characters in password are properly quoted
- [ ] Server has been restarted after changing `.env`
- [ ] In production, environment variables are set in Vercel dashboard

---

## Testing Your Configuration

You can test your email configuration by:

1. **Manual Trigger:** Use the superadmin page at `/admin/notifications/manage`
2. **API Test:** Call any notification API endpoint
3. **Check Logs:** Look for detailed error messages in console

---

## Still Having Issues?

If you've tried all the above and still getting authentication errors:

1. **Contact Your Email Provider:**
   - Verify SMTP is enabled for your account
   - Check if there are any IP restrictions
   - Ask if they require specific authentication methods

2. **Try Different Port:**
   - If port 587 doesn't work, try 465 (SSL)
   - Update `EMAIL_PORT` in your `.env`

3. **Check Email Provider Documentation:**
   - Each provider has specific SMTP settings
   - Some require OAuth2 instead of basic auth

4. **Verify Account Status:**
   - Ensure your email account is active
   - Check if account is locked or suspended

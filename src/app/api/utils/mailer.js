import nodemailer from "nodemailer";

// Validate email configuration
const emailHost = process.env.EMAIL_HOST || "smtp.titan.email";
const emailPort = parseInt(process.env.EMAIL_PORT) || 587;
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
  console.warn(
    "Warning: EMAIL_USER or EMAIL_PASS not set. Email sending will fail.",
  );
}

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465, // true for 465 (SSL), false for 587 (STARTTLS)
  requireTLS: emailPort === 587, // Require TLS for STARTTLS on port 587
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  // Increase timeout values to handle slow connections
  connectionTimeout: 30000, // 30 seconds (increased from 10)
  greetingTimeout: 30000, // 30 seconds (increased from 10)
  socketTimeout: 30000, // 30 seconds for socket operations
  // Disable certificate validation if needed (not recommended for production)
  // tls: {
  //   rejectUnauthorized: false
  // }
});

/**
 * Send an email to a single recipient or multiple recipients.
 * @param {Object} options
 * @param {string|string[]} options.to - Email address or array of addresses
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 */
export const sendEmail = async ({ to, cc, subject, html }) => {
  try {
    // Verify transporter configuration first
    if (!emailUser || !emailPass) {
      throw new Error(
        "Email configuration missing: EMAIL_USER or EMAIL_PASS not set",
      );
    }

    // Skip verify() to avoid extra connection attempt that can timeout
    // The sendMail() call will verify the connection anyway
    // await transporter.verify();

    const recipients = Array.isArray(to) ? to.join(",") : to;
    const ccRecipients = cc
      ? Array.isArray(cc)
        ? cc.join(",")
        : cc
      : undefined;

    const fromAddress = process.env.EMAIL_FROM_ADDRESS || emailUser; // Fallback to email user if FROM not set
    const fromName = process.env.EMAIL_FROM_NAME || "CRM System";

    const mailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      to: recipients,
      cc: ccRecipients,
      subject,
      html,
    };

    // Send email (timeouts are handled by transporter configuration)
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);

    // Provide more helpful error messages
    if (error.code === "EAUTH") {
      console.error(
        "Authentication failed. Please check:",
        "\n1. EMAIL_USER and EMAIL_PASS are correct",
        "\n2. If using Gmail, use an App Password instead of regular password",
        "\n3. If using other providers, check if 2FA is enabled (may need app password)",
        "\n4. Ensure EMAIL_USER is the full email address",
        "\n5. Check if your email provider allows SMTP access from your IP",
      );
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error(
        "Connection timeout or failed. Please check:",
        "\n1. EMAIL_HOST is correct",
        "\n2. EMAIL_PORT is correct (587 for STARTTLS, 465 for SSL)",
        "\n3. Firewall/network allows SMTP connections",
        "\n4. Email server is accessible from your network",
        "\n5. Try increasing timeout values if connection is slow",
      );
    } else if (error.message?.includes("timeout")) {
      console.error(
        "Email send operation timed out. This may be due to:",
        "\n1. Slow network connection",
        "\n2. Email server is overloaded",
        "\n3. Network firewall blocking SMTP traffic",
        "\n4. Consider using a different email service or increasing timeout values",
      );
    }

    throw error; // Re-throw to let caller handle it
  }
};

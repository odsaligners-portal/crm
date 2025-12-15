import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.titan.email",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: parseInt(process.env.EMAIL_PORT) === 465, // true for 465 (SSL), false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
    const recipients = Array.isArray(to) ? to.join(",") : to;
    const ccRecipients = cc
      ? Array.isArray(cc)
        ? cc.join(",")
        : cc
      : undefined;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: recipients,
      cc: ccRecipients, // <-- Add CC here
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

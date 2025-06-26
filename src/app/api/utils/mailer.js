import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
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
export const sendMail = async ({ to, subject, html }) => {
  try {
    // Accepts string or array for 'to'
    const recipients = Array.isArray(to) ? to.join(',') : to;
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: recipients,
      subject,
      html,
    };
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    // Optionally rethrow or handle error
  }
}; 
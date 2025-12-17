/**
 * Email templates for automated notifications
 */

export const getPendingApprovalEmailTemplate = (
  count,
  cases = [],
  isAdmin = false,
  casesByDoctor = null,
) => {
  let casesList = "";

  if (isAdmin && casesByDoctor) {
    // For admin: Group by doctor with dividers
    const sortedDoctors = Object.keys(casesByDoctor).sort();
    const doctorSections = sortedDoctors.map((doctorName, index) => {
      const doctorCases = casesByDoctor[doctorName].cases;
      const patientsList = doctorCases
        .map(
          (c) =>
            `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
              <strong>${c.patientName}</strong> (Case ID: ${c.caseId}) - Registered: ${new Date(c.createdAt).toLocaleDateString()}
            </li>`,
        )
        .join("");

      return `
        <div class="doctor-section">
          <h3 class="doctor-name">👨‍⚕️ Dr. ${doctorName}</h3>
          <ul style="list-style: none; padding: 0; margin: 10px 0 20px 0;">
            ${patientsList}
          </ul>
        </div>
        ${index < sortedDoctors.length - 1 ? '<div class="divider"></div>' : ""}
      `;
    });

    casesList = `<div class="cases-list"><h3>Pending Cases by Doctor:</h3>${doctorSections.join("")}</div>`;
  } else if (cases && cases.length > 0) {
    // For doctor: Simple list sorted by patient name (already sorted in route)
    const patientsList = cases
      .map(
        (c) =>
          `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <strong>${c.patientName}</strong> (Case ID: ${c.caseId}) - Registered: ${new Date(c.createdAt).toLocaleDateString()}
          </li>`,
      )
      .join("");
    casesList = `<div class="cases-list"><h3>Pending Cases:</h3><ul style="list-style: none; padding: 0;">${patientsList}</ul></div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pending Approval Cases</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { margin-bottom: 30px; }
        .count-badge { background: #ff6b6b; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; font-size: 18px; font-weight: bold; margin: 20px 0; }
        .cases-list { margin: 20px 0; }
        .doctor-section { margin: 20px 0; }
        .doctor-name { color: #667eea; font-size: 18px; font-weight: 600; margin: 15px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #667eea; }
        .divider { height: 2px; background: linear-gradient(to right, transparent, #e9ecef, transparent); margin: 30px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Pending Approval Cases Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${isAdmin ? "Team" : "Doctor"},</p>
          <p>You have <span class="count-badge">${count}</span> case(s) awaiting your approval. Please review them at your earliest convenience.</p>
          ${casesList}
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/patients" class="button">Review Cases</a>
        </div>
        <div class="footer">
          <p>This is an automated notification email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getCaseDetailsEmailTemplate = (caseData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Case Details Confirmed</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { margin-bottom: 30px; }
        .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .info-box p { margin: 8px 0; }
        .info-box strong { color: #667eea; }
        .terms-box { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .terms-box h3 { margin-top: 0; color: #856404; }
        .terms-box ul { margin: 10px 0; padding-left: 20px; }
        .terms-box li { margin: 8px 0; color: #856404; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Case Details Confirmed</h1>
        </div>
        <div class="content">
          <p>Dear ${caseData.doctorName},</p>
          <p>This is to confirm that the case details for the following patient have been finalized:</p>
          
          <div class="info-box">
            <p><strong>Doctor Name:</strong> ${caseData.doctorName}</p>
            <p><strong>Patient Name:</strong> ${caseData.patientName}</p>
            <p><strong>Case ID:</strong> ${caseData.caseId}</p>
            <p><strong>Case Category:</strong> ${caseData.caseCategory || "N/A"}</p>
            <p><strong>Case Registered Date:</strong> ${new Date(caseData.registeredDate).toLocaleDateString()}</p>
            <p><strong>Case Approval Date:</strong> ${caseData.approvalDate ? new Date(caseData.approvalDate).toLocaleDateString() : "N/A"}</p>
            <p><strong>Case Start Date:</strong> ${new Date(caseData.startDate).toLocaleDateString()}</p>
            <p><strong>Case Expiry Date:</strong> ${new Date(caseData.expiryDate).toLocaleDateString()}</p>
          </div>

          <div class="terms-box">
            <h3>⚠️ Important Terms:</h3>
            <ul>
              <li><strong>Case Validity:</strong> Any case reported after the expiry date will be treated as a new case.</li>
              <li><strong>Additional Aligners:</strong> Additional aligners will be provided strictly as per the selected package. Flexi and Pay Per Aligner packages do not include additional aligners.</li>
              <li><strong>No Refund Policy:</strong> Once aligner manufacturing has commenced after approval, no refunds or adjustments will be applicable.</li>
            </ul>
          </div>

          <p>For detailed terms and conditions, please refer to the invoice or contact us at <a href="mailto:info@odsaligners.com">info@odsaligners.com</a>.</p>
        </div>
        <div class="footer">
          <p>This is an automated notification email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getMonthlyReminderEmailTemplate = (
  cases = null,
  isAdmin = false,
  casesByDoctor = null,
) => {
  let casesList = "";

  if (isAdmin && casesByDoctor) {
    // For admin: Group by doctor with dividers
    const sortedDoctors = Object.keys(casesByDoctor).sort();
    const doctorSections = sortedDoctors.map((doctorName, index) => {
      const doctorCases = casesByDoctor[doctorName].cases;
      const patientsList = doctorCases
        .map(
          (c) =>
            `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
              <strong>${c.patientName}</strong> (Case ID: ${c.caseId})
            </li>`,
        )
        .join("");

      return `
        <div class="doctor-section">
          <h3 class="doctor-name">👨‍⚕️ Dr. ${doctorName}</h3>
          <ul style="list-style: none; padding: 0; margin: 10px 0 20px 0;">
            ${patientsList}
          </ul>
        </div>
        ${index < sortedDoctors.length - 1 ? '<div class="divider"></div>' : ""}
      `;
    });

    casesList = `<div class="cases-list"><h3>Active Cases by Doctor:</h3>${doctorSections.join("")}</div>`;
  } else if (cases && cases.length > 0) {
    // For doctor: Simple list sorted by patient name (already sorted in route)
    const patientsList = cases
      .map(
        (c) =>
          `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <strong>${c.patientName}</strong> (Case ID: ${c.caseId})
          </li>`,
      )
      .join("");
    casesList = `<div class="cases-list"><h3>Active Cases:</h3><ul style="list-style: none; padding: 0;">${patientsList}</ul></div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Follow-Up Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { margin-bottom: 30px; }
        .cases-list { margin: 20px 0; }
        .doctor-section { margin: 20px 0; }
        .doctor-name { color: #667eea; font-size: 18px; font-weight: 600; margin: 15px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #667eea; }
        .divider { height: 2px; background: linear-gradient(to right, transparent, #e9ecef, transparent); margin: 30px 0; }
        .request-box { background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .request-box ul { margin: 10px 0; padding-left: 20px; }
        .request-box li { margin: 8px 0; }
        .note-box { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Follow-Up Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${isAdmin ? "Team" : "Doctor"},</p>
          <p>This is a gentle reminder to kindly follow up on your ongoing case(s) to track the treatment progress.</p>
          
          ${casesList}

          <div class="request-box">
            <h3 style="margin-top: 0; color: #0066cc;">We request you to please:</h3>
            <ul>
              <li>Share follow-up clinical images and progress comments for the case on the portal.</li>
              <li>If aligners for the case are requested to be shipped in phases/batches, kindly raise a request for the next batch / remaining aligners when the patient begins wearing the last aligner of the current set, after confirming the fit.</li>
              <li>In case of any discrepancy in aligner fit, please share the relevant clinical images along with fresh scans on the portal for further evaluation.</li>
            </ul>
          </div>

          <div class="note-box">
            <p><strong>Please note:</strong> For refinements or next-phase fabrication, the processing time is 5–7 working days for aligners to be shipped from production.</p>
          </div>

          <p>Your timely updates help ensure smooth continuity of treatment and avoid delays.</p>
          <p>Thank you for your cooperation.</p>
        </div>
        <div class="footer">
          <p><strong>Warm regards,</strong><br>Clinical Support Team</p>
          <p>This is an automated notification email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getCaseExpiryReminderEmailTemplate = (
  cases = null,
  daysRemaining,
  isAdmin = false,
  casesByDoctor = null,
) => {
  let casesList = "";

  if (isAdmin && casesByDoctor) {
    // For admin: Group by doctor with dividers
    const sortedDoctors = Object.keys(casesByDoctor).sort();
    const doctorSections = sortedDoctors.map((doctorName, index) => {
      const doctorCases = casesByDoctor[doctorName].cases;
      const patientsList = doctorCases
        .map(
          (c) =>
            `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
              <strong>${c.patientName}</strong> (Case ID: ${c.caseId}) - Expiry: ${new Date(c.expiryDate).toLocaleDateString()}
            </li>`,
        )
        .join("");

      return `
        <div class="doctor-section">
          <h3 class="doctor-name">👨‍⚕️ Dr. ${doctorName}</h3>
          <ul style="list-style: none; padding: 0; margin: 10px 0 20px 0;">
            ${patientsList}
          </ul>
        </div>
        ${index < sortedDoctors.length - 1 ? '<div class="divider"></div>' : ""}
      `;
    });

    casesList = `<div class="cases-list"><h3>Cases Expiring in ${daysRemaining} Days by Doctor:</h3>${doctorSections.join("")}</div>`;
  } else if (cases && cases.length > 0) {
    // For doctor: Simple list sorted by patient name (already sorted in route)
    const patientsList = cases
      .map(
        (c) =>
          `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <strong>${c.patientName}</strong> (Case ID: ${c.caseId}) - Expiry: ${new Date(c.expiryDate).toLocaleDateString()}
          </li>`,
      )
      .join("");
    casesList = `<div class="cases-list"><h3>Cases Expiring in ${daysRemaining} Days:</h3><ul style="list-style: none; padding: 0;">${patientsList}</ul></div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Case Expiry Reminder</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { margin-bottom: 30px; }
        .cases-list { margin: 20px 0; }
        .doctor-section { margin: 20px 0; }
        .doctor-name { color: #ff6b6b; font-size: 18px; font-weight: 600; margin: 15px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #ff6b6b; }
        .divider { height: 2px; background: linear-gradient(to right, transparent, #e9ecef, transparent); margin: 30px 0; }
        .warning-box { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .warning-box ul { margin: 10px 0; padding-left: 20px; }
        .warning-box li { margin: 8px 0; color: #856404; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Case Expiry Reminder</h1>
        </div>
        <div class="content">
          <p>Dear ${isAdmin ? "Team" : "Doctor"},</p>
          <p>This is a gentle reminder that the below-mentioned case(s) ${cases && cases.length === 1 ? "is" : "are"} scheduled to expire in ${daysRemaining} days.</p>
          
          ${casesList}

          <p>If you wish to submit the case for follow-up revisions (complimentary for Premium and Elite packages & paid for flexi & pay per aligner packages), if needed, we request you to kindly complete the submission on or before the case expiry date.</p>

          <div class="warning-box">
            <h3 style="margin-top: 0; color: #856404;">⚠️ Please note:</h3>
            <ul>
              <li>Any case submitted after the expiry date will be treated as a new case.</li>
              <li>Any complimentary additional aligners, if remaining as per the selected package category, will lapse upon case expiry.</li>
            </ul>
          </div>

          <p>We recommend timely submission to ensure continuity of treatment without delays.</p>
          <p>For any assistance, please contact us through the portal or reach out to our support team.</p>
        </div>
        <div class="footer">
          <p><strong>Warm regards,</strong><br>Clinical Support Team</p>
          <p>This is an automated notification email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getCaseExpiredEmailTemplate = (
  cases = null,
  isAdmin = false,
  casesByDoctor = null,
) => {
  let casesList = "";

  if (isAdmin && casesByDoctor) {
    // For admin: Group by doctor with dividers
    const sortedDoctors = Object.keys(casesByDoctor).sort();
    const doctorSections = sortedDoctors.map((doctorName, index) => {
      const doctorCases = casesByDoctor[doctorName].cases;
      const patientsList = doctorCases
        .map(
          (c) =>
            `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
              <strong>${c.patientName}</strong> (Case ID: ${c.caseId}) - Expired: ${new Date(c.expiryDate).toLocaleDateString()}
            </li>`,
        )
        .join("");

      return `
        <div class="doctor-section">
          <h3 class="doctor-name">👨‍⚕️ Dr. ${doctorName}</h3>
          <ul style="list-style: none; padding: 0; margin: 10px 0 20px 0;">
            ${patientsList}
          </ul>
        </div>
        ${index < sortedDoctors.length - 1 ? '<div class="divider"></div>' : ""}
      `;
    });

    casesList = `<div class="cases-list"><h3>Expired Cases by Doctor:</h3>${doctorSections.join("")}</div>`;
  } else if (cases && cases.length > 0) {
    // For doctor: Simple list sorted by patient name (already sorted in route)
    const patientsList = cases
      .map(
        (c) =>
          `<li style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
            <strong>${c.patientName}</strong> (Case ID: ${c.caseId}) - Expired: ${new Date(c.expiryDate).toLocaleDateString()}
          </li>`,
      )
      .join("");
    casesList = `<div class="cases-list"><h3>Expired Cases:</h3><ul style="list-style: none; padding: 0;">${patientsList}</ul></div>`;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Case Expired</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%); color: white; padding: 20px; margin: -30px -30px 30px -30px; border-radius: 10px 10px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { margin-bottom: 30px; }
        .cases-list { margin: 20px 0; }
        .doctor-section { margin: 20px 0; }
        .doctor-name { color: #95a5a6; font-size: 18px; font-weight: 600; margin: 15px 0 10px 0; padding-bottom: 8px; border-bottom: 2px solid #95a5a6; }
        .divider { height: 2px; background: linear-gradient(to right, transparent, #e9ecef, transparent); margin: 30px 0; }
        .notice-box { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .notice-box p { margin: 8px 0; color: #721c24; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Case Expired and Closed</h1>
        </div>
        <div class="content">
          <p>Dear ${isAdmin ? "Team" : "Doctor"},</p>
          <p>This is to inform you that the below-mentioned case(s) ${cases && cases.length === 1 ? "has" : "have"} expired and ${cases && cases.length === 1 ? "is" : "are"} now closed in our system.</p>
          
          ${casesList}

          <div class="notice-box">
            <p><strong>Important Notice:</strong> Please note that no further revisions or corrections can be submitted for this case. If any additional treatment, refinements, or corrections are required, the same will need to be submitted as a fresh case.</p>
          </div>

          <p>For any assistance or to initiate a new case, kindly proceed through the portal or contact our support team.</p>
          <p>Thank you for your understanding and cooperation.</p>
        </div>
        <div class="footer">
          <p><strong>Warm regards,</strong><br>Aligner Platform – Clinical Support Team</p>
          <p>This is an automated notification email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

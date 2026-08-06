const nodemailer = require("nodemailer");

const getTransporter = () => {
  const {
    SMTP_HOST = "smtp.gmail.com",
    SMTP_PORT = "587",
    SMTP_SECURE = "false",
    SMTP_USER = "test@gmail.com",
    SMTP_PASS = "",
  } = process.env;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendPrescriptionEmail = async ({
  patientEmail,
  patientName,
  doctorName,
  rxId,
  pdfBuffer,
  pdfFilename,
  clinicInfo,
}) => {
  if (!patientEmail) {
    throw new Error("Patient email is required to send prescription");
  }
  if (!process.env.SMTP_PASS) {
    throw new Error(
      "SMTP password (app password) not configured in environment variables",
    );
  }

  const transporter = getTransporter();
  const senderName = clinicInfo?.name || "CREADENT DENTAL CLINIC";
  const senderEmail = process.env.SMTP_USER || "test@gmail.com";

  const medicationsText =
    pdfBuffer && pdfBuffer.length
      ? "Please find your prescription attached to this email."
      : "Your prescription has been generated. Download it from the clinic portal.";

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Your Prescription from ${senderName}</title>
<style>
  body { font-family: 'Helvetica', Arial, sans-serif; margin:0; padding:0; background:#f0f7fc; }
  .wrap { max-width:640px; margin:24px auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 6px 24px rgba(0,127,175,0.12); }
  .header { background:linear-gradient(135deg,#007FAF 0%, #0056b3 100%); padding:28px 32px; color:#ffffff; }
  .header h1 { margin:0 0 6px; font-size:22px; font-weight:700; }
  .header p { margin:0; opacity:0.9; font-size:14px; }
  .body { padding:28px 32px; color:#2d3748; }
  .body h2 { color:#007FAF; margin-top:0; font-size:18px; }
  .greeting { font-size:15px; line-height:1.6; }
  .meta { background:#eaf5fc; border-left:4px solid #007FAF; padding:14px 16px; border-radius:6px; margin:20px 0; }
  .meta p { margin:4px 0; font-size:14px; }
  .meta strong { color:#0056b3; }
  .instructions { font-size:14px; line-height:1.7; background:#fdfdfd; border:1px solid #e2e8f0; padding:14px 16px; border-radius:8px; }
  .instructions ol { margin:8px 0 8px 20px; padding:0; }
  .instructions li { margin:4px 0; }
  .cta-row { text-align:center; margin:26px 0 10px; }
  .footer { background:#f7fafc; padding:18px 32px; text-align:center; font-size:12px; color:#64748b; border-top:1px solid #e2e8f0; }
  .footer p { margin:4px 0; }
  .footer strong { color:#007FAF; }
  .badge { display:inline-block; padding:3px 10px; background:#ffffff; color:#007FAF; border-radius:999px; font-size:11px; font-weight:700; margin-top:8px; letter-spacing:0.3px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>${senderName}</h1>
      <p>${clinicInfo?.tagline || "Excellence in Dental Care"}</p>
      <span class="badge">PRESCRIPTION \u2022 ${rxId}</span>
    </div>
    <div class="body">
      <h2>Dear ${patientName || "Patient"},</h2>
      <p class="greeting">
        Greetings from ${senderName}. Your doctor has issued a medical prescription
        following your recent visit. Please find the detailed prescription as a PDF
        attachment to this email.
      </p>
      <div class="meta">
        <p><strong>Prescription ID:</strong> ${rxId}</p>
        <p><strong>Prescribed By:</strong> Dr. ${doctorName || "Doctor"}</p>
        <p><strong>Issue Date:</strong> ${new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        <p><strong>Patient:</strong> ${patientName || "-"}</p>
      </div>
      <div class="instructions">
        <strong>Important Instructions:</strong>
        <ol>
          <li>Download and save the attached PDF prescription for your records.</li>
          <li>Take medications exactly as advised by the doctor in the prescription.</li>
          <li>Complete the full course of treatment; do not stop medicines early.</li>
          <li>Follow dietary / post-treatment instructions given by the dentist.</li>
          <li>Book a follow-up appointment if advised on the prescription.</li>
          <li>For any confusion or side-effects, call the clinic immediately at <strong>${clinicInfo?.phone || "-"}</strong>.</li>
        </ol>
      </div>
      <p class="greeting" style="margin-top:22px;">
        Thank you for trusting <strong style="color:#007FAF;">${senderName}</strong> with your dental care.
        We wish you a speedy recovery.
      </p>
      <div class="cta-row">
        <p style="font-size:13px;color:#475569;">Attachment: <strong>${pdfFilename || "Prescription.pdf"}</strong></p>
      </div>
    </div>
    <div class="footer">
      <p><strong>${senderName}</strong></p>
      <p>${clinicInfo?.address ? clinicInfo.address + ", " : ""}${clinicInfo?.city || ""}</p>
      <p>\u260E ${clinicInfo?.phone || "-"} \u2022 \u2709 ${clinicInfo?.email || senderEmail}</p>
      ${clinicInfo?.website ? `<p>${clinicInfo.website}</p>` : ""}
      <p style="margin-top:8px;">&copy; ${new Date().getFullYear()} ${senderName}. All rights reserved.</p>
      <p style="opacity:0.75;">This is an automated email. Please do not reply directly to this message.</p>
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: `"${senderName}" <${senderEmail}>`,
    to: patientEmail,
    replyTo: clinicInfo?.email || senderEmail,
    subject: `Your Prescription (${rxId}) from ${senderName}`,
    text: `Dear ${patientName || "Patient"},\n\n` +
      `Your prescription (${rxId}) from Dr. ${doctorName || "Doctor"} has been attached.\n` +
      `${medicationsText}\n\n` +
      `Call ${clinicInfo?.phone || ""} for any queries.\n\n` +
      `Regards,\n${senderName}`,
    html,
    attachments: pdfBuffer
      ? [
          {
            filename: pdfFilename || "Prescription.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ]
      : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (err) {
    console.error("[EMAIL] Failed to send prescription email:", err);
    throw err;
  }
};

const sendTestEmail = async (to) => {
  const transporter = getTransporter();
  const senderEmail = process.env.SMTP_USER || "test@gmail.com";
  return transporter.sendMail({
    from: `"Test" <${senderEmail}>`,
    to: to || senderEmail,
    subject: "Test email from CREADENT Clinic System",
    text: "If you are reading this, email sending is working correctly.",
    html: `<p>If you are reading this, email sending is working correctly.</p>`,
  });
};

module.exports = { sendPrescriptionEmail, sendTestEmail, getTransporter };

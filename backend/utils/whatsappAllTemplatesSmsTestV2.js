require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const mongoose = require("mongoose");
const {
  TEMPLATE_REGISTRY,
  auditWhatsAppTemplateRegistry,
  sendTemplateWithFallback,
  toE164Format,
  formatCurrencyINR,
  formatDateIN,
} = require("./whatsappNotifications");

const TEST_PHONE = process.env.WHATSAPP_TEST_TO || process.env.ADMIN_PHONE || "9064527639";
const REVIEW_LINK =
  process.env.WHATSAPP_REVIEW_LINK || "https://g.co/kgs/test123";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://creadentsmiles.com";
const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";

const DIVIDER = "=".repeat(100);
const SUB_DIVIDER = "-".repeat(100);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeTestPhone = () => {
  const digitsOnly = String(TEST_PHONE).replace(/\D/g, "");
  return toE164Format(digitsOnly, DEFAULT_COUNTRY_CODE);
};

const buildAppointmentBookedPatientMessage = (
  patientContact,
  doctorContact,
  appointmentDate,
  appointmentTime,
  appointmentType,
) => `*🏥 Creadent Dental Clinic - Appointment Confirmed*

Dear ${patientContact.name || "Patient"},

Your appointment has been successfully booked.

👨‍⚕️ *Doctor:* ${doctorContact.name || "Doctor"}
📅 *Date:* ${appointmentDate}
⏰ *Time:* ${appointmentTime}
${appointmentType ? `🏷️ *Type:* ${appointmentType}\n` : ""}
📍 *Clinic:* Creadent Multispeciality Dental Clinic
   BD-85, Salt Lake Rd, BD Block, Sector 1, Bidhannagar, Kolkata - 700064

📞 For any queries, call us at: +91 6292300343

Please arrive 10 minutes before your scheduled time.

Regards,
Team Creadent Dental Clinic`;

const buildAppointmentBookedDoctorMessage = (
  doctorContact,
  patientContact,
  appointmentDate,
  appointmentTime,
  appointmentType,
) => `*🏥 New Appointment Booking*

Dear ${doctorContact.name || "Doctor"},

A new appointment has been scheduled.

👤 *Patient:* ${patientContact.name || "Patient"}
📅 *Date:* ${appointmentDate}
⏰ *Time:* ${appointmentTime}
${appointmentType ? `🏷️ *Type:* ${appointmentType}\n` : ""}
📱 Patient Mobile: ${patientContact.phone || "Not available"}

Regards,
Creadent Dental Clinic`;

const buildAppointmentReminderPatientMessage = (
  patientContact,
  doctorName,
  appointmentDate,
  appointmentTime,
  whenText,
) => `*⏰ Creadent Dental Clinic - Appointment Reminder*

Dear ${patientContact.name || "Patient"},

This is a friendly reminder that your dental appointment is ${whenText}.

👨‍⚕️ *Doctor:* ${doctorName || "Doctor"}
📅 *Date:* ${appointmentDate}
⏰ *Time:* ${appointmentTime}

📍 *Address:*
Creadent Multispeciality Dental Clinic
BD-85, Salt Lake Rd, BD Block, Sector 1
Bidhannagar, Kolkata - 700064

📞 To reschedule, call: +91 6292300343

Please arrive 10 minutes early.

Regards,
Team Creadent Dental Clinic`;

const buildAppointmentReminderDoctorMessage = (
  doctorContact,
  patientName,
  appointmentDate,
  appointmentTime,
  whenText,
) => `*⏰ Doctor Appointment Reminder*

Dear ${doctorContact.name || "Doctor"},

You have an appointment ${whenText}.

👤 *Patient:* ${patientName || "Patient"}
📅 *Date:* ${appointmentDate}
⏰ *Time:* ${appointmentTime}

Regards,
Creadent Dental Clinic`;

const buildAppointmentRescheduledPatientMessage = (
  patientContact,
  previousDate,
  appointmentDate,
  appointmentTime,
  appointmentType,
) => `*🔄 Creadent Dental Clinic - Appointment Rescheduled*

Dear ${patientContact.name || "Patient"},

Your appointment has been rescheduled.

📅 *Previous Date:* ${previousDate || "-"}
🗓️ *New Date:* ${appointmentDate}
⏰ *New Time:* ${appointmentTime}
${appointmentType ? `🏷️ *Type:* ${appointmentType}\n` : ""}
📍 *Clinic:* Creadent Multispeciality Dental Clinic
   BD-85, Salt Lake Rd, BD Block, Sector 1, Bidhannagar, Kolkata - 700064

📞 For queries: +91 6292300343

Regards,
Team Creadent Dental Clinic`;

const buildAppointmentRescheduledDoctorMessage = (
  doctorContact,
  patientName,
  previousDate,
  appointmentDate,
  appointmentTime,
  appointmentType,
) => `*🔄 Appointment Rescheduled*

Dear ${doctorContact.name || "Doctor"},

An appointment has been rescheduled.

👤 *Patient:* ${patientName || "Patient"}
📅 *Previous Date:* ${previousDate || "-"}
🗓️ *New Date:* ${appointmentDate}
⏰ *New Time:* ${appointmentTime}
${appointmentType ? `🏷️ *Type:* ${appointmentType}\n` : ""}
Regards,
Creadent Dental Clinic`;

const buildAppointmentRescheduledEmployeeMessage = (
  employeeName,
  patientName,
  doctorName,
  previousDate,
  appointmentDate,
  appointmentTime,
  appointmentType,
) => `*🔄 Appointment Rescheduled - Staff Alert*

Hi ${employeeName || "Team"},

An appointment has been rescheduled.

👤 *Patient:* ${patientName || "Patient"}
👨‍⚕️ *Doctor:* ${doctorName || "Doctor"}
📅 *Previous Date:* ${previousDate || "-"}
🗓️ *New Date:* ${appointmentDate}
⏰ *New Time:* ${appointmentTime}
${appointmentType ? `🏷️ *Type:* ${appointmentType}\n` : ""}
Regards,
Creadent Dental Clinic Management`;

const buildPrescriptionMessageFull = ({
  patientName,
  doctorName,
  date,
  rxId,
  diagnosis,
  meds,
  fileUrl,
}) => {
  return `*💊 Creadent Dental Clinic - Prescription Ready*

Dear ${patientName || "Patient"},

Your prescription is ready for download.

📋 *Prescription ID:* ${rxId}
👨‍⚕️ *Doctor:* ${doctorName}
📅 *Date:* ${date}
🩺 *Diagnosis:* ${diagnosis}

💊 *Medications:*
${meds}

📎 *Download / View:*
${fileUrl}

If you have any questions, please call +91 6292300343.

⚠️ *Medical Advice:*
- Take medicines as directed
- Maintain good oral hygiene
- Report any adverse reactions immediately
- Complete the full course of antibiotics

Warm regards,
Team Creadent Dental Clinic
Creadent Multispeciality Dental Clinic
BD-85, Salt Lake Rd, Sector 1, Bidhannagar, Kolkata - 700064`;
};

const buildInvoiceMessageFull = ({
  patientName,
  invoiceNumber,
  date,
  total,
  paid,
  balance,
  status,
  items,
  paymentLink,
}) => {
  const itemsText = (items || [])
    .map((it) => `   • ${it.desc} × ${it.qty} = ${formatCurrencyINR(it.total)}`)
    .join("\n");
  return `*🧾 Creadent Dental Clinic - ${status === "Paid" ? "Payment Receipt" : "Invoice"}*

Dear ${patientName || "Patient"},

Your ${status === "Paid" ? "payment receipt" : "invoice"} is ready.

📄 *Invoice Number:* ${invoiceNumber || "-"}
📅 *Date:* ${date}
💰 *Invoice Total:* ${formatCurrencyINR(total || 0)}
💳 *Amount Paid:* ${formatCurrencyINR(paid || 0)}
${balance > 0 ? `🔴 *Balance Due:* ${formatCurrencyINR(balance)}\n` : "✅ *Status:* Fully Paid\n"}
📋 *Items:*
${itemsText}

💻 *View Invoice & Pay Online:*
${paymentLink || FRONTEND_URL + "/patient/billing"}

🏥 *Creadent Multispeciality Dental Clinic*
BD-85, Salt Lake Rd, BD Block, Sector 1, Bidhannagar, Kolkata - 700064
📞 Phone: +91 6292300343
🌐 Website: creadentsmiles.com

Thank you for choosing Creadent Dental Clinic!

— Team Creadent`;
};

const buildInvoicePaymentLinkMessage = ({
  patientName,
  invoiceNumber,
  amount,
  paymentLink,
}) => {
  return `*Creadent Dental Clinic*

Dear ${patientName},

Your invoice *${invoiceNumber}* is ready.
Payment amount: *${amount}*

Please click the secure payment link below to complete your payment:
${paymentLink}

You can pay using UPI, Card, or Net Banking.

Regards,
Team Creadent Dental Clinic`;
};

const buildLoginCredentialsMessage = ({
  patientName,
  phone,
  password,
  loginLink,
}) => {
  return `*🏥 CREADENT DENTAL CLINIC - Patient Login Details*

Dear ${patientName || "Patient"},

Your secure patient portal login credentials:

📱 Mobile: *${phone || "-"}*
🔐 Password: *${password || "-"}*

🔗 Login URL: ${loginLink || FRONTEND_URL + "/login"}

👨‍💼 View your:
• Appointments
• Billing & Payments
• Prescriptions
• Medical Records

⚠️ *Security:*
- Do NOT share your password with anyone
- Change your password after first login
- Our staff will NEVER ask for your password

Regards,
Team Creadent Dental Clinic`;
};

const buildForgotPasswordOtpMessage = ({ otp }) => {
  return `*🔐 CREADENT DENTAL CLINIC - Password Reset OTP*

Your One-Time Password (OTP) for password reset is:

🔢 *${otp || "-"}*

⏰ This OTP is valid for 10 minutes only.

⚠️ *Security Note:*
- Do not share this OTP with anyone
- Our staff will NEVER ask for your OTP
- If you did not request this, please ignore

Regards,
Team Creadent Dental Clinic`;
};

const buildManualMessage = ({ name, message }) => {
  return `*Creadent Dental Clinic*

Hi ${name},

${message}

Regards,
Creadent Dental Clinic
+91 6292300343`;
};

const buildPaymentThankYouMessage = ({
  patientName,
  invoiceNumber,
  amountPaid,
  reviewLink,
}) => {
  return `*Creadent Dental Clinic*

Dear ${patientName || "Patient"},

🎉 Thank you for your successful payment!

📄 *Invoice:* ${invoiceNumber || "-"}
💰 *Amount Paid:* ${formatCurrencyINR(amountPaid || 0)}

Your payment has been received and your account is up to date. You will receive your payment receipt shortly.

⭐ *Rate Your Experience ⭐*
We'd love to hear your feedback! Please take a moment to leave us a review:
${reviewLink || REVIEW_LINK}

Your reviews help us improve and help other patients find us. Thank you for your support! 🙏

If you have any questions, please call: +91 6292300343

Warm regards,
Team Creadent Dental Clinic
Creadent Multispeciality Dental Clinic, Kolkata`;
};

const buildReviewLinkMessage = ({ patientName, reviewLink }) => {
  return `*⭐ Creadent Dental Clinic - Rate Us*

Dear ${patientName || "Patient"},

Thank you for trusting Creadent Dental Clinic with your dental care! 🙏

We'd love to hear about your experience with us. Your feedback helps us improve and helps other patients make informed decisions.

⭐ *Share Your Review:*
${reviewLink || REVIEW_LINK}

Takes less than 30 seconds. We read every single review! 💬

Have questions? Call us: +91 6292300343

Warm regards,
Team Creadent Dental Clinic
Creadent Multispeciality Dental Clinic, Kolkata`;
};

const TEMPLATE_TESTS = [
  {
    key: "APPOINTMENT_BOOKED_PATIENT",
    description: "Appointment Booked - Patient Confirmation",
    params: () => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return [
        "Test Patient",
        "Dr. Sharma",
        formatDateIN(date),
        "10:30 AM",
        "Consultation",
      ];
    },
    fallbackText: () => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return buildAppointmentBookedPatientMessage(
        { name: "Test Patient" },
        { name: "Dr. Sharma" },
        formatDateIN(date),
        "10:30 AM",
        "Consultation",
      );
    },
    riskNote:
      ".env maps this to 'order_confirm_auto_schedule' which is a Meta COMMERCE template. It is HIGHLY LIKELY this template doesn't contain {{1}}..{{5}} dental-appointment placeholders. Consider renaming in Meta to 'appointment_booked_patient'.",
  },
  {
    key: "APPOINTMENT_BOOKED_DOCTOR",
    description: "Appointment Booked - Doctor Alert",
    params: () => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return [
        "Dr. Sharma",
        "Test Patient",
        formatDateIN(date),
        "10:30 AM",
        "Consultation",
      ];
    },
    fallbackText: () => {
      const date = new Date();
      date.setDate(date.getDate() + 2);
      return buildAppointmentBookedDoctorMessage(
        { name: "Dr. Sharma" },
        { name: "Test Patient", phone: TEST_PHONE },
        formatDateIN(date),
        "10:30 AM",
        "Consultation",
      );
    },
  },
  {
    key: "APPOINTMENT_REMINDER_PATIENT",
    description: "Appointment Reminder - Patient (1 day before)",
    params: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return [
        "Test Patient",
        "Dr. Sharma",
        formatDateIN(date),
        "11:00 AM",
        "tomorrow",
      ];
    },
    fallbackText: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return buildAppointmentReminderPatientMessage(
        { name: "Test Patient" },
        "Dr. Sharma",
        formatDateIN(date),
        "11:00 AM",
        "tomorrow",
      );
    },
  },
  {
    key: "APPOINTMENT_REMINDER_DOCTOR",
    description: "Appointment Reminder - Doctor (1 day before)",
    params: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return [
        "Dr. Sharma",
        "Test Patient",
        formatDateIN(date),
        "11:00 AM",
        "tomorrow",
      ];
    },
    fallbackText: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return buildAppointmentReminderDoctorMessage(
        { name: "Dr. Sharma" },
        "Test Patient",
        formatDateIN(date),
        "11:00 AM",
        "tomorrow",
      );
    },
  },
  {
    key: "APPOINTMENT_RESCHEDULED_PATIENT",
    description: "Appointment Rescheduled - Patient Notification",
    params: () => {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() + 1);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      return [
        "Test Patient",
        formatDateIN(prevDate),
        formatDateIN(newDate),
        "02:00 PM",
        "RCT Treatment",
      ];
    },
    fallbackText: () => {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() + 1);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      return buildAppointmentRescheduledPatientMessage(
        { name: "Test Patient" },
        formatDateIN(prevDate),
        formatDateIN(newDate),
        "02:00 PM",
        "RCT Treatment",
      );
    },
  },
  {
    key: "APPOINTMENT_RESCHEDULED_DOCTOR",
    description: "Appointment Rescheduled - Doctor Alert",
    params: () => {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() + 1);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      return [
        "Dr. Sharma",
        "Test Patient",
        formatDateIN(prevDate),
        formatDateIN(newDate),
        "02:00 PM",
        "RCT Treatment",
      ];
    },
    fallbackText: () => {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() + 1);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      return buildAppointmentRescheduledDoctorMessage(
        { name: "Dr. Sharma" },
        "Test Patient",
        formatDateIN(prevDate),
        formatDateIN(newDate),
        "02:00 PM",
        "RCT Treatment",
      );
    },
  },
  {
    key: "APPOINTMENT_RESCHEDULED_EMPLOYEE",
    description: "Appointment Rescheduled - Staff/Employee Alert",
    params: () => {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() + 1);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      return [
        "Front Desk Staff",
        "Test Patient",
        "Dr. Sharma",
        formatDateIN(prevDate),
        formatDateIN(newDate),
        "02:00 PM",
        "RCT Treatment",
      ];
    },
    fallbackText: () => {
      const prevDate = new Date();
      prevDate.setDate(prevDate.getDate() + 1);
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 3);
      return buildAppointmentRescheduledEmployeeMessage(
        "Front Desk Staff",
        "Test Patient",
        "Dr. Sharma",
        formatDateIN(prevDate),
        formatDateIN(newDate),
        "02:00 PM",
        "RCT Treatment",
      );
    },
  },
  {
    key: "PRESCRIPTION",
    description: "Prescription Ready Notification",
    params: () => {
      const date = new Date();
      return [
        "Test Patient",
        "Dr. Sharma",
        "RX-TEST1234",
        formatDateIN(date),
        "Dental infection management",
        "Amoxicillin 500mg - 1-0-1 for 5 days, Paracetamol 500mg - 1-1-1 for 3 days",
        `${FRONTEND_URL}/patient/prescriptions`,
      ];
    },
    fallbackText: () =>
      buildPrescriptionMessageFull({
        patientName: "Test Patient",
        doctorName: "Dr. Sharma",
        date: formatDateIN(new Date()),
        rxId: "RX-TEST1234",
        diagnosis: "Dental infection management",
        meds:
          "1. Amoxicillin 500mg — 1-0-1 after food × 5 days\n   2. Paracetamol 500mg — 1-1-1 SOS for pain × 3 days",
        fileUrl: `${FRONTEND_URL}/patient/prescriptions`,
      }),
  },
  {
    key: "INVOICE",
    description: "Invoice / Bill Share",
    params: () => {
      return [
        "Test Patient",
        "INV-TEST-2026-001",
        formatCurrencyINR(2500),
        formatCurrencyINR(1000),
        formatCurrencyINR(1500),
        `${FRONTEND_URL}/patient/billing?invoiceId=test123`,
      ];
    },
    fallbackText: () =>
      buildInvoiceMessageFull({
        patientName: "Test Patient",
        invoiceNumber: "INV-TEST-2026-001",
        date: formatDateIN(new Date()),
        total: 2500,
        paid: 1000,
        balance: 1500,
        status: "Partial",
        items: [
          { desc: "Consultation Fee", qty: 1, total: 500 },
          { desc: "X-Ray (OPG)", qty: 1, total: 800 },
          { desc: "Scaling & Polishing", qty: 1, total: 1200 },
        ],
        paymentLink: `${FRONTEND_URL}/patient/billing?invoiceId=test123`,
      }),
  },
  {
    key: "INVOICE_PAYMENT_LINK",
    description: "Invoice Payment Link Share",
    params: () => [
      "Test Patient",
      "INV-TEST-2026-002",
      formatCurrencyINR(3500),
      `${FRONTEND_URL}/patient/billing?invoiceId=test456`,
    ],
    fallbackText: () =>
      buildInvoicePaymentLinkMessage({
        patientName: "Test Patient",
        invoiceNumber: "INV-TEST-2026-002",
        amount: formatCurrencyINR(3500),
        paymentLink: `${FRONTEND_URL}/patient/billing?invoiceId=test456`,
      }),
  },
  {
    key: "LOGIN_CREDENTIALS",
    description: "Patient Login Credentials",
    riskNote:
      ".env maps this to 'creadent_invoice_share' which appears to be an INVOICE template name. It is HIGHLY LIKELY Meta's 'creadent_invoice_share' template placeholders are invoice-related (amount/invoiceNo) NOT credentials (phone/password). This 4-parameter template should probably be renamed in Meta to e.g. 'patient_login_credentials'.",
    params: () => [
      "Test Patient",
      TEST_PHONE,
      "2026" + TEST_PHONE.slice(-4),
      `${FRONTEND_URL}/login`,
    ],
    fallbackText: () =>
      buildLoginCredentialsMessage({
        patientName: "Test Patient",
        phone: TEST_PHONE,
        password: "2026" + TEST_PHONE.slice(-4),
        loginLink: `${FRONTEND_URL}/login`,
      }),
  },
  {
    key: "FORGOT_PASSWORD_OTP",
    description: "Forgot Password OTP (with copy button)",
    params: () => ["123456"],
    fallbackText: () => buildForgotPasswordOtpMessage({ otp: "123456" }),
    buttonParams: () => ["123456"],
  },
  {
    key: "MANUAL_MESSAGE",
    description: "Manual / Free-form Message Template",
    params: () => [
      "Test Patient",
      "This is a test of the manual free-form message template system for Creadent Dental Clinic. Please ignore.",
    ],
    fallbackText: () =>
      buildManualMessage({
        name: "Test Patient",
        message:
          "This is a test of the manual free-form message template system for Creadent Dental Clinic. Please ignore.",
      }),
  },
  {
    key: "PAYMENT_THANK_YOU",
    description: "Payment Thank You + Review Request",
    params: () => [
      "Test Patient",
      "INV-TEST-2026-003",
      formatCurrencyINR(5000),
    ],
    fallbackText: () =>
      buildPaymentThankYouMessage({
        patientName: "Test Patient",
        invoiceNumber: "INV-TEST-2026-003",
        amountPaid: 5000,
        reviewLink: REVIEW_LINK,
      }),
  },
  {
    key: "RATE_US",
    description: "Rate Us / Google Review Request",
    params: () => ["Test Patient", REVIEW_LINK],
    fallbackText: () =>
      buildReviewLinkMessage({
        patientName: "Test Patient",
        reviewLink: REVIEW_LINK,
      }),
  },
];

async function ensureMongoConnection() {
  if (mongoose.connection.readyState === 1) return true;
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/creadent",
      { serverSelectionTimeoutMS: 5000 },
    );
    return true;
  } catch (err) {
    console.warn(
      "  ⚠️  MongoDB connection failed - WhatsAppMessage audit recording will be SKIPPED.",
      err.message,
    );
    return false;
  }
}

const getEnvTemplateName = (templateKey) =>
  process.env[`WHATSAPP_TEMPLATE_${templateKey}`];

const getEnvTemplateLang = (templateKey) =>
  process.env[`WHATSAPP_TEMPLATE_${templateKey}_LANGUAGE`] ||
  process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
  "en_US";

const getEnvButtonType = (templateKey) =>
  process.env[`WHATSAPP_TEMPLATE_${templateKey}_BUTTON_TYPE`] || null;

const getEnvButtonIndex = (templateKey) =>
  process.env[`WHATSAPP_TEMPLATE_${templateKey}_BUTTON_INDEX`] || "0";

async function testSingleTemplate(testDef, to, index, total) {
  console.log(`\n${SUB_DIVIDER}`);
  console.log(`  📋 TEMPLATE [${index}/${total}]: ${testDef.description}`);
  console.log(`     Template Key: ${testDef.key}`);
  if (testDef.riskNote)
    console.log(`     ⚠️  CONFIG RISK: ${testDef.riskNote}`);
  console.log(SUB_DIVIDER);

  const spec = TEMPLATE_REGISTRY[testDef.key] || { expectedParams: null };
  const templateName = getEnvTemplateName(testDef.key);
  const language = getEnvTemplateLang(testDef.key);
  const buttonType = getEnvButtonType(testDef.key);
  const buttonIndex = getEnvButtonIndex(testDef.key);
  const bodyParams = testDef.params();
  const fallbackText = testDef.fallbackText();
  const buttonParams = testDef.buttonParams ? testDef.buttonParams() : [];

  console.log(
    `  Configured Name : "${templateName || "(NOT SET)"}"`,
  );
  console.log(`  Language        : ${language}`);
  console.log(
    `  Expected Params : ${spec.expectedParams ?? "NOT IN REGISTRY"} (registry)`,
  );
  console.log(`  Actual Params   : ${bodyParams.length}`);
  if (buttonType)
    console.log(`  Button Type     : ${buttonType} (idx ${buttonIndex})`);

  if (spec.expectedParams !== null && spec.expectedParams !== bodyParams.length) {
    console.log(
      `  ❌ PRE-FLIGHT FAIL: Code registry expects ${spec.expectedParams} params but test sends ${bodyParams.length}. ABORTING.`,
    );
    return {
      key: testDef.key,
      description: testDef.description,
      templateName,
      configured: !!templateName,
      success: false,
      skipped: true,
      error: `Pre-flight param mismatch: registry=${spec.expectedParams} sent=${bodyParams.length}`,
    };
  }

  if (!templateName) {
    console.log(
      `  ❌ SKIPPED: Template name NOT in .env (set WHATSAPP_TEMPLATE_${testDef.key}).`,
    );
    return {
      key: testDef.key,
      description: testDef.description,
      templateName: null,
      configured: false,
      success: false,
      skipped: true,
      error: `Template name env var WHATSAPP_TEMPLATE_${testDef.key} not set`,
    };
  }

  console.log(`  Sending to: ${to}`);
  console.log(`  Body parameters: ${JSON.stringify(bodyParams)}`);

  try {
    const result = await sendTemplateWithFallback({
      to,
      templateName,
      templateKey: testDef.key,
      languageCode: language,
      bodyParameters: bodyParams,
      buttonType: buttonType || undefined,
      buttonIndex,
      buttonParameters: buttonParams,
      fallbackText,
      eventType: `sms_template_test__${testDef.key.toLowerCase()}`,
    });

    if (result.success) {
      if (result.usedFallback) {
        console.log(`  ⚠️  DELIVERED VIA FALLBACK (plain text)`);
        if (result.templateFailed) {
          console.log(
            `     Template failed reason: ${result.templateFailed.error || "unknown"}`,
          );
          console.log(
            `     Template skipped?       : ${result.templateFailed.skipped ? "YES" : "NO"}`,
          );
        }
        console.log(
          `     Fallback message id     : ${result.messageId || "(none)"}`,
        );
      } else {
        console.log(`  ✅ TEMPLATE DELIVERY SUCCESSFUL`);
        console.log(
          `     Meta template message id: ${result.messageId || "(none)"}`,
        );
      }
    } else if (result.skipped) {
      console.log(`  ⏭️  SKIPPED: ${result.error || "Unknown reason"}`);
    } else {
      console.log(`  ❌ FAILED TO DELIVER (neither template nor fallback worked)`);
      if (result.templateFailed) {
        console.log(
          `     Template error  : ${result.templateFailed.error || "unknown"}`,
        );
        console.log(
          `     Template skipped: ${result.templateFailed.skipped ? "YES" : "NO"}`,
        );
      }
      if (result.fallbackSuccess === false) {
        console.log(`     Fallback: ALSO FAILED`);
      }
      console.log(
        `     Final error     : ${result.error || "(no details)"}`,
      );
    }

    return {
      key: testDef.key,
      description: testDef.description,
      templateName,
      configured: true,
      success: result.success,
      skipped: result.skipped,
      error: result.error,
      usedFallback: result.usedFallback,
      templateSucceeded: result.templateSucceeded,
      templateFailed: result.templateFailed,
      fallbackSucceeded: result.fallbackSuccess,
      fallbackUsed: result.usedFallback,
      messageId: result.messageId,
    };
  } catch (err) {
    console.log(`  💥 UNEXPECTED EXCEPTION: ${err.message}`);
    return {
      key: testDef.key,
      description: testDef.description,
      templateName,
      configured: true,
      success: false,
      skipped: false,
      error: err.message,
      exception: true,
    };
  }
}

async function main() {
  console.log(DIVIDER);
  console.log("  🚀 CREADENT DENTAL CLINIC - WHATSAPP TEMPLATE SMS TEST SUITE (v2)");
  console.log(DIVIDER);
  console.log(`  Test Recipient       : ${TEST_PHONE}`);
  const to = normalizeTestPhone();
  console.log(`  Normalized E.164     : ${to || "(INVALID)"}`);
  console.log(`  Review Link          : ${REVIEW_LINK}`);
  console.log(`  Frontend URL         : ${FRONTEND_URL}`);
  console.log(`  Template count       : ${TEMPLATE_TESTS.length}`);
  console.log(`  Static audit status  : running now...`);

  const staticReport = auditWhatsAppTemplateRegistry({ includeValues: true });
  console.log(
    `  Static audit summary : ${staticReport.ok}/${staticReport.total} OK, ${staticReport.warn} warn, ${staticReport.error} err`,
  );
  console.log(
    `  Test begun at        : ${new Date().toLocaleString()}`,
  );
  console.log(DIVIDER);

  if (!to || to === "+") {
    console.log(
      "  ❌ FATAL: Invalid test phone number. Set WHATSAPP_TEST_TO=10digit in .env.",
    );
    process.exit(1);
  }

  console.log("\n  📡 Connecting to MongoDB (for WhatsAppMessage audit records)...");
  await ensureMongoConnection();
  console.log("     MongoDB connection state:", mongoose.connection.readyState);

  const results = [];
  const delayBetweenSendsMs = 3000;

  for (let i = 0; i < TEMPLATE_TESTS.length; i++) {
    const testDef = TEMPLATE_TESTS[i];
    const result = await testSingleTemplate(testDef, to, i + 1, TEMPLATE_TESTS.length);
    results.push(result);
    if (i < TEMPLATE_TESTS.length - 1) {
      await sleep(delayBetweenSendsMs);
    }
  }

  console.log(`\n\n${DIVIDER}`);
  console.log("  📊 FINAL TEST SUMMARY");
  console.log(DIVIDER);

  const summary = {
    total: results.length,
    configured: results.filter((r) => r.configured).length,
    templateSuccess: results.filter((r) => r.templateSucceeded).length,
    fallbackSuccess: results.filter((r) => r.usedFallback && r.success).length,
    totalDelivered: results.filter((r) => r.success).length,
    skipped: results.filter((r) => r.skipped).length,
    failed: results.filter((r) => !r.success && !r.skipped).length,
    tokenIssue:
      results.some((r) =>
        String(r.error || "").toLowerCase().includes("authentication failed (code 190)"),
      ) ||
      results.some((r) =>
        String(r.error || "").toLowerCase().includes("access token"),
      ) ||
      results.some((r) =>
        String(r.error || "").toLowerCase().includes("decrypted"),
      ),
  };

  console.log(`  Total templates to test     : ${summary.total}`);
  console.log(`  Configured in .env          : ${summary.configured}`);
  console.log(SUB_DIVIDER);
  console.log(`  ✅ Template native success  : ${summary.templateSuccess}`);
  console.log(`  ⚠️  Delivered via fallback  : ${summary.fallbackSuccess}`);
  console.log(`  📨 TOTAL DELIVERED (either) : ${summary.totalDelivered}`);
  console.log(`  ⏭️  Skipped (not sent)      : ${summary.skipped}`);
  console.log(`  ❌ FAILED (no delivery)     : ${summary.failed}`);
  console.log(SUB_DIVIDER);

  const deliveryRate = summary.configured
    ? ((summary.totalDelivered / Math.max(summary.configured, 1)) * 100).toFixed(1)
    : "0.0";
  const nativePassRate = summary.configured
    ? ((summary.templateSuccess / summary.configured) * 100).toFixed(1)
    : "0.0";

  console.log(`  Delivery rate (configured)  : ${deliveryRate}%`);
  console.log(`  Template native pass rate   : ${nativePassRate}%`);

  if (summary.tokenIssue) {
    console.log(SUB_DIVIDER);
    console.log(
      "  🔴 ACCESS TOKEN INVALID — ALL 15 SENDS FAILED WITH METACLOUD AUTH CODE 190",
    );
    console.log("     FIX (60 seconds):");
    console.log(
      "       1. Open https://business.facebook.com/ → WhatsApp Manager",
    );
    console.log(
      "       2. Select Creadent clinic → API Setup → 'Temporary access tokens'",
    );
    console.log(
      "       3. Pick your phone number → click 'Generate token' (128 chars, EAA...)",
    );
    console.log(
      "       4. Paste into backend/.env line  → WHATSAPP_ACCESS_TOKEN=EAA...",
    );
    console.log("       5. Re-run: node utils/whatsappAllTemplatesSmsTestV2.js");
    console.log(
      "       6. (Optional) Use SYSTEM USER + long-lived token (60 days)",
    );
    console.log(
      "          — https://business.facebook.com/ → Business settings → System users",
    );
  }

  console.log(`\n${DIVIDER}`);
  console.log("  📋 PER-TEMPLATE RESULTS");
  console.log(`${DIVIDER}\n`);

  results.forEach((r, idx) => {
    let icon = "❓";
    if (!r.configured) icon = "⬜";
    else if (r.skipped) icon = "⏭️";
    else if (r.templateSucceeded) icon = "✅";
    else if (r.usedFallback && r.success) icon = "⚠️";
    else if (r.success) icon = "✅";
    else icon = "❌";

    const line = [
      `  ${icon} [${String(idx + 1).padStart(2, "0")}]`,
      r.key.padEnd(36),
      (r.templateName || "(NOT CONFIGURED)").padEnd(35),
    ].join(" ");
    const statusLabel = r.templateSucceeded
      ? "TEMPLATE OK"
      : r.usedFallback && r.success
        ? "FALLBACK OK"
        : r.skipped
          ? "SKIPPED"
          : r.configured
            ? "FAILED"
            : "NOT CONFIGURED";
    console.log(`${line} | ${statusLabel}`);

    const err = r.templateFailed?.error || r.error;
    if (err && !r.templateSucceeded && r.configured && !r.skipped) {
      const short = String(err).substring(0, 180);
      console.log(`       └─ Error: ${short}`);
    }
  });

  const nativeFailures = results.filter(
    (r) => r.configured && !r.templateSucceeded && !r.skipped,
  );
  if (nativeFailures.length > 0 && !summary.tokenIssue) {
    console.log(`\n${DIVIDER}`);
    console.log("  🔧 TROUBLESHOOTING TIPS FOR NATIVE TEMPLATE FAILURES");
    console.log(`${DIVIDER}\n`);
    console.log("  For each template that didn't send natively but DID fallback OK:");
    console.log(
      "  1. Open Meta → WhatsApp Manager → Manage templates → locate template NAME",
    );
    console.log(
      "  2. Ensure STATUS column says either 'Active - Quality pending' or 'Active - High quality'",
    );
    console.log(
      "  3. Open template → Language tab → language code must exactly match .env",
    );
    console.log(
      "  4. Compare Body panel → count {{1}}..{{n}} placeholders vs _BODY_PARAMETER_COUNT in .env",
    );
    console.log(
      "  5. If template needs to be renamed, create a NEW template in Meta (you cannot rename existing)",
    );
    console.log(
      "     Then update .env WHATSAPP_TEMPLATE_<KEY>=<new_name> and re-run test.",
    );
  }

  console.log(`\n${DIVIDER}`);
  console.log(
    `  🕐 Test finished at  : ${new Date().toLocaleString()}`,
  );
  console.log(`  📱 Recipient phone   : ${to}`);
  console.log(
    `  👉 ${summary.totalDelivered} messages should arrive on ${to} within 30-120s if any succeeded.`,
  );
  console.log(
    `     🌐 Webhook status events (sent/delivered/read/failed) will be POSTed to:`,
  );
  console.log(
    `        ${FRONTEND_URL}/webhooks/whatsapp  ← Configure this in Meta.`,
  );
  console.log(DIVIDER);

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("\n💥 FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});

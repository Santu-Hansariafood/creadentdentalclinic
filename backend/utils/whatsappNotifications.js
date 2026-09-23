const https = require("https");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const Patient = require("../models/Patient");
const User = require("../models/User");
const WhatsAppMessage = require("../models/WhatsAppMessage");
const storageService = require("./storageService");

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";
const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
const GRAPH_API_HOST = "graph.facebook.com";

const normalizeTemplateLanguage = (value) => {
  const [language, region] = String(value || "en")
    .replace("-", "_")
    .split("_");
  return region
    ? `${language.toLowerCase()}_${region.toUpperCase()}`
    : language.toLowerCase();
};

const DEFAULT_LANGUAGE_CODE = normalizeTemplateLanguage(
  process.env.WHATSAPP_TEMPLATE_LANGUAGE,
);
const FRONTEND_URL = process.env.FRONTEND_URL || "https://creadentsmiles.com";
const REVIEW_LINK = process.env.WHATSAPP_REVIEW_LINK || "";

const TEMPLATE_REGISTRY = Object.freeze({
  APPOINTMENT_BOOKED_PATIENT: {
    expectedParams: 5,
    labels: [
      "patientName",
      "doctorName",
      "appointmentDate",
      "appointmentTime",
      "appointmentType",
    ],
    description: "Appointment booked - patient confirmation",
    required: true,
  },
  APPOINTMENT_BOOKED_DOCTOR: {
    expectedParams: 5,
    labels: [
      "doctorName",
      "patientName",
      "appointmentDate",
      "appointmentTime",
      "appointmentType",
    ],
    description: "Appointment booked - doctor alert",
    required: true,
  },
  APPOINTMENT_REMINDER_PATIENT: {
    expectedParams: 5,
    labels: [
      "patientName",
      "doctorName",
      "appointmentDate",
      "appointmentTime",
      "whenText",
    ],
    description: "Appointment reminder (1d/6h/1h) - patient",
    required: true,
  },
  APPOINTMENT_REMINDER_DOCTOR: {
    expectedParams: 5,
    labels: [
      "doctorName",
      "patientName",
      "appointmentDate",
      "appointmentTime",
      "whenText",
    ],
    description: "Appointment reminder (1d/1h) - doctor",
    required: true,
  },
  APPOINTMENT_RESCHEDULED_PATIENT: {
    expectedParams: 5,
    labels: [
      "patientName",
      "previousDate",
      "newDate",
      "newTime",
      "appointmentType",
    ],
    description: "Appointment rescheduled - patient",
    required: true,
  },
  APPOINTMENT_RESCHEDULED_DOCTOR: {
    expectedParams: 6,
    labels: [
      "doctorName",
      "patientName",
      "previousDate",
      "newDate",
      "newTime",
      "appointmentType",
    ],
    description: "Appointment rescheduled - doctor",
    required: true,
  },
  APPOINTMENT_RESCHEDULED_EMPLOYEE: {
    expectedParams: 7,
    labels: [
      "employeeName",
      "patientName",
      "doctorName",
      "previousDate",
      "newDate",
      "newTime",
      "appointmentType",
    ],
    description: "Appointment rescheduled - staff/employee",
    required: true,
  },
  PRESCRIPTION: {
    expectedParams: 7,
    labels: [
      "patientName",
      "doctorName",
      "prescriptionId",
      "prescriptionDate",
      "diagnosis",
      "medications",
      "fileUrl",
    ],
    description: "Prescription ready notification",
    required: true,
  },
  INVOICE: {
    expectedParams: 6,
    labels: [
      "patientName",
      "invoiceNumber",
      "invoiceTotal",
      "amountPaid",
      "balance",
      "viewInvoiceLink",
    ],
    description: "Invoice/bill share",
    required: true,
  },
  INVOICE_PAYMENT_LINK: {
    expectedParams: 4,
    labels: ["patientName", "invoiceNumber", "balance", "paymentLink"],
    description: "Invoice payment link share",
    required: true,
  },
  LOGIN_CREDENTIALS: {
    expectedParams: 4,
    labels: ["patientName", "phone", "password", "loginLink"],
    description: "Patient login credentials",
    required: true,
  },
  FORGOT_PASSWORD_OTP: {
    expectedParams: 1,
    labels: ["otp"],
    description: "Forgot password OTP (optionally copy-paste button)",
    required: true,
  },
  MANUAL_MESSAGE: {
    expectedParams: 2,
    labels: ["patientName", "customMessage"],
    description: "Manual free-form message template",
    required: true,
  },
  PAYMENT_THANK_YOU: {
    expectedParams: 3,
    labels: ["patientName", "invoiceNumber", "amountPaid"],
    description: "Payment thanks + review request",
    required: true,
  },
  RATE_US: {
    expectedParams: 2,
    labels: ["patientName", "reviewLink"],
    description: "Rate us / Google review request",
    required: true,
  },
});

const getTemplateEnvName = (templateKey) =>
  process.env[`WHATSAPP_TEMPLATE_${templateKey}`];

const auditWhatsAppTemplateRegistry = ({ includeValues = false } = {}) => {
  const keys = Object.keys(TEMPLATE_REGISTRY);
  const results = {};
  for (const key of keys) {
    const spec = TEMPLATE_REGISTRY[key];
    const envName = getTemplateEnvName(key);
    const envParamCountStr =
      process.env[`WHATSAPP_TEMPLATE_${key}_BODY_PARAMETER_COUNT`];
    const envParamCount =
      envParamCountStr === undefined || envParamCountStr === ""
        ? null
        : Number(envParamCountStr);
    const envLanguageRaw =
      process.env[`WHATSAPP_TEMPLATE_${key}_LANGUAGE`] ||
      process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
      "en_US";
    const envLanguage = normalizeTemplateLanguage(envLanguageRaw);
    const paramCountMismatch =
      envParamCount === null
        ? "missing"
        : envParamCount !== spec.expectedParams
          ? `env=${envParamCount} code=${spec.expectedParams}`
          : null;
    const configured = Boolean(envName) && envParamCount !== null;
    const issues = [];
    if (!envName) issues.push("template name not set in .env");
    if (envParamCount === null)
      issues.push("body parameter count not set in .env");
    if (paramCountMismatch && paramCountMismatch !== "missing")
      issues.push(`parameter count mismatch (${paramCountMismatch})`);
    if (envName && /[A-Z -]/.test(envName))
      issues.push(
        "template name contains uppercase/spaces/dashes - Meta template names are lowercase underscore",
      );
    results[key] = {
      description: spec.description,
      expectedParams: spec.expectedParams,
      labels: spec.labels,
      templateName: includeValues ? envName : envName ? "<configured>" : null,
      language: envLanguage,
      configured,
      status:
        issues.length === 0
          ? "ok"
          : issues.some((issue) => issue.includes("parameter count mismatch"))
            ? "warn"
            : "error",
      issues,
    };
  }
  return {
    total: keys.length,
    configured: Object.values(results).filter((r) => r.configured).length,
    ok: Object.values(results).filter((r) => r.status === "ok").length,
    warn: Object.values(results).filter((r) => r.status === "warn").length,
    error: Object.values(results).filter((r) => r.status === "error").length,
    templates: results,
  };
};

const runWhatsAppSelfAudit = () => {
  const report = auditWhatsAppTemplateRegistry({ includeValues: true });
  const header = "[WHATSAPP-SELF-AUDIT]";
  console.log(
    `${header} ${report.total} templates | ${report.ok} ok | ${report.warn} warn | ${report.error} error | ${report.configured}/${report.total} configured in .env`,
  );
  for (const [key, r] of Object.entries(report.templates)) {
    if (r.status === "ok") continue;
    console.log(
      `${header} ${r.status.toUpperCase()} ${key}: ${r.issues.join("; ")} | name=${r.templateName || "NULL"} | params=${r.expectedParams} | lang=${r.language}`,
    );
  }
  return report;
};

const getTemplateBodyParameterCount = (templateKey) => {
  if (TEMPLATE_REGISTRY[templateKey])
    return TEMPLATE_REGISTRY[templateKey].expectedParams;
  const value =
    process.env[`WHATSAPP_TEMPLATE_${templateKey}_BODY_PARAMETER_COUNT`];
  if (value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : null;
};

const getTemplateLanguage = (templateKey) =>
  normalizeTemplateLanguage(
    process.env[`WHATSAPP_TEMPLATE_${templateKey}_LANGUAGE`] ||
      process.env.WHATSAPP_TEMPLATE_LANGUAGE,
  );

const validateTemplateParameters = (
  templateKey,
  templateName,
  bodyParameters,
) => {
  if (!templateName) return "WhatsApp template name is not configured";
  const expectedCount = getTemplateBodyParameterCount(templateKey);
  if (expectedCount === null) {
    return `WHATSAPP_TEMPLATE_${templateKey}_BODY_PARAMETER_COUNT is not configured`;
  }
  if (bodyParameters.length !== expectedCount) {
    return `WhatsApp template ${templateName} expects ${expectedCount} body parameters, received ${bodyParameters.length}`;
  }
  return null;
};

const toObjectIdString = (value) => {
  if (!value) return "";
  return value.toString();
};

const toE164Format = (digits, countryCode = DEFAULT_COUNTRY_CODE) => {
  if (!digits) return "";
  const clean = String(digits).replace(/\D/g, "");
  if (!clean) return "";
  const stripped = clean.startsWith("0") ? clean.slice(1) : clean;
  if (!stripped) return "";
  const digitsToFormat =
    stripped.length === 10 ? `${countryCode}${stripped}` : stripped;
  return `+${digitsToFormat.replace(/^\+/, "")}`;
};

const sanitizeRecipient = (to) => String(to || "").replace(/[^\d]/g, "");

const normalizePhoneNumber = (phone) => {
  const digitsOnly = String(phone || "").replace(/\D/g, "");
  return toE164Format(digitsOnly, DEFAULT_COUNTRY_CODE);
};

const recordWhatsAppMessage = async ({
  direction = "outbound",
  phone,
  text = "",
  messageType = "text",
  templateName,
  templateParameters,
  status = "sent",
  messageId,
  error,
  invoiceId,
  eventType,
  read = direction === "outbound",
  sentBy,
}) => {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    const patient = normalizedPhone
      ? await Patient.findOne({
          phone: { $in: [normalizedPhone, normalizedPhone.slice(-10)] },
        })
      : null;
    const recipientUser =
      !patient && normalizedPhone
        ? await User.findOne({
            phone: { $in: [normalizedPhone, normalizedPhone.slice(-10)] },
          })
        : null;
    await WhatsAppMessage.create({
      direction,
      phone: normalizedPhone || String(phone || ""),
      patientId: patient?._id,
      patientName: patient?.name || recipientUser?.name,
      text,
      messageType,
      templateName,
      templateParameters,
      invoiceId,
      eventType,
      status,
      messageId,
      error,
      read,
      sentBy,
    });
  } catch (recordError) {
    console.warn(
      "[WHATSAPP] Could not save message history:",
      recordError.message,
    );
  }
};

const hasWhatsAppBaseConfig = () => {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID,
  );
};

const getWhatsAppErrorMessage = (responseBody, fallback) => {
  try {
    const error = JSON.parse(responseBody)?.error;
    if (error?.message) {
      if (String(error.code) === "190") {
        return "WhatsApp authentication failed (code 190). Replace the expired or revoked WHATSAPP_ACCESS_TOKEN and restart the backend; verify it belongs to the configured WHATSAPP_PHONE_NUMBER_ID.";
      }
      if (String(error.code) === "132001") {
        return `${error.message} | Template name or translation is missing. Verify the exact approved Meta template name and language for the configured WhatsApp Business account (configured template: ${process.env.WHATSAPP_TEMPLATE_PAYMENT_THANK_YOU || "unknown"}/${process.env.WHATSAPP_TEMPLATE_RATE_US || "unknown"}, language: ${DEFAULT_LANGUAGE_CODE}).`;
      }
      return [error.message, error.code && `code ${error.code}`, error.type]
        .filter(Boolean)
        .join(" | ");
    }
  } catch (_) {}
  return fallback || responseBody || "WhatsApp request failed";
};

const buildTemplatePayload = ({
  to,
  templateName,
  languageCode = DEFAULT_LANGUAGE_CODE,
  bodyParameters = [],
  buttonParameters = [],
  buttonType,
  buttonIndex = "0",
}) => {
  const payload = {
    messaging_product: "whatsapp",
    to: sanitizeRecipient(to),
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };
  const components = [];
  if (bodyParameters.length > 0) {
    components.push({
      type: "body",
      parameters: bodyParameters.map((text) => ({
        type: "text",
        text: String(text ?? ""),
      })),
    });
  }
  if (buttonType && buttonParameters.length > 0) {
    const normalizedButtonType = String(buttonType || "").toLowerCase();
    const parameterType =
      normalizedButtonType === "quick_reply" ? "payload" : "text";
    const parameterKey = parameterType === "payload" ? "payload" : "text";
    const baseIndex = Number.parseInt(String(buttonIndex || "0"), 10) || 0;
    buttonParameters.forEach((value, i) => {
      components.push({
        type: "button",
        sub_type: normalizedButtonType || undefined,
        index: String(baseIndex + i),
        parameters: [
          {
            type: parameterType,
            [parameterKey]: String(value ?? ""),
          },
        ],
      });
    });
  }
  if (components.length > 0) {
    payload.template.components = components;
  }
  return payload;
};

const buildTextPayload = ({ to, text }) => {
  return {
    messaging_product: "whatsapp",
    to: sanitizeRecipient(to),
    type: "text",
    text: {
      preview_url: true,
      body: String(text ?? ""),
    },
  };
};

const buildDocumentPayload = ({
  to,
  documentUrl,
  documentId,
  fileName,
  caption,
}) => ({
  messaging_product: "whatsapp",
  to: sanitizeRecipient(to),
  type: "document",
  document: {
    ...(documentId ? { id: documentId } : { link: documentUrl }),
    filename: fileName,
    caption,
  },
});

const fetchImageBuffer = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          reject(new Error(`Image request failed with status ${response.statusCode}`));
          return;
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });

const createInvoicePdfBuffer = async (invoice, patientContact) => {
  const document = new PDFDocument({ size: "A4", margin: 56 });
  const chunks = [];
  document.on("data", (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 56;
  const right = pageWidth - margin;
  const clinicEmail = "creadentmultispecialitydentalc@gmail.com";
  const clinicAddress =
    "BD-85, Salt Lake Rd, BD Block, Sector 1, Bidhannagar, Kolkata, West Bengal 700064";
  let y = margin;

  try {
    const logo = await fetchImageBuffer("https://creadentsmiles.com/logo/logo.png");
    document.roundedRect(margin, y, 4, 30).fill("#0f766e");
    document.image(logo, margin + 10, y, { fit: [30, 30] });
    document.fillColor("#0f172a").font("Helvetica-Bold").fontSize(16)
      .text("Creadent Multispeciality Dental Clinic", margin + 48, y + 1);
    document.fillColor("#475569").font("Helvetica").fontSize(8)
      .text(clinicAddress, margin + 48, y + 17)
      .text(`Phone: +91 6292300343  |  Email: ${clinicEmail}`, margin + 48, y + 28);
  } catch (_) {
    document.roundedRect(margin, y, 4, 30).fill("#0f766e");
    document.fillColor("#0f172a").font("Helvetica-Bold").fontSize(16)
      .text("Creadent Multispeciality Dental Clinic", margin + 12, y + 1);
    document.fillColor("#475569").font("Helvetica").fontSize(8)
      .text(clinicAddress, margin + 12, y + 17)
      .text(`Phone: +91 6292300343  |  Email: ${clinicEmail}`, margin + 12, y + 28);
  }
  document.strokeColor("#cbd5e1").lineWidth(0.35)
    .moveTo(margin, y + 40).lineTo(right, y + 40).stroke();
  y += 58;

  const title = invoice.status === "Paid" ? "RECEIPT" : "INVOICE";
  document.fillColor("#0f766e").font("Helvetica-Bold").fontSize(22).text(title, margin, y);
  document.fillColor("#64748b").font("Helvetica").fontSize(8)
    .text(invoice.status === "Paid" ? "OFFICIAL PAYMENT RECEIPT" : "DENTAL CARE INVOICE", margin, y + 25);
  document.fillColor("#111827").fontSize(10)
    .text(`Invoice #: ${invoice.invoiceNumber || "-"}`, right - 150, y + 1, { width: 150, align: "right" })
    .text(`Date: ${formatDateIN(invoice.date || invoice.createdAt) || formatDateIN(new Date())}`, right - 150, y + 17, { width: 150, align: "right" });
  if (invoice.status === "Paid" || invoice.paymentDate) {
    document.fillColor("#10b981")
      .text(`Received Date: ${formatDateIN(invoice.paymentDate || invoice.date)}`, right - 150, y + 33, { width: 150, align: "right" });
  }
  y += 62;

  document.fillColor("#111827").font("Helvetica-Bold").fontSize(12).text("Bill To:", margin, y);
  y += 18;
  document.font("Helvetica").fontSize(10);
  const patient = invoice.patient || {};
  const patientText = [
    invoice.patientName || patientContact.name || "Patient",
    patient.phone || invoice.patientPhone || patientContact.rawPhone
      ? `Mobile: ${patient.phone || invoice.patientPhone || patientContact.rawPhone}`
      : null,
    patient.address || invoice.patientAddress ? `Address: ${patient.address || invoice.patientAddress}` : null,
    patient.age || invoice.patientAge ? `Age: ${patient.age || invoice.patientAge}` : null,
  ].filter(Boolean).join(" | ");
  document.text(patientText, margin, y, { width: right - margin });
  y += 28;

  const colDescription = margin;
  const colQuantity = right - 180;
  const colPrice = right - 105;
  document.font("Helvetica-Bold").text("Description", colDescription, y)
    .text("Qty", colQuantity, y, { width: 35 })
    .text("Price", colPrice, y, { width: 55 })
    .text("Amount", right - 62, y, { width: 62, align: "right" });
  y += 8;
  document.strokeColor("#cbd5e1").moveTo(margin, y).lineTo(right, y).stroke();
  y += 14;
  document.font("Helvetica");
  (invoice.items || []).forEach((item) => {
    const lines = document.heightOfString(item.description || "Treatment", { width: colQuantity - colDescription - 12 });
    document.text(item.description || "Treatment", colDescription, y, { width: colQuantity - colDescription - 12 })
      .text(String(item.quantity || 1), colQuantity, y, { width: 35 })
      .text(`Rs. ${Number(item.unitPrice || 0).toFixed(2)}`, colPrice, y, { width: 70 })
      .text(`Rs. ${Number(item.total || 0).toFixed(2)}`, right - 62, y, { width: 62, align: "right" });
    y += Math.max(20, lines + 6);
  });
  document.strokeColor("#cbd5e1").moveTo(margin, y).lineTo(right, y).stroke();
  y += 18;

  const summaryX = right - 145;
  const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
  const summaryLine = (label, value, color = "#111827", bold = false) => {
    document.fillColor(color).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10)
      .text(label, summaryX, y).text(value, right - 95, y, { width: 95, align: "right" });
    y += bold ? 20 : 16;
  };
  summaryLine("Subtotal:", money(invoice.subtotal));
  if (Number(invoice.discount || 0) > 0) summaryLine("Discount:", `-${money(invoice.discount)}`, "#10b981");
  y += 4;
  document.strokeColor("#007faf").moveTo(summaryX - 5, y).lineTo(right, y).stroke();
  y += 12;
  summaryLine("Total:", money(invoice.total), "#111827", true);
  if (Number(invoice.amountPaid || 0) > 0) summaryLine("Amount Paid:", money(invoice.amountPaid), "#10b981");
  if (Number(invoice.balance || 0) > 0) summaryLine("Balance Due:", money(invoice.balance), "#ef4444", true);

  if (invoice.insuranceClaim) {
    y += 10;
    document.fillColor("#111827").font("Helvetica-Bold").fontSize(10).text("Insurance Claim Information:", margin, y);
    y += 16;
    document.font("Helvetica").text(`Provider: ${invoice.insuranceClaim.provider}`, margin, y)
      .text(`Claim Number: ${invoice.insuranceClaim.claimNumber}`, margin, y + 14)
      .text(`Claim Amount: ${money(invoice.insuranceClaim.claimAmount)}`, margin, y + 28)
      .text(`Status: ${invoice.insuranceClaim.status}`, margin, y + 42);
    y += 58;
  }

  if (invoice.paymentMethod || invoice.paymentDate || invoice.transactionId || invoice.merchantTxnNo || invoice.pgTxnNo) {
    y += 8;
    document.fillColor("#111827").font("Helvetica-Bold").fontSize(10).text("Payment Information:", margin, y);
    y += 16;
    document.font("Helvetica").text(`Transaction Mode: ${invoice.paymentMethod || "-"}`, margin, y)
      .text(`Received Date: ${formatDateIN(invoice.paymentDate || invoice.date)}`, margin, y + 14);
    y += 30;
    [["Transaction ID", invoice.transactionId], ["Merchant Reference", invoice.merchantTxnNo], ["PG Transaction No", invoice.pgTxnNo], ["Authorization Ref", invoice.authRefNo]].forEach(([label, value]) => {
      if (value) {
        document.text(`${label}: ${value}`, margin, y);
        y += 14;
      }
    });
  }

  if (invoice.notes) {
    y += 10;
    document.fillColor("#646464").font("Helvetica-Oblique").fontSize(9)
      .text(`Notes: ${invoice.notes}`, margin, y, { width: right - margin - 30 });
  }

  try {
    const qrData = invoice.status === "Paid"
      ? `Receipt: ${invoice.invoiceNumber} | Paid: ${money(invoice.total)}`
      : `Invoice: ${invoice.invoiceNumber}`;
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 120, margin: 2 });
    document.image(Buffer.from(qrDataUrl.split(",")[1], "base64"), right - 40, pageHeight - 92, { fit: [40, 40] });
    document.fillColor("#646464").font("Helvetica").fontSize(6).text("Scan to verify", right - 40, pageHeight - 48, { width: 40, align: "center" });
  } catch (_) {}

  document.fillColor("#969696").font("Helvetica").fontSize(8)
    .text("Thank you for choosing Creadent Multispeciality Dental Clinic", margin, pageHeight - 28, { width: right - margin, align: "center" })
    .text(`For questions, contact us at ${clinicEmail}`, margin, pageHeight - 16, { width: right - margin, align: "center" });
  document.end();
  return finished;
};

const postToWhatsApp = ({
  payload,
  to,
  text,
  messageType,
  templateName,
  templateParameters,
  invoiceId,
  eventType,
  read,
  skipRecord = false,
}) =>
  new Promise((resolve) => {
    const body = JSON.stringify(payload);
    const request = https.request(
      {
        hostname: GRAPH_API_HOST,
        path: `/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let responseBody = "";
        response.on("data", (chunk) => {
          responseBody += chunk;
        });
        response.on("end", () => {
          const ok = response.statusCode >= 200 && response.statusCode < 300;
          let parsedBody = null;
          try {
            parsedBody = JSON.parse(responseBody);
          } catch (_) {}
          const errorMessage = ok
            ? undefined
            : getWhatsAppErrorMessage(responseBody, response.statusMessage);

          if (!ok) {
            console.warn(
              `[WHATSAPP] Send failed (status ${response.statusCode}) to=${sanitizeRecipient(to)} type=${messageType || "text"}${
                templateName ? ` template=${templateName}` : ""
              } error=${errorMessage}`,
            );
          }

          if (!skipRecord) {
            void recordWhatsAppMessage({
              phone: to,
              text: text || (templateName ? `Template: ${templateName}` : ""),
              messageType,
              templateName,
              templateParameters,
              status: ok ? "sent" : "failed",
              messageId: parsedBody?.messages?.[0]?.id,
              error: errorMessage,
              invoiceId,
              eventType,
              read,
            });
          }

          resolve({
            success: ok,
            statusCode: response.statusCode,
            body: responseBody,
            messageId: parsedBody?.messages?.[0]?.id,
            error: ok ? null : errorMessage,
          });
        });
      },
    );
    request.on("error", (error) => {
      console.warn(
        `[WHATSAPP] Request error to=${sanitizeRecipient(to)}: ${error.message}`,
      );
      if (!skipRecord) {
        void recordWhatsAppMessage({
          phone: to,
          text: text || (templateName ? `Template: ${templateName}` : ""),
          messageType,
          templateName,
          templateParameters,
          status: "failed",
          error: error.message,
          invoiceId,
          eventType,
          read,
        });
      }
      resolve({ success: false, error: error.message });
    });
    request.write(body);
    request.end();
  });

const uploadWhatsAppMedia = async ({ buffer, fileName, mimetype }) => {
  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append(
    "file",
    new Blob([buffer], { type: mimetype || "application/pdf" }),
    fileName,
  );

  const response = await fetch(
    `https://${GRAPH_API_HOST}/${GRAPH_API_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
      body: form,
    },
  );
  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(getWhatsAppErrorMessage(responseBody, response.statusText));
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(responseBody);
  } catch (_) {
    throw new Error("WhatsApp media upload returned an invalid response");
  }
  if (!parsedBody.id) {
    throw new Error("WhatsApp media upload did not return a media ID");
  }
  return parsedBody.id;
};

const sendWhatsAppDocumentMessage = ({
  to,
  documentUrl,
  documentBuffer,
  fileName,
  caption,
  invoiceId,
  eventType,
}) => {
  if (!hasWhatsAppBaseConfig()) {
    void recordWhatsAppMessage({
      phone: to,
      text: caption || `Invoice PDF: ${fileName}`,
      messageType: "document",
      invoiceId,
      eventType,
      status: "skipped",
      error: "WhatsApp configuration is incomplete",
    });
    return Promise.resolve({
      success: false,
      skipped: true,
      error: "WhatsApp configuration is incomplete",
    });
  }
  if (!to || (!documentUrl && !documentBuffer)) {
    void recordWhatsAppMessage({
      phone: to,
      text: caption || `Invoice PDF: ${fileName}`,
      messageType: "document",
      invoiceId,
      eventType,
      status: "skipped",
      error: "WhatsApp document recipient or file is missing",
    });
    return Promise.resolve({
      success: false,
      skipped: true,
      error: "WhatsApp document recipient or file is missing",
    });
  }
  return (async () => {
    try {
      const documentId = documentBuffer
        ? await uploadWhatsAppMedia({
            buffer: documentBuffer,
            fileName,
            mimetype: "application/pdf",
          })
        : null;
      return await postToWhatsApp({
        payload: buildDocumentPayload({
          to,
          documentUrl,
          documentId,
          fileName,
          caption,
        }),
        to,
        text: caption || `Invoice PDF: ${fileName}`,
        messageType: "document",
        invoiceId,
        eventType,
      });
    } catch (error) {
      void recordWhatsAppMessage({
        phone: to,
        text: caption || `Invoice PDF: ${fileName}`,
        messageType: "document",
        invoiceId,
        eventType,
        status: "failed",
        error: error.message,
      });
      return { success: false, error: error.message };
    }
  })();
};

const sendWhatsAppTemplateMessage = ({
  to,
  templateName,
  bodyParameters = [],
  buttonParameters = [],
  buttonType,
  buttonIndex,
  templateKey,
  languageCode,
  invoiceId,
  eventType,
  displayText,
  skipRecord = false,
}) => {
  if (!hasWhatsAppBaseConfig()) {
    if (!skipRecord) {
      void recordWhatsAppMessage({
        phone: to,
        text: `Template: ${templateName}`,
        messageType: "template",
        templateName,
        invoiceId,
        eventType,
        status: "skipped",
        error: "WhatsApp configuration is incomplete",
      });
    }
    return Promise.resolve({
      success: false,
      skipped: true,
      error:
        "WhatsApp configuration is incomplete. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
    });
  }
  const validationError = templateKey
    ? validateTemplateParameters(templateKey, templateName, bodyParameters)
    : null;
  if (validationError) {
    console.warn(`[WHATSAPP] Template validation failed: ${validationError}`);
    if (!skipRecord) {
      void recordWhatsAppMessage({
        phone: to,
        text: displayText || `Template: ${templateName || "unknown"}`,
        messageType: "template",
        templateName,
        templateParameters: bodyParameters.map((value) => String(value ?? "")),
        invoiceId,
        eventType,
        status: "skipped",
        error: validationError,
      });
    }
    return Promise.resolve({
      success: false,
      skipped: true,
      error: validationError,
    });
  }
  if (!to || !templateName) {
    if (!skipRecord) {
      void recordWhatsAppMessage({
        phone: to,
        text: `Template: ${templateName || "unknown"}`,
        messageType: "template",
        templateName,
        invoiceId,
        eventType,
        status: "skipped",
        error: "WhatsApp destination or template name is missing",
      });
    }
    return Promise.resolve({
      success: false,
      skipped: true,
      error: "WhatsApp destination or template name is missing.",
    });
  }
  return postToWhatsApp({
    payload: buildTemplatePayload({
      to,
      templateName,
      languageCode: languageCode || getTemplateLanguage(templateKey),
      bodyParameters,
      buttonParameters,
      buttonType,
      buttonIndex,
    }),
    to,
    text: displayText || `Template: ${templateName}`,
    messageType: "template",
    templateName,
    templateParameters: bodyParameters.map((value) => String(value ?? "")),
    invoiceId,
    eventType,
    skipRecord,
  });
};

const sendTemplateWithFallback = async ({
  to,
  templateName,
  templateKey,
  bodyParameters = [],
  buttonParameters = [],
  buttonType,
  buttonIndex,
  languageCode,
  fallbackText,
  invoiceId,
  eventType,
  sentBy,
}) => {
  const combined = {
    to,
    templateName: templateName || null,
    templateKey: templateKey || null,
    templateSuccess: false,
    templateSkipped: false,
    templateError: null,
    fallbackSuccess: false,
    fallbackSkipped: false,
    fallbackError: null,
    usedFallback: false,
    status: "sent",
    finalError: null,
    messageId: null,
    success: false,
    skipped: false,
    error: null,
  };
  let templateResult = null;
  if (templateName) {
    templateResult = await sendWhatsAppTemplateMessage({
      to,
      templateName,
      templateKey,
      languageCode,
      bodyParameters,
      buttonParameters,
      buttonType,
      buttonIndex,
      displayText: fallbackText,
      invoiceId,
      eventType,
      skipRecord: true,
    });
    combined.templateSuccess = Boolean(templateResult?.success);
    combined.templateSkipped = Boolean(templateResult?.skipped);
    combined.templateError = templateResult?.error || null;
    combined.messageId = templateResult?.messageId || combined.messageId;
    if (templateResult?.success) {
      combined.status = "sent";
      combined.success = true;
      combined.skipped = false;
      combined.finalError = null;
      combined.error = null;
    }
  }

  let shouldTryFallback = false;
  if (!templateName) {
    shouldTryFallback = true;
  } else if (templateResult && !templateResult.success) {
    if (templateResult.skipped) {
      const isBaseConfigMissing = String(templateResult.error || "")
        .toLowerCase()
        .includes("configuration is incomplete");
      if (!isBaseConfigMissing) {
        shouldTryFallback = true;
      } else {
        combined.status = "skipped";
        combined.skipped = true;
        combined.error = templateResult.error;
        combined.finalError = templateResult.error;
      }
    } else {
      shouldTryFallback = true;
    }
  }

  if (shouldTryFallback) {
    combined.usedFallback = true;
    const textResult = await sendWhatsAppTextMessage({
      to,
      text: fallbackText,
      invoiceId,
      eventType,
      skipRecord: true,
    });
    combined.fallbackSuccess = Boolean(textResult?.success);
    combined.fallbackSkipped = Boolean(textResult?.skipped);
    combined.fallbackError = textResult?.error || null;
    combined.messageId = textResult?.messageId || combined.messageId;
    if (textResult?.success) {
      combined.status = "sent";
      combined.success = true;
      combined.skipped = false;
      combined.finalError = null;
      combined.error = null;
    } else {
      if (!combined.error) {
        combined.error = combined.templateError || textResult?.error || null;
      }
      combined.finalError =
        combined.templateError && textResult?.error
          ? `Template failed: ${combined.templateError} | Fallback failed: ${textResult?.error}`
          : combined.templateError || textResult?.error || "Send failed";
      combined.status = "failed";
      combined.success = false;
      combined.skipped = Boolean(
        textResult?.skipped && !combined.templateError,
      );
    }
  }

  const combinedDisplayText =
    fallbackText || `Template: ${templateName || "unknown"}`;
  void recordWhatsAppMessage({
    phone: to,
    text: combinedDisplayText,
    messageType: combined.usedFallback ? "text" : "template",
    templateName: combined.templateName || undefined,
    templateParameters: bodyParameters.map((value) => String(value ?? "")),
    status: combined.status,
    messageId: combined.messageId,
    error: combined.finalError,
    invoiceId,
    eventType: eventType
      ? `${eventType}${combined.usedFallback ? "_fallback" : ""}`
      : undefined,
    templateFailed:
      combined.templateName && !combined.templateSuccess
        ? {
            skipped: combined.templateSkipped,
            error: combined.templateError,
          }
        : undefined,
    fallbackUsed: combined.usedFallback,
    fallbackSucceeded: combined.fallbackSuccess,
    sentBy,
  });

  return {
    success: combined.success,
    skipped: combined.skipped,
    error: combined.error,
    statusCode: templateResult?.statusCode,
    messageId: combined.messageId,
    templateName: combined.templateName,
    templateKey: combined.templateKey,
    usedFallback: combined.usedFallback,
    templateSucceeded: combined.templateSuccess,
    templateFailed:
      combined.templateName && !combined.templateSuccess
        ? {
            skipped: combined.templateSkipped,
            error: combined.templateError,
          }
        : undefined,
    fallbackSucceeded: combined.fallbackSuccess,
  };
};

const sendWhatsAppTextMessage = ({
  to,
  text,
  invoiceId,
  eventType,
  skipRecord = false,
}) => {
  if (!hasWhatsAppBaseConfig()) {
    if (!skipRecord) {
      void recordWhatsAppMessage({
        phone: to,
        text,
        status: "skipped",
        error: "WhatsApp configuration is incomplete",
        invoiceId,
        eventType,
      });
    }
    return Promise.resolve({
      success: false,
      skipped: true,
      error:
        "WhatsApp configuration is incomplete. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
    });
  }
  if (!to || !text) {
    if (!skipRecord) {
      void recordWhatsAppMessage({
        phone: to,
        text,
        status: "skipped",
        error: "WhatsApp destination or text content is missing",
        invoiceId,
        eventType,
      });
    }
    return Promise.resolve({
      success: false,
      skipped: true,
      error: "WhatsApp destination or text content is missing.",
    });
  }
  return postToWhatsApp({
    payload: buildTextPayload({ to, text }),
    to,
    text,
    messageType: "text",
    invoiceId,
    eventType,
    skipRecord,
  });
};

const resolvePatientContact = async (patientIdOrObject) => {
  let patient = null;
  let user = null;

  if (typeof patientIdOrObject === "object" && patientIdOrObject !== null) {
    patient = patientIdOrObject;
    const patientId = toObjectIdString(
      patient.patientId || patient._id || patient.id,
    );
    if (patientId) {
      patient = (await Patient.findById(patientId)) || patient;
    }
    if (patient.userId) user = await User.findById(patient.userId);
  } else {
    const patientId = toObjectIdString(patientIdOrObject);
    patient = patientId
      ? (await Patient.findById(patientId)) ||
        (await Patient.findOne({ userId: patientId }))
      : null;
    if (patient?.userId) {
      user = await User.findById(patient.userId);
    } else if (patientId) {
      user = await User.findById(patientId);
    }
  }

  return {
    name: patient?.name || user?.name || "Patient",
    phone: normalizePhoneNumber(patient?.phone || user?.phone),
    rawPhone: patient?.phone || user?.phone || "",
  };
};

const formatCurrencyINR = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);
};

const formatDateIN = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const buildInvoicePaymentLink = (invoiceId) =>
  `${FRONTEND_URL}/login?redirect=${encodeURIComponent(
    `/patient/billing?invoiceId=${invoiceId}`,
  )}`;

const buildInvoiceMessage = (
  invoice,
  patientContact,
  directPaymentLink = "",
) => {
  const loginUrl = `${FRONTEND_URL}/login`;
  const billingUrl = `${FRONTEND_URL}/billing`;
  const balance = Number(invoice.balance || invoice.total || 0);
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.amountPaid || 0);
  const paymentLink =
    directPaymentLink ||
    (balance > 0 ? buildInvoicePaymentLink(invoice?._id || invoice?.id) : "");

  const itemsList =
    invoice.items
      ?.map(
        (item, idx) =>
          `${idx + 1}. ${item.description} x${item.quantity} - ${formatCurrencyINR(
            item.total,
          )}`,
      )
      .join("\n") || "";

  const statusLine =
    invoice.status === "Paid"
      ? "✅ Status: Paid"
      : invoice.status === "Partial"
        ? `⏳ Status: Partially Paid\n   Paid: ${formatCurrencyINR(
            paid,
          )}\n   Balance Due: ${formatCurrencyINR(balance)}`
        : `💰 Status: Unpaid\n   Balance Due: ${formatCurrencyINR(balance)}`;

  return `*🏥 CREADENT DENTAL CLINIC*

Dear ${patientContact.name || "Patient"},

${
  invoice.status === "Paid"
    ? "Your payment has been received successfully."
    : "Your invoice has been generated."
}

📄 Invoice No: *${invoice.invoiceNumber || "-"}*
📅 Invoice Date: *${formatDateIN(invoice.date)}*
💵 Invoice Total: *${formatCurrencyINR(total)}*
${statusLine}

${itemsList ? `--- Treatment Items ---\n${itemsList}\n` : ""}
---

${paymentLink ? `*Pay Now*\n${paymentLink}\n\n` : ""}

*Secure Patient Portal Login*
Login Link: ${loginUrl}
Phone: ${patientContact.rawPhone || "Registered Mobile"}
Password: Year + Last 4 digits of mobile (e.g., 2026XXXX)

${
  balance > 0
    ? `💳 *Make Payment Online*\nAfter login, visit: ${billingUrl}\nYou can pay via UPI, Card, or Net Banking.\n`
    : "📎 Your bill/receipt PDF has been shared on WhatsApp for your records.\n"
}

📞 For queries: +91 6292300343
Thank you for choosing Creadent Dental Clinic!

- Team Creadent`;
};

const buildLoginCredentialsMessage = (credentials) => {
  const loginUrl = `${FRONTEND_URL}/login`;
  const billingUrl = `${FRONTEND_URL}/billing`;

  return `*🏥 CREADENT DENTAL CLINIC - Patient Login Details*

Dear ${credentials.patientName || "Patient"},

Your secure patient portal login credentials:

📱 Mobile: *${credentials.phone || "-"}*
🔑 Password: *${credentials.password || "-"}*

🔐 Login Link: ${loginUrl}

After logging in, you can:
• View your invoices and treatment history
• Pay pending bills online
• Book appointments
• View prescriptions & medical records
• Chat with our clinic team

💳 To make a payment:
1. Login using above details
2. Go to "Billing & Payments" section: ${billingUrl}
3. Select your invoice and pay via UPI/Card/NetBanking

⚠️ *Security Note:*
- Do not share your password with anyone
- Change your password after first login
- Creadent will never ask for OTP or password via call

📞 For support: +91 6292300343

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
- Our staff will NEVER ask for OTP on call
- If you did not request this, please ignore this message

📞 For support: +91 6292300343

Regards,
Team Creadent Dental Clinic`;
};

const sendForgotPasswordOtpWhatsApp = async ({ phone, otp }) => {
  const normalizedPhone = normalizePhoneNumber(phone);
  const templateName = process.env.WHATSAPP_TEMPLATE_FORGOT_PASSWORD_OTP;

  if (!normalizedPhone) {
    return {
      success: false,
      skipped: true,
      error: "Phone number is required for forgot-password OTP",
    };
  }

  const otpValue = otp || "-";
  const fallbackText = buildForgotPasswordOtpMessage({ otp: otpValue });
  const results = {};

  const configuredButtonType =
    process.env.WHATSAPP_TEMPLATE_FORGOT_PASSWORD_OTP_BUTTON_TYPE;
  const templateResult = await sendTemplateWithFallback({
    to: normalizedPhone,
    templateName,
    templateKey: "FORGOT_PASSWORD_OTP",
    bodyParameters: [otpValue],
    buttonType: configuredButtonType,
    buttonIndex: process.env.WHATSAPP_TEMPLATE_FORGOT_PASSWORD_OTP_BUTTON_INDEX,
    buttonParameters: configuredButtonType ? [otpValue] : [],
    fallbackText,
  });
  results.template = templateResult;
  return { ...templateResult, phone: normalizedPhone, results };
};

const sendInvoiceWhatsApp = async (
  invoice,
  patientId,
  directPaymentLinkOverride = "",
  {
    eventType = "invoice_created",
    sendTemplate = true,
    templateOnly = false,
  } = {},
) => {
  const patientContact = await resolvePatientContact(
    patientId || invoice.patientId,
  );
  const directPaymentLink =
    directPaymentLinkOverride ||
    (Number(invoice?.balance || 0) > 0
      ? buildInvoicePaymentLink(invoice?._id || invoice?.id)
      : "");

  if (!patientContact.phone) {
    return {
      success: false,
      error: "Patient phone number not found",
      patient: patientContact,
    };
  }

  const errors = [];
  const results = {};
  let invoicePdfUrl = "";
  let invoicePdfBuffer = null;
  const detailedMessage = buildInvoiceMessage(
    invoice,
    patientContact,
    directPaymentLink,
  );

  if (!templateOnly) {
    try {
      invoicePdfBuffer = await createInvoicePdfBuffer(invoice, patientContact);
      const fileName = `Invoice_${invoice.invoiceNumber || invoice._id}.pdf`;
      const uploadedPdf = await storageService.uploadFile({
        file: {
          buffer: invoicePdfBuffer,
          mimetype: "application/pdf",
          size: invoicePdfBuffer.length,
        },
        folder: "invoices",
        fileName,
        requirePublicUrl: true,
      });
      invoicePdfUrl =
        (uploadedPdf.url && /^https:\/\//i.test(uploadedPdf.url)
          ? uploadedPdf.url
          : null) || uploadedPdf.publicUrl;
      if (
        !invoicePdfUrl &&
        process.env.SPACEBYTE_BASE_URL &&
        uploadedPdf.storageKey
      ) {
        try {
          const base = new URL(process.env.SPACEBYTE_BASE_URL);
          const encodedPath = String(uploadedPdf.storageKey)
            .split("/")
            .map((segment) => encodeURIComponent(segment))
            .join("/");
          invoicePdfUrl = new URL(
            encodedPath,
            `${base.toString().replace(/\/+$/, "")}/`,
          ).toString();
        } catch (_) {
          void _;
        }
      }
      if (!invoicePdfUrl) {
        invoicePdfUrl = uploadedPdf.url || null;
        if (uploadedPdf.url) {
          errors.push(
            `Invoice PDF URL is not publicly reachable (${uploadedPdf.url}); WhatsApp document download may fail`,
          );
        }
      }
    } catch (error) {
      errors.push(`Invoice PDF preparation failed: ${error.message}`);
    }
  }

  if (sendTemplate) {
    const templateName =
      process.env.WHATSAPP_TEMPLATE_INVOICE ||
      process.env.WHATSAPP_TEMPLATE_INVOICE_SHARE;
    const templateParameters = [
      patientContact.name || "Patient",
      invoice.invoiceNumber || "-",
      formatCurrencyINR(invoice.total || 0),
      formatCurrencyINR(invoice.amountPaid || 0),
      formatCurrencyINR(invoice.balance || 0),
      directPaymentLink || "-",
    ];
    results.template = await sendTemplateWithFallback({
      to: patientContact.phone,
      templateName,
      templateKey: "INVOICE",
      bodyParameters: templateParameters,
      fallbackText: detailedMessage,
      invoiceId: invoice?._id || invoice?.id,
      eventType: `${eventType}_template`,
    });
    if (!results.template.success && !results.template.skipped) {
      errors.push(`Invoice template failed: ${results.template.error}`);
    }
  }

  if (invoicePdfBuffer || invoicePdfUrl) {
    const fileName = `Invoice_${invoice.invoiceNumber || invoice._id}.pdf`;
    results.document = await sendWhatsAppDocumentMessage({
      to: patientContact.phone,
      documentUrl: invoicePdfUrl,
      documentBuffer: invoicePdfBuffer,
      fileName,
      caption: `Bill copy for ${invoice.invoiceNumber || "your invoice"}`,
      invoiceId: invoice?._id || invoice?.id,
      eventType: `${eventType}_document`,
    });
    if (!results.document.success && !results.document.skipped) {
      errors.push(`Invoice PDF failed: ${results.document.error}`);
    }
  }

  const deliveryResults = [];
  if (sendTemplate && results.template) deliveryResults.push(results.template);
  if (!templateOnly && results.document) deliveryResults.push(results.document);

  return {
    success:
      deliveryResults.length > 0 &&
      deliveryResults.every((result) => result?.success),
    skipped:
      deliveryResults.length > 0 &&
      deliveryResults.every((result) => result?.skipped),
    phone: patientContact.phone,
    patient: patientContact,
    errors,
    results,
    messagePreview: detailedMessage,
    fileUrl: invoicePdfUrl,
  };
};

const sendInvoicePaymentLinkWhatsApp = async (
  invoice,
  directPaymentLink = "",
) => {
  const patientContact = await resolvePatientContact(invoice?.patientId);
  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const paymentLink =
    directPaymentLink || buildInvoicePaymentLink(invoice._id || invoice.id);
  const message = `*Creadent Dental Clinic*

Dear ${patientContact.name || "Patient"},

Your invoice *${invoice.invoiceNumber || "-"}* is ready.
Payment amount: *${formatCurrencyINR(invoice.balance || invoice.total || 0)}*

Please click the secure payment link below to complete your payment:
${paymentLink}

You can pay using UPI, Card, or Net Banking.

Regards,
Team Creadent Dental Clinic`;

  const templateName = process.env.WHATSAPP_TEMPLATE_INVOICE_PAYMENT_LINK;
  const results = {};

  const finalResult = await sendTemplateWithFallback({
    to: patientContact.phone,
    templateName,
    templateKey: "INVOICE_PAYMENT_LINK",
    bodyParameters: [
      patientContact.name || "Patient",
      invoice.invoiceNumber || "-",
      formatCurrencyINR(invoice.balance || invoice.total || 0),
      paymentLink,
    ],
    fallbackText: message,
    invoiceId: invoice?._id || invoice?.id,
    eventType: "invoice_payment_link",
  });
  results.template = finalResult;

  return {
    ...finalResult,
    phone: patientContact.phone,
    patient: patientContact,
    paymentLink,
    messagePreview: message,
    results,
  };
};

const buildPaymentThankYouMessage = ({ patientName, invoice, reviewLink }) => {
  return `*Creadent Dental Clinic*

Dear ${patientName || "Patient"},

Thank you for your successful payment for invoice *${invoice?.invoiceNumber || "-"}*.
Amount received: *${formatCurrencyINR(
    invoice?.amountPaid || invoice?.total || 0,
  )}*

Your bill/receipt PDF has already been shared on WhatsApp for your records.
We appreciate your trust in Creadent Dental Clinic.

Please share your experience with us${
    reviewLink
      ? `:
${reviewLink}`
      : "."
  }

Thank you,
Team Creadent Dental Clinic`;
};

const buildReviewLinkMessage = ({ patientName, reviewLink }) => {
  if (!reviewLink) return "";
  return `*⭐ Share Your Experience ⭐*

Dear ${patientName || "Patient"},

Thank you for choosing Creadent Dental Clinic! We'd love to hear about your visit.

Please take a moment to leave us a review:
${reviewLink}

Your feedback helps us serve you and our community better.

— Team Creadent Dental Clinic`;
};

const sendPaymentThankYouReviewWhatsApp = async (invoice) => {
  const patientContact = await resolvePatientContact(invoice?.patientId);
  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const fullFallbackMessage = buildPaymentThankYouMessage({
    patientName: patientContact.name,
    invoice,
    reviewLink: REVIEW_LINK,
  });
  const templateName = process.env.WHATSAPP_TEMPLATE_PAYMENT_THANK_YOU;
  const results = {};

  const bodyParameters = [
    patientContact.name,
    invoice?.invoiceNumber || "-",
    formatCurrencyINR(invoice?.amountPaid || invoice?.total || 0),
  ];

  const finalResult = await sendTemplateWithFallback({
    to: patientContact.phone,
    templateName,
    templateKey: "PAYMENT_THANK_YOU",
    languageCode: getTemplateLanguage("PAYMENT_THANK_YOU"),
    bodyParameters,
    fallbackText: fullFallbackMessage,
    eventType: "manual_payment_thank_you",
  });
  results.template = finalResult;

  return {
    ...finalResult,
    phone: patientContact.phone,
    patient: patientContact,
    messagePreview: fullFallbackMessage,
    results,
  };
};

const sendRateUsWhatsApp = async (invoice) => {
  const patientContact = await resolvePatientContact(invoice?.patientId);
  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const reviewLink = REVIEW_LINK || `${FRONTEND_URL}/reviews`;
  const message = buildReviewLinkMessage({
    patientName: patientContact.name,
    reviewLink,
  });
  const templateName = process.env.WHATSAPP_TEMPLATE_RATE_US;
  const results = {};
  const finalResult = await sendTemplateWithFallback({
    to: patientContact.phone,
    templateName,
    templateKey: "RATE_US",
    languageCode: getTemplateLanguage("RATE_US"),
    bodyParameters: [patientContact.name || "Patient", reviewLink],
    fallbackText: message,
    invoiceId: invoice?._id || invoice?.id,
    eventType: "manual_rate_us",
  });
  results.template = finalResult;

  return {
    ...finalResult,
    phone: patientContact.phone,
    patient: patientContact,
    messagePreview: message,
    results,
  };
};

const sendManualMessageWhatsApp = async ({
  patientId,
  phone,
  name,
  message,
  sentBy,
}) => {
  let patientContact = patientId
    ? await resolvePatientContact(patientId)
    : { phone: normalizePhoneNumber(phone), name };

  if (!patientId && patientContact.phone) {
    const patient = await Patient.findOne({
      phone: {
        $in: [patientContact.phone, patientContact.phone.slice(-10)],
      },
    }).select("_id name phone");
    if (patient) {
      patientContact = {
        name: patient.name || name || "Patient",
        phone: normalizePhoneNumber(patient.phone),
        rawPhone: patient.phone,
      };
    }
  }

  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  if (!message || !String(message).trim()) {
    return { success: false, error: "Message content is required" };
  }

  const trimmedMessage = String(message).trim();
  const patientName = patientContact.name || name || "Patient";

  const fallbackText = `*Creadent Dental Clinic*

Hi ${patientName},

${trimmedMessage}

Regards,
Creadent Dental Clinic
+91 6292300343`;

  const templateName = process.env.WHATSAPP_TEMPLATE_MANUAL_MESSAGE;
  const results = {};
  const finalResult = await sendTemplateWithFallback({
    to: patientContact.phone,
    templateName,
    templateKey: "MANUAL_MESSAGE",
    languageCode: getTemplateLanguage("MANUAL_MESSAGE"),
    bodyParameters: [patientName, trimmedMessage],
    fallbackText,
    eventType: "manual_message",
    sentBy,
  });
  results.template = finalResult;

  return {
    ...finalResult,
    phone: patientContact.phone,
    patient: patientContact,
    messagePreview: fallbackText,
    results,
  };
};

const sendPaymentSuccessWhatsAppBundle = async (invoice) => {
  const invoiceResult = await sendInvoiceWhatsApp(
    invoice,
    invoice?.patientId,
    "",
    { eventType: "payment_success", templateOnly: true },
  );
  const reviewResult =
    invoice?.status === "Paid"
      ? await sendPaymentThankYouReviewWhatsApp(invoice)
      : {
          success: false,
          skipped: true,
          error: null,
        };

  return {
    success: Boolean(
      invoiceResult.success &&
      (invoice?.status !== "Paid" || reviewResult.success),
    ),
    invoiceResult,
    reviewResult,
  };
};

const sendLoginCredentialsWhatsApp = async (credentials) => {
  const templateName = process.env.WHATSAPP_TEMPLATE_LOGIN_CREDENTIALS;
  const normalizedPhone = normalizePhoneNumber(credentials.phone);

  if (!normalizedPhone) {
    return {
      success: false,
      error: "Patient phone number is required",
    };
  }

  const message = buildLoginCredentialsMessage(credentials);
  const results = {};
  const finalResult = await sendTemplateWithFallback({
    to: normalizedPhone,
    templateName,
    templateKey: "LOGIN_CREDENTIALS",
    bodyParameters: [
      credentials.patientName || "Patient",
      credentials.phone || "-",
      credentials.password || "-",
      `${FRONTEND_URL}/login`,
    ],
    fallbackText: message,
  });
  results.template = finalResult;

  return {
    ...finalResult,
    phone: normalizedPhone,
    messagePreview: message,
    results,
  };
};

const buildPrescriptionMessage = (
  prescription,
  patientContact,
  fileUrl = "",
) => {
  const medications = (prescription?.medications || [])
    .map((medicine, idx) => {
      const parts = [
        medicine.name,
        medicine.dosage,
        medicine.frequency,
        medicine.duration,
      ].filter(Boolean);
      return `  ${idx + 1}. ${parts.join(" - ")}`;
    })
    .filter(Boolean)
    .join("\n");

  const rxId = `RX-${String(prescription?._id || "PRESCRIPTION")
    .slice(-8)
    .toUpperCase()}`;

  return `*Creadent Dental Clinic - Prescription*

Dear ${patientContact.name || "Patient"},

Your prescription is ready.

📋 *Prescription ID:* ${rxId}
👨‍⚕️ *Doctor:* ${prescription?.doctorName || "Doctor"}
📅 *Date:* ${formatDateIN(prescription?.date) || formatDateIN(new Date())}
🩺 *Diagnosis:* ${prescription?.diagnosis || "Dental consultation"}

${medications ? `💊 *Medications:*\n${medications}\n` : ""}
📝 *Doctor's Notes:*
${
  prescription?.notes ||
  "Follow the instructions on your medication labels. Maintain good oral hygiene and visit us for regular checkups."
}

${
  fileUrl
    ? `📎 *View/Download Prescription:*\n${fileUrl}\n`
    : `You can also view this prescription in your patient portal:\n${FRONTEND_URL}/patient/prescriptions\n`
}
📞 For queries: +91 6292300343

Regards,
Team Creadent Dental Clinic`;
};

const sendPrescriptionWhatsApp = async (prescription, fileUrl = "") => {
  const templateName = process.env.WHATSAPP_TEMPLATE_PRESCRIPTION;
  const patientContact = await resolvePatientContact(prescription?.patientId);

  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const medications = (prescription?.medications || [])
    .map((medicine) =>
      [medicine.name, medicine.dosage, medicine.frequency, medicine.duration]
        .filter(Boolean)
        .join(" - "),
    )
    .filter(Boolean)
    .join(", ");
  const message = buildPrescriptionMessage(
    prescription,
    patientContact,
    fileUrl,
  );
  const results = {};
  const finalResult = await sendTemplateWithFallback({
    to: patientContact.phone,
    templateName,
    templateKey: "PRESCRIPTION",
    bodyParameters: [
      patientContact.name,
      prescription?.doctorName || "Doctor",
      `RX-${String(prescription?._id || "PRESCRIPTION")
        .slice(-8)
        .toUpperCase()}`,
      formatDateIN(prescription?.date),
      prescription?.diagnosis || "Dental consultation",
      medications || "See your patient portal",
      fileUrl || `${FRONTEND_URL}/patient/prescriptions`,
    ],
    fallbackText: message,
  });
  results.template = finalResult;

  return {
    ...finalResult,
    phone: patientContact.phone,
    patient: patientContact,
    messagePreview: message,
    results,
  };
};

module.exports = {
  TEMPLATE_REGISTRY,
  auditWhatsAppTemplateRegistry,
  runWhatsAppSelfAudit,
  normalizePhoneNumber,
  toE164Format,
  sanitizeRecipient,
  resolvePatientContact,
  formatCurrencyINR,
  formatDateIN,
  buildInvoiceMessage,
  buildLoginCredentialsMessage,
  buildPrescriptionMessage,
  buildInvoicePaymentLink,
  buildForgotPasswordOtpMessage,
  buildPaymentThankYouMessage,
  buildReviewLinkMessage,
  sendInvoiceWhatsApp,
  sendInvoicePaymentLinkWhatsApp,
  sendWhatsAppDocumentMessage,
  sendPaymentThankYouReviewWhatsApp,
  sendRateUsWhatsApp,
  sendManualMessageWhatsApp,
  sendPaymentSuccessWhatsAppBundle,
  sendLoginCredentialsWhatsApp,
  sendForgotPasswordOtpWhatsApp,
  sendPrescriptionWhatsApp,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
  sendTemplateWithFallback,
  recordWhatsAppMessage,
  hasWhatsAppBaseConfig,
};

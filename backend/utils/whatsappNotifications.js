const https = require("https");
const PDFDocument = require("pdfkit");
const Patient = require("../models/Patient");
const User = require("../models/User");
const WhatsAppMessage = require("../models/WhatsAppMessage");
const storageService = require("./storageService");

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";
const DEFAULT_LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://creadentsmiles.com";
const REVIEW_LINK = process.env.WHATSAPP_REVIEW_LINK || "";

const toObjectIdString = (value) => {
  if (!value) return "";
  return value.toString();
};

const normalizePhoneNumber = (phone) => {
  const digitsOnly = String(phone || "").replace(/\D/g, "");
  if (!digitsOnly) return "";
  if (digitsOnly.length === 10) {
    return `${DEFAULT_COUNTRY_CODE}${digitsOnly}`;
  }
  return digitsOnly;
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
  read = direction === "outbound",
}) => {
  try {
    const normalizedPhone = normalizePhoneNumber(phone);
    const patient = normalizedPhone
      ? await Patient.findOne({ phone: normalizedPhone.slice(-10) })
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
      status,
      messageId,
      error,
      read,
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

const buildTemplatePayload = ({ to, templateName, bodyParameters = [] }) => {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: DEFAULT_LANGUAGE_CODE,
      },
    },
  };
  if (bodyParameters.length > 0) {
    payload.template.components = [
      {
        type: "body",
        parameters: bodyParameters.map((text) => ({
          type: "text",
          text: String(text ?? ""),
        })),
      },
    ];
  }
  return payload;
};

const buildTextPayload = ({ to, text }) => {
  return {
    messaging_product: "whatsapp",
    to,
    text: {
      preview_url: true,
      body: String(text ?? ""),
    },
  };
};

const buildDocumentPayload = ({ to, documentUrl, fileName, caption }) => ({
  messaging_product: "whatsapp",
  to,
  type: "document",
  document: {
    link: documentUrl,
    filename: fileName,
    caption,
  },
});

const createInvoicePdfBuffer = (invoice, patientContact) =>
  new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48 });
    const chunks = [];
    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document.fontSize(18).fillColor("#0f766e").text("Creadent Multispeciality Dental Clinic");
    document.fontSize(9).fillColor("#475569").text("BD-85, Salt Lake Rd, BD Block, Sector 1, Bidhannagar, Kolkata, West Bengal 700064");
    document.text("Phone: +91 6292300343 | Email: creadentmultispecialitydentalc@gmail.com");
    document.moveDown(1.5);
    document.fontSize(22).fillColor("#0f766e").text(invoice.status === "Paid" ? "RECEIPT" : "INVOICE");
    document.fontSize(10).fillColor("#111827");
    document.text(`Invoice #: ${invoice.invoiceNumber || "-"}`);
    document.text(`Date: ${formatDateIN(invoice.date || invoice.createdAt) || formatDateIN(new Date())}`);
    document.text(`Due Date: ${formatDateIN(invoice.dueDate) || "-"}`);
    if (invoice.paymentDate) document.text(`Paid Date: ${formatDateIN(invoice.paymentDate)}`);
    document.moveDown();
    document.text(`Bill To: ${patientContact.name || invoice.patientName || "Patient"}`);
    if (patientContact.rawPhone) document.text(`Mobile: ${patientContact.rawPhone}`);
    document.moveDown();
    document.font("Helvetica-Bold").text("Description                         Qty       Amount");
    document.font("Helvetica");
    (invoice.items || []).forEach((item) => {
      document.text(`${item.description || "Treatment"}    ${item.quantity || 1}       ${formatCurrencyINR(item.total || 0)}`);
    });
    document.moveDown();
    document.text(`Subtotal: ${formatCurrencyINR(invoice.subtotal || 0)}`);
    document.text(`Tax: ${formatCurrencyINR(invoice.tax || 0)}`);
    document.text(`Total: ${formatCurrencyINR(invoice.total || 0)}`);
    document.text(`Paid: ${formatCurrencyINR(invoice.amountPaid || 0)}`);
    document.font("Helvetica-Bold").text(`Balance Due: ${formatCurrencyINR(invoice.balance || 0)}`);
    document.end();
  });

const sendWhatsAppDocumentMessage = ({ to, documentUrl, fileName, caption }) =>
  new Promise((resolve) => {
    if (!hasWhatsAppBaseConfig()) {
      return resolve({ success: false, skipped: true, error: "WhatsApp configuration is incomplete" });
    }
    if (!to || !documentUrl) {
      return resolve({ success: false, skipped: true, error: "WhatsApp document recipient or URL is missing" });
    }
    const payload = JSON.stringify(buildDocumentPayload({ to, documentUrl, fileName, caption }));
    const request = https.request(
      {
        hostname: "graph.facebook.com",
        path: `/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      },
      (response) => {
        let responseBody = "";
        response.on("data", (chunk) => { responseBody += chunk; });
        response.on("end", () => {
          const ok = response.statusCode >= 200 && response.statusCode < 300;
          let parsedBody = null;
          try { parsedBody = JSON.parse(responseBody); } catch (_) {}
          void recordWhatsAppMessage({
            phone: to,
            text: caption || `Invoice PDF: ${fileName}`,
            messageType: "document",
            status: ok ? "sent" : "failed",
            messageId: parsedBody?.messages?.[0]?.id,
            error: ok ? undefined : responseBody,
          });
          resolve({ success: ok, statusCode: response.statusCode, error: ok ? null : responseBody });
        });
      },
    );
    request.on("error", (error) => resolve({ success: false, error: error.message }));
    request.write(payload);
    request.end();
  });

const sendWhatsAppTemplateMessage = ({
  to,
  templateName,
  bodyParameters = [],
  displayText,
}) =>
  new Promise((resolve) => {
    if (!hasWhatsAppBaseConfig()) {
      void recordWhatsAppMessage({
        phone: to,
        text: `Template: ${templateName}`,
        messageType: "template",
        templateName,
        status: "skipped",
        error: "WhatsApp configuration is incomplete",
      });
      return resolve({
        success: false,
        skipped: true,
        error:
          "WhatsApp configuration is incomplete. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
      });
    }
    if (!to || !templateName) {
      void recordWhatsAppMessage({
        phone: to,
        text: `Template: ${templateName || "unknown"}`,
        messageType: "template",
        templateName,
        status: "skipped",
        error: "WhatsApp destination or template name is missing",
      });
      return resolve({
        success: false,
        skipped: true,
        error: "WhatsApp destination or template name is missing.",
      });
    }
    const payload = JSON.stringify(
      buildTemplatePayload({ to, templateName, bodyParameters }),
    );
    const request = https.request(
      {
        hostname: "graph.facebook.com",
        path: `/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
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
          void recordWhatsAppMessage({
            phone: to,
            text:
              displayText ||
              `Template: ${templateName}${bodyParameters.length ? ` (${bodyParameters.join(", ")})` : ""}`,
            messageType: "template",
            templateName,
            templateParameters: bodyParameters.map((value) => String(value ?? "")),
            status: ok ? "sent" : "failed",
            messageId: parsedBody?.messages?.[0]?.id,
            error: ok ? undefined : responseBody,
          });
          resolve({
            success: ok,
            statusCode: response.statusCode,
            body: responseBody,
            error: ok ? null : responseBody,
          });
        });
      },
    );
    request.on("error", (error) => {
      void recordWhatsAppMessage({
        phone: to,
        text: displayText || `Template: ${templateName}`,
        messageType: "template",
        templateName,
        templateParameters: bodyParameters.map((value) => String(value ?? "")),
        status: "failed",
        error: error.message,
      });
      resolve({
        success: false,
        error: error.message,
      });
    });
    request.write(payload);
    request.end();
  });

const sendWhatsAppTextMessage = ({ to, text }) =>
  new Promise((resolve) => {
    if (!hasWhatsAppBaseConfig()) {
      void recordWhatsAppMessage({
        phone: to,
        text,
        status: "skipped",
        error: "WhatsApp configuration is incomplete",
      });
      return resolve({
        success: false,
        skipped: true,
        error:
          "WhatsApp configuration is incomplete. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
      });
    }
    if (!to || !text) {
      void recordWhatsAppMessage({
        phone: to,
        text,
        status: "skipped",
        error: "WhatsApp destination or text content is missing",
      });
      return resolve({
        success: false,
        skipped: true,
        error: "WhatsApp destination or text content is missing.",
      });
    }
    const payload = JSON.stringify(buildTextPayload({ to, text }));
    const request = https.request(
      {
        hostname: "graph.facebook.com",
        path: `/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
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
          void recordWhatsAppMessage({
            phone: to,
            text,
            status: ok ? "sent" : "failed",
            messageId: parsedBody?.messages?.[0]?.id,
            error: ok ? undefined : responseBody,
          });
          resolve({
            success: ok,
            statusCode: response.statusCode,
            body: responseBody,
            error: ok ? null : responseBody,
          });
        });
      },
    );
    request.on("error", (error) => {
      void recordWhatsAppMessage({
        phone: to,
        text,
        status: "failed",
        error: error.message,
      });
      resolve({
        success: false,
        error: error.message,
      });
    });
    request.write(payload);
    request.end();
  });

const resolvePatientContact = async (patientIdOrObject) => {
  let patient = null;
  let user = null;

  if (typeof patientIdOrObject === "object" && patientIdOrObject !== null) {
    patient = patientIdOrObject;
    if (patient.userId) {
      user = await User.findById(patient.userId);
    }
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

const buildInvoiceMessage = (invoice, patientContact) => {
  const loginUrl = `${FRONTEND_URL}/login`;
  const billingUrl = `${FRONTEND_URL}/billing`;
  const balance = Number(invoice.balance || invoice.total || 0);
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.amountPaid || 0);

  const itemsList =
    invoice.items
      ?.map(
        (item, idx) =>
          `${idx + 1}. ${item.description} x${item.quantity} - ${formatCurrencyINR(item.total)}`,
      )
      .join("\n") || "";

  const statusLine =
    invoice.status === "Paid"
      ? "✅ Status: Paid"
      : invoice.status === "Partial"
        ? `⏳ Status: Partially Paid\n   Paid: ${formatCurrencyINR(paid)}\n   Balance Due: ${formatCurrencyINR(balance)}`
        : `💰 Status: Unpaid\n   Balance Due: ${formatCurrencyINR(balance)}`;

  return `*🏥 CREADENT DENTAL CLINIC*

Dear ${patientContact.name || "Patient"},

Your invoice has been generated.

📄 Invoice No: *${invoice.invoiceNumber || "-"}*
📅 Invoice Date: *${formatDateIN(invoice.date)}*
${invoice.dueDate ? `📅 Due Date: *${formatDateIN(invoice.dueDate)}*\n` : ""}
💵 Invoice Total: *${formatCurrencyINR(total)}*
${statusLine}

${itemsList ? `--- Treatment Items ---\n${itemsList}\n` : ""}
---

🔐 *Secure Patient Portal Login*
Login Link: ${loginUrl}
Phone: ${patientContact.rawPhone || "Registered Mobile"}
Password: Year + Last 4 digits of mobile (e.g., 2026XXXX)

💳 *Make Payment Online*
After login, visit: ${billingUrl}
You can pay via UPI, Card, or Net Banking.

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

  if (templateName) {
    const templateResult = await sendWhatsAppTemplateMessage({
      to: normalizedPhone,
      templateName,
      bodyParameters: [otp || "-"],
    });
    if (templateResult.success || templateResult.skipped) {
      return {
        ...templateResult,
        phone: normalizedPhone,
      };
    }
  }

  const text = `*Creadent Dental Clinic*\n\nYour password reset OTP is *${otp}*.\nThis code is valid for 10 minutes only.\n\nDo not share this OTP with anyone.\n\nIf you did not request this, please ignore this message.`;

  return await sendWhatsAppTextMessage({
    to: normalizedPhone,
    text,
  });
};

const sendInvoiceWhatsApp = async (invoice, patientId) => {
  const patientTemplate = process.env.WHATSAPP_TEMPLATE_INVOICE_SHARE;
  const patientContact = await resolvePatientContact(
    patientId || invoice.patientId,
  );

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

  try {
    const pdfBuffer = await createInvoicePdfBuffer(invoice, patientContact);
    const fileName = `Invoice_${invoice.invoiceNumber || invoice._id}.pdf`;
    const uploadedPdf = await storageService.uploadFile({
      file: { buffer: pdfBuffer, mimetype: "application/pdf", size: pdfBuffer.length },
      folder: "invoices",
      fileName,
    });
    invoicePdfUrl = uploadedPdf.url;
    results.document = await sendWhatsAppDocumentMessage({
      to: patientContact.phone,
      documentUrl: uploadedPdf.url,
      fileName,
      caption: `Bill copy for ${invoice.invoiceNumber || "your invoice"}`,
    });
    if (!results.document.success && !results.document.skipped) {
      errors.push(`Invoice PDF failed: ${results.document.error}`);
    }
  } catch (error) {
    errors.push(`Invoice PDF preparation failed: ${error.message}`);
  }

  if (patientTemplate) {
    const templateResult = await sendWhatsAppTemplateMessage({
      to: patientContact.phone,
      templateName: patientTemplate,
      bodyParameters: [
        patientContact.name,
        invoice.invoiceNumber || "-",
        formatCurrencyINR(invoice.balance || invoice.total || 0),
        `${FRONTEND_URL}/login`,
      ],
    });
    results.template = templateResult;
    if (!templateResult.success && !templateResult.skipped) {
      errors.push(`Template message failed: ${templateResult.error}`);
    }
  }

  const detailedMessage = buildInvoiceMessage(invoice, patientContact);
  const textResult = await sendWhatsAppTextMessage({
    to: patientContact.phone,
    text: detailedMessage,
  });
  results.text = textResult;
  if (!textResult.success && !textResult.skipped) {
    errors.push(`Text message failed: ${textResult.error}`);
  }

  return {
    success:
      textResult.success ||
      (results.template && results.template.success) ||
      (results.document && results.document.success) ||
      false,
    skipped:
      textResult.skipped && (!results.template || results.template.skipped),
    phone: patientContact.phone,
    patient: patientContact,
    errors,
    results,
    messagePreview: detailedMessage,
    fileUrl: invoicePdfUrl,
  };
};

const buildInvoicePaymentLink = (invoiceId) =>
  `${FRONTEND_URL}/login?redirect=${encodeURIComponent(`/patient/billing?invoiceId=${invoiceId}`)}`;

const sendInvoicePaymentLinkWhatsApp = async (invoice) => {
  const patientContact = await resolvePatientContact(invoice?.patientId);
  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const paymentLink = buildInvoicePaymentLink(invoice._id || invoice.id);
  const message = `*Creadent Dental Clinic*

Dear ${patientContact.name || "Patient"},

Your invoice *${invoice.invoiceNumber || "-"}* is ready.
Amount due: *${formatCurrencyINR(invoice.balance || invoice.total || 0)}*

Complete your payment securely here:
${paymentLink}

Regards,
Team Creadent Dental Clinic`;
  const templateName = process.env.WHATSAPP_TEMPLATE_INVOICE_PAYMENT_LINK;
  const result = templateName
    ? await sendWhatsAppTemplateMessage({
        to: patientContact.phone,
        templateName,
        bodyParameters: [
          patientContact.name,
          invoice.invoiceNumber || "-",
          formatCurrencyINR(invoice.balance || invoice.total || 0),
          paymentLink,
        ],
        displayText: message,
      })
    : await sendWhatsAppTextMessage({ to: patientContact.phone, text: message });

  return {
    ...result,
    phone: patientContact.phone,
    patient: patientContact,
    paymentLink,
    messagePreview: message,
  };
};

const buildPaymentThankYouMessage = ({ patientName, invoice, reviewLink }) => {
  return `*Creadent Dental Clinic*

Dear ${patientName || "Patient"},

Thank you for your successful payment for invoice ${invoice?.invoiceNumber || "-"}.
We appreciate your trust in Creadent Dental Clinic.

Please share your experience with us${reviewLink ? `:
${reviewLink}` : "."}

Thank you,
Team Creadent Dental Clinic`;
};

const sendPaymentThankYouReviewWhatsApp = async (invoice) => {
  const patientContact = await resolvePatientContact(invoice?.patientId);
  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const message = buildPaymentThankYouMessage({
    patientName: patientContact.name,
    invoice,
    reviewLink: REVIEW_LINK,
  });
  const templateName = process.env.WHATSAPP_TEMPLATE_PAYMENT_THANK_YOU;
  const result = templateName
    ? await sendWhatsAppTemplateMessage({
        to: patientContact.phone,
        templateName,
        bodyParameters: [
          patientContact.name,
          invoice?.invoiceNumber || "-",
          formatCurrencyINR(invoice?.amountPaid || invoice?.total || 0),
          REVIEW_LINK || "-",
        ],
        displayText: message,
      })
    : await sendWhatsAppTextMessage({
        to: patientContact.phone,
        text: message,
      });

  return {
    ...result,
    phone: patientContact.phone,
    patient: patientContact,
    messagePreview: message,
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

  const errors = [];
  const results = {};

  if (templateName) {
    const templateResult = await sendWhatsAppTemplateMessage({
      to: normalizedPhone,
      templateName,
      bodyParameters: [
        credentials.patientName || "Patient",
        credentials.phone || "-",
        credentials.password || "-",
        `${FRONTEND_URL}/login`,
      ],
    });
    results.template = templateResult;
    if (!templateResult.success && !templateResult.skipped) {
      errors.push(`Template message failed: ${templateResult.error}`);
    }
  }

  const detailedMessage = buildLoginCredentialsMessage(credentials);
  const textResult = await sendWhatsAppTextMessage({
    to: normalizedPhone,
    text: detailedMessage,
  });
  results.text = textResult;
  if (!textResult.success && !textResult.skipped) {
    errors.push(`Text message failed: ${textResult.error}`);
  }

  return {
    success:
      textResult.success ||
      (results.template && results.template.success) ||
      false,
    skipped:
      textResult.skipped && (!results.template || results.template.skipped),
    phone: normalizedPhone,
    errors,
    results,
    messagePreview: detailedMessage,
  };
};

const sendPrescriptionWhatsApp = async (prescription, fileUrl = "") => {
  const templateName = process.env.WHATSAPP_TEMPLATE_PRESCRIPTION;
  const patientContact = await resolvePatientContact(prescription?.patientId);

  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  if (!templateName) {
    return {
      success: false,
      skipped: true,
      error: "WHATSAPP_TEMPLATE_PRESCRIPTION is not configured",
    };
  }

  const medications = (prescription?.medications || [])
    .map((medicine) =>
      [medicine.name, medicine.dosage, medicine.frequency, medicine.duration]
        .filter(Boolean)
        .join(" - "),
    )
    .filter(Boolean)
    .join(", ");
  const result = await sendWhatsAppTemplateMessage({
    to: patientContact.phone,
    templateName,
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
  });

  return { ...result, phone: patientContact.phone, patient: patientContact };
};

module.exports = {
  normalizePhoneNumber,
  resolvePatientContact,
  formatCurrencyINR,
  formatDateIN,
  buildInvoiceMessage,
  buildLoginCredentialsMessage,
  sendInvoiceWhatsApp,
  sendInvoicePaymentLinkWhatsApp,
  sendWhatsAppDocumentMessage,
  sendPaymentThankYouReviewWhatsApp,
  sendLoginCredentialsWhatsApp,
  sendForgotPasswordOtpWhatsApp,
  sendPrescriptionWhatsApp,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
  recordWhatsAppMessage,
  hasWhatsAppBaseConfig,
};

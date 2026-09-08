const https = require("https");
const PDFDocument = require("pdfkit");
const Patient = require("../models/Patient");
const User = require("../models/User");
const WhatsAppMessage = require("../models/WhatsAppMessage");
const storageService = require("./storageService");

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";
const normalizeTemplateLanguage = (value) => {
  const [language, region] = String(value || "en").replace("-", "_").split("_");
  return region
    ? `${language.toLowerCase()}_${region.toUpperCase()}`
    : language.toLowerCase();
};
const DEFAULT_LANGUAGE_CODE = normalizeTemplateLanguage(
  process.env.WHATSAPP_TEMPLATE_LANGUAGE,
);
const FRONTEND_URL = process.env.FRONTEND_URL || "https://creadentsmiles.com";
const REVIEW_LINK = process.env.WHATSAPP_REVIEW_LINK || "";

const getTemplateBodyParameterCount = (templateKey) => {
  const value = process.env[
    `WHATSAPP_TEMPLATE_${templateKey}_BODY_PARAMETER_COUNT`
  ];
  if (value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isInteger(count) && count >= 0 ? count : null;
};

const validateTemplateParameters = (templateKey, templateName, bodyParameters) => {
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
  invoiceId,
  eventType,
  read = direction === "outbound",
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
  bodyParameters = [],
  buttonParameters = [],
  buttonType,
  buttonIndex = "0",
}) => {
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
    components.push({
      type: "button",
      sub_type: buttonType,
      index: String(buttonIndex),
      parameters: buttonParameters.map((text) => ({
        type: "text",
        text: String(text ?? ""),
      })),
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
    to,
    type: "text",
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
    if (invoice.paymentDate) document.text(`Paid Date: ${formatDateIN(invoice.paymentDate)}`);
    document.moveDown();
    document.text(`Bill To: ${patientContact.name || invoice.patientName || "Patient"}`);
    if (patientContact.rawPhone) document.text(`Mobile: ${patientContact.rawPhone}`);
    document.moveDown();
    const tableTop = document.y;
    const descriptionX = document.page.margins.left;
    const quantityX = 410;
    const amountX = 455;
    document.font("Helvetica-Bold");
    document.text("Description", descriptionX, tableTop, { width: 350 });
    document.text("Qty", quantityX, tableTop, { width: 35, align: "right" });
    document.text("Amount", amountX, tableTop, { width: 92, align: "right" });
    document.moveDown(0.5);
    document.font("Helvetica");
    (invoice.items || []).forEach((item) => {
      const rowTop = document.y;
      document.text(item.description || "Treatment", descriptionX, rowTop, {
        width: 350,
      });
      document.text(String(item.quantity || 1), quantityX, rowTop, {
        width: 35,
        align: "right",
      });
      document.text(formatCurrencyINR(item.total || 0), amountX, rowTop, {
        width: 92,
        align: "right",
      });
      document.moveDown(0.35);
    });
    document.moveDown();
    document.text(`Subtotal: ${formatCurrencyINR(invoice.subtotal || 0)}`);
    document.text(`Total: ${formatCurrencyINR(invoice.total || 0)}`);
    document.text(`Paid: ${formatCurrencyINR(invoice.amountPaid || 0)}`);
    document.font("Helvetica-Bold").text(`Balance Due: ${formatCurrencyINR(invoice.balance || 0)}`);
    document.end();
  });

const sendWhatsAppDocumentMessage = ({
  to,
  documentUrl,
  fileName,
  caption,
  invoiceId,
  eventType,
}) =>
  new Promise((resolve) => {
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
      return resolve({ success: false, skipped: true, error: "WhatsApp configuration is incomplete" });
    }
    if (!to || !documentUrl) {
      void recordWhatsAppMessage({
        phone: to,
        text: caption || `Invoice PDF: ${fileName}`,
        messageType: "document",
        invoiceId,
        eventType,
        status: "skipped",
        error: "WhatsApp document recipient or URL is missing",
      });
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
              invoiceId,
              eventType,
            status: ok ? "sent" : "failed",
            messageId: parsedBody?.messages?.[0]?.id,
              error: ok ? undefined : getWhatsAppErrorMessage(responseBody, response.statusMessage),
          });
            resolve({
              success: ok,
              statusCode: response.statusCode,
              messageId: parsedBody?.messages?.[0]?.id,
              error: ok ? null : getWhatsAppErrorMessage(responseBody, response.statusMessage),
            });
        });
      },
    );
      request.on("error", (error) => {
        void recordWhatsAppMessage({
          phone: to,
          text: caption || `Invoice PDF: ${fileName}`,
          messageType: "document",
          invoiceId,
          eventType,
          status: "failed",
          error: error.message,
        });
        resolve({ success: false, error: error.message });
      });
    request.write(payload);
    request.end();
  });

const sendWhatsAppTemplateMessage = ({
  to,
  templateName,
  bodyParameters = [],
  buttonParameters = [],
  buttonType,
  buttonIndex,
  templateKey,
  invoiceId,
  eventType,
  displayText,
}) =>
  new Promise((resolve) => {
    if (!hasWhatsAppBaseConfig()) {
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
      return resolve({
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
      return resolve({ success: false, skipped: true, error: validationError });
    }
    if (!to || !templateName) {
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
      return resolve({
        success: false,
        skipped: true,
        error: "WhatsApp destination or template name is missing.",
      });
    }
    const payload = JSON.stringify(
      buildTemplatePayload({
        to,
        templateName,
        bodyParameters,
        buttonParameters,
        buttonType,
        buttonIndex,
      }),
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
              `Template: ${templateName}`,
            messageType: "template",
            templateName,
            templateParameters: bodyParameters.map((value) => String(value ?? "")),
            invoiceId,
            eventType,
            status: ok ? "sent" : "failed",
            messageId: parsedBody?.messages?.[0]?.id,
            error: ok ? undefined : responseBody,
          });
          resolve({
            success: ok,
            statusCode: response.statusCode,
            body: responseBody,
            error: ok
              ? null
              : getWhatsAppErrorMessage(responseBody, response.statusMessage),
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
        invoiceId,
        eventType,
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
            error: ok
              ? null
              : getWhatsAppErrorMessage(responseBody, response.statusMessage),
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

${invoice.status === "Paid" ? "Your payment has been received successfully." : "Your invoice has been generated."}

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

${balance > 0 ? `💳 *Make Payment Online*\nAfter login, visit: ${billingUrl}\nYou can pay via UPI, Card, or Net Banking.\n` : "📎 Your bill/receipt PDF has been shared on WhatsApp for your records.\n"}

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

  if (!templateName) {
    return {
      success: false,
      skipped: true,
      error: "WhatsApp OTP template is not configured",
      phone: normalizedPhone,
    };
  }

  const templateResult = await sendWhatsAppTemplateMessage({
    to: normalizedPhone,
    templateName,
    templateKey: "FORGOT_PASSWORD_OTP",
    bodyParameters: [otp || "-"],
    buttonType: process.env.WHATSAPP_TEMPLATE_FORGOT_PASSWORD_OTP_BUTTON_TYPE,
    buttonIndex: process.env.WHATSAPP_TEMPLATE_FORGOT_PASSWORD_OTP_BUTTON_INDEX,
  });
  return { ...templateResult, phone: normalizedPhone };
};

const sendInvoiceWhatsApp = async (
  invoice,
  patientId,
  directPaymentLinkOverride = "",
  { eventType = "invoice_created", sendTemplate = true } = {},
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
  const detailedMessage = buildInvoiceMessage(
    invoice,
    patientContact,
    directPaymentLink,
  );

  try {
    const pdfBuffer = await createInvoicePdfBuffer(invoice, patientContact);
    const fileName = `Invoice_${invoice.invoiceNumber || invoice._id}.pdf`;
    const uploadedPdf = await storageService.uploadFile({
      file: { buffer: pdfBuffer, mimetype: "application/pdf", size: pdfBuffer.length },
      folder: "invoices",
      fileName,
      requirePublicUrl: true,
    });
    if (!uploadedPdf?.url) {
      throw new Error("Invoice PDF uploaded but no public URL was returned");
    }
    const uploadedUrl = new URL(uploadedPdf.url);
    if (uploadedUrl.protocol !== "https:") {
      throw new Error("Invoice PDF URL must be a public HTTPS URL");
    }
    invoicePdfUrl = uploadedPdf.url;
  } catch (error) {
    errors.push(`Invoice PDF preparation failed: ${error.message}`);
  }

  if (sendTemplate) {
    const templateName =
      process.env.WHATSAPP_TEMPLATE_INVOICE ||
      process.env.WHATSAPP_TEMPLATE_INVOICE_SHARE;
    results.template = await sendWhatsAppTemplateMessage({
      to: patientContact.phone,
      templateName,
      templateKey: "INVOICE",
      bodyParameters: [
        patientContact.name || "Patient",
        invoice.invoiceNumber || "-",
        formatCurrencyINR(invoice.total || 0),
        formatCurrencyINR(invoice.amountPaid || 0),
        formatCurrencyINR(invoice.balance || 0),
        directPaymentLink || "-",
      ],
      displayText: detailedMessage,
      invoiceId: invoice?._id || invoice?.id,
      eventType: `${eventType}_template`,
    });
    if (!results.template.success && !results.template.skipped) {
      errors.push(`Invoice template failed: ${results.template.error}`);
    }
  }

  if (invoicePdfUrl) {
    const fileName = `Invoice_${invoice.invoiceNumber || invoice._id}.pdf`;
    results.document = await sendWhatsAppDocumentMessage({
      to: patientContact.phone,
      documentUrl: invoicePdfUrl,
      fileName,
      caption: `Bill copy for ${invoice.invoiceNumber || "your invoice"}`,
      invoiceId: invoice?._id || invoice?.id,
      eventType: `${eventType}_document`,
    });
    if (!results.document.success && !results.document.skipped) {
      errors.push(`Invoice PDF failed: ${results.document.error}`);
    }
  }

  return {
    success:
      Boolean(results.document?.success) &&
      (!sendTemplate || Boolean(results.template?.success)),
    skipped:
      Boolean(results.template?.skipped && (!results.document || results.document.skipped)),
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

const sendInvoicePaymentLinkWhatsApp = async (invoice, directPaymentLink = "") => {
  const patientContact = await resolvePatientContact(invoice?.patientId);
  if (!patientContact.phone) {
    return { success: false, error: "Patient phone number not found" };
  }

  const paymentLink = directPaymentLink || buildInvoicePaymentLink(invoice._id || invoice.id);
  const message = `*Creadent Dental Clinic*

Dear ${patientContact.name || "Patient"},

Your invoice *${invoice.invoiceNumber || "-"}* is ready.
Payment amount: *${formatCurrencyINR(invoice.balance || invoice.total || 0)}*

Please click the secure payment link below to complete your payment:
${paymentLink}

You can pay using UPI, Card, or Net Banking.

Regards,
Team Creadent Dental Clinic`;
  const textResult = await sendWhatsAppTextMessage({
    to: patientContact.phone,
    text: message,
  });

  return {
    ...textResult,
    phone: patientContact.phone,
    patient: patientContact,
    paymentLink,
    messagePreview: message,
    results: { text: textResult },
  };
};

const buildPaymentThankYouMessage = ({ patientName, invoice, reviewLink }) => {
  return `*Creadent Dental Clinic*

Dear ${patientName || "Patient"},

Thank you for your successful payment for invoice *${invoice?.invoiceNumber || "-"}*.
Amount received: *${formatCurrencyINR(invoice?.amountPaid || invoice?.total || 0)}*

Your bill/receipt PDF has already been shared on WhatsApp for your records.
We appreciate your trust in Creadent Dental Clinic.

Please share your experience with us${reviewLink ? `:
${reviewLink}` : "."}

Thank you,
Team Creadent Dental Clinic`;
};

const sendPaymentSuccessWhatsAppBundle = async (invoice) => {
  const invoiceResult = await sendInvoiceWhatsApp(
    invoice,
    invoice?.patientId,
    "",
    { eventType: "payment_success", sendTemplate: false },
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
  const results = {};
  if (!templateName) {
    return {
      success: false,
      skipped: true,
      error:
        "WHATSAPP_TEMPLATE_PAYMENT_THANK_YOU is not configured for review notifications",
      phone: patientContact.phone,
      patient: patientContact,
      messagePreview: message,
      results,
    };
  }

  const bodyParameters = [
    patientContact.name,
    invoice?.invoiceNumber || "-",
    formatCurrencyINR(invoice?.amountPaid || invoice?.total || 0),
  ];
  const templateResult = await sendWhatsAppTemplateMessage({
    to: patientContact.phone,
    templateName,
    templateKey: "PAYMENT_THANK_YOU",
    bodyParameters,
    displayText: message,
  });
  results.template = templateResult;

  return {
    ...templateResult,
    phone: patientContact.phone,
    patient: patientContact,
    messagePreview: message,
    results,
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

  if (!templateName) {
    return {
      success: false,
      skipped: true,
      error: "WhatsApp login credentials template is not configured",
      phone: normalizedPhone,
    };
  }

  const templateResult = await sendWhatsAppTemplateMessage({
    to: normalizedPhone,
    templateName,
    templateKey: "LOGIN_CREDENTIALS",
    bodyParameters: [
      credentials.patientName || "Patient",
      credentials.phone || "-",
      credentials.password || "-",
      `${FRONTEND_URL}/login`,
    ],
  });

  return {
    ...templateResult,
    phone: normalizedPhone,
    results: { template: templateResult },
  };
};

const buildPrescriptionMessage = (prescription, patientContact, fileUrl = "") => {
  const medications = (prescription?.medications || [])
    .map((medicine, idx) => {
      const parts = [medicine.name, medicine.dosage, medicine.frequency, medicine.duration].filter(Boolean);
      return `  ${idx + 1}. ${parts.join(" - ")}`;
    })
    .filter(Boolean)
    .join("\n");

  const rxId = `RX-${String(prescription?._id || "PRESCRIPTION").slice(-8).toUpperCase()}`;

  return `*Creadent Dental Clinic - Prescription*

Dear ${patientContact.name || "Patient"},

Your prescription is ready.

📋 *Prescription ID:* ${rxId}
👨‍⚕️ *Doctor:* ${prescription?.doctorName || "Doctor"}
📅 *Date:* ${formatDateIN(prescription?.date) || formatDateIN(new Date())}
🩺 *Diagnosis:* ${prescription?.diagnosis || "Dental consultation"}

${medications ? `💊 *Medications:*\n${medications}\n` : ""}
📝 *Doctor's Notes:*
${prescription?.notes || "Follow the instructions on your medication labels. Maintain good oral hygiene and visit us for regular checkups."}

${fileUrl ? `📎 *View/Download Prescription:*\n${fileUrl}\n` : `You can also view this prescription in your patient portal:\n${FRONTEND_URL}/patient/prescriptions\n`}
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
  const message = buildPrescriptionMessage(prescription, patientContact, fileUrl);
  const results = {};
  let finalResult;

  if (templateName) {
    const templateResult = await sendWhatsAppTemplateMessage({
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
      displayText: message,
    });
    results.template = templateResult;
    finalResult = templateResult;
  }

  if (!templateName) {
    finalResult = {
      success: false,
      skipped: true,
      error: "WhatsApp prescription template is not configured",
    };
    results.template = finalResult;
  }

  return {
    ...finalResult,
    phone: patientContact.phone,
    patient: patientContact,
    messagePreview: message,
    results,
  };
};

module.exports = {
  normalizePhoneNumber,
  resolvePatientContact,
  formatCurrencyINR,
  formatDateIN,
  buildInvoiceMessage,
  buildLoginCredentialsMessage,
  buildPrescriptionMessage,
  sendInvoiceWhatsApp,
  sendInvoicePaymentLinkWhatsApp,
  sendWhatsAppDocumentMessage,
  sendPaymentThankYouReviewWhatsApp,
  sendPaymentSuccessWhatsAppBundle,
  sendLoginCredentialsWhatsApp,
  sendForgotPasswordOtpWhatsApp,
  sendPrescriptionWhatsApp,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
  recordWhatsAppMessage,
  hasWhatsAppBaseConfig,
};

const https = require("https");
const Patient = require("../models/Patient");
const User = require("../models/User");

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";
const DEFAULT_LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
const FRONTEND_URL = process.env.FRONTEND_URL || "https://creadentsmiles.com";

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

const sendWhatsAppTemplateMessage = ({
  to,
  templateName,
  bodyParameters = [],
}) =>
  new Promise((resolve) => {
    if (!hasWhatsAppBaseConfig()) {
      return resolve({
        success: false,
        skipped: true,
        error:
          "WhatsApp configuration is incomplete. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
      });
    }
    if (!to || !templateName) {
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
      return resolve({
        success: false,
        skipped: true,
        error:
          "WhatsApp configuration is incomplete. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.",
      });
    }
    if (!to || !text) {
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
    success: textResult.success || (results.template && results.template.success) || false,
    skipped: textResult.skipped && (!results.template || results.template.skipped),
    phone: patientContact.phone,
    patient: patientContact,
    errors,
    results,
    messagePreview: detailedMessage,
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
    success: textResult.success || (results.template && results.template.success) || false,
    skipped: textResult.skipped && (!results.template || results.template.skipped),
    phone: normalizedPhone,
    errors,
    results,
    messagePreview: detailedMessage,
  };
};

const sendPrescriptionWhatsApp = async (prescription) => {
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
      `RX-${String(prescription?._id || "PRESCRIPTION").slice(-8).toUpperCase()}`,
      formatDateIN(prescription?.date),
      prescription?.diagnosis || "Dental consultation",
      medications || "See your patient portal",
      `${FRONTEND_URL}/patient/prescriptions`,
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
  sendLoginCredentialsWhatsApp,
  sendPrescriptionWhatsApp,
  sendWhatsAppTemplateMessage,
  sendWhatsAppTextMessage,
  hasWhatsAppBaseConfig,
};

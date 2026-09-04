const https = require("https");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const User = require("../models/User");
const { recordWhatsAppMessage } = require("./whatsappNotifications");

const DEFAULT_COUNTRY_CODE = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91";
const DEFAULT_LANGUAGE_CODE = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "en";
const DEFAULT_POLL_INTERVAL_MS = Number(
  process.env.WHATSAPP_REMINDER_POLL_INTERVAL_MS || 300000,
);

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

const parseAppointmentTime = (timeLabel) => {
  const match = String(timeLabel || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hours !== 12) {
    hours += 12;
  }

  if (meridiem === "AM" && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
};

const getDateParts = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    const isoLike = value.slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoLike) {
      return {
        year: Number(isoLike[1]),
        month: Number(isoLike[2]) - 1,
        day: Number(isoLike[3]),
      };
    }
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
};

const getAppointmentDateTime = (appointment) => {
  const dateParts = getDateParts(appointment?.date);
  const timeParts = parseAppointmentTime(appointment?.time);

  if (!dateParts || !timeParts) {
    return null;
  }

  return new Date(
    dateParts.year,
    dateParts.month,
    dateParts.day,
    timeParts.hours,
    timeParts.minutes,
    0,
    0,
  );
};

const formatAppointmentDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatAppointmentDateTimeParts = (appointment) => {
  return {
    appointmentDate: formatAppointmentDate(appointment?.date),
    appointmentTime: appointment?.time || "",
  };
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
          let parsedBody = null;
          try {
            parsedBody = JSON.parse(responseBody);
          } catch (_) {}
          void recordWhatsAppMessage({
            phone: to,
            text: `Template: ${templateName}${bodyParameters.length ? ` (${bodyParameters.join(", ")})` : ""}`,
            messageType: "template",
            templateName,
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
        text: `Template: ${templateName}`,
        messageType: "template",
        templateName,
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

const resolvePatientContact = async (appointment) => {
  const appointmentPatientId = toObjectIdString(appointment?.patientId);
  let patient =
    (appointmentPatientId && (await Patient.findById(appointmentPatientId))) ||
    (appointmentPatientId &&
      (await Patient.findOne({ userId: appointmentPatientId })));

  let user = null;

  if (patient?.userId) {
    user = await User.findById(patient.userId);
  }

  if (!user && appointmentPatientId) {
    user = await User.findById(appointmentPatientId);
  }

  return {
    name: patient?.name || user?.name || appointment?.patientName || "Patient",
    phone: normalizePhoneNumber(patient?.phone || user?.phone),
  };
};

const resolveDoctorContact = async (appointment) => {
  const doctor = appointment?.doctorId
    ? await User.findById(appointment.doctorId)
    : null;

  return {
    name: doctor?.name || appointment?.doctorName || "Doctor",
    phone: normalizePhoneNumber(doctor?.phone),
  };
};

const updateNotificationState = async (appointmentId, updates, errors = []) => {
  const payload = { ...updates };

  if (errors.length > 0) {
    payload.lastNotificationError = errors.join(" | ");
  } else if (Object.keys(updates).length > 0) {
    payload.lastNotificationError = undefined;
  }

  if (Object.keys(payload).length > 0) {
    await Appointment.findByIdAndUpdate(appointmentId, payload);
  }
};

const sendAppointmentBookingNotifications = async (appointment) => {
  const patientTemplate =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_BOOKED_PATIENT;
  const doctorTemplate =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_BOOKED_DOCTOR;

  const appointmentId = appointment?._id || appointment?.id;
  const updates = {};
  const errors = [];
  const { appointmentDate, appointmentTime } =
    formatAppointmentDateTimeParts(appointment);

  const [patientContact, doctorContact] = await Promise.all([
    resolvePatientContact(appointment),
    resolveDoctorContact(appointment),
  ]);

  if (
    !appointment?.bookingPatientNotificationSentAt &&
    patientTemplate &&
    patientContact.phone
  ) {
    const patientResult = await sendWhatsAppTemplateMessage({
      to: patientContact.phone,
      templateName: patientTemplate,
      bodyParameters: [
        patientContact.name,
        doctorContact.name,
        appointmentDate,
        appointmentTime,
        appointment?.type || "",
      ],
    });

    if (patientResult.success) {
      updates.bookingPatientNotificationSentAt = new Date();
    } else if (!patientResult.skipped) {
      errors.push(`Patient booking message failed: ${patientResult.error}`);
    }
  }

  if (
    !appointment?.bookingDoctorNotificationSentAt &&
    doctorTemplate &&
    doctorContact.phone
  ) {
    const doctorResult = await sendWhatsAppTemplateMessage({
      to: doctorContact.phone,
      templateName: doctorTemplate,
      bodyParameters: [
        doctorContact.name,
        patientContact.name,
        appointmentDate,
        appointmentTime,
        appointment?.type || "",
      ],
    });

    if (doctorResult.success) {
      updates.bookingDoctorNotificationSentAt = new Date();
    } else if (!doctorResult.skipped) {
      errors.push(`Doctor booking message failed: ${doctorResult.error}`);
    }
  }

  await updateNotificationState(appointmentId, updates, errors);
};

const sendAppointmentRescheduleNotification = async (appointment) => {
  const templateName =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_RESCHEDULED_PATIENT;
  const patientContact = await resolvePatientContact(appointment);

  if (!templateName || !patientContact.phone) {
    return {
      success: false,
      skipped: true,
      error: !templateName
        ? "Appointment reschedule WhatsApp template is not configured"
        : "Patient phone number not found",
    };
  }

  const { appointmentDate, appointmentTime } =
    formatAppointmentDateTimeParts(appointment);
  const result = await sendWhatsAppTemplateMessage({
    to: patientContact.phone,
    templateName,
    bodyParameters: [
      patientContact.name,
      appointmentDate,
      appointmentDate,
      appointmentTime,
      appointment?.type || "",
    ],
  });

  return {
    ...result,
    phone: patientContact.phone,
    messageType: "appointment_rescheduled",
  };
};

let reminderJobRunning = false;

const sendReminderIfDue = async (appointment, now) => {
  const patientTemplate =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_REMINDER_PATIENT;
  const doctorTemplate =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_REMINDER_DOCTOR;
  if (!patientTemplate && !doctorTemplate) {
    return;
  }

  const appointmentDateTime = getAppointmentDateTime(appointment);
  if (!appointmentDateTime || appointmentDateTime <= now) {
    return;
  }

  const oneDayBefore = new Date(
    appointmentDateTime.getTime() - 24 * 60 * 60 * 1000,
  );
  const sixHoursBefore = new Date(
    appointmentDateTime.getTime() - 6 * 60 * 60 * 1000,
  );
  const oneHourBefore = new Date(
    appointmentDateTime.getTime() - 60 * 60 * 1000,
  );

  const { appointmentDate, appointmentTime } =
    formatAppointmentDateTimeParts(appointment);
  const updates = {};
  const errors = [];

  if (
    !appointment.reminderOneDaySentAt &&
    now >= oneDayBefore &&
    now < sixHoursBefore
  ) {
    const patientContact = await resolvePatientContact(appointment);
    if (patientContact.phone) {
      const result = await sendWhatsAppTemplateMessage({
        to: patientContact.phone,
        templateName: patientTemplate,
        bodyParameters: [
          patientContact.name,
          appointment?.doctorName || "Doctor",
          appointmentDate,
          appointmentTime,
          "tomorrow",
        ],
      });

      if (result.success) {
        updates.reminderOneDaySentAt = new Date();
      } else if (!result.skipped) {
        errors.push(`Patient 1 day reminder failed: ${result.error}`);
      }
    }
  }

  if (
    !appointment.reminderPatientSixHoursSentAt &&
    now >= sixHoursBefore &&
    now < appointmentDateTime
  ) {
    const patientContact = await resolvePatientContact(appointment);
    if (patientContact.phone) {
      const result = await sendWhatsAppTemplateMessage({
        to: patientContact.phone,
        templateName: patientTemplate,
        bodyParameters: [
          patientContact.name,
          appointment?.doctorName || "Doctor",
          appointmentDate,
          appointmentTime,
          "in 6 hours",
        ],
      });

      if (result.success) {
        updates.reminderPatientSixHoursSentAt = new Date();
      } else if (!result.skipped) {
        errors.push(`Patient 6 hour reminder failed: ${result.error}`);
      }
    }
  }

  const doctorContact = await resolveDoctorContact(appointment);
  if (
    !appointment.reminderDoctorOneDaySentAt &&
    now >= oneDayBefore &&
    now < oneHourBefore &&
    doctorContact.phone
  ) {
    const result = await sendWhatsAppTemplateMessage({
      to: doctorContact.phone,
      templateName: doctorTemplate,
      bodyParameters: [
        doctorContact.name,
        appointment?.patientName || "Patient",
        appointmentDate,
        appointmentTime,
        "tomorrow",
      ],
    });

    if (result.success) {
      updates.reminderDoctorOneDaySentAt = new Date();
    } else if (!result.skipped) {
      errors.push(`Doctor 1 day reminder failed: ${result.error}`);
    }
  }

  if (
    !appointment.reminderDoctorOneHourSentAt &&
    now >= oneHourBefore &&
    now < appointmentDateTime &&
    doctorContact.phone
  ) {
    const result = await sendWhatsAppTemplateMessage({
      to: doctorContact.phone,
      templateName: doctorTemplate,
      bodyParameters: [
        doctorContact.name,
        appointment?.patientName || "Patient",
        appointmentDate,
        appointmentTime,
        "in 1 hour",
      ],
    });

    if (result.success) {
      updates.reminderDoctorOneHourSentAt = new Date();
    } else if (!result.skipped) {
      errors.push(`Doctor 1 hour reminder failed: ${result.error}`);
    }
  }

  await updateNotificationState(appointment._id, updates, errors);
};

const processAppointmentReminders = async () => {
  if (reminderJobRunning) {
    return;
  }

  reminderJobRunning = true;

  try {
    const now = new Date();
    const queryStartDate = new Date(now);
    queryStartDate.setDate(queryStartDate.getDate() - 1);
    queryStartDate.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      status: "Scheduled",
      date: { $gte: queryStartDate },
    }).sort({ date: 1, time: 1 });

    for (const appointment of appointments) {
      await sendReminderIfDue(appointment, now);
    }
  } catch (error) {
    console.error("Appointment reminder job failed:", error.message);
  } finally {
    reminderJobRunning = false;
  }
};

const startAppointmentReminderScheduler = () => {
  processAppointmentReminders().catch((error) => {
    console.error("Initial appointment reminder run failed:", error.message);
  });

  setInterval(() => {
    processAppointmentReminders().catch((error) => {
      console.error(
        "Scheduled appointment reminder run failed:",
        error.message,
      );
    });
  }, DEFAULT_POLL_INTERVAL_MS);
};

module.exports = {
  processAppointmentReminders,
  sendAppointmentBookingNotifications,
  sendAppointmentRescheduleNotification,
  startAppointmentReminderScheduler,
};

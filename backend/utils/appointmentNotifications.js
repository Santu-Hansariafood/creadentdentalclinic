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
        void recordWhatsAppMessage({
          phone: to,
          text: `Template: ${templateName || "unknown"}`,
          messageType: "appointment_rescheduled",
          templateName,
          templateParameters: bodyParameters.map((value) => String(value ?? "")),
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
        messageType: "appointment_rescheduled",
        templateName,
        templateParameters: bodyParameters.map((value) => String(value ?? "")),
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
            text: `Template: ${templateName}${bodyParameters.length ? ` (${bodyParameters.join(", ")})` : ""}`,
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
        text: `Template: ${templateName}`,
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
    } else {
      errors.push(`Patient booking message failed: ${patientResult.error}`);
    }
  } else if (!appointment?.bookingPatientNotificationSentAt) {
    errors.push(
      !patientTemplate
        ? "Patient booking WhatsApp template is not configured"
        : "Patient phone number not found for booking confirmation",
    );
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
    } else {
      errors.push(`Doctor booking message failed: ${doctorResult.error}`);
    }
  } else if (!appointment?.bookingDoctorNotificationSentAt) {
    errors.push(
      !doctorTemplate
        ? "Doctor booking WhatsApp template is not configured"
        : "Doctor phone number not found for booking confirmation",
    );
  }

  await updateNotificationState(appointmentId, updates, errors);
};

const sendAppointmentRescheduleNotification = async (
  appointment,
  previousAppointmentDate,
) => {
  const patientTemplateName =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_RESCHEDULED_PATIENT;
  const doctorTemplateName =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_RESCHEDULED_DOCTOR ||
    patientTemplateName;
  const employeeTemplateName =
    process.env.WHATSAPP_TEMPLATE_APPOINTMENT_RESCHEDULED_EMPLOYEE ||
    patientTemplateName;
  const [patientContact, doctorContact, employees] = await Promise.all([
    resolvePatientContact(appointment),
    resolveDoctorContact(appointment),
    User.find({ role: "employee" }).select("name phone"),
  ]);

  const { appointmentDate, appointmentTime } =
    formatAppointmentDateTimeParts(appointment);
  const previousDate = formatAppointmentDate(previousAppointmentDate);
  const commonParameters = [
    previousDate,
    appointmentDate,
    appointmentTime,
    appointment?.type || "",
  ];
  const results = {
    patient: { success: false, skipped: true, error: "Not configured" },
    doctor: { success: false, skipped: true, error: "Not configured" },
    employees: [],
  };

  if (
    !appointment.reschedulePatientNotificationSentAt &&
    patientContact.phone &&
    patientTemplateName
  ) {
    results.patient = await sendWhatsAppTemplateMessage({
      to: patientContact.phone,
      templateName: patientTemplateName,
      bodyParameters: [patientContact.name, ...commonParameters],
    });
  }

  if (
    !appointment.rescheduleDoctorNotificationSentAt &&
    doctorContact.phone &&
    doctorTemplateName
  ) {
    results.doctor = await sendWhatsAppTemplateMessage({
      to: doctorContact.phone,
      templateName: doctorTemplateName,
      bodyParameters:
        doctorTemplateName === patientTemplateName
          ? [doctorContact.name, ...commonParameters]
          : [
              doctorContact.name,
              appointment?.patientName || "Patient",
              ...commonParameters,
            ],
    });
  }

  if (!appointment.rescheduleEmployeeNotificationSentAt && employeeTemplateName) {
    results.employees = await Promise.all(
      employees
        .filter((employee) => normalizePhoneNumber(employee.phone))
        .map((employee) =>
          sendWhatsAppTemplateMessage({
            to: normalizePhoneNumber(employee.phone),
            templateName: employeeTemplateName,
            bodyParameters:
              employeeTemplateName === patientTemplateName
                ? [employee.name || "Employee", ...commonParameters]
                : [
                    employee.name || "Employee",
                    appointment?.patientName || "Patient",
                    appointment?.doctorName || "Doctor",
                    ...commonParameters,
                  ],
          }),
        ),
    );
  }

  const deliveryErrors = [];
  if (!results.patient.success) {
    deliveryErrors.push(`Patient reschedule message: ${results.patient.error || "not sent"}`);
  }
  if (!results.doctor.success) {
    deliveryErrors.push(`Doctor reschedule message: ${results.doctor.error || "not sent"}`);
  }
  if (!results.employees.length) {
    deliveryErrors.push("Employee reschedule message: no employee recipient was sent");
  } else if (results.employees.some((result) => !result.success)) {
    deliveryErrors.push("Employee reschedule message: one or more deliveries failed");
  }

  return {
    success:
      results.patient.success ||
      results.doctor.success ||
      results.employees.some((result) => result.success),
    skipped:
      results.patient.skipped &&
      results.doctor.skipped &&
      results.employees.every((result) => result.skipped),
    results,
    error: deliveryErrors.length ? deliveryErrors.join(" | ") : null,
    phone: patientContact.phone,
    templateName: patientTemplateName,
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
    if (patientTemplate && patientContact.phone) {
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
      } else {
        errors.push(`Patient 1 day reminder failed: ${result.error}`);
      }
    } else {
      errors.push(
        !patientTemplate
          ? "Patient reminder template is not configured"
          : "Patient phone number not found for 1 day reminder",
      );
    }
  }

  if (
    !appointment.reminderPatientSixHoursSentAt &&
    now >= sixHoursBefore &&
    now < appointmentDateTime
  ) {
    const patientContact = await resolvePatientContact(appointment);
    if (patientTemplate && patientContact.phone) {
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
      } else {
        errors.push(`Patient 6 hour reminder failed: ${result.error}`);
      }
    } else {
      errors.push(
        !patientTemplate
          ? "Patient reminder template is not configured"
          : "Patient phone number not found for 6 hour reminder",
      );
    }
  }

  const doctorContact = await resolveDoctorContact(appointment);
  if (
    !appointment.reminderDoctorOneDaySentAt &&
    now >= oneDayBefore &&
    now < oneHourBefore &&
    doctorTemplate &&
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
    } else {
      errors.push(`Doctor 1 day reminder failed: ${result.error}`);
    }
  } else if (
    !appointment.reminderDoctorOneDaySentAt &&
    now >= oneDayBefore &&
    now < oneHourBefore
  ) {
    errors.push(
      !doctorTemplate
        ? "Doctor reminder template is not configured"
        : "Doctor phone number not found for 1 day reminder",
    );
  }

  if (
    !appointment.reminderDoctorOneHourSentAt &&
    now >= oneHourBefore &&
    now < appointmentDateTime &&
    doctorTemplate &&
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
    } else {
      errors.push(`Doctor 1 hour reminder failed: ${result.error}`);
    }
  } else if (
    !appointment.reminderDoctorOneHourSentAt &&
    now >= oneHourBefore &&
    now < appointmentDateTime
  ) {
    errors.push(
      !doctorTemplate
        ? "Doctor reminder template is not configured"
        : "Doctor phone number not found for 1 hour reminder",
    );
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

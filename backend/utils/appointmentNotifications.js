const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const User = require("../models/User");
const {
  normalizePhoneNumber,
  sendTemplateWithFallback,
} = require("./whatsappNotifications");

const DEFAULT_POLL_INTERVAL_MS = Number(
  process.env.WHATSAPP_REMINDER_POLL_INTERVAL_MS || 300000,
);

const toObjectIdString = (value) => {
  if (!value) return "";
  return value.toString();
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

  if (!appointment?.bookingPatientNotificationSentAt && patientContact.phone) {
    const fallbackText = buildAppointmentBookedPatientMessage(
      patientContact,
      doctorContact,
      appointmentDate,
      appointmentTime,
      appointment?.type || "",
    );
    const patientResult = await sendTemplateWithFallback({
      to: patientContact.phone,
      templateName: patientTemplate,
      templateKey: "APPOINTMENT_BOOKED_PATIENT",
      bodyParameters: [
        patientContact.name,
        doctorContact.name,
        appointmentDate,
        appointmentTime,
        appointment?.type || "",
      ],
      fallbackText,
    });

    if (patientResult.success) {
      updates.bookingPatientNotificationSentAt = new Date();
    } else {
      errors.push(`Patient booking message failed: ${patientResult.error}`);
    }
  } else if (!appointment?.bookingPatientNotificationSentAt) {
    errors.push("Patient phone number not found for booking confirmation");
  }

  if (!appointment?.bookingDoctorNotificationSentAt && doctorContact.phone) {
    const fallbackText = buildAppointmentBookedDoctorMessage(
      doctorContact,
      patientContact,
      appointmentDate,
      appointmentTime,
      appointment?.type || "",
    );
    const doctorResult = await sendTemplateWithFallback({
      to: doctorContact.phone,
      templateName: doctorTemplate,
      templateKey: "APPOINTMENT_BOOKED_DOCTOR",
      bodyParameters: [
        doctorContact.name,
        patientContact.name,
        appointmentDate,
        appointmentTime,
        appointment?.type || "",
      ],
      fallbackText,
    });

    if (doctorResult.success) {
      updates.bookingDoctorNotificationSentAt = new Date();
    } else {
      errors.push(`Doctor booking message failed: ${doctorResult.error}`);
    }
  } else if (!appointment?.bookingDoctorNotificationSentAt) {
    errors.push("Doctor phone number not found for booking confirmation");
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
    patientContact.phone
  ) {
    const fallbackText = buildAppointmentRescheduledPatientMessage(
      patientContact,
      previousDate,
      appointmentDate,
      appointmentTime,
      appointment?.type || "",
    );
    results.patient = await sendTemplateWithFallback({
      to: patientContact.phone,
      templateName: patientTemplateName,
      templateKey: "APPOINTMENT_RESCHEDULED_PATIENT",
      bodyParameters: [patientContact.name, ...commonParameters],
      fallbackText,
    });
    if (results.patient.success) {
      await Appointment.findByIdAndUpdate(appointment._id, {
        reschedulePatientNotificationSentAt: new Date(),
      }).catch(() => {});
    }
  }

  if (!appointment.rescheduleDoctorNotificationSentAt && doctorContact.phone) {
    const usesFallbackTemplate = doctorTemplateName === patientTemplateName;
    const doctorParams = usesFallbackTemplate
      ? [doctorContact.name, ...commonParameters]
      : [
          doctorContact.name,
          appointment?.patientName || "Patient",
          ...commonParameters,
        ];
    const fallbackText = buildAppointmentRescheduledDoctorMessage(
      doctorContact,
      appointment?.patientName || patientContact.name,
      previousDate,
      appointmentDate,
      appointmentTime,
      appointment?.type || "",
    );
    results.doctor = await sendTemplateWithFallback({
      to: doctorContact.phone,
      templateName: doctorTemplateName,
      templateKey: usesFallbackTemplate
        ? "APPOINTMENT_RESCHEDULED_PATIENT"
        : "APPOINTMENT_RESCHEDULED_DOCTOR",
      bodyParameters: doctorParams,
      fallbackText,
    });
    if (results.doctor.success) {
      await Appointment.findByIdAndUpdate(appointment._id, {
        rescheduleDoctorNotificationSentAt: new Date(),
      }).catch(() => {});
    }
  }

  if (!appointment.rescheduleEmployeeNotificationSentAt) {
    results.employees = await Promise.all(
      employees
        .filter((employee) => normalizePhoneNumber(employee.phone))
        .map(async (employee) => {
          const usesFallbackTemplate = employeeTemplateName === patientTemplateName;
          const employeeParams = usesFallbackTemplate
            ? [employee.name || "Employee", ...commonParameters]
            : [
                employee.name || "Employee",
                appointment?.patientName || patientContact.name,
                appointment?.doctorName || doctorContact.name,
                ...commonParameters,
              ];
          const fallbackText = buildAppointmentRescheduledEmployeeMessage(
            employee.name || "Employee",
            appointment?.patientName || patientContact.name,
            appointment?.doctorName || doctorContact.name,
            previousDate,
            appointmentDate,
            appointmentTime,
            appointment?.type || "",
          );
          const empResult = await sendTemplateWithFallback({
            to: normalizePhoneNumber(employee.phone),
            templateName: employeeTemplateName,
            templateKey: usesFallbackTemplate
              ? "APPOINTMENT_RESCHEDULED_PATIENT"
              : "APPOINTMENT_RESCHEDULED_EMPLOYEE",
            bodyParameters: employeeParams,
            fallbackText,
          });
          return empResult;
        }),
    );
    if (results.employees.some((r) => r.success)) {
      await Appointment.findByIdAndUpdate(appointment._id, {
        rescheduleEmployeeNotificationSentAt: new Date(),
      }).catch(() => {});
    }
  }

  const deliveryErrors = [];
  if (!results.patient.success) {
    deliveryErrors.push(
      `Patient reschedule message: ${results.patient.error || "not sent"}`,
    );
  }
  if (!results.doctor.success) {
    deliveryErrors.push(
      `Doctor reschedule message: ${results.doctor.error || "not sent"}`,
    );
  }
  if (!results.employees.length) {
    deliveryErrors.push(
      "Employee reschedule message: no employee recipient was sent",
    );
  } else if (results.employees.some((result) => !result.success)) {
    deliveryErrors.push(
      "Employee reschedule message: one or more deliveries failed",
    );
  }

  if (deliveryErrors.length > 0) {
    await Appointment.findByIdAndUpdate(appointment._id, {
      lastNotificationError: deliveryErrors.join(" | "),
    }).catch(() => {});
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
      const whenText = "tomorrow";
      const fallbackText = buildAppointmentReminderPatientMessage(
        patientContact,
        appointment?.doctorName || "Doctor",
        appointmentDate,
        appointmentTime,
        whenText,
      );
      const result = await sendTemplateWithFallback({
        to: patientContact.phone,
        templateName: patientTemplate,
        templateKey: "APPOINTMENT_REMINDER_PATIENT",
        bodyParameters: [
          patientContact.name,
          appointment?.doctorName || "Doctor",
          appointmentDate,
          appointmentTime,
          whenText,
        ],
        fallbackText,
      });

      if (result.success) {
        updates.reminderOneDaySentAt = new Date();
      } else {
        errors.push(`Patient 1 day reminder failed: ${result.error}`);
      }
    } else {
      errors.push("Patient phone number not found for 1 day reminder");
    }
  }

  if (
    !appointment.reminderPatientSixHoursSentAt &&
    now >= sixHoursBefore &&
    now < appointmentDateTime
  ) {
    const patientContact = await resolvePatientContact(appointment);
    if (patientContact.phone) {
      const whenText = "in 6 hours";
      const fallbackText = buildAppointmentReminderPatientMessage(
        patientContact,
        appointment?.doctorName || "Doctor",
        appointmentDate,
        appointmentTime,
        whenText,
      );
      const result = await sendTemplateWithFallback({
        to: patientContact.phone,
        templateName: patientTemplate,
        templateKey: "APPOINTMENT_REMINDER_PATIENT",
        bodyParameters: [
          patientContact.name,
          appointment?.doctorName || "Doctor",
          appointmentDate,
          appointmentTime,
          whenText,
        ],
        fallbackText,
      });

      if (result.success) {
        updates.reminderPatientSixHoursSentAt = new Date();
      } else {
        errors.push(`Patient 6 hour reminder failed: ${result.error}`);
      }
    } else {
      errors.push("Patient phone number not found for 6 hour reminder");
    }
  }

  const doctorContact = await resolveDoctorContact(appointment);
  if (
    !appointment.reminderDoctorOneDaySentAt &&
    now >= oneDayBefore &&
    now < oneHourBefore &&
    doctorContact.phone
  ) {
    const whenText = "tomorrow";
    const fallbackText = buildAppointmentReminderDoctorMessage(
      doctorContact,
      appointment?.patientName || "Patient",
      appointmentDate,
      appointmentTime,
      whenText,
    );
    const result = await sendTemplateWithFallback({
      to: doctorContact.phone,
      templateName: doctorTemplate,
      templateKey: "APPOINTMENT_REMINDER_DOCTOR",
      bodyParameters: [
        doctorContact.name,
        appointment?.patientName || "Patient",
        appointmentDate,
        appointmentTime,
        whenText,
      ],
      fallbackText,
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
    errors.push("Doctor phone number not found for 1 day reminder");
  }

  if (
    !appointment.reminderDoctorOneHourSentAt &&
    now >= oneHourBefore &&
    now < appointmentDateTime &&
    doctorContact.phone
  ) {
    const whenText = "in 1 hour";
    const fallbackText = buildAppointmentReminderDoctorMessage(
      doctorContact,
      appointment?.patientName || "Patient",
      appointmentDate,
      appointmentTime,
      whenText,
    );
    const result = await sendTemplateWithFallback({
      to: doctorContact.phone,
      templateName: doctorTemplate,
      templateKey: "APPOINTMENT_REMINDER_DOCTOR",
      bodyParameters: [
        doctorContact.name,
        appointment?.patientName || "Patient",
        appointmentDate,
        appointmentTime,
        whenText,
      ],
      fallbackText,
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
    errors.push("Doctor phone number not found for 1 hour reminder");
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

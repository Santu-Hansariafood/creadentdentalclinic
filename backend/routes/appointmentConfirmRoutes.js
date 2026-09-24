const express = require("express");
const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Notification = require("../models/Notification");

const router = express.Router();

const ROUTE_LOG_PREFIX = "[APPT-CONFIRM]";

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

const log = (event, payload = {}) => {
  const ts = new Date().toISOString();
  const serialized = Object.keys(payload).length
    ? ` | ${JSON.stringify(payload)}`
    : "";
  console.log(`${ROUTE_LOG_PREFIX} ${ts} ${event}${serialized}`);
};

const logError = (event, error, payload = {}) => {
  const ts = new Date().toISOString();
  const msg = error?.message || String(error || "unknown error");
  const serialized = Object.keys(payload).length
    ? ` | ${JSON.stringify(payload)}`
    : "";
  console.error(`${ROUTE_LOG_PREFIX} ERROR ${ts} ${event}: ${msg}${serialized}`);
};

const createStaffNotifications = async (appointment, responseType, patientName, rescheduleReason) => {
  try {
    const staff = await User.find({
      role: { $in: ["admin", "doctor", "employee"] },
    }).select("_id");

    if (!staff.length) return 0;

    const isConfirm = responseType === "confirmed";
    const title = isConfirm
      ? "Appointment confirmed by patient"
      : "Appointment reschedule requested";
    const dateLabel = formatDateIN(appointment.date);
    const baseMessage = `${patientName} has ${
      isConfirm ? "confirmed" : "requested to reschedule"
    } the appointment on ${dateLabel} at ${appointment.time}.`;
    const message =
      !isConfirm && rescheduleReason
        ? `${baseMessage} Reason: ${rescheduleReason}`
        : baseMessage;

    const insertResult = await Notification.insertMany(
      staff.map((member) => ({
        userId: member._id,
        type: isConfirm ? "APPOINTMENT_CONFIRMED" : "APPOINTMENT_RESCHEDULE_REQUESTED",
        title,
        message,
        appointmentId: appointment._id,
        priority: isConfirm ? "medium" : "high",
      })),
    );

    return insertResult.length;
  } catch (err) {
    logError("Staff notification insert failed", err);
    return 0;
  }
};

router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== "string" || token.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing appointment token",
      });
    }

    const appointment = await Appointment.findOne({
      confirmToken: token,
      status: "Scheduled",
    }).lean();

    if (!appointment) {
      log("GET: appointment not found or not scheduled", { token: token.slice(0, 8) });
      return res.status(404).json({
        success: false,
        error:
          "Appointment not found. It may have already been cancelled, completed, or the link is expired.",
      });
    }

    const patient = appointment.patientId
      ? await Patient.findById(appointment.patientId)
          .select("name phone email age gender")
          .lean()
      : null;

    log("GET: appointment details retrieved", {
      token: token.slice(0, 8),
      appointmentId: String(appointment._id),
    });

    return res.status(200).json({
      success: true,
      data: {
        id: appointment._id.toString(),
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        date: appointment.date,
        dateFormatted: formatDateIN(appointment.date),
        time: appointment.time,
        duration: appointment.duration || 30,
        type: appointment.type,
        reason: appointment.reason || "",
        patientResponse: appointment.patientResponse || null,
        patientResponseAt: appointment.patientResponseAt || null,
        rescheduleReason: appointment.rescheduleReason || "",
        patient: patient
          ? {
              name: patient.name,
              phone: patient.phone,
              email: patient.email || "",
              age: patient.age || null,
              gender: patient.gender || "",
            }
          : null,
      },
    });
  } catch (err) {
    logError("GET appointment details failed", err);
    return res.status(500).json({
      success: false,
      error: "An internal error occurred while fetching appointment details.",
    });
  }
});

router.post("/:token/confirm", async (req, res) => {
  try {
    const { token } = req.params;

    if (!token || typeof token !== "string" || token.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing appointment token",
      });
    }

    const appointment = await Appointment.findOne({
      confirmToken: token,
      status: "Scheduled",
    });

    if (!appointment) {
      log("CONFIRM: appointment not found or not scheduled", {
        token: token.slice(0, 8),
      });
      return res.status(404).json({
        success: false,
        error:
          "Appointment not found. It may have already been cancelled, completed, or the link is expired.",
      });
    }

    if (appointment.patientResponse === "confirmed") {
      return res.status(200).json({
        success: true,
        alreadyConfirmed: true,
        message: "This appointment has already been confirmed by the patient.",
        data: {
          patientResponse: appointment.patientResponse,
          patientResponseAt: appointment.patientResponseAt,
        },
      });
    }

    appointment.patientResponse = "confirmed";
    appointment.patientResponseAt = new Date();
    appointment.rescheduleReason = undefined;

    await appointment.save();

    await createStaffNotifications(
      appointment,
      "confirmed",
      appointment.patientName,
      null,
    );

    log("CONFIRM: appointment confirmed", {
      token: token.slice(0, 8),
      appointmentId: String(appointment._id),
      patientName: appointment.patientName,
    });

    return res.status(200).json({
      success: true,
      message:
        "Thank you! Your appointment has been confirmed. We look forward to seeing you.",
      data: {
        patientResponse: appointment.patientResponse,
        patientResponseAt: appointment.patientResponseAt,
      },
    });
  } catch (err) {
    logError("CONFIRM: failed", err);
    return res.status(500).json({
      success: false,
      error: "An internal error occurred while confirming your appointment.",
    });
  }
});

router.post("/:token/reschedule", async (req, res) => {
  try {
    const { token } = req.params;
    const { reason } = req.body || {};

    if (!token || typeof token !== "string" || token.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing appointment token",
      });
    }

    const appointment = await Appointment.findOne({
      confirmToken: token,
      status: "Scheduled",
    });

    if (!appointment) {
      log("RESCHEDULE: appointment not found or not scheduled", {
        token: token.slice(0, 8),
      });
      return res.status(404).json({
        success: false,
        error:
          "Appointment not found. It may have already been cancelled, completed, or the link is expired.",
      });
    }

    if (appointment.patientResponse === "reschedule_requested") {
      return res.status(200).json({
        success: true,
        alreadyRequested: true,
        message:
          "A reschedule request has already been submitted. Our team will contact you shortly.",
        data: {
          patientResponse: appointment.patientResponse,
          patientResponseAt: appointment.patientResponseAt,
          rescheduleReason: appointment.rescheduleReason || "",
        },
      });
    }

    appointment.patientResponse = "reschedule_requested";
    appointment.patientResponseAt = new Date();
    if (reason && typeof reason === "string" && reason.trim().length > 0) {
      appointment.rescheduleReason = reason.trim().slice(0, 500);
    }

    await appointment.save();

    await createStaffNotifications(
      appointment,
      "reschedule_requested",
      appointment.patientName,
      appointment.rescheduleReason,
    );

    log("RESCHEDULE: request submitted", {
      token: token.slice(0, 8),
      appointmentId: String(appointment._id),
      patientName: appointment.patientName,
      hasReason: Boolean(appointment.rescheduleReason),
    });

    return res.status(200).json({
      success: true,
      message:
        "Your reschedule request has been submitted. Our team will contact you shortly to arrange a new appointment time.",
      data: {
        patientResponse: appointment.patientResponse,
        patientResponseAt: appointment.patientResponseAt,
        rescheduleReason: appointment.rescheduleReason || "",
      },
    });
  } catch (err) {
    logError("RESCHEDULE: failed", err);
    return res.status(500).json({
      success: false,
      error:
        "An internal error occurred while submitting your reschedule request.",
    });
  }
});

module.exports = router;

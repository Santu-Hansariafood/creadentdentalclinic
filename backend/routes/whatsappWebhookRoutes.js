const crypto = require("crypto");
const express = require("express");
const Patient = require("../models/Patient");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");
const WhatsAppMessage = require("../models/WhatsAppMessage");

const router = express.Router();

const getVerifyToken = () => process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const getAppSecret = () => process.env.WHATSAPP_APP_SECRET;

const WEBHOOK_LOG_PREFIX = "[WHATSAPP-WEBHOOK]";

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "").slice(-10);

const log = (event, payload = {}) => {
  const ts = new Date().toISOString();
  const serialized = Object.keys(payload).length
    ? ` | ${JSON.stringify(payload)}`
    : "";
  console.log(`${WEBHOOK_LOG_PREFIX} ${ts} ${event}${serialized}`);
};

const logError = (event, error, payload = {}) => {
  const ts = new Date().toISOString();
  const msg = error?.message || String(error || "unknown error");
  const serialized = Object.keys(payload).length
    ? ` | ${JSON.stringify(payload)}`
    : "";
  console.error(`${WEBHOOK_LOG_PREFIX} ERROR ${ts} ${event}: ${msg}${serialized}`);
  if (error?.stack) console.error(`${WEBHOOK_LOG_PREFIX} STACK:`, error.stack);
};

const parseButtonReply = (message) => {
  const rawPayload =
    message.button?.payload ||
    message.interactive?.button_reply?.id ||
    "";
  const textValue =
    message.button?.text ||
    message.interactive?.button_reply?.title ||
    "";
  const payloadStr = String(rawPayload || "").trim();
  const textStr = String(textValue || "").trim().toLowerCase();

  if (payloadStr) {
    const colonIdx = payloadStr.indexOf(":");
    if (colonIdx > 0) {
      const action = payloadStr.slice(0, colonIdx).toLowerCase();
      const token = payloadStr.slice(colonIdx + 1);
      if (action === "confirm" || action === "confirmed") {
        return { response: "confirmed", token };
      }
      if (
        action === "reschedule" ||
        action === "reschedule_requested" ||
        action === "request_reschedule"
      ) {
        return { response: "reschedule_requested", token };
      }
    }
    const lower = payloadStr.toLowerCase();
    if (lower.includes("confirm")) return { response: "confirmed", token: null };
    if (lower.includes("reschedul")) return { response: "reschedule_requested", token: null };
  }

  if (textStr.includes("confirm")) return { response: "confirmed", token: null };
  if (
    textStr.includes("reschedul") ||
    textStr.includes("schedule_request") ||
    textStr.includes("schedule request") ||
    textStr === "schedule" ||
    textStr === "request_schedule"
  ) {
    return { response: "reschedule_requested", token: null };
  }
  return null;
};

const getButtonReply = (message) => {
  const parsed = parseButtonReply(message);
  return parsed?.response || null;
};

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const configuredToken = getVerifyToken();

  log("GET verify", {
    mode,
    hasToken: Boolean(token),
    hasChallenge: Boolean(challenge),
    configured: Boolean(configuredToken),
  });

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    configuredToken &&
    token.length === configuredToken.length &&
    crypto.timingSafeEqual(Buffer.from(String(token)), Buffer.from(configuredToken))
  ) {
    log("GET verify success", { status: 200 });
    return res.status(200).send(challenge);
  }

  log("GET verify failed", { status: 403 });
  return res.sendStatus(403);
});

const safeProcessStatuses = async (statuses = [], value = {}) => {
  const results = [];
  for (const status of statuses) {
    try {
      const statusName = ["sent", "delivered", "read", "failed"].includes(status.status)
        ? status.status
        : "failed";
      const metaError = status.errors?.[0];
      const statusError = metaError
        ? [
            metaError.title,
            metaError.message,
            metaError.code && `code ${metaError.code}`,
            metaError.type,
          ]
            .filter(Boolean)
            .join(" | ")
        : undefined;

      const statusTs = status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date();

      log("Status event", {
        id: status.id,
        recipient_id: status.recipient_id,
        status: status.status,
        mapped: statusName,
        conversationId: status.conversation?.id,
        error: statusError || undefined,
      });

      const query = { messageId: status.id };
      const update = {
        status: statusName,
        statusAt: statusTs,
        ...(statusError ? { error: statusError } : {}),
      };

      let updated = await WhatsAppMessage.findOneAndUpdate(query, update, {
        returnDocument: "after",
      });

      if (!updated) {
        const recipientPhone = normalizePhone(status.recipient_id || "");
        const wamid = status.id || "";
        log("Status: no messageId match, attempting fallback query", {
          recipientPhone,
          wamid,
        });
        updated = await WhatsAppMessage.findOneAndUpdate(
          {
            direction: "outbound",
            phone: { $regex: `${recipientPhone}$` },
            status: { $in: ["queued", "sent"] },
            createdAt: {
              $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            },
          },
          { messageId: wamid, ...update },
          { sort: { createdAt: -1 }, returnDocument: "after" },
        );
      }

      results.push({
        id: status.id,
        status: statusName,
        matched: Boolean(updated),
      });
    } catch (err) {
      logError("Status processing failed", err, { id: status.id });
      results.push({
        id: status.id,
        status: "failed",
        matched: false,
        error: err.message,
      });
    }
  }
  return results;
};

const safeProcessInboundMessage = async (message, value = {}) => {
  try {
    const phone = message.from || "";
    const normalizedPhone = normalizePhone(phone);
    const timestamp = message.timestamp ? new Date(Number(message.timestamp) * 1000) : new Date();

    log("Inbound message", {
      id: message.id,
      from: phone,
      normalizedFrom: normalizedPhone,
      type: message.type,
      hasText: Boolean(message.text?.body),
      hasButton: Boolean(message.button),
      hasInteractive: Boolean(message.interactive),
    });

    const patient = await Patient.findOne({
      $or: [
        { phone },
        { phone: normalizedPhone },
        ...(normalizedPhone ? [{ phone: { $regex: `${normalizedPhone}$` } }] : []),
      ],
    }).select("_id name phone");

    const recipientUser = !patient
      ? await User.findOne({
          $or: [
            { phone },
            { phone: normalizedPhone },
            ...(normalizedPhone ? [{ phone: { $regex: `${normalizedPhone}$` } }] : []),
          ],
        }).select("_id name phone role")
      : null;

    const text =
      message.text?.body ||
      message.button?.text ||
      message.interactive?.button_reply?.title ||
      `[${message.type || "WhatsApp"} message]`;

    await WhatsAppMessage.create({
      direction: "inbound",
      phone,
      patientId: patient?._id,
      patientName: patient?.name || recipientUser?.name,
      text,
      messageType: message.type || "unknown",
      status: "received",
      statusAt: timestamp,
      read: false,
      messageId: message.id,
    });

    const parsedButton = parseButtonReply(message);
    if (patient && parsedButton) {
      const { response: patientResponse, token } = parsedButton;
      log("Patient button response", {
        patientId: String(patient._id),
        response: patientResponse,
        tokenPresent: Boolean(token),
        token: token ? token.slice(0, 8) + "..." : null,
      });

      let appointment = null;
      let usedToken = false;
      if (token && typeof token === "string" && token.length >= 8) {
        appointment = await Appointment.findOne({
          confirmToken: token,
          status: "Scheduled",
        });
        if (appointment) {
          usedToken = true;
          log("Button matched appointment via confirmToken", {
            appointmentId: String(appointment._id),
            token: token.slice(0, 8),
          });
        }
      }
      if (!appointment) {
        appointment = await Appointment.findOne({
          patientId: patient._id,
          status: "Scheduled",
          date: { $gte: new Date() },
        }).sort({ date: 1, time: 1 });
        if (appointment) {
          log("Button matched appointment via patient fallback", {
            appointmentId: String(appointment._id),
          });
        }
      }

      if (appointment) {
        const alreadyResponded = appointment.patientResponse === patientResponse;
        appointment.patientResponse = patientResponse;
        appointment.patientResponseAt = new Date();
        if (patientResponse !== "reschedule_requested") {
          appointment.rescheduleReason = undefined;
        }
        await appointment.save();

        const formatDate = (d) => {
          try {
            return new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(d instanceof Date ? d : new Date(d));
          } catch (_) {
            return (d && d.toISOString && d.toISOString().slice(0, 10)) || String(d);
          }
        };

        const staff = await User.find({
          role: { $in: ["admin", "doctor", "employee"] },
        }).select("_id");
        const title =
          patientResponse === "confirmed"
            ? "Appointment confirmed by patient"
            : "Appointment reschedule requested";
        const dateLabel = formatDate(appointment.date);
        const notificationMessage = `${patient.name} has ${
          patientResponse === "confirmed" ? "confirmed" : "requested to reschedule"
        } the appointment on ${dateLabel} at ${appointment.time}${
          usedToken ? " (via WhatsApp quick reply)" : ""
        }.`;
        if (staff.length) {
          await Notification.insertMany(
            staff.map((member) => ({
              userId: member._id,
              type:
                patientResponse === "confirmed"
                  ? "APPOINTMENT_CONFIRMED"
                  : "APPOINTMENT_RESCHEDULE_REQUESTED",
              title,
              message: notificationMessage,
              appointmentId: appointment._id,
              priority: patientResponse === "confirmed" ? "medium" : "high",
              read: false,
            })),
          );
        }

        if (!alreadyResponded) {
          log("Button updated appointment patientResponse", {
            appointmentId: String(appointment._id),
            response: patientResponse,
            usedToken,
            staffNotified: staff.length,
          });
        } else {
          log("Button refreshed patientResponse (same value)", {
            appointmentId: String(appointment._id),
            response: patientResponse,
            usedToken,
          });
        }
      } else {
        log("Button response: no matching Scheduled appointment found", {
          patientId: String(patient._id),
          response: patientResponse,
          tokenProvided: Boolean(token),
        });
      }
    }
    return { ok: true, id: message.id, patientId: patient?._id };
  } catch (err) {
    logError("Inbound processing failed", err, { id: message.id });
    return { ok: false, id: message.id, error: err.message };
  }
};

router.post("/", async (req, res) => {
  const signature = req.get("x-hub-signature-256") || "";
  const appSecret = getAppSecret();
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

  const startTime = Date.now();
  let rawBodyParsed = false;

  if (appSecret && signature.startsWith("sha256=")) {
    const expectedDigest = crypto
      .createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");
    const receivedDigest = signature.slice("sha256=".length);
    if (
      receivedDigest.length !== expectedDigest.length ||
      !crypto.timingSafeEqual(Buffer.from(receivedDigest), Buffer.from(expectedDigest))
    ) {
      logError("HMAC signature mismatch", new Error("digest does not match"), {
        signaturePresent: true,
        bodyLength: rawBody.length,
      });
      return res.sendStatus(403);
    }
  } else if (!appSecret) {
    log("WARN: WHATSAPP_APP_SECRET not set, skipping HMAC signature validation", {
      raw: rawBody.length,
      signatureHeader: signature ? signature.slice(0, 16) + "..." : "missing",
    });
  } else {
    logError("Signature header missing or malformed", new Error(signature || "none"));
    return res.sendStatus(403);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
    rawBodyParsed = true;
  } catch (error) {
    logError("Invalid JSON payload", error, {
      bodyLength: rawBody.length,
      bodyPreview: rawBody.toString("utf8").slice(0, 200),
    });
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  setImmediate(async () => {
    try {
      log("POST payload", {
        object: payload.object,
        entries: Array.isArray(payload.entry) ? payload.entry.length : 0,
      });

      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          await safeProcessStatuses(value.statuses || [], value);
          if (value.messages && value.messages.length) {
            for (const message of value.messages) {
              await safeProcessInboundMessage(message, value);
            }
          }
        }
      }

      log("POST processing complete", { elapsedMs: Date.now() - startTime });
    } catch (topErr) {
      logError("POST top-level processing error", topErr, {
        elapsedMs: Date.now() - startTime,
      });
    }
  });

  return res.status(200).json({ status: "accepted" });
});

module.exports = router;

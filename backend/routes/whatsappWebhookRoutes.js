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

const normalizePhone = (phone) => String(phone || "").replace(/\D/g, "").slice(-10);

const getButtonReply = (message) => {
  const value =
    message.button?.payload ||
    message.button?.text ||
    message.interactive?.button_reply?.id ||
    message.interactive?.button_reply?.title ||
    "";
  const normalized = String(value).trim().toLowerCase();
  if (normalized.includes("confirm")) return "confirmed";
  if (normalized.includes("reschedul")) return "reschedule_requested";
  return null;
};

router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  const configuredToken = getVerifyToken();

  if (
    mode === "subscribe" &&
    token &&
    challenge &&
    configuredToken &&
    token.length === configuredToken.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(configuredToken))
  ) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post("/", async (req, res) => {
  const signature = req.get("x-hub-signature-256") || "";
  const appSecret = getAppSecret();
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");

  if (!appSecret || !signature.startsWith("sha256=")) {
    return res.sendStatus(403);
  }

  const expectedDigest = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");
  const receivedDigest = signature.slice("sha256=".length);

  if (
    receivedDigest.length !== expectedDigest.length ||
    !crypto.timingSafeEqual(
      Buffer.from(receivedDigest),
      Buffer.from(expectedDigest),
    )
  ) {
    return res.sendStatus(403);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8"));
  } catch (error) {
    return res.status(400).json({ error: "Invalid JSON payload" });
  }

  console.log("[WHATSAPP] Webhook received:", {
    object: payload.object,
    entries: Array.isArray(payload.entry) ? payload.entry.length : 0,
  });

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const status of value.statuses || []) {
        const statusName = ["sent", "delivered", "read", "failed"].includes(
          status.status,
        )
          ? status.status
          : "failed";
        const statusError = status.errors?.[0]
          ? [
              status.errors[0].message,
              status.errors[0].code && `code ${status.errors[0].code}`,
              status.errors[0].type,
            ]
              .filter(Boolean)
              .join(" | ")
          : undefined;
        console.log("[WHATSAPP] Message status:", {
          id: status.id,
          recipientId: status.recipient_id,
          status: status.status,
          timestamp: status.timestamp,
          errors: status.errors || [],
        });
        await WhatsAppMessage.findOneAndUpdate(
          { messageId: status.id },
          { status: statusName, error: statusError },
        );
      }
      for (const message of value.messages || []) {
        const phone = message.from || "";
        const normalizedPhone = normalizePhone(phone);
        const patient = await Patient.findOne({
          $or: [
            { phone },
            { phone: normalizedPhone },
            ...(normalizedPhone
              ? [{ phone: { $regex: `${normalizedPhone}$` } }]
              : []),
          ],
        });
        const recipientUser = !patient
          ? await User.findOne({
              $or: [
                { phone },
                { phone: normalizedPhone },
                ...(normalizedPhone
                  ? [{ phone: { $regex: `${normalizedPhone}$` } }]
                  : []),
              ],
            })
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
          read: false,
          messageId: message.id,
        });

        const patientResponse = getButtonReply(message);
        if (patient && patientResponse) {
          const appointment = await Appointment.findOne({
            patientId: patient._id,
            status: "Scheduled",
            date: { $gte: new Date() },
          }).sort({ date: 1, time: 1 });

          if (appointment) {
            appointment.patientResponse = patientResponse;
            appointment.patientResponseAt = new Date();
            await appointment.save();

            const staff = await User.find({
              role: { $in: ["admin", "doctor", "employee"] },
            }).select("_id");
            const title =
              patientResponse === "confirmed"
                ? "Appointment confirmed by patient"
                : "Appointment reschedule requested";
            const notificationMessage = `${patient.name} has ${
              patientResponse === "confirmed"
                ? "confirmed"
                : "requested to reschedule"
            } the appointment on ${appointment.date.toISOString().slice(0, 10)} at ${appointment.time}.`;
            if (staff.length) {
              await Notification.insertMany(
                staff.map((member) => ({
                  userId: member._id,
                  type: patientResponse === "confirmed"
                    ? "APPOINTMENT_CONFIRMED"
                    : "APPOINTMENT_RESCHEDULE_REQUESTED",
                  title,
                  message: notificationMessage,
                  priority: patientResponse === "confirmed" ? "medium" : "high",
                })),
              );
            }
          }
        }
      }
    }
  }

  return res.sendStatus(200);
});

module.exports = router;

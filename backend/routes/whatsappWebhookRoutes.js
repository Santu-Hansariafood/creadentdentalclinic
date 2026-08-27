const crypto = require("crypto");
const express = require("express");

const router = express.Router();

const getVerifyToken = () => process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
const getAppSecret = () => process.env.WHATSAPP_APP_SECRET;

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

router.post("/", (req, res) => {
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

  return res.sendStatus(200);
});

module.exports = router;
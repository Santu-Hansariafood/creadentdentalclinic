const express = require("express");
const router = express.Router();
const {
  handleICICICallback,
  getTransactionStatus,
} = require("../utils/iciciPaymentService");

// Generic body parser for ICICI callbacks (handles both URL-encoded and JSON)
const parseICICIBody = [express.json(), express.urlencoded({ extended: true })];

// Unified callback processing handler
const processCallback = async (req, res, isRedirect = false) => {
  const callbackData = { ...(req.query || {}), ...(req.body || {}) };
  console.log(
    `[ICICI] Payload received (${isRedirect ? "Redirect" : "Webhook"}):`,
    JSON.stringify(callbackData),
  );

  const result = await handleICICICallback(callbackData);

  if (isRedirect) {
    const redirectBase = process.env.FRONTEND_URL || "http://localhost:3000";
    const status = result.transaction?.txnStatus || "ERR";
    const invoiceId = result.transaction?.invoiceId || "";
    const transactionId = result.transaction?.id || "";
    const hashValid = result.hashValid ? "1" : "0";

    const redirectUrl = `${redirectBase}/billing?paymentStatus=${status}&invoiceId=${invoiceId}&transactionId=${transactionId}&hashValid=${hashValid}`;
    return res.redirect(redirectUrl);
  }

  // Server-to-server Webhook / Callback response
  if (!result.success) {
    // Return 200 to acknowledge receipt and stop gateway retries, but mark success: false
    return res.status(200).json({
      success: false,
      error: result.error || "Callback processing unverified",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Callback processed successfully",
    ...result,
  });
};

// Webhook & Server-to-Server Callback
router.post("/callback", parseICICIBody, (req, res) =>
  processCallback(req, res, false),
);
router.post("/webhook", parseICICIBody, (req, res) =>
  processCallback(req, res, false),
);

// Browser Redirect Handlers (Accepts both GET and POST from Gateway)
router.all("/response", parseICICIBody, (req, res) =>
  processCallback(req, res, true),
);

// Status Query Endpoint
router.post("/status-check", express.json(), async (req, res) => {
  try {
    const { transactionId, merchantTxnNo } = req.body || {};
    if (!transactionId && !merchantTxnNo) {
      return res.status(400).json({
        success: false,
        error: "Either transactionId or merchantTxnNo is required",
      });
    }

    const result = await getTransactionStatus({ transactionId, merchantTxnNo });
    return res.status(200).json(result);
  } catch (err) {
    console.error("[ICICI] Status check error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ICICI Payment Gateway Integration",
    env: process.env.ICICI_ENV || "UAT",
    merchantId: process.env.ICICI_MERCHANT_ID
      ? `${process.env.ICICI_MERCHANT_ID.slice(0, 3)}***`
      : "not configured",
  });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  handleICICICallback,
  getTransactionStatus,
} = require("../utils/iciciPaymentService");

router.post("/callback", express.json(), async (req, res) => {
  try {
    const callbackData = { ...(req.body || {}), ...(req.query || {}) };
    console.log("[ICICI] Callback received:", JSON.stringify(callbackData));

    const result = await handleICICICallback(callbackData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Callback handling failed",
      });
    }

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error("[ICICI] Callback error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
});

router.post("/webhook", express.json(), async (req, res) => {
  try {
    const callbackData = req.body || {};
    console.log("[ICICI] Webhook received:", JSON.stringify(callbackData));

    const result = await handleICICICallback(callbackData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || "Webhook handling failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed",
      ...result,
    });
  } catch (err) {
    console.error("[ICICI] Webhook error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
});

router.post("/response", express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const callbackData = { ...(req.body || {}), ...(req.query || {}) };
    console.log("[ICICI] Response (form-encoded) received:", JSON.stringify(callbackData));

    const result = await handleICICICallback(callbackData);

    const redirectBase = process.env.FRONTEND_URL || "http://localhost:3000";
    const status = result.transaction?.txnStatus || "ERR";
    const invoiceId = result.transaction?.invoiceId || "";
    const transactionId = result.transaction?.id || "";

    const redirectUrl = `${redirectBase}/billing?paymentStatus=${status}&invoiceId=${invoiceId}&transactionId=${transactionId}&hashValid=${result.hashValid ? "1" : "0"}`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("[ICICI] Response handler error:", err);
    const redirectBase = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${redirectBase}/billing?paymentStatus=ERR&error=${encodeURIComponent(err?.message || "Payment failed")}`);
  }
});

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

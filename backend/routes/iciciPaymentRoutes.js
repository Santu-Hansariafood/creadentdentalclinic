const express = require("express");
const router = express.Router();
const {
  handleICICICallback,
  getTransactionStatus,
  cleanupStaleTransactions,
} = require("../utils/iciciPaymentService");

const parseICICIBody = [express.json(), express.urlencoded({ extended: true })];

const buildPaymentResultUrl = (baseUrl, params) => {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}${new URLSearchParams(params).toString()}`;
};

const processCallback = async (req, res, isRedirect = false) => {
  const callbackData = { ...(req.query || {}), ...(req.body || {}) };
  console.log(
    `[ICICI] Payload received (${isRedirect ? "Redirect" : "Webhook"}):`,
    JSON.stringify(callbackData),
  );

  const result = await handleICICICallback(callbackData);

  if (isRedirect) {
    const redirectBase =
      process.env.ICICI_SUCCESS_REDIRECT_URL ||
      `${process.env.FRONTEND_URL || "http://localhost:3000"}/billing`;
    const status = result.transaction?.txnStatus || "ERR";
    const invoiceId = result.transaction?.invoiceId || "";
    const transactionId = result.transaction?.id || "";
    const hashValid = result.hashValid ? "1" : "0";
    const callbackProcessed = result.transaction?.callbackProcessed ? "1" : "0";

    const paymentConfirmed =
      status === "SUC" && callbackProcessed === "1" && hashValid === "1"
        ? "1"
        : "0";
    const redirectUrl = buildPaymentResultUrl(redirectBase, {
      paymentStatus: status,
      invoiceId,
      transactionId,
      hashValid,
      callbackProcessed,
      paymentConfirmed,
    });
    console.log("[ICICI] Redirecting browser to:", redirectUrl);
    return res.redirect(redirectUrl);
  }

  if (!result.success) {
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

router.post("/callback", parseICICIBody, (req, res) =>
  processCallback(req, res, false),
);
router.post("/webhook", parseICICIBody, (req, res) =>
  processCallback(req, res, false),
);

router.all("/response", parseICICIBody, (req, res) =>
  processCallback(req, res, true),
);

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

router.get("/diagnostic", (req, res) => {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    backend: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      frontendUrl: process.env.FRONTEND_URL,
    },
    icici: {
      env: process.env.ICICI_ENV || "not set",
      merchantIdConfigured: !!process.env.ICICI_MERCHANT_ID,
      secretKeyConfigured: !!process.env.ICICI_SECRET_KEY,
      callbackUrlConfigured: !!process.env.ICICI_CALLBACK_URL,
      redirectUrlConfigured: !!process.env.ICICI_REDIRECT_URL,
      currencyCode: process.env.ICICI_CURRENCY_CODE || "356",
      payType: process.env.ICICI_PAY_TYPE || "0",
    },
    urls: {
      callbackUrl: process.env.ICICI_CALLBACK_URL,
      redirectUrl: process.env.ICICI_REDIRECT_URL,
      initiateSaleUrl:
        process.env.ICICI_ENV === "production"
          ? "https://pgpay.icicibank.com/pg/api/v2/initiateSale"
          : "https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale",
    },
    issues: [
      !process.env.ICICI_MERCHANT_ID && "⚠️  ICICI_MERCHANT_ID not set",
      !process.env.ICICI_SECRET_KEY && "⚠️  ICICI_SECRET_KEY not set",
      !process.env.ICICI_CALLBACK_URL && "⚠️  ICICI_CALLBACK_URL not set",
      !process.env.ICICI_REDIRECT_URL && "⚠️  ICICI_REDIRECT_URL not set",
      process.env.ICICI_ENV === "production" &&
        process.env.ICICI_MERCHANT_ID?.includes("7164") &&
        "⚠️  Using test merchant ID in production mode",
    ].filter(Boolean),
  };

  res.status(200).json(diagnostics);
});

router.post("/cleanup-stale", express.json(), async (req, res) => {
  try {
    const { hours = 24 } = req.body || {};
    const result = await cleanupStaleTransactions(Number(hours) || 24);
    return res.status(200).json({
      success: true,
      message: `Stale cleanup completed: removed ${result.cleaned} transaction(s)`,
      ...result,
    });
  } catch (err) {
    console.error("[ICICI] Stale cleanup error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error",
    });
  }
});

module.exports = router;

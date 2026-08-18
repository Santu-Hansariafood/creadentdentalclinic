const crypto = require("crypto");
const path = require("path");
const axios = require("axios");
const dotenv = require("dotenv");
const Transaction = require("../models/Transaction");
const Invoice = require("../models/Invoice");
const Patient = require("../models/Patient");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const isProduction = process.env.ICICI_ENV === "production";
const ICICI_BASE_URL = process.env.ICICI_BASE_URL || (
  isProduction
    ? "https://pgpay.icicibank.com"
    : "https://pgpayuat.icici.bank.in"
);

const resolveICICIUrl = (envValue, fallbackPath) => {
  const fallback = `${ICICI_BASE_URL}${fallbackPath}`;
  if (!envValue) return fallback;
  if (envValue.includes("pgpayuat") && !isProduction) return envValue;
  if (envValue.includes("pgpay.icici") && isProduction) return envValue;
  return envValue;
};

const ICICI_CONFIG = {
  isUAT: !isProduction,
  merchantId: process.env.ICICI_MERCHANT_ID || "",
  aggregatorId: process.env.ICICI_AGGREGATOR_ID || "",
  secretKey: process.env.ICICI_SECRET_KEY || "",
  currencyCode: process.env.ICICI_CURRENCY_CODE || "356",
  payType: process.env.ICICI_PAY_TYPE || "0",
  baseUrl: ICICI_BASE_URL,
  initiateSaleUrl: resolveICICIUrl(process.env.ICICI_INITIATE_SALE_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale", "/tsp/pg/api/v2/initiateSale"),
  generateOtpUrl: resolveICICIUrl(process.env.ICICI_GENERATE_OTP_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/v2/generateOTP", "/tsp/pg/api/v2/generateOTP"),
  verifyOtpUrl: resolveICICIUrl(process.env.ICICI_VERIFY_OTP_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/v2/verifyOTP", "/tsp/pg/api/v2/verifyOTP"),
  authorizeUrl: resolveICICIUrl(process.env.ICICI_AUTHORIZE_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/v2/authorize", "/tsp/pg/api/v2/authorize"),
  statusCheckUrl: resolveICICIUrl(process.env.ICICI_STATUS_CHECK_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/command", "/tsp/pg/api/command"),
  transactionStatusUrl: resolveICICIUrl(process.env.ICICI_TRANSACTION_STATUS_URL || process.env.ICICI_STATUS_CHECK_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/command", "/tsp/pg/api/command"),
  refundUrl: resolveICICIUrl(process.env.ICICI_REFUND_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/command", "/tsp/pg/api/command"),
  settlementStatusUrl: resolveICICIUrl(process.env.ICICI_SETTLEMENT_STATUS_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/command", "/tsp/pg/api/command"),
  settlementSummaryUrl: resolveICICIUrl(process.env.ICICI_SETTLEMENT_SUMMARY_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/command", "/tsp/pg/api/command"),
  settlementDetailsUrl: resolveICICIUrl(process.env.ICICI_SETTLEMENT_DETAILS_URL || "https://pgpayuat.icici.bank.in/tsp/pg/api/command", "/tsp/pg/api/command"),
  returnUrl: process.env.ICICI_RETURN_URL || process.env.ICICI_REDIRECT_URL || "",
  redirectUrl: process.env.ICICI_REDIRECT_URL || process.env.ICICI_RETURN_URL || "",
  callbackUrl: process.env.ICICI_CALLBACK_URL || "",
};

const formatTxnDate = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    date.getFullYear().toString() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
};

const generateMerchantTxnNo = (invoiceId) => {
  const timestamp = Date.now().toString();
  const random = Math.floor(1000 + Math.random() * 9000).toString();
  const invoiceSuffix = invoiceId.toString().slice(-6);
  return `CD${invoiceSuffix}${timestamp}${random}`;
};

const calculateSecureHashV1 = (params, secretKey) => {
  const sortedKeys = Object.keys(params)
    .filter((key) => {
      const value = params[key];
      return (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        key !== "secureHash" &&
        key !== "securehash"
      );
    })
    .sort();

  const concatenated = sortedKeys
    .map((key) => String(params[key]))
    .join("");

  return crypto
    .createHmac("sha256", secretKey)
    .update(concatenated)
    .digest("hex")
    .toLowerCase();
};

const calculateSecureHashV2 = (jsonString, secretKey) => {
  const minified = typeof jsonString === "string"
    ? jsonString.replace(/\s+/g, "")
    : JSON.stringify(jsonString);

  return crypto
    .createHmac("sha256", secretKey)
    .update(minified)
    .digest("hex")
    .toLowerCase();
};

const verifySecureHash = (params, secretKey, receivedHash) => {
  if (!receivedHash) return false;
  const calculated = calculateSecureHashV1(params, secretKey);
  const calculatedJson =
    typeof params === "string"
      ? calculateSecureHashV2(params, secretKey)
      : null;
  return (
    calculated.toLowerCase() === receivedHash.toLowerCase() ||
    (calculatedJson && calculatedJson.toLowerCase() === receivedHash.toLowerCase())
  );
};

const generateICICISalePayload = async ({
  invoiceId,
  patientId,
  amount,
  customerEmailID,
  customerMobileNo,
  customerName = "",
  payType = ICICI_CONFIG.payType,
}) => {
  const merchantTxnNo = generateMerchantTxnNo(invoiceId);
  const txnDate = formatTxnDate();
  
  const addlParam1 = "000";
  const addlParam2 = "000";

  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    aggregatorID: ICICI_CONFIG.aggregatorId,
    merchantTxnNo,
    amount: Number(amount).toFixed(2),
    currencyCode: ICICI_CONFIG.currencyCode,
    transactionType: "SALE",
    txnDate,
    customerEmailID: customerEmailID || "",
    customerMobileNo: customerMobileNo || "",
    customerName: customerName || "",
    payType,
    addlParam1,
    addlParam2,
    returnURL: ICICI_CONFIG.returnUrl || ICICI_CONFIG.redirectUrl || "",
  };

  const hashFieldOrder = [
    "addlParam1",
    "addlParam2",
    "aggregatorID",
    "amount",
    "currencyCode",
    "customerEmailID",
    "customerMobileNo",
    "customerName",
    "merchantId",
    "merchantTxnNo",
    "payType",
    "returnURL",
    "transactionType",
    "txnDate",
  ];

  const hashStringNoDelimiter = hashFieldOrder
    .map((field) => String(payload[field] || ""))
    .join("");

  const hashNoDelim = crypto
    .createHmac("sha256", ICICI_CONFIG.secretKey)
    .update(hashStringNoDelimiter)
    .digest("hex")
    .toLowerCase();

  payload.secureHash = hashNoDelim;

  return payload;
};

const buildICICIRedirectUrl = (redirectURI, tranCtx) => {
  if (!redirectURI) return "";
  if (!tranCtx) return redirectURI;
  if (redirectURI.includes("tranCtx=")) return redirectURI;

  const separator = redirectURI.includes("?") ? "&" : "?";
  return `${redirectURI}${separator}tranCtx=${encodeURIComponent(tranCtx)}`;
};

const callICICIAPI = async (url, payload, headers = {}) => {
  try {
    const securehash = payload.secureHash;

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        securehash: securehash,
        ...headers,
      },
      timeout: 60000,
    });

    return {
      success: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    const errorData = error.response?.data || error.message;
    return {
      success: false,
      error: errorData,
      status: error.response?.status || 500,
    };
  }
};

const initiateSale = async ({
  invoiceId,
  patientId,
  amount,
  customerEmailID,
  customerMobileNo,
  payType,
}) => {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new Error("Patient not found");
  }

  const email = customerEmailID || patient.email || "";
  const mobile = customerMobileNo || patient.phone || "";

  const payload = await generateICICISalePayload({
    invoiceId,
    patientId,
    amount,
    customerEmailID: email,
    customerMobileNo: mobile,
    payType,
  });

  const transaction = await Transaction.create({
    invoiceId,
    patientId,
    merchantTxnNo: payload.merchantTxnNo,
    amount: Number(amount),
    currencyCode: payload.currencyCode,
    transactionType: payload.transactionType,
    txnDate: payload.txnDate,
    customerEmailID: email,
    customerMobileNo: mobile,
    payType: payload.payType,
    txnStatus: "INITIATED",
    secureHash: payload.secureHash,
    rawResponse: null,
  });

  const result = await callICICIAPI(ICICI_CONFIG.initiateSaleUrl, payload);

  if (result.success && result.data) {
    const responseData = result.data;
    const redirectURI = responseData.redirectURI || "";
    const tranCtx = responseData.tranCtx || "";
    const normalizedRedirectURI = buildICICIRedirectUrl(redirectURI, tranCtx);

    transaction.txnStatus = responseData.txnStatus || "REQ";
    transaction.txnResponseCode = responseData.responseCode || "";
    transaction.txnResponseMsg = responseData.respDescription || "";
    transaction.pgTxnNo = responseData.pgTxnNo || "";
    transaction.redirectURI = normalizedRedirectURI;
    transaction.tranCtx = tranCtx;
    transaction.showOTPCapturePage = responseData.showOTPCapturePage || "N";
    transaction.rawResponse = responseData;
    await transaction.save();

    if (!normalizedRedirectURI) {
      return {
        transactionId: transaction._id.toString(),
        merchantTxnNo: transaction.merchantTxnNo,
        apiSuccess: false,
        apiError: `ICICI API did not return redirectURI. Code: ${responseData.responseCode}, Message: ${responseData.respDescription}`,
      };
    }

    return {
      transactionId: transaction._id.toString(),
      merchantTxnNo: transaction.merchantTxnNo,
      redirectURI: normalizedRedirectURI,
      tranCtx,
      pgTxnNo: responseData.pgTxnNo,
      txnStatus: responseData.txnStatus || "REQ",
      showOTPCapturePage: responseData.showOTPCapturePage || "N",
      apiSuccess: true,
      apiError: null,
    };
  } else {
    let errorMessage = result.error;
    if (typeof result.error === "object") {
      errorMessage = JSON.stringify(result.error);
    }

    if (result.status === 401 || result.status === 403) {
      errorMessage = `❌ Authentication Failed (${result.status}): Invalid Merchant ID or Secret Key. Verify ICICI_MERCHANT_ID and ICICI_SECRET_KEY in .env`;
    } else if (result.status === 400) {
      errorMessage = `❌ Invalid Request Payload (${result.status}): ${errorMessage}`;
    } else if (result.status === 500) {
      errorMessage = `❌ ICICI Server Error (${result.status}): The payment gateway encountered an error. Please try again.`;
    } else if (result.error?.includes?.("ETIMEDOUT") || result.error?.includes?.("ECONNREFUSED")) {
      errorMessage = "❌ Network Error: Cannot reach ICICI API. Check internet connection and firewall.";
    }

    transaction.rawResponse = { error: errorMessage, status: result.status };
    await transaction.save();

    return {
      transactionId: transaction._id.toString(),
      merchantTxnNo: transaction.merchantTxnNo,
      apiSuccess: false,
      apiError: errorMessage,
    };
  }
};

const generateOTP = async ({ transactionId, tranCtx }) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    merchantTxnNo: transaction.merchantTxnNo,
    tranCtx: tranCtx || transaction.tranCtx || "",
    pgTxnNo: transaction.pgTxnNo || "",
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  const result = await callICICIAPI(ICICI_CONFIG.generateOtpUrl, payload);

  if (result.success && result.data) {
    transaction.otpGenerated = true;
    transaction.rawResponse = { ...transaction.rawResponse, generateOtp: result.data };
    await transaction.save();
  }

  return {
    success: result.success,
    data: result.data || null,
    error: result.error || null,
  };
};

const verifyOTP = async ({ transactionId, tranCtx, otpValue }) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    merchantTxnNo: transaction.merchantTxnNo,
    tranCtx: tranCtx || transaction.tranCtx || "",
    pgTxnNo: transaction.pgTxnNo || "",
    otpValue,
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  const result = await callICICIAPI(ICICI_CONFIG.verifyOtpUrl, payload);

  if (result.success && result.data) {
    transaction.otpVerified =
      result.data.txnStatus === "SUC" || result.data.otpVerified === true;
    transaction.rawResponse = { ...transaction.rawResponse, verifyOtp: result.data };
    await transaction.save();
  }

  return {
    success: result.success,
    data: result.data || null,
    error: result.error || null,
  };
};

const authorizeTransaction = async ({ transactionId, tranCtx }) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    merchantTxnNo: transaction.merchantTxnNo,
    tranCtx: tranCtx || transaction.tranCtx || "",
    pgTxnNo: transaction.pgTxnNo || "",
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  const result = await callICICIAPI(ICICI_CONFIG.authorizeUrl, payload);

  if (result.success && result.data) {
    transaction.authorized =
      result.data.txnStatus === "SUC" || result.data.authorized === true;
    transaction.txnStatus = result.data.txnStatus || transaction.txnStatus;
    transaction.txnResponseCode =
      result.data.txnResponseCode || transaction.txnResponseCode;
    transaction.txnResponseMsg =
      result.data.txnResponseMsg || transaction.txnResponseMsg;
    transaction.arnNo = result.data.arnNo || transaction.arnNo;
    transaction.rawResponse = {
      ...transaction.rawResponse,
      authorize: result.data,
    };
    await transaction.save();

    if (transaction.txnStatus === "SUC") {
      await reconcilePaymentToInvoice(transaction);
    }
  }

  return {
    success: result.success,
    data: result.data || null,
    error: result.error || null,
  };
};

const getTransactionStatus = async ({ transactionId, merchantTxnNo }) => {
  let transaction;
  if (transactionId) {
    transaction = await Transaction.findById(transactionId);
  } else if (merchantTxnNo) {
    transaction = await Transaction.findOne({ merchantTxnNo });
  }

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    merchantTxnNo: transaction.merchantTxnNo,
    pgTxnNo: transaction.pgTxnNo || "",
    transactionType: "STATUS",
    txnDate: formatTxnDate(),
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  const result = await callICICIAPI(ICICI_CONFIG.transactionStatusUrl, payload);

  if (result.success && result.data) {
    const prevStatus = transaction.txnStatus;
    transaction.txnStatus = result.data.txnStatus || transaction.txnStatus;
    transaction.txnResponseCode =
      result.data.txnResponseCode || transaction.txnResponseCode;
    transaction.txnResponseMsg =
      result.data.txnResponseMsg || transaction.txnResponseMsg;
    transaction.pgTxnNo = result.data.pgTxnNo || transaction.pgTxnNo;
    transaction.authRefNo = result.data.authRefNo || transaction.authRefNo;
    transaction.arnNo = result.data.arnNo || transaction.arnNo;
    transaction.rawResponse = {
      ...transaction.rawResponse,
      statusCheck: result.data,
    };
    await transaction.save();

    if (
      transaction.txnStatus === "SUC" &&
      prevStatus !== "SUC" &&
      !transaction.amountPaidApplied
    ) {
      await reconcilePaymentToInvoice(transaction);
    }
  }

  return {
    success: result.success,
    data: result.data || null,
    error: result.error || null,
    transaction: {
      id: transaction._id.toString(),
      merchantTxnNo: transaction.merchantTxnNo,
      txnStatus: transaction.txnStatus,
      amount: transaction.amount,
      invoiceId: transaction.invoiceId.toString(),
    },
  };
};

const reconcilePaymentToInvoice = async (transaction) => {
  const invoice = await Invoice.findById(transaction.invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found for reconciliation");
  }

  const paymentAmount = Number(transaction.amount);
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
    return;
  }

  const actualPayment = Math.min(paymentAmount, invoice.balance);
  if (actualPayment <= 0) {
    return;
  }

  invoice.amountPaid = (invoice.amountPaid || 0) + actualPayment;
  invoice.balance = Math.max(0, invoice.total - invoice.amountPaid);
  invoice.status =
    invoice.balance === 0
      ? "Paid"
      : invoice.amountPaid > 0
        ? "Partial"
        : "Unpaid";
  invoice.paymentMethod = "ICICI Bank";
  invoice.paymentDate = new Date();

  await invoice.save();
  transaction.amountPaidApplied = actualPayment;
  await transaction.save();

  return invoice;
};

const handleICICICallback = async (callbackData) => {
  const merchantTxnNo =
    callbackData.merchantTxnNo ||
    callbackData.merchant_txn_no ||
    callbackData.merchantTxnRefNo;

  if (!merchantTxnNo) {
    return { success: false, error: "merchantTxnNo not found in callback" };
  }

  const transaction = await Transaction.findOne({ merchantTxnNo });
  if (!transaction) {
    return { success: false, error: "Transaction not found" };
  }

  const receivedHash = callbackData.secureHash || callbackData.securehash;
  let hashValid = false;

  if (receivedHash) {
    hashValid = verifySecureHash(callbackData, ICICI_CONFIG.secretKey, receivedHash);
    if (!hashValid) {
      console.warn("[ICICI] Hash verification failed for txn:", merchantTxnNo);
    }
  } else {
    // proceed without hash verification if not provided
    hashValid = true;
  }

  const txnStatus =
    callbackData.txnStatus ||
    callbackData.txn_status ||
    callbackData.status ||
    transaction.txnStatus;

  const prevStatus = transaction.txnStatus;
  transaction.txnStatus = txnStatus;
  transaction.txnResponseCode =
    callbackData.txnResponseCode ||
    callbackData.response_code ||
    transaction.txnResponseCode;
  transaction.txnResponseMsg =
    callbackData.txnResponseMsg ||
    callbackData.response_message ||
    callbackData.message ||
    transaction.txnResponseMsg;
  transaction.pgTxnNo =
    callbackData.pgTxnNo ||
    callbackData.pg_txn_no ||
    callbackData.bankTxnNo ||
    transaction.pgTxnNo;
  transaction.authRefNo =
    callbackData.authRefNo || callbackData.auth_ref_no || transaction.authRefNo;
  transaction.arnNo =
    callbackData.arnNo || callbackData.arn_no || transaction.arnNo;
  transaction.rawCallback = callbackData;
  transaction.hashVerified = hashValid;
  transaction.callbackProcessed = true;
  transaction.callbackProcessedAt = new Date();

  await transaction.save();

  // ✅ CRITICAL: Only update invoice when ICICI confirms SUC via callback
  let invoice = null;
  if (transaction.txnStatus === "SUC" && prevStatus !== "SUC") {
    if (!transaction.amountPaidApplied) {
      invoice = await reconcilePaymentToInvoice(transaction);
      console.log("[ICICI] ✅ Payment SUCCESS confirmed via callback. Invoice reconciled for merchantTxnNo:", merchantTxnNo);
    } else {
      console.log("[ICICI] SUC status received but amount already applied for merchantTxnNo:", merchantTxnNo);
      invoice = await Invoice.findById(transaction.invoiceId);
    }
  } else if (transaction.txnStatus !== "SUC") {
    console.log("[ICICI] Callback received with status:", transaction.txnStatus, "(not successful) for merchantTxnNo:", merchantTxnNo);
  }

  return {
    success: true,
    hashValid,
    transaction: {
      id: transaction._id.toString(),
      merchantTxnNo: transaction.merchantTxnNo,
      txnStatus: transaction.txnStatus,
      amount: transaction.amount,
      invoiceId: transaction.invoiceId.toString(),
      callbackProcessed: transaction.callbackProcessed,
    },
    invoice: invoice
      ? {
          id: invoice._id.toString(),
          status: invoice.status,
          balance: invoice.balance,
          amountPaid: invoice.amountPaid,
        }
      : null,
  };
};

const processRefund = async ({ transactionId, refundAmount, reason }) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) {
    throw new Error("Transaction not found");
  }

  if (transaction.txnStatus !== "SUC") {
    throw new Error("Refund can only be processed for successful transactions");
  }

  const originalAmount = Number(transaction.amount);
  const totalRefunded = Number(transaction.refundedAmount || 0);
  const refund = Number(refundAmount);

  if (refund <= 0) {
    throw new Error("Refund amount must be greater than 0");
  }

  if (refund + totalRefunded > originalAmount) {
    throw new Error(
      `Refund amount exceeds original transaction. Max refundable: ${(
        originalAmount - totalRefunded
      ).toFixed(2)}`,
    );
  }

  const refundTxnNo = `RF${transaction.merchantTxnNo.slice(-16)}${Date.now().toString().slice(-6)}`;

  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    merchantTxnNo: transaction.merchantTxnNo,
    refundTxnNo,
    pgTxnNo: transaction.pgTxnNo || "",
    amount: refund.toFixed(2),
    currencyCode: ICICI_CONFIG.currencyCode,
    transactionType: "REFUND",
    txnDate: formatTxnDate(),
    remark1: reason || "",
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  const result = await callICICIAPI(ICICI_CONFIG.refundUrl, payload);

  if (result.success && result.data) {
    transaction.refundedAmount = totalRefunded + refund;
    transaction.refundTxnNo = refundTxnNo;
    transaction.refundStatus = result.data.txnStatus || "PENDING";
    transaction.rawResponse = {
      ...transaction.rawResponse,
      refund: result.data,
    };
    await transaction.save();
  }

  return {
    success: result.success,
    refundTxnNo,
    refundAmount: refund,
    data: result.data || null,
    error: result.error || null,
  };
};

const getSettlementStatus = async (params = {}) => {
  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    transactionType: "SETTLEMENTSTATUS",
    txnDate: formatTxnDate(),
    ...params,
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  return callICICIAPI(ICICI_CONFIG.settlementStatusUrl, payload);
};

const getSettlementSummary = async (params = {}) => {
  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    transactionType: "SETTLEMENTSUMMARY",
    txnDate: formatTxnDate(),
    ...params,
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  return callICICIAPI(ICICI_CONFIG.settlementSummaryUrl, payload);
};

const getSettlementDetails = async (params = {}) => {
  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    transactionType: "SETTLEMENTDETAILS",
    txnDate: formatTxnDate(),
    ...params,
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  return callICICIAPI(ICICI_CONFIG.settlementDetailsUrl, payload);
};

module.exports = {
  ICICI_CONFIG,
  formatTxnDate,
  generateMerchantTxnNo,
  calculateSecureHashV1,
  calculateSecureHashV2,
  verifySecureHash,
  generateICICISalePayload,
  callICICIAPI,
  initiateSale,
  generateOTP,
  verifyOTP,
  authorizeTransaction,
  getTransactionStatus,
  reconcilePaymentToInvoice,
  handleICICICallback,
  processRefund,
  getSettlementStatus,
  getSettlementSummary,
  getSettlementDetails,
};

const crypto = require("crypto");
const axios = require("axios");
const Transaction = require("../models/Transaction");
const Invoice = require("../models/Invoice");
const Patient = require("../models/Patient");

const ICICI_CONFIG = {
  isUAT: process.env.ICICI_ENV !== "production",
  merchantId: process.env.ICICI_MERCHANT_ID || "",
  secretKey: process.env.ICICI_SECRET_KEY || "",
  currencyCode: process.env.ICICI_CURRENCY_CODE || "356",
  payType: process.env.ICICI_PAY_TYPE || "0",
  uatBaseUrl: "https://pqpayuat.icicibank.com/tsp/pq/api/v2",
  prodBaseUrl: "https://pgpay.icicibank.com/pg/api/v2",
  get baseUrl() {
    return this.isUAT ? this.uatBaseUrl : this.prodBaseUrl;
  },
  get initiateSaleUrl() {
    return `${this.baseUrl}/initiateSale`;
  },
  get generateOtpUrl() {
    return `${this.baseUrl}/generateOTP`;
  },
  get verifyOtpUrl() {
    return `${this.baseUrl}/verifyOTP`;
  },
  get authorizeUrl() {
    return `${this.baseUrl}/authorize`;
  },
  get transactionStatusUrl() {
    return `${this.baseUrl}/transactionStatus`;
  },
  get refundUrl() {
    return `${this.baseUrl}/refund`;
  },
  get settlementStatusUrl() {
    return `${this.baseUrl}/settlementStatus`;
  },
  get settlementSummaryUrl() {
    return `${this.baseUrl}/settlementSummary`;
  },
  get settlementDetailsUrl() {
    return `${this.baseUrl}/settlementDetails`;
  },
  callbackUrl: process.env.ICICI_CALLBACK_URL || "",
  redirectUrl: process.env.ICICI_REDIRECT_URL || "",
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
  payType = ICICI_CONFIG.payType,
}) => {
  const merchantTxnNo = generateMerchantTxnNo(invoiceId);
  const txnDate = formatTxnDate();

  const payload = {
    merchantId: ICICI_CONFIG.merchantId,
    merchantTxnNo,
    amount: Number(amount).toFixed(2),
    currencyCode: ICICI_CONFIG.currencyCode,
    transactionType: "SALE",
    txnDate,
    customerEmailID: customerEmailID || "",
    customerMobileNo: customerMobileNo || "",
    payType,
    ...(ICICI_CONFIG.redirectUrl
      ? { redirectUrl: ICICI_CONFIG.redirectUrl }
      : {}),
    ...(ICICI_CONFIG.callbackUrl
      ? { callbackUrl: ICICI_CONFIG.callbackUrl }
      : {}),
    remark1: invoiceId.toString(),
    remark2: patientId.toString(),
  };

  payload.secureHash = calculateSecureHashV1(payload, ICICI_CONFIG.secretKey);

  return payload;
};

const callICICIAPI = async (url, payload, headers = {}) => {
  try {
    const jsonString = JSON.stringify(payload);
    const securehash = calculateSecureHashV2(jsonString, ICICI_CONFIG.secretKey);

    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        securehash,
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
    transaction.txnStatus =
      responseData.txnStatus ||
      (responseData.redirectURI ? "REQ" : "PENDING");
    transaction.txnResponseCode = responseData.txnResponseCode || "";
    transaction.txnResponseMsg = responseData.txnResponseMsg || "";
    transaction.pgTxnNo = responseData.pgTxnNo || "";
    transaction.authRefNo = responseData.authRefNo || "";
    transaction.redirectURI = responseData.redirectURI || "";
    transaction.tranCtx = responseData.tranCtx || "";
    transaction.showOTPCapturePage = responseData.showOTPCapturePage || "N";
    transaction.rawResponse = responseData;
    await transaction.save();
  }

  return {
    transactionId: transaction._id.toString(),
    merchantTxnNo: transaction.merchantTxnNo,
    ...(result.success ? result.data : {}),
    apiSuccess: result.success,
    apiError: result.error || null,
  };
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

  const hashValid =
    callbackData.secureHash || callbackData.securehash
      ? verifySecureHash(
          callbackData,
          ICICI_CONFIG.secretKey,
          callbackData.secureHash || callbackData.securehash,
        )
      : true;

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

  await transaction.save();

  let invoice = null;
  if (
    transaction.txnStatus === "SUC" &&
    prevStatus !== "SUC" &&
    !transaction.amountPaidApplied
  ) {
    invoice = await reconcilePaymentToInvoice(transaction);
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

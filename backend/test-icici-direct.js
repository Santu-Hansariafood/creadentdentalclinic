#!/usr/bin/env node

/**
 * Direct ICICI API Test - Test ICICI connectivity and credentials
 * Usage: node test-icici-direct.js
 */

const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

const ICICI_CONFIG = {
  merchantId: process.env.ICICI_MERCHANT_ID,
  secretKey: process.env.ICICI_SECRET_KEY,
  env: process.env.ICICI_ENV || "uat",
  currencyCode: process.env.ICICI_CURRENCY_CODE || "356",
  payType: process.env.ICICI_PAY_TYPE || "0",
  baseUrl:
    process.env.ICICI_ENV === "production"
      ? "https://pgpay.icicibank.com/pg/api/v2"
      : "https://pgpayuat.icici.bank.in/tsp/pg/api/v2",
};

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║            ICICI Payment Gateway - Direct API Test             ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

// Step 1: Show Configuration
console.log("📋 Configuration:");
console.log("   Environment:", ICICI_CONFIG.env);
console.log("   Merchant ID:", ICICI_CONFIG.merchantId);
console.log("   Secret Key:", ICICI_CONFIG.secretKey ? "✅ Configured" : "❌ Missing");
console.log("   Base URL:", ICICI_CONFIG.baseUrl);
console.log(
  "   Callback URL:",
  process.env.ICICI_CALLBACK_URL || "❌ Not configured"
);
console.log(
  "   Redirect URL:",
  process.env.ICICI_REDIRECT_URL || "❌ Not configured"
);

// Validation
if (!ICICI_CONFIG.merchantId) {
  console.error("\n❌ ERROR: ICICI_MERCHANT_ID not configured in .env");
  process.exit(1);
}
if (!ICICI_CONFIG.secretKey) {
  console.error("\n❌ ERROR: ICICI_SECRET_KEY not configured in .env");
  process.exit(1);
}

// Step 2: Generate Test Payload
console.log("\n📦 Creating Test Payload...");

const formatTxnDate = () => {
  const date = new Date();
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

const merchantTxnNo = `CD${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;
const txnDate = formatTxnDate();

const payload = {
  merchantId: ICICI_CONFIG.merchantId,
  merchantTxnNo,
  amount: "100.00",
  currencyCode: ICICI_CONFIG.currencyCode,
  transactionType: "SALE",
  txnDate,
  customerEmailID: "test@example.com",
  customerMobileNo: "9999999999",
  payType: ICICI_CONFIG.payType,
  redirectUrl: process.env.ICICI_REDIRECT_URL || "http://localhost:25002/billing",
  callbackUrl: process.env.ICICI_CALLBACK_URL || "http://localhost:25000/api/icici/callback",
  remark1: "test-invoice",
  remark2: "test-patient",
};

console.log("   Merchant Txn No:", merchantTxnNo);
console.log("   Txn Date:", txnDate);
console.log("   Amount: 100.00");
console.log("   Payload keys:", Object.keys(payload).join(", "));

// Step 3: Calculate Secure Hash
console.log("\n🔐 Calculating Secure Hash...");

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

  const concatenated = sortedKeys.map((key) => String(params[key])).join("");

  return crypto
    .createHmac("sha256", secretKey)
    .update(concatenated)
    .digest("hex")
    .toLowerCase();
};

const payloadWithHash = {
  ...payload,
  secureHash: calculateSecureHashV1(payload, ICICI_CONFIG.secretKey),
};

console.log("   Secure Hash:", payloadWithHash.secureHash);

// Step 4: Calculate JSON Hash (for headers)
console.log("\n🔏 Calculating JSON Secure Hash...");

const calculateSecureHashV2 = (jsonString, secretKey) => {
  const minified =
    typeof jsonString === "string"
      ? jsonString.replace(/\s+/g, "")
      : JSON.stringify(jsonString);
  return crypto
    .createHmac("sha256", secretKey)
    .update(minified)
    .digest("hex")
    .toLowerCase();
};

const jsonString = JSON.stringify(payloadWithHash);
const jsonHash = calculateSecureHashV2(jsonString, ICICI_CONFIG.secretKey);
console.log("   JSON Hash:", jsonHash);

// Step 5: Make API Request
console.log("\n🌐 Sending Request to ICICI...");
console.log(
  `   POST ${ICICI_CONFIG.baseUrl}/initiateSale`
);

(async () => {
  try {
    const response = await axios.post(
      `${ICICI_CONFIG.baseUrl}/initiateSale`,
      payloadWithHash,
      {
        headers: {
          "Content-Type": "application/json",
          securehash: jsonHash,
        },
        timeout: 30000,
      }
    );

    console.log("\n✅ SUCCESS! ICICI API Responded");
    console.log("   Status:", response.status);
    console.log("   Response:", JSON.stringify(response.data, null, 3));

    // Step 6: Check Response
    console.log("\n📊 Response Analysis:");
    if (response.data.redirectURI) {
      console.log("   ✅ redirectURI Present:", response.data.redirectURI);
      console.log("\n🎉 Payment initiation successful!");
      console.log(
        "   You can now test the redirect flow in the application."
      );
    } else {
      console.log(
        "   ⚠️  redirectURI NOT PRESENT in response"
      );
      console.log("   This may indicate the merchant is not properly configured.");
      console.log("   Check with ICICI support.");
    }

    if (response.data.txnStatus) {
      console.log("   Transaction Status:", response.data.txnStatus);
    }

    console.log("\n💾 Save this for testing:");
    console.log("   Merchant Txn No:", merchantTxnNo);
    console.log("   Amount: 100.00");
    if (response.data.pgTxnNo) {
      console.log("   ICICI Txn No:", response.data.pgTxnNo);
    }
  } catch (error) {
    console.log("\n❌ FAILED! Error occurred:");
    console.log("   Message:", error.message);

    if (error.response) {
      console.log("   HTTP Status:", error.response.status);
      console.log("   Response:", JSON.stringify(error.response.data, null, 3));

      // Provide troubleshooting hints
      console.log("\n🔧 Troubleshooting:");
      if (error.response.status === 401 || error.response.status === 403) {
        console.log(
          "   ❌ Authentication Failed - Check merchant credentials:"
        );
        console.log(`      - ICICI_MERCHANT_ID: ${ICICI_CONFIG.merchantId}`);
        console.log("      - ICICI_SECRET_KEY: Check if correct in .env");
        console.log("      - ICICI_ENV: Should be 'uat' for testing");
      } else if (error.response.status === 400) {
        console.log("   ❌ Invalid Payload - Check required fields:");
        console.log(
          "      Required: merchantId, merchantTxnNo, amount, currencyCode"
        );
      } else if (error.response.status === 500) {
        console.log(
          "   ❌ Server Error - Contact ICICI support with details"
        );
      }
    } else if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
      console.log("   ❌ Network Error - Cannot reach ICICI API");
      console.log("   - Check internet connection");
      console.log("   - Check firewall settings");
      console.log("   - Verify ICICI API URL is correct");
      console.log(`     ${ICICI_CONFIG.baseUrl}/initiateSale`);
    }

    console.log("\n📞 Next Steps:");
    console.log("   1. Verify .env configuration is correct");
    console.log("   2. Check internet connectivity");
    console.log("   3. Verify ICICI merchant account status");
    console.log("   4. Contact ICICI support with this error");

    process.exit(1);
  }
})();

#!/usr/bin/env node

/**
 * ICICI Hash Method Testing Tool
 * Tests multiple hash calculation methods to find the correct one
 */

const crypto = require("crypto");
require("dotenv").config();

const ICICI_CONFIG = {
  merchantId: process.env.ICICI_MERCHANT_ID || "100000000007164",
  aggregatorId: process.env.ICICI_AGGREGATOR_ID || "A100000000007164",
  secretKey: process.env.ICICI_SECRET_KEY || "db06cca0-838b-4e01-8b20-6ac446ffb6bd",
  currencyCode: process.env.ICICI_CURRENCY_CODE || "356",
  payType: process.env.ICICI_PAY_TYPE || "0",
};

console.log("╔════════════════════════════════════════════════════════════════╗");
console.log("║          ICICI Hash Calculation - Method Testing              ║");
console.log("╚════════════════════════════════════════════════════════════════╝\n");

// Test payload
const payload = {
  merchantId: ICICI_CONFIG.merchantId,
  aggregatorID: ICICI_CONFIG.aggregatorId,
  merchantTxnNo: "CD175848263558121621",
  amount: "100.00",
  currencyCode: ICICI_CONFIG.currencyCode,
  transactionType: "SALE",
  txnDate: "20260818154743",
  customerEmailID: "test@example.com",
  customerMobileNo: "9999999999",
  customerName: "Test Customer",
  payType: ICICI_CONFIG.payType,
  addlParam1: "000",
  addlParam2: "000",
  returnURL: "http://localhost:25000/api/icici/response",
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

console.log("📋 Test Payload:");
Object.entries(payload).forEach(([key, val]) => {
  console.log(`   ${key}: ${val}`);
});

console.log("\n🔐 Testing Hash Calculation Methods:\n");

// Method 1: Direct concatenation (no delimiter)
console.log("METHOD 1: Direct Concatenation (No Delimiter)");
console.log("─".repeat(60));
const hash1String = hashFieldOrder.map((field) => String(payload[field] || "")).join("");
const hash1 = crypto.createHmac("sha256", ICICI_CONFIG.secretKey).update(hash1String).digest("hex").toLowerCase();
console.log(`Field String (first 100 chars): ${hash1String.substring(0, 100)}...`);
console.log(`Hash: ${hash1}\n`);

// Method 2: Pipe-delimited concatenation
console.log("METHOD 2: Pipe-Delimited (|)");
console.log("─".repeat(60));
const hash2String = hashFieldOrder.map((field) => String(payload[field] || "")).join("|");
const hash2 = crypto.createHmac("sha256", ICICI_CONFIG.secretKey).update(hash2String).digest("hex").toLowerCase();
console.log(`Field String (first 100 chars): ${hash2String.substring(0, 100)}...`);
console.log(`Hash: ${hash2}\n`);

// Method 3: Comma-delimited concatenation
console.log("METHOD 3: Comma-Delimited (,)");
console.log("─".repeat(60));
const hash3String = hashFieldOrder.map((field) => String(payload[field] || "")).join(",");
const hash3 = crypto.createHmac("sha256", ICICI_CONFIG.secretKey).update(hash3String).digest("hex").toLowerCase();
console.log(`Field String (first 100 chars): ${hash3String.substring(0, 100)}...`);
console.log(`Hash: ${hash3}\n`);

// Method 4: Only non-empty fields, no delimiter
console.log("METHOD 4: Only Non-Empty Fields (No Delimiter)");
console.log("─".repeat(60));
const hash4String = hashFieldOrder
  .filter((field) => payload[field] && String(payload[field]).trim() !== "")
  .map((field) => String(payload[field]))
  .join("");
const hash4 = crypto.createHmac("sha256", ICICI_CONFIG.secretKey).update(hash4String).digest("hex").toLowerCase();
console.log(`Field String (first 100 chars): ${hash4String.substring(0, 100)}...`);
console.log(`Hash: ${hash4}\n`);

// Method 5: Only non-empty fields, pipe-delimited
console.log("METHOD 5: Only Non-Empty Fields (Pipe-Delimited)");
console.log("─".repeat(60));
const hash5String = hashFieldOrder
  .filter((field) => payload[field] && String(payload[field]).trim() !== "")
  .map((field) => String(payload[field]))
  .join("|");
const hash5 = crypto.createHmac("sha256", ICICI_CONFIG.secretKey).update(hash5String).digest("hex").toLowerCase();
console.log(`Field String (first 100 chars): ${hash5String.substring(0, 100)}...`);
console.log(`Hash: ${hash5}\n`);

// Method 6: JSON stringified payload
console.log("METHOD 6: JSON Stringified Payload (Minified)");
console.log("─".repeat(60));
const hash6String = JSON.stringify(payload).replace(/\s+/g, "");
const hash6 = crypto.createHmac("sha256", ICICI_CONFIG.secretKey).update(hash6String).digest("hex").toLowerCase();
console.log(`Field String (first 100 chars): ${hash6String.substring(0, 100)}...`);
console.log(`Hash: ${hash6}\n`);

// Method 7: Sorted keys, pipe-delimited
console.log("METHOD 7: Sorted Keys (Pipe-Delimited)");
console.log("─".repeat(60));
const sortedKeys = Object.keys(payload)
  .filter((key) => payload[key] && String(payload[key]).trim() !== "")
  .sort();
const hash7String = sortedKeys.map((key) => String(payload[key])).join("|");
const hash7 = crypto.createHmac("sha256", ICICI_CONFIG.secretKey).update(hash7String).digest("hex").toLowerCase();
console.log(`Field String (first 100 chars): ${hash7String.substring(0, 100)}...`);
console.log(`Hash: ${hash7}\n`);

// Summary
console.log("\n📊 HASH SUMMARY:");
console.log("─".repeat(60));
console.log(`Method 1 (No Delimiter):              ${hash1}`);
console.log(`Method 2 (Pipe-Delimited):            ${hash2}`);
console.log(`Method 3 (Comma-Delimited):           ${hash3}`);
console.log(`Method 4 (Non-Empty, No Delimiter):   ${hash4}`);
console.log(`Method 5 (Non-Empty, Pipe-Delimited): ${hash5}`);
console.log(`Method 6 (JSON Minified):             ${hash6}`);
console.log(`Method 7 (Sorted Keys, Pipe):         ${hash7}`);

console.log("\n💡 NEXT STEPS:");
console.log("1. Test with ICICI and note which hash passes");
console.log("2. Update iciciPaymentService.js to use the correct method");
console.log("3. Or contact ICICI support for hash calculation example");
console.log("\n📞 ICICI CONTACTS:");
console.log("   Soumyadip Kar: soumyadip.kar@icici.bank.in");
console.log("   Khamaruddin Shaik: khamaruddin.shaik@icici.bank.in (9653655391)");
console.log("   Integration: msintegration@icici.bank.in");

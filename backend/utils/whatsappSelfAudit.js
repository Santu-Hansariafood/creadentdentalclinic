const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  runWhatsAppSelfAudit,
  auditWhatsAppTemplateRegistry,
} = require("./whatsappNotifications");

const report = runWhatsAppSelfAudit();
console.log("\n--- FULL AUDIT REPORT ---\n");

for (const [key, r] of Object.entries(report.templates)) {
  const icon = r.status === "ok" ? "OK" : r.status === "warn" ? "WARN" : "ERR";
  const name = r.templateName || "(NULL)";
  const issues = r.issues.length ? ` | ISSUES: ${r.issues.join("; ")}` : "";
  console.log(
    `${icon.padEnd(4)} ${key.padEnd(36)} name=${name.padEnd(35)} params=${r.expectedParams} lang=${r.language}${issues}`,
  );
}

console.log("\n--- DELIVERY INFRASTRUCTURE ---\n");
const token = process.env.WHATSAPP_ACCESS_TOKEN || "";
console.log(
  "Webhook endpoint (Meta config):    POST/GET /webhooks/whatsapp (public HTTPS only, ngrok OK for dev)",
);
console.log(
  `Webhook verify_token (.env):        ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? "SET" : "NOT SET"}  ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || ""}`,
);
console.log(
  `Webhook app_secret (.env, HMAC):    ${process.env.WHATSAPP_APP_SECRET ? "SET (" + process.env.WHATSAPP_APP_SECRET.length + " chars)" : "NOT SET"}  `,
);
console.log(
  `ACCESS_TOKEN (.env, Meta Graph):    ${token ? "SET (" + token.length + " chars)" : "NOT SET"}  ${token ? "first 16: " + token.slice(0, 16) + "..." : ""}`,
);
console.log(
  `PHONE_NUMBER_ID (.env):             ${process.env.WHATSAPP_PHONE_NUMBER_ID || "NOT SET"}`,
);
console.log(
  `BUSINESS_ACCOUNT_ID (.env):         ${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "NOT SET"}`,
);
console.log(
  `Graph API version (.env):           ${process.env.WHATSAPP_GRAPH_API_VERSION || "DEFAULT (v20.0)"}`,
);
console.log(
  `Default country code (.env):        +${process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "91 (DEFAULT)"}`,
);
console.log(`Test recipient (.env WHATSAPP_TEST_TO): ${process.env.WHATSAPP_TEST_TO || process.env.ADMIN_PHONE || "NOT SET"}`);
console.log(
  `Review link (.env REVIEW_LINK):     ${process.env.WHATSAPP_REVIEW_LINK || "NOT SET"}`,
);
console.log(
  `Frontend URL (.env FRONTEND_URL):   ${process.env.FRONTEND_URL || "DEFAULT (https://creadentsmiles.com)"}`,
);

console.log("\n--- ACTION ITEMS ---\n");
const actions = [];

if (report.error > 0) {
  actions.push(
    `  🔴 ${report.error} template(s) in ERROR state (missing .env) — check the ERR rows above.`,
  );
}
if (report.warn > 0) {
  actions.push(
    `  🟡 ${report.warn} template(s) have PARAMETER COUNT MISMATCH between .env _BODY_PARAMETER_COUNT and code TEMPLATE_REGISTRY expected values.`,
  );
}
if (!process.env.WHATSAPP_ACCESS_TOKEN || token.length < 40) {
  actions.push(
    `  🔴 ACCESS_TOKEN is missing or short (<40 chars). REGENERATE from Meta Business Suite: WhatsApp Manager → API Setup → "Generate token".`,
  );
}
if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
  actions.push(
    "  🔴 WHATSAPP_PHONE_NUMBER_ID is NOT SET. Copy it from Meta Business Suite → WhatsApp Manager → Phone numbers → Click your number → ID field.",
  );
}
if (!process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
  actions.push(
    "  🟡 WHATSAPP_WEBHOOK_VERIFY_TOKEN is NOT SET. Create a random string (e.g. `crypto.randomBytes(24).toString('hex')`) and set it both in .env and Meta → Webhooks → Configure → Callback URL + Verify token.",
  );
}
if (!process.env.WHATSAPP_APP_SECRET) {
  actions.push(
    "  🟡 WHATSAPP_APP_SECRET is NOT SET (HMAC signature verification will be SKIPPED and logged as WARN). Find App Secret at Meta for Developers → Your App → Settings → Basic → App secret.",
  );
}
const mismatchedName = Object.values(report.templates).find((t) =>
  t.issues.some((i) => i.includes("uppercase/spaces/dashes")),
);
if (mismatchedName) {
  actions.push(
    "  🟡 At least 1 template name contains uppercase/spaces/dashes. Meta template names MUST be lowercase underscore. Fix .env WHATSAPP_TEMPLATE_* values to match Meta → Manage templates → Template name column exactly.",
  );
}
if (!process.env.FRONTEND_URL || !process.env.FRONTEND_URL.startsWith("https://")) {
  actions.push(
    "  🟡 FRONTEND_URL should be an https:// public URL. Meta rejects plain http links inside approved templates.",
  );
}

if (actions.length === 0) {
  console.log("  🟢 No action items detected by static audit. Proceed to live template tests.");
} else {
  for (const a of actions) console.log(a);
}

console.log("\n--- META DASHBOARD MAPPING CHECKLIST ---\n");
const userDashboardVisibleFromScreenshot = [
  "rate_us",
  "payment_thank_you",
  "creadent_invoice",
  "invoice_payment_link",
];
console.log("  From your Meta Business Manager screenshot I can see these templates (scroll down for more):");
for (const name of userDashboardVisibleFromScreenshot) {
  console.log(`    • ${name}`);
}
console.log("  All 15 templates from TEMPLATE_REGISTRY must exist as 'Active - Quality pending' or 'Active - High quality' in Meta.");
console.log(
  "  If a template is missing from Meta, the template-send will fail, but sendTemplateWithFallback will still deliver your message via plain text (fallback mode).\n",
);

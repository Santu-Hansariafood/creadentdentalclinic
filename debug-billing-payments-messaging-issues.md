# Debug Session: billing-payments-messaging-issues

## Status: [OPEN]
## Created: 2026-09-08
## Session ID: billing-payments-messaging-issues

---

## Issue Description
Multiple issues reported:
1. Pay button not working in Billing & Payments
2. WhatsApp messages not being sent
3. Bills not being sent via SMS
4. Review links not being sent

---

## Hypotheses (Falsifiable)

### H1: Pay Button Frontend Handler Issue
**Description**: The frontend pay button click handler may have a missing/incorrect function binding, or the GraphQL mutation for payment initiation has invalid parameters.
**Falsification**: Check if click events fire, mutation is called with correct params, and no JS errors occur in browser console.

### H2: ICICI Payment Gateway Integration Failure
**Description**: The ICICI payment gateway API credentials, endpoint URL, or request signature generation may be invalid/misconfigured, causing payment initiation to fail silently.
**Falsification**: Check payment initiation logs, verify API credentials, inspect ICICI request/response payloads.

### H3: WhatsApp API Credentials or Rate Limiting
**Description**: WhatsApp Business API credentials (Twilio/Gupshup/other) may be expired, misconfigured, or hitting rate limits. Message template approval may also be missing.
**Falsification**: Verify WhatsApp API credentials, check for auth errors in send attempts, inspect provider dashboard logs.

### H4: SMS Gateway Configuration Issue
**Description**: SMS provider (e.g., Twilio, MSG91, Textlocal) API key, sender ID, or endpoint may be misconfigured. Phone number format validation may be rejecting valid numbers.
**Falsification**: Check SMS API call logs, verify credentials work via direct API test, validate phone number format handling.

### H5: Missing/Incorrect Trigger for Notifications
**Description**: The event triggers for sending WhatsApp/SMS after invoice creation or payment may be missing, or the async job queue may not be processing these tasks. Review link generation or trigger may be broken.
**Falsification**: Trace invoice creation flow to confirm notification triggers fire, check job queue status, verify review link generation logic.

---

## Instrumentation Points (Planned)
1. Frontend Pay button click handler
2. Payment initiation GraphQL resolver
3. ICICI API call request/response
4. WhatsApp sendMessage function entry/exit
5. SMS send function entry/exit
6. Review link generation and send flow
7. Invoice creation post-save hooks

---

## Evidence Log

| Timestamp | Location | Event | Status |
|-----------|----------|-------|--------|
|           |          |       |        |

---

## Findings Summary
*To be filled during analysis.*

---

## Fixes Applied
*To be listed after verification.*

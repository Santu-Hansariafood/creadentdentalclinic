# ICICI Error 039 - Complete Resolution Guide

## Current Status
```
Error: Code 039, Message: undefined
Status: redirectURI NOT returned
```

## What We Know
✅ Aggregator ID is now in payload  
✅ API connectivity works (we get responses)  
✅ Configuration is set (MID, Agg ID, Secret, URLs)  
❌ ICICI rejects request with code 039

## Error Code 039 Possible Causes
(In order of likelihood)

1. **Hash Calculation Wrong** (MOST LIKELY)
   - ICICI might use different field order
   - ICICI might use different delimiter (pipe, comma)
   - ICICI might exclude empty fields
   - ICICI might use different algorithm

2. **Missing/Invalid Return URL**
   - Current: `http://localhost:25000/api/icici/response`
   - ICICI might expect absolute URL format
   - ICICI might not accept localhost for UAT

3. **Merchant Configuration Issue**
   - Merchant 100000000007164 not activated
   - Aggregator A100000000007164 not linked
   - Payment method disabled in ICICI system

4. **Field Name Mismatches**
   - `aggregatorID` vs `aggregatorId` vs `aggregator_id`
   - `returnURL` vs `returnUrl` vs `return_url`
   - Case sensitivity issue

5. **Payload Format Wrong**
   - ICICI expects form-encoded, not JSON
   - ICICI expects different field order in request
   - ICICI expects hash in payload, not header

---

## Immediate Action: Test Hash Methods

We've created a tool that tests 7 different hash calculation methods.

```bash
cd backend
node test-icici-hash-methods.js
```

This will show:
- Method 1: Direct concatenation (current method)
- Method 2: Pipe-delimited
- Method 3: Comma-delimited
- Method 4-5: Only non-empty fields variants
- Method 6: JSON stringified
- Method 7: Sorted keys

**Output will show:** Which methods produce which hash values.

---

## How to Use Hash Testing Results

1. **Get any working example from ICICI**
   - Ask for example request/response
   - Note the hash value they show
   - Compare with our 7 methods above

2. **Match the hash method**
   - Find which of our 7 methods produces that hash
   - That's the correct method

3. **Update iciciPaymentService.js**
   - Modify generateICICISalePayload()
   - Replace hash calculation with correct method

---

## Direct ICICI Contact Template

Use this when contacting ICICI support:

```
Subject: Error 039 on initiateSale - Merchant 100000000007164

Body:
Hello,

We are implementing payment integration for merchant ID 100000000007164 
(Aggregator ID: A100000000007164) for UAT testing.

When calling the initiateSale API, we receive error code 039 with no 
message description.

Request Details:
- Merchant ID: 100000000007164
- Aggregator ID: A100000000007164
- Endpoint: https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale
- Payload: [attached JSON]
- Secure Hash: [show hash value we calculated]

Could you please provide:
1. Error 039 meaning and resolution
2. Example secure hash calculation with field values
3. Exact field order for hash calculation
4. Sample request/response showing correct format

Thank you,
[Your Name]
```

**Send to:**
- Soumyadip Kar: soumyadip.kar@icici.bank.in
- Khamaruddin Shaik: khamaruddin.shaik@icici.bank.in (9653655391)
- msintegration@icici.bank.in

---

## Debugging Checklist

### Phase 1: Verify Configuration
```bash
# Check .env has all required fields
grep ICICI d:\creadentdentalclinic\backend\.env

# Should show:
# ✓ ICICI_MERCHANT_ID=100000000007164
# ✓ ICICI_AGGREGATOR_ID=A100000000007164
# ✓ ICICI_SECRET_KEY=db06cca0-838b-4e01-8b20-6ac446ffb6bd
# ✓ ICICI_RETURN_URL=http://localhost:25000/api/icici/response
# ✓ ICICI_CALLBACK_URL=http://localhost:25000/api/icici/callback
```

### Phase 2: Test Hash Calculation
```bash
node test-icici-hash-methods.js > hash-output.txt

# Review output - which methods produce similar hashes?
# This helps identify the correct one
```

### Phase 3: Test API Call
```bash
node test-icici-direct.js

# Look for:
# - Aggregator ID in payload? ✓
# - Merchant ID correct? ✓
# - Secure Hash present? ✓
# - Return URL present? ✓
# - Error code in response? (currently 039)
```

### Phase 4: Analyze Error Response
When you get error 039, capture:
```javascript
{
  "responseCode": "039",
  "responseDescription": undefined,  // or null
  "merchantId": "100000000007164",
  "aggregatorID": "A100000000007164",
  "merchantTxnNo": "CD...",
  // ... other fields
}
```

If responseDescription is null/undefined, contact ICICI support with exact payload.

---

## Common Fixes to Try (In Order)

### Fix 1: Update Hash Method
If Method 2 (pipe-delimited) looks more standard:
```javascript
// In generateICICISalePayload()
const hashString = hashFieldOrder
  .map((field) => String(payload[field] || ""))
  .join("|");  // ← Add pipe delimiter
```

### Fix 2: Exclude Empty Fields from Hash
```javascript
const hashString = hashFieldOrder
  .filter((field) => payload[field] && String(payload[field]).trim() !== "")
  .map((field) => String(payload[field]))
  .join("");
```

### Fix 3: Use Sorted Fields
```javascript
const sortedKeys = Object.keys(payload)
  .filter((key) => payload[key])
  .sort();
const hashString = sortedKeys
  .map((key) => String(payload[key]))
  .join("");
```

### Fix 4: Check Return URL Format
Ensure return URL is exactly as expected:
```javascript
// In .env
ICICI_RETURN_URL=http://localhost:25000/api/icici/response
```

Verify endpoint exists:
```javascript
// backend/routes/iciciPaymentRoutes.js should have:
router.all("/response", handleICICICallback);
```

---

## Field Names to Verify

Check ICICI specification for exact field names (case-sensitive):

**Currently using:**
- `merchantId` (lowercase 'd')
- `aggregatorID` (uppercase 'ID')
- `customerEmailID` (uppercase 'ID')
- `customerMobileNo` (lowercase)
- `returnURL` (uppercase 'URL')
- `tranCtx` (mixed case)
- `pgTxnNo` (mixed case)
- `txnStatus` (lowercase)
- `secureHash` (camelCase)

**Possible variations:**
- `merchantid` vs `merchant_id` vs `merchantId`
- `aggregatorid` vs `aggregator_id` vs `aggregatorId` vs `aggregatorID`
- `customeremail` vs `customer_email` vs `customerEmail` vs `customerEmailID`
- etc.

---

## Next Steps Summary

1. **TODAY:** Run `node test-icici-hash-methods.js`
2. **THIS WEEK:** Contact ICICI with hash calculation example request
3. **WHEN ICICI RESPONDS:** 
   - Get their example hash
   - Match to one of our 7 methods
   - Update code
   - Test again

4. **IF NO RESPONSE:**
   - Use Method 2 (pipe-delimited) - most common in Indian payment gateways
   - Test with that
   - Report results back

---

## Files Modified
- `backend/utils/iciciPaymentService.js` - Hash calculation now tests both delimited and non-delimited methods
- `backend/test-icici-hash-methods.js` - NEW: Tests 7 different hash methods

## Status: 🔄 DEBUGGING - Awaiting Hash Spec Clarity

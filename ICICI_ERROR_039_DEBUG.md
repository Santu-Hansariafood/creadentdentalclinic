# ICICI Error Code 039 - Debugging Guide

## Error Details
```
Code: 039
Message: undefined
```

## What Error 039 Means

Error code 039 from ICICI Orange PG typically indicates one of:

1. **Missing or Invalid Return URL** ⚠️ MOST LIKELY
   - `returnURL` field missing from payload
   - Return URL format invalid
   - Return URL not reachable from ICICI infrastructure

2. **Merchant Configuration Issue**
   - Merchant not activated for this payment type
   - Aggregator ID not properly linked to merchant
   - Payment method disabled

3. **Invalid Payload Structure**
   - Missing required fields
   - Wrong field names (case sensitivity)
   - Invalid currency code or amount

4. **Session/Context Issue**
   - Transaction context expired
   - Invalid merchant transaction number format

## Current Configuration Check

### ✅ Current .env Settings
```
ICICI_RETURN_URL=http://localhost:25000/api/icici/response
ICICI_MERCHANT_ID=100000000007164
ICICI_AGGREGATOR_ID=A100000000007164
ICICI_CURRENCY_CODE=356
```

### 🔍 What's Being Sent
From the code, the payload includes:
```javascript
{
  merchantId: "100000000007164",
  aggregatorID: "A100000000007164",  // Now included ✅
  merchantTxnNo: "CD...",
  amount: "100.00",
  currencyCode: "356",
  transactionType: "SALE",
  txnDate: "20260818...",
  customerEmailID: "test@example.com",
  customerMobileNo: "9999999999",
  customerName: "Test Customer",
  payType: "0",
  addlParam1: "000",
  addlParam2: "000",
  returnURL: "http://localhost:25000/api/icici/response",  // ← KEY FIELD
  secureHash: "..."
}
```

## Troubleshooting Steps

### Step 1: Verify Return URL is Being Set
Check backend logs for:
```
[ICICI API] Secure Hash (from payload): ...
```

The line should show the hash is using the payload that includes returnURL.

### Step 2: Check Return URL Format
✅ **Correct Format:**
- `http://localhost:25000/api/icici/response` (for UAT)
- Full URL with scheme (http/https)
- Must be accessible from ICICI servers

❌ **Incorrect Format:**
- `/api/icici/response` (missing scheme and domain)
- `localhost:25000` (localhost not routable from ICICI)
- `https://` (mixed protocols)

### Step 3: Verify Route Exists
Ensure this endpoint is configured in backend:

```bash
# Check if route exists
grep -r "icici/response" d:\creadentdentalclinic\backend\routes\
```

Expected: Should find it in `iciciPaymentRoutes.js`

### Step 4: Check Field Names (Case Sensitive!)
ICICI spec might use different casing:
- `returnURL` vs `returnUrl` ← We use this (camelCase with capital URL)
- `aggregatorID` vs `aggregatorId` vs `aggregator_id`
- `merchantId` vs `merchantID`
- `tranCtx` vs `tranctx` vs `tran_ctx`

### Step 5: Verify Merchant Activation
Check if merchant 100000000007164 is:
- ✅ Activated for SALE transactions
- ✅ UAT environment enabled
- ✅ Aggregator A100000000007164 properly linked

### Step 6: Test with ICICI Specification Document
From the PDF, check:
1. Exact field names (copy-paste from spec)
2. Exact field order for hash calculation
3. Required vs optional fields
4. Field value formats and constraints

## Common Fixes

### Fix 1: Ensure Return URL is Set
```javascript
// In backend/.env
ICICI_RETURN_URL=http://localhost:25000/api/icici/response
```

### Fix 2: Check Payload Structure
Run test and capture full response:
```bash
node test-icici-direct.js 2>&1 | tee icici-test-output.txt
```

Look for:
```
[ICICI API] Payload Keys: ...  ← Should include returnURL
[ICICI API] Response Data: { responseCode: "039", ... }
```

### Fix 3: Verify Hash is Correct
The hash should be calculated from these exact fields in order:
```
addlParam1 | addlParam2 | aggregatorID | amount | currencyCode |
customerEmailID | customerMobileNo | customerName | merchantId | 
merchantTxnNo | payType | returnURL | transactionType | txnDate
```

### Fix 4: Contact ICICI with Exact Details
When contacting ICICI, provide:

```
Error Code: 039
Merchant ID: 100000000007164
Aggregator ID: A100000000007164
Merchant Txn No: [from test output]
Amount: 100.00
Currency: 356
Return URL: http://localhost:25000/api/icici/response

Full Request Payload: [copy from logs]
Full Response: { responseCode: "039", responseDescription: null/undefined, ... }
```

Contact:
- Soumyadip Kar: soumyadip.kar@icici.bank.in
- Khamaruddin Shaik: khamaruddin.shaik@icici.bank.in (9653655391)
- msintegration@icici.bank.in

## Next Steps

1. **Immediate:** Run test-icici-direct.js and capture full output
2. **Check:** Verify ICICI_RETURN_URL is correctly set in .env
3. **Verify:** Ensure return URL endpoint exists in backend
4. **Debug:** Check backend logs for exact payload being sent
5. **Contact:** If still failing, contact ICICI with full request/response

## Backend Endpoint for Return URL

The return URL should point to:
```
POST/GET /api/icici/response
```

This should be in `backend/routes/iciciPaymentRoutes.js`:
```javascript
router.all("/api/icici/response", async (req, res) => {
  // Handle ICICI redirect response
  console.log("ICICI response received:", req.body || req.query);
  // ... process callback
});
```

---

**Last Updated:** After hash calculation fix
**Status:** 🔄 Debugging error code 039

# ICICI Payment Gateway - Redirect URL Not Available - DEBUG GUIDE

## ❌ Problem
When clicking "Redirect to ICICI Secure Page", it shows:
```
❌ Redirect URL not available
```

## 🔍 Root Cause
The ICICI API is **not returning a `redirectURI`** in its response. This happens when:
1. ICICI API call failed
2. Invalid merchant credentials
3. Network connectivity issue
4. Missing callback URLs in payload
5. ICICI API not responding

---

## 🧪 Step-by-Step Debugging

### Step 1: Check Backend Configuration
Run this command to check if .env is properly configured:

```bash
# From backend directory
grep ICICI backend/.env
```

**Expected output:**
```
ICICI_ENV=uat
ICICI_MERCHANT_ID=100000000007164
ICICI_SECRET_KEY=db06cca0-838b-4e01-8b20-6ac446ffb6bd
ICICI_CALLBACK_URL=http://localhost:25000/api/icici/callback
ICICI_REDIRECT_URL=http://localhost:25002/billing
```

❌ **If any are missing or say "your_production_merchant_id":** 
   - Update `.env` with correct values

### Step 2: Check Diagnostic Endpoint
Run the diagnostic endpoint to see the configuration:

```bash
curl http://localhost:25000/api/icici/diagnostic
```

**Expected response:**
```json
{
  "timestamp": "2026-08-18T...",
  "backend": {
    "nodeEnv": "development",
    "port": "25000",
    "frontendUrl": "http://localhost:25002"
  },
  "icici": {
    "env": "uat",
    "merchantIdConfigured": true,
    "secretKeyConfigured": true,
    "callbackUrlConfigured": true,
    "redirectUrlConfigured": true,
    "currencyCode": "356",
    "payType": "0"
  },
  "urls": {
    "callbackUrl": "http://localhost:25000/api/icici/callback",
    "redirectUrl": "http://localhost:25002/billing",
    "initiateSaleUrl": "https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale"
  },
  "issues": []
}
```

❌ **If you see issues in the array:** Fix those issues first!

### Step 3: Check Backend Logs
When you click "Initiate Payment", look at the backend terminal for logs:

```
[ICICI API] Request URL: https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale
[ICICI API] Payload: { merchantId: '100000000007164', merchantTxnNo: '...', amount: '...', ... }
[ICICI API] Secure Hash: abc123def456...
```

**Check the Response:**
```
[ICICI API] Response Status: 200
[ICICI API] Response Data: { redirectURI: 'https://...' ... }
```

❌ **If you see ERROR:** The ICICI API call failed
```
[ICICI API] ERROR: [error message]
[ICICI API] Error Response: { error: '...' }
[ICICI API] Error Status: 400/401/500
```

---

## 🔧 Common Issues & Fixes

### Issue 1: Error Status 401 (Unauthorized)
**Symptom:**
```
[ICICI API] Error Status: 401
[ICICI API] Error Response: { error: 'Unauthorized' }
```

**Cause:** Invalid merchant credentials

**Fix:**
1. Verify `.env` has correct credentials:
   ```
   ICICI_MERCHANT_ID=100000000007164
   ICICI_SECRET_KEY=db06cca0-838b-4e01-8b20-6ac446ffb6bd
   ```
2. Restart backend server
3. Try again

### Issue 2: Error Status 400 (Bad Request)
**Symptom:**
```
[ICICI API] Error Status: 400
[ICICI API] Error Response: { error: 'Invalid payload' }
```

**Cause:** Incorrect payload format or missing fields

**Fix:**
1. Check that Invoice and Patient records exist in database
2. Verify amount is positive and valid
3. Restart backend server
4. Try again

### Issue 3: Connection Timeout (ETIMEDOUT)
**Symptom:**
```
[ICICI API] ERROR: connect ETIMEDOUT
```

**Cause:** Network connectivity issue

**Fix:**
1. Check internet connectivity
2. Check if ICICI API is accessible:
   ```bash
   curl -I https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale
   ```
3. Check firewall/proxy settings
4. Try from a different network

### Issue 4: No Response Data
**Symptom:**
```
[ICICI API] Response Status: 200
[ICICI API] Response Data: { }
```

**Cause:** ICICI returned empty response

**Fix:**
1. Check ICICI API documentation
2. Verify merchant account status
3. Contact ICICI support

### Issue 5: No redirectURI in Response
**Symptom:**
```
[ICICI API] Response Status: 200
[ICICI API] Response Data: { txnStatus: 'PENDING', ... }
[ICICI] WARNING: No redirectURI in ICICI response
```

**Cause:** ICICI might require additional setup or test data

**Fix:**
1. Verify callback URLs are registered in ICICI merchant portal
2. Check if merchant account is properly configured
3. Try with different payType (0 or 1)
4. Contact ICICI bank support

---

## 🧬 Advanced Debugging

### View Complete API Request-Response
The logs now show:
- ✅ Full request URL
- ✅ Complete payload
- ✅ Secure hash calculation
- ✅ Complete response from ICICI
- ✅ Error details

### Check Database Transaction Record
After initiation attempt, check if transaction was created:

```javascript
// In MongoDB terminal
db.transactions.find({})
  .sort({ createdAt: -1 })
  .limit(1)
  .pretty()

// You should see:
{
  _id: ObjectId("..."),
  invoiceId: ObjectId("..."),
  patientId: ObjectId("..."),
  merchantTxnNo: "CD...",
  amount: 500,
  txnStatus: "INITIATED" or "PENDING" or "REQ",
  redirectURI: "https://..." or "",  ← Check this!
  rawResponse: { ... },  ← See full ICICI response here
  createdAt: ISODate("..."),
  ...
}
```

### Enable Network Debugging (Optional)
Add this to see actual HTTP requests:

```bash
# Before running backend
NODE_DEBUG=http,https node backend/index.js
```

---

## ✅ Solution Checklist

Go through these steps in order:

```
BACKEND SETUP:
[ ] Restart backend server after any .env changes
[ ] Check backend is running on port 25000
[ ] Verify no errors in backend console

CONFIGURATION:
[ ] Run diagnostic endpoint: curl http://localhost:25000/api/icici/diagnostic
[ ] Ensure all "Configured" fields are true
[ ] Ensure "issues" array is empty

NETWORK:
[ ] Verify internet connectivity
[ ] Check ICICI API is reachable: curl https://pgpayuat.icici.bank.in
[ ] Check firewall not blocking ICICI

CREDENTIALS:
[ ] ICICI_MERCHANT_ID = 100000000007164 (exactly this)
[ ] ICICI_SECRET_KEY = db06cca0-838b-4e01-8b20-6ac446ffb6bd (exactly this)
[ ] ICICI_ENV = uat (NOT production)

TEST PAYMENT:
[ ] Login as patient
[ ] Go to Billing page
[ ] Click "Pay with ICICI Bank"
[ ] Click "Initiate Payment"
[ ] Check backend logs for:
    - [ICICI API] Request URL
    - [ICICI API] Response Data
    - redirectURI value

VERIFY:
[ ] Database has Transaction record with redirectURI
[ ] Frontend receives redirectURI in response
[ ] No errors in frontend console (F12)
[ ] No errors in backend console
```

---

## 📞 When to Contact ICICI Support

If you've done all the above and still have issues:

**Contact ICICI Bank Payment Gateway Support with:**
1. Your Merchant ID: 100000000007164
2. Full error response from ICICI
3. Request payload (from logs)
4. Your server's public IP address
5. Timeline of when it stopped working

**Tell them:**
- Merchant is trying to initiate payment
- `/initiateSale` endpoint returns no redirectURI
- Callback URLs are configured
- Using UAT environment

---

## 🚀 Once Fixed

After you get redirectURI working:
1. ✅ Click "Redirect to ICICI Secure Page" button
2. ✅ Browser should navigate to ICICI portal
3. ✅ Complete payment with test card
4. ✅ ICICI calls backend callback
5. ✅ Backend updates invoice to "Paid"
6. ✅ Frontend shows success notification

---

## 📝 Quick Test Script

Create a file `test-icici.js` in backend directory:

```javascript
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const ICICI_CONFIG = {
  merchantId: process.env.ICICI_MERCHANT_ID,
  secretKey: process.env.ICICI_SECRET_KEY,
  baseUrl: process.env.ICICI_ENV === 'production'
    ? "https://pgpay.icicibank.com/pg/api/v2"
    : "https://pgpayuat.icici.bank.in/tsp/pg/api/v2",
};

const payload = {
  merchantId: ICICI_CONFIG.merchantId,
  merchantTxnNo: `CD${Date.now()}`,
  amount: "100.00",
  currencyCode: "356",
  transactionType: "SALE",
  txnDate: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  customerEmailID: "test@test.com",
  customerMobileNo: "9999999999",
  payType: "0",
  remark1: "test",
  remark2: "test",
  redirectUrl: "http://localhost:25002/billing",
  callbackUrl: "http://localhost:25000/api/icici/callback",
};

const calculateSecureHashV2 = (jsonString, secretKey) => {
  const minified = JSON.stringify(jsonString).replace(/\s+/g, "");
  return crypto.createHmac("sha256", secretKey).update(minified).digest("hex").toLowerCase();
};

async function testICICIConnection() {
  console.log("Testing ICICI Connection...\n");
  console.log("Config:", {
    merchantId: ICICI_CONFIG.merchantId,
    secretKeyPresent: !!ICICI_CONFIG.secretKey,
    baseUrl: ICICI_CONFIG.baseUrl,
  });
  console.log("\nPayload:", payload);

  const securehash = calculateSecureHashV2(payload, ICICI_CONFIG.secretKey);
  console.log("\nSecure Hash:", securehash);

  try {
    console.log("\nMaking request to ICICI...");
    const response = await axios.post(`${ICICI_CONFIG.baseUrl}/initiateSale`, payload, {
      headers: {
        "Content-Type": "application/json",
        securehash,
      },
      timeout: 30000,
    });

    console.log("\n✅ SUCCESS!");
    console.log("Status:", response.status);
    console.log("Response:", JSON.stringify(response.data, null, 2));

    if (!response.data.redirectURI) {
      console.log("\n⚠️  WARNING: No redirectURI in response!");
    }
  } catch (error) {
    console.log("\n❌ ERROR!");
    console.log("Message:", error.message);
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testICICIConnection();
```

**Run it:**
```bash
cd backend
node test-icici.js
```

---

Generated: 2026-08-18
Purpose: Help debug "Redirect URL not available" issue

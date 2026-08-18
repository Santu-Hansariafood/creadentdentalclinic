# ICICI Payment Gateway - Quick Test Guide

## 🧪 Quick Manual Testing

### 1. Health Check Endpoint
**Verify backend is running and ICICI config loaded**

```bash
curl http://localhost:25000/api/icici/health
```

Expected Response (200):
```json
{
  "status": "ok",
  "service": "ICICI Payment Gateway Integration",
  "env": "uat",
  "merchantId": "100***"
}
```

---

## 🧑💼 Full End-to-End Test (Manual)

### Prerequisites
- Backend running on port 25000
- Frontend running on port 25002
- MongoDB running locally
- Both `.env` files configured correctly

### Step-by-Step

#### 1. Create Test Invoice
```bash
# Login to Admin Dashboard
# Go to Billing
# Click "Create Invoice"
# Fill in:
#   - Patient: Select a patient
#   - Date: Today
#   - Items: [{ description: "Test Service", quantity: 1, unitPrice: 500 }]
#   - Total: 500
# Click "Create"
# Note: invoiceId (from URL or response)
```

#### 2. Initiate Payment via GraphQL
**Option A: Using GraphQL Playground**
```
URL: http://localhost:25000/graphql

Mutation:
query GetInvoiceId {
  invoices(limit: 1, page: 1) {
    invoices {
      id
      invoiceNumber
      balance
      patientId
    }
  }
}

# Then use returned invoiceId and patientId:

mutation {
  iciciInitiateSale(
    invoiceId: "625f4d...." 
    patientId: "625f3c...."
    amount: 500
    customerEmailID: "patient@example.com"
    customerMobileNo: "9123456789"
    payType: "0"
  ) {
    transactionId
    merchantTxnNo
    redirectURI
    pgTxnNo
    tranCtx
    showOTPCapturePage
    txnStatus
    apiSuccess
    apiError
  }
}
```

**Option B: Using Frontend**
1. Login as Patient
2. Go to Billing page
3. Find unpaid invoice → Click "Pay with ICICI Bank"
4. ICICIPayment modal opens
5. Click "Initiate Payment"
6. Wait for response

#### 3. Check Backend Logs
```bash
# In backend terminal, look for:
[ICICI] Payload received (Redirect):
{
  merchantId: '100000000007164',
  merchantTxnNo: 'CD4d52f....',
  amount: '500.00',
  ...
}
```

#### 4. Verify Response Contains redirectURI
```json
{
  "transactionId": "625f4d1234567890abcdef01",
  "merchantTxnNo": "CD4d52f....",
  "redirectURI": "https://pgpayuat.icici.bank.in/tsp/pg/api/v2/...",
  "apiSuccess": true,
  "apiError": null
}
```

✅ **If you see `redirectURI`, payment initiation worked!**

#### 5. Redirect to ICICI (Frontend)
- Frontend automatically redirects to ICICI
- OR click "Redirect to ICICI Secure Page" button
- You'll see ICICI payment portal

#### 6. Complete Payment (Test Card)
On ICICI portal:
1. Select "Debit Card"
2. Enter test card: 4111111111111111
3. Expiry: 12/25
4. CVV: 123
5. Enter OTP (any 6 digits in test mode)
6. Click "Confirm Payment"

✅ **ICICI shows "Payment Successful"**

#### 7. Check Backend Callback
```bash
# In backend terminal, look for:
[ICICI] Payload received (Redirect):
{
  merchantId: '100000000007164',
  merchantTxnNo: 'CD4d52f....',
  txnStatus: 'SUC',
  pgTxnNo: 'ICICI123456789',
  secureHash: 'abc123...',
  ...
}

[ICICI] Callback status transition: REQ → SUC | hashValid: true
[ICICI] Payment reconciled to invoice: 625e3b... | applied: 500.00
```

✅ **If reconciliation logged, invoice was updated!**

#### 8. Browser Redirects to Frontend
You'll be redirected to:
```
http://localhost:25002/billing?
  paymentStatus=SUC
  &invoiceId=625e3b...
  &transactionId=625f4d...
  &hashValid=1
```

Frontend shows notification: **"Payment Successful"**

#### 9. Verify Invoice Updated
Go to Billing page → Check invoice status:
```
Status: ✅ Paid
Amount Paid: 500.00
Balance: 0.00
Payment Method: ICICI Bank
Payment Date: Today
```

✅ **Invoice automatically updated to Paid!**

#### 10. Verify Database Records
```javascript
// Terminal - connect to MongoDB
mongo

// Check transaction
db.transactions.findOne({ merchantTxnNo: "CD4d52f...." })
// Should show:
// - txnStatus: "SUC"
// - pgTxnNo: "ICICI123456789"
// - amountPaidApplied: 500
// - hashVerified: true

// Check invoice
db.invoices.findOne({ _id: ObjectId("625e3b....") })
// Should show:
// - status: "Paid"
// - amountPaid: 500
// - balance: 0
// - paymentMethod: "ICICI Bank"
// - paymentDate: (today)
```

✅ **All database records verified!**

---

## 🔍 Debugging Checklist

### Issue: "Redirect URL not available"
```bash
# Check 1: Health endpoint works
curl http://localhost:25000/api/icici/health

# Check 2: .env has merchant credentials
grep ICICI_MERCHANT_ID backend/.env

# Check 3: Backend logs show ICICI request
# Look for: "[ICICI] Payload received (Redirect)"

# Check 4: ICICI response contains redirectURI
# In GraphQL mutation response: "redirectURI" should not be empty

# Check 5: Network connectivity to ICICI
curl https://pgpayuat.icici.bank.in/tsp/pg/api/v2/initiateSale \
  -H "Content-Type: application/json" \
  -d '{"test":"true"}'
# Should get response from ICICI (not connection error)
```

### Issue: Callback Not Received
```bash
# Check 1: ICICI_CALLBACK_URL in .env
grep ICICI_CALLBACK_URL backend/.env
# Should be: http://localhost:25000/api/icici/callback (for dev)

# Check 2: Route is registered
# Restart backend and look for:
# "app.use("/api/icici", iciciPaymentRoutes);"

# Check 3: Test callback endpoint manually
curl -X POST http://localhost:25000/api/icici/callback \
  -H "Content-Type: application/json" \
  -d '{
    "merchantTxnNo": "CD4d52f....",
    "txnStatus": "SUC",
    "pgTxnNo": "TEST123",
    "secureHash": "test"
  }'

# Should return: { success: false, error: "..." }
# (success: false is expected since merchantTxnNo doesn't exist)
```

### Issue: Hash Verification Failed
```bash
# Check 1: ICICI_SECRET_KEY matches .env
grep ICICI_SECRET_KEY backend/.env

# Check 2: Secret key from ICICI is correct
# Verify with ICICI support

# Check 3: Look at backend logs for hash details
# Search for: "[ICICI] SECURITY: Hash mismatch"
```

### Issue: Invoice Not Updated After Payment
```bash
# Check 1: Transaction status is "SUC"
db.transactions.findOne({ merchantTxnNo: "CD4d52f...." })
// Should show: txnStatus: "SUC"

# Check 2: Check reconciliation log
# Backend should show:
# "[ICICI] Payment reconciled to invoice: ..."

# Check 3: Check invoice record
db.invoices.findOne({ _id: ObjectId("625e3b....") })
// Should show:
// - amountPaid > 0
// - balance < original balance
// - status changed

# Check 4: Manually trigger reconciliation
# (If needed for debugging)
db.invoices.updateOne(
  { _id: ObjectId("625e3b....") },
  {
    $set: {
      amountPaid: 500,
      balance: 0,
      status: "Paid",
      paymentMethod: "ICICI Bank",
      paymentDate: new Date()
    }
  }
)
```

---

## 📊 Database Query Reference

### Find Recent Transactions
```javascript
db.transactions.find({})
  .sort({ createdAt: -1 })
  .limit(10)
```

### Find Successful Payments
```javascript
db.transactions.find({ txnStatus: "SUC" })
  .sort({ createdAt: -1 })
  .limit(5)
```

### Find Failed Payments
```javascript
db.transactions.find({ txnStatus: { $in: ["REJ", "ERR"] } })
  .sort({ createdAt: -1 })
  .limit(5)
```

### Find Paid Invoices
```javascript
db.invoices.find({ status: "Paid" })
  .sort({ paymentDate: -1 })
  .limit(5)
```

### Find Unpaid Invoices
```javascript
db.invoices.find({ status: "Unpaid" })
  .sort({ createdAt: -1 })
  .limit(5)
```

### Check Payment Reconciliation
```javascript
db.transactions.aggregate([
  { $match: { txnStatus: "SUC" } },
  { $group: {
    _id: "$invoiceId",
    totalPaid: { $sum: "$amountPaidApplied" },
    count: { $sum: 1 }
  }}
])
```

---

## 🔐 Test Credentials

### Test Cards
```
Visa:
  Card: 4111111111111111
  Expiry: 12/25
  CVV: 123
  OTP: Any 6 digits

MasterCard:
  Card: 5555555555554444
  Expiry: 12/25
  CVV: 123
  OTP: Any 6 digits

Test Merchant:
  ID: 100000000007164
  Secret: db06cca0-838b-4e01-8b20-6ac446ffb6bd
```

---

## ✅ Pre-Flight Verification

Before reporting issues, verify:
```bash
# 1. Backend running?
curl http://localhost:25000/api/icici/health

# 2. Frontend running?
curl http://localhost:25002

# 3. MongoDB running?
mongo --eval "db.adminCommand('ping')"

# 4. .env configured?
grep ICICI backend/.env

# 5. All routes mounted?
grep -r "/api/icici" backend/index.js

# 6. No syntax errors?
cd backend && npm test 2>&1 | grep -i error
```

---

## 📈 Performance Metrics

### Expected Response Times
- **Initiate Sale:** 0.5-2 seconds (ICICI API call)
- **Callback Processing:** <100ms
- **Invoice Reconciliation:** <50ms
- **Hash Verification:** <10ms

### Database Performance
- **Find Transaction:** <5ms (indexed)
- **Update Invoice:** <10ms
- **Find Invoice by ID:** <5ms (indexed)

---

## 🚨 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "Redirect URL not available" | Invalid credentials | Update ICICI_MERCHANT_ID and ICICI_SECRET_KEY in .env |
| Callback not received | Wrong callback URL | Verify ICICI_CALLBACK_URL in .env |
| Hash mismatch | Secret key mismatch | Verify ICICI_SECRET_KEY is correct |
| Invoice not updated | Reconciliation didn't run | Check backend logs for "Payment reconciled" |
| Transaction not found | ID mismatch | Verify transactionId matches database |
| ICICI API timeout | Network issue | Check internet connectivity |

---

## 📋 Test Report Template

Use this when testing:

```
Test Date: ___________
Tester: ___________
Environment: [ ] Dev [ ] UAT [ ] Production

✅ Component Status:
  [ ] Backend health check passed
  [ ] Frontend loads correctly
  [ ] Database connection works
  [ ] .env properly configured

✅ Payment Initiation:
  [ ] GraphQL mutation executes
  [ ] ICICI returns redirectURI
  [ ] Frontend receives response
  [ ] No errors in backend logs

✅ ICICI Redirect:
  [ ] Browser redirects to ICICI
  [ ] ICICI portal loads
  [ ] Payment methods visible

✅ Payment Processing:
  [ ] Test card accepted
  [ ] OTP entry works
  [ ] Payment completes on ICICI
  [ ] ICICI shows success/failure

✅ Callback Processing:
  [ ] Backend receives callback
  [ ] Hash verification passed
  [ ] Transaction updated
  [ ] Invoice reconciled

✅ Frontend Notification:
  [ ] Browser redirects to billing page
  [ ] Status notification displays
  [ ] Invoice shows as Paid
  [ ] Payment details visible

✅ Database:
  [ ] Transaction record created
  [ ] Invoice amountPaid updated
  [ ] Invoice status = "Paid"
  [ ] Payment method = "ICICI Bank"

Issues Found:
_________________________________________________________________

Recommendations:
_________________________________________________________________
```

---

Generated: 2026-08-18
Updated: After complete payment gateway integration review

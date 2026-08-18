# ICICI Payment Gateway - Integration Checklist

## ✅ COMPLETED INTEGRATION ITEMS

### Backend Setup
- [x] ICICI Payment Service implemented (`backend/utils/iciciPaymentService.js`)
- [x] ICICI API routes configured (`backend/routes/iciciPaymentRoutes.js`)
- [x] GraphQL resolvers for all payment operations
- [x] GraphQL type definitions for payment responses
- [x] Transaction model with complete fields
- [x] Invoice model with payment reconciliation fields
- [x] Secure hash calculation (SHA256) for payment verification
- [x] Callback signature verification

### Frontend Setup
- [x] ICICIPayment component for payment modal
- [x] Billing page with payment status handling
- [x] GraphQL mutations for all payment operations
- [x] Auto-redirect to ICICI secure page
- [x] Payment status notification system
- [x] OTP entry flow (if required)
- [x] Transaction status checking

### Configuration
- [x] Environment variables (.env)
- [x] UAT merchant credentials configured
- [x] Callback URLs properly set
- [x] ICICI API endpoints configured

---

## 🧪 TESTING CHECKLIST

### UAT Testing (Before Production)

#### 1. Initiate Payment Flow
```
[ ] Open http://localhost:25002/billing
[ ] Login as patient
[ ] Click "Pay with ICICI Bank" on an unpaid invoice
[ ] ICICIPayment modal opens
[ ] Click "Initiate Payment"
[ ] Check backend logs for ICICI API call
[ ] Verify response contains redirectURI
[ ] Verify response.apiSuccess = true
```

Expected log:
```
[ICICI] Payload received (Redirect): { merchantId, merchantTxnNo, amount, ... }
```

#### 2. Redirect to ICICI
```
[ ] Modal shows "Redirect to ICICI Secure Page" button
[ ] Click button or wait for auto-redirect (if payType = "0")
[ ] Browser navigates to ICICI secure portal
[ ] URL starts with https://pgpayuat.icici.bank.in/tsp/pg/api/v2/
```

#### 3. Complete Payment (UAT Portal)
```
[ ] ICICI portal shows payment form
[ ] Select payment method (test card, net banking, UPI)
[ ] Enter test credentials
[ ] Complete OTP verification (test mode)
[ ] Click "Confirm Payment"
[ ] ICICI shows "Payment Successful" or similar
```

**Test Cards for UAT:**
- Visa: 4111111111111111 / 12/25 / 123
- MasterCard: 5555555555554444 / 12/25 / 123

#### 4. Callback Received
```
[ ] After payment, browser redirects back to billing page
[ ] URL should be: http://localhost:25002/billing?paymentStatus=SUC&...
[ ] Check backend logs for callback:
    "[ICICI] Payload received (Redirect)"
    "[ICICI] Callback status transition"
    "[ICICI] Payment reconciled to invoice"
```

#### 5. Invoice Updated
```
[ ] Database Transaction record status = "SUC"
[ ] Database Invoice record:
    - status = "Paid" (if full payment)
    - amountPaid = payment amount
    - balance = 0 (if full payment)
    - paymentMethod = "ICICI Bank"
    - paymentDate = now()
[ ] Frontend displays payment status notification
[ ] Billing page refreshes and shows "Paid" status
```

#### 6. Refund Flow
```
[ ] After successful payment, admin can process refund
[ ] Navigate to admin dashboard
[ ] Find transaction → Click "Process Refund"
[ ] Enter refund amount
[ ] Backend calls ICICI refund API
[ ] Transaction updated with refund status
[ ] Invoice adjusted back to "Unpaid" (if fully refunded)
```

---

## 📋 PRODUCTION DEPLOYMENT CHECKLIST

### Before Going Live

#### 1. Get Production Credentials from ICICI
```
[ ] Request production merchant account from ICICI Bank
[ ] Receive:
    - Production Merchant ID
    - Production Secret Key
    - API documentation
[ ] Note: Different from UAT credentials
[ ] Keep credentials in secure vault (not Git)
```

#### 2. Update Environment Configuration
```
# .env (production server only)
ICICI_ENV=production                      # Change from "uat"
ICICI_MERCHANT_ID=<production_id>         # From ICICI
ICICI_SECRET_KEY=<production_secret>      # From ICICI
ICICI_CALLBACK_URL=https://yourdomain.com/api/icici/callback
ICICI_REDIRECT_URL=https://yourdomain.com/billing
```

#### 3. Configure ICICI Merchant Dashboard
```
[ ] Login to ICICI merchant portal
[ ] Register callback URLs:
    - https://yourdomain.com/api/icici/callback
    - https://yourdomain.com/api/icici/webhook
    - https://yourdomain.com/api/icici/response
[ ] Enable production mode
[ ] Test callback with ICICI test tool
[ ] Get approval from ICICI
```

#### 4. Backend Verification (Production)
```
[ ] Test health endpoint:
    curl https://yourdomain.com/api/icici/health
    
[ ] Verify database:
    - Transaction collection exists
    - Invoice collection has payment fields
    
[ ] Test callback signature verification:
    - Verify secureHash calculation correct
    - Test with ICICI test callback
```

#### 5. Frontend HTTPS Verification
```
[ ] All payment pages must be HTTPS
[ ] Check FRONTEND_URL in .env is HTTPS
[ ] Browsers will reject HTTP redirects to ICICI
[ ] Certificate should be valid and trusted
```

#### 6. SSL/TLS for APIs
```
[ ] Backend endpoints must be HTTPS
[ ] ICICI requires secure callback URLs
[ ] Ensure certificate covers your domain
```

#### 7. Monitoring & Logging
```
[ ] Set up payment transaction logging
[ ] Monitor callback processing
[ ] Alert on failed payments
[ ] Track refund requests
[ ] Monitor hash verification failures
```

#### 8. Security Review
```
[ ] Verify secret key not in Git history
[ ] Use environment variables for secrets
[ ] Ensure callback hash verification enabled
[ ] Test fraud detection (if available)
[ ] Verify amount validation
```

#### 9. Load Testing (if applicable)
```
[ ] Test with concurrent payments
[ ] Verify transaction uniqueness (merchantTxnNo)
[ ] Test callback processing under load
[ ] Verify database constraints
```

#### 10. Final Testing
```
[ ] Test end-to-end payment flow on production
[ ] Verify invoice reconciliation works
[ ] Verify refund process works
[ ] Verify status checking works
[ ] Test error scenarios
```

---

## 🔧 TROUBLESHOOTING GUIDE

### Issue: "Redirect URL not available"
**Cause:** ICICI API returned no redirectURI
**Debug:**
```
1. Check backend logs for ICICI API response
2. Verify ICICI_MERCHANT_ID is valid
3. Verify ICICI_SECRET_KEY is correct
4. Check if ICICI service is up
5. Verify network connectivity to ICICI
```

### Issue: Callback Not Received
**Cause:** Backend not getting ICICI callback
**Debug:**
```
1. Verify ICICI_CALLBACK_URL in .env
2. Check if callback endpoint is accessible from ICICI
3. Verify firewall not blocking ICICI IPs
4. Check backend logs for incoming POST requests
5. Test callback manually:
   curl -X POST http://localhost:25000/api/icici/callback \
     -H "Content-Type: application/json" \
     -d '{"merchantTxnNo":"test", "txnStatus":"SUC"}'
```

### Issue: Hash Verification Failed
**Cause:** Payment signature doesn't match
**Debug:**
```
1. Check ICICI_SECRET_KEY matches merchant portal
2. Verify secureHash algorithm (V1 or V2)
3. Check byte encoding (UTF-8)
4. Compare with ICICI's hash calculation
5. Contact ICICI support to verify hash format
```

### Issue: Invoice Not Updated After Payment
**Cause:** Reconciliation didn't execute
**Debug:**
```
1. Check transaction.txnStatus = "SUC"
2. Check transaction.amountPaidApplied (should be > 0)
3. Check invoice.amountPaid updated
4. Check backend logs for "Payment reconciled"
5. Manually reconcile if needed
```

### Issue: Duplicate Transactions
**Cause:** Same payment processed twice
**Debug:**
```
1. Verify merchantTxnNo uniqueness
2. Check database for duplicate transactions
3. Verify idempotency check in reconciliation
4. Check if callback received multiple times
```

---

## 📊 MONITORING QUERIES

### Check Payment Status
```javascript
// MongoDB
db.transactions.find({ 
  createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
})

db.invoices.find({ 
  status: "Paid",
  paymentMethod: "ICICI Bank"
})
```

### Find Failed Payments
```javascript
db.transactions.find({ 
  txnStatus: { $in: ["REJ", "ERR"] }
})
```

### Check Refunds
```javascript
db.transactions.find({ 
  refundStatus: { $exists: true }
})
```

---

## 📝 NOTES

- Keep .env secrets secure (never commit to Git)
- UAT merchant credentials are for testing only
- Production credentials must be obtained from ICICI
- All payment transactions are logged in MongoDB
- Callback URL must be publicly accessible
- Use HTTPS in production (required by ICICI)
- Test thoroughly before going live

---

## 🚀 QUICK START (DEV MODE)

1. **Ensure .env is configured with UAT credentials**
   ```
   ICICI_ENV=uat
   ICICI_MERCHANT_ID=100000000007164
   ICICI_SECRET_KEY=db06cca0-838b-4e01-8b20-6ac446ffb6bd
   ```

2. **Start backend server**
   ```
   cd backend
   npm install
   npm start
   ```

3. **Start frontend server**
   ```
   cd frontend
   npm install
   npm run dev
   ```

4. **Create test invoice**
   - Login as admin
   - Go to Billing
   - Create invoice for patient
   - Note invoice amount

5. **Test payment**
   - Login as patient
   - Go to Billing
   - Click "Pay with ICICI Bank"
   - Enter amount and click "Initiate Payment"
   - Redirect to ICICI portal
   - Complete payment with test card

6. **Verify**
   - Check backend logs for callback
   - Verify invoice status = "Paid"
   - Verify transaction in database

---

Generated: 2026-08-18
Last Updated: After payment gateway integration review

# 🔧 ICICI Hash Mismatch - Debugging Guide

## Current Status
✅ Aggregator ID now correctly included in payload
✅ API connectivity working (Status 200 response)
❌ Secure hash mismatch - ICICI rejecting hash calculation

## Error Response
```
{
  "responseCode": "P1006",
  "responseDescription": "Invalid request: Secure hash does not match",
  "aggregatorID": "A100000000007164",
  "merchantId": "100000000007164",
  "secureHash": null
}
```

## What This Means
- ✅ ICICI API received our request
- ✅ Aggregator ID is now present (fixed!)
- ❌ The secure hash calculation doesn't match ICICI's expectation

## Common Hash Calculation Issues

### 1. Field Order Wrong
The official spec says this exact order:
```
addlParam1 | addlParam2 | aggregatorID | amount | currencyCode | 
customerEmailID | customerMobileNo | customerName | merchantId | 
merchantTxnNo | payType | returnURL | transactionType | txnDate
```

Current test: ✅ Matching this order

### 2. Empty Field Handling
**Issue:** How to handle fields that are empty?

**Options:**
- A) Include empty string: `field|` (pipe with nothing between)
- B) Skip empty fields completely
- C) Include "0" or null

Current: A) Including empty strings

### 3. Field Inclusion
**Question:** Which fields should be included?
- Only fields that have values?
- All 14 fields in order?
- Only specific fields?

Current: All 14 fields in order

### 4. Encoding/Escaping
**Issue:** Special characters in fields?

Current: No special encoding (raw strings)

### 5. Delimiter
**Issue:** What joins the fields?
- | (pipe) character?
- No delimiter?
- Custom separator?

Current: No delimiter (direct concatenation)

## Solution Steps

### Step 1: Verify Against ICICI Email
From the ICICI email, the hash calculation example should show:
- Exact field order
- Exact delimiter
- Treatment of empty fields
- Example calculation

### Step 2: Extract ICICI Specification
From the PDF: `Gateway_Interface_Specification_V0.4_Orange_PG.pdf`
Look for section on:
- Secure Hash Generation
- Field Order
- Field Names (check if exactly "aggregatorID" or "aggregatorId")
- Example Hash Calculation

### Step 3: Test with ICICI Example
If ICICI provides:
```
Example Input: [field values]
Expected Hash: [hash value]
```

Then verify our hash calculation produces that exact output.

### Step 4: Field Name Variations
The spec might use different names:
- `aggregatorID` vs `aggregatorId` (case)
- `returnURL` vs `returnUrl` vs `redirectURL`
- `customerEmailID` vs `customerEmail` vs `email`

Current field names in payload:
```javascript
{
  merchantId,
  aggregatorID,
  merchantTxnNo,
  amount,
  currencyCode,
  transactionType,
  txnDate,
  customerEmailID,
  customerMobileNo,
  customerName,
  payType,
  addlParam1,
  addlParam2,
  returnURL,
}
```

### Step 5: ICICI Support Contact
If cannot resolve:
```
Soumyadip Kar: soumyadip.kar@icici.bank.in
Mohd Abdul: mohd.abdu@icici.bank.in  
Khamaruddin Shaik: khamaruddin.shaik@icici.bank.in (9653655391)
ICICI Integration: msintegration@icici.bank.in
```

Ask for:
- Hash calculation example with exact values
- Field names exactly as they appear in specification
- Field order confirmation
- Empty field handling specification

## Action Items

1. **Read ICICI PDF**: Extract `Gateway_Interface_Specification_V0.4_Orange_PG.pdf`
   - Find Secure Hash section
   - Note exact field order
   - Note field names (case-sensitive)

2. **Test Hash Function**: Once spec confirmed
   - Update test script with exact algorithm
   - Test with ICICI example values
   - Verify before moving to backend

3. **Contact ICICI**: If still failing
   - Send: Current payload, calculated hash, ICICI response
   - Ask: Example hash calculation with exact field values
   - Reference: Merchant ID 100000000007164

## Temporary Workaround (If Needed)

While debugging, can manually test by:
1. Getting example from ICICI support
2. Hardcoding their exact payload + hash
3. Sending to verify API accepts it
4. Then reverse-engineer from working example

## Current Test Payload (for ICICI Support)
```
Merchant ID: 100000000007164
Aggregator ID: A100000000007164
Merchant Txn No: CD17870482635581216
Amount: 100.00
Currency Code: 356
Customer Email: test@example.com
Customer Mobile: 9999999999
Customer Name: Test Customer
Pay Type: 0
Txn Date: 20260818154743
Return URL: http://localhost:25000/api/icici/response

Calculated Hash (per field order above):
000000A100000000007164100.00356test@example.com9999999999Test Customer100000000007164CD1787048263558121621...
Hashed: b2d8b1e79b3f0b925f9e09673fd2003ec188a5a30cb373e787c9fe841f90d3a1

Error Response: "Invalid request: Secure hash does not match"
```

---

**Next:** Review ICICI PDF specification for exact hash algorithm details.

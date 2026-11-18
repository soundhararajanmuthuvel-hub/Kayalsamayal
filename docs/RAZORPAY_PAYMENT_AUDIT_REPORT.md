# Kayal Samayal — Complete Razorpay Payment System Bug Audit Report

**Audit Target**: Kayal Samayal E-Commerce Web Application  
**Production Site**: [https://www.kayalsamayal.in](https://www.kayalsamayal.in)  
**Repository**: [https://github.com/soundhararajanmuthuvel-hub/Kayalsamayal](https://github.com/soundhararajanmuthuvel-hub/Kayalsamayal)  
**Branch**: `feature/sheet-coupon-sync` (Commit: `61c98f3`)  
**Audit Role**: Senior Razorpay Payment Integration Engineer & Next.js Backend Security Auditor  
**Mode**: **AUDIT FIRST (Read-Only Forensic Inspection — Zero Code Changes Applied)**

---

## Executive Summary

A comprehensive, forensic audit of the entire payment processing pipeline was conducted across Next.js API endpoints, frontend checkout scripts, the Razorpay SDK integration, webhook handlers, and Google Apps Script (`Code.gs`) sheet persistence.

### Key Audit Findings:
1. **Critical Protocol & Field Mismatch between Next.js and Google Apps Script**:
   - `src/lib/api.ts` (`confirmRazorpayOrder`) submits:
     `{ action: "confirmRazorpayOrder", razorpayOrderId: ..., razorpayPaymentId: ... }`.
   - `google-apps-script/Code.gs` does **not** recognize the action `"confirmRazorpayOrder"`, falling through to its generic row parser that expects `payload.paymentId` or `payload.payment_id`.
   - Because `razorpayPaymentId` is passed instead of `paymentId`, Google Apps Script rejects every server-side confirmation with:
     `"Missing required field: payment_id is required to record order."`
   - Consequently, server-side payment confirmation fails 100% of the time, falling back to client-side direct writes (`saveOrderToGoogleSheets`). If the customer closes their browser or loses connectivity right after paying, the order is **never written to Google Sheets**.
2. **Investigation of `"Unauthorized order confirmation: Invalid authentication token"`**:
   - In earlier versions of `google-apps-script/Code.gs` (commit `ab8d13e`), an explicit `confirmRazorpayOrder` handler validated `serverAuthToken` using `SERVER_AUTH_SECRET`.
   - When `SERVER_AUTH_SECRET` was absent or mismatched between Vercel and Google Apps Script Script Properties, Google Apps Script threw the exact error:
     `"Unauthorized order confirmation: Invalid authentication token."` (step: `"Server Authentication Validation"`).
   - In the latest `Code.gs`, that handler was removed, but Next.js routes (`verify-payment/route.ts` and `webhook/route.ts`) still compute and require `SERVER_AUTH_SECRET`.
3. **Action Collision on `createOrder` (COD Orders)**:
   - In `Code.gs` line 1042, `action === "createOrder"` routes to `handleServerOrderCreation`, which makes an HTTP request to Razorpay's API `https://api.razorpay.com/v1/orders`.
   - When `/api/orders/cod` calls `createOrder` with `paymentMethod: "Cash on Delivery"`, Google Apps Script tries to create a Razorpay order instead of saving a COD order to Google Sheets!
4. **Zero Automatic Inventory Deduction**:
   - In `google-apps-script/Code.gs`, orders recorded in the "Orders" tab do **not** decrement product stock in the "Products" tab. Stock updates only occur via manual admin adjustments.
5. **Authoritative Pricing & Coupon Rounding (Verified)**:
   - The pricing engine (`calculateOrderTotals` & `calculateCouponDiscount`) reliably recomputes totals on the server.
   - For Subtotal ₹560 with coupon `HI` (99% discount, ₹779 cap):
     Discount = `Math.round((560 * 99) / 100) = ₹554`. Grand Total = `₹6`.
     Razorpay amount = `600 paise`.
     Matches the single source of truth and prevents client-side price tampering.

---

## 1. Master Audit Matrix

| Module | Status | Identified Issue | Severity | Vercel Deploy | GAS Deploy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Razorpay Authentication** | **SECURE / WARN** | Hardcoded test key fallback in checkout frontend if env var unset; Live/Test prefix check logged safely. | **Low** | Yes | No |
| **Order Creation** | **DEFECT** | `createPendingOrder` sends `{ action: "createPendingOrder" }` without `orderId`; GAS rejects it, so no pending order exists in Sheets before payment. | **Medium** | Yes | Yes |
| **Payment Verification** | **CRITICAL** | `confirmRazorpayOrder` payload uses `razorpayPaymentId` instead of `paymentId`; GAS rejects write; server falls back to client write. If `SERVER_AUTH_SECRET` is unset on Vercel, returns HTTP 500 after payment capture. | **Critical** | Yes | Yes |
| **Webhook Endpoint** | **CRITICAL** | Raw body HMAC verification is correct, but webhook calls `confirmRazorpayOrder`, which fails to persist in GAS due to field mismatch. Fails as an automated fallback. | **Critical** | Yes | Yes |
| **Google Apps Script Auth** | **HIGH** | Legacy `"Unauthorized order confirmation: Invalid authentication token"` occurred due to missing/mismatched `SERVER_AUTH_SECRET` in Script Properties. | **High** | Yes | Yes |
| **Google Sheets Persistence** | **HIGH** | Online payments rely exclusively on client-side browser write (`saveOrderToGoogleSheets`); dual-write race condition exists for COD orders. | **High** | Yes | Yes |
| **Coupon & Pricing Math** | **VERIFIED** | Server re-evaluates all cart items and coupons. Subtotal ₹560 with `HI` (99%) correctly yields discount ₹554 and grand total ₹6. Zero-total policy enforces ₹1 minimum for coupon orders. | **Verified** | No | No |
| **Cash on Delivery (COD)** | **HIGH** | `/api/orders/cod` sends `{ action: "createOrder" }` which triggers Razorpay order creation on GAS instead of appending a COD order. Saved only because client also executes secondary write. | **High** | Yes | Yes |
| **Inventory Deduction** | **HIGH** | `Code.gs` does not deduct stock upon order placement. Stock is only updated via manual admin inventory adjustments. | **High** | No | Yes |
| **Order Confirmation UI** | **SECURE** | Client retains order context; displays payment ID, status, and printable invoice even under recovery mode. | **Verified** | No | No |

---

## 2. Deep-Dive Forensic Inspection by Module

### 2.1 Razorpay Authentication & Credentials
- **File**: [`src/app/api/razorpay/create-order/route.ts`](file:///d:/kayalsamayal/src/app/api/razorpay/create-order/route.ts#L124-L156)
- **File**: [`src/app/checkout/page.tsx`](file:///d:/kayalsamayal/src/app/checkout/page.tsx#L24-L26)
- **Inspection Findings**:
  1. `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are read using `process.env` on the server and sanitized against surrounding quotes:
     `rawKeySecret.trim().replace(/^["']|["']$/g, "").trim()`
  2. Basic Authentication header is constructed as:
     `"Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64")`
  3. **No secret exposure in frontend**: `RAZORPAY_KEY_SECRET` is never passed to client components and is never prefixed with `NEXT_PUBLIC_`.
  4. **Key Id fallback risk**: In `src/app/checkout/page.tsx` line 25:
     `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_XXXXXXXXXXXXXXX";`
     While `create-order/route.ts` sends down the authoritative `keyId` in the API response, if `orderData.keyId` is missing, checkout falls back to an invalid test placeholder.
  5. **Endpoint**: All outbound calls target the official endpoint `https://api.razorpay.com/v1/orders`.

---

### 2.2 Payment Verification & Signature Checking
- **File**: [`src/app/api/razorpay/verify-payment/route.ts`](file:///d:/kayalsamayal/src/app/api/razorpay/verify-payment/route.ts#L82-L103)
- **Inspection Findings**:
  1. **HMAC SHA-256 Verification**:
     Constructs signature body as `${serverStoredRazorpayOrderId}|${razorpay_payment_id}` using the server-signed order token's Order ID (not the client's input).
  2. **Timing Attack Protection**:
     Uses `crypto.timingSafeEqual(sigBuf, expBuf)` with matching buffer lengths.
  3. **Gateway Verification**:
     Fetches payment entity from `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`.
     Validates `currency === "INR"`, `amount === calc.amountInPaise`, and `order_id === serverStoredRazorpayOrderId`.
  4. **Auto-Capture Logic**:
     If payment is `"authorized"`, it issues a POST to `/v1/payments/${id}/capture`.
  5. **Vulnerability in Server Auth Secret Gate**:
     Lines 302–316:
     ```typescript
     const rawAuthSecret = process.env.SERVER_AUTH_SECRET;
     if (!serverAuthSecret) {
       return NextResponse.json({ success: false, error: "Payment was verified with gateway, but order database authentication is not configured on the server..." }, { status: 500 });
     }
     ```
     If `SERVER_AUTH_SECRET` is not set on Vercel, the route aborts with HTTP 500 **after payment has already been captured from the customer's card/UPI**.

---

### 2.3 Razorpay Webhook Endpoint
- **File**: [`src/app/api/razorpay/webhook/route.ts`](file:///d:/kayalsamayal/src/app/api/razorpay/webhook/route.ts#L7-L45)
- **Inspection Findings**:
  1. **Raw Body Handling**: Reads raw request body using `await req.text()` before JSON parsing.
  2. **Signature Validation**: Computes HMAC SHA-256 against `RAZORPAY_WEBHOOK_SECRET` and checks with `crypto.timingSafeEqual`.
  3. **Event Handling**: Correctly catches `payment.failed`, `payment.captured`, and `order.paid`.
  4. **Flaw in Webhook Persistence**:
     Line 112 calls `confirmRazorpayOrder`. Because `confirmRazorpayOrder` passes `razorpayPaymentId` (which `Code.gs` rejects), the webhook fails to record the order in Google Sheets if the browser does not submit it.

---

### 2.4 Google Apps Script Integration & Root Cause of Historical Error
- **File**: [`google-apps-script/Code.gs`](file:///d:/kayalsamayal/google-apps-script/Code.gs#L1072-L1158)
- **File**: [`src/lib/api.ts`](file:///d:/kayalsamayal/src/lib/api.ts#L454-L485)
- **Error Under Investigation**:
  `"Unauthorized order confirmation: Invalid authentication token."`

#### Forensic Analysis:
1. In git commit `ab8d13e`, `Code.gs` contained:
   ```javascript
   function confirmRazorpayOrder(ss, data) {
     var serverAuthToken = data.serverAuthToken || "";
     var expectedBytes = Utilities.computeHmacSha256Signature(
       "KAYAL_ORDER_AUTH:" + razorpayOrderId + ":" + razorpayPaymentId,
       secretToTest
     );
     ...
     if (!isSigValid) {
       return {
         success: false,
         error: "Unauthorized order confirmation: Invalid authentication token.",
         step: "Server Authentication Validation"
       };
     }
   }
   ```
2. **Root Cause of Error**:
   - Vercel generated `serverAuthToken` using `process.env.SERVER_AUTH_SECRET`.
   - The deployed Google Apps Script did not have `SERVER_AUTH_SECRET` in `Script Properties` (or had a mismatched value).
   - `safeStringCompare` failed, throwing the exact error.
3. **Current State**:
   - The explicit `confirmRazorpayOrder` function was removed in commit `05e3517`, but `src/lib/api.ts` still sends `action: "confirmRazorpayOrder"`.
   - In the current `Code.gs`, any unrecognized action falls into the generic order write block at line 1058, which fails because `payload.payment_id` is missing.

---

### 2.5 Order Creation & Payment Lifecycle Audit

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Checkout Form Submit (cart, customer, coupon)                                       │
│    └─► /api/razorpay/create-order                                                      │
│        ├─ Authoritative calculation (subtotal, coupon, gst, shipping)                  │
│        ├─ Create Razorpay Gateway Order (POST https://api.razorpay.com/v1/orders)      │
│        ├─ Attempt createPendingOrder ──► [FAIL: GAS rejects missing order_id]          │
│        └─ Sign & return orderToken                                                     │
│                                                                                        │
│ 2. Customer Completes Modal Payment                                                    │
│    └─► /api/razorpay/verify-payment                                                    │
│        ├─ Validate orderToken & HMAC SHA-256 signature                                 │
│        ├─ Verify payment entity on Razorpay API (INR, captured, amount match)          │
│        ├─ Attempt confirmRazorpayOrder ─► [FAIL: GAS rejects missing payment_id]       │
│        └─ Server activates Recovery Fallback: returns { success: true, recovered: true }│
│                                                                                        │
│ 3. Browser Receives Recovery Success                                                   │
│    └─► Browser executes direct saveOrderToGoogleSheets() ──► [SUCCESS: Row written]    │
│        (Vulnerability: Order lost if browser tab closes before this step executes)     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 2.6 Coupon & Pricing Calculations

Empirical tests executed against the calculation engine:

#### Test 1: Coupon `HI` (99% Discount, Maximum Cap ₹779)
- **Cart**: A.B.C. Malt × 2 (₹360) + Kayal Keerai Podi Premium × 2 (₹200) = **₹560 Subtotal**.
- **Calculation**:
  `Discount = Math.round((560 * 99) / 100) = Math.round(554.4) = ₹554`.
  `Max Cap Check`: `min(554, 779) = ₹554`.
  `Zero-Total Policy`: `min(554, 560 - 1) = ₹554`.
  `Shipping`: Free (Subtotal ₹560 ≥ ₹500 free shipping threshold).
  `Grand Total`: `560 - 554 = ₹6`.
  `Razorpay Amount`: `600 paise`.
- **Status**: **VERIFIED** (Accurate across cart drawer, checkout, and server route).

#### Test 2: Standard Percentage Coupon (`WELCOME10` — 10%, Cap ₹100, Min ₹299)
- **Subtotal**: ₹600.
- **Calculation**: Discount = ₹60, Grand Total = ₹540 (54,000 paise).
- **Status**: **VERIFIED**.

#### Test 3: Fixed Rupee Coupon (`FLAT50` — Fixed ₹50, Min ₹300)
- **Subtotal**: ₹400 + ₹60 Shipping = ₹460.
- **Calculation**: Discount = ₹50, Grand Total = ₹410.
- **Status**: **VERIFIED**.

#### Test 4: 100% Discount / Zero-Total Order
- **Subtotal**: ₹560.
- **Calculation**: Enforces Zero-Total Policy (`subtotal - 1`), yielding Discount ₹559 and Grand Total ₹1.
- **Status**: **VERIFIED** (Razorpay requires minimum ₹1).

---

### 2.7 Security, Idempotency & Replay Protection
1. **Payment Replay**:
   `Code.gs` lines 1216–1234 check whether `paymentId` already exists in column C of the "Orders" tab. Duplicate writes return `{ success: true, duplicate: true }` without inserting a second row.
2. **Order Tampering**:
   Client-supplied `frontendTotal` and `discount` are ignored. Razorpay order is initialized strictly with the server's authoritative `amountInPaise`.
3. **Invalid Signature**:
   If an invalid signature is presented, `verify-payment/route.ts` immediately returns HTTP 400 (`"Invalid payment signature"`).

---

## 3. Recommended Remediation Plan

> [!IMPORTANT]
> Per audit instructions, no code changes have been applied. The following steps constitute the exact recommended engineering remediation to be executed upon user approval.

### Remediation Step 1: Align Field Names in `src/lib/api.ts`
In [`src/lib/api.ts`](file:///d:/kayalsamayal/src/lib/api.ts#L454-L475), ensure `confirmRazorpayOrder` passes standard order fields that `Code.gs` expects:
```typescript
const payload = {
  action: "confirmRazorpayOrder",
  order_id: data.razorpayOrderId,
  payment_id: data.razorpayPaymentId,
  orderId: data.razorpayOrderId,
  paymentId: data.razorpayPaymentId,
  status: "Paid",
  amount: data.razorpayAmount,
  ...data,
};
```

### Remediation Step 2: Implement Dedicated `confirmRazorpayOrder` Handler in `Code.gs`
In [`google-apps-script/Code.gs`](file:///d:/kayalsamayal/google-apps-script/Code.gs#L1040), add an explicit handler for `action === "confirmRazorpayOrder"`:
```javascript
if (action === "confirmRazorpayOrder") {
  // Support both server-token and direct payment verification
  return jsonResponse(handleConfirmRazorpayOrder(ss, payload));
}
```
This ensures both the Next.js server verification route and the Razorpay Webhook can persist orders independently of the browser client.

### Remediation Step 3: Fix COD Action Collision in `Code.gs`
In [`google-apps-script/Code.gs`](file:///d:/kayalsamayal/google-apps-script/Code.gs#L1042):
Change:
```javascript
if (action === "createOrder") {
  if (payload.paymentMethod === "Cash on Delivery" || payload.isCod) {
    // Proceed to append COD order to Orders tab
  } else {
    return jsonResponse(handleServerOrderCreation(payload));
  }
}
```

### Remediation Step 4: Add Automatic Stock Decrement on Order Save
In `google-apps-script/Code.gs` line 1373 (after `ordersSheet.appendRow(newRow)`):
Loop through the parsed line items, locate the product in the "Products" tab by Product ID or Name, and decrement the `Stock` column value atomically inside the existing `LockService` block.

### Remediation Step 5: Vercel & Google Apps Script Environment Verification
Confirm the following environment variables are identical:
- **Vercel Project Settings**:
  - `RAZORPAY_KEY_ID`: Live key (`rzp_live_...`)
  - `RAZORPAY_KEY_SECRET`: Live secret
  - `RAZORPAY_WEBHOOK_SECRET`: Secret configured in Razorpay Dashboard > Webhooks
  - `NEXT_PUBLIC_KAYAL_API_URL`: Current deployed Web App URL (`.../exec`)
- **Google Apps Script Script Properties**:
  - `KEY_ID`: Live key (`rzp_live_...`)
  - `KEY_SECRET`: Live secret
  - `SPREADSHEET_ID`: `1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc`

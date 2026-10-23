# Kayal Samayal - E-Commerce Website & Order Management

Kayal Samayal is a full-stack e-commerce web platform for authentic, hand-ground traditional Tamil Nadu spices, masalas, podis, and health mixes.

---

## Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide React, Framer Motion
- **Payments**: Razorpay Gateway (UPI, Net Banking, Credit/Debit Cards, Cash on Delivery)
- **Database & Order Storage**: Google Sheets via Google Apps Script Web App (`Code.gs`)
- **Hosting**: Vercel / Node.js

---

## Test Payment Guide (Agent & Developer Testing)

The checkout system operates in **TEST MODE ONLY** using verified Razorpay test credentials. A prominent **"TEST MODE"** badge is displayed on the checkout banner and payment step to clarify that no real money is charged.

### 1. Test Gateway Credentials

#### Credit / Debit Card (Standard Success)
- **Card Number**: `4111 1111 1111 1111`
- **Cardholder Name**: Any name (e.g., `Soundhar Muthuvel`)
- **Expiry Date**: Any future month and year (e.g., `12/28`)
- **CVV**: Any 3 digits (e.g., `123`)
- **OTP**: Any 4 or 6 digits (e.g., `1234` or `123456`) or click the **"Success"** button on the Razorpay simulated bank screen.

#### UPI Testing
- **Virtual Payment Address (VPA)**: `success@razorpay`
- Or select QR code / Intent in the Razorpay popup and click **"Simulate Success"**.

#### Testing Payment Failures & Declines
- In the Razorpay OTP authentication screen, click **"Failure"** to test payment decline.
- The checkout page will catch `payment.failed`, preserve all customer cart details, and display a clear error message with a **"Retry Payment"** button.

#### Testing Popup Cancellation
- Click the **✕** button on the Razorpay checkout modal or click outside the modal.
- The checkout page catches `modal.ondismiss`, keeps the cart intact, and presents a friendly message: *"Payment window was closed before completion. Your cart is preserved. Click 'Retry Payment' to proceed."*

---

### 2. Steps to Verify That a Row Appears in the Google Sheet

1. Add one or more spice products to the cart from the storefront.
2. Proceed to **Checkout** (`/checkout`).
3. Fill in the shipping details (Name, 10-digit mobile number, address, city, pincode).
4. Select **Pay Online via Razorpay** and click **Pay ₹... Securely**.
5. Use test card `4111 1111 1111 1111` and complete the OTP screen by clicking **Success**.
6. When the popup closes, observe the in-page **Confirmation Screen**:
   - Status transitions from *"Saving your order to database..."* to *"Order saved to database"*.
   - **Order ID** (e.g., `order_...` or `KS-...`) and **Payment ID** (e.g., `pay_...`) are clearly displayed with one-click copy buttons.
7. Open the connected Google Sheet and navigate to the **"Orders"** tab.
8. Verify that a new row has been appended with the following 16 columns:
   | Column # | Column Name | Sample Value |
   | :--- | :--- | :--- |
   | 1 | **Timestamp** | `2026-10-22T14:30:00.000Z` |
   | 2 | **Order ID** | `order_Tqyn4hcM2Z5yqH` |
   | 3 | **Payment ID** | `pay_Tqyn87aBcDeFgH` |
   | 4 | **Status** | `Paid` |
   | 5 | **Amount** | `480` |
   | 6 | **Currency** | `INR` |
   | 7 | **Customer Name** | `Soundhar Muthuvel` |
   | 8 | **Phone** | `9003860616` |
   | 9 | **Email** | `customer@example.com` |
   | 10 | **Address** | `123 Spice Garden, Tirupattur, Tamil Nadu - 635601` |
   | 11 | **Items/Notes** | `Kayal Curry Masala (x2), Kalari Masala (x1)` |
   | 12 | **Signature Verified** | `Yes` |
   | 13 | **Coupon Code** | `WELCOME10` |
   | 14 | **Subtotal** | `530` |
   | 15 | **Discount** | `50` |
   | 16 | **Final Amount** | `480` |

---

## Google Sheet Coupons (Single Source of Truth)

The Google Sheet is the **authoritative single source of truth** for all coupon codes, discount amounts, minimum order rules, and usage limits.
- When an administrator adds, updates, disables, or deletes a coupon in the **"Coupons"** tab, the storefront reflects the changes immediately on the very next coupon check.
- **No website code change and no redeployment is required.**
- No coupons are hardcoded anywhere in the website codebase.

### 1. "Coupons" Sheet Tab Columns

The **"Coupons"** tab must have the following header row (case-insensitive column lookups):

| Column Name | Type | Description & Examples |
| :--- | :--- | :--- |
| **Code** | String | Coupon code (e.g. `WELCOME10`, `FLAT50`, `FESTIVE100`). Case-insensitive and trimmed. |
| **Description** | String | Short promotional description shown to customers (e.g. `10% off on your spice order`). |
| **Type** | String | Discount calculation model: `PERCENT` (or `PERCENTAGE`) or `FLAT`. |
| **Value** | Number | Discount value: e.g. `10` for 10% discount, or `50` for flat ₹50 off. |
| **MinOrder** | Number | Minimum cart subtotal required to use this coupon (e.g. `200` or `0` for no minimum). |
| **MaxDiscount** | Number | Maximum discount cap in ₹ for PERCENT coupons (e.g. `100`). Set to `0` or blank for no cap. |
| **StartDate** | Date/String | Optional start date (`YYYY-MM-DD`). Active from 00:00:00 Asia/Kolkata. |
| **EndDate** | Date/String | Optional expiry date (`YYYY-MM-DD`). Active through 23:59:59 Asia/Kolkata. |
| **UsageLimit** | Number | Maximum total lifetime uses across all customers (e.g. `100`). Set `0` for unlimited. |
| **UsedCount** | Number | Auto-incremented count of completed paid orders using this coupon. Start at `0`. |
| **PerCustomerLimit** | Number | Maximum uses allowed per customer phone or email (e.g. `1`). Set `0` for unlimited. |
| **Active** | Boolean | Set to `TRUE` to enable, or `FALSE` to immediately disable without deleting. |

### 2. Auto-Seeded Sample Coupons

When the Apps Script runs for the first time, if the "Coupons" sheet is missing or empty, it automatically creates the headers and seeds 3 initial rows:

1. **`WELCOME10`**: `10% off on your order` | Type: `PERCENT` | Value: `10` | MinOrder: `200` | MaxDiscount: `100` | UsageLimit: `100` | Active: `TRUE`
2. **`FLAT50`**: `Flat ₹50 off` | Type: `FLAT` | Value: `50` | MinOrder: `300` | MaxDiscount: `50` | UsageLimit: `50` | Active: `TRUE`
3. **`EXPIRED5`**: `Expired sample coupon` | Type: `PERCENT` | Value: `5` | MinOrder: `100` | Active: `FALSE`

### 3. Managing Coupons in Google Sheets

- **Add a Coupon**: Simply insert a new row at the bottom of the "Coupons" tab, fill out the columns, set `UsedCount` to `0`, and set `Active` to `TRUE`.
- **Edit a Coupon**: Update any cell (e.g. change `Value` from `10` to `15` or `MaxDiscount` from `100` to `150`). The Next.js API uses `cache: "no-store"` and immediately uses the new values.
- **Deactivate a Coupon**: Change `Active` from `TRUE` to `FALSE`. The website will instantly reject attempts to apply the code with: *"This coupon is no longer active"*.
- **Delete a Coupon**: Right-click the row in Google Sheets and select **Delete row**. Subsequent checks will report *"Invalid coupon code"*.

### 4. Atomic Concurrency & Pre-Payment Check

- **Pre-Payment Lock & Validation**: Right before opening the Razorpay payment window, the storefront performs a real-time check against `/api/coupon`. If the coupon expired or reached its limit, the checkout stops, clears the discount, updates the grand total, and blocks payment.
- **Atomic Concurrency Guarantee**: Inside Google Apps Script, `LockService.getScriptLock()` prevents race conditions. When a payment is verified, `UsedCount` is incremented atomically. Duplicate payments or tampered signatures will never increment `UsedCount`.
- **Minimum Payable Rule**: All payable orders sent to the Razorpay gateway maintain a minimum total of ₹1 (or ₹0 for 100% discount free orders via `/api/orders/free`).

---

### 3. How to Switch to LIVE Mode Later

1. Obtain your live API keys from the [Razorpay Dashboard](https://dashboard.razorpay.com/#/access/api-keys).
2. In `.env.local` (and your production hosting environment / Vercel):
   ```env
   RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
   ```
3. In `src/app/checkout/page.tsx`:
   - Update `RAZORPAY_KEY_ID` to reference your live key (it automatically reads from `process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID`).
   - The `IS_TEST_MODE` indicator automatically turns off once the key does not start with `rzp_test_`.
4. In Google Apps Script Project Settings:
   - Go to **Project Settings** (⚙️) > **Script Properties**.
   - Update `KEY_SECRET` to your live Razorpay Key Secret.

---

## Google Apps Script Setup Guide

Follow these steps to deploy the backend order persistence script:

1. **Create or Open the Sheet**:
   - Open your Google Sheet (e.g. named *"Kayal Samayal Orders"*).
2. **Open Apps Script Editor**:
   - Click **Extensions** > **Apps Script**.
3. **Paste Code**:
   - Replace the entire content of `Code.gs` with the code in `google-apps-script/Code.gs`.
4. **Set Script Properties**:
   - Click **Project Settings** (gear icon ⚙️ on the left menu).
   - Scroll down to **Script Properties** and click **Add script property**:
     - `KEY_SECRET` : Your Razorpay Key Secret (e.g. `YOUR_KEY_SECRET` for test mode).
     - `KEY_ID` : Your Razorpay Key ID (`rzp_test_XXXXXXXX`).
     - `SPREADSHEET_ID` : (Optional if the script is bound to the sheet; enter Spreadsheet ID if standalone).
5. **Deploy as Web App**:
   - Click **Deploy** (top right) > **New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - **Description**: `Kayal Samayal Orders Web App`
   - **Execute as**: `Me (your Google account)`
   - **Who has access**: `Anyone` *(Crucial: Allows the website storefront to post payment data without authentication errors)*.
   - Click **Deploy** and authorize permissions when prompted.
6. **Copy and Configure Web App URL**:
   - Copy the deployed Web App URL (format: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`).
   - Set `NEXT_PUBLIC_KAYAL_API_URL` in `.env.local` to this URL.

### How to Redeploy Apps Script While Keeping the Same URL
When updating `Code.gs` in the future, do NOT create a new deployment (which creates a new URL). Instead:
1. Open the Google Apps Script project.
2. Click **Deploy** (top right) > **Manage deployments**.
3. Select the active deployment from the list on the left.
4. Click the **Edit** (pencil ✏️) icon in the top-right corner of the dialog.
5. In the **Version** dropdown, select **New version**.
6. (Optional) Enter a brief description of what changed (e.g., *"Harden amount validation"*).
7. Click **Deploy**.
8. The existing Web App URL remains unchanged, and your storefront will immediately use the updated logic without needing code or env changes!

---

## Going Live Checklist (Production Readiness)

Before enabling real online payments for customers, complete every item in this checklist:

- [ ] **Generate Live Razorpay Credentials**:
  - Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/#/access/api-keys).
  - Switch to **Live Mode** in the top navigation bar.
  - Generate a new Live API Key pair (`rzp_live_...` and live secret).
- [ ] **Set Server Environment Variables** (Vercel / Hosting Provider):
  - `RAZORPAY_KEY_ID`: `rzp_live_XXXXXXXX`
  - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: `rzp_live_XXXXXXXX`
  - `RAZORPAY_KEY_SECRET`: `YOUR_LIVE_KEY_SECRET`
  - `SERVER_AUTH_SECRET`: Set to your live secret or high-entropy salt
  - `NEXT_PUBLIC_KAYAL_API_URL`: Your deployed Apps Script Web App URL
- [ ] **Update Google Apps Script Properties**:
  - Open Apps Script > **Project Settings** (⚙️) > **Script Properties**.
  - Update `KEY_SECRET` to your live Razorpay secret.
  - Update `KEY_ID` to your live Razorpay key ID (`rzp_live_...`).
  - Verify `SPREADSHEET_ID` is set if using a standalone script.
- [ ] **Confirm Test Mode Badge is Hidden**:
  - Visit `/checkout` on production.
  - Verify that the amber *"Test Mode (Simulated Gateway)"* badge is **NOT** present.
- [ ] **Run a Real ₹1 Transaction**:
  - Place a test order for a live product (or a ₹1 test coupon order).
  - Complete payment using UPI / net banking with real money.
  - Verify that the in-page confirmation shows **"Payment Successful"** with green badge.
  - Verify that the order row appears in Google Sheets with `Signature Verified = Yes`.
  - Issue a test refund from the Razorpay Dashboard to return the funds.
- [ ] **Configure Razorpay Webhooks (Optional for redundancy)**:
  - Add webhook URL: `https://www.kayalsamayal.in/api/razorpay/webhook`
  - Events: `payment.captured`, `order.paid`
  - Set `RAZORPAY_WEBHOOK_SECRET` in server environment.

---

## Local Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run production build validation
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the website.

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
8. Verify that a new row has been appended with the following 17 columns:
   | Column # | Column Name | Sample Value | Description |
   | :--- | :--- | :--- | :--- |
   | 1 | **Timestamp** | `2026-10-22T14:30:00.000Z` | Order creation timestamp (ISO 8601) |
   | 2 | **Order ID** | `order_Tqyn4hcM2Z5yqH` | Razorpay order ID or KS-Free ID |
   | 3 | **Payment ID** | `pay_Tqyn87aBcDeFgH` | Razorpay payment ID (or FREE_ORDER) |
   | 4 | **Status** | `Paid` | Payment status (Paid / COD Placed) |
   | 5 | **Amount** | `480` | Total charged to customer in ₹ |
   | 6 | **Currency** | `INR` | Transaction currency |
   | 7 | **Customer Name** | `Soundhar Muthuvel` | Customer full name |
   | 8 | **Phone** | `9003860616` | Contact phone number |
   | 9 | **Email** | `customer@example.com` | Customer email |
   | 10 | **Address** | `123 Spice Garden, Tirupattur, Tamil Nadu - 635601` | Shipping address |
   | 11 | **Items/Notes** | `Kayal Curry Masala (x2), Kalari Masala (x1)` | Order items and delivery notes |
   | 12 | **Signature Verified** | `Yes` | Cryptographic HMAC-SHA256 signature result |
   | 13 | **Coupon Code** | `WELCOME10` | Applied coupon code (or blank) |
   | 14 | **Subtotal** | `530` | Cart subtotal before discount |
   | 15 | **Discount** | `50` | Total coupon discount applied in ₹ |
   | 16 | **Final Amount** | `480` | Final payable amount |
   | 17 | **Coupon Note** | `Applied successfully` | Audit note: `"Applied successfully"`, or `"FLAGGED: UsageLimit (X) exceeded on concurrent payment"`, or `"FLAGGED: PerCustomerLimit (X) exceeded on concurrent payment"`. Paid orders are never lost. |

---

## Google Sheet Coupons (Single Source of Truth)

The Google Sheet is the **authoritative single source of truth** for all coupon codes, discount amounts, minimum order rules, and usage limits.
- When an administrator adds, updates, disables, or deletes a coupon in the **"Coupons"** tab, the storefront reflects the changes immediately on the very next coupon check.
- **No website code change and no redeployment is required.**
- No coupons are hardcoded anywhere in the website codebase.
- **Zero-Total Policy**: When a coupon is applied, a minimum of ₹1 is payable across all checkout paths. Coupons cannot reduce an order total to ₹0, and `/api/orders/free` rejects any coupon-discounted order.

### 1. Real "Coupons" Sheet Tab Columns (Authoritative A–N Layout)

The **"Coupons"** tab uses the authoritative 14-column layout (Columns A–N) with an optional 15th column for Description:

| Col | Header Name | Type | Description & Formatting Guidelines |
| :---: | :--- | :--- | :--- |
| **A** | **Coupon ID** | String | Identifier (e.g. `CPN-001`, ignored by matching engine). |
| **B** | **Code** | String | Coupon code (e.g. `HI`, `WELCOME10`). Case-insensitive and trimmed. (Alias: `Coupon Code`). |
| **C** | **Discount Type** | String | `percentage`, `percent`, `%` -> `PERCENT`; `fixed`, `flat`, `amount` -> `FLAT`. Any other value is rejected. (Alias: `Type`). |
| **D** | **Discount Value** | Number / String | **Percentage**: Can be typed as `99` or `99%`. **Critical: `1` means 1% and NEVER becomes 100%**. **Flat**: Rupee amount (e.g. `50` or `₹50`). (Alias: `Value`). |
| **E** | **Maximum Discount** | Number | Maximum discount cap in ₹ for percentage discounts (e.g. `779`). Blank = no cap. (Alias: `Max Discount`, `MaxDiscount`). |
| **F** | **Minimum Order** | Number | Minimum subtotal required in ₹ (e.g. `1` or `299`). Blank = `0` (no minimum). (Alias: `Min Order`, `MinOrder`). |
| **G** | **Usage Limit** | Number | Maximum total lifetime uses across all customers. Blank = no limit. (Alias: `UsageLimit`). |
| **H** | **Used Count** | Number | Total recorded uses. Starts at `0`. Incremented atomically in this column upon verified payment. (Alias: `UsedCount`). |
| **I** | **Per Customer Limit** | Number | Maximum uses allowed per customer phone or email (e.g. `10`). Blank = no limit. (Alias: `PerCustomerLimit`). |
| **J** | **Start Date** | Date / String | Optional start date (`YYYY-MM-DD`). Active from 00:00:00 Asia/Kolkata. Blank = no start date limit. (Alias: `StartDate`). |
| **K** | **Expiry Date** | Date / String | Optional expiry date (`YYYY-MM-DD`). Active through 23:59:59 Asia/Kolkata. Blank = no expiry limit. (Alias: `End Date`, `EndDate`). |
| **L** | **Active** | Boolean | Set to `TRUE` to enable, or `FALSE` to disable. |
| **M** | **Created At** | String | Timestamp (ignored by matching engine). |
| **N** | **Updated At** | String | Timestamp (ignored by matching engine). |
| **O** | **Description** | String | Optional description (e.g. `99% off up to ₹779`). |

> [!IMPORTANT]
> **Percentage Formatting & Parsing Rules**:
> - A percentage coupon can be entered as either `99` or `99%`.
> - Entering `1` means **1%** (saves ₹5.60 on a ₹560 subtotal) and will **never** be multiplied by 100.
> - If any header matches multiple columns, or if `Code`, `Discount Type`, or `Discount Value` is missing, the backend fails closed with `"Coupon sheet configuration error"` and logs the exact headers found.

### 2. Auto-Seeded Sample Coupons

When the Apps Script `setupDatabase()` or sheet initialization runs on a fresh sheet, it creates the canonical A–N headers and seeds sample rows with **Active = FALSE by default** so they never go live accidentally:
1. `WELCOME10`: 10% off on your order | Type: `percentage` | Value: `10` | MaxDiscount: `100` | MinOrder: `299` | Active: `FALSE`
2. `FLAT50`: Flat ₹50 off | Type: `fixed` | Value: `50` | MaxDiscount: `50` | MinOrder: `300` | Active: `FALSE`

### 3. Managing Coupons in Google Sheets

- **Add a Coupon**: Insert a new row, enter the code in Column B, set Discount Type to `percentage` or `fixed`, enter Value in Column D (e.g. `99` or `99%`), set `Used Count` to `0`, and set `Active` to `TRUE`.
- **Edit a Coupon**: Update cells in Columns B–L. The changes take effect immediately on the next coupon evaluation.
- **Deactivate a Coupon**: Set Column L (`Active`) to `FALSE`. The website will instantly report *"This coupon is no longer active"*.
- **Delete a Coupon**: Delete the row. Subsequent checks report *"Invalid coupon code"*.

### 4. Atomic Concurrency, Used Count & Pre-Payment Check

- **Pre-Payment Validation**: Before triggering payment, the storefront validates the coupon against `/api/coupon` or `/api/coupons/validate`. If Apps Script is unavailable, it reports *"Coupons unavailable right now"* and charges full price without local coupon fallback.
- **Atomic Concurrency Guarantee**: Inside Apps Script, `LockService.getScriptLock()` prevents race conditions. When payment is verified, `Used Count` is incremented atomically in its resolved column.
- **Zero-Total Policy**: When a coupon is applied, a minimum of ₹1 is payable across all checkout paths. `/api/orders/free` rejects coupon orders.


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

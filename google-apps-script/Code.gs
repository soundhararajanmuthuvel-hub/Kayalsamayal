/**
 * =============================================================================
 * KAYAL SAMAYAL - GOOGLE APPS SCRIPT ORDER MANAGEMENT & PAYMENT WEB APP
 * =============================================================================
 * 
 * DEPLOYMENT INSTRUCTIONS:
 * 1. Open Google Sheets (create a new sheet or open existing Kayal Samayal sheet).
 * 2. Go to: Extensions > Apps Script.
 * 3. Replace all existing code with this file (Code.gs).
 * 4. Configure Script Properties (Project Settings ⚙️ > Script Properties):
 *    - KEY_SECRET : Your Razorpay Key Secret (e.g., YOUR_KEY_SECRET)
 *    - KEY_ID     : Your Razorpay Key ID (e.g., rzp_test_XXXXXXXX)
 *    - SPREADSHEET_ID : (Optional if script is bound to sheet; required if standalone)
 * 5. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Select type: "Web app"
 *    - Description: "Kayal Samayal Orders & Payment Web App"
 *    - Execute as: "Me" (your email)
 *    - Who has access: "Anyone" (crucial for storefront fetch access)
 * 6. Click "Deploy", authorize permissions when prompted, and copy the Web App URL.
 * 7. Paste the Web App URL into:
 *    - NEXT_PUBLIC_KAYAL_API_URL in .env.local
 *    - GOOGLE_APPS_SCRIPT_URL in src/app/checkout/page.tsx
 * =============================================================================
 */

// Fallback Spreadsheet ID if not container-bound or configured in Script Properties
var SPREADSHEET_ID = "1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc";

// Required Columns for the "Orders" sheet as specified in Goal 2
var ORDERS_HEADERS = [
  "Timestamp",
  "Order ID",
  "Payment ID",
  "Status",
  "Amount",
  "Currency",
  "Customer Name",
  "Phone",
  "Email",
  "Address",
  "Items/Notes",
  "Signature Verified"
];

/**
 * Returns the active or configured spreadsheet instance.
 */
function getSpreadsheet() {
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {
    // Standalone script context
  }
  var propId = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  var targetId = (propId && propId.trim()) ? propId.trim() : SPREADSHEET_ID;
  return SpreadsheetApp.openById(targetId);
}

/**
 * Helper to produce standard JSON responses with CORS headers.
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Constant-time string comparison to prevent timing attacks during HMAC signature check.
 */
function safeStringCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  var result = 0;
  for (var i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Verifies Razorpay signature using HMAC-SHA256 with key secret from Script Properties.
 */
function verifyRazorpaySignature(orderId, paymentId, signature) {
  try {
    if (!orderId || !paymentId || !signature) {
      return "No (Missing Parameters)";
    }
    var scriptProps = PropertiesService.getScriptProperties();
    var keySecret = scriptProps.getProperty("KEY_SECRET") ||
                    scriptProps.getProperty("RAZORPAY_KEY_SECRET");

    if (!keySecret) {
      Logger.log("WARNING: KEY_SECRET is not configured in Script Properties.");
      return "Unverified (KEY_SECRET missing in Script Properties)";
    }

    var cleanSecret = keySecret.trim().replace(/^["']|["']$/g, "").trim();
    var payload = String(orderId).trim() + "|" + String(paymentId).trim();
    var signatureBytes = Utilities.computeHmacSha256Signature(payload, cleanSecret);

    var expectedSignature = signatureBytes.map(function(b) {
      var byteVal = (b < 0 ? b + 256 : b);
      return ("0" + byteVal.toString(16)).slice(-2);
    }).join("");

    var isValid = safeStringCompare(signature.trim().toLowerCase(), expectedSignature.toLowerCase());
    return isValid ? "Yes" : "No (Invalid Signature)";
  } catch (err) {
    Logger.log("Signature verification exception: " + err.toString());
    return "No (Verification Error)";
  }
}

/**
 * Creates or retrieves the "Orders" sheet and ensures the required header row exists.
 */
function getOrCreateOrdersSheet(ss) {
  var sheet = ss.getSheetByName("Orders");
  if (!sheet) {
    sheet = ss.insertSheet("Orders");
  }

  // If sheet is completely empty or has no header, create header row automatically
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.appendRow(ORDERS_HEADERS);
    sheet.setFrozenRows(1);
    var headerRange = sheet.getRange(1, 1, 1, ORDERS_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#8B2500"); // Kayal Samayal spice red
    headerRange.setFontColor("#FFFFFF");
    for (var i = 1; i <= ORDERS_HEADERS.length; i++) {
      sheet.autoResizeColumn(i);
    }
  }

  return sheet;
}

/**
 * HTTP GET HANDLER
 * Provides health check and diagnostic information.
 */
function doGet(e) {
  try {
    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action;

    if (action === "health" || !action) {
      return jsonResponse({
        success: true,
        message: "Kayal Samayal Orders & Payment API is live and operational",
        timestamp: new Date().toISOString(),
        hasKeySecret: Boolean(PropertiesService.getScriptProperties().getProperty("KEY_SECRET") ||
                              PropertiesService.getScriptProperties().getProperty("RAZORPAY_KEY_SECRET"))
      });
    }

    // Preserve product catalog lookup if requested
    if (action === "products") {
      var ss = getSpreadsheet();
      var pSheet = ss.getSheetByName("Products");
      if (pSheet && pSheet.getLastRow() > 1) {
        var data = getSheetRowsAsJSON(pSheet);
        return jsonResponse({ success: true, data: data });
      }
      return jsonResponse({ success: true, data: [] });
    }

    // Preserve settings lookup
    if (action === "settings") {
      var ss = getSpreadsheet();
      var sSheet = ss.getSheetByName("Settings");
      var settings = { cod_enabled: "true", shipping_charge: "60", free_shipping_threshold: "500" };
      if (sSheet && sSheet.getLastRow() > 1) {
        var rows = getSheetRowsAsJSON(sSheet);
        rows.forEach(function(r) {
          if (r.Key) settings[r.Key] = r.Value;
        });
      }
      return jsonResponse({ success: true, settings: settings });
    }

    // Preserve single order lookup by Order ID
    if (action === "order") {
      var orderId = String(params.id || "").trim();
      if (!orderId) {
        return jsonResponse({ success: false, error: "Order ID parameter is required" });
      }
      var ss = getSpreadsheet();
      var oSheet = getOrCreateOrdersSheet(ss);
      var rows = getSheetRowsAsJSON(oSheet);
      var matched = rows.filter(function(r) {
        var oId = String(r["Order ID"] || r.orderId || "").trim().toLowerCase();
        var pId = String(r["Payment ID"] || r.paymentId || "").trim().toLowerCase();
        var q = orderId.toLowerCase();
        return oId === q || pId === q;
      })[0];

      if (matched) {
        return jsonResponse({ success: true, data: { order: matched } });
      }
      return jsonResponse({ success: false, error: "Order not found" });
    }

    return jsonResponse({ success: true, message: "Action not recognized, server is ready" });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * HTTP POST HANDLER
 * Processes incoming payment records and saves them to Google Sheets.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        success: false,
        message: "Missing POST request body"
      });
    }

    var payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({
        success: false,
        message: "Invalid JSON in request body: " + parseErr.toString()
      });
    }

    var action = payload.action;

    // Optional: Server-side Razorpay order creation via UrlFetchApp
    if (action === "createOrder") {
      return jsonResponse(handleServerOrderCreation(payload));
    }

    // ── PRIMARY ORDER PERSISTENCE (GOAL 2) ──────────────────────────────────
    // Use LockService with a 15-second timeout to avoid duplicate/overlapping writes
    hasLock = lock.tryLock(15000);
    if (!hasLock) {
      return jsonResponse({
        success: false,
        message: "Server is currently busy recording another order. Please retry in a few seconds."
      });
    }

    var ss = getSpreadsheet();
    var ordersSheet = getOrCreateOrdersSheet(ss);

    // Extract fields supporting both camelCase and snake_case conventions
    var orderId     = String(payload.order_id || payload.orderId || "").trim();
    var paymentId   = String(payload.payment_id || payload.paymentId || "").trim();
    var status      = String(payload.status || payload.paymentStatus || "Paid").trim();
    var amount      = Number(payload.amount !== undefined ? payload.amount : (payload.grandTotal || 0));
    var currency    = String(payload.currency || "INR").trim();
    var customerName= String(payload.customer_name || payload.customerName || (payload.customer && payload.customer.name) || "").trim();
    var phone       = String(payload.phone || (payload.customer && payload.customer.mobile) || "").trim();
    var email       = String(payload.email || (payload.customer && payload.customer.email) || "").trim();
    var address     = String(payload.address || (payload.customer && (payload.customer.address + ", " + payload.customer.city)) || "").trim();
    var itemsNotes  = String(payload.items_notes || payload.itemsNotes || payload.notes || "").trim();
    var signature   = String(payload.razorpay_signature || payload.signature || "").trim();
    var timestamp   = payload.timestamp ? new Date(payload.timestamp) : new Date();

    // ── FIELD VALIDATION ──────────────────────────────────────────────────
    if (!orderId) {
      return jsonResponse({
        success: false,
        message: "Missing required field: order_id is required to record order."
      });
    }
    if (!paymentId) {
      return jsonResponse({
        success: false,
        message: "Missing required field: payment_id is required to record order."
      });
    }
    if (!phone) {
      return jsonResponse({
        success: false,
        message: "Missing required field: customer phone is required to record order."
      });
    }
    if (isNaN(amount) || amount < 0) {
      return jsonResponse({
        success: false,
        message: "Invalid field: amount must be a non-negative number."
      });
    }

    // ── RAZORPAY ORDER AMOUNT VALIDATION (if credentials configured) ──────
    var scriptProps = PropertiesService.getScriptProperties();
    var keyId = scriptProps.getProperty("KEY_ID") || scriptProps.getProperty("RAZORPAY_KEY_ID");
    var keySecret = scriptProps.getProperty("KEY_SECRET") || scriptProps.getProperty("RAZORPAY_KEY_SECRET");
    if (orderId.indexOf("order_") === 0 && keyId && keySecret) {
      try {
        var authHeader = "Basic " + Utilities.base64Encode(keyId.trim() + ":" + keySecret.trim());
        var rzpOrderRes = UrlFetchApp.fetch("https://api.razorpay.com/v1/orders/" + encodeURIComponent(orderId), {
          method: "GET",
          headers: { "Authorization": authHeader },
          muteHttpExceptions: true
        });
        if (rzpOrderRes.getResponseCode() === 200) {
          var rzpOrder = JSON.parse(rzpOrderRes.getContentText());
          var expectedPaise = Math.round(amount * 100);
          if (rzpOrder.amount !== expectedPaise) {
            Logger.log("Amount mismatch detected for Order " + orderId);
            return jsonResponse({
              success: false,
              message: "Amount mismatch: client reported ₹" + amount + " but Razorpay order amount is ₹" + (rzpOrder.amount / 100)
            });
          }
        }
      } catch (orderCheckErr) {
        Logger.log("Notice: Gateway order cross-verification skipped: " + orderCheckErr.toString());
      }
    }

    // ── DUPLICATE DETECTION ────────────────────────────────────────────────
    // Check if the Payment ID is already recorded in the sheet (Column 3)
    var lastRow = ordersSheet.getLastRow();
    if (lastRow > 1 && paymentId) {
      var paymentIdValues = ordersSheet.getRange(2, 3, lastRow - 1, 1).getValues();
      var cleanPaymentQuery = paymentId.toLowerCase();

      for (var r = 0; r < paymentIdValues.length; r++) {
        var existingPayId = String(paymentIdValues[r][0] || "").trim().toLowerCase();
        if (existingPayId && existingPayId === cleanPaymentQuery) {
          Logger.log("Duplicate Payment ID detected: " + paymentId + ". Ignoring duplicate write.");
          return jsonResponse({
            success: true,
            duplicate: true,
            message: "Payment ID " + paymentId + " is already recorded in the Orders sheet.",
            orderId: orderId,
            paymentId: paymentId
          });
        }
      }
    }

    // ── SIGNATURE VERIFICATION ─────────────────────────────────────────────
    var signatureVerified = verifyRazorpaySignature(orderId, paymentId, signature);

    // ── APPEND TO "Orders" SHEET ───────────────────────────────────────────
    var newRow = [
      timestamp,          // 1. Timestamp
      orderId,            // 2. Order ID
      paymentId,          // 3. Payment ID
      status,             // 4. Status
      amount,             // 5. Amount
      currency,           // 6. Currency
      customerName,       // 7. Customer Name
      phone,              // 8. Phone
      email,              // 9. Email
      address,            // 10. Address
      itemsNotes,         // 11. Items/Notes
      signatureVerified   // 12. Signature Verified
    ];

    ordersSheet.appendRow(newRow);

    Logger.log("Order saved successfully: Order ID " + orderId + ", Payment ID " + paymentId);

    return jsonResponse({
      success: true,
      message: "Order recorded successfully in Google Sheets",
      orderId: orderId,
      paymentId: paymentId,
      signatureVerified: signatureVerified
    });

  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return jsonResponse({
      success: false,
      message: "Error processing order: " + err.toString()
    });
  } finally {
    if (hasLock) {
      try {
        lock.releaseLock();
      } catch (e) {
        // Lock already released
      }
    }
  }
}

/**
 * Handles server-side Razorpay order creation via UrlFetchApp with credentials from Script Properties.
 * Never exposes the key secret to client-side code.
 */
function handleServerOrderCreation(payload) {
  try {
    var scriptProps = PropertiesService.getScriptProperties();
    var keyId = scriptProps.getProperty("KEY_ID") || scriptProps.getProperty("RAZORPAY_KEY_ID");
    var keySecret = scriptProps.getProperty("KEY_SECRET") || scriptProps.getProperty("RAZORPAY_KEY_SECRET");

    if (!keyId || !keySecret) {
      return {
        success: false,
        message: "Razorpay KEY_ID and KEY_SECRET must be configured in Script Properties for server-side order creation."
      };
    }

    var amountInPaise = Math.round(Number(payload.amount || payload.grandTotal || 0) * 100);
    if (amountInPaise <= 0) {
      return { success: false, message: "Order amount must be greater than zero." };
    }

    var authHeader = "Basic " + Utilities.base64Encode(keyId.trim() + ":" + keySecret.trim());
    var orderPayload = {
      amount: amountInPaise,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      payment_capture: 1,
      notes: {
        customerName: String(payload.customerName || (payload.customer && payload.customer.name) || "").slice(0, 40),
        phone: String(payload.phone || (payload.customer && payload.customer.mobile) || "").slice(0, 15)
      }
    };

    var response = UrlFetchApp.fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(orderPayload),
      muteHttpExceptions: true
    });

    var responseCode = response.getResponseCode();
    var responseBody = JSON.parse(response.getContentText());

    if (responseCode >= 200 && responseCode < 300) {
      return {
        success: true,
        order: responseBody,
        orderId: responseBody.id,
        keyId: keyId.trim()
      };
    } else {
      return {
        success: false,
        message: responseBody.error ? responseBody.error.description : "Failed to create Razorpay order upstream."
      };
    }
  } catch (err) {
    return {
      success: false,
      message: "Order creation exception: " + err.toString()
    };
  }
}

/**
 * Utility: Converts a sheet's rows to an array of objects keyed by the header row.
 */
function getSheetRowsAsJSON(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values  = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(function(row) {
    var obj = {};
    headers.forEach(function(h, i) { obj[h] = row[i]; });
    return obj;
  });
}

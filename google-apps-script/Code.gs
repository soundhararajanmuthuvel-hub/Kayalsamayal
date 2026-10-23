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

// Required Columns for the "Orders" sheet as specified in Goal 2 & Coupon Sync
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
  "Signature Verified",
  "Coupon Code",
  "Subtotal",
  "Discount",
  "Final Amount",
  "Coupon Note"
];

// Required Columns for the "Coupons" sheet (Single Source of Truth)
var COUPONS_HEADERS = [
  "Code",
  "Description",
  "Type",
  "Value",
  "MinOrder",
  "MaxDiscount",
  "StartDate",
  "EndDate",
  "UsageLimit",
  "UsedCount",
  "PerCustomerLimit",
  "Active"
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
 * Gracefully appends new columns (Coupon Code, Subtotal, Discount, Final Amount) if upgrading.
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
  } else {
    // Check if new coupon/discount columns need to be appended to existing header
    var lastCol = sheet.getLastColumn();
    var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
      return String(h || "").trim().toLowerCase();
    });
    var missingHeaders = [];
    for (var h = 0; h < ORDERS_HEADERS.length; h++) {
      if (existingHeaders.indexOf(ORDERS_HEADERS[h].toLowerCase()) === -1) {
        missingHeaders.push(ORDERS_HEADERS[h]);
      }
    }
    if (missingHeaders.length > 0) {
      var startCol = lastCol + 1;
      var newHeaderRange = sheet.getRange(1, startCol, 1, missingHeaders.length);
      newHeaderRange.setValues([missingHeaders]);
      newHeaderRange.setFontWeight("bold");
      newHeaderRange.setBackground("#8B2500");
      newHeaderRange.setFontColor("#FFFFFF");
    }
  }

  return sheet;
}

/**
 * Creates or retrieves the "Coupons" sheet.
 * If creating newly, sets up headers and seeds 3 sample rows.
 */
function getOrCreateCouponsSheet(ss) {
  var sheet = ss.getSheetByName("Coupons");
  if (!sheet) {
    sheet = ss.insertSheet("Coupons");
  }

  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.appendRow(COUPONS_HEADERS);
    sheet.setFrozenRows(1);
    var headerRange = sheet.getRange(1, 1, 1, COUPONS_HEADERS.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#8B2500"); // Kayal Samayal spice red
    headerRange.setFontColor("#FFFFFF");

    // Seed 3 sample rows (Active = false by default so they never go live by accident)
    var sampleRows = [
      [
        "WELCOME10",
        "10% off on your order",
        "PERCENT",
        10,
        200,
        100,
        "2024-01-01",
        "2030-12-31",
        100,
        0,
        1,
        false
      ],
      [
        "FLAT50",
        "Flat ₹50 off",
        "FLAT",
        50,
        300,
        50,
        "2024-01-01",
        "2030-12-31",
        50,
        0,
        1,
        false
      ],
      [
        "EXPIRED5",
        "Expired sample coupon",
        "PERCENT",
        5,
        100,
        50,
        "2020-01-01",
        "2020-12-31",
        10,
        10,
        1,
        false
      ]
    ];

    for (var s = 0; s < sampleRows.length; s++) {
      sheet.appendRow(sampleRows[s]);
    }

    for (var c = 1; c <= COUPONS_HEADERS.length; c++) {
      sheet.autoResizeColumn(c);
    }
  }

  return sheet;
}

/**
 * Utility: Returns a mapping of lowercased header name to 0-indexed column position.
 * Protects against column reordering in the Google Sheet.
 */
function getHeaderMap(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return {};
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || "").trim().toLowerCase();
    if (key) map[key] = i;
  }
  return map;
}

/**
 * Validates a coupon code against the "Coupons" sheet in Google Sheets.
 * Evaluates active status, Asia/Kolkata date bounds, MinOrder, UsageLimit, and PerCustomerLimit.
 */
function validateCouponHandler(payload, ss) {
  try {
    var rawCode = String(payload.code || payload.couponCode || "").trim();
    if (!rawCode) {
      return { success: false, valid: false, error: "Please enter a coupon code." };
    }
    var codeUpper = rawCode.toUpperCase();
    var subtotal = Number(payload.subtotal !== undefined ? payload.subtotal : payload.cartSubtotal || 0);
    if (isNaN(subtotal) || subtotal < 0) {
      subtotal = 0;
    }
    var customerPhone = String(payload.customerPhone || (payload.customer && payload.customer.mobile) || payload.phone || "").trim();
    var customerEmail = String(payload.customerEmail || (payload.customer && payload.customer.email) || payload.email || "").trim();

    var cSheet = getOrCreateCouponsSheet(ss);
    var lastRow = cSheet.getLastRow();
    if (lastRow <= 1) {
      return { success: false, valid: false, error: "Invalid coupon code" };
    }

    var headerMap = getHeaderMap(cSheet);
    var codeCol = headerMap["code"];
    if (codeCol === undefined) {
      return { success: false, valid: false, error: "Coupons sheet is missing 'Code' column" };
    }

    var data = cSheet.getRange(2, 1, lastRow - 1, cSheet.getLastColumn()).getValues();
    var matchedRow = null;

    for (var r = 0; r < data.length; r++) {
      var row = data[r];
      var cCode = String(row[codeCol] || "").trim().toUpperCase();
      if (cCode === codeUpper) {
        matchedRow = row;
        break;
      }
    }

    if (!matchedRow) {
      return { success: false, valid: false, error: "Invalid coupon code" };
    }

    // Helper to get value by header name
    function getVal(colName) {
      var idx = headerMap[colName.toLowerCase()];
      return idx !== undefined ? matchedRow[idx] : undefined;
    }

    // 1. Check Active
    var activeVal = getVal("active");
    var isActive = (activeVal === true || String(activeVal).trim().toLowerCase() === "true" || activeVal === 1 || String(activeVal).trim().toLowerCase() === "yes");
    if (!isActive) {
      return { success: false, valid: false, error: "This coupon is no longer active" };
    }

    // 2. Check Date Bounds in Asia/Kolkata timezone
    var nowKolkata = new Date();
    // Parse StartDate
    var rawStart = getVal("startdate");
    if (rawStart) {
      var startDate = rawStart instanceof Date ? rawStart : new Date(rawStart);
      if (!isNaN(startDate.getTime())) {
        var startMidnight = new Date(startDate);
        startMidnight.setHours(0, 0, 0, 0);
        if (nowKolkata < startMidnight) {
          return { success: false, valid: false, error: "Coupon is not yet active" };
        }
      }
    }

    // Parse EndDate
    var rawEnd = getVal("enddate");
    if (rawEnd) {
      var endDate = rawEnd instanceof Date ? rawEnd : new Date(rawEnd);
      if (!isNaN(endDate.getTime())) {
        var endEndOfDay = new Date(endDate);
        endEndOfDay.setHours(23, 59, 59, 999);
        if (nowKolkata > endEndOfDay) {
          return { success: false, valid: false, error: "Coupon has expired" };
        }
      }
    }

    // 3. Check MinOrder
    var minOrder = Number(getVal("minorder") || 0);
    if (!isNaN(minOrder) && minOrder > 0 && subtotal < minOrder) {
      return {
        success: false,
        valid: false,
        error: "Minimum order amount of ₹" + minOrder + " required for this coupon"
      };
    }

    // 4. Check Global UsageLimit
    var usageLimit = Number(getVal("usagelimit") || 0);
    var usedCount = Number(getVal("usedcount") || 0);
    if (!isNaN(usageLimit) && usageLimit > 0 && usedCount >= usageLimit) {
      return { success: false, valid: false, error: "Coupon usage limit reached" };
    }

    // 5. Check PerCustomerLimit against Orders sheet
    var perCustLimit = Number(getVal("percustomerlimit") || 0);
    if (!isNaN(perCustLimit) && perCustLimit > 0 && (customerPhone || customerEmail)) {
      var ordersSheet = getOrCreateOrdersSheet(ss);
      var ordersLastRow = ordersSheet.getLastRow();
      if (ordersLastRow > 1) {
        var ordersHeaderMap = getHeaderMap(ordersSheet);
        var oCouponCol = ordersHeaderMap["coupon code"];
        var oPhoneCol = ordersHeaderMap["phone"];
        var oEmailCol = ordersHeaderMap["email"];

        if (oCouponCol !== undefined) {
          var ordersData = ordersSheet.getRange(2, 1, ordersLastRow - 1, ordersSheet.getLastColumn()).getValues();
          var custUses = 0;
          for (var i = 0; i < ordersData.length; i++) {
            var oRow = ordersData[i];
            var oCoupon = String(oRow[oCouponCol] || "").trim().toUpperCase();
            if (oCoupon === codeUpper) {
              var oPhone = oPhoneCol !== undefined ? String(oRow[oPhoneCol] || "").trim() : "";
              var oEmail = oEmailCol !== undefined ? String(oRow[oEmailCol] || "").trim().toLowerCase() : "";
              var matchPhone = customerPhone && oPhone && oPhone.slice(-10) === customerPhone.slice(-10);
              var matchEmail = customerEmail && oEmail && oEmail === customerEmail.toLowerCase();
              if (matchPhone || matchEmail) {
                custUses++;
              }
            }
          }
          if (custUses >= perCustLimit) {
            return {
              success: false,
              valid: false,
              error: "You have already reached the usage limit for this coupon"
            };
          }
        }
      }
    }

    // 6. Compute Discount
    var type = String(getVal("type") || "PERCENT").trim().toUpperCase();
    var val = Number(getVal("value") || 0);
    var maxDisc = Number(getVal("maxdiscount") || 0);
    var rawDiscount = 0;

    if (type === "PERCENT" || type === "PERCENTAGE") {
      rawDiscount = Math.round((subtotal * val) / 100);
      if (!isNaN(maxDisc) && maxDisc > 0) {
        rawDiscount = Math.min(rawDiscount, maxDisc);
      }
    } else {
      rawDiscount = Math.round(val);
    }

    // Cap discount to subtotal so total never becomes negative
    rawDiscount = Math.max(0, Math.min(rawDiscount, subtotal));

    // Enforce minimum payable amount ₹1 on Razorpay if subtotal >= 1
    if (subtotal >= 1 && (subtotal - rawDiscount) < 1) {
      rawDiscount = Math.max(0, subtotal - 1);
    }

    var finalAmount = Math.max(0, subtotal - rawDiscount);

    return {
      success: true,
      valid: true,
      coupon: {
        code: codeUpper,
        description: String(getVal("description") || ""),
        type: type,
        discountType: (type === "PERCENT" || type === "PERCENTAGE") ? "percentage" : "fixed",
        value: val,
        discountValue: val,
        discount: rawDiscount,
        discountAmount: rawDiscount,
        finalAmount: finalAmount,
        minOrder: minOrder,
        minimumOrder: minOrder,
        maxDiscount: maxDisc,
        maximumDiscount: maxDisc
      }
    };
  } catch (err) {
    Logger.log("validateCouponHandler error: " + err.toString());
    return { success: false, valid: false, error: "Failed to validate coupon: " + err.toString() };
  }
}

/**
 * Returns all active, currently valid coupons for public display.
 */
function getCouponsHandler(ss) {
  try {
    var cSheet = getOrCreateCouponsSheet(ss);
    var lastRow = cSheet.getLastRow();
    if (lastRow <= 1) {
      return { success: true, data: [] };
    }

    var headerMap = getHeaderMap(cSheet);
    var data = cSheet.getRange(2, 1, lastRow - 1, cSheet.getLastColumn()).getValues();
    var nowKolkata = new Date();
    var publicCoupons = [];

    for (var r = 0; r < data.length; r++) {
      var row = data[r];
      function getVal(colName) {
        var idx = headerMap[colName.toLowerCase()];
        return idx !== undefined ? row[idx] : undefined;
      }

      var code = String(getVal("code") || "").trim().toUpperCase();
      if (!code) continue;

      var activeVal = getVal("active");
      var isActive = (activeVal === true || String(activeVal).trim().toLowerCase() === "true" || activeVal === 1 || String(activeVal).trim().toLowerCase() === "yes");
      if (!isActive) continue;

      // Start date check
      var rawStart = getVal("startdate");
      if (rawStart) {
        var startDate = rawStart instanceof Date ? rawStart : new Date(rawStart);
        if (!isNaN(startDate.getTime())) {
          var startMidnight = new Date(startDate);
          startMidnight.setHours(0, 0, 0, 0);
          if (nowKolkata < startMidnight) continue;
        }
      }

      // End date check
      var rawEnd = getVal("enddate");
      if (rawEnd) {
        var endDate = rawEnd instanceof Date ? rawEnd : new Date(rawEnd);
        if (!isNaN(endDate.getTime())) {
          var endEndOfDay = new Date(endDate);
          endEndOfDay.setHours(23, 59, 59, 999);
          if (nowKolkata > endEndOfDay) continue;
        }
      }

      // Usage limit check
      var usageLimit = Number(getVal("usagelimit") || 0);
      var usedCount = Number(getVal("usedcount") || 0);
      if (!isNaN(usageLimit) && usageLimit > 0 && usedCount >= usageLimit) continue;

      var type = String(getVal("type") || "PERCENT").trim().toUpperCase();
      var val = Number(getVal("value") || 0);
      var minOrder = Number(getVal("minorder") || 0);
      var maxDisc = Number(getVal("maxdiscount") || 0);

      publicCoupons.push({
        code: code,
        description: String(getVal("description") || ""),
        type: type,
        discountType: (type === "PERCENT" || type === "PERCENTAGE") ? "percentage" : "fixed",
        value: val,
        discountValue: val,
        minOrder: minOrder,
        minimumOrder: minOrder,
        maxDiscount: maxDisc,
        maximumDiscount: maxDisc,
        active: true
      });
    }

    return { success: true, data: publicCoupons };
  } catch (err) {
    Logger.log("getCouponsHandler error: " + err.toString());
    return { success: false, data: [], error: err.toString() };
  }
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

    // Coupons catalog lookup (active valid coupons only)
    if (action === "getCoupons" || action === "coupons") {
      var ss = getSpreadsheet();
      return jsonResponse(getCouponsHandler(ss));
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

    // Preserve single order lookup by Order ID (reads directly from "Orders" sheet Items/Notes column)
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
        // Parse items from "Items/Notes" column of Orders sheet
        var rawNotes = String(matched["Items/Notes"] || matched.itemsNotes || "").trim();
        var productPart = rawNotes.split("|")[0].trim();
        var parsedItems = [];
        if (productPart) {
          var entries = productPart.indexOf(";") !== -1 ? productPart.split(";") : productPart.split(",");
          entries.forEach(function(entry) {
            var trimmed = entry.trim();
            if (!trimmed) return;
            var qtyMatch = trimmed.match(/x\s*(\d+)/i) || trimmed.match(/\(x(\d+)\)/i);
            var priceMatch = trimmed.match(/₹\s*(\d+(?:\.\d+)?)/);
            var cleanName = trimmed
              .replace(/x\s*\d+/gi, "")
              .replace(/\(x\d+\)/gi, "")
              .replace(/\(₹[\d.]+\)/g, "")
              .replace(/₹[\d.]+/g, "")
              .trim();
            parsedItems.push({
              name: cleanName || trimmed,
              qty: qtyMatch ? Number(qtyMatch[1]) : 1,
              price: priceMatch ? Number(priceMatch[1]) : 0
            });
          });
        }

        return jsonResponse({
          success: true,
          data: {
            order: matched,
            items: parsedItems
          }
        });
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

    // Coupon validation against Coupons sheet
    if (action === "validateCoupon") {
      var ssCoupon = getSpreadsheet();
      return jsonResponse(validateCouponHandler(payload, ssCoupon));
    }

    // Coupon catalog retrieval
    if (action === "getCoupons" || action === "coupons") {
      var ssList = getSpreadsheet();
      return jsonResponse(getCouponsHandler(ssList));
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

    // If items_notes is empty or items array is provided, format into "Product xQty (₹Price); ..."
    if (!itemsNotes && Array.isArray(payload.items) && payload.items.length > 0) {
      var itemStrings = [];
      for (var it = 0; it < payload.items.length; it++) {
        var itemObj = payload.items[it];
        var iName = String(itemObj.name || itemObj.productName || itemObj.title || itemObj.productId || ("Item " + (it + 1))).trim();
        var iQty = Number(itemObj.quantity || itemObj.qty || 1);
        var iPrice = Number(itemObj.price || itemObj.unitPrice || 0);
        var iTotal = Number(itemObj.total || (iPrice * iQty) || 0);
        var itemEntry = iName + " x" + iQty;
        if (iTotal > 0 || iPrice > 0) {
          itemEntry += " (₹" + (iTotal > 0 ? iTotal : iPrice) + ")";
        }
        itemStrings.push(itemEntry);
      }
      itemsNotes = itemStrings.join("; ");
      if (payload.customer && payload.customer.notes) {
        itemsNotes += " | Notes: " + payload.customer.notes;
      }
    }
    if (!itemsNotes) {
      itemsNotes = "Standard Order (" + status + ")";
    }

    var signature   = String(payload.razorpay_signature || payload.signature || "").trim();
    var timestamp   = payload.timestamp ? new Date(payload.timestamp) : new Date();

    // Coupon and Pricing breakdown
    var couponCode  = String(payload.coupon_code || payload.couponCode || "").trim().toUpperCase();
    var subtotal    = Number(payload.subtotal !== undefined ? payload.subtotal : (payload.cartSubtotal !== undefined ? payload.cartSubtotal : amount));
    var discount    = Number(payload.discount !== undefined ? payload.discount : (payload.discountAmount || 0));
    var finalAmount = Number(payload.final_amount !== undefined ? payload.final_amount : (payload.grandTotal !== undefined ? payload.grandTotal : amount));

    var isCod = (status.indexOf("COD") !== -1 || paymentId === "COD_PENDING" || signature === "COD");
    var isFree = (paymentId === "FREE_ORDER" || signature === "FREE_ORDER" || amount === 0);

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

    var signatureVerified = "No";

    if (isCod) {
      signatureVerified = "COD (Pending)";
    } else if (isFree) {
      signatureVerified = "Free Order (Verified)";
    } else {
      // Online Razorpay Payment: strictly enforce order_ prefix, mandatory amount check, and HMAC signature verification
      if (typeof orderId !== "string" || orderId.indexOf("order_") !== 0) {
        return jsonResponse({
          success: false,
          message: "Invalid order_id: must be a valid Razorpay order ID starting with 'order_'."
        });
      }

      // Mandatory Razorpay order amount check
      var scriptProps = PropertiesService.getScriptProperties();
      var keyId = scriptProps.getProperty("KEY_ID") || scriptProps.getProperty("RAZORPAY_KEY_ID");
      var keySecret = scriptProps.getProperty("KEY_SECRET") || scriptProps.getProperty("RAZORPAY_KEY_SECRET");
      if (!keyId || !keySecret) {
        Logger.log("Razorpay credentials missing in Script Properties for order verification: " + orderId);
        return jsonResponse({
          success: false,
          message: "Server configuration error: Razorpay KEY_ID and KEY_SECRET must be configured in Script Properties for mandatory order amount verification."
        });
      }

      try {
        var authHeader = "Basic " + Utilities.base64Encode(keyId.trim() + ":" + keySecret.trim());
        var rzpOrderRes = UrlFetchApp.fetch("https://api.razorpay.com/v1/orders/" + encodeURIComponent(orderId), {
          method: "GET",
          headers: { "Authorization": authHeader },
          muteHttpExceptions: true
        });
        var rzpCode = rzpOrderRes.getResponseCode();
        if (rzpCode !== 200) {
          Logger.log("Razorpay order lookup failed for " + orderId + " (HTTP " + rzpCode + ")");
          return jsonResponse({
            success: false,
            message: "Razorpay order lookup failed (HTTP " + rzpCode + "). Order not recorded."
          });
        }
        var rzpOrder = JSON.parse(rzpOrderRes.getContentText());
        var expectedPaise = Math.round(amount * 100);
        if (rzpOrder.amount !== expectedPaise) {
          Logger.log("Amount mismatch detected for Order " + orderId + ": reported ₹" + amount + ", gateway order is ₹" + (rzpOrder.amount / 100));
          return jsonResponse({
            success: false,
            message: "Amount mismatch: client reported ₹" + amount + " but Razorpay order amount is ₹" + (rzpOrder.amount / 100)
          });
        }
      } catch (orderCheckErr) {
        Logger.log("Razorpay order lookup exception for " + orderId + ": " + orderCheckErr.toString());
        return jsonResponse({
          success: false,
          message: "Failed to verify Razorpay order amount upstream: " + orderCheckErr.toString()
        });
      }

      // Signature verification for online payments
      signatureVerified = verifyRazorpaySignature(orderId, paymentId, signature);
      if (signatureVerified !== "Yes") {
        Logger.log("Rejected payment " + paymentId + ": " + signatureVerified);
        return jsonResponse({
          success: false,
          message: "Payment signature could not be verified. Order not recorded.",
          signatureVerified: signatureVerified
        });
      }
    }

    // ── DUPLICATE DETECTION ────────────────────────────────────────────────
    var lastRow = ordersSheet.getLastRow();
    if (lastRow > 1) {
      if (paymentId && paymentId !== "COD_PENDING" && paymentId !== "FREE_ORDER") {
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
      } else if (orderId) {
        var orderIdValues = ordersSheet.getRange(2, 2, lastRow - 1, 1).getValues();
        var cleanOrderQuery = orderId.toLowerCase();
        for (var ro = 0; ro < orderIdValues.length; ro++) {
          var existingOrdId = String(orderIdValues[ro][0] || "").trim().toLowerCase();
          if (existingOrdId && existingOrdId === cleanOrderQuery) {
            Logger.log("Duplicate Order ID detected: " + orderId + ". Ignoring duplicate write.");
            return jsonResponse({
              success: true,
              duplicate: true,
              message: "Order ID " + orderId + " is already recorded in the Orders sheet.",
              orderId: orderId,
              paymentId: paymentId
            });
          }
        }
      }
    }

    var couponNote = "";

    // ── ATOMIC RE-CHECK OF USAGELIMIT & PERCUSTOMERLIMIT BEFORE INCREMENT ──
    if (couponCode) {
      try {
        var couponsSheet = getOrCreateCouponsSheet(ss);
        var cLastRow = couponsSheet.getLastRow();
        if (cLastRow > 1) {
          var cHeaderMap = getHeaderMap(couponsSheet);
          var codeCol = cHeaderMap["code"];
          var usedCountCol = cHeaderMap["usedcount"];
          var usageLimitCol = cHeaderMap["usagelimit"];
          var perCustLimitCol = cHeaderMap["percustomerlimit"];

          if (codeCol !== undefined && usedCountCol !== undefined) {
            var cData = couponsSheet.getRange(2, 1, cLastRow - 1, couponsSheet.getLastColumn()).getValues();
            for (var ci = 0; ci < cData.length; ci++) {
              var rowCoupon = String(cData[ci][codeCol] || "").trim().toUpperCase();
              if (rowCoupon === couponCode) {
                var currentUsed = Number(cData[ci][usedCountCol] || 0);
                var globalLimit = usageLimitCol !== undefined ? Number(cData[ci][usageLimitCol] || 0) : 0;
                var perCustomerLimit = perCustLimitCol !== undefined ? Number(cData[ci][perCustLimitCol] || 0) : 0;

                var limitExceeded = false;
                var limitReason = "";

                // 1. Re-check global UsageLimit
                if (globalLimit > 0 && currentUsed >= globalLimit) {
                  limitExceeded = true;
                  limitReason = "UsageLimit (" + globalLimit + ") exceeded on concurrent payment";
                }

                // 2. Re-check PerCustomerLimit against existing orders
                if (!limitExceeded && perCustomerLimit > 0 && (phone || email)) {
                  var oLastRow = ordersSheet.getLastRow();
                  if (oLastRow > 1) {
                    var oHeaderMap = getHeaderMap(ordersSheet);
                    var oCouponCol = oHeaderMap["coupon code"];
                    var oPhoneCol = oHeaderMap["phone"];
                    var oEmailCol = oHeaderMap["email"];

                    if (oCouponCol !== undefined) {
                      var oData = ordersSheet.getRange(2, 1, oLastRow - 1, ordersSheet.getLastColumn()).getValues();
                      var custUses = 0;
                      for (var oi = 0; oi < oData.length; oi++) {
                        var oRow = oData[oi];
                        var existingCoupon = String(oRow[oCouponCol] || "").trim().toUpperCase();
                        if (existingCoupon === couponCode) {
                          var ordPhone = oPhoneCol !== undefined ? String(oRow[oPhoneCol] || "").trim() : "";
                          var ordEmail = oEmailCol !== undefined ? String(oRow[oEmailCol] || "").trim().toLowerCase() : "";
                          var matchP = phone && ordPhone && ordPhone.slice(-10) === phone.slice(-10);
                          var matchE = email && ordEmail && ordEmail === email.toLowerCase();
                          if (matchP || matchE) {
                            custUses++;
                          }
                        }
                      }
                      if (custUses >= perCustomerLimit) {
                        limitExceeded = true;
                        limitReason = "PerCustomerLimit (" + perCustomerLimit + ") exceeded on concurrent payment";
                      }
                    }
                  }
                }

                if (limitExceeded) {
                  couponNote = "FLAGGED: " + limitReason;
                  Logger.log("Notice: " + couponNote + " for order " + orderId + ". Order still recorded safely.");
                  // DO NOT increment UsedCount when limit is already reached
                } else {
                  // Valid use: atomically increment UsedCount in sheet
                  couponsSheet.getRange(ci + 2, usedCountCol + 1).setValue(currentUsed + 1);
                  couponNote = "Applied successfully";
                  Logger.log("Incremented UsedCount for coupon " + couponCode + " to " + (currentUsed + 1));
                }
                break;
              }
            }
          }
        }
      } catch (couponIncErr) {
        couponNote = "Error verifying coupon limits: " + couponIncErr.toString();
        Logger.log("Failed in atomic coupon check: " + couponIncErr.toString());
      }
    }

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
      signatureVerified,  // 12. Signature Verified
      couponCode,         // 13. Coupon Code
      subtotal,           // 14. Subtotal
      discount,           // 15. Discount
      finalAmount,        // 16. Final Amount
      couponNote          // 17. Coupon Note
    ];

    ordersSheet.appendRow(newRow);

    Logger.log("Order saved successfully: Order ID " + orderId + ", Payment ID " + paymentId + (couponCode ? ", Coupon: " + couponCode + " (" + couponNote + ")" : ""));

    return jsonResponse({
      success: true,
      message: "Order recorded successfully in Google Sheets",
      orderId: orderId,
      paymentId: paymentId,
      signatureVerified: signatureVerified,
      couponCode: couponCode,
      couponNote: couponNote
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

/**
 * Convenience helper to initialize or verify "Orders" and "Coupons" tabs.
 * Can be run directly from Apps Script editor via Run > setupDatabase.
 * Works for both standalone and bound scripts without getUi() dependency.
 */
function setupDatabase() {
  var ss = getSpreadsheet(); // works for standalone AND bound scripts

  [['Orders', ORDERS_HEADERS], ['Coupons', COUPONS_HEADERS]].forEach(function (t) {
    var sh = ss.getSheetByName(t[0]) || ss.insertSheet(t[0]);
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, t[1].length).setValues([t[1]])
        .setFontWeight('bold').setBackground('#8B2500').setFontColor('#FFFFFF');
      sh.setFrozenRows(1);
    } else {
      var lastCol = sh.getLastColumn();
      var existing = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
        return String(h || '').trim().toLowerCase();
      });
      var missing = t[1].filter(function (h) {
        return existing.indexOf(h.toLowerCase()) === -1;
      });
      if (missing.length > 0) {
        sh.getRange(1, lastCol + 1, 1, missing.length).setValues([missing])
          .setFontWeight('bold').setBackground('#8B2500').setFontColor('#FFFFFF');
      }
    }
  });

  // No SpreadsheetApp.getUi() here: it also fails in a standalone script.
  Logger.log('Setup done: Orders and Coupons tabs are ready in "' + ss.getName() + '"');
}

/**
 * Migration helper to merge historical rows from "Order Items" into the "Orders" sheet.
 * Can be run directly from Apps Script editor via Run > mergeOrderItemsIntoOrders.
 */
function mergeOrderItemsIntoOrders() {
  var ss = getSpreadsheet();
  var orders = ss.getSheetByName('Orders');
  var items = ss.getSheetByName('Order Items');
  if (!orders || !items) throw new Error('Orders or Order Items tab not found');
  if (items.getLastRow() < 2) { Logger.log('Order Items is empty.'); return; }

  var oMap = getHeaderMap(orders);
  var iMap = getHeaderMap(items);

  var oIdCol = oMap['order id'];
  var oNotesCol = oMap['items/notes'];
  if (oIdCol === undefined || oNotesCol === undefined) {
    throw new Error('Orders needs "Order ID" and "Items/Notes" columns (run setupDatabase first)');
  }

  // Find the matching columns in Order Items (adjust the lists if your headers differ)
  function find(map, names) {
    for (var i = 0; i < names.length; i++) {
      if (map[names[i]] !== undefined) return map[names[i]];
    }
    return undefined;
  }
  var iIdCol    = find(iMap, ['order id', 'orderid']);
  var nameCol   = find(iMap, ['product name', 'item name', 'item', 'product', 'name']);
  var qtyCol    = find(iMap, ['quantity', 'qty']);
  var priceCol  = find(iMap, ['price', 'unit price', 'amount', 'total']);
  if (iIdCol === undefined || nameCol === undefined) {
    throw new Error('Order Items needs an Order ID column and a product name column. Headers found: ' + Object.keys(iMap).join(', '));
  }

  // Group item rows by Order ID
  var itemData = items.getRange(2, 1, items.getLastRow() - 1, items.getLastColumn()).getValues();
  var byOrder = {};
  itemData.forEach(function (r) {
    var id = String(r[iIdCol] || '').trim();
    if (!id) return;
    var text = String(r[nameCol] || '').trim();
    if (qtyCol !== undefined && r[qtyCol] !== '') text += ' x' + r[qtyCol];
    if (priceCol !== undefined && r[priceCol] !== '') text += ' (₹' + r[priceCol] + ')';
    (byOrder[id] = byOrder[id] || []).push(text);
  });

  // Write the joined text into Orders (never overwrite existing notes)
  var oLast = orders.getLastRow();
  if (oLast < 2) { Logger.log('Orders is empty.'); return; }
  var ids = orders.getRange(2, oIdCol + 1, oLast - 1, 1).getValues();
  var notes = orders.getRange(2, oNotesCol + 1, oLast - 1, 1).getValues();
  var updated = 0, unmatched = Object.keys(byOrder).length;

  for (var i = 0; i < ids.length; i++) {
    var key = String(ids[i][0] || '').trim();
    if (key && byOrder[key]) {
      var joined = byOrder[key].join('; ');
      var existing = String(notes[i][0] || '').trim();
      if (existing.indexOf(joined) === -1) {
        notes[i][0] = existing ? existing + ' | ' + joined : joined;
        updated++;
      }
      unmatched--;
    }
  }
  orders.getRange(2, oNotesCol + 1, notes.length, 1).setValues(notes);

  Logger.log('Merged items into ' + updated + ' orders. Order IDs with no match in Orders: ' + unmatched);
}




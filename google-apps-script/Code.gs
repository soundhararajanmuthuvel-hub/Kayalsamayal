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

// Application Version returned in doGet action=health
var APP_VERSION = "2.1.0";

// Canonical Columns for the "Coupons" sheet (authoritative A-N layout + optional Description)
var COUPONS_HEADERS = [
  "Coupon ID",
  "Code",
  "Discount Type",
  "Discount Value",
  "Maximum Discount",
  "Minimum Order",
  "Usage Limit",
  "Used Count",
  "Per Customer Limit",
  "Start Date",
  "Expiry Date",
  "Active",
  "Created At",
  "Updated At",
  "Description"
];

// Coupon header aliases for robust single-schema matching
var COUPON_ALIASES = {
  code: ["code", "coupon code"],
  type: ["discount type", "type"],
  value: ["discount value", "value"],
  maxdiscount: ["maximum discount", "max discount", "maxdiscount"],
  minorder: ["minimum order", "min order", "minorder"],
  usagelimit: ["usage limit", "usagelimit"],
  usedcount: ["used count", "usedcount"],
  percustomer: ["per customer limit", "percustomerlimit"],
  start: ["start date", "startdate"],
  end: ["expiry date", "end date", "enddate"],
  active: ["active"],
  description: ["description"]
};

// Headers to explicitly ignore from fail-closed collision checks
var IGNORED_COUPON_HEADERS = [
  "coupon id",
  "created at",
  "updated at"
];

// Aliases for the Orders tab to prevent duplicate columns during upgrades
var ORDERS_ALIASES = {
  "timestamp": ["timestamp", "date", "order date", "order_date"],
  "order id": ["order id", "orderid", "order_id"],
  "payment id": ["payment id", "paymentid", "payment_id"],
  "status": ["status", "payment status", "payment_status"],
  "amount": ["amount", "total", "grand total", "grand_total"],
  "currency": ["currency"],
  "customer name": ["customer name", "name", "customer", "customer_name"],
  "phone": ["phone", "mobile", "contact", "customer phone", "customer_phone"],
  "email": ["email", "customer email", "customer_email"],
  "address": ["address", "shipping address", "shipping_address"],
  "items/notes": ["items/notes", "items_notes", "items notes", "items", "notes", "order items", "order_items"],
  "signature verified": ["signature verified", "signature_verified", "verified"],
  "coupon code": ["coupon code", "coupon_code", "coupon"],
  "subtotal": ["subtotal", "cart subtotal", "cart_subtotal"],
  "discount": ["discount", "discount amount", "discount_amount"],
  "final amount": ["final amount", "final_amount", "payable amount", "total amount"],
  "coupon note": ["coupon note", "coupon_note", "coupon notes"]
};

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
 * Helper to determine which canonical Orders headers are missing, respecting aliases.
 */
function getMissingOrdersHeaders(existingHeaders) {
  var normExisting = existingHeaders.map(function(h) {
    return String(h || "").trim().toLowerCase().replace(/[\s_\-]+/g, "");
  });

  var missing = [];
  for (var i = 0; i < ORDERS_HEADERS.length; i++) {
    var canonical = ORDERS_HEADERS[i];
    var key = canonical.toLowerCase();
    var aliases = ORDERS_ALIASES[key] || [key];
    var found = false;
    for (var a = 0; a < aliases.length; a++) {
      var normAlias = aliases[a].replace(/[\s_\-]+/g, "");
      if (normExisting.indexOf(normAlias) !== -1) {
        found = true;
        break;
      }
    }
    if (!found) {
      missing.push(canonical);
    }
  }
  return missing;
}

/**
 * Creates or retrieves the "Orders" sheet and ensures required columns exist.
 * Alias-aware: checks if any alias exists before appending missing columns.
 * Never touches existing data or creates duplicate columns.
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
    // Check if missing columns need to be appended without duplicating any alias
    var lastCol = sheet.getLastColumn();
    var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var missingHeaders = getMissingOrdersHeaders(existingHeaders);
    if (missingHeaders.length > 0) {
      var startCol = lastCol + 1;
      var newHeaderRange = sheet.getRange(1, startCol, 1, missingHeaders.length);
      newHeaderRange.setValues([missingHeaders]);
      newHeaderRange.setFontWeight("bold");
      newHeaderRange.setBackground("#8B2500");
      newHeaderRange.setFontColor("#FFFFFF");
      Logger.log("Appended missing columns to Orders sheet: " + missingHeaders.join(", "));
    }
  }

  return sheet;
}

/**
 * Helper to determine which canonical Coupons headers are missing, respecting aliases.
 * Never appends a column if any alias for it exists. Add only "Description" if missing.
 */
function getMissingCouponsHeaders(existingHeaders) {
  var normExisting = existingHeaders.map(function(h) {
    return String(h || "").trim().toLowerCase().replace(/[\s_\-]+/g, "");
  });

  var descAliases = COUPON_ALIASES.description;
  var hasDesc = false;
  for (var d = 0; d < descAliases.length; d++) {
    if (normExisting.indexOf(descAliases[d].replace(/[\s_\-]+/g, "")) !== -1) {
      hasDesc = true;
      break;
    }
  }
  if (!hasDesc) {
    return ["Description"];
  }
  return [];
}

/**
 * Creates or retrieves the "Coupons" sheet.
 * If creating newly, sets up canonical A-N + Description headers and seeds sample rows with Active = FALSE.
 * If already exists, never touches existing data; appends only "Description" if missing.
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

    // Seed sample rows only when tab is newly created, with Active = false
    var sampleRows = [
      [
        "CPN-WELCOME10",
        "WELCOME10",
        "percentage",
        10,
        100,
        299,
        100,
        0,
        1,
        "2024-01-01",
        "2030-12-31",
        false,
        new Date().toISOString(),
        new Date().toISOString(),
        "10% off on your order"
      ],
      [
        "CPN-FLAT50",
        "FLAT50",
        "fixed",
        50,
        50,
        300,
        50,
        0,
        1,
        "2024-01-01",
        "2030-12-31",
        false,
        new Date().toISOString(),
        new Date().toISOString(),
        "Flat ₹50 off"
      ]
    ];

    for (var s = 0; s < sampleRows.length; s++) {
      sheet.appendRow(sampleRows[s]);
    }

    for (var c = 1; c <= COUPONS_HEADERS.length; c++) {
      sheet.autoResizeColumn(c);
    }
  } else {
    // Existing sheet: alias-aware check. Never append if any alias exists. Add only "Description" if missing.
    var lastCol = sheet.getLastColumn();
    var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var missing = getMissingCouponsHeaders(existingHeaders);
    if (missing.length > 0) {
      var newRange = sheet.getRange(1, lastCol + 1, 1, missing.length);
      newRange.setValues([missing]);
      newRange.setFontWeight("bold");
      newRange.setBackground("#8B2500");
      newRange.setFontColor("#FFFFFF");
      Logger.log("Appended missing column to Coupons tab: " + missing.join(", "));
    }
  }

  return sheet;
}

/**
 * Builds ONE header map from row 1 using alias matching (trim, ignore case and spaces).
 * FAIL CLOSED: if any field matches more than one column, or code/type/value is missing,
 * returns { error: "Coupon sheet configuration error", headersFound: [...] }.
 * Never guesses a column.
 */
function getCouponHeaderMap(headers) {
  var map = {};
  var matchedFields = {};
  var rawHeadersFound = [];

  for (var col = 0; col < headers.length; col++) {
    var raw = String(headers[col] || "").trim();
    rawHeadersFound.push(raw);
    if (!raw) continue;
    var norm = raw.toLowerCase().replace(/[\s_\-]+/g, "");

    // Check if explicitly ignored
    var isIgnored = false;
    for (var ig = 0; ig < IGNORED_COUPON_HEADERS.length; ig++) {
      if (norm === IGNORED_COUPON_HEADERS[ig].replace(/[\s_\-]+/g, "")) {
        isIgnored = true;
        break;
      }
    }
    if (isIgnored) continue;

    for (var field in COUPON_ALIASES) {
      var candidateList = COUPON_ALIASES[field];
      for (var c = 0; c < candidateList.length; c++) {
        var candNorm = candidateList[c].replace(/[\s_\-]+/g, "");
        if (norm === candNorm) {
          if (!matchedFields[field]) matchedFields[field] = [];
          matchedFields[field].push(col);
          break;
        }
      }
    }
  }

  // Check fail-closed condition 1: any field matches more than one column
  for (var f in matchedFields) {
    if (matchedFields[f].length > 1) {
      Logger.log("Coupon sheet configuration error: Multiple columns match field '" + f + "': columns " + matchedFields[f].join(", ") + ". Headers: " + JSON.stringify(rawHeadersFound));
      return {
        error: "Coupon sheet configuration error",
        reason: "Multiple columns match field '" + f + "'",
        headersFound: rawHeadersFound
      };
    }
    map[f] = matchedFields[f][0];
  }

  // Check fail-closed condition 2: required columns code, type, value must exist
  var required = ["code", "type", "value"];
  for (var r = 0; r < required.length; r++) {
    var reqField = required[r];
    if (map[reqField] === undefined) {
      Logger.log("Coupon sheet configuration error: Missing required column '" + reqField + "'. Headers: " + JSON.stringify(rawHeadersFound));
      return {
        error: "Coupon sheet configuration error",
        reason: "Missing required column '" + reqField + "'",
        headersFound: rawHeadersFound
      };
    }
  }

  return { map: map, headersFound: rawHeadersFound };
}

/**
 * Parses and normalizes all coupon fields from a sheet row using colMap and display values.
 * Strictly adheres to:
 * - Type normalization: percentage | percent | % -> PERCENT; fixed | flat | amount -> FLAT; anything else -> reject.
 * - Value parsing: if display text contains "%", use that number; otherwise use cell number as percent points.
 * - Value = 1 means 1% and must NEVER become 100%. No multiplier heuristic.
 * - Strips rupee signs and commas for money columns.
 * - Blank MaxDiscount / Usage Limit / dates = no limit.
 */
function parseCouponFromRow(row, displayRow, colMap) {
  function getVal(key) {
    var idx = colMap[key];
    return idx !== undefined ? row[idx] : undefined;
  }
  function getDisplay(key) {
    var idx = colMap[key];
    return (idx !== undefined && displayRow) ? displayRow[idx] : undefined;
  }

  // 1. Type normalization
  var rawType = String(getVal("type") || "").trim().toLowerCase();
  var discountType = "";
  if (rawType === "percentage" || rawType === "percent" || rawType === "%") {
    discountType = "percentage";
  } else if (rawType === "fixed" || rawType === "flat" || rawType === "amount") {
    discountType = "fixed";
  } else {
    return {
      invalidType: true,
      error: "Invalid discount type in sheet: " + rawType
    };
  }

  // 2. Value parsing
  var val = 0;
  if (discountType === "percentage") {
    var dispVal = String(getDisplay("value") || "");
    if (dispVal.indexOf("%") !== -1) {
      val = parseFloat(dispVal.replace(/[^\d.]/g, "")) || 0;
    } else {
      var cellVal = getVal("value");
      if (typeof cellVal === "number") {
        val = cellVal;
      } else {
        val = parseFloat(String(cellVal || "").replace(/[^\d.]/g, "")) || 0;
      }
    }
  } else {
    var rawFixed = getVal("value");
    if (typeof rawFixed === "number") {
      val = rawFixed;
    } else {
      val = parseFloat(String(rawFixed || "").replace(/[₹\s,]|Rs\.?/gi, "").replace(/[^\d.]/g, "")) || 0;
    }
  }

  // 3. MaxDiscount (blank = no limit -> 0)
  var rawMax = getVal("maxdiscount");
  var maxDisc = 0;
  if (rawMax !== undefined && rawMax !== null && String(rawMax).trim() !== "") {
    if (typeof rawMax === "number") {
      maxDisc = rawMax;
    } else {
      maxDisc = parseFloat(String(rawMax).replace(/[₹\s,]|Rs\.?/gi, "").replace(/[^\d.]/g, "")) || 0;
    }
  }

  // 4. MinOrder (blank = 0)
  var rawMin = getVal("minorder");
  var minOrder = 0;
  if (rawMin !== undefined && rawMin !== null && String(rawMin).trim() !== "") {
    if (typeof rawMin === "number") {
      minOrder = rawMin;
    } else {
      minOrder = parseFloat(String(rawMin).replace(/[₹\s,]|Rs\.?/gi, "").replace(/[^\d.]/g, "")) || 0;
    }
  }

  // 5. Active
  var rawActive = getVal("active");
  var isActive = false;
  if (rawActive === true || rawActive === 1) {
    isActive = true;
  } else if (rawActive !== undefined && rawActive !== null) {
    var actStr = String(rawActive).trim().toLowerCase();
    isActive = (actStr === "true" || actStr === "yes" || actStr === "1");
  }

  // 6. Usage limits (blank = 0, no limit)
  var rawUsageLimit = getVal("usagelimit");
  var usageLimit = 0;
  if (rawUsageLimit !== undefined && rawUsageLimit !== null && String(rawUsageLimit).trim() !== "") {
    usageLimit = Number(rawUsageLimit) || 0;
  }

  var rawUsedCount = getVal("usedcount");
  var usedCount = 0;
  if (rawUsedCount !== undefined && rawUsedCount !== null && String(rawUsedCount).trim() !== "") {
    usedCount = Number(rawUsedCount) || 0;
  }

  var rawPerCustomer = getVal("percustomer");
  var perCustomerLimit = 0;
  if (rawPerCustomer !== undefined && rawPerCustomer !== null && String(rawPerCustomer).trim() !== "") {
    perCustomerLimit = Number(rawPerCustomer) || 0;
  }

  return {
    code: String(getVal("code") || "").trim().toUpperCase(),
    description: String(getVal("description") || ""),
    type: discountType === "percentage" ? "PERCENT" : "FLAT",
    discountType: discountType,
    value: val,
    discountValue: val,
    maxDiscount: isNaN(maxDisc) ? 0 : maxDisc,
    maximumDiscount: isNaN(maxDisc) ? 0 : maxDisc,
    minOrder: isNaN(minOrder) ? 0 : minOrder,
    minimumOrder: isNaN(minOrder) ? 0 : minOrder,
    usageLimit: isNaN(usageLimit) ? 0 : usageLimit,
    usedCount: isNaN(usedCount) ? 0 : usedCount,
    perCustomerLimit: isNaN(perCustomerLimit) ? 0 : perCustomerLimit,
    startDate: getVal("start"),
    endDate: getVal("end"),
    active: isActive
  };
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
 * Uses ONE authoritative schema (A-N layout) with alias matching.
 * Fails closed if headers are ambiguous or missing.
 * Zero-total policy: enforces minimum Rs 1 payable when a coupon is applied.
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
    var lastCol = cSheet.getLastColumn();
    if (lastRow <= 1 || lastCol < 1) {
      return { success: false, valid: false, error: "Invalid coupon code" };
    }

    var headers = cSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var mapResult = getCouponHeaderMap(headers);
    if (mapResult.error) {
      Logger.log("validateCouponHandler header error: " + mapResult.error + " - " + mapResult.reason);
      return { success: false, valid: false, error: "Coupon sheet configuration error" };
    }
    var colMap = mapResult.map;
    var data = cSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var displayData = cSheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();

    var matchedRowIndex = -1;
    for (var r = 0; r < data.length; r++) {
      var cCode = String(data[r][colMap.code] || "").trim().toUpperCase();
      if (cCode === codeUpper) {
        matchedRowIndex = r;
        break;
      }
    }

    if (matchedRowIndex === -1) {
      return { success: false, valid: false, error: "Invalid coupon code" };
    }

    var coupon = parseCouponFromRow(data[matchedRowIndex], displayData[matchedRowIndex], colMap);
    if (coupon.invalidType) {
      return { success: false, valid: false, error: coupon.error || "Coupon sheet configuration error" };
    }

    // 1. Check Active
    if (!coupon.active) {
      return { success: false, valid: false, error: "This coupon is no longer active" };
    }

    // 2. Check Date Bounds in Asia/Kolkata timezone
    var nowKolkata = new Date();
    if (coupon.startDate) {
      var startDate = coupon.startDate instanceof Date ? coupon.startDate : new Date(coupon.startDate);
      if (!isNaN(startDate.getTime())) {
        var startMidnight = new Date(startDate);
        startMidnight.setHours(0, 0, 0, 0);
        if (nowKolkata < startMidnight) {
          return { success: false, valid: false, error: "Coupon is not yet active" };
        }
      }
    }

    if (coupon.endDate) {
      var endDate = coupon.endDate instanceof Date ? coupon.endDate : new Date(coupon.endDate);
      if (!isNaN(endDate.getTime())) {
        var endEndOfDay = new Date(endDate);
        endEndOfDay.setHours(23, 59, 59, 999);
        if (nowKolkata > endEndOfDay) {
          return { success: false, valid: false, error: "Coupon has expired" };
        }
      }
    }

    // 3. Check MinOrder
    if (coupon.minOrder > 0 && subtotal < coupon.minOrder) {
      return {
        success: false,
        valid: false,
        error: "Minimum order amount of ₹" + coupon.minOrder + " required for this coupon"
      };
    }

    // 4. Check Global UsageLimit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return { success: false, valid: false, error: "Coupon usage limit reached" };
    }

    // 5. Check PerCustomerLimit against Orders sheet
    if (coupon.perCustomerLimit > 0 && (customerPhone || customerEmail)) {
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
          if (custUses >= coupon.perCustomerLimit) {
            return {
              success: false,
              valid: false,
              error: "You have already reached the usage limit for this coupon"
            };
          }
        }
      }
    }

    // 6. Compute Discount with strict adherence to percentage and maxDiscount cap
    var rawDiscount = 0;
    if (coupon.discountType === "percentage") {
      rawDiscount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maximumDiscount > 0) {
        rawDiscount = Math.min(rawDiscount, coupon.maximumDiscount);
      }
    } else {
      rawDiscount = Math.round(coupon.discountValue);
      if (coupon.maximumDiscount > 0) {
        rawDiscount = Math.min(rawDiscount, coupon.maximumDiscount);
      }
    }

    // Zero-total policy: enforce minimum ₹1 payable when coupon is applied
    if (subtotal >= 1) {
      rawDiscount = Math.min(rawDiscount, subtotal - 1);
    } else {
      rawDiscount = 0;
    }
    rawDiscount = Math.max(0, rawDiscount);
    var finalAmount = Math.max(subtotal >= 1 ? 1 : 0, subtotal - rawDiscount);

    return {
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        discountType: coupon.discountType,
        value: coupon.discountValue,
        discountValue: coupon.discountValue,
        discount: rawDiscount,
        discountAmount: rawDiscount,
        finalAmount: finalAmount,
        minOrder: coupon.minOrder,
        minimumOrder: coupon.minOrder,
        maxDiscount: coupon.maximumDiscount,
        maximumDiscount: coupon.maximumDiscount
      }
    };
  } catch (err) {
    Logger.log("validateCouponHandler error: " + err.toString());
    return { success: false, valid: false, error: "Failed to validate coupon: " + err.toString() };
  }
}

/**
 * Returns all active, currently valid coupons for public display.
 * Uses ONE authoritative schema (A-N layout) with alias matching.
 */
function getCouponsHandler(ss) {
  try {
    var cSheet = getOrCreateCouponsSheet(ss);
    var lastRow = cSheet.getLastRow();
    var lastCol = cSheet.getLastColumn();
    if (lastRow <= 1 || lastCol < 1) {
      return { success: true, data: [] };
    }

    var headers = cSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var mapResult = getCouponHeaderMap(headers);
    if (mapResult.error) {
      Logger.log("getCouponsHandler header error: " + mapResult.error);
      return { success: false, data: [], error: mapResult.error };
    }
    var colMap = mapResult.map;
    var data = cSheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
    var displayData = cSheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();
    var nowKolkata = new Date();
    var publicCoupons = [];

    for (var r = 0; r < data.length; r++) {
      var row = data[r];
      var displayRow = displayData[r];
      var code = String(row[colMap.code] || "").trim().toUpperCase();
      if (!code) continue;

      var coupon = parseCouponFromRow(row, displayRow, colMap);
      if (coupon.invalidType || !coupon.active) continue;

      // Start date check
      if (coupon.startDate) {
        var startDate = coupon.startDate instanceof Date ? coupon.startDate : new Date(coupon.startDate);
        if (!isNaN(startDate.getTime())) {
          var startMidnight = new Date(startDate);
          startMidnight.setHours(0, 0, 0, 0);
          if (nowKolkata < startMidnight) continue;
        }
      }

      // End date check
      if (coupon.endDate) {
        var endDate = coupon.endDate instanceof Date ? coupon.endDate : new Date(coupon.endDate);
        if (!isNaN(endDate.getTime())) {
          var endEndOfDay = new Date(endDate);
          endEndOfDay.setHours(23, 59, 59, 999);
          if (nowKolkata > endEndOfDay) continue;
        }
      }

      // Usage limit check
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) continue;

      publicCoupons.push({
        code: coupon.code,
        description: coupon.description,
        type: coupon.type,
        discountType: coupon.discountType,
        value: coupon.discountValue,
        discountValue: coupon.discountValue,
        minOrder: coupon.minOrder,
        minimumOrder: coupon.minOrder,
        maxDiscount: coupon.maximumDiscount,
        maximumDiscount: coupon.maximumDiscount,
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
        version: APP_VERSION,
        appVersion: APP_VERSION,
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
        var cLastCol = couponsSheet.getLastColumn();
        if (cLastRow > 1 && cLastCol > 0) {
          var cHeaders = couponsSheet.getRange(1, 1, 1, cLastCol).getValues()[0];
          var cMapResult = getCouponHeaderMap(cHeaders);

          if (cMapResult.error) {
            couponNote = "FLAGGED: Coupon config error - " + cMapResult.error;
            Logger.log("Coupon config error during order persistence: " + cMapResult.error);
          } else {
            var cColMap = cMapResult.map;
            var cData = couponsSheet.getRange(2, 1, cLastRow - 1, cLastCol).getValues();
            var cDisplayData = couponsSheet.getRange(2, 1, cLastRow - 1, cLastCol).getDisplayValues();

            var cMatchIndex = -1;
            for (var cr = 0; cr < cData.length; cr++) {
              var rowCode = String(cData[cr][cColMap.code] || "").trim().toUpperCase();
              if (rowCode === couponCode) {
                cMatchIndex = cr;
                break;
              }
            }

            if (cMatchIndex !== -1 && cColMap.usedcount !== undefined) {
              var coupon = parseCouponFromRow(cData[cMatchIndex], cDisplayData[cMatchIndex], cColMap);
              var currentUsed = coupon.usedCount;
              var globalLimit = coupon.usageLimit;
              var perCustomerLimit = coupon.perCustomerLimit;
              var usedCountCol = cColMap.usedcount;

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
                // Increment ONLY the single Used Count column
                couponsSheet.getRange(cMatchIndex + 2, usedCountCol + 1).setValue(currentUsed + 1);
                couponNote = "Applied successfully";
                Logger.log("Incremented UsedCount for coupon " + couponCode + " (col " + (usedCountCol + 1) + ") to " + (currentUsed + 1));
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
 * Alias-aware: Never appends duplicate columns if any alias exists.
 */
function setupDatabase() {
  var ss = getSpreadsheet();
  getOrCreateOrdersSheet(ss);
  getOrCreateCouponsSheet(ss);
  Logger.log('Setup done: Orders and Coupons tabs are ready in "' + ss.getName() + '"');
}

/**
 * Editor-only diagnostic function.
 * Run directly from the Apps Script editor via Run > debugCoupon.
 * NOT exposed through doGet or doPost.
 */
function debugCoupon() {
  var testCode = "HI";
  var testSubtotal = 560;

  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName("Coupons");
  if (!sheet) {
    Logger.log("ERROR: Coupons sheet not found");
    return;
  }

  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol < 1 || lastRow < 2) {
    Logger.log("ERROR: Coupons sheet has no data");
    return;
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var mapResult = getCouponHeaderMap(headers);
  Logger.log("--- HEADER MAP RESULT ---");
  Logger.log(JSON.stringify(mapResult));
  if (mapResult.error) {
    Logger.log("Header map error: " + mapResult.error + " - " + mapResult.reason);
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var displayData = sheet.getRange(2, 1, lastRow - 1, lastCol).getDisplayValues();

  var foundRowIndex = -1;
  var codeCol = mapResult.map.code;
  for (var r = 0; r < data.length; r++) {
    var cCode = String(data[r][codeCol] || "").trim().toUpperCase();
    if (cCode === testCode.trim().toUpperCase()) {
      foundRowIndex = r;
      break;
    }
  }

  if (foundRowIndex === -1) {
    Logger.log("Coupon code '" + testCode + "' not found in sheet.");
    return;
  }

  var rawRow = data[foundRowIndex];
  var displayRow = displayData[foundRowIndex];
  Logger.log("--- RAW ROW DATA ---");
  Logger.log(JSON.stringify(rawRow));
  Logger.log("--- DISPLAY ROW DATA ---");
  Logger.log(JSON.stringify(displayRow));

  var parsed = parseCouponFromRow(rawRow, displayRow, mapResult.map);
  Logger.log("--- PARSED COUPON ---");
  Logger.log(JSON.stringify(parsed));

  if (parsed.invalidType) {
    Logger.log("Error: " + parsed.error);
    return;
  }

  var rawDiscount = 0;
  if (parsed.discountType === "percentage") {
    rawDiscount = Math.round((testSubtotal * parsed.discountValue) / 100);
    if (parsed.maximumDiscount > 0) {
      rawDiscount = Math.min(rawDiscount, parsed.maximumDiscount);
    }
  } else {
    rawDiscount = Math.round(parsed.discountValue);
    if (parsed.maximumDiscount > 0) {
      rawDiscount = Math.min(rawDiscount, parsed.maximumDiscount);
    }
  }

  if (testSubtotal >= 1) {
    rawDiscount = Math.min(rawDiscount, testSubtotal - 1);
  } else {
    rawDiscount = 0;
  }
  rawDiscount = Math.max(0, rawDiscount);
  var finalAmount = Math.max(testSubtotal >= 1 ? 1 : 0, testSubtotal - rawDiscount);

  Logger.log("--- COMPUTED PRICING ---");
  Logger.log("Subtotal: ₹" + testSubtotal);
  Logger.log("Discount: ₹" + rawDiscount);
  Logger.log("Final Amount: ₹" + finalAmount);
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




/**
 * Google Apps Script for Kayal Samayal
 * Database Integration + UPI Manual Payment + COD/Pay Later + Email via MailApp
 * Spreadsheet ID: 1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc
 *
 * Payment Methods:
 *   UPI  — Customer pays via UPI, enters UTR. Status: Pending Verification.
 *   COD  — Customer skips payment. Payment Method: COD / Pay Later. Status: Pending.
 *
 * IMPORTANT: UPI ID and Admin Email are read from Settings sheet.
 * Configure them in the Settings sheet before going live. Do NOT hardcode here.
 */

var SPREADSHEET_ID = "1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc";

var TABS = {
  PRODUCTS:    "Products",
  CUSTOMERS:   "Customers",
  ORDERS:      "Orders",
  ORDER_ITEMS: "Order Items",
  REVIEWS:     "Reviews",
  SETTINGS:    "Settings"
};

// ── CORE HELPERS ─────────────────────────────────────────────────────────────

/**
 * Safe Sheet Lookup — tries primary name then alternatives.
 */
function getSheetSafely(ss, preferredName, alternativeNames) {
  var sheet = ss.getSheetByName(preferredName);
  if (sheet) return sheet;
  if (alternativeNames && Array.isArray(alternativeNames)) {
    for (var i = 0; i < alternativeNames.length; i++) {
      sheet = ss.getSheetByName(alternativeNames[i]);
      if (sheet) return sheet;
    }
  }
  return null;
}

/**
 * Read a single value from the Settings sheet by key.
 * Uses dynamic header detection so it works whether header is on Row 1 or Row 2.
 */
function getSettingValue(ss, key) {
  try {
    var sheet = getSheetSafely(ss, TABS.SETTINGS);
    if (!sheet) return null;

    if (typeof findSettingsHeaderRow === "function") {
      var headerInfo = findSettingsHeaderRow(sheet, 10);
      if (headerInfo) {
        var lastRow = sheet.getLastRow();
        var startDataRow = headerInfo.headerRowNumber + 1;
        if (lastRow >= startDataRow) {
          var numRows = lastRow - headerInfo.headerRowNumber;
          var displayValues = sheet.getRange(startDataRow, 1, numRows, sheet.getLastColumn()).getDisplayValues();
          for (var i = 0; i < displayValues.length; i++) {
            var rowKey = String(displayValues[i][headerInfo.keyCol] || "").trim();
            if (rowKey === key) {
              return String(displayValues[i][headerInfo.valCol] || "").trim();
            }
          }
        }
      }
    }

    var data = getSheetRowsAsJSON(sheet);
    var row = data.filter(function(r) { return String(r["Key"] || "").trim() === key; })[0];
    return row ? String(row["Value"] || "").trim() : null;
  } catch (e) {
    Logger.log("getSettingValue error for key '" + key + "': " + e.toString());
    return null;
  }
}

/**
 * Convert a sheet's rows to array of JSON objects keyed by header row.
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
 * Return a JSON TextOutput response.
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Write a log entry to the API Logs sheet.
 */
function logApiAction(ss, logData) {
  try {
    var logsSheet = getSheetSafely(ss, "API Logs");
    if (!logsSheet) return;
    var ts   = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMddHHmmss");
    var rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
    var logId = "LOG-" + ts + "-" + rand;
    logsSheet.appendRow([
      logId,
      new Date(),
      logData.action    || "",
      logData.method    || "POST",
      logData.orderId   || "",
      logData.customerId|| "",
      logData.status    || "",
      logData.request  ? JSON.stringify(logData.request).substring(0, 500)  : "",
      logData.response ? JSON.stringify(logData.response).substring(0, 500) : "",
      logData.message   || ""
    ]);
  } catch (e) {
    Logger.log("logApiAction error: " + e.toString());
  }
}

/**
 * Add missing payment columns to the Orders sheet non-destructively.
 */
function addPaymentColumnsToOrders(ss) {
  try {
    var ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
    if (!ordersSheet || ordersSheet.getLastColumn() === 0) return;

    var headerRow       = ordersSheet.getRange(1, 1, 1, ordersSheet.getLastColumn()).getValues()[0];
    var existingHeaders = headerRow.map(function(h) { return String(h).trim(); });

    var paymentCols = [
      "Payment Method",
      "UPI ID",
      "UTR",
      "Payment Submitted At",
      "Payment Verified At",
      "Payment Screenshot File ID",
      "Payment Screenshot URL",
      "Payment Evidence"
    ];

    paymentCols.forEach(function(colName) {
      if (existingHeaders.indexOf(colName) === -1) {
        var nextCol = ordersSheet.getLastColumn() + 1;
        var cell    = ordersSheet.getRange(1, nextCol);
        cell.setValue(colName);
        cell.setFontWeight("bold").setBackground("#F4EBE1");
        ordersSheet.autoResizeColumn(nextCol);
        existingHeaders.push(colName);
        Logger.log("Added payment column to Orders: " + colName);
      }
    });
  } catch (e) {
    Logger.log("addPaymentColumnsToOrders error: " + e.toString());
  }
}

// ── DATABASE SETUP ───────────────────────────────────────────────────────────

/**
 * Administrative Setup — safe to run multiple times.
 * Skips existing sheets, adds missing columns only.
 */
function setupDatabaseSheets() {
  var ss              = SpreadsheetApp.openById(SPREADSHEET_ID);
  var spreadsheetName = ss.getName();
  var createdSheets   = [];
  var skippedSheets   = [];

  var sheetDefinitions = [
    {
      name:     TABS.PRODUCTS,
      altNames: ["products_export", "products"],
      headers:  ["Product ID", "Product Name", "Category", "Tier", "Price", "MRP", "GST", "Stock", "Image", "Description", "Highlights", "Active"]
    },
    {
      name:     TABS.CUSTOMERS,
      altNames: ["Customer", "Customers Sheet"],
      headers:  ["Customer ID", "Full Name", "Mobile", "Email", "Shipping Address", "City/Town", "State", "Pincode", "Created At", "Updated At"]
    },
    {
      name:     TABS.ORDERS,
      altNames: ["Order", "Orders Sheet"],
      headers:  [
        "Order ID", "Customer ID", "Order Date", "Full Name", "Mobile", "Email",
        "Shipping Address", "City/Town", "State", "Pincode", "Order Notes",
        "Subtotal", "GST", "Shipping", "Discount", "Grand Total",
        "Payment Status", "Order Status", "Created At",
        "Payment Method", "UPI ID", "UTR", "Payment Submitted At", "Payment Verified At",
        "Payment Screenshot File ID", "Payment Screenshot URL", "Payment Evidence"
      ]
    },
    {
      name:     TABS.ORDER_ITEMS,
      altNames: ["OrderItems", "Order_Items"],
      headers:  ["Order Item ID", "Order ID", "Product ID", "Product Name", "Tier", "Quantity", "Unit Price", "GST %", "GST Amount", "Line Total", "Created At"]
    },
    {
      name:     TABS.REVIEWS,
      altNames: [],
      headers:  ["Review ID", "Product ID", "Product Name", "Customer Name", "Rating", "Review", "Approved", "Created At"]
    },
    {
      name:     TABS.SETTINGS,
      altNames: [],
      headers:  ["Key", "Value", "Description", "Updated At"]
    },
    {
      name:     "API Logs",
      altNames: [],
      headers:  ["Log ID", "Timestamp", "Action", "Method", "Order ID", "Customer ID", "Status", "Request Data", "Response Data", "Error Message"]
    }
  ];

  Logger.log("Starting Database Setup...");

  sheetDefinitions.forEach(function(def) {
    var sheet = getSheetSafely(ss, def.name, def.altNames);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.appendRow(def.headers);
      sheet.setFrozenRows(1);
      var headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setFontWeight("bold").setBackground("#F4EBE1");
      for (var i = 1; i <= def.headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
      createdSheets.push(def.name);
      Logger.log("Created sheet: " + def.name);
    } else {
      skippedSheets.push(sheet.getName());
      Logger.log("Sheet already exists: " + sheet.getName());
    }
  });

  // Non-destructively add payment columns to existing Orders sheet
  addPaymentColumnsToOrders(ss);

  // Seed Settings — only if sheet is empty (header row only)
  var settingsSheet = getSheetSafely(ss, TABS.SETTINGS);
  if (settingsSheet) {
    var existingSettings = settingsSheet.getLastRow() > 1 ? getSheetRowsAsJSON(settingsSheet) : [];
    var existingKeys     = existingSettings.map(function(r) { return String(r["Key"] || "").trim(); });

    var allSettings = [
      ["business_name",           "Kayal Samayal",  "The name of the business",                          new Date()],
      ["whatsapp_number",         "+91 9003860616", "Direct customer care WhatsApp line",                new Date()],
      ["shipping_charge",         "60",             "Flat shipping charge in INR",                       new Date()],
      ["free_shipping_threshold", "500",            "Cart subtotal threshold for free shipping (INR)",   new Date()],
      ["default_gst",             "0.05",           "Standard GST rate (0.05 = 5%)",                     new Date()],
      ["upi_id",                  "",               "UPI ID for receiving payments — CONFIGURE BEFORE GOING LIVE", new Date()],
      ["admin_email",             "",               "Owner email for order notifications — CONFIGURE BEFORE GOING LIVE", new Date()]
    ];

    allSettings.forEach(function(row) {
      if (existingKeys.indexOf(row[0]) === -1) {
        settingsSheet.appendRow(row);
        Logger.log("Seeded setting: " + row[0]);
      }
    });
  }

  Logger.log("=========================================");
  Logger.log("DATABASE SYNC COMPLETE");
  Logger.log("Spreadsheet: " + spreadsheetName);
  Logger.log("Created: "  + (createdSheets.length > 0 ? createdSheets.join(", ") : "None"));
  Logger.log("Skipped (already exist): " + skippedSheets.join(", "));
  Logger.log("=========================================");
}

// ── HTTP GET HANDLER ─────────────────────────────────────────────────────────

function doGet(e) {
  var action = e.parameter ? e.parameter.action : null;

  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === "setup") {
      setupDatabaseSheets();
      return jsonResponse({ success: true, message: "Database sheets initialized successfully!" });
    }

    if (action === "health") {
      return jsonResponse({ success: true, message: "Kayal Samayal API is working", timestamp: new Date() });
    }

    if (action === "diag") {
      return jsonResponse({ success: true, data: testDatabaseSheets() });
    }

    if (action === "testSampleOrder") {
      return jsonResponse(testSampleOrder());
    }

    if (action === "products") {
      var sheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
      if (!sheet) return jsonResponse({ success: false, error: "Products sheet not found", step: "Products lookup" });
      return jsonResponse({ success: true, data: getSheetRowsAsJSON(sheet) });
    }

    if (action === "reviews") {
      var rSheet = getSheetSafely(ss, TABS.REVIEWS);
      if (!rSheet) return jsonResponse({ success: true, data: [] });
      var filtered = getSheetRowsAsJSON(rSheet).filter(function(r) {
        return r["Active"] === true || String(r["Active"]).toLowerCase() === "true" || r["Active"] === "TRUE";
      });
      return jsonResponse({ success: true, data: filtered });
    }

    if (action === "settings") {
      var sSheet = getSheetSafely(ss, TABS.SETTINGS);
      if (!sSheet) return jsonResponse({ success: true, data: {} });
      var settingsMap = {};

      if (typeof findSettingsHeaderRow === "function") {
        var sHeaderInfo = findSettingsHeaderRow(sSheet, 10);
        if (sHeaderInfo) {
          var sLastRow = sSheet.getLastRow();
          var sStartRow = sHeaderInfo.headerRowNumber + 1;
          if (sLastRow >= sStartRow) {
            var sNumRows = sLastRow - sHeaderInfo.headerRowNumber;
            var sDisplayValues = sSheet.getRange(sStartRow, 1, sNumRows, sSheet.getLastColumn()).getDisplayValues();
            for (var si = 0; si < sDisplayValues.length; si++) {
              var sKey = String(sDisplayValues[si][sHeaderInfo.keyCol] || "").trim();
              if (sKey) {
                settingsMap[sKey] = sDisplayValues[si][sHeaderInfo.valCol];
              }
            }
            return jsonResponse({ success: true, data: settingsMap });
          }
        }
      }

      getSheetRowsAsJSON(sSheet).forEach(function(row) {
        if (row["Key"]) {
          settingsMap[row["Key"]] = row["Value"];
        }
      });
      return jsonResponse({ success: true, data: settingsMap });
    }

    if (action === "order") {
      var orderId = e.parameter.id;
      if (!orderId) return jsonResponse({ success: false, error: "Order ID parameter is required", step: "Parameter Validation" });
      var ordersSheet   = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      var itemsSheet    = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);
      var custSheet2    = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
      if (!ordersSheet || !itemsSheet) return jsonResponse({ success: false, error: "Orders or Order Items sheet not found", step: "Orders Lookup" });
      var orders    = getSheetRowsAsJSON(ordersSheet);
      var order     = orders.filter(function(o) { return o["Order ID"] === orderId; })[0];
      if (!order) return jsonResponse({ success: false, error: "Order not found", step: "Order Search" });
      var orderItems = getSheetRowsAsJSON(itemsSheet).filter(function(item) { return item["Order ID"] === orderId; });
      var customer   = null;
      if (custSheet2 && order["Customer ID"]) {
        customer = getSheetRowsAsJSON(custSheet2).filter(function(c) { return c["Customer ID"] === order["Customer ID"]; })[0] || null;
      }
      return jsonResponse({ success: true, data: { order: order, customer: customer, items: orderItems } });
    }

    return jsonResponse({ success: false, error: "Unknown action parameter", step: "Action Routing" });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString(), step: "doGet Exception" });
  }
}

// ── HTTP POST HANDLER ────────────────────────────────────────────────────────

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Missing request body", step: "POST Body Parsing" });
    }

    var postData = JSON.parse(e.postData.contents);
    var action   = postData.action;
    var ss       = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (!action) {
      return jsonResponse({ success: false, error: "Missing action parameter", step: "POST Action Routing" });
    }

    if (action === "createCustomer") {
      var custSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
      if (!custSheet) {
        setupDatabaseSheets();
        custSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
      }
      if (!custSheet) return jsonResponse({ success: false, error: "Customers sheet not found", step: "Customers Sheet Lookup" });
      return jsonResponse({ success: true, customerId: findOrCreateCustomer(custSheet, postData) });
    }

    if (action === "createOrder") {
      return jsonResponse(processOrderTransaction(ss, postData));
    }

    if (action === "updateOrder") {
      var ordSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      if (!ordSheet) {
        setupDatabaseSheets();
        ordSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      }
      if (!ordSheet) return jsonResponse({ success: false, error: "Orders sheet not found", step: "Orders Sheet Lookup" });
      return jsonResponse(updateOrderStatus(ordSheet, postData));
    }

    if (action === "diag") {
      return jsonResponse({ success: true, data: testDatabaseSheets() });
    }

    if (action === "testSampleOrder") {
      return jsonResponse(testSampleOrder());
    }

    return jsonResponse({ success: false, error: "Unknown action payload", step: "POST Action Routing" });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString(), step: "doPost Exception" });
  }
}

// ── CUSTOMER ─────────────────────────────────────────────────────────────────

/**
 * Find existing customer by mobile or create a new one.
 */
function findOrCreateCustomer(sheet, data) {
  var name    = data.name    || "Anonymous";
  var mobile  = String(data.mobile  || "").trim();
  var email   = data.email   || "";
  var address = data.address || "";
  var city    = data.city    || "";
  var state   = data.state   || "";
  var pincode = String(data.pincode || "").trim();

  var customers = getSheetRowsAsJSON(sheet);
  var existing  = customers.filter(function(c) { return String(c["Mobile"]).trim() === mobile; })[0];

  if (existing) {
    var rowIndex = customers.indexOf(existing) + 2;
    sheet.getRange(rowIndex, 2).setValue(name);
    sheet.getRange(rowIndex, 4).setValue(email);
    sheet.getRange(rowIndex, 5).setValue(address);
    sheet.getRange(rowIndex, 6).setValue(city);
    sheet.getRange(rowIndex, 7).setValue(state);
    sheet.getRange(rowIndex, 8).setValue(pincode);
    sheet.getRange(rowIndex, 10).setValue(new Date());
    return existing["Customer ID"];
  }

  var dateStr   = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd");
  var countStr  = String(customers.length + 1).padStart(4, "0");
  var customerId = "CUS-" + dateStr + "-" + countStr;
  sheet.appendRow([customerId, name, mobile, email, address, city, state, pincode, new Date(), new Date()]);
  return customerId;
}

/**
 * Decodes base64 payment screenshot and saves it to a Google Drive folder.
 * Returns { fileId: string, url: string } or null.
 */
function savePaymentScreenshotToDrive(base64Data, filename) {
  if (!base64Data) return null;
  try {
    var data = base64Data;
    if (data.indexOf(",") > -1) {
      data = data.split(",")[1];
    }
    var decodedBytes = Utilities.base64Decode(data);
    
    var mimeType = "image/jpeg";
    var lower = String(filename || "").toLowerCase();
    if (lower.endsWith(".png")) mimeType = "image/png";
    else if (lower.endsWith(".webp")) mimeType = "image/webp";
    
    var blob = Utilities.newBlob(decodedBytes, mimeType, filename || "screenshot.jpg");
    
    var folderName = "Kayal Samayal Payment Screenshots";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      Logger.log("Created Drive folder: " + folderName);
    }
    
    var file = folder.createFile(blob);
    return {
      fileId: file.getId(),
      url: file.getUrl()
    };
  } catch (e) {
    Logger.log("savePaymentScreenshotToDrive error: " + e.toString());
    return null;
  }
}

// ── ORDER PROCESSING ─────────────────────────────────────────────────────────

/**
 * Full order transaction.
 * Accepts paymentMethod: "UPI" or "COD".
 * Backend sets all payment values — never trusts frontend.
 */
function processOrderTransaction(ss, data) {
  try {
    var productsSheet  = getSheetSafely(ss, TABS.PRODUCTS,    ["products_export", "products"]);
    var ordersSheet    = getSheetSafely(ss, TABS.ORDERS,      ["Order", "Orders Sheet"]);
    var itemsSheet     = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);
    var customersSheet = getSheetSafely(ss, TABS.CUSTOMERS,   ["Customer", "Customers Sheet"]);

    if (!productsSheet || !ordersSheet || !itemsSheet || !customersSheet) {
      setupDatabaseSheets();
      productsSheet  = getSheetSafely(ss, TABS.PRODUCTS,    ["products_export", "products"]);
      ordersSheet    = getSheetSafely(ss, TABS.ORDERS,      ["Order", "Orders Sheet"]);
      itemsSheet     = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);
      customersSheet = getSheetSafely(ss, TABS.CUSTOMERS,   ["Customer", "Customers Sheet"]);
    }

    if (!productsSheet)  return { success: false, error: "Sheet not found", step: "Products" };
    if (!ordersSheet)    return { success: false, error: "Sheet not found", step: "Orders" };
    if (!itemsSheet)     return { success: false, error: "Sheet not found", step: "Order Items" };
    if (!customersSheet) return { success: false, error: "Sheet not found", step: "Customers" };

    // Extract fields
    var customerInput = data.customer;
    var itemsInput    = data.items;
    var rawUtr        = String(data.utr || "").trim();
    var paymentMethod = data.paymentMethod || "UPI";

    // Validate paymentMethod — backend must not trust frontend
    if (paymentMethod !== "UPI" && paymentMethod !== "COD") {
      return {
        success: false,
        error: "Invalid payment method: " + paymentMethod + ". Allowed: UPI, COD",
        step: "Payment Method Validation"
      };
    }

    // Backend-authoritative payment values
    var displayPaymentMethod = (paymentMethod === "UPI") ? "UPI" : "COD / Pay Later";
    var paymentStatus        = (paymentMethod === "UPI") ? "Pending Verification" : "Pending";
    var storedUtr            = (paymentMethod === "UPI") ? rawUtr : "";
    var orderStatus          = (paymentMethod === "COD") ? "New" : "Pending";
    var paymentSubmittedAt   = (paymentMethod === "UPI") ? new Date() : "";

    // Upload screenshot to Drive if provided
    var screenshotResult = null;
    if (paymentMethod === "UPI" && data.screenshotBase64) {
      screenshotResult = savePaymentScreenshotToDrive(data.screenshotBase64, data.screenshotName || "payment_screenshot.jpg");
    }

    // Determine payment evidence type
    var paymentEvidence = "None";
    if (paymentMethod === "UPI") {
      var hasUtr = storedUtr !== "";
      var hasScreenshot = !!screenshotResult;
      if (hasUtr && hasScreenshot) {
        paymentEvidence = "UTR + Screenshot";
      } else if (hasUtr) {
        paymentEvidence = "UTR";
      } else if (hasScreenshot) {
        paymentEvidence = "Screenshot";
      }
    }

    // Validate customer
    if (!customerInput || !customerInput.name || !customerInput.mobile) {
      return { success: false, error: "Customer name and mobile are required", step: "Customer Validation" };
    }

    // Validate items
    if (!itemsInput || !Array.isArray(itemsInput) || itemsInput.length === 0) {
      return { success: false, error: "Cart is empty", step: "Items Validation" };
    }

    // Validate each product, active status, stock
    var products       = getSheetRowsAsJSON(productsSheet);
    var validatedItems = [];
    var subtotal       = 0;

    for (var i = 0; i < itemsInput.length; i++) {
      var item    = itemsInput[i];
      var product = products.filter(function(p) {
        return String(p["Product ID"] || p["id"] || p["productId"]) === String(item.productId);
      })[0];

      if (!product) {
        return { success: false, error: "Product not found: " + item.productId, step: "Product Lookup" };
      }

      var activeVal = (product["Active"] !== undefined) ? product["Active"] : product["active"];
      var active    = activeVal === true
        || String(activeVal).toLowerCase() === "true"
        || activeVal === 1
        || String(activeVal).toLowerCase() === "yes";

      if (!active) {
        return {
          success: false,
          error: "Product is inactive: " + (product["Product Name"] || product["name"]),
          step: "Product Active Check"
        };
      }

      var requestedQty   = Number(item.quantity || 1);
      var availableStock = Number((product["Stock"] !== undefined) ? product["Stock"] : ((product["stock"] !== undefined) ? product["stock"] : 999));

      if (requestedQty > availableStock) {
        return {
          success: false,
          error: "Insufficient stock for: " + (product["Product Name"] || product["name"]) + ". Available: " + availableStock,
          step: "Stock Check"
        };
      }

      var unitPrice = Number((product["Price"] !== undefined) ? product["Price"] : ((product["price"] !== undefined) ? product["price"] : 0));
      var gstRate   = Number((product["GST"]   !== undefined) ? product["GST"]   : ((product["gst"]   !== undefined) ? product["gst"]   : 0));
      var lineTotal = unitPrice * requestedQty;

      subtotal += lineTotal;

      validatedItems.push({
        product:     product,
        productId:   String(product["Product ID"] || product["id"] || item.productId),
        productName: String(product["Product Name"] || product["name"] || ""),
        tier:        String(product["Tier"] || product["tier"] || "regular"),
        quantity:    requestedQty,
        unitPrice:   unitPrice,
        gstRate:     gstRate,
        lineTotal:   lineTotal
      });
    }

    // Calculate totals
    var gstTotal = validatedItems.reduce(function(sum, item) { return sum + (item.lineTotal * item.gstRate); }, 0);

    var shippingCharge        = 60;
    var freeShippingThreshold = 500;
    var settingsSheet = getSheetSafely(ss, TABS.SETTINGS);
    if (settingsSheet) {
      try {
        var settings  = getSheetRowsAsJSON(settingsSheet);
        var shipVal   = settings.filter(function(s) { return s["Key"] === "shipping_charge"; })[0];
        var threshVal = settings.filter(function(s) { return s["Key"] === "free_shipping_threshold"; })[0];
        if (shipVal   && shipVal["Value"]   !== "" && shipVal["Value"]   !== undefined) shippingCharge        = Number(shipVal["Value"]);
        if (threshVal && threshVal["Value"] !== "" && threshVal["Value"] !== undefined) freeShippingThreshold = Number(threshVal["Value"]);
      } catch (e) { /* use defaults */ }
    }

    var shipping   = (subtotal >= freeShippingThreshold) ? 0 : shippingCharge;
    var discount   = 0;
    var grandTotal = subtotal + shipping + gstTotal - discount;

    // Read authoritative UPI ID from Settings
    var upiId = getSettingValue(ss, "upi_id") || "";

    // Find/create customer
    var customerId = findOrCreateCustomer(customersSheet, customerInput);

    // Generate Order ID
    var orders       = getSheetRowsAsJSON(ordersSheet);
    var dateStr      = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd");
    var orderCountStr= String(orders.length + 1).padStart(4, "0");
    var orderId      = "KYS-" + dateStr + "-" + orderCountStr;

    // Append Order row (19 base columns)
    ordersSheet.appendRow([
      orderId,
      customerId,
      new Date(),
      customerInput.name,
      customerInput.mobile,
      customerInput.email   || "",
      customerInput.address || "",
      customerInput.city    || "",
      customerInput.state   || "",
      customerInput.pincode || "",
      customerInput.notes   || "",
      subtotal,
      gstTotal,
      shipping,
      discount,
      grandTotal,
      paymentStatus,   // "Pending Verification" or "Pending"
      orderStatus,     // "Pending" (UPI) or "New" (COD)
      new Date()       // Created At
    ]);

    // Set payment columns by header name (safe for any column order)
    var newOrderRowNum  = ordersSheet.getLastRow();
    var orderHeaderVals = ordersSheet.getRange(1, 1, 1, ordersSheet.getLastColumn()).getValues()[0];

    function setOrderCol(colName, value) {
      var idx = orderHeaderVals.indexOf(colName) + 1;
      if (idx > 0) ordersSheet.getRange(newOrderRowNum, idx).setValue(value);
    }

    setOrderCol("Payment Method",      displayPaymentMethod);
    setOrderCol("UPI ID",              (paymentMethod === "UPI") ? upiId : "");
    setOrderCol("UTR",                 storedUtr);
    setOrderCol("Payment Submitted At", paymentSubmittedAt);
    setOrderCol("Payment Verified At",  "");
    setOrderCol("Payment Screenshot File ID", screenshotResult ? screenshotResult.fileId : "");
    setOrderCol("Payment Screenshot URL",     screenshotResult ? screenshotResult.url    : "");
    setOrderCol("Payment Evidence",           paymentEvidence);

    // Append Order Items & deduct stock
    validatedItems.forEach(function(item, index) {
      var orderItemId = orderId + "-ITEM-" + String(index + 1).padStart(3, "0");
      itemsSheet.appendRow([
        orderItemId,
        orderId,
        item.productId,
        item.productName,
        item.tier,
        item.quantity,
        item.unitPrice,
        item.gstRate,
        item.lineTotal * item.gstRate,
        item.lineTotal,
        new Date()
      ]);

      // Deduct stock
      var pIndex       = products.indexOf(item.product) + 2;
      var currentStock = Number((item.product["Stock"] !== undefined) ? item.product["Stock"] : ((item.product["stock"] !== undefined) ? item.product["stock"] : 0));
      var newStock     = Math.max(0, currentStock - item.quantity);
      var prodHeaders  = productsSheet.getRange(1, 1, 1, productsSheet.getLastColumn()).getValues()[0];
      var stockColIdx  = -1;
      prodHeaders.forEach(function(h, i) { if (String(h).trim().toLowerCase() === "stock") stockColIdx = i + 1; });
      if (stockColIdx > 0) {
        productsSheet.getRange(pIndex, stockColIdx).setValue(newStock);
      }
    });

    // Build shared data object for emails
    var orderData = {
      orderId:      orderId,
      customerId:   customerId,
      customerInput: customerInput,
      validatedItems: validatedItems,
      subtotal:     subtotal,
      gstTotal:     gstTotal,
      shipping:     shipping,
      discount:     discount,
      grandTotal:   grandTotal,
      paymentMethod: displayPaymentMethod,
      paymentStatus: paymentStatus,
      utr:          storedUtr,
      upiId:        (paymentMethod === "UPI") ? upiId : "",
      screenshotFileId: screenshotResult ? screenshotResult.fileId : "",
      screenshotUrl:    screenshotResult ? screenshotResult.url    : "",
      paymentEvidence:  paymentEvidence
    };

    // Send emails — NEVER cancels order on failure
    var emailSent  = false;
    var emailError = "";
    try {
      var customerEmail = String(customerInput.email || "").trim();
      if (customerEmail) {
        sendOrderConfirmationEmail(ss, orderData);
      }
      sendAdminNotificationEmail(ss, orderData);
      emailSent = true;
      logApiAction(ss, { action: "email_success", method: "POST", orderId: orderId, customerId: customerId, status: "SUCCESS", message: "Customer + admin emails sent" });
    } catch (emailErr) {
      emailSent  = false;
      emailError = emailErr.toString();
      logApiAction(ss, { action: "email_failure", method: "POST", orderId: orderId, customerId: customerId, status: "ERROR", message: "Email failed: " + emailError });
      Logger.log("Email failed (order still saved): " + emailError);
    }

    // Log order success
    logApiAction(ss, {
      action:    "createOrder",
      method:    "POST",
      orderId:   orderId,
      customerId: customerId,
      status:    "SUCCESS",
      message:   "Order created. paymentMethod=" + displayPaymentMethod + " emailSent=" + emailSent
    });

    return {
      success:       true,
      orderId:       orderId,
      customerId:    customerId,
      paymentMethod: displayPaymentMethod,
      paymentStatus: paymentStatus,
      utr:           storedUtr,
      paymentEvidence: paymentEvidence,
      paymentScreenshotUploaded: !!screenshotResult,
      subtotal:      subtotal,
      shipping:      shipping,
      discount:      discount,
      gst:           gstTotal,
      grandTotal:    grandTotal,
      orderStatus:   orderStatus,
      emailSent:     emailSent,
      items: validatedItems.map(function(i) {
        return {
          productId:   i.productId,
          productName: i.productName,
          tier:        i.tier,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
          total:       i.lineTotal
        };
      }),
      message: "Order placed successfully"
    };

  } catch (err) {
    try {
      logApiAction(SpreadsheetApp.openById(SPREADSHEET_ID), { action: "createOrder", status: "ERROR", message: err.toString() });
    } catch (e) { /* ignore */ }
    return { success: false, error: err.toString(), step: "processOrderTransaction Execution" };
  }
}

// ── EMAIL FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Build HTML email body for order confirmation (customer) or admin notification.
 * Uses plain string concatenation to avoid nested template literal issues in Apps Script.
 */
function buildOrderEmailHtml(orderData, isAdmin) {
  var orderId        = orderData.orderId;
  var customerId     = orderData.customerId;
  var customerInput  = orderData.customerInput;
  var validatedItems = orderData.validatedItems;
  var subtotal       = orderData.subtotal;
  var gstTotal       = orderData.gstTotal;
  var shipping       = orderData.shipping;
  var discount       = orderData.discount;
  var grandTotal     = orderData.grandTotal;
  var paymentMethod  = orderData.paymentMethod;
  var paymentStatus  = orderData.paymentStatus;
  var utr            = orderData.utr;
  var upiId          = orderData.upiId;

  var orderDate = Utilities.formatDate(new Date(), "GMT+5:30", "dd MMM yyyy hh:mm a");
  var isCod     = (paymentMethod === "COD / Pay Later");

  // Items rows
  var itemsRows = validatedItems.map(function(item) {
    return '<tr style="border-bottom:1px solid #f0e6d6;">'
      + '<td style="padding:8px 6px;font-size:13px;font-family:sans-serif;">' + item.productName + '</td>'
      + '<td style="padding:8px 6px;font-size:12px;font-family:sans-serif;color:#7a5c3a;text-transform:capitalize;">' + item.tier + '</td>'
      + '<td style="padding:8px 6px;font-size:13px;text-align:center;font-family:sans-serif;">' + item.quantity + '</td>'
      + '<td style="padding:8px 6px;font-size:13px;text-align:right;font-family:sans-serif;">Rs. ' + item.unitPrice.toFixed(2) + '</td>'
      + '<td style="padding:8px 6px;font-size:12px;text-align:right;font-family:sans-serif;color:#7a5c3a;">' + (item.gstRate * 100).toFixed(0) + '%</td>'
      + '<td style="padding:8px 6px;font-size:13px;text-align:right;font-family:sans-serif;font-weight:bold;">Rs. ' + item.lineTotal.toFixed(2) + '</td>'
      + '</tr>';
  }).join("");

  // Admin banner
  var adminWarning = "";
  if (isAdmin) {
    if (isCod) {
      adminWarning = '<div style="background:#e0f2fe;border-left:4px solid #0ea5e9;padding:16px;margin-bottom:20px;border-radius:4px;">'
        + '<strong style="font-family:sans-serif;color:#0369a1;font-size:14px;">&#9432; COD / Pay Later Order</strong><br>'
        + '<span style="font-family:sans-serif;font-size:13px;color:#0c4a6e;">'
        + 'This customer chose <strong>Skip Payment</strong>. No online payment was made.<br>'
        + 'Payment Method: <strong>COD / Pay Later</strong> &middot; Payment Status: <strong>Pending</strong>'
        + '</span></div>';
    } else {
      var evidenceDetails = 'Customer UTR: <strong>' + (utr || "Not provided") + '</strong><br>';
      if (orderData.screenshotUrl) {
        evidenceDetails += 'Screenshot Available: <strong>YES</strong> (Evidence: ' + orderData.paymentEvidence + ')<br>'
          + 'Drive Reference: <a href="' + orderData.screenshotUrl + '" target="_blank" style="color:#b45309;font-weight:bold;">Open Secure Screenshot Link</a><br>';
      } else {
        evidenceDetails += 'Screenshot Available: <strong>NO</strong><br>';
      }

      adminWarning = '<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:16px;margin-bottom:20px;border-radius:4px;">'
        + '<strong style="font-family:sans-serif;color:#b45309;font-size:14px;">&#9888; Action Required: Verify UPI Payment</strong><br>'
        + '<span style="font-family:sans-serif;font-size:13px;color:#92400e;">'
        + evidenceDetails
        + 'Please verify payment details in your UPI app/statement. '
        + 'Update Payment Status in the Orders sheet after verification.'
        + '</span></div>';
    }
  }

  // Intro paragraph
  var intro = "";
  if (!isAdmin) {
    if (isCod) {
      intro = '<p style="font-family:sans-serif;font-size:14px;color:#3d2010;line-height:1.7;margin-bottom:20px;">'
        + 'Dear <strong>' + customerInput.name + '</strong>,<br><br>'
        + 'Your order has been received successfully!<br>'
        + '<strong>Payment Method: Cash on Delivery / Pay Later</strong><br>'
        + 'Payment can be completed when the order is delivered, or as agreed with Kayal Samayal. '
        + 'We will contact you to confirm delivery. Thank you for choosing Kayal Samayal!'
        + '</p>';
    } else {
      intro = '<p style="font-family:sans-serif;font-size:14px;color:#3d2010;line-height:1.7;margin-bottom:20px;">'
        + 'Dear <strong>' + customerInput.name + '</strong>,<br><br>'
        + 'Your order has been received successfully. Your UPI payment is '
        + '<strong style="color:#b45309;">pending verification</strong>. '
        + 'We will confirm your payment and process your order shortly. '
        + 'Thank you for choosing Kayal Samayal!'
        + '</p>';
    }
  } else {
    intro = isCod
      ? '<p style="font-family:sans-serif;font-size:14px;color:#3d2010;line-height:1.7;margin-bottom:20px;">A new COD / Pay Later order has been placed. No online payment was collected.</p>'
      : '<p style="font-family:sans-serif;font-size:14px;color:#3d2010;line-height:1.7;margin-bottom:20px;">A new UPI order has been placed and is awaiting payment verification.</p>';
  }

  // Payment detail rows
  var paymentRows = "";
  if (!isCod) {
    var evidenceType = orderData.paymentEvidence || "UTR";
    paymentRows = '<tr>'
      + '<td style="padding:4px 16px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">UPI ID Paid To</td>'
      + '<td style="padding:4px 16px;font-family:sans-serif;font-size:13px;color:#3d2010;">' + (upiId || "Not configured") + '</td>'
      + '</tr>'
      + '<tr>'
      + '<td style="padding:4px 16px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">UTR / Transaction ID</td>'
      + '<td style="padding:4px 16px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;">' + (utr || "Not provided") + '</td>'
      + '</tr>'
      + '<tr>'
      + '<td style="padding:4px 16px 10px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Payment Evidence</td>'
      + '<td style="padding:4px 16px 10px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;">' + evidenceType + '</td>'
      + '</tr>';

    if (isAdmin && orderData.screenshotUrl) {
      paymentRows += '<tr>'
        + '<td style="padding:4px 16px 10px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Screenshot Reference</td>'
        + '<td style="padding:4px 16px 10px;font-family:sans-serif;font-size:13px;color:#3d2010;"><a href="' + orderData.screenshotUrl + '" target="_blank" style="color:#c86432;font-weight:bold;">View Private Screenshot in Google Drive</a></td>'
        + '</tr>';
    }
  } else {
    paymentRows = '<tr>'
      + '<td style="padding:4px 16px 10px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Note</td>'
      + '<td style="padding:4px 16px 10px;font-family:sans-serif;font-size:13px;color:#3d2010;">Payment on delivery / as agreed with Kayal Samayal</td>'
      + '</tr>';
  }

  // Bottom message
  var bottomMsg = "";
  if (!isAdmin) {
    bottomMsg = isCod
      ? 'Payment Method: <strong>Cash on Delivery / Pay Later</strong>. Payment Status: <strong>Pending</strong>. Your order has been received. Payment can be completed on delivery / as agreed with Kayal Samayal.'
      : 'Your UPI payment is <strong>pending verification</strong>. We will process your order once confirmed. For queries: WhatsApp +91 9003860616.';
  } else {
    bottomMsg = isCod
      ? 'COD / Pay Later order. No online payment collected. Update order status once payment is received on delivery.'
      : 'Verify the UTR against your UPI app / bank statement. Update <strong>Payment Status</strong> to <em>Verified</em> or <em>Rejected</em> in the Orders sheet.';
  }

  var shippingDisplay = (shipping === 0)
    ? '<span style="color:#16a34a;">FREE</span>'
    : 'Rs. ' + shipping.toFixed(2);

  var discountRow = (discount > 0)
    ? '<tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">Discount</td>'
      + '<td style="text-align:right;font-family:sans-serif;font-size:13px;color:#16a34a;">&minus;Rs. ' + discount.toFixed(2) + '</td></tr>'
    : "";

  var notesRow = customerInput.notes
    ? '<tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;">Order Notes</td>'
      + '<td style="font-family:sans-serif;font-size:13px;color:#3d2010;">' + customerInput.notes + '</td></tr>'
    : "";

  var badge = isAdmin ? "NEW ORDER NOTIFICATION" : "ORDER CONFIRMATION";
  var year  = new Date().getFullYear();

  return '<!DOCTYPE html>'
    + '<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>'
    + '<body style="margin:0;padding:0;background:#f5efe8;">'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe8;padding:32px 16px;">'
    + '<tr><td align="center">'
    + '<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);max-width:600px;width:100%;">'

    // Header
    + '<tr><td style="background:#1c0f06;padding:28px 32px;text-align:center;">'
    + '<h1 style="margin:0;color:#c9a84c;font-family:Georgia,serif;font-size:24px;letter-spacing:2px;">Kayal Samayal</h1>'
    + '<p style="margin:6px 0 0;color:#d4b896;font-size:12px;font-family:sans-serif;letter-spacing:1px;">AUTHENTIC HERITAGE SPICES</p>'
    + '<div style="margin-top:12px;display:inline-block;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);padding:4px 14px;border-radius:20px;">'
    + '<span style="color:#c9a84c;font-size:11px;font-family:sans-serif;font-weight:bold;">' + badge + '</span>'
    + '</div></td></tr>'

    // Body
    + '<tr><td style="padding:32px;">'
    + adminWarning
    + intro

    // Order Summary Card
    + '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;border-radius:8px;padding:0;margin-bottom:24px;overflow:hidden;">'
    + '<tr style="background:#f0e6d6;"><td colspan="2" style="padding:10px 16px;font-family:sans-serif;font-size:11px;font-weight:bold;color:#7a5c3a;text-transform:uppercase;letter-spacing:1px;">Order Reference</td></tr>'
    + '<tr><td style="padding:12px 16px 4px;font-family:sans-serif;font-size:12px;color:#7a5c3a;width:40%;">Order ID</td>'
    +     '<td style="padding:12px 16px 4px;font-family:sans-serif;font-size:15px;font-weight:bold;color:#1c0f06;">' + orderId + '</td></tr>'
    + '<tr><td style="padding:4px 16px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Order Date</td>'
    +     '<td style="padding:4px 16px;font-family:sans-serif;font-size:13px;color:#3d2010;">' + orderDate + '</td></tr>'
    + '<tr><td style="padding:4px 16px 12px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Customer ID</td>'
    +     '<td style="padding:4px 16px 12px;font-family:sans-serif;font-size:13px;color:#3d2010;">' + customerId + '</td></tr>'
    + '</table>'

    // Customer Details
    + '<h3 style="font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f0e6d6;padding-bottom:8px;margin:24px 0 12px;">Customer Details</h3>'
    + '<table width="100%" cellpadding="5" cellspacing="0">'
    + '<tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;width:38%;">Full Name</td><td style="font-family:sans-serif;font-size:13px;color:#3d2010;">' + customerInput.name + '</td></tr>'
    + '<tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;">Mobile</td><td style="font-family:sans-serif;font-size:13px;color:#3d2010;">' + customerInput.mobile + '</td></tr>'
    + '<tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;">Email</td><td style="font-family:sans-serif;font-size:13px;color:#3d2010;">' + (customerInput.email || "\u2014") + '</td></tr>'
    + '<tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;vertical-align:top;padding-top:5px;">Address</td>'
    +     '<td style="font-family:sans-serif;font-size:13px;color:#3d2010;">' + (customerInput.address || "\u2014") + ', ' + (customerInput.city || "\u2014") + ', ' + (customerInput.state || "\u2014") + ' \u2014 ' + (customerInput.pincode || "\u2014") + '</td></tr>'
    + notesRow
    + '</table>'

    // Order Items
    + '<h3 style="font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f0e6d6;padding-bottom:8px;margin:24px 0 12px;">Order Items</h3>'
    + '<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">'
    + '<thead><tr style="background:#f9f5f0;">'
    + '<th style="padding:8px 6px;text-align:left;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Product</th>'
    + '<th style="padding:8px 6px;text-align:left;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Tier</th>'
    + '<th style="padding:8px 6px;text-align:center;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Qty</th>'
    + '<th style="padding:8px 6px;text-align:right;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Unit</th>'
    + '<th style="padding:8px 6px;text-align:right;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">GST</th>'
    + '<th style="padding:8px 6px;text-align:right;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Total</th>'
    + '</tr></thead>'
    + '<tbody>' + itemsRows + '</tbody>'
    + '</table>'

    // Totals
    + '<table width="100%" cellpadding="5" cellspacing="0" style="margin-top:16px;border-top:2px solid #f0e6d6;">'
    + '<tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">Subtotal</td><td style="text-align:right;font-family:sans-serif;font-size:13px;color:#3d2010;">Rs. ' + subtotal.toFixed(2) + '</td></tr>'
    + '<tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">GST</td><td style="text-align:right;font-family:sans-serif;font-size:13px;color:#3d2010;">Rs. ' + gstTotal.toFixed(2) + '</td></tr>'
    + '<tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">Shipping</td><td style="text-align:right;font-family:sans-serif;font-size:13px;color:#3d2010;">' + shippingDisplay + '</td></tr>'
    + discountRow
    + '<tr style="border-top:1px solid #f0e6d6;">'
    + '<td style="font-family:sans-serif;font-size:15px;font-weight:bold;color:#1c0f06;padding-top:10px;">Grand Total</td>'
    + '<td style="text-align:right;font-family:sans-serif;font-size:15px;font-weight:bold;color:#1c0f06;padding-top:10px;">Rs. ' + grandTotal.toFixed(2) + '</td>'
    + '</tr></table>'

    // Payment Details
    + '<h3 style="font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f0e6d6;padding-bottom:8px;margin:24px 0 12px;">Payment Details</h3>'
    + '<table width="100%" cellpadding="5" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;">'
    + '<tr><td style="padding:10px 16px 4px;font-family:sans-serif;font-size:12px;color:#7a5c3a;width:42%;">Payment Method</td>'
    +     '<td style="padding:10px 16px 4px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;">' + paymentMethod + '</td></tr>'
    + '<tr><td style="padding:4px 16px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Payment Status</td>'
    +     '<td style="padding:4px 16px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#b45309;">' + paymentStatus + '</td></tr>'
    + paymentRows
    + '</table>'

    // Message
    + '<div style="background:#f9f5f0;border-radius:8px;padding:16px;margin-top:24px;">'
    + '<p style="font-family:sans-serif;font-size:13px;color:#7a5c3a;margin:0;line-height:1.7;">' + bottomMsg + '</p>'
    + '</div>'

    + '</td></tr>'

    // Footer
    + '<tr><td style="background:#f0e6d6;padding:16px 32px;text-align:center;border-top:1px solid #e8d5be;">'
    + '<p style="font-family:sans-serif;font-size:11px;color:#7a5c3a;margin:0;">&copy; ' + year + ' Kayal Samayal &middot; Authentic Heritage Spices &middot; +91 9003860616</p>'
    + '</td></tr>'
    + '</table>'
    + '</td></tr></table>'
    + '</body></html>';
}

/**
 * Send order confirmation email to the customer via MailApp.
 * Skips silently if customer has no email address.
 */
function sendOrderConfirmationEmail(ss, orderData) {
  var customerEmail = String(orderData.customerInput.email || "").trim();
  if (!customerEmail) {
    Logger.log("sendOrderConfirmationEmail: No customer email — skipping.");
    return;
  }
  MailApp.sendEmail({
    to:       customerEmail,
    subject:  "Kayal Samayal Order Confirmation - " + orderData.orderId,
    htmlBody: buildOrderEmailHtml(orderData, false),
    name:     "Kayal Samayal"
  });
  Logger.log("Customer confirmation email sent to: " + customerEmail);
}

/**
 * Send admin/owner notification email via MailApp.
 * Reads admin_email from Settings sheet.
 */
function sendAdminNotificationEmail(ss, orderData) {
  var adminEmail = getSettingValue(ss, "admin_email") || "";
  if (!adminEmail) {
    Logger.log("sendAdminNotificationEmail: admin_email not configured in Settings — skipping.");
    return;
  }
  MailApp.sendEmail({
    to:       adminEmail,
    subject:  "New Kayal Samayal Order - " + orderData.orderId,
    htmlBody: buildOrderEmailHtml(orderData, true),
    name:     "Kayal Samayal System"
  });
  Logger.log("Admin notification email sent to: " + adminEmail);
}

// ── UPDATE ORDER STATUS ──────────────────────────────────────────────────────

function updateOrderStatus(sheet, data) {
  var orderId       = data.orderId;
  var paymentStatus = data.paymentStatus;
  var orderStatus   = data.orderStatus;

  if (!orderId) return { success: false, error: "Order ID is required", step: "Order ID Validation" };

  var orders  = getSheetRowsAsJSON(sheet);
  var order   = orders.filter(function(o) { return o["Order ID"] === orderId; })[0];

  if (!order) return { success: false, error: "Order ID not found: " + orderId, step: "Order Lookup" };

  var rowIndex = orders.indexOf(order) + 2;
  var headers  = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (paymentStatus) {
    var psIdx = headers.indexOf("Payment Status") + 1;
    if (psIdx > 0) sheet.getRange(rowIndex, psIdx).setValue(paymentStatus);
    if (paymentStatus === "Verified") {
      var verifIdx = headers.indexOf("Payment Verified At") + 1;
      if (verifIdx > 0) sheet.getRange(rowIndex, verifIdx).setValue(new Date());
    }
  }

  if (orderStatus) {
    var osIdx = headers.indexOf("Order Status") + 1;
    if (osIdx > 0) sheet.getRange(rowIndex, osIdx).setValue(orderStatus);
  }

  return { success: true, message: "Order updated successfully" };
}

// ── DIAGNOSTICS ──────────────────────────────────────────────────────────────

/**
 * testDatabaseSheets — checks all required sheets, payment columns, and Settings.
 */
function testDatabaseSheets() {
  var ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  var name = ss.getName();

  var prodSheet = getSheetSafely(ss, TABS.PRODUCTS,    ["products_export", "products"]);
  var custSheet = getSheetSafely(ss, TABS.CUSTOMERS,   ["Customer"]);
  var ordSheet  = getSheetSafely(ss, TABS.ORDERS,      ["Order"]);
  var itemSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);

  var paymentColsStatus = {};
  if (ordSheet && ordSheet.getLastColumn() > 0) {
    var headers = ordSheet.getRange(1, 1, 1, ordSheet.getLastColumn()).getValues()[0].map(function(h) { return String(h).trim(); });
    ["Payment Method", "Payment Status", "UPI ID", "UTR", "Payment Submitted At", "Payment Verified At"].forEach(function(col) {
      paymentColsStatus[col] = (headers.indexOf(col) !== -1);
    });
  }

  var upiId      = getSettingValue(ss, "upi_id");
  var adminEmail = getSettingValue(ss, "admin_email");

  var report = {
    spreadsheetName:      name,
    productsSheetFound:   !!prodSheet,
    productsSheetName:    prodSheet  ? prodSheet.getName()  : null,
    productsRows:         prodSheet  ? Math.max(0, prodSheet.getLastRow()  - 1) : 0,
    customersSheetFound:  !!custSheet,
    customersSheetName:   custSheet  ? custSheet.getName()  : null,
    customersRows:        custSheet  ? Math.max(0, custSheet.getLastRow()  - 1) : 0,
    ordersSheetFound:     !!ordSheet,
    ordersSheetName:      ordSheet   ? ordSheet.getName()   : null,
    ordersRows:           ordSheet   ? Math.max(0, ordSheet.getLastRow()   - 1) : 0,
    orderItemsSheetFound: !!itemSheet,
    orderItemsSheetName:  itemSheet  ? itemSheet.getName()  : null,
    orderItemsRows:       itemSheet  ? Math.max(0, itemSheet.getLastRow()  - 1) : 0,
    paymentColumnsStatus: paymentColsStatus,
    upiIdConfigured:      !!(upiId),
    adminEmailConfigured: !!(adminEmail)
  };

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

/**
 * testSampleOrder — end-to-end UPI order test using a real active product.
 */
function testSampleOrder() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  setupDatabaseSheets();

  var prodSheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
  if (!prodSheet) {
    return { success: false, error: "Products sheet not found", step: "Products Lookup" };
  }

  var products      = getSheetRowsAsJSON(prodSheet);
  var activeProduct = products.filter(function(p) {
    var act = (p["Active"] !== undefined) ? p["Active"] : p["active"];
    return act === true || String(act).toLowerCase() === "true" || act === 1 || String(act).toLowerCase() === "yes";
  })[0];

  if (!activeProduct) {
    return { success: false, error: "No active product found in Products sheet", step: "Product Selection" };
  }

  var productId = String(activeProduct["Product ID"] || activeProduct["id"] || activeProduct["productId"]);
  var testUtr   = "TEST-UTR-" + Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMddHHmmss");

  var testPayload = {
    action: "createOrder",
    customer: {
      name:    "Kayal Samayal API Test",
      mobile:  "9999999999",
      email:   "test@kayalsamayal.test",
      address: "API Test Address",
      city:    "Kumbakonam",
      state:   "Tamil Nadu",
      pincode: "612001",
      notes:   "AUTOMATED API TEST ORDER"
    },
    items:         [{ productId: productId, quantity: 1 }],
    utr:           testUtr,
    paymentMethod: "UPI"
  };

  var orderResult = processOrderTransaction(ss, testPayload);

  if (!orderResult || !orderResult.success) {
    return {
      success: false,
      error:   orderResult ? (orderResult.error || orderResult.message) : "Failed to place sample order",
      step:    orderResult ? orderResult.step : "processOrderTransaction"
    };
  }

  var custSheet2 = getSheetSafely(ss, TABS.CUSTOMERS,   ["Customer"]);
  var ordSheet2  = getSheetSafely(ss, TABS.ORDERS,      ["Order"]);
  var itemSheet2 = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);

  var customers = getSheetRowsAsJSON(custSheet2);
  var orders    = getSheetRowsAsJSON(ordSheet2);
  var items     = getSheetRowsAsJSON(itemSheet2);

  var testCustomer  = customers.filter(function(c) { return String(c["Mobile"]).trim() === "9999999999"; })[0];
  var testOrder     = orders.filter(function(o) { return o["Order ID"] === orderResult.orderId; })[0];
  var testOrderItem = items.filter(function(i) { return i["Order ID"] === orderResult.orderId; })[0];

  var verification = {
    success:             true,
    orderId:             orderResult.orderId,
    customerFound:       !!testCustomer,
    customerId:          testCustomer ? testCustomer["Customer ID"] : null,
    orderFound:          !!testOrder,
    orderItemFound:      !!testOrderItem,
    orderIdMatches:      !!(testOrder && testOrderItem && testOrder["Order ID"] === testOrderItem["Order ID"]),
    paymentMethodStored: testOrder ? testOrder["Payment Method"]       : null,
    paymentStatusStored: testOrder ? testOrder["Payment Status"]       : null,
    utrStored:           testOrder ? testOrder["UTR"]                  : null,
    upiIdStored:         testOrder ? testOrder["UPI ID"]               : null,
    paymentSubmittedAt:  testOrder ? testOrder["Payment Submitted At"]  : null,
    productIdUsed:       productId,
    productNameUsed:     activeProduct["Product Name"] || activeProduct["name"],
    subtotal:            orderResult.subtotal,
    gst:                 orderResult.gst,
    shipping:            orderResult.shipping,
    grandTotal:          orderResult.grandTotal,
    emailSent:           orderResult.emailSent
  };

  Logger.log(JSON.stringify(verification, null, 2));
  return verification;
}

/**
 * Known Settings keys used to validate or infer the Key column if the header text is missing.
 */
var KNOWN_SETTINGS_KEYS = [
  "whatsapp_number",
  "shipping_charge",
  "free_shipping_threshold",
  "default_gst",
  "business_name",
  "upi_id",
  "admin_email"
];

/**
 * Diagnostic helper: prints first rowsToCheck rows (columns A to maxCol) for debugging.
 */
function dumpSettingsSheetPreview(sheet, rowsToCheck, maxCol) {
  try {
    var rCount = Math.min(sheet.getLastRow(), rowsToCheck || 10);
    var cCount = Math.min(sheet.getLastColumn(), maxCol || 4);
    if (rCount === 0 || cCount === 0) {
      Logger.log("[dumpSettingsSheetPreview] Sheet is empty.");
      return;
    }
    var preview = sheet.getRange(1, 1, rCount, cCount).getValues();
    Logger.log("=== SETTINGS SHEET RAW PREVIEW (Rows 1 to " + rCount + ") ===");
    for (var i = 0; i < preview.length; i++) {
      Logger.log("Row " + (i + 1) + ": " + JSON.stringify(preview[i]));
    }
    Logger.log("=============================================================");
  } catch (err) {
    Logger.log("dumpSettingsSheetPreview error: " + err.toString());
  }
}

/**
 * Helper: Locate the header row in the Settings sheet dynamically.
 * Supports:
 *   A) Explicit: row with 'Key' and 'Value'
 *   B) Inferred: row with 'Value', where the column to the left contains recognizable setting keys
 * Scans the first scanLimit rows (default 10).
 */
function findSettingsHeaderRow(sheet, scanLimit) {
  var limit = scanLimit || 10;
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow === 0 || lastCol === 0) return null;

  var rowsToCheck = Math.min(lastRow, limit);
  // Use getDisplayValues() to ensure visible header text is retrieved cleanly
  var scanData = sheet.getRange(1, 1, rowsToCheck, lastCol).getDisplayValues();

  // First pass: look for explicit 'Key' and 'Value'
  for (var r = 0; r < scanData.length; r++) {
    var rowValues = scanData[r];
    var keyCol = -1;
    var valCol = -1;
    var descCol = -1;
    var updatedCol = -1;

    for (var c = 0; c < rowValues.length; c++) {
      var cellText = String(rowValues[c] || "").trim().toLowerCase();
      if (cellText === "key") keyCol = c;
      if (cellText === "value") valCol = c;
      if (cellText === "description") descCol = c;
      if (cellText === "updated at" || cellText === "updated_at" || cellText === "updatedat") updatedCol = c;
    }

    if (keyCol !== -1 && valCol !== -1) {
      return {
        headerRowNumber: r + 1, // 1-based
        keyCol: keyCol,          // 0-based
        valCol: valCol,          // 0-based
        descCol: descCol,        // 0-based
        updatedCol: updatedCol,  // 0-based
        headerValues: rowValues,
        inferredKey: false
      };
    }
  }

  // Second pass: 'Value' is found, but 'Key' header is missing/blank.
  // Check the column immediately to its left (e.g. Value in B -> check col A).
  for (var r2 = 0; r2 < scanData.length; r2++) {
    var rowValues2 = scanData[r2];
    var valCol2 = -1;
    var descCol2 = -1;
    var updatedCol2 = -1;

    for (var c2 = 0; c2 < rowValues2.length; c2++) {
      var text2 = String(rowValues2[c2] || "").trim().toLowerCase();
      if (text2 === "value") valCol2 = c2;
      if (text2 === "description") descCol2 = c2;
      if (text2 === "updated at" || text2 === "updated_at" || text2 === "updatedat") updatedCol2 = c2;
    }

    if (valCol2 > 0) {
      var candidateKeyCol = valCol2 - 1;
      var startCheckRow = r2 + 2; // 1-based row immediately below r2
      var checkCount = Math.min(lastRow - (r2 + 1), 15);
      var matchCount = 0;

      if (checkCount > 0) {
        var sampleCells = sheet.getRange(startCheckRow, candidateKeyCol + 1, checkCount, 1).getDisplayValues();
        for (var s = 0; s < sampleCells.length; s++) {
          var valStr = String(sampleCells[s][0] || "").trim().toLowerCase();
          if (KNOWN_SETTINGS_KEYS.indexOf(valStr) !== -1 ||
              valStr.indexOf("instagram_reel_") === 0 ||
              valStr.indexOf("shipping_") === 0 ||
              valStr.indexOf("whatsapp_") === 0) {
            matchCount++;
          }
        }
      }

      if (matchCount >= 1) {
        Logger.log("[findSettingsHeaderRow] Inferred Key column at column " + String.fromCharCode(65 + candidateKeyCol) + " (index " + candidateKeyCol + ") adjacent to Value column at " + String.fromCharCode(65 + valCol2) + " (index " + valCol2 + ") at row " + (r2 + 1) + ". Setting key matches: " + matchCount);
        return {
          headerRowNumber: r2 + 1,
          keyCol: candidateKeyCol,
          valCol: valCol2,
          descCol: descCol2,
          updatedCol: updatedCol2,
          headerValues: rowValues2,
          inferredKey: true
        };
      }
    }
  }

  return null;
}

/**
 * Diagnostic Read-Only Function:
 * Inspects Settings sheet without modifying any data.
 * Dynamically detects the header row in the first 10 rows.
 * Reads data rows using getDisplayValues() to capture visible strings, errors, and URLs.
 */
function verifySettingsSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getSheetSafely(ss, TABS.SETTINGS);

  if (!sheet) {
    Logger.log("Settings sheet not found.");
    return { success: false, message: "Settings sheet not found." };
  }

  var headerInfo = findSettingsHeaderRow(sheet, 10);
  if (!headerInfo) {
    Logger.log("Required columns Key and Value not found in first 10 rows.");
    Logger.log("Running diagnostic fallback preview of Settings sheet (columns A:D):");
    dumpSettingsSheetPreview(sheet, 10, 4);
    return {
      success: false,
      message: "Required columns Key and Value not found in first 10 rows. See Execution Log for raw preview."
    };
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var startDataRow = headerInfo.headerRowNumber + 1; // 1-based data start row

  var keyColLetter = String.fromCharCode(65 + headerInfo.keyCol);
  var valColLetter = String.fromCharCode(65 + headerInfo.valCol);

  if (lastRow < startDataRow) {
    Logger.log("=========================================");
    Logger.log("SETTINGS STRUCTURE");
    Logger.log("Header row: " + headerInfo.headerRowNumber);
    Logger.log("Key column: " + keyColLetter);
    Logger.log("Value column: " + valColLetter);
    Logger.log("Key detection: " + (headerInfo.inferredKey ? "INFERRED" : "EXPLICIT"));
    Logger.log("Settings sheet contains header row at row " + headerInfo.headerRowNumber + " but no data rows.");
    Logger.log("=========================================");
    return {
      success: true,
      detectedHeaderRow: headerInfo.headerRowNumber,
      keyColumn: keyColLetter,
      valueColumn: valColLetter,
      keyDetection: headerInfo.inferredKey ? "INFERRED" : "EXPLICIT",
      totalSettingsDataRows: 0,
      message: "No data rows below header"
    };
  }

  var numDataRows = lastRow - headerInfo.headerRowNumber;
  var displayData = sheet.getRange(startDataRow, 1, numDataRows, lastCol).getDisplayValues();

  var keyCounts = {};
  var duplicateKeys = [];
  var first5Keys = [];
  var whatsappValues = [];
  var upiValues = [];
  var adminEmailValues = [];

  for (var idx = 0; idx < displayData.length; idx++) {
    var actualRowNumber = startDataRow + idx;
    var row = displayData[idx];
    var k = String(row[headerInfo.keyCol] || "").trim();
    if (!k) continue;

    keyCounts[k] = (keyCounts[k] || 0) + 1;

    if (first5Keys.length < 5 && first5Keys.indexOf(k) === -1) {
      first5Keys.push(k);
    }

    var vStr = String(row[headerInfo.valCol] !== undefined && row[headerInfo.valCol] !== null ? row[headerInfo.valCol] : "").trim();

    if (k === "whatsapp_number") {
      whatsappValues.push({ row: actualRowNumber, value: vStr });
    }
    if (k === "upi_id") {
      upiValues.push({ row: actualRowNumber, value: vStr });
    }
    if (k === "admin_email") {
      adminEmailValues.push({ row: actualRowNumber, value: vStr });
    }
  }

  for (var keyName in keyCounts) {
    if (keyCounts[keyName] > 1) {
      duplicateKeys.push({ key: keyName, occurrences: keyCounts[keyName] });
    }
  }

  var whatsappReportStatus = whatsappValues.length > 0 ? whatsappValues.map(function(w) { return w.value; }).join(", ") : "NOT CONFIGURED";
  var upiReportStatus = upiValues.some(function(u) { return u.value !== ""; }) ? "CONFIGURED" : "NOT CONFIGURED";
  var adminEmailReportStatus = adminEmailValues.some(function(a) { return a.value !== ""; }) ? "CONFIGURED" : "NOT CONFIGURED";

  Logger.log("=========================================");
  Logger.log("SETTINGS STRUCTURE");
  Logger.log("Header row: " + headerInfo.headerRowNumber);
  Logger.log("Key column: " + keyColLetter);
  Logger.log("Value column: " + valColLetter);
  Logger.log("Key detection: " + (headerInfo.inferredKey ? "INFERRED" : "EXPLICIT"));
  Logger.log("");
  Logger.log("GENERAL SETTINGS STATUS");
  Logger.log("Data rows read: " + displayData.length + " (rows " + startDataRow + " to " + lastRow + ")");
  Logger.log("Unique keys count: " + Object.keys(keyCounts).length);
  Logger.log("Duplicate keys found: " + duplicateKeys.length);
  if (duplicateKeys.length > 0) {
    duplicateKeys.forEach(function(d) {
      Logger.log("  DUPLICATE: " + d.key + " (appears " + d.occurrences + " times)");
    });
  }
  Logger.log("whatsapp_number: " + whatsappReportStatus);
  Logger.log("upi_id: " + (upiValues.length > 0 ? upiValues.map(function(u) { return u.value || "<empty>"; }).join(", ") : "NOT CONFIGURED") + " (" + upiReportStatus + ")");
  Logger.log("admin_email: " + (adminEmailValues.length > 0 ? adminEmailValues.map(function(a) { return a.value || "<empty>"; }).join(", ") : "NOT CONFIGURED") + " (" + adminEmailReportStatus + ")");
  Logger.log("=========================================");

  return {
    success: true,
    detectedHeaderRow: headerInfo.headerRowNumber,
    keyColumn: keyColLetter,
    valueColumn: valColLetter,
    keyDetection: headerInfo.inferredKey ? "INFERRED" : "EXPLICIT",
    first5DetectedKeys: first5Keys,
    totalSettingsDataRows: displayData.length,
    uniqueKeysCount: Object.keys(keyCounts).length,
    duplicateKeys: duplicateKeys,
    duplicateKeysCount: duplicateKeys.length,
    whatsappNumberEntries: whatsappValues,
    whatsappNumberStatus: whatsappReportStatus,
    upiIdConfigured: upiReportStatus === "CONFIGURED",
    upiIdEntries: upiValues,
    adminEmailConfigured: adminEmailReportStatus === "CONFIGURED",
    adminEmailEntries: adminEmailValues
  };
}

/**
 * SAFE Maintenance Function:
 * Repairs Settings sheet by deduplicating rows and resolving formula issues.
 *
 * Steps:
 * 1. Detect structure dynamically (Header row 1, Key=A, Value=B, Description=C, Updated At=D).
 * 2. Deduplicate rows: combine duplicate rows for each key, preferring non-empty values,
 *    non-empty descriptions, and Updated At.
 * 3. Convert whatsapp_number formula ("+91 9003860616") into literal text "+91 9003860616".
 * 4. Verify upi_id and admin_email remain unconfigured without inventing values.
 * 5. Validate in memory: ensure all required core keys exist and none are lost.
 * 6. Write consolidated rows and clear surplus rows.
 * 7. Log comprehensive diagnostic report.
 */
function repairSettingsSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getSheetSafely(ss, TABS.SETTINGS);

  if (!sheet) {
    Logger.log("Settings sheet not found. Safe exit.");
    return { success: false, message: "Settings sheet not found." };
  }

  var headerInfo = findSettingsHeaderRow(sheet, 10);
  if (!headerInfo) {
    Logger.log("Critical headers missing: Key or Value column could not be found in first 10 rows.");
    Logger.log("Running diagnostic fallback preview of Settings sheet (columns A:D):");
    dumpSettingsSheetPreview(sheet, 10, 4);
    return { success: false, message: "Key or Value column not found. See Execution Log for preview." };
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var startDataRow = headerInfo.headerRowNumber + 1;

  if (lastRow < startDataRow) {
    Logger.log("Settings sheet contains header row at row " + headerInfo.headerRowNumber + " but no data rows.");
    return { success: true, message: "Settings sheet has no data rows to repair." };
  }

  var numDataRows = lastRow - headerInfo.headerRowNumber;
  var dataRange = sheet.getRange(startDataRow, 1, numDataRows, lastCol);

  var rawDataRows = dataRange.getValues();
  var displayDataRows = dataRange.getDisplayValues();
  var formulaRows = dataRange.getFormulas();

  var rowsBeforeCount = rawDataRows.length;
  var keyCol = headerInfo.keyCol;
  var valCol = headerInfo.valCol;
  var descCol = headerInfo.descCol !== -1 ? headerInfo.descCol : 2;
  var updatedCol = headerInfo.updatedCol !== -1 ? headerInfo.updatedCol : 3;

  var keyGroups = {};
  var keyOrder = [];
  var whatsappFormulaConverted = false;
  var whatsappFinalValue = "";

  for (var idx = 0; idx < rawDataRows.length; idx++) {
    var rawRow = rawDataRows[idx];
    var displayRow = displayDataRows[idx];
    var formulaRow = formulaRows[idx];
    var sourceRowNum = startDataRow + idx;

    var key = String(displayRow[keyCol] || "").trim();
    if (!key) continue;

    if (!keyGroups[key]) {
      keyGroups[key] = [];
      keyOrder.push(key);
    }

    var valDisplay = String(displayRow[valCol] !== undefined && displayRow[valCol] !== null ? displayRow[valCol] : "").trim();
    var valRaw = rawRow[valCol];
    var valFormula = formulaRow[valCol];

    var descDisplay = descCol !== -1 ? String(displayRow[descCol] !== undefined && displayRow[descCol] !== null ? displayRow[descCol] : "").trim() : "";
    var descRaw = descCol !== -1 ? rawRow[descCol] : "";
    var updatedRaw = updatedCol !== -1 ? rawRow[updatedCol] : null;

    keyGroups[key].push({
      originalRowIndex: sourceRowNum,
      key: key,
      valDisplay: valDisplay,
      valRaw: valRaw,
      valFormula: valFormula,
      descDisplay: descDisplay,
      descRaw: descRaw,
      updatedAt: updatedRaw
    });
  }

  var duplicateKeysFound = [];
  var consolidatedRows = [];
  var uniqueKeysCount = keyOrder.length;

  keyOrder.forEach(function(key) {
    var entries = keyGroups[key];
    if (entries.length > 1) {
      duplicateKeysFound.push({ key: key, count: entries.length });
    }

    var chosenValueRaw = "";
    var chosenValueDisplay = "";

    for (var i = entries.length - 1; i >= 0; i--) {
      if (entries[i].valDisplay !== "") {
        chosenValueRaw = entries[i].valRaw;
        chosenValueDisplay = entries[i].valDisplay;
        break;
      }
    }

    var chosenDescription = "";
    for (var d = entries.length - 1; d >= 0; d--) {
      var dStr = entries[d].descDisplay;
      if (dStr !== "") {
        chosenDescription = entries[d].descRaw || dStr;
        break;
      }
    }

    var chosenUpdatedAt = null;
    if (updatedCol !== -1) {
      for (var u = entries.length - 1; u >= 0; u--) {
        if (entries[u].updatedAt) {
          chosenUpdatedAt = entries[u].updatedAt;
          break;
        }
      }
    }

    if (key === "whatsapp_number") {
      for (var w = 0; w < entries.length; w++) {
        var fStr = String(entries[w].valFormula || "");
        var dStr2 = String(entries[w].valDisplay || "");
        if (fStr.indexOf("9003860616") !== -1 || dStr2 === "#ERROR!" || fStr.indexOf("+91") !== -1) {
          whatsappFormulaConverted = true;
          break;
        }
      }
      chosenValueRaw = "+91 9003860616";
      chosenValueDisplay = "+91 9003860616";
      whatsappFinalValue = chosenValueRaw;
    }

    var newRow = new Array(lastCol);
    for (var c = 0; c < lastCol; c++) {
      newRow[c] = "";
    }

    newRow[keyCol] = key;
    newRow[valCol] = chosenValueRaw;
    if (descCol !== -1 && descCol < lastCol) {
      newRow[descCol] = chosenDescription;
    }
    if (updatedCol !== -1 && updatedCol < lastCol) {
      newRow[updatedCol] = chosenUpdatedAt || new Date();
    }

    consolidatedRows.push(newRow);
  });

  var consolidatedKeyMap = {};
  consolidatedRows.forEach(function(r) {
    consolidatedKeyMap[String(r[keyCol]).trim()] = r;
  });

  var missingKeys = [];
  KNOWN_SETTINGS_KEYS.forEach(function(k) {
    if (!consolidatedKeyMap[k]) {
      missingKeys.push(k);
    }
  });

  if (missingKeys.length > 0) {
    Logger.log("[repairSettingsSheet] Validation failed: Expected keys are missing from consolidated set: " + JSON.stringify(missingKeys));
    return {
      success: false,
      message: "Pre-write validation failed: missing keys " + JSON.stringify(missingKeys)
    };
  }

  var rowsAfterCount = consolidatedRows.length;
  var rowsRemovedCount = rowsBeforeCount - rowsAfterCount;

  sheet.getRange(startDataRow, 1, numDataRows, lastCol).clearContent();
  sheet.getRange(startDataRow, 1, rowsAfterCount, lastCol).setValues(consolidatedRows);

  var whatsappRowIndex = -1;
  for (var cr = 0; cr < consolidatedRows.length; cr++) {
    if (String(consolidatedRows[cr][keyCol]).trim() === "whatsapp_number") {
      whatsappRowIndex = startDataRow + cr;
      break;
    }
  }
  if (whatsappRowIndex !== -1) {
    var whatsappCell = sheet.getRange(whatsappRowIndex, valCol + 1);
    whatsappCell.setNumberFormat("@");
    whatsappCell.setValue("+91 9003860616");
  }

  var upiRow = consolidatedKeyMap["upi_id"];
  var upiVal = upiRow ? String(upiRow[valCol] || "").trim() : "";
  var adminRow = consolidatedKeyMap["admin_email"];
  var adminVal = adminRow ? String(adminRow[valCol] || "").trim() : "";

  Logger.log("=========================================");
  Logger.log("SETTINGS REPAIR COMPLETED");
  Logger.log("=========================================");
  Logger.log("Header row: " + headerInfo.headerRowNumber);
  Logger.log("Key column: " + String.fromCharCode(65 + keyCol));
  Logger.log("Value column: " + String.fromCharCode(65 + valCol));
  Logger.log("Description column: " + (descCol !== -1 ? String.fromCharCode(65 + descCol) : "None"));
  Logger.log("");
  Logger.log("Rows before: " + rowsBeforeCount);
  Logger.log("Unique keys: " + uniqueKeysCount);
  Logger.log("Duplicate keys removed: " + duplicateKeysFound.length);
  Logger.log("");
  Logger.log("WhatsApp formula converted: " + (whatsappFormulaConverted ? "YES (formula converted to literal text)" : "NO"));
  Logger.log("WhatsApp final value: " + (whatsappFinalValue || "+91 9003860616"));
  Logger.log("");
  Logger.log("UPI ID configured: " + (upiVal !== "" ? "YES" : "NO (NOT CONFIGURED)"));
  Logger.log("Admin Email configured: " + (adminVal !== "" ? "YES" : "NO (NOT CONFIGURED)"));
  Logger.log("");
  Logger.log("Rows after: " + rowsAfterCount);
  Logger.log("Remaining duplicate keys: 0");
  Logger.log("=========================================");

  return {
    success: true,
    headerRow: headerInfo.headerRowNumber,
    keyColumn: String.fromCharCode(65 + keyCol),
    valueColumn: String.fromCharCode(65 + valCol),
    descriptionColumn: descCol !== -1 ? String.fromCharCode(65 + descCol) : null,
    rowsBefore: rowsBeforeCount,
    uniqueKeys: uniqueKeysCount,
    duplicateKeysRemoved: duplicateKeysFound.length,
    whatsappFormulaConverted: whatsappFormulaConverted,
    whatsappFinalValue: whatsappFinalValue || "+91 9003860616",
    upiIdConfigured: upiVal !== "",
    adminEmailConfigured: adminVal !== "",
    rowsAfter: rowsAfterCount,
    remainingDuplicates: 0
  };
}

/**
 * READ-ONLY Diagnostic Function:
 * Inspects Settings cells across columns A:D.
 */
function inspectSettingsCells() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getSheetSafely(ss, TABS.SETTINGS);

  if (!sheet) {
    Logger.log("Settings sheet not found.");
    return { success: false, message: "Settings sheet not found." };
  }

  var startRow = 2;
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) {
    Logger.log("No data rows to inspect.");
    return { success: true, inspectedRowsCount: 0 };
  }

  var numRows = lastRow - startRow + 1;
  var numCols = Math.min(sheet.getLastColumn(), 4);

  var range = sheet.getRange(startRow, 1, numRows, numCols);
  var displayValues = range.getDisplayValues();
  var rawValues = range.getValues();
  var formulas = range.getFormulas();

  var targetSummaryKeys = [
    "whatsapp_number",
    "shipping_charge",
    "free_shipping_threshold",
    "default_gst",
    "business_name",
    "upi_id",
    "admin_email"
  ];

  var summaryEntries = [];

  Logger.log("=============================================================");
  Logger.log("INSPECT SETTINGS CELLS (Rows " + startRow + " to " + lastRow + ", Columns A:D)");
  Logger.log("=============================================================");

  for (var i = 0; i < numRows; i++) {
    var rowNum = startRow + i;

    var aDisplay = displayValues[i][0];
    var aRaw = rawValues[i][0];
    var aFormula = formulas[i][0];

    var bDisplay = displayValues[i][1];
    var bRaw = rawValues[i][1];
    var bFormula = formulas[i][1];

    var cDisplay = numCols >= 3 ? displayValues[i][2] : "";
    var dDisplay = numCols >= 4 ? displayValues[i][3] : "";

    Logger.log("ROW " + rowNum);
    Logger.log("A display = " + JSON.stringify(aDisplay));
    Logger.log("A raw = " + JSON.stringify(aRaw));
    Logger.log("A formula = " + JSON.stringify(aFormula));
    Logger.log("B display = " + JSON.stringify(bDisplay));
    Logger.log("B raw = " + JSON.stringify(bRaw));
    Logger.log("B formula = " + JSON.stringify(bFormula));
    Logger.log("C display = " + JSON.stringify(cDisplay));
    Logger.log("D display = " + JSON.stringify(dDisplay));
    Logger.log("-------------------------------------------------------------");

    var keyClean = String(aDisplay || "").trim();
    if (targetSummaryKeys.indexOf(keyClean) !== -1) {
      summaryEntries.push({
        key: keyClean,
        row: rowNum,
        displayValue: bDisplay,
        rawValue: bRaw,
        formula: bFormula
      });
    }
  }

  Logger.log("=============================================================");
  Logger.log("TARGET KEYS SUMMARY");
  Logger.log("key | row | displayValue | rawValue | formula");
  Logger.log("=============================================================");

  summaryEntries.forEach(function(entry) {
    Logger.log(
      entry.key + " | row " + entry.row + " | " +
      JSON.stringify(entry.displayValue) + " | " +
      JSON.stringify(entry.rawValue) + " | " +
      JSON.stringify(entry.formula)
    );
  });

  Logger.log("=============================================================");

  return {
    success: true,
    inspectedRowsCount: numRows,
    summaryEntries: summaryEntries
  };
}

/**
 * SAFE Maintenance Function:
 * Removes ONLY Instagram/Reels-specific keys from the Settings sheet.
 *
 * Requirements:
 * 1. Open the Settings sheet.
 * 2. Find and remove ONLY the 16 exact Instagram keys:
 *    instagram_reel_1_url ... instagram_reel_4_product_id
 * 3. Does NOT delete any other Settings keys.
 * 4. Before writing, logs exactly which rows will be removed.
 * 5. Validates that ONLY Instagram keys are targeted.
 * 6. If any non-Instagram key is about to be removed, ABORT without modifying anything.
 * 7. After successful removal, prints detailed metrics and remaining settings.
 * 8. Does NOT run automatically.
 */
function removeInstagramSettings() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getSheetSafely(ss, TABS.SETTINGS);

  if (!sheet) {
    Logger.log("Settings sheet not found. Safe exit.");
    return { success: false, message: "Settings sheet not found." };
  }

  var headerInfo = findSettingsHeaderRow(sheet, 10);
  if (!headerInfo) {
    Logger.log("Could not locate Settings header row.");
    return { success: false, message: "Settings header row not found." };
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var startDataRow = headerInfo.headerRowNumber + 1;

  if (lastRow < startDataRow) {
    Logger.log("Settings sheet has no data rows.");
    return { success: true, message: "No data rows in Settings sheet." };
  }

  var numDataRows = lastRow - headerInfo.headerRowNumber;
  var dataRange = sheet.getRange(startDataRow, 1, numDataRows, lastCol);
  var dataRows = dataRange.getValues();
  var displayRows = dataRange.getDisplayValues();

  var rowsBeforeCount = dataRows.length;
  var keyCol = headerInfo.keyCol;

  // The exact 16 Instagram keys permitted for removal
  var instagramKeysToRemove = {
    "instagram_reel_1_url": true,
    "instagram_reel_1_caption": true,
    "instagram_reel_1_thumbnail": true,
    "instagram_reel_1_product_id": true,
    "instagram_reel_2_url": true,
    "instagram_reel_2_caption": true,
    "instagram_reel_2_thumbnail": true,
    "instagram_reel_2_product_id": true,
    "instagram_reel_3_url": true,
    "instagram_reel_3_caption": true,
    "instagram_reel_3_thumbnail": true,
    "instagram_reel_3_product_id": true,
    "instagram_reel_4_url": true,
    "instagram_reel_4_caption": true,
    "instagram_reel_4_thumbnail": true,
    "instagram_reel_4_product_id": true
  };

  var preservedRows = [];
  var rowsToBeRemoved = [];
  var nonInstagramRowsViolated = [];

  for (var idx = 0; idx < dataRows.length; idx++) {
    var rawRow = dataRows[idx];
    var dispRow = displayRows[idx];
    var actualRowNum = startDataRow + idx;
    var key = String(dispRow[keyCol] || "").trim();

    if (instagramKeysToRemove[key]) {
      rowsToBeRemoved.push({
        row: actualRowNum,
        key: key,
        value: dispRow[headerInfo.valCol]
      });
    } else {
      // Check if row is mistakenly tagged for removal
      if (key.indexOf("instagram_reel_") === 0 && !instagramKeysToRemove[key]) {
        nonInstagramRowsViolated.push({ row: actualRowNum, key: key });
      }
      preservedRows.push(rawRow);
    }
  }

  // Log rows scheduled for removal before touching sheet
  Logger.log("=========================================");
  Logger.log("REMOVE INSTAGRAM SETTINGS — PRE-RUN ANALYSIS");
  Logger.log("=========================================");
  Logger.log("Rows before: " + rowsBeforeCount);
  Logger.log("Instagram rows detected for removal: " + rowsToBeRemoved.length);

  rowsToBeRemoved.forEach(function(r) {
    Logger.log("  Target for removal -> Row " + r.row + " | Key: " + r.key + " | Value: " + JSON.stringify(r.value));
  });

  // SAFETY VALIDATION: ensure only exact Instagram keys are targeted
  if (nonInstagramRowsViolated.length > 0) {
    Logger.log("CRITICAL ABORT: Unknown key matching pattern found: " + JSON.stringify(nonInstagramRowsViolated));
    return {
      success: false,
      message: "Aborted: Non-standard key matched removal check."
    };
  }

  for (var i = 0; i < rowsToBeRemoved.length; i++) {
    if (!instagramKeysToRemove[rowsToBeRemoved[i].key]) {
      Logger.log("CRITICAL ABORT: Key '" + rowsToBeRemoved[i].key + "' is NOT an allowed Instagram key! Aborting write.");
      return {
        success: false,
        message: "Aborted: Attempted to remove non-Instagram key '" + rowsToBeRemoved[i].key + "'."
      };
    }
  }

  // Perform write: clear existing data rows and write preserved rows
  sheet.getRange(startDataRow, 1, numDataRows, lastCol).clearContent();

  var rowsAfterCount = preservedRows.length;
  if (rowsAfterCount > 0) {
    sheet.getRange(startDataRow, 1, rowsAfterCount, lastCol).setValues(preservedRows);
  }

  // Collect remaining keys for reporting
  var remainingKeys = preservedRows.map(function(r) {
    return String(r[keyCol] || "").trim();
  }).filter(function(k) { return k !== ""; });

  Logger.log("=========================================");
  Logger.log("REMOVE INSTAGRAM SETTINGS — EXECUTION REPORT");
  Logger.log("=========================================");
  Logger.log("Rows before: " + rowsBeforeCount);
  Logger.log("Instagram rows found: " + rowsToBeRemoved.length);
  Logger.log("Instagram rows removed: " + rowsToBeRemoved.length);
  Logger.log("Rows after: " + rowsAfterCount);
  Logger.log("Remaining non-Instagram settings count: " + remainingKeys.length);
  Logger.log("Remaining non-Instagram settings: " + JSON.stringify(remainingKeys));
  Logger.log("=========================================");

  return {
    success: true,
    rowsBefore: rowsBeforeCount,
    instagramRowsFound: rowsToBeRemoved.length,
    instagramRowsRemoved: rowsToBeRemoved.length,
    rowsAfter: rowsAfterCount,
    remainingSettings: remainingKeys
  };
}

/**
 * SAFE READ-ONLY DIAGNOSTIC FUNCTION:
 * Inspects remaining Settings rows for duplicates after Instagram removal.
 * Does NOT modify, delete, clear, consolidate, or rewrite any data in the sheet.
 *
 * Requirements:
 * 1. Read-only only.
 * 2. Finds header row dynamically via findSettingsHeaderRow().
 * 3. Prints every remaining setting with row number, key, Column B value, Column C description.
 * 4. Groups duplicate keys together.
 * 5. Identifies which duplicate row contains the non-empty / correct value.
 * 6. Pays special attention to the 7 core settings:
 *    business_name, whatsapp_number, shipping_charge, free_shipping_threshold, default_gst, upi_id, admin_email.
 * 7. Does NOT invent values for upi_id or admin_email.
 */
function inspectRemainingSettingsDuplicates() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = getSheetSafely(ss, TABS.SETTINGS);

  if (!sheet) {
    Logger.log("ERROR: Settings sheet not found.");
    return { success: false, message: "Settings sheet not found." };
  }

  var headerInfo = findSettingsHeaderRow(sheet, 10);
  if (!headerInfo) {
    Logger.log("ERROR: Header row could not be detected in first 10 rows.");
    return { success: false, message: "Header row not found." };
  }

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  var startDataRow = headerInfo.headerRowNumber + 1;

  if (lastRow < startDataRow) {
    Logger.log("Settings sheet has no data rows below header row " + headerInfo.headerRowNumber);
    return { success: true, message: "No data rows" };
  }

  var numDataRows = lastRow - headerInfo.headerRowNumber;
  var keyCol = headerInfo.keyCol;
  var valCol = headerInfo.valCol;
  var descCol = headerInfo.descCol !== -1 ? headerInfo.descCol : 2; // Default to Column C (index 2)

  var rawValues = sheet.getRange(startDataRow, 1, numDataRows, lastCol).getValues();
  var displayValues = sheet.getRange(startDataRow, 1, numDataRows, lastCol).getDisplayValues();
  var formulas = sheet.getRange(startDataRow, 1, numDataRows, lastCol).getFormulas();

  // Group settings by key
  var groupedByKey = {};
  var orderedKeys = [];
  var totalRows = 0;

  for (var idx = 0; idx < numDataRows; idx++) {
    var actualRowNum = startDataRow + idx;
    var rawRow = rawValues[idx];
    var dispRow = displayValues[idx];
    var formulaRow = formulas[idx];

    var key = String(dispRow[keyCol] || "").trim();
    if (!key) continue;

    totalRows++;
    if (!groupedByKey[key]) {
      groupedByKey[key] = [];
      orderedKeys.push(key);
    }

    var valDisp = String(dispRow[valCol] !== undefined && dispRow[valCol] !== null ? dispRow[valCol] : "").trim();
    var valRaw = rawRow[valCol] !== undefined && rawRow[valCol] !== null ? rawRow[valCol] : "";
    var valFormula = formulaRow[valCol] || "";
    var descDisp = String(dispRow[descCol] !== undefined && dispRow[descCol] !== null ? dispRow[descCol] : "").trim();
    var descRaw = rawRow[descCol] !== undefined && rawRow[descCol] !== null ? rawRow[descCol] : "";

    groupedByKey[key].push({
      row: actualRowNum,
      key: key,
      valDisplay: valDisp,
      valRaw: valRaw,
      valFormula: valFormula,
      descDisplay: descDisp,
      descRaw: descRaw
    });
  }

  var duplicateKeys = [];
  for (var k = 0; k < orderedKeys.length; k++) {
    var checkKey = orderedKeys[k];
    if (groupedByKey[checkKey].length > 1) {
      duplicateKeys.push(checkKey);
    }
  }

  // Print exact formatted report
  Logger.log("=========================================");
  Logger.log("REMAINING SETTINGS DUPLICATE DIAGNOSTIC");
  Logger.log("=========================================");
  Logger.log("Total rows: " + totalRows);
  Logger.log("Unique keys: " + orderedKeys.length);
  Logger.log("Duplicate keys: " + duplicateKeys.length + " (" + duplicateKeys.join(", ") + ")");
  Logger.log("-----------------------------------------");

  var recommendations = {};

  orderedKeys.forEach(function(kName) {
    var entries = groupedByKey[kName];
    Logger.log("Key: " + kName + " (Found in " + entries.length + " rows)");

    // Determine recommendation
    // Standard rule: pick row that has non-empty valid value and description
    var bestRow = null;

    if (kName === "whatsapp_number") {
      // whatsapp_number often had #ERROR! due to formula evaluation =+91... or valid raw phone
      for (var w = 0; w < entries.length; w++) {
        var wEntry = entries[w];
        var isErr = wEntry.valDisplay === "#ERROR!";
        var hasPhoneInFormula = wEntry.valFormula.indexOf("9003860616") !== -1;
        var hasPhoneInDisp = wEntry.valDisplay.indexOf("9003860616") !== -1;
        if (!isErr && hasPhoneInDisp) {
          bestRow = wEntry.row;
          break;
        } else if (hasPhoneInFormula || isErr) {
          // Candidate row that holds the phone formula
          if (!bestRow) bestRow = wEntry.row;
        }
      }
      if (!bestRow && entries.length > 0) bestRow = entries[0].row;
    } else {
      // Pick row with non-empty display value
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (e.valDisplay !== "") {
          bestRow = e.row;
          break;
        }
      }
      // If neither or all are empty (e.g. upi_id, admin_email), default to first occurrence with non-empty description
      if (!bestRow) {
        for (var j = 0; j < entries.length; j++) {
          if (entries[j].descDisplay !== "") {
            bestRow = entries[j].row;
            break;
          }
        }
      }
      if (!bestRow && entries.length > 0) {
        bestRow = entries[0].row;
      }
    }

    recommendations[kName] = bestRow;

    entries.forEach(function(entry) {
      var isRec = (entry.row === bestRow) ? " <--- RECOMMENDED TO KEEP" : "";
      var formulaTag = entry.valFormula ? " [Formula: " + entry.valFormula + "]" : "";
      Logger.log("  Row: " + entry.row);
      Logger.log("  Value: " + (entry.valDisplay === "" ? "<empty>" : entry.valDisplay) + formulaTag);
      Logger.log("  Description: " + (entry.descDisplay === "" ? "<empty>" : entry.descDisplay));
      if (isRec) {
        Logger.log("  Status:" + isRec);
      }
    });

    Logger.log("  Recommended row to keep: Row " + bestRow);
    Logger.log("-----------------------------------------");
  });

  Logger.log("=========================================");
  Logger.log("SUMMARY RECOMMENDATIONS TO PRESERVE");
  Logger.log("=========================================");
  orderedKeys.forEach(function(kName) {
    Logger.log("  " + kName + " -> Row " + recommendations[kName]);
  });
  Logger.log("=========================================");

  return {
    success: true,
    totalRows: totalRows,
    uniqueKeysCount: orderedKeys.length,
    duplicateKeysCount: duplicateKeys.length,
    duplicateKeys: duplicateKeys,
    recommendations: recommendations
  };
}
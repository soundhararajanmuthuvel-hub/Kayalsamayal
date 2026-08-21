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
 */
function getSettingValue(ss, key) {
  try {
    var sheet = getSheetSafely(ss, TABS.SETTINGS);
    if (!sheet) return null;
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
      getSheetRowsAsJSON(sSheet).forEach(function(row) {
        if (row["Key"]) settingsMap[row["Key"]] = row["Value"];
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

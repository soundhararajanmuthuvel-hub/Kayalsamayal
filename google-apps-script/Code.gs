/**
 * Google Apps Script for Kayal Samayal
 * Database Integration + UPI Manual Payment + Email Notification via MailApp
 * Spreadsheet ID: 1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc
 *
 * Payment Flow:
 *   Frontend → UPI QR/App → Customer enters UTR → POST createOrder with UTR
 *   Backend  → validates products/stock → saves order → stores UTR → emails → returns success
 *
 * IMPORTANT: UPI ID and Admin Email are read from Settings sheet (keys: upi_id, admin_email).
 * Configure them in the Settings sheet before going live. Do NOT hardcode here.
 */

const SPREADSHEET_ID = "1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc";

// Exact Tab Name Mappings (do not rename)
const TABS = {
  PRODUCTS: "Products",
  CUSTOMERS: "Customers",
  ORDERS: "Orders",
  ORDER_ITEMS: "Order Items",
  REVIEWS: "Reviews",
  SETTINGS: "Settings"
};

// ── CORE HELPERS ─────────────────────────────────────────────────────────────

/**
 * Safe Sheet Lookup — tries primary name then alternatives.
 */
function getSheetSafely(ss, preferredName, alternativeNames) {
  let sheet = ss.getSheetByName(preferredName);
  if (sheet) return sheet;
  if (alternativeNames && Array.isArray(alternativeNames)) {
    for (let i = 0; i < alternativeNames.length; i++) {
      sheet = ss.getSheetByName(alternativeNames[i]);
      if (sheet) return sheet;
    }
  }
  return null;
}

/**
 * Read a single value from the Settings sheet by key.
 * Returns null if key not found or sheet missing.
 */
function getSettingValue(ss, key) {
  try {
    const sheet = getSheetSafely(ss, TABS.SETTINGS);
    if (!sheet) return null;
    const data = getSheetRowsAsJSON(sheet);
    const row = data.find(r => String(r["Key"] || "").trim() === key);
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
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
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
 * Never throws — logging failures must not block order processing.
 */
function logApiAction(ss, logData) {
  try {
    const logsSheet = getSheetSafely(ss, "API Logs");
    if (!logsSheet) return;
    const ts = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMddHHmmss");
    const rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
    const logId = "LOG-" + ts + "-" + rand;
    logsSheet.appendRow([
      logId,
      new Date(),
      logData.action || "",
      logData.method || "POST",
      logData.orderId || "",
      logData.customerId || "",
      logData.status || "",
      logData.request ? JSON.stringify(logData.request).substring(0, 500) : "",
      logData.response ? JSON.stringify(logData.response).substring(0, 500) : "",
      logData.message || ""
    ]);
  } catch (e) {
    Logger.log("logApiAction error: " + e.toString());
  }
}

/**
 * Add missing payment columns to the Orders sheet non-destructively.
 * Safe to call on an existing sheet — existing data is never modified.
 */
function addPaymentColumnsToOrders(ss) {
  try {
    const ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
    if (!ordersSheet || ordersSheet.getLastColumn() === 0) return;

    const headerRow = ordersSheet.getRange(1, 1, 1, ordersSheet.getLastColumn()).getValues()[0];
    const existingHeaders = headerRow.map(h => String(h).trim());

    const paymentCols = [
      "Payment Method",
      "UPI ID",
      "UTR",
      "Payment Submitted At",
      "Payment Verified At"
    ];

    paymentCols.forEach(colName => {
      if (!existingHeaders.includes(colName)) {
        const nextCol = ordersSheet.getLastColumn() + 1;
        const cell = ordersSheet.getRange(1, nextCol);
        cell.setValue(colName);
        cell.setFontWeight("bold").setBackground("#F4EBE1");
        ordersSheet.autoResizeColumn(nextCol);
        existingHeaders.push(colName); // keep local array in sync
        Logger.log("Added payment column to Orders: " + colName);
      }
    });
  } catch (e) {
    Logger.log("addPaymentColumnsToOrders error: " + e.toString());
  }
}

// ── DATABASE SETUP ───────────────────────────────────────────────────────────

/**
 * Administrative Setup Function.
 * Safe to run multiple times — skips existing sheets, adds missing columns only.
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const spreadsheetName = ss.getName();

  const existingSheets = [];
  const createdSheets = [];
  const skippedSheets = [];

  ss.getSheets().forEach(s => existingSheets.push(s.getName()));

  const sheetDefinitions = [
    {
      name: TABS.PRODUCTS,
      altNames: ["products_export", "products"],
      headers: ["Product ID", "Product Name", "Category", "Tier", "Price", "MRP", "GST", "Stock", "Image", "Description", "Highlights", "Active"]
    },
    {
      name: TABS.CUSTOMERS,
      altNames: ["Customer", "Customers Sheet"],
      headers: ["Customer ID", "Full Name", "Mobile", "Email", "Shipping Address", "City/Town", "State", "Pincode", "Created At", "Updated At"]
    },
    {
      name: TABS.ORDERS,
      altNames: ["Order", "Orders Sheet"],
      headers: [
        "Order ID", "Customer ID", "Order Date", "Full Name", "Mobile", "Email",
        "Shipping Address", "City/Town", "State", "Pincode", "Order Notes",
        "Subtotal", "GST", "Shipping", "Discount", "Grand Total",
        "Payment Status", "Order Status", "Created At",
        "Payment Method", "UPI ID", "UTR", "Payment Submitted At", "Payment Verified At"
      ]
    },
    {
      name: TABS.ORDER_ITEMS,
      altNames: ["OrderItems", "Order_Items"],
      headers: ["Order Item ID", "Order ID", "Product ID", "Product Name", "Tier", "Quantity", "Unit Price", "GST %", "GST Amount", "Line Total", "Created At"]
    },
    {
      name: TABS.REVIEWS,
      altNames: [],
      headers: ["Review ID", "Product ID", "Product Name", "Customer Name", "Rating", "Review", "Approved", "Created At"]
    },
    {
      name: TABS.SETTINGS,
      altNames: [],
      headers: ["Key", "Value", "Description", "Updated At"]
    },
    {
      name: "API Logs",
      altNames: [],
      headers: ["Log ID", "Timestamp", "Action", "Method", "Order ID", "Customer ID", "Status", "Request Data", "Response Data", "Error Message"]
    }
  ];

  Logger.log("Starting Database Setup...");

  sheetDefinitions.forEach(def => {
    let sheet = getSheetSafely(ss, def.name, def.altNames);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.appendRow(def.headers);
      sheet.setFrozenRows(1);
      const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setFontWeight("bold").setBackground("#F4EBE1");
      for (let i = 1; i <= def.headers.length; i++) {
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
  const settingsSheet = getSheetSafely(ss, TABS.SETTINGS);
  if (settingsSheet) {
    const existingSettings = settingsSheet.getLastRow() > 1 ? getSheetRowsAsJSON(settingsSheet) : [];
    const existingKeys = existingSettings.map(r => String(r["Key"] || "").trim());

    const allSettings = [
      ["business_name",          "Kayal Samayal",    "The name of the business",                          new Date()],
      ["whatsapp_number",        "+91 9003860616",   "Direct customer care WhatsApp line",                new Date()],
      ["shipping_charge",        "60",               "Flat shipping charge in INR",                       new Date()],
      ["free_shipping_threshold","500",              "Cart subtotal threshold for free shipping (INR)",   new Date()],
      ["default_gst",            "0.05",             "Standard GST rate (0.05 = 5%)",                     new Date()],
      // CONFIGURE THESE IN SETTINGS SHEET BEFORE GOING LIVE:
      ["upi_id",                 "",                 "UPI ID for receiving payments — CONFIGURE BEFORE GOING LIVE", new Date()],
      ["admin_email",            "",                 "Owner email for order notifications — CONFIGURE BEFORE GOING LIVE", new Date()]
    ];

    allSettings.forEach(row => {
      if (!existingKeys.includes(row[0])) {
        settingsSheet.appendRow(row);
        Logger.log("Seeded setting: " + row[0]);
      }
    });
  }

  Logger.log("=========================================");
  Logger.log("DATABASE SYNC COMPLETE");
  Logger.log("Spreadsheet: " + spreadsheetName);
  Logger.log("Created: " + (createdSheets.length > 0 ? createdSheets.join(", ") : "None"));
  Logger.log("Skipped (already exist): " + skippedSheets.join(", "));
  Logger.log("=========================================");
}

// ── HTTP GET HANDLER ─────────────────────────────────────────────────────────

function doGet(e) {
  const action = e.parameter ? e.parameter.action : null;

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === "setup") {
      setupDatabaseSheets();
      return jsonResponse({ success: true, message: "Database sheets initialized successfully!" });
    }

    if (action === "health") {
      return jsonResponse({ success: true, message: "Kayal Samayal API is working", timestamp: new Date() });
    }

    if (action === "diag") {
      const diagReport = testDatabaseSheets();
      return jsonResponse({ success: true, data: diagReport });
    }

    if (action === "testSampleOrder") {
      const orderReport = testSampleOrder();
      return jsonResponse(orderReport);
    }

    if (action === "products") {
      const sheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
      if (!sheet) {
        return jsonResponse({ success: false, error: "Products sheet not found", step: "Products lookup" });
      }
      const data = getSheetRowsAsJSON(sheet);
      return jsonResponse({ success: true, data: data });
    }

    if (action === "reviews") {
      const sheet = getSheetSafely(ss, TABS.REVIEWS);
      if (!sheet) return jsonResponse({ success: true, data: [] });
      const data = getSheetRowsAsJSON(sheet);
      const filtered = data.filter(r =>
        r["Active"] === true || String(r["Active"]).toLowerCase() === "true" || r["Active"] === "TRUE"
      );
      return jsonResponse({ success: true, data: filtered });
    }

    if (action === "settings") {
      const sheet = getSheetSafely(ss, TABS.SETTINGS);
      if (!sheet) return jsonResponse({ success: true, data: {} });
      const data = getSheetRowsAsJSON(sheet);
      const settingsMap = {};
      data.forEach(row => { if (row["Key"]) settingsMap[row["Key"]] = row["Value"]; });
      return jsonResponse({ success: true, data: settingsMap });
    }

    if (action === "order") {
      const orderId = e.parameter.id;
      if (!orderId) {
        return jsonResponse({ success: false, error: "Order ID parameter is required", step: "Parameter Validation" });
      }
      const ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      const itemsSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);
      const customersSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
      if (!ordersSheet || !itemsSheet) {
        return jsonResponse({ success: false, error: "Orders or Order Items sheet not found", step: "Orders Lookup" });
      }
      const orders = getSheetRowsAsJSON(ordersSheet);
      const order = orders.find(o => o["Order ID"] === orderId);
      if (!order) return jsonResponse({ success: false, error: "Order not found", step: "Order Search" });
      const allItems = getSheetRowsAsJSON(itemsSheet);
      const orderItems = allItems.filter(item => item["Order ID"] === orderId);
      let customer = null;
      if (customersSheet && order["Customer ID"]) {
        const customers = getSheetRowsAsJSON(customersSheet);
        customer = customers.find(c => c["Customer ID"] === order["Customer ID"]) || null;
      }
      return jsonResponse({ success: true, data: { order, customer, items: orderItems } });
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

    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (!action) {
      return jsonResponse({ success: false, error: "Missing action parameter", step: "POST Action Routing" });
    }

    if (action === "createCustomer") {
      let customersSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
      if (!customersSheet) {
        setupDatabaseSheets();
        customersSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
      }
      if (!customersSheet) {
        return jsonResponse({ success: false, error: "Customers sheet not found", step: "Customers Sheet Lookup" });
      }
      const customerId = findOrCreateCustomer(customersSheet, postData);
      return jsonResponse({ success: true, customerId });
    }

    if (action === "createOrder") {
      const orderRes = processOrderTransaction(ss, postData);
      return jsonResponse(orderRes);
    }

    if (action === "updateOrder") {
      let ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      if (!ordersSheet) {
        setupDatabaseSheets();
        ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      }
      if (!ordersSheet) {
        return jsonResponse({ success: false, error: "Orders sheet not found", step: "Orders Sheet Lookup" });
      }
      return jsonResponse(updateOrderStatus(ordersSheet, postData));
    }

    if (action === "diag") {
      const diagReport = testDatabaseSheets();
      return jsonResponse({ success: true, data: diagReport });
    }

    if (action === "testSampleOrder") {
      const orderReport = testSampleOrder();
      return jsonResponse(orderReport);
    }

    return jsonResponse({ success: false, error: "Unknown action payload", step: "POST Action Routing" });

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString(), step: "doPost Exception" });
  }
}

// ── CUSTOMER ─────────────────────────────────────────────────────────────────

/**
 * Find existing customer by mobile or create a new one.
 * Always updates existing customer info on re-order.
 */
function findOrCreateCustomer(sheet, data) {
  const name    = data.name    || "Anonymous";
  const mobile  = String(data.mobile || "").trim();
  const email   = data.email   || "";
  const address = data.address || "";
  const city    = data.city    || "";
  const state   = data.state   || "";
  const pincode = String(data.pincode || "").trim();

  const customers = getSheetRowsAsJSON(sheet);
  const existing = customers.find(c => String(c["Mobile"]).trim() === mobile);

  if (existing) {
    const rowIndex = customers.indexOf(existing) + 2;
    sheet.getRange(rowIndex, 2).setValue(name);
    sheet.getRange(rowIndex, 4).setValue(email);
    sheet.getRange(rowIndex, 5).setValue(address);
    sheet.getRange(rowIndex, 6).setValue(city);
    sheet.getRange(rowIndex, 7).setValue(state);
    sheet.getRange(rowIndex, 8).setValue(pincode);
    sheet.getRange(rowIndex, 10).setValue(new Date());
    return existing["Customer ID"];
  }

  const dateStr  = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd");
  const countStr = String(customers.length + 1).padStart(4, "0");
  const customerId = "CUS-" + dateStr + "-" + countStr;

  sheet.appendRow([customerId, name, mobile, email, address, city, state, pincode, new Date(), new Date()]);
  return customerId;
}

// ── ORDER PROCESSING ─────────────────────────────────────────────────────────

/**
 * Full order transaction:
 *   1. Validate products + active status + stock (backend authoritative)
 *   2. Calculate subtotal, GST, shipping, grand total
 *   3. Read UPI ID from Settings
 *   4. Find/create customer
 *   5. Create order row with payment columns
 *   6. Create order item rows + deduct stock
 *   7. Send customer + admin emails (failure does NOT cancel order)
 *   8. Log to API Logs
 *   9. Return full success response
 */
function processOrderTransaction(ss, data) {
  try {
    let productsSheet  = getSheetSafely(ss, TABS.PRODUCTS,   ["products_export", "products"]);
    let ordersSheet    = getSheetSafely(ss, TABS.ORDERS,     ["Order", "Orders Sheet"]);
    let itemsSheet     = getSheetSafely(ss, TABS.ORDER_ITEMS,["OrderItems", "Order_Items"]);
    let customersSheet = getSheetSafely(ss, TABS.CUSTOMERS,  ["Customer", "Customers Sheet"]);

    if (!productsSheet || !ordersSheet || !itemsSheet || !customersSheet) {
      setupDatabaseSheets();
      productsSheet  = getSheetSafely(ss, TABS.PRODUCTS,   ["products_export", "products"]);
      ordersSheet    = getSheetSafely(ss, TABS.ORDERS,     ["Order", "Orders Sheet"]);
      itemsSheet     = getSheetSafely(ss, TABS.ORDER_ITEMS,["OrderItems", "Order_Items"]);
      customersSheet = getSheetSafely(ss, TABS.CUSTOMERS,  ["Customer", "Customers Sheet"]);
    }

    if (!productsSheet)  return { success: false, error: "Sheet not found", step: "Products" };
    if (!ordersSheet)    return { success: false, error: "Sheet not found", step: "Orders" };
    if (!itemsSheet)     return { success: false, error: "Sheet not found", step: "Order Items" };
    if (!customersSheet) return { success: false, error: "Sheet not found", step: "Customers" };

    // Extract payload fields
    const customerInput = data.customer;
    const itemsInput    = data.items;
    const utr           = String(data.utr || "").trim();
    const paymentMethod = data.paymentMethod || "UPI";

    // ── Step 1: Validate customer ──────────────────────────────────────────
    if (!customerInput || !customerInput.name || !customerInput.mobile) {
      return { success: false, error: "Customer name and mobile are required", step: "Customer Validation" };
    }

    // ── Step 2: Validate items ─────────────────────────────────────────────
    if (!itemsInput || !Array.isArray(itemsInput) || itemsInput.length === 0) {
      return { success: false, error: "Cart is empty", step: "Items Validation" };
    }

    // ── Step 3: Validate each product, active status, stock ───────────────
    const products = getSheetRowsAsJSON(productsSheet);
    const validatedItems = [];
    let subtotal = 0;

    for (let i = 0; i < itemsInput.length; i++) {
      const item = itemsInput[i];
      const product = products.find(p =>
        String(p["Product ID"] || p["id"] || p["productId"]) === String(item.productId)
      );

      if (!product) {
        return { success: false, error: "Product not found: " + item.productId, step: "Product Lookup" };
      }

      const activeVal = product["Active"] ?? product["active"];
      const active = activeVal === true
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

      const requestedQty   = Number(item.quantity || 1);
      const availableStock = Number(product["Stock"] ?? product["stock"] ?? 999);

      if (requestedQty > availableStock) {
        return {
          success: false,
          error: "Insufficient stock for: " + (product["Product Name"] || product["name"]) + ". Available: " + availableStock,
          step: "Stock Check"
        };
      }

      const unitPrice = Number(product["Price"] ?? product["price"] ?? 0);
      const gstRate   = Number(product["GST"]   ?? product["gst"]   ?? 0);
      const lineTotal = unitPrice * requestedQty;

      subtotal += lineTotal;

      validatedItems.push({
        product,
        productId:   String(product["Product ID"] || product["id"] || item.productId),
        productName: String(product["Product Name"] || product["name"] || ""),
        tier:        String(product["Tier"] || product["tier"] || "regular"),
        quantity:    requestedQty,
        unitPrice,
        gstRate,
        lineTotal
      });
    }

    // ── Step 4: Calculate totals ───────────────────────────────────────────
    const gstTotal = validatedItems.reduce((sum, item) => sum + (item.lineTotal * item.gstRate), 0);

    let shippingCharge       = 60;
    let freeShippingThreshold = 500;
    const settingsSheet = getSheetSafely(ss, TABS.SETTINGS);
    if (settingsSheet) {
      try {
        const settings = getSheetRowsAsJSON(settingsSheet);
        const shipVal  = settings.find(s => s["Key"] === "shipping_charge");
        const threshVal = settings.find(s => s["Key"] === "free_shipping_threshold");
        if (shipVal  && shipVal["Value"]  !== "" && shipVal["Value"]  !== undefined) shippingCharge        = Number(shipVal["Value"]);
        if (threshVal && threshVal["Value"] !== "" && threshVal["Value"] !== undefined) freeShippingThreshold = Number(threshVal["Value"]);
      } catch (e) { /* use defaults */ }
    }

    const shipping   = subtotal >= freeShippingThreshold ? 0 : shippingCharge;
    const discount   = 0;
    const grandTotal = subtotal + shipping + gstTotal - discount;

    // Read authoritative UPI ID from Settings (never from frontend payload)
    const upiId = getSettingValue(ss, "upi_id") || "";

    // ── Step 5: Find/create customer ───────────────────────────────────────
    const customerId = findOrCreateCustomer(customersSheet, customerInput);

    // ── Step 6: Generate Order ID ──────────────────────────────────────────
    const orders      = getSheetRowsAsJSON(ordersSheet);
    const dateStr     = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd");
    const orderCountStr = String(orders.length + 1).padStart(4, "0");
    const orderId     = "KYS-" + dateStr + "-" + orderCountStr;

    // ── Step 7: Append Order row (19 base columns) ─────────────────────────
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
      "Pending Verification",   // Payment Status
      "Pending",                // Order Status
      new Date()                // Created At
    ]);

    // ── Step 8: Set payment columns by header name (safe for any column order)
    const newOrderRowNum  = ordersSheet.getLastRow();
    const orderHeaderVals = ordersSheet.getRange(1, 1, 1, ordersSheet.getLastColumn()).getValues()[0];

    function setOrderCol(colName, value) {
      const idx = orderHeaderVals.indexOf(colName) + 1;
      if (idx > 0) ordersSheet.getRange(newOrderRowNum, idx).setValue(value);
    }

    setOrderCol("Payment Method",     paymentMethod);
    setOrderCol("UPI ID",             upiId);
    setOrderCol("UTR",                utr);
    setOrderCol("Payment Submitted At", new Date());
    setOrderCol("Payment Verified At",  ""); // Empty — owner must manually verify

    // ── Step 9: Append Order Items & deduct stock ──────────────────────────
    validatedItems.forEach((item, index) => {
      const orderItemId = orderId + "-ITEM-" + String(index + 1).padStart(3, "0");
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

      // Deduct stock from Products
      const pIndex       = products.indexOf(item.product) + 2;
      const currentStock = Number(item.product["Stock"] ?? item.product["stock"] ?? 0);
      const newStock     = Math.max(0, currentStock - item.quantity);
      const prodHeaders  = productsSheet.getRange(1, 1, 1, productsSheet.getLastColumn()).getValues()[0];
      const stockColIdx  = prodHeaders.findIndex(h => String(h).trim().toLowerCase() === "stock") + 1;
      if (stockColIdx > 0) {
        productsSheet.getRange(pIndex, stockColIdx).setValue(newStock);
      }
    });

    // Build shared data object for emails
    const orderData = {
      orderId, customerId, customerInput, validatedItems,
      subtotal, gstTotal, shipping, discount, grandTotal,
      paymentMethod, paymentStatus: "Pending Verification", utr, upiId
    };

    // ── Step 10: Send emails — NEVER cancels order on failure ──────────────
    let emailSent  = false;
    let emailError = "";
    try {
      const customerEmail = String(customerInput.email || "").trim();
      if (customerEmail) {
        sendOrderConfirmationEmail(ss, orderData);
      }
      sendAdminNotificationEmail(ss, orderData);
      emailSent = true;
      logApiAction(ss, {
        action: "email_success", method: "POST",
        orderId, customerId, status: "SUCCESS",
        message: "Customer + admin order emails sent"
      });
    } catch (emailErr) {
      emailSent  = false;
      emailError = emailErr.toString();
      logApiAction(ss, {
        action: "email_failure", method: "POST",
        orderId, customerId, status: "ERROR",
        message: "Email failed: " + emailError
      });
      Logger.log("Email failed (order still saved successfully): " + emailError);
    }

    // ── Step 11: Log order success ─────────────────────────────────────────
    logApiAction(ss, {
      action:    "createOrder",
      method:    "POST",
      orderId,
      customerId,
      status:    "SUCCESS",
      message:   "UPI order created. emailSent=" + emailSent + (emailError ? " emailError=" + emailError : "")
    });

    // ── Step 12: Return success response ───────────────────────────────────
    return {
      success:       true,
      orderId,
      customerId,
      paymentMethod,
      paymentStatus: "Pending Verification",
      utr,
      subtotal,
      shipping,
      discount,
      gst:           gstTotal,
      grandTotal,
      orderStatus:   "Pending",
      emailSent,
      items: validatedItems.map(i => ({
        productId:   i.productId,
        productName: i.productName,
        tier:        i.tier,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        total:       i.lineTotal
      })),
      message: "Order placed successfully"
    };

  } catch (err) {
    try {
      logApiAction(SpreadsheetApp.openById(SPREADSHEET_ID), {
        action: "createOrder", status: "ERROR", message: err.toString()
      });
    } catch (e) { /* ignore logging error */ }
    return { success: false, error: err.toString(), step: "processOrderTransaction Execution" };
  }
}

// ── EMAIL FUNCTIONS ──────────────────────────────────────────────────────────

/**
 * Build HTML email body for order confirmation (customer) or admin notification.
 * @param {Object}  orderData — full order data object
 * @param {boolean} isAdmin   — true for admin notification, false for customer confirmation
 */
function buildOrderEmailHtml(orderData, isAdmin) {
  const { orderId, customerId, customerInput, validatedItems,
          subtotal, gstTotal, shipping, discount, grandTotal,
          paymentMethod, paymentStatus, utr, upiId } = orderData;

  const orderDate = Utilities.formatDate(new Date(), "GMT+5:30", "dd MMM yyyy hh:mm a");

  const itemsRows = validatedItems.map(item => `
    <tr style="border-bottom:1px solid #f0e6d6;">
      <td style="padding:8px 6px;font-size:13px;font-family:sans-serif;">${item.productName}</td>
      <td style="padding:8px 6px;font-size:12px;font-family:sans-serif;color:#7a5c3a;text-transform:capitalize;">${item.tier}</td>
      <td style="padding:8px 6px;font-size:13px;text-align:center;font-family:sans-serif;">${item.quantity}</td>
      <td style="padding:8px 6px;font-size:13px;text-align:right;font-family:sans-serif;">Rs. ${item.unitPrice.toFixed(2)}</td>
      <td style="padding:8px 6px;font-size:12px;text-align:right;font-family:sans-serif;color:#7a5c3a;">${(item.gstRate * 100).toFixed(0)}%</td>
      <td style="padding:8px 6px;font-size:13px;text-align:right;font-family:sans-serif;font-weight:bold;">Rs. ${item.lineTotal.toFixed(2)}</td>
    </tr>`).join("");

  const adminWarning = isAdmin ? `
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:16px;margin-bottom:20px;border-radius:4px;">
      <strong style="font-family:sans-serif;color:#b45309;font-size:14px;">⚠️ Action Required: Verify UPI Payment</strong><br>
      <span style="font-family:sans-serif;font-size:13px;color:#92400e;">
        Customer UTR: <strong>${utr || "Not provided"}</strong><br>
        Please verify this UTR in your UPI app / bank statement before marking the order as Verified.
        Update Payment Status in the Orders sheet after verification.
      </span>
    </div>` : "";

  const customerIntro = !isAdmin ? `
    <p style="font-family:sans-serif;font-size:14px;color:#3d2010;line-height:1.7;margin-bottom:20px;">
      Dear <strong>${customerInput.name}</strong>,<br><br>
      Your order has been received successfully. Your UPI payment is
      <strong style="color:#b45309;">pending verification</strong>.
      We will confirm your payment and process your order shortly.
      Thank you for choosing Kayal Samayal!
    </p>` : `
    <p style="font-family:sans-serif;font-size:14px;color:#3d2010;line-height:1.7;margin-bottom:20px;">
      A new UPI order has been placed and is awaiting payment verification.
    </p>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5efe8;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5efe8;padding:32px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);max-width:600px;width:100%;">

    <!-- Header -->
    <tr>
      <td style="background:#1c0f06;padding:28px 32px;text-align:center;">
        <h1 style="margin:0;color:#c9a84c;font-family:Georgia,serif;font-size:24px;letter-spacing:2px;">
          Kayal Samayal
        </h1>
        <p style="margin:6px 0 0;color:#d4b896;font-size:12px;font-family:sans-serif;letter-spacing:1px;">
          AUTHENTIC HERITAGE SPICES
        </p>
        <div style="margin-top:12px;display:inline-block;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);padding:4px 14px;border-radius:20px;">
          <span style="color:#c9a84c;font-size:11px;font-family:sans-serif;font-weight:bold;">
            ${isAdmin ? "NEW ORDER NOTIFICATION" : "ORDER CONFIRMATION"}
          </span>
        </div>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px;">

        ${adminWarning}
        ${customerIntro}

        <!-- Order Summary Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5f0;border-radius:8px;padding:0;margin-bottom:24px;overflow:hidden;">
          <tr style="background:#f0e6d6;">
            <td colspan="2" style="padding:10px 16px;font-family:sans-serif;font-size:11px;font-weight:bold;color:#7a5c3a;text-transform:uppercase;letter-spacing:1px;">
              Order Reference
            </td>
          </tr>
          <tr>
            <td style="padding:12px 16px 4px;font-family:sans-serif;font-size:12px;color:#7a5c3a;width:40%;">Order ID</td>
            <td style="padding:12px 16px 4px;font-family:sans-serif;font-size:15px;font-weight:bold;color:#1c0f06;">${orderId}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Order Date</td>
            <td style="padding:4px 16px;font-family:sans-serif;font-size:13px;color:#3d2010;">${orderDate}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px 12px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Customer ID</td>
            <td style="padding:4px 16px 12px;font-family:sans-serif;font-size:13px;color:#3d2010;">${customerId}</td>
          </tr>
        </table>

        <!-- Customer Details -->
        <h3 style="font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f0e6d6;padding-bottom:8px;margin:24px 0 12px;">
          Customer Details
        </h3>
        <table width="100%" cellpadding="5" cellspacing="0">
          <tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;width:38%;">Full Name</td><td style="font-family:sans-serif;font-size:13px;color:#3d2010;">${customerInput.name}</td></tr>
          <tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;">Mobile</td><td style="font-family:sans-serif;font-size:13px;color:#3d2010;">${customerInput.mobile}</td></tr>
          <tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;">Email</td><td style="font-family:sans-serif;font-size:13px;color:#3d2010;">${customerInput.email || "—"}</td></tr>
          <tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;vertical-align:top;padding-top:5px;">Address</td>
              <td style="font-family:sans-serif;font-size:13px;color:#3d2010;">${customerInput.address || "—"}, ${customerInput.city || "—"}, ${customerInput.state || "—"} — ${customerInput.pincode || "—"}</td></tr>
          ${customerInput.notes ? `<tr><td style="font-family:sans-serif;font-size:12px;color:#7a5c3a;">Order Notes</td><td style="font-family:sans-serif;font-size:13px;color:#3d2010;">${customerInput.notes}</td></tr>` : ""}
        </table>

        <!-- Order Items -->
        <h3 style="font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f0e6d6;padding-bottom:8px;margin:24px 0 12px;">
          Order Items
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead>
            <tr style="background:#f9f5f0;">
              <th style="padding:8px 6px;text-align:left;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Product</th>
              <th style="padding:8px 6px;text-align:left;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Tier</th>
              <th style="padding:8px 6px;text-align:center;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Qty</th>
              <th style="padding:8px 6px;text-align:right;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Unit</th>
              <th style="padding:8px 6px;text-align:right;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">GST</th>
              <th style="padding:8px 6px;text-align:right;font-family:sans-serif;font-size:11px;color:#7a5c3a;font-weight:bold;text-transform:uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>

        <!-- Totals -->
        <table width="100%" cellpadding="5" cellspacing="0" style="margin-top:16px;border-top:2px solid #f0e6d6;">
          <tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">Subtotal</td>
              <td style="text-align:right;font-family:sans-serif;font-size:13px;color:#3d2010;">Rs. ${subtotal.toFixed(2)}</td></tr>
          <tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">GST</td>
              <td style="text-align:right;font-family:sans-serif;font-size:13px;color:#3d2010;">Rs. ${gstTotal.toFixed(2)}</td></tr>
          <tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">Shipping</td>
              <td style="text-align:right;font-family:sans-serif;font-size:13px;color:#3d2010;">${shipping === 0 ? '<span style="color:#16a34a;">FREE</span>' : "Rs. " + shipping.toFixed(2)}</td></tr>
          ${discount > 0 ? `<tr><td style="font-family:sans-serif;font-size:13px;color:#7a5c3a;">Discount</td><td style="text-align:right;font-family:sans-serif;font-size:13px;color:#16a34a;">−Rs. ${discount.toFixed(2)}</td></tr>` : ""}
          <tr style="border-top:1px solid #f0e6d6;">
            <td style="font-family:sans-serif;font-size:15px;font-weight:bold;color:#1c0f06;padding-top:10px;">Grand Total</td>
            <td style="text-align:right;font-family:sans-serif;font-size:15px;font-weight:bold;color:#1c0f06;padding-top:10px;">Rs. ${grandTotal.toFixed(2)}</td>
          </tr>
        </table>

        <!-- Payment Details -->
        <h3 style="font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f0e6d6;padding-bottom:8px;margin:24px 0 12px;">
          Payment Details
        </h3>
        <table width="100%" cellpadding="5" cellspacing="0" style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;">
          <tr>
            <td style="padding:10px 16px 4px;font-family:sans-serif;font-size:12px;color:#7a5c3a;width:42%;">Payment Method</td>
            <td style="padding:10px 16px 4px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;">${paymentMethod}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">Payment Status</td>
            <td style="padding:4px 16px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#b45309;">${paymentStatus}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">UPI ID Paid To</td>
            <td style="padding:4px 16px;font-family:sans-serif;font-size:13px;color:#3d2010;">${upiId || "Not configured"}</td>
          </tr>
          <tr>
            <td style="padding:4px 16px 10px;font-family:sans-serif;font-size:12px;color:#7a5c3a;">UTR / Transaction ID</td>
            <td style="padding:4px 16px 10px;font-family:sans-serif;font-size:13px;font-weight:bold;color:#1c0f06;">${utr || "Not provided"}</td>
          </tr>
        </table>

        <!-- Message -->
        <div style="background:#f9f5f0;border-radius:8px;padding:16px;margin-top:24px;">
          <p style="font-family:sans-serif;font-size:13px;color:#7a5c3a;margin:0;line-height:1.7;">
            ${!isAdmin
              ? "Your order has been saved. Your UPI payment is <strong>pending verification</strong>. We will process and dispatch your order once payment is confirmed. For queries, reach us on WhatsApp: +91 9003860616."
              : "Please log into Google Sheets, verify the UTR against your UPI app or bank statement, then update the <strong>Payment Status</strong> to <em>Verified</em> or <em>Rejected</em> in the Orders sheet."
            }
          </p>
        </div>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f0e6d6;padding:16px 32px;text-align:center;border-top:1px solid #e8d5be;">
        <p style="font-family:sans-serif;font-size:11px;color:#7a5c3a;margin:0;">
          &copy; ${new Date().getFullYear()} Kayal Samayal &middot; Authentic Heritage Spices &middot; +91 9003860616
        </p>
      </td>
    </tr>

  </table>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Send order confirmation email to the customer via MailApp.
 * Skips silently if customer has no email address.
 * Throws on MailApp failure so caller can handle and log.
 */
function sendOrderConfirmationEmail(ss, orderData) {
  const customerEmail = String(orderData.customerInput.email || "").trim();
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
 * Skips silently if admin_email is not configured.
 * Throws on MailApp failure so caller can handle and log.
 */
function sendAdminNotificationEmail(ss, orderData) {
  const adminEmail = getSettingValue(ss, "admin_email") || "";
  if (!adminEmail) {
    Logger.log("sendAdminNotificationEmail: admin_email not configured in Settings — skipping.");
    return;
  }
  MailApp.sendEmail({
    to:       adminEmail,
    subject:  "New Kayal Samayal UPI Order - " + orderData.orderId,
    htmlBody: buildOrderEmailHtml(orderData, true),
    name:     "Kayal Samayal System"
  });
  Logger.log("Admin notification email sent to: " + adminEmail);
}

// ── UPDATE ORDER STATUS ──────────────────────────────────────────────────────

function updateOrderStatus(sheet, data) {
  const orderId       = data.orderId;
  const paymentStatus = data.paymentStatus;
  const orderStatus   = data.orderStatus;

  if (!orderId) return { success: false, error: "Order ID is required", step: "Order ID Validation" };

  const orders = getSheetRowsAsJSON(sheet);
  const order  = orders.find(o => o["Order ID"] === orderId);

  if (!order) return { success: false, error: "Order ID not found: " + orderId, step: "Order Lookup" };

  const rowIndex = orders.indexOf(order) + 2;
  const headers  = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (paymentStatus) {
    const colIdx = headers.indexOf("Payment Status") + 1;
    if (colIdx > 0) sheet.getRange(rowIndex, colIdx).setValue(paymentStatus);
    // Also set Payment Verified At if marking as Verified
    if (paymentStatus === "Verified") {
      const verifIdx = headers.indexOf("Payment Verified At") + 1;
      if (verifIdx > 0) sheet.getRange(rowIndex, verifIdx).setValue(new Date());
    }
  }

  if (orderStatus) {
    const colIdx = headers.indexOf("Order Status") + 1;
    if (colIdx > 0) sheet.getRange(rowIndex, colIdx).setValue(orderStatus);
  }

  return { success: true, message: "Order updated successfully" };
}

// ── DIAGNOSTICS ──────────────────────────────────────────────────────────────

/**
 * testDatabaseSheets — checks all required sheets, payment columns, and Settings.
 * Run this from Apps Script editor or via GET ?action=diag to verify setup.
 */
function testDatabaseSheets() {
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const name = ss.getName();

  const prodSheet = getSheetSafely(ss, TABS.PRODUCTS,    ["products_export", "products"]);
  const custSheet = getSheetSafely(ss, TABS.CUSTOMERS,   ["Customer"]);
  const ordSheet  = getSheetSafely(ss, TABS.ORDERS,      ["Order"]);
  const itemSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);

  // Verify payment columns
  const paymentColsStatus = {};
  if (ordSheet && ordSheet.getLastColumn() > 0) {
    const headers = ordSheet.getRange(1, 1, 1, ordSheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    ["Payment Method", "Payment Status", "UPI ID", "UTR", "Payment Submitted At", "Payment Verified At"].forEach(col => {
      paymentColsStatus[col] = headers.includes(col);
    });
  }

  // Settings status
  const upiId      = getSettingValue(ss, "upi_id");
  const adminEmail = getSettingValue(ss, "admin_email");

  const report = {
    spreadsheetName: name,
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
 * testSampleOrder — end-to-end order test using a real active product.
 * Creates an actual test order in the sheet. Does NOT auto-delete it.
 * Run from Apps Script editor or via POST { action: "testSampleOrder" }.
 */
function testSampleOrder() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  setupDatabaseSheets();

  const prodSheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
  if (!prodSheet) {
    return { success: false, error: "Products sheet not found", step: "Products Lookup" };
  }

  const products     = getSheetRowsAsJSON(prodSheet);
  const activeProduct = products.find(p => {
    const act = p["Active"] ?? p["active"];
    return act === true || String(act).toLowerCase() === "true" || act === 1 || String(act).toLowerCase() === "yes";
  });

  if (!activeProduct) {
    return { success: false, error: "No active product found in Products sheet", step: "Product Selection" };
  }

  const productId = String(activeProduct["Product ID"] || activeProduct["id"] || activeProduct["productId"]);
  const testUtr   = "TEST-UTR-" + Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMddHHmmss");

  const testPayload = {
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
    items:         [{ productId, quantity: 1 }],
    utr:           testUtr,
    paymentMethod: "UPI"
  };

  const orderResult = processOrderTransaction(ss, testPayload);

  if (!orderResult || !orderResult.success) {
    return {
      success: false,
      error:   orderResult ? (orderResult.error || orderResult.message) : "Failed to place sample order",
      step:    orderResult ? orderResult.step : "processOrderTransaction"
    };
  }

  // Verification checks
  const custSheet  = getSheetSafely(ss, TABS.CUSTOMERS,   ["Customer"]);
  const ordSheet   = getSheetSafely(ss, TABS.ORDERS,      ["Order"]);
  const itemSheet  = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);

  const customers = getSheetRowsAsJSON(custSheet);
  const orders    = getSheetRowsAsJSON(ordSheet);
  const items     = getSheetRowsAsJSON(itemSheet);

  const testCustomer   = customers.find(c => String(c["Mobile"]).trim() === "9999999999");
  const testOrder      = orders.find(o => o["Order ID"] === orderResult.orderId);
  const testOrderItem  = items.find(i  => i["Order ID"] === orderResult.orderId);

  const verification = {
    success:              true,
    orderId:              orderResult.orderId,
    customerFound:        !!testCustomer,
    customerId:           testCustomer ? testCustomer["Customer ID"] : null,
    orderFound:           !!testOrder,
    orderItemFound:       !!testOrderItem,
    orderIdMatches:       !!(testOrder && testOrderItem && testOrder["Order ID"] === testOrderItem["Order ID"]),
    paymentMethodStored:  testOrder ? testOrder["Payment Method"]      : null,
    paymentStatusStored:  testOrder ? testOrder["Payment Status"]      : null,
    utrStored:            testOrder ? testOrder["UTR"]                 : null,
    upiIdStored:          testOrder ? testOrder["UPI ID"]              : null,
    paymentSubmittedAt:   testOrder ? testOrder["Payment Submitted At"] : null,
    productIdUsed:        productId,
    productNameUsed:      activeProduct["Product Name"] || activeProduct["name"],
    subtotal:             orderResult.subtotal,
    gst:                  orderResult.gst,
    shipping:             orderResult.shipping,
    grandTotal:           orderResult.grandTotal,
    emailSent:            orderResult.emailSent
  };

  Logger.log(JSON.stringify(verification, null, 2));
  return verification;
}

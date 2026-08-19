/**
 * Google Apps Script for Kayal Samayal Database Integration
 * Spreadsheet ID: 1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc
 */

const SPREADSHEET_ID = "1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc";

// Define Tab Name mappings
const TABS = {
  PRODUCTS: "products_export", // Matches the synchronization output
  ORDERS: "Orders",
  ORDER_ITEMS: "Order Items",
  CUSTOMERS: "Customers",
  REVIEWS: "Reviews",
  SETTINGS: "Settings"
};

/**
 * Administrative Setup Function
 * Run this function from the Apps Script editor to initialize missing sheets and columns.
 */
/**
 * Administrative Setup Function
 * Run this function from the Apps Script editor to initialize missing sheets and columns.
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const spreadsheetName = ss.getName();
  
  const existingSheets = [];
  const createdSheets = [];
  const skippedSheets = [];
  
  // Get all existing sheet names
  const sheets = ss.getSheets();
  sheets.forEach(s => existingSheets.push(s.getName()));
  
  const sheetDefinitions = [
    {
      name: TABS.CUSTOMERS,
      headers: ["Customer ID", "Full Name", "Mobile", "Email", "Shipping Address", "City/Town", "State", "Pincode", "Created At", "Updated At"]
    },
    {
      name: TABS.ORDERS,
      headers: [
        "Order ID", "Customer ID", "Order Date", "Full Name", "Mobile", "Email", 
        "Shipping Address", "City/Town", "State", "Pincode", "Order Notes", 
        "Subtotal", "GST", "Shipping", "Discount", "Grand Total", 
        "Payment Status", "Order Status", "Created At"
      ]
    },
    {
      name: TABS.ORDER_ITEMS,
      headers: ["Order Item ID", "Order ID", "Product ID", "Product Name", "Tier", "Quantity", "Unit Price", "GST %", "GST Amount", "Line Total", "Created At"]
    },
    {
      name: TABS.REVIEWS,
      headers: ["Review ID", "Product ID", "Product Name", "Customer Name", "Rating", "Review", "Approved", "Created At"]
    },
    {
      name: TABS.SETTINGS,
      headers: ["Key", "Value", "Description", "Updated At"]
    },
    {
      name: "API Logs",
      headers: ["Log ID", "Timestamp", "Action", "Method", "Order ID", "Customer ID", "Status", "Request Data", "Response Data", "Error Message"]
    },
    {
      name: "Inventory Logs",
      headers: ["Log ID", "Timestamp", "Product ID", "Product Name", "Action", "Quantity Before", "Quantity Changed", "Quantity After", "Reference ID", "Notes"]
    },
    {
      name: "Payments",
      headers: ["Payment ID", "Order ID", "Payment Date", "Payment Method", "Transaction ID", "Amount", "Payment Status", "Notes"]
    },
    {
      name: "Shipments",
      headers: ["Shipment ID", "Order ID", "Courier", "Tracking Number", "Shipment Status", "Shipped Date", "Delivered Date", "Notes"]
    }
  ];

  Logger.log("Starting Database Setup...");
  
  sheetDefinitions.forEach(def => {
    let sheet = ss.getSheetByName(def.name);
    if (!sheet) {
      sheet = ss.insertSheet(def.name);
      sheet.appendRow(def.headers);
      
      // Freeze Row 1
      sheet.setFrozenRows(1);
      
      // Bold Row 1 & Background Color
      const headerRange = sheet.getRange(1, 1, 1, def.headers.length);
      headerRange.setFontWeight("bold").setBackground("#F4EBE1");
      
      // Auto-resize columns
      for (let i = 1; i <= def.headers.length; i++) {
        sheet.autoResizeColumn(i);
      }
      
      createdSheets.push(def.name);
      Logger.log("Created sheet: " + def.name);
    } else {
      skippedSheets.push(def.name);
      Logger.log("Sheet already exists: " + def.name + ". Verifying headers...");
      
      const actualHeaders = sheet.getRange(1, 1, 1, def.headers.length).getValues()[0];
      const match = def.headers.every((h, i) => actualHeaders[i] === h);
      if (!match) {
        Logger.log("Headers mismatch on " + def.name + ". Overwriting headers line...");
        sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers]);
      }
      
      // Freeze Row 1 and bold headers
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, def.headers.length).setFontWeight("bold");
    }
  });

  // Seed default settings if empty
  const settingsSheet = ss.getSheetByName(TABS.SETTINGS);
  if (settingsSheet.getLastRow() <= 1) {
    const seedSettings = [
      ["business_name", "Kayal Samayal", "The name of the business", new Date()],
      ["whatsapp_number", "+91 9003860616", "Direct customer care line", new Date()],
      ["shipping_charge", "60", "Flat shipping charge", new Date()],
      ["free_shipping_threshold", "500", "Cart value threshold for free shipping", new Date()],
      ["default_gst", "0.05", "Standard GST rate", new Date()]
    ];
    seedSettings.forEach(s => settingsSheet.appendRow(s));
    Logger.log("Seeded default settings.");
  }
  
  Logger.log("=========================================");
  Logger.log("DATABASE SYNC COMPLETE REPORT");
  Logger.log("=========================================");
  Logger.log("Spreadsheet Name: " + spreadsheetName);
  Logger.log("Existing Sheets: " + existingSheets.join(", "));
  Logger.log("Created Sheets: " + (createdSheets.length > 0 ? createdSheets.join(", ") : "None"));
  Logger.log("Skipped Sheets: " + skippedSheets.join(", "));
  Logger.log("=========================================");
  Logger.log("Setup complete!");
}

/**
 * Handle HTTP GET Requests
 */
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (action === "setup") {
      setupDatabaseSheets();
      return jsonResponse({ success: true, message: "Database sheets initialized successfully!" });
    }
    
    if (action === "health") {
      return jsonResponse({ success: true, message: "Kayal Samayal API is working", timestamp: new Date() });
    }
    
    if (action === "products") {
      const sheet = ss.getSheetByName(TABS.PRODUCTS);
      if (!sheet) {
        return jsonResponse({ success: false, error: "Products sheet not found: " + TABS.PRODUCTS });
      }
      const data = getSheetRowsAsJSON(sheet);
      return jsonResponse({ success: true, data: data });
    }
    
    if (action === "reviews") {
      const sheet = ss.getSheetByName(TABS.REVIEWS);
      if (!sheet) {
        return jsonResponse({ success: true, data: [] }); // Fallback gracefully if reviews sheet doesn't exist
      }
      const data = getSheetRowsAsJSON(sheet);
      // Return only approved / active reviews
      const filtered = data.filter(r => r["Active"] === true || String(r["Active"]).toLowerCase() === "true" || r["Active"] === "TRUE");
      return jsonResponse({ success: true, data: filtered });
    }
    
    if (action === "settings") {
      const sheet = ss.getSheetByName(TABS.SETTINGS);
      if (!sheet) {
        return jsonResponse({ success: true, data: {} });
      }
      const data = getSheetRowsAsJSON(sheet);
      const settingsMap = {};
      data.forEach(row => {
        if (row["Key"]) {
          settingsMap[row["Key"]] = row["Value"];
        }
      });
      return jsonResponse({ success: true, data: settingsMap });
    }
    
    if (action === "order") {
      const orderId = e.parameter.id;
      if (!orderId) {
        return jsonResponse({ success: false, error: "Order ID parameter is required" });
      }
      
      let ordersSheet = ss.getSheetByName(TABS.ORDERS);
      let itemsSheet = ss.getSheetByName(TABS.ORDER_ITEMS);
      let customersSheet = ss.getSheetByName(TABS.CUSTOMERS);
      
      if (!ordersSheet || !itemsSheet || !customersSheet) {
        setupDatabaseSheets();
        ordersSheet = ss.getSheetByName(TABS.ORDERS);
        itemsSheet = ss.getSheetByName(TABS.ORDER_ITEMS);
        customersSheet = ss.getSheetByName(TABS.CUSTOMERS);
      }
      
      if (!ordersSheet || !itemsSheet) {
        return jsonResponse({ success: false, error: "Sheet not found: Order database sheets could not be initialized." });
      }
      
      const orders = getSheetRowsAsJSON(ordersSheet);
      const order = orders.find(o => o["Order ID"] === orderId);
      
      if (!order) {
        return jsonResponse({ success: false, error: "Order not found" });
      }
      
      const allItems = getSheetRowsAsJSON(itemsSheet);
      const orderItems = allItems.filter(item => item["Order ID"] === orderId);
      
      let customer = null;
      if (customersSheet && order["Customer ID"]) {
        const customers = getSheetRowsAsJSON(customersSheet);
        customer = customers.find(c => c["Customer ID"] === order["Customer ID"]) || null;
      }
      
      return jsonResponse({
        success: true,
        data: {
          order: order,
          customer: customer,
          items: orderItems
        }
      });
    }
    
    return jsonResponse({ success: false, error: "Unknown action parameter" });
    
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Handle HTTP POST Requests
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (!action) {
      return jsonResponse({ success: false, error: "Missing action parameter" });
    }
    
    if (action === "createCustomer") {
      let customersSheet = ss.getSheetByName(TABS.CUSTOMERS);
      if (!customersSheet) {
        setupDatabaseSheets();
        customersSheet = ss.getSheetByName(TABS.CUSTOMERS);
      }
      if (!customersSheet) {
        return jsonResponse({ success: false, error: "Sheet not found: Customers database sheet not found." });
      }
      const customerId = findOrCreateCustomer(customersSheet, postData);
      return jsonResponse({ success: true, customerId: customerId });
    }
    
    if (action === "createOrder") {
      return processOrderTransaction(ss, postData);
    }
    
    if (action === "updateOrder") {
      let ordersSheet = ss.getSheetByName(TABS.ORDERS);
      if (!ordersSheet) {
        setupDatabaseSheets();
        ordersSheet = ss.getSheetByName(TABS.ORDERS);
      }
      if (!ordersSheet) {
        return jsonResponse({ success: false, error: "Sheet not found: Orders database sheet not found." });
      }
      return updateOrderStatus(ordersSheet, postData);
    }
    
    return jsonResponse({ success: false, error: "Unknown action payload" });
    
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

/**
 * Customer Find or Create Helper
 */
function findOrCreateCustomer(sheet, data) {
  const name = data.name || "Anonymous";
  const mobile = String(data.mobile || "").trim();
  const email = data.email || "";
  const address = data.address || "";
  const city = data.city || "";
  const state = data.state || "";
  const pincode = String(data.pincode || "").trim();
  
  const customers = getSheetRowsAsJSON(sheet);
  const existing = customers.find(c => String(c["Mobile"]).trim() === mobile);
  
  if (existing) {
    // Update customer details if relevant values are provided
    const rowIndex = customers.indexOf(existing) + 2; // +2 for header offset and 1-based indexing
    sheet.getRange(rowIndex, 2).setValue(name); // Full Name
    sheet.getRange(rowIndex, 4).setValue(email); // Email
    sheet.getRange(rowIndex, 5).setValue(address); // Shipping Address
    sheet.getRange(rowIndex, 6).setValue(city); // City/Town
    sheet.getRange(rowIndex, 7).setValue(state); // State
    sheet.getRange(rowIndex, 8).setValue(pincode); // Pincode
    sheet.getRange(rowIndex, 10).setValue(new Date()); // Updated At
    
    return existing["Customer ID"];
  }
  
  // Create unique CUS ID
  const dateStr = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd");
  const count = customers.length + 1;
  const countStr = String(count).padStart(4, "0");
  const customerId = "CUS-" + dateStr + "-" + countStr;
  
  sheet.appendRow([
    customerId,
    name,
    mobile,
    email,
    address,
    city,
    state,
    pincode,
    new Date(), // Created At
    new Date()  // Updated At
  ]);
  
  return customerId;
}

/**
 * Handle Order Transactions with Stock Deductions and Pricing Validation
 */
function processOrderTransaction(ss, data) {
  let productsSheet = ss.getSheetByName(TABS.PRODUCTS);
  let ordersSheet = ss.getSheetByName(TABS.ORDERS);
  let itemsSheet = ss.getSheetByName(TABS.ORDER_ITEMS);
  let customersSheet = ss.getSheetByName(TABS.CUSTOMERS);
  
  if (!productsSheet || !ordersSheet || !itemsSheet || !customersSheet) {
    setupDatabaseSheets();
    productsSheet = ss.getSheetByName(TABS.PRODUCTS);
    ordersSheet = ss.getSheetByName(TABS.ORDERS);
    itemsSheet = ss.getSheetByName(TABS.ORDER_ITEMS);
    customersSheet = ss.getSheetByName(TABS.CUSTOMERS);
  }
  
  if (!productsSheet || !ordersSheet || !itemsSheet || !customersSheet) {
    return jsonResponse({ success: false, error: "Sheet not found: Required database sheets could not be initialized." });
  }
  
  const customerInput = data.customer;
  const itemsInput = data.items;
  
  if (!customerInput || !customerInput.name || !customerInput.mobile) {
    return jsonResponse({ success: false, error: "Invalid checkout request: Customer name and mobile required." });
  }
  
  if (!itemsInput || !Array.isArray(itemsInput) || itemsInput.length === 0) {
    return jsonResponse({ success: false, error: "Invalid checkout request: Cart is empty." });
  }

  // Load Products Catalog
  const products = getSheetRowsAsJSON(productsSheet);
  
  // ── 1. TRANSACTION VALIDATION ───────────────────────────────────────────
  const validatedItems = [];
  let subtotal = 0;
  
  for (let i = 0; i < itemsInput.length; i++) {
    const item = itemsInput[i];
    const product = products.find(p => p["Product ID"] === item.productId);
    
    if (!product) {
      return jsonResponse({ success: false, error: "Product not found: " + item.productId });
    }
    
    const active = product["Active"] === true || String(product["Active"]).toLowerCase() === "true" || product["Active"] === "TRUE";
    if (!active) {
      return jsonResponse({ success: false, error: "Product is currently inactive: " + product["Product Name"] });
    }
    
    const requestedQty = Number(item.quantity || 1);
    const availableStock = Number(product["Stock"] || 0);
    if (requestedQty > availableStock) {
      return jsonResponse({ success: false, error: "Insufficient stock for product: " + product["Product Name"] + ". Available: " + availableStock });
    }
    
    const unitPrice = Number(product["Price"] || 0);
    const gstRate = Number(product["GST"] || 0);
    const lineTotal = unitPrice * requestedQty;
    
    subtotal += lineTotal;
    
    validatedItems.push({
      product: product,
      quantity: requestedQty,
      unitPrice: unitPrice,
      gstRate: gstRate,
      lineTotal: lineTotal
    });
  }
  
  // Calculate Totals authoritative
  const gstTotal = validatedItems.reduce((sum, item) => sum + (item.lineTotal * item.gstRate), 0);
  
  // Settings lookups
  let shippingCharge = 60;
  let freeShippingThreshold = 500;
  const settingsSheet = ss.getSheetByName(TABS.SETTINGS);
  if (settingsSheet) {
    const settings = getSheetRowsAsJSON(settingsSheet);
    const shipVal = settings.find(s => s["Key"] === "shipping_charge");
    if (shipVal) shippingCharge = Number(shipVal["Value"]);
    const threshVal = settings.find(s => s["Key"] === "free_shipping_threshold");
    if (threshVal) freeShippingThreshold = Number(threshVal["Value"]);
  }
  
  const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCharge;
  const discount = 0; // Standard flow
  const grandTotal = subtotal + shipping + gstTotal - discount;
  
  // ── 2. TRANSACTION EXECUTION ───────────────────────────────────────────
  // Find or Create Customer
  const customerId = findOrCreateCustomer(customersSheet, customerInput);
  
  // Create Unique Order ID
  const orders = getSheetRowsAsJSON(ordersSheet);
  const dateStr = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd");
  const orderCount = orders.length + 1;
  const orderCountStr = String(orderCount).padStart(4, "0");
  const orderId = "KYS-" + dateStr + "-" + orderCountStr;
  
  // Write Order row
  ordersSheet.appendRow([
    orderId,
    customerId,
    new Date(), // Order Date
    customerInput.name, // Full Name
    customerInput.mobile,
    customerInput.email || "",
    customerInput.address || "",
    customerInput.city || "",
    customerInput.state || "",
    customerInput.pincode || "",
    customerInput.notes || "",
    subtotal,
    gstTotal, // GST (index 13)
    shipping, // Shipping (index 14)
    discount,
    grandTotal,
    "Pending", // Payment Status
    "Pending", // Order Status
    new Date() // Created At
  ]);
  
  // Write Order Items and Update Stocks
  validatedItems.forEach((item, index) => {
    // Generate Order Item ID
    const orderItemId = orderId + "-ITEM-" + String(index + 1).padStart(3, "0");
    
    itemsSheet.appendRow([
      orderItemId, // Order Item ID
      orderId, // Order ID
      item.product["Product ID"],
      item.product["Product Name"],
      item.product["Tier"],
      item.quantity,
      item.unitPrice,
      item.gstRate, // GST %
      item.lineTotal * item.gstRate, // GST Amount
      item.lineTotal,
      new Date() // Created At
    ]);
    
    // Update Stock in sheet
    const pIndex = products.indexOf(item.product) + 2; // +2 for header and 1-based indexing
    const newStock = Number(item.product["Stock"]) - item.quantity;
    
    // Find column position of Stock dynamically
    const headers = productsSheet.getRange(1, 1, 1, productsSheet.getLastColumn()).getValues()[0];
    const stockColIndex = headers.indexOf("Stock") + 1;
    if (stockColIndex > 0) {
      productsSheet.getRange(pIndex, stockColIndex).setValue(newStock);
    }
  });
  
  return jsonResponse({
    success: true,
    orderId: orderId,
    message: "Order placed successfully",
    data: {
      subtotal: subtotal,
      shipping: shipping,
      gst: gstTotal,
      discount: discount,
      grandTotal: grandTotal
    }
  });
}

/**
 * Update Order status
 */
function updateOrderStatus(sheet, data) {
  const orderId = data.orderId;
  const paymentStatus = data.paymentStatus;
  const orderStatus = data.orderStatus;
  
  if (!orderId) {
    return jsonResponse({ success: false, error: "Order ID is required" });
  }
  
  const orders = getSheetRowsAsJSON(sheet);
  const order = orders.find(o => o["Order ID"] === orderId);
  
  if (!order) {
    return jsonResponse({ success: false, error: "Order ID not found: " + orderId });
  }
  
  const rowIndex = orders.indexOf(order) + 2;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  if (paymentStatus) {
    const colIdx = headers.indexOf("Payment Status") + 1;
    if (colIdx > 0) sheet.getRange(rowIndex, colIdx).setValue(paymentStatus);
  }
  
  if (orderStatus) {
    const colIdx = headers.indexOf("Order Status") + 1;
    if (colIdx > 0) sheet.getRange(rowIndex, colIdx).setValue(orderStatus);
  }
  
  return jsonResponse({ success: true, message: "Order updated successfully" });
}

/**
 * Mappings Sheet rows to JSON helper
 */
function getSheetRowsAsJSON(sheet) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1) return [];
  
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  
  return values.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

/**
 * Return application/json TextOutput response
 */
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

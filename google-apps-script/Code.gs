/**
 * Google Apps Script for Kayal Samayal Database Integration
 * Spreadsheet ID: 1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc
 */

const SPREADSHEET_ID = "1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc";

// Exact Tab Name Mappings (Per Requirements)
const TABS = {
  PRODUCTS: "Products",
  CUSTOMERS: "Customers",
  ORDERS: "Orders",
  ORDER_ITEMS: "Order Items",
  REVIEWS: "Reviews",
  SETTINGS: "Settings"
};

/**
 * Safe Sheet Lookup Helper
 * Checks primary name first, then safe alternative names, to prevent missing existing tabs.
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
 * Administrative Setup Function
 * Checks existing sheets and initializes any missing sheets without duplicating.
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const spreadsheetName = ss.getName();
  
  const existingSheets = [];
  const createdSheets = [];
  const skippedSheets = [];
  
  const sheets = ss.getSheets();
  sheets.forEach(s => existingSheets.push(s.getName()));
  
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
        "Payment Status", "Order Status", "Created At"
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

  // Seed default settings if empty
  const settingsSheet = getSheetSafely(ss, TABS.SETTINGS);
  if (settingsSheet && settingsSheet.getLastRow() <= 1) {
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
}

/**
 * Handle HTTP GET Requests
 */
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
      if (!sheet) {
        return jsonResponse({ success: true, data: [] });
      }
      const data = getSheetRowsAsJSON(sheet);
      const filtered = data.filter(r => r["Active"] === true || String(r["Active"]).toLowerCase() === "true" || r["Active"] === "TRUE");
      return jsonResponse({ success: true, data: filtered });
    }
    
    if (action === "settings") {
      const sheet = getSheetSafely(ss, TABS.SETTINGS);
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
        return jsonResponse({ success: false, error: "Order ID parameter is required", step: "Parameter Validation" });
      }
      
      const ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      const itemsSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);
      const customersSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
      
      if (!ordersSheet || !itemsSheet) {
        return jsonResponse({ success: false, error: "Sheet not found: Orders or Order Items sheet missing.", step: "Orders Lookup" });
      }
      
      const orders = getSheetRowsAsJSON(ordersSheet);
      const order = orders.find(o => o["Order ID"] === orderId);
      
      if (!order) {
        return jsonResponse({ success: false, error: "Order not found", step: "Order Search" });
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
    
    return jsonResponse({ success: false, error: "Unknown action parameter", step: "Action Routing" });
    
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString(), step: "doGet Exception" });
  }
}

/**
 * Handle HTTP POST Requests
 */
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
        return jsonResponse({ success: false, error: "Sheet not found: Customers database sheet not found.", step: "Customers Sheet Lookup" });
      }
      const customerId = findOrCreateCustomer(customersSheet, postData);
      return jsonResponse({ success: true, customerId: customerId });
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
        return jsonResponse({ success: false, error: "Sheet not found: Orders database sheet not found.", step: "Orders Sheet Lookup" });
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
    new Date(),
    new Date()
  ]);
  
  return customerId;
}

/**
 * Handle Order Transactions with Stock Deductions and Pricing Validation
 */
function processOrderTransaction(ss, data) {
  try {
    let productsSheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
    let ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
    let itemsSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);
    let customersSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);

    if (!productsSheet || !ordersSheet || !itemsSheet || !customersSheet) {
      setupDatabaseSheets();
      productsSheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
      ordersSheet = getSheetSafely(ss, TABS.ORDERS, ["Order", "Orders Sheet"]);
      itemsSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);
      customersSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer", "Customers Sheet"]);
    }

    if (!productsSheet) {
      return { success: false, error: "Sheet not found", step: "Products" };
    }
    if (!ordersSheet) {
      return { success: false, error: "Sheet not found", step: "Orders" };
    }
    if (!itemsSheet) {
      return { success: false, error: "Sheet not found", step: "Order Items" };
    }
    if (!customersSheet) {
      return { success: false, error: "Sheet not found", step: "Customers" };
    }

    const customerInput = data.customer;
    const itemsInput = data.items;

    if (!customerInput || !customerInput.name || !customerInput.mobile) {
      return { success: false, error: "Customer name and mobile are required", step: "Customer Validation" };
    }

    if (!itemsInput || !Array.isArray(itemsInput) || itemsInput.length === 0) {
      return { success: false, error: "Cart is empty", step: "Items Validation" };
    }

    const products = getSheetRowsAsJSON(productsSheet);

    const validatedItems = [];
    let subtotal = 0;

    for (let i = 0; i < itemsInput.length; i++) {
      const item = itemsInput[i];
      const product = products.find(p => String(p["Product ID"] || p["id"] || p["productId"]) === String(item.productId));

      if (!product) {
        return { success: false, error: "Product not found: " + item.productId, step: "Product Lookup" };
      }

      const activeVal = product["Active"] ?? product["active"];
      const active = activeVal === true || String(activeVal).toLowerCase() === "true" || activeVal === 1 || String(activeVal).toLowerCase() === "yes";

      if (!active) {
        return { success: false, error: "Product is currently inactive: " + (product["Product Name"] || product["name"]), step: "Product Active Check" };
      }

      const requestedQty = Number(item.quantity || 1);
      const availableStock = Number(product["Stock"] ?? product["stock"] ?? 999);
      if (requestedQty > availableStock) {
        return { success: false, error: "Insufficient stock for product: " + (product["Product Name"] || product["name"]) + ". Available: " + availableStock, step: "Stock Check" };
      }

      const unitPrice = Number(product["Price"] ?? product["price"] ?? 0);
      const gstRate = Number(product["GST"] ?? product["gst"] ?? 0);
      const lineTotal = unitPrice * requestedQty;

      subtotal += lineTotal;

      validatedItems.push({
        product: product,
        productId: String(product["Product ID"] || product["id"] || item.productId),
        productName: String(product["Product Name"] || product["name"] || ""),
        tier: String(product["Tier"] || product["tier"] || "regular"),
        quantity: requestedQty,
        unitPrice: unitPrice,
        gstRate: gstRate,
        lineTotal: lineTotal
      });
    }

    // Calculate GST Total
    const gstTotal = validatedItems.reduce((sum, item) => sum + (item.lineTotal * item.gstRate), 0);

    // Calculate Shipping & Discount
    let shippingCharge = 60;
    let freeShippingThreshold = 500;
    const settingsSheet = getSheetSafely(ss, TABS.SETTINGS);
    if (settingsSheet) {
      try {
        const settings = getSheetRowsAsJSON(settingsSheet);
        const shipVal = settings.find(s => s["Key"] === "shipping_charge");
        if (shipVal && shipVal["Value"] !== undefined && shipVal["Value"] !== "") shippingCharge = Number(shipVal["Value"]);
        const threshVal = settings.find(s => s["Key"] === "free_shipping_threshold");
        if (threshVal && threshVal["Value"] !== undefined && threshVal["Value"] !== "") freeShippingThreshold = Number(threshVal["Value"]);
      } catch (e) {}
    }

    const shipping = subtotal >= freeShippingThreshold ? 0 : shippingCharge;
    const discount = 0;
    const grandTotal = subtotal + shipping + gstTotal - discount;

    // Find or Create Customer
    const customerId = findOrCreateCustomer(customersSheet, customerInput);

    // Create Order ID
    const orders = getSheetRowsAsJSON(ordersSheet);
    const dateStr = Utilities.formatDate(new Date(), "GMT+5:30", "yyyyMMdd");
    const orderCount = orders.length + 1;
    const orderCountStr = String(orderCount).padStart(4, "0");
    const orderId = "KYS-" + dateStr + "-" + orderCountStr;

    // Append Order Row
    ordersSheet.appendRow([
      orderId,
      customerId,
      new Date(),
      customerInput.name,
      customerInput.mobile,
      customerInput.email || "",
      customerInput.address || "",
      customerInput.city || "",
      customerInput.state || "",
      customerInput.pincode || "",
      customerInput.notes || "",
      subtotal,
      gstTotal,
      shipping,
      discount,
      grandTotal,
      "Pending",
      "Pending",
      new Date()
    ]);

    // Append Order Items & Update Stock
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

      const pIndex = products.indexOf(item.product) + 2;
      const currentStock = Number(item.product["Stock"] ?? item.product["stock"] ?? 0);
      const newStock = Math.max(0, currentStock - item.quantity);

      const headers = productsSheet.getRange(1, 1, 1, productsSheet.getLastColumn()).getValues()[0];
      const stockColIndex = headers.findIndex(h => String(h).trim().toLowerCase() === "stock") + 1;
      if (stockColIndex > 0) {
        productsSheet.getRange(pIndex, stockColIndex).setValue(newStock);
      }
    });

    return {
      success: true,
      orderId: orderId,
      customerId: customerId,
      subtotal: subtotal,
      shipping: shipping,
      discount: discount,
      gst: gstTotal,
      grandTotal: grandTotal,
      paymentStatus: "Pending",
      orderStatus: "Pending",
      items: validatedItems.map(i => ({
        productId: i.productId,
        productName: i.productName,
        tier: i.tier,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        total: i.lineTotal
      })),
      message: "Order placed successfully"
    };

  } catch (err) {
    return {
      success: false,
      error: err.toString(),
      step: "processOrderTransaction Execution"
    };
  }
}

/**
 * Update Order status
 */
function updateOrderStatus(sheet, data) {
  const orderId = data.orderId;
  const paymentStatus = data.paymentStatus;
  const orderStatus = data.orderStatus;
  
  if (!orderId) {
    return { success: false, error: "Order ID is required", step: "Order ID Validation" };
  }
  
  const orders = getSheetRowsAsJSON(sheet);
  const order = orders.find(o => o["Order ID"] === orderId);
  
  if (!order) {
    return { success: false, error: "Order ID not found: " + orderId, step: "Order Lookup" };
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
  
  return { success: true, message: "Order updated successfully" };
}

/**
 * Database Diagnostics Function
 */
function testDatabaseSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const name = ss.getName();

  const prodSheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
  const custSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer"]);
  const ordSheet = getSheetSafely(ss, TABS.ORDERS, ["Order"]);
  const itemSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);

  const report = {
    spreadsheetName: name,
    productsSheetFound: !!prodSheet,
    productsSheetName: prodSheet ? prodSheet.getName() : null,
    productsRows: prodSheet ? Math.max(0, prodSheet.getLastRow() - 1) : 0,

    customersSheetFound: !!custSheet,
    customersSheetName: custSheet ? custSheet.getName() : null,
    customersRows: custSheet ? Math.max(0, custSheet.getLastRow() - 1) : 0,

    ordersSheetFound: !!ordSheet,
    ordersSheetName: ordSheet ? ordSheet.getName() : null,
    ordersRows: ordSheet ? Math.max(0, ordSheet.getLastRow() - 1) : 0,

    orderItemsSheetFound: !!itemSheet,
    orderItemsSheetName: itemSheet ? itemSheet.getName() : null,
    orderItemsRows: itemSheet ? Math.max(0, itemSheet.getLastRow() - 1) : 0,
  };

  Logger.log(JSON.stringify(report, null, 2));
  return report;
}

/**
 * Automated Sample Order Creation & Verification Test
 */
function testSampleOrder() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  setupDatabaseSheets();

  const prodSheet = getSheetSafely(ss, TABS.PRODUCTS, ["products_export", "products"]);
  if (!prodSheet) {
    return { success: false, error: "Products sheet not found", step: "Products Lookup" };
  }

  const products = getSheetRowsAsJSON(prodSheet);
  const activeProduct = products.find(p => {
    const act = p["Active"] ?? p["active"];
    return act === true || String(act).toLowerCase() === "true" || act === 1 || String(act).toLowerCase() === "yes";
  });

  if (!activeProduct) {
    return { success: false, error: "No active product found in Products sheet", step: "Product Selection" };
  }

  const productId = String(activeProduct["Product ID"] || activeProduct["id"] || activeProduct["productId"]);

  const testPayload = {
    action: "createOrder",
    customer: {
      name: "Kayal Samayal API Test",
      mobile: "9999999999",
      email: "test@kayalsamayal.test",
      address: "API Test Address",
      city: "Kumbakonam",
      state: "Tamil Nadu",
      pincode: "612001",
      notes: "AUTOMATED API TEST ORDER"
    },
    items: [
      {
        productId: productId,
        quantity: 1
      }
    ]
  };

  const orderResult = processOrderTransaction(ss, testPayload);
  
  if (!orderResult || !orderResult.success) {
    return {
      success: false,
      error: orderResult ? (orderResult.error || orderResult.message) : "Failed to place sample order",
      step: orderResult ? orderResult.step : "processOrderTransaction"
    };
  }

  // Verification checks
  const custSheet = getSheetSafely(ss, TABS.CUSTOMERS, ["Customer"]);
  const ordSheet = getSheetSafely(ss, TABS.ORDERS, ["Order"]);
  const itemSheet = getSheetSafely(ss, TABS.ORDER_ITEMS, ["OrderItems", "Order_Items"]);

  const customers = getSheetRowsAsJSON(custSheet);
  const orders = getSheetRowsAsJSON(ordSheet);
  const items = getSheetRowsAsJSON(itemSheet);

  const testCustomer = customers.find(c => String(c["Mobile"]).trim() === "9999999999");
  const testOrder = orders.find(o => o["Order ID"] === orderResult.orderId);
  const testOrderItem = items.find(i => i["Order ID"] === orderResult.orderId);

  const verification = {
    success: true,
    orderId: orderResult.orderId,
    customerFound: !!testCustomer,
    customerId: testCustomer ? testCustomer["Customer ID"] : null,
    orderFound: !!testOrder,
    orderItemFound: !!testOrderItem,
    orderIdMatches: testOrder && testOrderItem ? (testOrder["Order ID"] === testOrderItem["Order ID"]) : false,
    productIdExistsInProducts: !!activeProduct,
    productIdUsed: productId,
    productNameUsed: activeProduct["Product Name"] || activeProduct["name"],
    subtotal: orderResult.subtotal,
    gst: orderResult.gst,
    shipping: orderResult.shipping,
    discount: orderResult.discount,
    grandTotal: orderResult.grandTotal
  };

  Logger.log(JSON.stringify(verification, null, 2));
  return verification;
}

/**
 * Mapping Sheet rows to JSON helper
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

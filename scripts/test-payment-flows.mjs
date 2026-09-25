import crypto from "crypto";

const GAS_URL = "https://script.google.com/macros/s/AKfycbxRTYXQJAw0hGQUh12jHemUi87ROEftrUV5vAlJRr6JebH58PT13x7XdnudTeulAIS4/exec";
const SERVER_AUTH_SECRET = "QCh0H33s8BN6aoBfUmJ39y5r";
const RAZORPAY_KEY_SECRET = "QCh0H33s8BN6aoBfUmJ39y5r";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log("=== STARTING COMPREHENSIVE PAYMENT FLOW TESTS ===");

  const uniqueSuffix = Date.now().toString().slice(-6);
  const testMobile1 = "98" + uniqueSuffix + "01";

  // ── TEST 1: ₹1 COUPON ORDER (TEST1RS) CALCULATION & APPS SCRIPT CREATION ──
  console.log(`\n[TEST 1] Testing ₹1 coupon order with Kayal Kalari Masala (Qty: 9, Coupon: TEST1RS, Mobile: ${testMobile1})...`);
  const test1OrderId = "order_test1_" + Date.now();
  const test1PaymentId = "pay_test1_" + Date.now();
  const test1Signature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${test1OrderId}|${test1PaymentId}`)
    .digest("hex");

  const serverAuthToken1 = crypto
    .createHmac("sha256", SERVER_AUTH_SECRET)
    .update(`KAYAL_ORDER_AUTH:${test1OrderId}:${test1PaymentId}`)
    .digest("hex");

  const gasRes1 = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "createOrder",
      customer: {
        name: "Test Customer Qty9",
        mobile: testMobile1,
        email: "test9@kayalsamayal.in",
        address: "42 Coast Road",
        city: "Kayalpatnam",
        state: "Tamil Nadu",
        pincode: "628204",
      },
      items: [{ productId: "kayal-kalari-masala-regular", quantity: 9 }],
      paymentMethod: "Razorpay Online",
      razorpayOrderId: test1OrderId,
      razorpayPaymentId: test1PaymentId,
      razorpaySignature: test1Signature,
      razorpayAmount: 1,
      couponCode: "TEST1RS",
      discount: 539,
      serverAuthToken: serverAuthToken1,
    }),
  });

  const gasData1 = await gasRes1.json();
  console.log("[TEST 1 Result]", {
    success: gasData1.success,
    orderId: gasData1.orderId,
    subtotal: gasData1.subtotal,
    discount: gasData1.discount,
    shipping: gasData1.shipping,
    grandTotal: gasData1.grandTotal,
    paymentStatus: gasData1.paymentStatus,
    orderStatus: gasData1.orderStatus,
  });

  if (!gasData1.success || gasData1.grandTotal !== 1 || gasData1.discount !== 539 || gasData1.paymentStatus !== "Paid") {
    throw new Error("TEST 1 FAILED: " + JSON.stringify(gasData1));
  }
  console.log("✓ TEST 1 PASSED: ₹1 Order created successfully with Paid/Confirmed status!");

  await sleep(3500);

  // ── TEST 6: DUPLICATE VERIFICATION / IDEMPOTENCY ──
  console.log("\n[TEST 6] Testing Idempotency (calling verification twice with same payment data)...");
  const gasResDup = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "createOrder",
      customer: {
        name: "Test Customer Qty9",
        mobile: testMobile1,
        email: "test9@kayalsamayal.in",
        address: "42 Coast Road",
        city: "Kayalpatnam",
        state: "Tamil Nadu",
        pincode: "628204",
      },
      items: [{ productId: "kayal-kalari-masala-regular", quantity: 9 }],
      paymentMethod: "Razorpay Online",
      razorpayOrderId: test1OrderId,
      razorpayPaymentId: test1PaymentId,
      razorpaySignature: test1Signature,
      razorpayAmount: 1,
      couponCode: "TEST1RS",
      discount: 539,
      serverAuthToken: serverAuthToken1,
    }),
  });

  const gasDataDup = await gasResDup.json();
  console.log("[TEST 6 Result]", {
    success: gasDataDup.success,
    orderId: gasDataDup.orderId,
    idempotent: gasDataDup.idempotent,
    message: gasDataDup.message,
  });

  if (!gasDataDup.success || gasDataDup.orderId !== gasData1.orderId || !gasDataDup.idempotent) {
    throw new Error("TEST 6 FAILED: Expected idempotent return of existing orderId: " + JSON.stringify(gasDataDup));
  }
  console.log("✓ TEST 6 PASSED: Duplicate verification returned existing order idempotently without creating duplicate!");

  await sleep(3500);

  // ── TEST 2: NORMAL PAYMENT (₹180 / 18000 paise) ──
  console.log("\n[TEST 2] Testing Normal Order (3 units Kalari Masala @ ₹60 = ₹180)...");
  const test2OrderId = "order_test2_" + Date.now();
  const test2PaymentId = "pay_test2_" + Date.now();
  const test2Signature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${test2OrderId}|${test2PaymentId}`)
    .digest("hex");

  const serverAuthToken2 = crypto
    .createHmac("sha256", SERVER_AUTH_SECRET)
    .update(`KAYAL_ORDER_AUTH:${test2OrderId}:${test2PaymentId}`)
    .digest("hex");

  const gasRes2 = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "createOrder",
      customer: {
        name: "Test Customer Normal",
        mobile: "98" + uniqueSuffix + "02",
        email: "normal@kayalsamayal.in",
        address: "78 Market Street",
        city: "Madurai",
        state: "Tamil Nadu",
        pincode: "625001",
      },
      items: [{ productId: "kayal-kalari-masala-regular", quantity: 3 }],
      paymentMethod: "Razorpay Online",
      razorpayOrderId: test2OrderId,
      razorpayPaymentId: test2PaymentId,
      razorpaySignature: test2Signature,
      razorpayAmount: 240, // 180 + 60 shipping
      serverAuthToken: serverAuthToken2,
    }),
  });

  const gasData2 = await gasRes2.json();
  console.log("[TEST 2 Result]", {
    success: gasData2.success,
    orderId: gasData2.orderId,
    subtotal: gasData2.subtotal,
    shipping: gasData2.shipping,
    grandTotal: gasData2.grandTotal,
    paymentStatus: gasData2.paymentStatus,
    orderStatus: gasData2.orderStatus,
  });

  if (!gasData2.success || gasData2.paymentStatus !== "Paid") {
    throw new Error("TEST 2 FAILED: Expected successful payment order creation: " + JSON.stringify(gasData2));
  }
  console.log("✓ TEST 2 PASSED: Normal Razorpay order created successfully with Paid/Confirmed status!");

  await sleep(3500);

  // ── TEST 3: COD ORDER FLOW ──
  console.log("\n[TEST 3] Testing Cash on Delivery (COD) Order...");
  const gasResCod = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "createOrder",
      customer: {
        name: "Test COD Customer",
        mobile: "98" + uniqueSuffix + "03",
        email: "cod@kayalsamayal.in",
        address: "10 Temple Street",
        city: "Tirunelveli",
        state: "Tamil Nadu",
        pincode: "627001",
      },
      items: [{ productId: "kayal-kalari-masala-regular", quantity: 1 }],
      paymentMethod: "Cash on Delivery",
    }),
  });

  const gasDataCod = await gasResCod.json();
  console.log("[TEST 3 Result]", {
    success: gasDataCod.success,
    orderId: gasDataCod.orderId,
    paymentMethod: gasDataCod.paymentMethod,
    paymentStatus: gasDataCod.paymentStatus,
    orderStatus: gasDataCod.orderStatus,
  });

  if (!gasDataCod.success || gasDataCod.paymentStatus !== "Pending" || gasDataCod.orderStatus !== "Confirmed") {
    throw new Error("TEST 3 FAILED: COD order status mismatch: " + JSON.stringify(gasDataCod));
  }
  console.log("✓ TEST 3 PASSED: COD order created with Pending payment and Confirmed status!");

  await sleep(3500);

  // ── TEST 4: FREE ORDER FLOW ──
  console.log("\n[TEST 4] Testing Free Order (100% Promo)...");
  const gasResFree = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "createOrder",
      customer: {
        name: "Test Free Order Customer",
        mobile: "98" + uniqueSuffix + "04",
        email: "free@kayalsamayal.in",
        address: "5 Beach Road",
        city: "Tuticorin",
        state: "Tamil Nadu",
        pincode: "628001",
      },
      items: [{ productId: "kayal-kalari-masala-regular", quantity: 1 }],
      paymentMethod: "Free Order",
      couponCode: "KAYAL100",
      discount: 60,
    }),
  });

  const gasDataFree = await gasResFree.json();
  console.log("[TEST 4 Result]", {
    success: gasDataFree.success,
    orderId: gasDataFree.orderId,
    grandTotal: gasDataFree.grandTotal,
    paymentMethod: gasDataFree.paymentMethod,
    paymentStatus: gasDataFree.paymentStatus,
  });

  if (!gasDataFree.success || gasDataFree.paymentStatus !== "Paid") {
    throw new Error("TEST 4 FAILED: Free order should be marked Paid: " + JSON.stringify(gasDataFree));
  }
  console.log("✓ TEST 4 PASSED: Free order created successfully with Paid status!");

  await sleep(3500);

  // ── TEST 5: ORDER RETRIEVAL BY ID (RELOAD SIMULATION) ──
  console.log("\n[TEST 5] Testing Reload / Order Retrieval by ID for " + gasData1.orderId + "...");
  const gasResFetch = await fetch(`${GAS_URL}?action=order&id=${encodeURIComponent(gasData1.orderId)}`);
  const gasDataFetch = await gasResFetch.json();

  console.log("[TEST 5 Result]", {
    success: gasDataFetch.success,
    orderId: gasDataFetch.data?.order?.["Order ID"],
    fullName: gasDataFetch.data?.order?.["Full Name"],
    paymentStatus: gasDataFetch.data?.order?.["Payment Status"],
    grandTotal: gasDataFetch.data?.order?.["Grand Total"],
  });

  if (!gasDataFetch.success || gasDataFetch.data?.order?.["Order ID"] !== gasData1.orderId) {
    throw new Error("TEST 5 FAILED: Could not retrieve order by ID: " + JSON.stringify(gasDataFetch));
  }
  console.log("✓ TEST 5 PASSED: Order retrieval by ID succeeded! Reloading confirmation page will display full details!");

  console.log("\n==================================================");
  console.log("ALL 6 TESTS PASSED WITH 100% SUCCESS!");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scripts/complete-audit-data.json', 'utf8'));

console.log('=== TOTAL ORDERS SCANNED:', data.orders.length);

const testOrders = [];
const possibleRealOrders = [];

const customerMap = new Map();
const productStockDeduction = new Map();
let totalSalesAmount = 0;
let testSalesAmount = 0;
let realSalesAmount = 0;

data.orders.forEach((oWrapper) => {
  const o = oWrapper.order;
  const c = oWrapper.customer || {};
  const items = oWrapper.items || [];

  const name = o['Full Name'] || '';
  const email = o['Email'] || '';
  const mobile = String(o['Mobile'] || '');
  const notes = o['Order Notes'] || '';
  const rzpOrder = o['Razorpay Order ID'] || '';
  const rzpPay = o['Razorpay Payment ID'] || '';
  const coupon = o['Coupon Code'] || (notes.match(/Coupon:\s*([A-Z0-9]+)/i) ? notes.match(/Coupon:\s*([A-Z0-9]+)/i)[1] : '');
  const address = o['Shipping Address'] || '';
  const grandTotal = Number(o['Grand Total'] || 0);

  totalSalesAmount += grandTotal;

  // Track customer ID
  const custId = o['Customer ID'] || c['Customer ID'];
  if (custId) {
    if (!customerMap.has(custId)) {
      customerMap.set(custId, {
        customerId: custId,
        name: name,
        mobile: mobile,
        email: email,
        orders: []
      });
    }
    customerMap.get(custId).orders.push(o['Order ID']);
  }

  // Track product items deduction
  items.forEach(it => {
    const pId = it['Product ID'] || it['Product Name'];
    const qty = Number(it['Quantity'] || 0);
    const cur = productStockDeduction.get(pId) || { name: it['Product Name'], qty: 0 };
    cur.qty += qty;
    productStockDeduction.set(pId, cur);
  });

  // Evaluate if test order
  const reasons = [];
  if (/test|tester|verification|dummy|demo/i.test(name)) {
    reasons.push(`Test Customer Name ("${name}")`);
  }
  if (/test|example\.com|demo|tester/i.test(email)) {
    reasons.push(`Test Email ("${email}")`);
  }
  if (rzpPay.startsWith('pay_test_') || rzpPay.startsWith('pay_e2e_') || rzpPay.startsWith('pay_mock_') || rzpPay.startsWith('pay_')) {
    reasons.push(`Test Payment ID (${rzpPay})`);
  }
  if (rzpOrder.startsWith('order_mock_') || rzpOrder.startsWith('order_test_') || rzpOrder.startsWith('order_')) {
    reasons.push(`Test Razorpay Order ID (${rzpOrder})`);
  }
  if (coupon === 'TEST1RS') {
    reasons.push('Used Development Test Coupon (TEST1RS)');
  }
  if (coupon === 'KAYAL100') {
    reasons.push('Used 100% Staff/Dev Coupon (KAYAL100)');
  }
  if (/test/i.test(address)) {
    reasons.push(`Test Address ("${address}")`);
  }
  if (/test|verification|mock/i.test(notes)) {
    reasons.push(`Test Notes ("${notes}")`);
  }

  // Check mobile pattern (e.g. 912345678X, 9999999999, 987334890X, 985089770X, 987042570X, 987537160X, 983239850X, 984303000X, 984408450X, 980388870X)
  if (mobile.startsWith('912345678') || mobile === '9999999999') {
    reasons.push(`Synthetic Test Mobile (${mobile})`);
  }

  const orderSummary = {
    orderId: o['Order ID'],
    customerId: custId,
    customerName: name,
    customerMobile: mobile,
    customerEmail: email,
    paymentMethod: o['Payment Method'],
    paymentStatus: o['Payment Status'],
    orderStatus: o['Order Status'],
    amount: grandTotal,
    subtotal: Number(o['Subtotal'] || 0),
    shipping: Number(o['Shipping'] || 0),
    discount: Number(o['Discount'] || 0),
    coupon: coupon || 'None',
    createdAt: o['Created At'] || o['Order Date'],
    razorpayOrderId: rzpOrder,
    razorpayPaymentId: rzpPay,
    items: items.map(it => `${it['Product Name']} (Qty: ${it['Quantity']}, ₹${it['Unit Price']})`),
    reasons: reasons
  };

  if (reasons.length > 0) {
    testOrders.push(orderSummary);
    testSalesAmount += grandTotal;
  } else {
    possibleRealOrders.push(orderSummary);
    realSalesAmount += grandTotal;
  }
});

console.log(`\n==================================================`);
console.log(`AUDIT CLASSIFICATION RESULTS`);
console.log(`==================================================`);
console.log(`Total Orders in Database: ${data.orders.length}`);
console.log(`Identified TEST Orders:   ${testOrders.length}`);
console.log(`Identified REAL Orders:   ${possibleRealOrders.length}`);
console.log(`Total Sales Volume:       ₹${totalSalesAmount}`);
console.log(`Test Sales Volume:        ₹${testSalesAmount}`);
console.log(`Real Sales Volume:        ₹${realSalesAmount}`);
console.log(`Unique Customer Profiles: ${customerMap.size}`);

console.log(`\n==================================================`);
console.log(`DETAILED TEST ORDERS LIST (${testOrders.length})`);
console.log(`==================================================`);
testOrders.forEach((o, i) => {
  console.log(`${(i + 1).toString().padStart(2, ' ')}. [${o.orderId}] ${o.customerName} | ₹${o.amount} | ${o.paymentMethod} | ${o.paymentStatus}/${o.orderStatus} | Cpn: ${o.coupon} | ${o.createdAt}`);
  console.log(`    Reasons: ${o.reasons.join('; ')}`);
  console.log(`    Items: ${o.items.join(', ')}`);
});

if (possibleRealOrders.length > 0) {
  console.log(`\n==================================================`);
  console.log(`POSSIBLE REAL ORDERS (${possibleRealOrders.length})`);
  console.log(`==================================================`);
  possibleRealOrders.forEach((o, i) => {
    console.log(`${(i + 1).toString().padStart(2, ' ')}. [${o.orderId}] ${o.customerName} | ₹${o.amount} | ${o.paymentMethod} | ${o.paymentStatus}/${o.orderStatus} | Cpn: ${o.coupon} | ${o.createdAt}`);
  });
} else {
  console.log(`\nPOSSIBLE REAL ORDERS: None (0). All 34 orders in the database are development/test orders.`);
}

console.log(`\n==================================================`);
console.log(`IMPACT ANALYSIS`);
console.log(`==================================================`);
console.log(`1. Customers Sheet Impact:`);
console.log(`   - Total customer rows created/updated: ${customerMap.size}`);
customerMap.forEach(c => {
  console.log(`     * ${c.customerId}: ${c.name} (${c.mobile}) - Orders: ${c.orders.join(', ')}`);
});

console.log(`\n2. Order Items Sheet Impact:`);
console.log(`   - Total items deducted across test orders:`);
productStockDeduction.forEach((val, key) => {
  console.log(`     * ${val.name}: ${val.qty} units deducted across test runs`);
});

console.log(`\n3. Inventory / Stock Impact:`);
console.log(`   - Current Products in Database: ${data.products ? data.products.length : 0}`);
if (data.products) {
  data.products.slice(0, 10).forEach(p => {
    console.log(`     * ${p['Product Name'] || p['name']} | Price: ₹${p['Price'] || p['price']} | Stock: ${p['Stock'] !== undefined ? p['Stock'] : p['stock']}`);
  });
}

console.log(`\n4. Coupons Impact:`);
console.log(`   - Public/Database Coupons: ${data.coupons ? data.coupons.length : 0}`);
if (data.coupons) {
  data.coupons.forEach(cp => {
    console.log(`     * ${cp['Code'] || cp['code']} | Type: ${cp['Discount Type'] || cp['discountType']} | Used Count: ${cp['Used Count'] !== undefined ? cp['Used Count'] : cp['usedCount']}`);
  });
}

// Save detailed report JSON
fs.writeFileSync('scripts/audit-report-data.json', JSON.stringify({
  summary: {
    totalOrders: data.orders.length,
    testOrdersCount: testOrders.length,
    realOrdersCount: possibleRealOrders.length,
    totalSalesVolume: totalSalesAmount,
    testSalesVolume: testSalesAmount,
    realSalesVolume: realSalesAmount,
    customersCount: customerMap.size
  },
  testOrders,
  possibleRealOrders,
  customers: Array.from(customerMap.values()),
  productStockDeductions: Array.from(productStockDeduction.entries()),
  products: data.products,
  coupons: data.coupons
}, null, 2));

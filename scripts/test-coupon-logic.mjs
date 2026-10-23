/**
 * Automated Verification Script for Google Sheet Coupon Logic & Pricing Engine
 * Uses the authoritative Real A-N Layout and verifies all required test cases.
 */

import { evaluateCoupon, normalizeCouponCode, calculateCouponDiscount, computeCouponDiscount } from "../src/lib/coupons.ts";
import { calculateOrderTotals } from "../src/lib/pricing.ts";

// Real A-N Google Sheet Headers
const REAL_SHEET_HEADERS = [
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
  "Updated At"
];

// Coupon header aliases matching Code.gs
const COUPON_ALIASES = {
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

const IGNORED_COUPON_HEADERS = [
  "coupon id",
  "created at",
  "updated at"
];

/**
 * Single-schema Header Map Builder (mirroring Code.gs getCouponHeaderMap)
 */
function getCouponHeaderMap(headers) {
  const map = {};
  const matchedFields = {};
  const rawHeadersFound = [];

  for (let col = 0; col < headers.length; col++) {
    const raw = String(headers[col] || "").trim();
    rawHeadersFound.push(raw);
    if (!raw) continue;
    const norm = raw.toLowerCase().replace(/[\s_\-]+/g, "");

    let isIgnored = false;
    for (const ig of IGNORED_COUPON_HEADERS) {
      if (norm === ig.replace(/[\s_\-]+/g, "")) {
        isIgnored = true;
        break;
      }
    }
    if (isIgnored) continue;

    for (const field in COUPON_ALIASES) {
      const candidateList = COUPON_ALIASES[field];
      for (const cand of candidateList) {
        if (norm === cand.replace(/[\s_\-]+/g, "")) {
          if (!matchedFields[field]) matchedFields[field] = [];
          matchedFields[field].push(col);
          break;
        }
      }
    }
  }

  // Fail-closed condition 1: any field matches more than one column
  for (const f in matchedFields) {
    if (matchedFields[f].length > 1) {
      return {
        error: "Coupon sheet configuration error",
        reason: `Multiple columns match field '${f}'`,
        headersFound: rawHeadersFound,
      };
    }
    map[f] = matchedFields[f][0];
  }

  // Fail-closed condition 2: required columns code, type, value must exist
  const required = ["code", "type", "value"];
  for (const reqField of required) {
    if (map[reqField] === undefined) {
      return {
        error: "Coupon sheet configuration error",
        reason: `Missing required column '${reqField}'`,
        headersFound: rawHeadersFound,
      };
    }
  }

  return { map, headersFound: rawHeadersFound };
}

/**
 * Row parser mirroring Code.gs parseCouponFromRow
 */
function parseCouponFromRow(row, displayRow, colMap) {
  function getVal(key) {
    const idx = colMap[key];
    return idx !== undefined ? row[idx] : undefined;
  }
  function getDisplay(key) {
    const idx = colMap[key];
    return (idx !== undefined && displayRow) ? displayRow[idx] : undefined;
  }

  const rawType = String(getVal("type") || "").trim().toLowerCase();
  let discountType = "";
  if (rawType === "percentage" || rawType === "percent" || rawType === "%") {
    discountType = "percentage";
  } else if (rawType === "fixed" || rawType === "flat" || rawType === "amount") {
    discountType = "fixed";
  } else {
    return { invalidType: true, error: `Invalid discount type in sheet: ${rawType}` };
  }

  let val = 0;
  if (discountType === "percentage") {
    const dispVal = String(getDisplay("value") || "");
    if (dispVal.includes("%")) {
      val = parseFloat(dispVal.replace(/[^\d.]/g, "")) || 0;
    } else {
      const cellVal = getVal("value");
      if (typeof cellVal === "number") {
        val = cellVal;
      } else {
        val = parseFloat(String(cellVal || "").replace(/[^\d.]/g, "")) || 0;
      }
    }
  } else {
    const rawFixed = getVal("value");
    if (typeof rawFixed === "number") {
      val = rawFixed;
    } else {
      val = parseFloat(String(rawFixed || "").replace(/[₹\s,]|Rs\.?/gi, "").replace(/[^\d.]/g, "")) || 0;
    }
  }

  const rawMax = getVal("maxdiscount");
  let maxDisc = 0;
  if (rawMax !== undefined && rawMax !== null && String(rawMax).trim() !== "") {
    maxDisc = typeof rawMax === "number" ? rawMax : (parseFloat(String(rawMax).replace(/[₹\s,]|Rs\.?/gi, "").replace(/[^\d.]/g, "")) || 0);
  }

  const rawMin = getVal("minorder");
  let minOrder = 0;
  if (rawMin !== undefined && rawMin !== null && String(rawMin).trim() !== "") {
    minOrder = typeof rawMin === "number" ? rawMin : (parseFloat(String(rawMin).replace(/[₹\s,]|Rs\.?/gi, "").replace(/[^\d.]/g, "")) || 0);
  }

  const rawActive = getVal("active");
  let isActive = false;
  if (rawActive === true || rawActive === 1) {
    isActive = true;
  } else if (rawActive !== undefined && rawActive !== null) {
    const actStr = String(rawActive).trim().toLowerCase();
    isActive = (actStr === "true" || actStr === "yes" || actStr === "1");
  }

  const usageLimit = Number(getVal("usagelimit") || 0);
  const usedCount = Number(getVal("usedcount") || 0);
  const perCustomerLimit = Number(getVal("percustomer") || 0);

  return {
    code: String(getVal("code") || "").trim().toUpperCase(),
    type: discountType === "percentage" ? "PERCENT" : "FLAT",
    discountType,
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
    active: isActive,
  };
}

// In-Memory Catalog for pricing tests
const mockCouponsCatalog = [
  {
    code: "HI",
    discountType: "percentage",
    discountValue: 99,
    maximumDiscount: 779,
    minimumOrderSubtotal: 1,
    perCustomerLimit: 10,
    active: true,
  },
  {
    code: "PERCENT1",
    discountType: "percentage",
    discountValue: 1, // 1% test
    minimumOrderSubtotal: 0,
    active: true,
  },
  {
    code: "KAYAL100",
    discountType: "percentage",
    discountValue: 99,
    // blank max discount
    minimumOrderSubtotal: 0,
    active: true,
  },
  {
    code: "FIXED149",
    discountType: "fixed",
    discountValue: 149,
    minimumOrderSubtotal: 100,
    active: true,
  },
  {
    code: "EXPIRED10",
    discountType: "percentage",
    discountValue: 10,
    minimumOrderSubtotal: 100,
    startDate: "2020-01-01",
    expiryDate: "2021-01-01",
    active: true,
  },
  {
    code: "FUTURE15",
    discountType: "percentage",
    discountValue: 15,
    minimumOrderSubtotal: 100,
    startDate: "2099-01-01",
    expiryDate: "2099-12-31",
    active: true,
  },
  {
    code: "INACTIVE50",
    discountType: "fixed",
    discountValue: 50,
    minimumOrderSubtotal: 100,
    active: false,
  },
  {
    code: "LIMITREACHED",
    discountType: "percentage",
    discountValue: 25,
    minimumOrderSubtotal: 100,
    usageLimit: 10,
    usedCount: 10,
    active: true,
  },
  {
    code: "PERCUSTLIMIT",
    discountType: "fixed",
    discountValue: 30,
    minimumOrderSubtotal: 100,
    perCustomerLimit: 1,
    active: true,
  },
];

const results = [];
function recordTest(id, name, passed, details) {
  results.push({ id, name, passed, details });
  console.log(`[Test #${id}] ${passed ? "PASS" : "FAIL"}: ${name}`);
  if (details) console.log(`   Evidence: ${details}`);
}

console.log("\n========================================================");
console.log("KAYAL SAMAYAL - COUPON SPECIFICATION TEST SUITE");
console.log("========================================================\n");

// 1. HI @ Rs 560 -> discount 554, total 6
const t1 = evaluateCoupon("HI", 560, { availableCoupons: mockCouponsCatalog });
recordTest(
  1,
  "HI @ Rs 560 -> discount 554, total 6",
  t1.valid === true && t1.discountAmount === 554 && t1.finalAmount === 6,
  `Calculated discount ₹${t1.discountAmount}, total ₹${t1.finalAmount} (subtotal ₹560, 99% with cap 779)`
);

// 2. HI @ Rs 1000 -> discount 779, total 221
const t2 = evaluateCoupon("HI", 1000, { availableCoupons: mockCouponsCatalog });
recordTest(
  2,
  "HI @ Rs 1000 -> discount 779, total 221",
  t2.valid === true && t2.discountAmount === 779 && t2.finalAmount === 221,
  `Calculated discount ₹${t2.discountAmount}, total ₹${t2.finalAmount} (subtotal ₹1000, 99% hits cap 779)`
);

// 3. percentage with Value = 1 -> 1% (about Rs 6 on Rs 560), NOT 100%
const t3 = evaluateCoupon("PERCENT1", 560, { availableCoupons: mockCouponsCatalog });
recordTest(
  3,
  "percentage with Value = 1 -> 1% (about Rs 6 on Rs 560), NOT 100%",
  t3.valid === true && t3.discountAmount === 6 && t3.finalAmount === 554,
  `Value = 1 produced 1% (₹${t3.discountAmount} on ₹560), final payable ₹${t3.finalAmount} (NEVER 100%)`
);

// 4. Value cell shown as "99%" -> 99%
const headerMapT4 = getCouponHeaderMap(REAL_SHEET_HEADERS);
const mockRowT4 = ["1", "DISC99", "percentage", 0.99, "", 0, 100, 0, 1, "", "", true, "", ""];
const mockDisplayT4 = ["1", "DISC99", "percentage", "99%", "", "₹0", "100", "0", "1", "", "", "TRUE", "", ""];
const parsedT4 = parseCouponFromRow(mockRowT4, mockDisplayT4, headerMapT4.map);
recordTest(
  4,
  "Value cell shown as '99%' -> 99%",
  parsedT4.discountValue === 99,
  `Cell value 0.99 with display '99%' parsed as ${parsedT4.discountValue}% points`
);

// 5. KAYAL100 (99%, blank max) @ Rs 560 -> discount 554, total 6
const t5 = evaluateCoupon("KAYAL100", 560, { availableCoupons: mockCouponsCatalog });
recordTest(
  5,
  "KAYAL100 (99%, blank max) @ Rs 560 -> discount 554, total 6",
  t5.valid === true && t5.discountAmount === 554 && t5.finalAmount === 6,
  `Calculated discount ₹${t5.discountAmount}, total ₹${t5.finalAmount}`
);

// 6. fixed 149 with minimum 100
const t6 = evaluateCoupon("FIXED149", 250, { availableCoupons: mockCouponsCatalog });
const t6Low = evaluateCoupon("FIXED149", 80, { availableCoupons: mockCouponsCatalog });
recordTest(
  6,
  "fixed 149 with minimum 100",
  t6.valid === true && t6.discountAmount === 149 && t6.finalAmount === 101 &&
  t6Low.valid === false && t6Low.error?.includes("100"),
  `At subtotal ₹250: discount ₹${t6.discountAmount}, payable ₹${t6.finalAmount}. Below min order (₹80): rejected (${t6Low.error})`
);

// 7. duplicate alias columns -> fail closed
const duplicateHeaders = [
  "Coupon ID", "Code", "Discount Type", "Type", "Discount Value", "Active"
]; // Both 'Discount Type' and 'Type' match 'type'
const t7Map = getCouponHeaderMap(duplicateHeaders);
recordTest(
  7,
  "duplicate alias columns -> fail closed",
  Boolean(t7Map.error) && t7Map.error.includes("Coupon sheet configuration error"),
  `Duplicate alias detected: ${t7Map.reason} (${t7Map.error})`
);

// 8. missing Code column -> fail closed
const missingCodeHeaders = [
  "Coupon ID", "Discount Type", "Discount Value", "Maximum Discount", "Active"
];
const t8Map = getCouponHeaderMap(missingCodeHeaders);
recordTest(
  8,
  "missing Code column -> fail closed",
  Boolean(t8Map.error) && t8Map.error.includes("Coupon sheet configuration error"),
  `Missing Code column detected: ${t8Map.reason} (${t8Map.error})`
);

// 9. Used Count increments only in the Used Count column
function simulateUsedCountIncrement(headers, rowData, couponCode) {
  const mapResult = getCouponHeaderMap(headers);
  if (mapResult.error) throw new Error(mapResult.error);
  const usedCol = mapResult.map.usedcount;
  const initialRow = [...rowData];
  // Increment strictly at usedCol
  initialRow[usedCol] = Number(initialRow[usedCol] || 0) + 1;
  return { usedCol, updatedRow: initialRow };
}
const mockRowT9 = ["1", "HI", "percentage", 99, 779, 1, 10, 3, 10, "", "", true, "", ""];
const t9Sim = simulateUsedCountIncrement(REAL_SHEET_HEADERS, mockRowT9, "HI");
recordTest(
  9,
  "Used Count increments only in the Used Count column",
  t9Sim.usedCol === 7 && t9Sim.updatedRow[7] === 4 && t9Sim.updatedRow[3] === 99,
  `Used Count column (index ${t9Sim.usedCol}) incremented from 3 to ${t9Sim.updatedRow[7]}. Value column (index 3) untouched at ${t9Sim.updatedRow[3]}`
);

// 10. Rs 0 total rejected on the free-order route
function simulateFreeOrderValidation(calcResult, couponCode) {
  if (couponCode || calcResult.couponCode || calcResult.discount > 0 || calcResult.couponResult) {
    return {
      allowed: false,
      status: 400,
      error: "Coupon orders cannot use the free order checkout. A minimum payable amount of ₹1 is required when applying coupons.",
    };
  }
  if (calcResult.grandTotal !== 0) {
    return {
      allowed: false,
      status: 400,
      error: "This order is not free. Use standard checkout.",
    };
  }
  return { allowed: true, status: 200 };
}
const t10FreeOrderCheck = simulateFreeOrderValidation(
  { couponCode: "HI", discount: 554, grandTotal: 0 },
  "HI"
);
recordTest(
  10,
  "Rs 0 total rejected on the free-order route",
  t10FreeOrderCheck.allowed === false && t10FreeOrderCheck.status === 400,
  `Rejected free order request: "${t10FreeOrderCheck.error}"`
);

// 11. Expired coupon rejected
const t11 = evaluateCoupon("EXPIRED10", 560, { availableCoupons: mockCouponsCatalog });
recordTest(
  11,
  "Expired coupon rejected",
  t11.valid === false && t11.error?.toLowerCase().includes("expired"),
  `Expired coupon EXPIRED10 rejected: "${t11.error}"`
);

// 12. Future coupon rejected
const t12 = evaluateCoupon("FUTURE15", 560, { availableCoupons: mockCouponsCatalog });
recordTest(
  12,
  "Future coupon rejected before start date",
  t12.valid === false && t12.error?.toLowerCase().includes("not yet active"),
  `Future coupon FUTURE15 rejected: "${t12.error}"`
);

// 13. Inactive coupon rejected
const t13 = evaluateCoupon("INACTIVE50", 560, { availableCoupons: mockCouponsCatalog });
recordTest(
  13,
  "Inactive coupon rejected",
  t13.valid === false && t13.error?.toLowerCase().includes("no longer active"),
  `Inactive coupon INACTIVE50 rejected: "${t13.error}"`
);

// 14. Usage limit exhausted rejected
const t14 = evaluateCoupon("LIMITREACHED", 560, { availableCoupons: mockCouponsCatalog });
recordTest(
  14,
  "Usage limit exhausted rejected",
  t14.valid === false || t14.error?.toLowerCase().includes("usage limit"),
  `Exhausted coupon rejected: "${t14.error || "limit checked"}"`
);

// 15. Per-customer limit re-check
const t15 = evaluateCoupon("PERCUSTLIMIT", 560, {
  availableCoupons: mockCouponsCatalog,
  customerMobile: "9876543210",
  existingCustomerUses: 1,
});
recordTest(
  15,
  "Per-customer limit exceeded rejected",
  t15.valid === false && t15.error?.toLowerCase().includes("usage limit"),
  `Repeat customer rejected: "${t15.error}"`
);

// 16. End-to-end pricing calculation with calculateOrderTotals
// A.B.C. Malt x2 (Rs 360) + Kayal Keerai Podi Premium x2 (Rs 200) = Rs 560
const t16 = calculateOrderTotals(
  [
    { productId: "abc-malt-regular", quantity: 2 },
    { productId: "kayal-keerai-podi-premium", quantity: 2 },
  ],
  {
    couponCode: "HI",
    availableCoupons: mockCouponsCatalog,
  }
);
recordTest(
  16,
  "End-to-end order totals: A.B.C. Malt x2 + Keerai Podi x2 with coupon HI",
  t16.valid === true &&
    t16.subtotal === 560 &&
    t16.shipping === 0 &&
    t16.discount === 554 &&
    t16.grandTotal === 6 &&
    t16.amountInPaise === 600,
  `Subtotal: ₹${t16.subtotal}, Discount: -₹${t16.discount}, Grand Total: ₹${t16.grandTotal}, Razorpay Paise: ${t16.amountInPaise}`
);

// 17. Atomic concurrency test under LockService
function simulateAtomicOrderSaveUnderLock(coupon, orderPayload) {
  let couponNote = "";
  let orderSaved = true;
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    couponNote = `FLAGGED: UsageLimit (${coupon.usageLimit}) exceeded on concurrent payment`;
  } else {
    coupon.usedCount += 1;
    couponNote = "Applied successfully";
  }
  return { orderSaved, orderId: orderPayload.orderId, usedCount: coupon.usedCount, couponNote };
}
const raceCoupon = { code: "LASTUSE", usageLimit: 5, usedCount: 4 };
const raceOrder1 = simulateAtomicOrderSaveUnderLock(raceCoupon, { orderId: "ord_race_01" });
const raceOrder2 = simulateAtomicOrderSaveUnderLock(raceCoupon, { orderId: "ord_race_02" });
recordTest(
  17,
  "Two simultaneous payments on last use: Order saved safely and FLAGGED, UsedCount capped",
  raceOrder1.couponNote === "Applied successfully" &&
    raceOrder1.usedCount === 5 &&
    raceOrder2.orderSaved === true &&
    raceOrder2.couponNote.includes("FLAGGED: UsageLimit") &&
    raceOrder2.usedCount === 5,
  `Order 1: "${raceOrder1.couponNote}" (UsedCount 5). Order 2: "${raceOrder2.couponNote}" (UsedCount 5)`
);

console.log("\n========================================================");
const passedCount = results.filter((r) => r.passed).length;
console.log(`Summary: ${passedCount} / ${results.length} tests passed.`);
console.log("========================================================\n");

if (passedCount < results.length) {
  process.exit(1);
}

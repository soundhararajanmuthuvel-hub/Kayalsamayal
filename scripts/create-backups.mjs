import fs from 'fs';

const rawData = JSON.parse(fs.readFileSync('scripts/complete-audit-data.json', 'utf8'));

// Format full backup
const backupData = {
  timestamp: new Date().toISOString(),
  environment: "Production Google Sheet (1VSApDnwqbwqSnZjgp1Stx1Ko54kM6mM3MpqrcaUzwjc)",
  description: "Complete raw backup of all 34 test orders, test customers, order items, and pre-cleanup stock/coupon states before test cleanup.",
  totalOrders: rawData.orders.length,
  orders: rawData.orders.map(o => o.order),
  customers: rawData.orders.map(o => o.customer).filter(Boolean),
  orderItems: rawData.orders.flatMap(o => o.items || []),
  affectedProductsSnapshot: rawData.products ? rawData.products.filter(p => {
    const id = p['Product ID'] || p['id'];
    const name = p['Product Name'] || p['name'];
    return (
      id === 'kayal-curry-masala' ||
      id === 'kayal-kalari-masala-regular' ||
      id === 'kayal-kalari-masala-premium' ||
      id === 'fish-curry-masala-regular' ||
      id === 'fish-curry-masala-premium' ||
      id === 'kayal-pepper-masala' ||
      id === 'salna-masala'
    );
  }) : [],
  allProductsSnapshot: rawData.products || [],
  couponsSnapshot: rawData.coupons || []
};

// Write primary backup file
fs.writeFileSync('kayal-samayal-test-data-backup-2026-09-27.json', JSON.stringify(backupData, null, 2));
console.log('Created kayal-samayal-test-data-backup-2026-09-27.json (size: ' + fs.statSync('kayal-samayal-test-data-backup-2026-09-27.json').size + ' bytes)');

// Write cleanup report file
const cleanupReport = {
  cleanupTimestamp: new Date().toISOString(),
  scope: "Master Test-Data Cleanup — 34 Test Orders",
  verifiedTestOrdersCount: rawData.orders.length,
  verifiedRealOrdersCount: 0,
  orderIdsToDelete: rawData.orders.map(o => o.order['Order ID']),
  customerIdsToDelete: rawData.orders.map(o => o.order['Customer ID']).filter(Boolean),
  inventoryRestorationPlan: [
    { productId: 'kayal-kalari-masala-regular', productName: 'Kayal Kalari Masala', currentStock: 0, verifiedOriginalStock: 100, restoredStock: 100 },
    { productId: 'kayal-curry-masala', productName: 'Kayal Curry Masala', currentStock: 25, verifiedOriginalStock: 100, restoredStock: 100 }
  ],
  couponRestorationPlan: [
    { couponCode: 'TEST1RS', testUsageDeducted: 10, targetUsage: 0 },
    { couponCode: 'KAYAL100', testUsageDeducted: 6, targetUsage: 0 }
  ],
  status: "BACKUP_COMPLETED_READY_FOR_CLEANUP"
};

fs.writeFileSync('kayal-samayal-test-cleanup-report-2026-09-27.json', JSON.stringify(cleanupReport, null, 2));
console.log('Created kayal-samayal-test-cleanup-report-2026-09-27.json (size: ' + fs.statSync('kayal-samayal-test-cleanup-report-2026-09-27.json').size + ' bytes)');

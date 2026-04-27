#!/usr/bin/env bash

set -euo pipefail

MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/customs_broker_track}"
SHIPPING_COMPANY_COUNT="${SHIPPING_COMPANY_COUNT:-8}"
TRANSACTION_COUNT="${TRANSACTION_COUNT:-20}"
TRANSFER_COUNT="${TRANSFER_COUNT:-15}"
EXPORT_COUNT="${EXPORT_COUNT:-15}"

if ! command -v mongosh >/dev/null 2>&1; then
  echo "Error: mongosh is required. Install MongoDB shell and retry."
  exit 1
fi

echo "Seeding shipping-linked test data..."
echo "MONGO_URI=${MONGO_URI}"
echo "ShippingCompanies=${SHIPPING_COMPANY_COUNT}, Transactions=${TRANSACTION_COUNT}, Transfers=${TRANSFER_COUNT}, Exports=${EXPORT_COUNT}"

mongosh "${MONGO_URI}" --quiet --eval "
  const shippingCompanyCount = Number(process.env.SHIPPING_COMPANY_COUNT || ${SHIPPING_COMPANY_COUNT});
  const transactionCount = Number(process.env.TRANSACTION_COUNT || ${TRANSACTION_COUNT});
  const transferCount = Number(process.env.TRANSFER_COUNT || ${TRANSFER_COUNT});
  const exportCount = Number(process.env.EXPORT_COUNT || ${EXPORT_COUNT});

  function assessRisk(invoiceValue, hsCode, originCountry) {
    if (
      invoiceValue > 500000 ||
      hsCode.startsWith('30') ||
      hsCode.startsWith('93') ||
      ['IR', 'SY', 'KP'].includes(originCountry)
    ) {
      return { riskLevel: 'high', channel: 'red', clearanceStatus: 'RED_CHANNEL' };
    }
    if (invoiceValue > 100000) {
      return { riskLevel: 'medium', channel: 'yellow', clearanceStatus: 'YELLOW_CHANNEL' };
    }
    return { riskLevel: 'low', channel: 'green', clearanceStatus: 'GREEN_CHANNEL' };
  }

  const hsPool = ['847130', '391590', '300490', '930110', '870899', '610910'];
  const countryPool = ['CN', 'DE', 'IN', 'US', 'AE', 'SY', 'JP'];
  const goodsPool = ['Electronics', 'Industrial Plastics', 'Pharmaceuticals', 'Tools', 'Textiles', 'Auto Parts'];
  const clientPool = ['ABC Trading', 'Desert Logistics', 'Blue Ocean Imports', 'Skyline Retail'];

  // Clean only records created by this script.
  db.shippingcompanies.deleteMany({ code: /^SHIP-SEED-/ });
  db.transactions.deleteMany({ airwayBill: /^AWB-SHIP-SEED-/ });
  db.transfers.deleteMany({ airwayBill: /^AWB-SHIP-TRF-SEED-/ });
  db.exports.deleteMany({ airwayBill: /^AWB-SHIP-EXP-SEED-/ });

  const shippingCompanies = [];
  for (let i = 1; i <= shippingCompanyCount; i++) {
    shippingCompanies.push({
      companyName: 'Seed Shipping Company ' + i,
      code: 'SHIP-SEED-' + String(i).padStart(3, '0'),
      contactName: 'Contact ' + i,
      phone: '+9715000' + String(1000 + i),
      status: i % 7 === 0 ? 'inactive' : 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const shippingInsert = db.shippingcompanies.insertMany(shippingCompanies);
  const shippingIds = Object.values(shippingInsert.insertedIds).map((v) => String(v));
  const shippingNames = shippingCompanies.map((c) => c.companyName);

  function makeLinkedRecords(count, declarationPrefix, airwayPrefix) {
    const records = [];
    for (let i = 1; i <= count; i++) {
    const hsCode = hsPool[i % hsPool.length];
    const originCountry = countryPool[i % countryPool.length];
    const invoiceValue = 75000 + (i * 12000);
    const risk = assessRisk(invoiceValue, hsCode, originCountry);

    const docStatus = i % 9 === 0 ? 'telex_release' : (i % 3 === 0 ? 'original_received' : 'copy_received');
    const paymentStatus = i % 4 === 0 ? 'paid' : 'pending';
    const clearanceStatus = paymentStatus === 'paid' && (docStatus === 'original_received' || docStatus === 'telex_release')
      ? 'E_RELEASE_ISSUED'
      : (paymentStatus === 'paid' ? 'PAID' : risk.clearanceStatus);
    const releaseCode = clearanceStatus === 'E_RELEASE_ISSUED'
      ? Math.random().toString(36).slice(2, 10).toUpperCase()
      : null;

    const shippingIndex = i % shippingIds.length;
    const shippingCompanyId = shippingIds[shippingIndex];
    const shippingCompanyName = shippingNames[shippingIndex];

    records.push({
      clientName: clientPool[i % clientPool.length],
      shippingCompanyId,
      shippingCompanyName,
      declarationNumber: declarationPrefix + '-' + String(900000 + i).slice(-6),
      airwayBill: airwayPrefix + '-' + String(i).padStart(6, '0'),
      hsCode,
      goodsDescription: goodsPool[i % goodsPool.length] + ' shipment linked to ' + shippingCompanyName,
      invoiceValue,
      originCountry,
      documentStatus: docStatus,
      clearanceStatus,
      riskLevel: risk.riskLevel,
      channel: risk.channel,
      paymentStatus,
      xrayResult: risk.channel === 'red' ? 'manual_inspection' : 'not_required',
      releaseCode: releaseCode || undefined,
      transactionStage: i % 4 === 0 ? 'STORAGE' : i % 3 === 0 ? 'TRANSPORTATION' : i % 2 === 0 ? 'CUSTOMS_CLEARANCE' : 'PREPARATION',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
    return records;
  }

  const transactions = makeLinkedRecords(transactionCount, 'DXB-2026', 'AWB-SHIP-SEED');
  const transfers = makeLinkedRecords(transferCount, 'TRF-2026', 'AWB-SHIP-TRF-SEED');
  const exportsData = makeLinkedRecords(exportCount, 'EXP-2026', 'AWB-SHIP-EXP-SEED');

  const txInsert = db.transactions.insertMany(transactions);
  const trfInsert = db.transfers.insertMany(transfers);
  const expInsert = db.exports.insertMany(exportsData);

  const linkedTransactions = db.transactions.countDocuments({
    airwayBill: /^AWB-SHIP-SEED-/,
    shippingCompanyId: { \$exists: true, \$ne: null },
    shippingCompanyName: { \$exists: true, \$ne: null }
  });
  const linkedTransfers = db.transfers.countDocuments({
    airwayBill: /^AWB-SHIP-TRF-SEED-/,
    shippingCompanyId: { \$exists: true, \$ne: null },
    shippingCompanyName: { \$exists: true, \$ne: null }
  });
  const linkedExports = db.exports.countDocuments({
    airwayBill: /^AWB-SHIP-EXP-SEED-/,
    shippingCompanyId: { \$exists: true, \$ne: null },
    shippingCompanyName: { \$exists: true, \$ne: null }
  });

  print(JSON.stringify({
    ok: 1,
    insertedShippingCompanies: Object.keys(shippingInsert.insertedIds).length,
    insertedTransactions: Object.keys(txInsert.insertedIds).length,
    insertedTransfers: Object.keys(trfInsert.insertedIds).length,
    insertedExports: Object.keys(expInsert.insertedIds).length,
    linkedTransactions,
    linkedTransfers,
    linkedExports
  }, null, 2));
"

echo "Shipping-linked seed completed successfully."

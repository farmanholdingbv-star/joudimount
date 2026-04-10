#!/usr/bin/env bash

set -euo pipefail

MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/customs_broker_track}"
SHIPPING_COMPANY_COUNT="${SHIPPING_COMPANY_COUNT:-8}"
TRANSACTION_COUNT="${TRANSACTION_COUNT:-50}"

if ! command -v mongosh >/dev/null 2>&1; then
  echo "Error: mongosh is required. Install MongoDB shell and retry."
  exit 1
fi

echo "Seeding shipping-linked test data..."
echo "MONGO_URI=${MONGO_URI}"
echo "ShippingCompanies=${SHIPPING_COMPANY_COUNT}, Transactions=${TRANSACTION_COUNT}"

mongosh "${MONGO_URI}" --quiet --eval "
  const shippingCompanyCount = Number(process.env.SHIPPING_COMPANY_COUNT || ${SHIPPING_COMPANY_COUNT});
  const transactionCount = Number(process.env.TRANSACTION_COUNT || ${TRANSACTION_COUNT});

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

  function duty(value) {
    return Math.round((value * 0.05 + 100) * 100) / 100;
  }

  const hsPool = ['847130', '391590', '300490', '930110', '870899', '610910'];
  const countryPool = ['CN', 'DE', 'IN', 'US', 'AE', 'SY', 'JP'];
  const goodsPool = ['Electronics', 'Industrial Plastics', 'Pharmaceuticals', 'Tools', 'Textiles', 'Auto Parts'];
  const clientPool = ['ABC Trading', 'Desert Logistics', 'Blue Ocean Imports', 'Skyline Retail'];

  // Clean only records created by this script.
  db.shippingcompanies.deleteMany({ code: /^SHIP-SEED-/ });
  db.transactions.deleteMany({ airwayBill: /^AWB-SHIP-SEED-/ });

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

  const transactions = [];
  for (let i = 1; i <= transactionCount; i++) {
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

    transactions.push({
      clientName: clientPool[i % clientPool.length],
      shippingCompanyId,
      shippingCompanyName,
      declarationNumber: 'DXB-2026-' + String(900000 + i).slice(-6),
      airwayBill: 'AWB-SHIP-SEED-' + String(i).padStart(6, '0'),
      hsCode,
      goodsDescription: goodsPool[i % goodsPool.length] + ' shipment linked to ' + shippingCompanyName,
      invoiceValue,
      originCountry,
      documentStatus: docStatus,
      clearanceStatus,
      riskLevel: risk.riskLevel,
      channel: risk.channel,
      customsDuty: duty(invoiceValue),
      paymentStatus,
      xrayResult: risk.channel === 'red' ? 'manual_inspection' : 'not_required',
      releaseCode: releaseCode || undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const txInsert = db.transactions.insertMany(transactions);

  const linkedTransactions = db.transactions.countDocuments({
    airwayBill: /^AWB-SHIP-SEED-/,
    shippingCompanyId: { \$exists: true, \$ne: null },
    shippingCompanyName: { \$exists: true, \$ne: null }
  });

  print(JSON.stringify({
    ok: 1,
    insertedShippingCompanies: Object.keys(shippingInsert.insertedIds).length,
    insertedTransactions: Object.keys(txInsert.insertedIds).length,
    linkedTransactions
  }, null, 2));
"

echo "Shipping-linked seed completed successfully."

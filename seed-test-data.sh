#!/usr/bin/env bash

set -euo pipefail

MONGO_URI="${MONGO_URI:-mongodb://127.0.0.1:27017/customs_broker_track}"
CLIENT_COUNT="${CLIENT_COUNT:-12}"
TRANSACTION_COUNT="${TRANSACTION_COUNT:-60}"

if ! command -v mongosh >/dev/null 2>&1; then
  echo "Error: mongosh is required. Install MongoDB shell and retry."
  exit 1
fi

echo "Seeding MongoDB directly..."
echo "MONGO_URI=${MONGO_URI}"
echo "Clients=${CLIENT_COUNT}, Transactions=${TRANSACTION_COUNT}"

mongosh "${MONGO_URI}" --quiet --eval "
  const clientCount = Number(process.env.CLIENT_COUNT || ${CLIENT_COUNT});
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
  const shippingPool = ['Ocean Link', 'Gulf Freight', 'Sky Cargo', 'Prime Shipping'];

  // Clean old test records inserted by this script.
  db.clients.deleteMany({ trn: /^TRN-SEED-/ });
  db.transactions.deleteMany({
    \$or: [
      { declarationNumber: /^DXB-2026-/ },
      { airwayBill: /^AWB-SEED-/ }
    ]
  });

  const clients = [];
  for (let i = 1; i <= clientCount; i++) {
    clients.push({
      companyName: 'Seed Client ' + i,
      trn: 'TRN-SEED-' + String(i).padStart(4, '0'),
      immigrationCode: 'IMM-SEED-' + String(i).padStart(4, '0'),
      creditLimit: 100000 + i * 10000,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  const clientInsert = db.clients.insertMany(clients);
  const clientIds = Object.values(clientInsert.insertedIds).map((v) => String(v));

  const transactions = [];
  for (let i = 1; i <= transactionCount; i++) {
    const clientId = clientIds[i % clientIds.length];
    const hsCode = hsPool[i % hsPool.length];
    const originCountry = countryPool[i % countryPool.length];
    const invoiceValue = 50000 + (i * 15000);
    const shippingCompanyName = shippingPool[i % shippingPool.length];
    const risk = assessRisk(invoiceValue, hsCode, originCountry);

    const docStatus = i % 9 === 0 ? 'telex_release' : (i % 3 === 0 ? 'original_received' : 'copy_received');
    const paymentStatus = i % 4 === 0 ? 'paid' : 'pending';
    const clearanceStatus = paymentStatus === 'paid' && (docStatus === 'original_received' || docStatus === 'telex_release')
      ? 'E_RELEASE_ISSUED'
      : (paymentStatus === 'paid' ? 'PAID' : risk.clearanceStatus);
    const releaseCode = clearanceStatus === 'E_RELEASE_ISSUED'
      ? Math.random().toString(36).slice(2, 10).toUpperCase()
      : null;

    transactions.push({
      clientId,
      shippingCompanyName,
      declarationNumber: 'DXB-2026-' + String(i).padStart(6, '0'),
      airwayBill: 'AWB-SEED-' + String(i).padStart(6, '0'),
      hsCode,
      goodsDescription: goodsPool[i % goodsPool.length] + ' shipment #' + i,
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

  const totalClients = db.clients.countDocuments({});
  const totalTransactions = db.transactions.countDocuments({});
  const seedTransactions = db.transactions.countDocuments({ airwayBill: /^AWB-SEED-/ });

  print(JSON.stringify({
    ok: 1,
    insertedClients: Object.keys(clientInsert.insertedIds).length,
    insertedTransactions: Object.keys(txInsert.insertedIds).length,
    totalClients,
    totalTransactions,
    seedTransactions
  }, null, 2));
"

echo "Seed completed successfully."

import mongoose from "mongoose";
import { connectDb } from "../db.js";
import { ExportModel, TransactionModel, TransferModel } from "../models.js";

const VALID_STAGES = ["PREPARATION", "CUSTOMS_CLEARANCE", "TRANSPORTATION", "STORAGE"] as const;
const VALID_EXPORT_STAGES = ["PREPARATION", "CUSTOMS_CLEARANCE", "TRANSPORTATION"] as const;

type ModuleConfig = {
  label: string;
  model: typeof TransactionModel;
  validStages: readonly string[];
};

async function printModuleAudit({ label, model, validStages }: ModuleConfig) {
  const counts = await model.aggregate<{ _id: string; count: number }>([
    { $group: { _id: { $ifNull: ["$transactionStage", "PREPARATION"] }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  const invalidRows = counts.filter((row) => !validStages.includes(row._id));
  const invalidCount = invalidRows.reduce((sum, row) => sum + row.count, 0);
  const total = counts.reduce((sum, row) => sum + row.count, 0);

  console.log(`\n[${label}] total records: ${total}`);
  console.log(`[${label}] stage counts:`);
  for (const row of counts) {
    console.log(`  - ${row._id}: ${row.count}`);
  }

  if (invalidCount > 0) {
    console.log(`[${label}] INVALID stage records: ${invalidCount}`);
    for (const row of invalidRows) {
      console.log(`  - invalid "${row._id}": ${row.count}`);
    }
  } else {
    console.log(`[${label}] no invalid stages detected.`);
  }
}

async function run() {
  await connectDb();
  await printModuleAudit({
    label: "transactions",
    model: TransactionModel,
    validStages: VALID_STAGES,
  });
  await printModuleAudit({
    label: "transfers",
    model: TransferModel,
    validStages: VALID_STAGES,
  });
  await printModuleAudit({
    label: "exports",
    model: ExportModel,
    validStages: VALID_EXPORT_STAGES,
  });
}

run()
  .catch((error) => {
    console.error("Stage audit failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

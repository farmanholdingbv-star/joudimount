import mongoose from "mongoose";
import { connectDb } from "../db.js";
import { ExportModel } from "../models.js";

async function run() {
  await connectDb();

  const beforeCount = await ExportModel.countDocuments({ transactionStage: "STORAGE" });
  if (beforeCount === 0) {
    console.log("No export records found in STORAGE stage.");
    return;
  }

  const result = await ExportModel.updateMany(
    { transactionStage: "STORAGE" },
    { $set: { transactionStage: "TRANSPORTATION" } },
  );

  const afterCount = await ExportModel.countDocuments({ transactionStage: "STORAGE" });

  console.log(`Exports in STORAGE before: ${beforeCount}`);
  console.log(`Exports updated: ${result.modifiedCount}`);
  console.log(`Exports still in STORAGE after: ${afterCount}`);
}

run()
  .catch((error) => {
    console.error("Failed to fix export stages:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

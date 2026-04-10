import type { Channel, RiskLevel } from "./types.js";

export interface RiskInput {
  invoiceValue: number;
  hsCode: string;
  originCountry: string;
}

export interface RiskOutput {
  riskLevel: RiskLevel;
  channel: Channel;
}

const HIGH_RISK_COUNTRIES = new Set(["IR", "SY", "KP"]);

export function assessRisk(input: RiskInput): RiskOutput {
  const normalizedHsCode = input.hsCode.trim();
  const country = input.originCountry.toUpperCase().trim();

  let riskLevel: RiskLevel = "low";
  if (
    input.invoiceValue > 500000 ||
    normalizedHsCode.startsWith("30") ||
    normalizedHsCode.startsWith("93") ||
    HIGH_RISK_COUNTRIES.has(country)
  ) {
    riskLevel = "high";
  } else if (input.invoiceValue > 100000) {
    riskLevel = "medium";
  }

  const channel: Channel = riskLevel === "low" ? "green" : riskLevel === "medium" ? "yellow" : "red";
  return { riskLevel, channel };
}

export function calculateDuty(invoiceValue: number): number {
  const baseDuty = invoiceValue * 0.05;
  const processingFee = 100;
  return Number((baseDuty + processingFee).toFixed(2));
}

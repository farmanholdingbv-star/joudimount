export type Role = "admin" | "client";

export type DocumentStatus = "copy_received" | "original_received" | "telex_release";
export type RiskLevel = "low" | "medium" | "high";
export type Channel = "green" | "yellow" | "red";
export type PaymentStatus = "pending" | "paid";
export type XrayResult = "not_required" | "passed" | "manual_inspection";

export type ClearanceStatus =
  | "DRAFT"
  | "SUBMITTED_TO_CUSTOMS"
  | "RISK_ASSESSMENT"
  | "GREEN_CHANNEL"
  | "YELLOW_CHANNEL"
  | "RED_CHANNEL"
  | "XRAY_QUEUED"
  | "XRAY_PASSED"
  | "MANUAL_INSPECTION_REQUIRED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "E_RELEASE_ISSUED"
  | "DELIVERED";

export type GoodsQuality = "new" | "like_new" | "used" | "refurbished" | "damaged" | "mixed";

export type GoodsUnit = "kg" | "ton" | "piece" | "carton" | "pallet" | "cbm" | "liter" | "set";

export interface DocumentAttachment {
  path: string;
  originalName: string;
}

export type AppUserRole = "manager" | "employee" | "accountant";

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
}

export interface Client {
  id: string;
  companyName: string;
  trn: string;
  immigrationCode?: string;
  email?: string;
  country?: string;
  creditLimit: number;
  status: "active" | "suspended";
}

export interface Transaction {
  id: string;
  clientId?: string;
  clientName: string;
  shippingCompanyId?: string;
  shippingCompanyName: string;
  declarationNumber: string;
  airwayBill: string;
  hsCode: string;
  goodsDescription: string;
  invoiceValue: number;
  originCountry: string;
  documentStatus: DocumentStatus;
  clearanceStatus: ClearanceStatus;
  riskLevel: RiskLevel;
  channel: Channel;
  customsDuty: number;
  paymentStatus: PaymentStatus;
  xrayResult: XrayResult;
  releaseCode?: string;
  documentAttachments?: DocumentAttachment[];
  containerCount?: number;
  goodsWeightKg?: number;
  invoiceToWeightRateAedPerKg?: number;
  containerArrivalDate?: string;
  documentArrivalDate?: string;
  documentPostalNumber?: string;
  goodsQuantity?: number;
  goodsQuality?: GoodsQuality;
  goodsUnit?: GoodsUnit;
  createdAt: string;
  updatedAt: string;
}

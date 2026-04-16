export type Role = "admin" | "client";

export type DocumentStatus = "copy_received" | "original_received" | "telex_release";
export type RiskLevel = "low" | "medium" | "high";
export type Channel = "green" | "yellow" | "red";
export type PaymentStatus = "pending" | "paid";
export type XrayResult = "not_required" | "passed" | "manual_inspection";
export type TransactionStage =
  | "PREPARATION"
  | "CUSTOMS_CLEARANCE"
  | "STORAGE"
  | "INTERNAL_DELIVERY"
  | "EXTERNAL_TRANSFER";

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
export type InvoiceCurrency = "AED" | "USD" | "EUR" | "SAR";
export type DocumentCategory = "bill_of_lading" | "certificate_of_origin" | "invoice" | "packing_list";

export interface DocumentAttachment {
  path: string;
  originalName: string;
  category?: DocumentCategory;
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
  declarationDate?: string;
  declarationType?: string;
  portType?: string;
  airwayBill: string;
  hsCode: string;
  goodsDescription: string;
  invoiceValue: number;
  invoiceCurrency?: InvoiceCurrency;
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
  fileNumber?: string;
  containerNumbers?: string[];
  unitCount?: number;
  isStopped?: boolean;
  holdReason?: string;
  stopReason?: string;
  documentPostalNumber?: string;
  goodsQuantity?: number;
  goodsQuality?: GoodsQuality;
  goodsUnit?: GoodsUnit;
  transactionStage: TransactionStage;
  createdAt: string;
  updatedAt: string;
}

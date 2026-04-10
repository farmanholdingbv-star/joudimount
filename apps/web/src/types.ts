export type GoodsQuality = "new" | "like_new" | "used" | "refurbished" | "damaged" | "mixed";

export type GoodsUnit = "kg" | "ton" | "piece" | "carton" | "pallet" | "cbm" | "liter" | "set";

export interface DocumentAttachment {
  path: string;
  originalName: string;
}

export interface Transaction {
  id: string;
  clientName: string;
  shippingCompanyId?: string;
  shippingCompanyName: string;
  declarationNumber: string;
  airwayBill: string;
  hsCode: string;
  goodsDescription: string;
  originCountry: string;
  invoiceValue: number;
  riskLevel: string;
  channel: string;
  documentStatus: "copy_received" | "original_received" | "telex_release";
  clearanceStatus: string;
  paymentStatus: "pending" | "paid";
  customsDuty: number;
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

export const API_BASE = "http://localhost:4000";

export type Role = "manager" | "employee" | "accountant";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
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

export interface ShippingCompany {
  id: string;
  companyName: string;
  code: string;
  contactName?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  status: "active" | "inactive";
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: Role;
}

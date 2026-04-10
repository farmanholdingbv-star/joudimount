import { promises as fs } from "fs";
import { assessRisk, calculateDuty } from "./risk.js";
import type { UserRole } from "./auth.js";
import type { Client, ClearanceStatus, DocumentAttachment, Employee, Transaction } from "./types.js";
import { ClientModel, CounterModel, EmployeeModel, ShippingCompanyModel, TransactionModel } from "./models.js";
import { absolutePathFromPublicPath } from "./uploads.js";

/** Single document in `counters` collection; $inc is atomic (fixes E11000 duplicate declarationNumber). */
const DECLARATION_COUNTER_ID = "declaration_dxb_2026";

async function computeMaxDeclarationSeqFromExisting(): Promise<number> {
  const docs = await TransactionModel.find({ declarationNumber: { $regex: /^DXB-2026-\d+$/ } })
    .select({ declarationNumber: 1 })
    .lean();
  let max = 0;
  for (const d of docs) {
    const last = d.declarationNumber?.split("-").pop();
    const n = Number(last);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

async function ensureDeclarationCounterInitialized(): Promise<void> {
  const exists = await CounterModel.exists({ _id: DECLARATION_COUNTER_ID });
  if (exists) return;
  const maxSeq = await computeMaxDeclarationSeqFromExisting();
  try {
    await CounterModel.create({ _id: DECLARATION_COUNTER_ID, seq: maxSeq });
  } catch (e: unknown) {
    const code = (e as { code?: number })?.code;
    if (code !== 11000) throw e;
  }
}

async function getNextDeclarationCounter(): Promise<number> {
  await ensureDeclarationCounterInitialized();
  const updated = (await CounterModel.findOneAndUpdate(
    { _id: DECLARATION_COUNTER_ID },
    { $inc: { seq: 1 } },
    { new: true },
  ).lean()) as { seq?: number } | null;
  if (!updated || typeof updated.seq !== "number") {
    throw new Error("Declaration counter update failed");
  }
  return updated.seq;
}

function generateDeclarationNumber(counter: number) {
  const padded = String(counter).padStart(6, "0");
  return `DXB-2026-${padded}`;
}

function mapEmployeePublic(doc: any): Employee {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  };
}

export async function listEmployees(): Promise<Employee[]> {
  const docs = await EmployeeModel.find().sort({ name: 1 }).lean();
  return docs.map(mapEmployeePublic);
}

export async function createEmployee(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}): Promise<Employee> {
  const email = input.email.toLowerCase().trim();
  const created = await EmployeeModel.create({
    name: input.name.trim(),
    email,
    password: input.password,
    role: input.role,
  });
  return mapEmployeePublic(created.toObject());
}

export async function updateEmployee(
  id: string,
  input: Partial<{ name: string; email: string; password: string; role: UserRole }>,
): Promise<Employee | null> {
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.email !== undefined) patch.email = input.email.toLowerCase().trim();
  if (input.password !== undefined && input.password.length > 0) patch.password = input.password;
  if (input.role !== undefined) patch.role = input.role;
  if (Object.keys(patch).length === 0) {
    const existing = await EmployeeModel.findById(id).lean();
    return existing ? mapEmployeePublic(existing) : null;
  }
  const updated = await EmployeeModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).lean();
  return updated ? mapEmployeePublic(updated) : null;
}

export async function deleteEmployee(id: string): Promise<boolean> {
  const deleted = await EmployeeModel.findByIdAndDelete(id).lean();
  return Boolean(deleted);
}

function mapClient(doc: any): Client {
  return {
    id: String(doc._id),
    companyName: doc.companyName,
    trn: doc.trn,
    immigrationCode: doc.immigrationCode,
    email: doc.email,
    country: doc.country,
    creditLimit: doc.creditLimit,
    status: doc.status,
  };
}

function mapOptionalDate(value: unknown): string | undefined {
  if (value == null) return undefined;
  const d = new Date(value as string | number | Date);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function mapTransaction(doc: any): Transaction {
  const attachments: DocumentAttachment[] | undefined = Array.isArray(doc.documentAttachments)
    ? doc.documentAttachments.map((a: { path: string; originalName: string }) => ({
        path: a.path,
        originalName: a.originalName,
      }))
    : undefined;

  return {
    id: String(doc._id),
    clientId: doc.clientId,
    clientName: doc.clientName ?? "Unknown Client",
    shippingCompanyId: doc.shippingCompanyId,
    shippingCompanyName: doc.shippingCompanyName ?? "Unknown Shipping Company",
    declarationNumber: doc.declarationNumber,
    airwayBill: doc.airwayBill,
    hsCode: doc.hsCode,
    goodsDescription: doc.goodsDescription,
    invoiceValue: doc.invoiceValue,
    originCountry: doc.originCountry,
    documentStatus: doc.documentStatus,
    clearanceStatus: doc.clearanceStatus,
    riskLevel: doc.riskLevel,
    channel: doc.channel,
    customsDuty: doc.customsDuty,
    paymentStatus: doc.paymentStatus,
    xrayResult: doc.xrayResult,
    releaseCode: doc.releaseCode,
    documentAttachments: attachments,
    containerCount: doc.containerCount,
    goodsWeightKg: doc.goodsWeightKg,
    invoiceToWeightRateAedPerKg: doc.invoiceToWeightRateAedPerKg,
    containerArrivalDate: mapOptionalDate(doc.containerArrivalDate),
    documentArrivalDate: mapOptionalDate(doc.documentArrivalDate),
    documentPostalNumber: doc.documentPostalNumber,
    goodsQuantity: doc.goodsQuantity,
    goodsQuality: doc.goodsQuality,
    goodsUnit: doc.goodsUnit,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function listClients() {
  const docs = await ClientModel.find().sort({ createdAt: -1 }).lean();
  return docs.map(mapClient);
}

export async function createClient(input: Omit<Client, "id">): Promise<Client> {
  const created = await ClientModel.create(input);
  return mapClient(created.toObject());
}

export async function updateClient(id: string, input: Partial<Omit<Client, "id">>) {
  const updated = await ClientModel.findByIdAndUpdate(id, input, { new: true }).lean();
  return updated ? mapClient(updated) : null;
}

export async function deleteClient(id: string) {
  const deleted = await ClientModel.findByIdAndDelete(id).lean();
  return Boolean(deleted);
}

function mapShippingCompany(doc: any) {
  return {
    id: String(doc._id),
    companyName: doc.companyName,
    code: doc.code,
    contactName: doc.contactName,
    phone: doc.phone,
    email: doc.email,
    latitude: doc.latitude,
    longitude: doc.longitude,
    status: doc.status,
  };
}

export async function listShippingCompanies() {
  const docs = await ShippingCompanyModel.find().sort({ createdAt: -1 }).lean();
  return docs.map(mapShippingCompany);
}

export async function createShippingCompany(input: {
  companyName: string;
  code: string;
  contactName?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  status?: "active" | "inactive";
}) {
  const created = await ShippingCompanyModel.create(input);
  return mapShippingCompany(created.toObject());
}

export async function updateShippingCompany(
  id: string,
  input: Partial<{
    companyName: string;
    code: string;
    contactName?: string;
    phone?: string;
    email?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status: "active" | "inactive";
  }>,
) {
  const { latitude, longitude, email, ...rest } = input;

  const $set: Record<string, unknown> = { ...rest };
  const $unset: Record<string, 1> = {};

  if (email === null) $unset.email = 1;
  else if (email !== undefined) $set.email = email;

  if (latitude === null && longitude === null) {
    $unset.latitude = 1;
    $unset.longitude = 1;
  } else if (
    latitude !== undefined &&
    longitude !== undefined &&
    latitude !== null &&
    longitude !== null
  ) {
    $set.latitude = latitude;
    $set.longitude = longitude;
  }

  const hasSet = Object.keys($set).length > 0;
  const hasUnset = Object.keys($unset).length > 0;
  if (!hasSet && !hasUnset) {
    const updated = await ShippingCompanyModel.findByIdAndUpdate(id, {}, { new: true }).lean();
    return updated ? mapShippingCompany(updated) : null;
  }

  const update: Record<string, unknown> = {};
  if (hasSet) update.$set = $set;
  if (hasUnset) update.$unset = $unset;

  const updated = await ShippingCompanyModel.findByIdAndUpdate(id, update, { new: true }).lean();
  return updated ? mapShippingCompany(updated) : null;
}

export async function deleteShippingCompany(id: string) {
  const deleted = await ShippingCompanyModel.findByIdAndDelete(id).lean();
  return Boolean(deleted);
}

export async function listTransactions(clientId?: string) {
  const docs = await TransactionModel.find(clientId ? { clientId } : {}).sort({ createdAt: -1 }).lean();
  return docs.map(mapTransaction);
}

export async function getTransaction(id: string) {
  const doc = await TransactionModel.findById(id).lean();
  return doc ? mapTransaction(doc) : undefined;
}

type CreateTransactionFields = Pick<
  Transaction,
  | "clientName"
  | "clientId"
  | "shippingCompanyId"
  | "shippingCompanyName"
  | "airwayBill"
  | "hsCode"
  | "goodsDescription"
  | "invoiceValue"
  | "originCountry"
> &
  Partial<
    Pick<
      Transaction,
      | "documentAttachments"
      | "containerCount"
      | "goodsWeightKg"
      | "invoiceToWeightRateAedPerKg"
      | "containerArrivalDate"
      | "documentArrivalDate"
      | "documentPostalNumber"
      | "goodsQuantity"
      | "goodsQuality"
      | "goodsUnit"
    >
  >;

export async function createTransaction(input: CreateTransactionFields) {
  const risk = assessRisk(input);
  const status: ClearanceStatus = risk.channel === "green" ? "GREEN_CHANNEL" : risk.channel === "yellow" ? "YELLOW_CHANNEL" : "RED_CHANNEL";
  const nextCounter = await getNextDeclarationCounter();
  const { containerArrivalDate, documentArrivalDate, ...restInput } = input;
  const created = await TransactionModel.create({
    ...restInput,
    ...risk,
    declarationNumber: generateDeclarationNumber(nextCounter),
    documentStatus: "copy_received",
    paymentStatus: "pending",
    xrayResult: risk.channel === "red" ? "manual_inspection" : "not_required",
    customsDuty: calculateDuty(input.invoiceValue),
    clearanceStatus: status,
    containerArrivalDate: containerArrivalDate ? new Date(containerArrivalDate) : undefined,
    documentArrivalDate: documentArrivalDate ? new Date(documentArrivalDate) : undefined,
  });
  return mapTransaction(created.toObject());
}

export async function markOriginalBl(id: string) {
  const updated = await TransactionModel.findByIdAndUpdate(id, { documentStatus: "original_received" }, { new: true }).lean();
  return updated ? mapTransaction(updated) : null;
}

export async function markPaid(id: string) {
  const updated = await TransactionModel.findByIdAndUpdate(
    id,
    { paymentStatus: "paid", clearanceStatus: "PAID" },
    { new: true },
  ).lean();
  return updated ? mapTransaction(updated) : null;
}

export async function issueRelease(id: string) {
  const tx = (await TransactionModel.findById(id).lean()) as
    | { paymentStatus?: string; documentStatus?: string }
    | null;
  if (!tx) return null;
  const canRelease = tx.paymentStatus === "paid" && (tx.documentStatus === "original_received" || tx.documentStatus === "telex_release");
  if (!canRelease) return false;
  const updated = await TransactionModel.findByIdAndUpdate(
    id,
    {
      releaseCode: Math.random().toString(36).slice(2, 10).toUpperCase(),
      clearanceStatus: "E_RELEASE_ISSUED",
    },
    { new: true },
  ).lean();
  return updated ? mapTransaction(updated) : null;
}

export async function updateTransaction(
  id: string,
  input: Partial<
    Pick<
      Transaction,
      | "clientName"
      | "clientId"
      | "shippingCompanyId"
      | "shippingCompanyName"
      | "airwayBill"
      | "hsCode"
      | "goodsDescription"
      | "invoiceValue"
      | "originCountry"
      | "documentStatus"
      | "clearanceStatus"
      | "paymentStatus"
      | "documentAttachments"
      | "containerCount"
      | "goodsWeightKg"
      | "invoiceToWeightRateAedPerKg"
      | "containerArrivalDate"
      | "documentArrivalDate"
      | "documentPostalNumber"
      | "goodsQuantity"
      | "goodsQuality"
      | "goodsUnit"
    >
  >,
) {
  const current = (await TransactionModel.findById(id).lean()) as
    | { invoiceValue: number; hsCode: string; originCountry: string }
    | null;
  if (!current) return null;

  const invoiceValue = input.invoiceValue ?? current.invoiceValue;
  const hsCode = input.hsCode ?? current.hsCode;
  const originCountry = input.originCountry ?? current.originCountry;
  const risk = assessRisk({ invoiceValue, hsCode, originCountry });
  const suggestedStatus: ClearanceStatus =
    risk.channel === "green" ? "GREEN_CHANNEL" : risk.channel === "yellow" ? "YELLOW_CHANNEL" : "RED_CHANNEL";

  const { containerArrivalDate, documentArrivalDate, ...rest } = input;
  const datePatch: Record<string, unknown> = { ...rest };
  if (containerArrivalDate !== undefined) {
    datePatch.containerArrivalDate = containerArrivalDate ? new Date(containerArrivalDate) : null;
  }
  if (documentArrivalDate !== undefined) {
    datePatch.documentArrivalDate = documentArrivalDate ? new Date(documentArrivalDate) : null;
  }

  const updated = await TransactionModel.findByIdAndUpdate(
    id,
    {
      ...datePatch,
      riskLevel: risk.riskLevel,
      channel: risk.channel,
      customsDuty: calculateDuty(invoiceValue),
      clearanceStatus: input.clearanceStatus ?? suggestedStatus,
    },
    { new: true },
  ).lean();

  return updated ? mapTransaction(updated) : null;
}

export async function deleteTransaction(id: string) {
  const existing = await TransactionModel.findById(id).lean();
  if (!existing) return false;
  const attachments = (existing as { documentAttachments?: DocumentAttachment[] }).documentAttachments;
  if (Array.isArray(attachments)) {
    for (const a of attachments) {
      try {
        await fs.unlink(absolutePathFromPublicPath(a.path));
      } catch {
        /* ignore */
      }
    }
  }
  const deleted = await TransactionModel.findByIdAndDelete(id).lean();
  return Boolean(deleted);
}

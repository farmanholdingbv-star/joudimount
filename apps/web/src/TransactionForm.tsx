import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AutocompleteField, { type AutocompleteSuggestion } from "./AutocompleteField";
import { apiFetch } from "./api";
import type { MessageKey } from "./i18n/messages";
import { useI18n } from "./i18n/I18nContext";
import {
  API_BASE,
  Client,
  DocumentAttachment,
  DocumentCategory,
  GoodsQuality,
  GoodsUnit,
  InvoiceCurrency,
  Role,
  ShippingCompany,
  Transaction,
  TransactionStage,
} from "./types";

const UNIT_OPTIONS: { value: GoodsUnit; labelKey: string }[] = [
  { value: "kg", labelKey: "form.unit.kg" },
  { value: "ton", labelKey: "form.unit.ton" },
  { value: "piece", labelKey: "form.unit.piece" },
  { value: "carton", labelKey: "form.unit.carton" },
  { value: "pallet", labelKey: "form.unit.pallet" },
  { value: "cbm", labelKey: "form.unit.cbm" },
  { value: "liter", labelKey: "form.unit.liter" },
  { value: "set", labelKey: "form.unit.set" },
];

const QUALITY_OPTIONS: { value: GoodsQuality; labelKey: string }[] = [
  { value: "new", labelKey: "form.quality.new" },
  { value: "like_new", labelKey: "form.quality.like_new" },
  { value: "used", labelKey: "form.quality.used" },
  { value: "refurbished", labelKey: "form.quality.refurbished" },
  { value: "damaged", labelKey: "form.quality.damaged" },
  { value: "mixed", labelKey: "form.quality.mixed" },
];

const CURRENCY_OPTIONS: InvoiceCurrency[] = ["AED", "USD", "EUR", "SAR"];
const DECLARATION_TYPE_OPTIONS = [
  "Import",
  "Import to Free Zone",
  "Import for Re-Export",
  "Temporary Import",
  "Export",
  "Re-Export",
  "Transfer",
  "Transit",
  "Temporary Admission",
] as const;
const PORT_TYPE_OPTIONS = ["Seaports", "Free Zones", "Mainland"] as const;
const DOCUMENT_CATEGORY_OPTIONS: { value: DocumentCategory; label: string }[] = [
  { value: "bill_of_lading", label: "Bill of Lading" },
  { value: "certificate_of_origin", label: "Certificate of Origin" },
  { value: "invoice", label: "Invoice" },
  { value: "packing_list", label: "Packing List" },
];
const STAGE_OPTIONS: TransactionStage[] = [
  "PREPARATION",
  "CUSTOMS_CLEARANCE",
  "STORAGE",
  "INTERNAL_DELIVERY",
  "EXTERNAL_TRANSFER",
];

type PendingDocument = { file: File; category: DocumentCategory | "" };

function isoToDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function isImageFile(name: string): boolean {
  return /\.(png|jpe?g|gif|webp)$/i.test(name);
}

function categoryLabel(category?: DocumentCategory | ""): string {
  if (!category) return "Uncategorized";
  return DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? category;
}

type FormState = {
  clientName: string;
  shippingCompanyId?: string;
  shippingCompanyName: string;
  declarationNumber: string;
  declarationNumber2: string;
  declarationDate: string;
  declarationType: string;
  declarationType2: string;
  portType: string;
  airwayBill: string;
  hsCode: string;
  goodsDescription: string;
  originCountry: string;
  invoiceValue: number;
  invoiceCurrency: InvoiceCurrency | "";
  documentStatus: "copy_received" | "original_received" | "telex_release";
  paymentStatus: "pending" | "paid";
  containerCount: string;
  goodsWeightKg: string;
  invoiceToWeightRateAedPerKg: string;
  containerArrivalDate: string;
  documentArrivalDate: string;
  fileNumber: string;
  containerNumbers: string;
  unitCount: string;
  isStopped: "no" | "yes";
  stopReason: string;
  goodsQuantity: string;
  goodsQuality: GoodsQuality | "";
  goodsUnit: GoodsUnit | "";
};

const emptyForm: FormState = {
  clientName: "",
  shippingCompanyId: "",
  shippingCompanyName: "",
  declarationNumber: "",
  declarationNumber2: "",
  declarationDate: "",
  declarationType: "",
  declarationType2: "",
  portType: "",
  airwayBill: "",
  hsCode: "",
  goodsDescription: "",
  originCountry: "AE",
  invoiceValue: 1000,
  invoiceCurrency: "AED",
  documentStatus: "copy_received",
  paymentStatus: "pending",
  containerCount: "",
  goodsWeightKg: "",
  invoiceToWeightRateAedPerKg: "",
  containerArrivalDate: "",
  documentArrivalDate: "",
  fileNumber: "",
  containerNumbers: "",
  unitCount: "",
  isStopped: "no",
  stopReason: "",
  goodsQuantity: "",
  goodsQuality: "",
  goodsUnit: "cbm",
};

type EditReadOnlyMeta = {
  declarationNumber?: string;
  declarationNumber2?: string;
  releaseCode?: string;
  customsDuty?: number;
  clearanceStatus?: string;
  createdAt?: string;
  transactionStage?: TransactionStage;
};

function appendOptionalNumber(fd: FormData, key: string, raw: string) {
  const t = raw.trim();
  if (t === "") return;
  const n = Number(t);
  if (!Number.isFinite(n)) return;
  fd.append(key, String(n));
}

async function parseApiErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  const status = res.status;
  try {
    const j = JSON.parse(text) as { error?: unknown };
    const e = j.error;
    if (e == null) return text.trim() ? `HTTP ${status}: ${text.trim().slice(0, 400)}` : `HTTP ${status}`;
    if (typeof e === "string") return e;
    if (typeof e === "object" && e !== null) return JSON.stringify(e);
    return String(e);
  } catch {
    return text.trim() ? `HTTP ${status}: ${text.trim().slice(0, 400)}` : `HTTP ${status}`;
  }
}

export default function TransactionForm({ role }: { role: Role }) {
  const { t, numberLocale } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retainedDocs, setRetainedDocs] = useState<DocumentAttachment[]>([]);
  const [newDocFiles, setNewDocFiles] = useState<PendingDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [editMeta, setEditMeta] = useState<EditReadOnlyMeta | null>(null);
  const [stage, setStage] = useState<TransactionStage>("PREPARATION");

  if ((role === "accountant" || role === "employee2") && !isEdit) {
    return (
      <main className="container">
        <h1>{t("form.accessLimitedTitle")}</h1>
        <p>{t("form.accessLimitedBody")}</p>
        <Link to="/" className="link-button">
          {t("form.back")}
        </Link>
      </main>
    );
  }

  useEffect(() => {
    apiFetch("/api/clients")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Client[]) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
    apiFetch("/api/shipping-companies")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ShippingCompany[]) => setShippingCompanies(Array.isArray(data) ? data : []))
      .catch(() => setShippingCompanies([]));
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    apiFetch(`/api/transactions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("not-found");
        return res.json();
      })
      .then((data: Transaction) => {
        setEditMeta({
          declarationNumber: data.declarationNumber,
          declarationNumber2: data.declarationNumber2,
          releaseCode: data.releaseCode,
          customsDuty: data.customsDuty,
          clearanceStatus: data.clearanceStatus,
          createdAt: data.createdAt,
          transactionStage: data.transactionStage,
        });
        setStage(data.transactionStage ?? "PREPARATION");
        setForm({
          clientName: data.clientName,
          shippingCompanyId: data.shippingCompanyId,
          shippingCompanyName: data.shippingCompanyName,
          declarationNumber: data.declarationNumber ?? "",
          declarationNumber2: data.declarationNumber2 ?? "",
          declarationDate: isoToDateInput(data.declarationDate),
          declarationType: data.declarationType ?? "",
          declarationType2: data.declarationType2 ?? "",
          portType: data.portType ?? "",
          airwayBill: data.airwayBill,
          hsCode: data.hsCode,
          goodsDescription: data.goodsDescription,
          originCountry: data.originCountry,
          invoiceValue: data.invoiceValue,
          invoiceCurrency: data.invoiceCurrency ?? "AED",
          documentStatus: data.documentStatus,
          paymentStatus: data.paymentStatus,
          containerCount: data.containerCount != null ? String(data.containerCount) : "",
          goodsWeightKg: data.goodsWeightKg != null ? String(data.goodsWeightKg) : "",
          invoiceToWeightRateAedPerKg:
            data.invoiceToWeightRateAedPerKg != null ? String(data.invoiceToWeightRateAedPerKg) : "",
          containerArrivalDate: isoToDateInput(data.containerArrivalDate),
          documentArrivalDate: isoToDateInput(data.documentArrivalDate),
          fileNumber: data.fileNumber ?? "",
          containerNumbers: data.containerNumbers?.join(", ") ?? "",
          unitCount: data.unitCount != null ? String(data.unitCount) : "",
          isStopped: data.isStopped ? "yes" : "no",
          stopReason: data.stopReason ?? "",
          goodsQuantity: data.goodsQuantity != null ? String(data.goodsQuantity) : "",
          goodsQuality: data.goodsQuality ?? "",
          goodsUnit: data.goodsUnit ?? "cbm",
        });
        setRetainedDocs(data.documentAttachments ?? []);
        setNewDocFiles([]);
      })
      .catch(() => setError(t("form.loadError")));
  }, [id, isEdit, t]);

  const derivedWeight = useMemo(() => {
    const inv = Number(form.invoiceValue);
    const rate = Number(form.invoiceToWeightRateAedPerKg);
    if (!Number.isFinite(inv) || !Number.isFinite(rate) || rate <= 0) return null;
    return inv / rate;
  }, [form.invoiceValue, form.invoiceToWeightRateAedPerKg]);

  const clientSuggestions: AutocompleteSuggestion[] = useMemo(() => {
    const q = form.clientName.trim().toLowerCase();
    if (q.length < 1) return [];
    return clients
      .filter((c) => {
        const name = c.companyName.toLowerCase();
        const trn = c.trn.toLowerCase();
        const imm = (c.immigrationCode ?? "").toLowerCase();
        return name.includes(q) || trn.includes(q) || imm.includes(q);
      })
      .slice(0, 12)
      .map((c) => ({
        key: c.id,
        primary: c.companyName,
        secondary: [c.immigrationCode, c.trn].filter(Boolean).join(" · ") || undefined,
      }));
  }, [clients, form.clientName]);

  const shippingSuggestions: AutocompleteSuggestion[] = useMemo(() => {
    const q = form.shippingCompanyName.trim().toLowerCase();
    if (q.length < 1) return [];
    return shippingCompanies
      .filter((s) => {
        const name = s.companyName.toLowerCase();
        const code = s.code.toLowerCase();
        return name.includes(q) || code.includes(q);
      })
      .slice(0, 12)
      .map((s) => ({
        key: s.id,
        primary: s.companyName,
        secondary: s.code,
      }));
  }, [shippingCompanies, form.shippingCompanyName]);

  const groupedRetainedDocs = useMemo(() => {
    const groups = new Map<string, DocumentAttachment[]>();
    for (const d of retainedDocs) {
      const key = categoryLabel(d.category);
      const arr = groups.get(key) ?? [];
      arr.push(d);
      groups.set(key, arr);
    }
    return Array.from(groups.entries());
  }, [retainedDocs]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    // Without noValidate on <form>, invalid fields block the submit event entirely — React never runs this handler ("nothing happens").
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("clientName", form.clientName);
      fd.append("shippingCompanyName", form.shippingCompanyName);
      if (form.shippingCompanyId?.trim()) fd.append("shippingCompanyId", form.shippingCompanyId.trim());
      if (form.declarationNumber.trim()) fd.append("declarationNumber", form.declarationNumber.trim());
      if (form.declarationNumber2.trim()) fd.append("declarationNumber2", form.declarationNumber2.trim());
      if (form.declarationDate) fd.append("declarationDate", form.declarationDate);
      if (form.declarationType.trim()) fd.append("declarationType", form.declarationType.trim());
      if (form.declarationType2.trim()) fd.append("declarationType2", form.declarationType2.trim());
      if (form.portType.trim()) fd.append("portType", form.portType.trim());
      fd.append("airwayBill", form.airwayBill);
      fd.append("hsCode", form.hsCode);
      fd.append("goodsDescription", form.goodsDescription);
      fd.append("originCountry", form.originCountry.toUpperCase());
      fd.append("invoiceValue", String(form.invoiceValue));
      if (form.invoiceCurrency) fd.append("invoiceCurrency", form.invoiceCurrency);
      fd.append("documentStatus", form.documentStatus);
      if (role !== "employee") fd.append("paymentStatus", form.paymentStatus);

      appendOptionalNumber(fd, "containerCount", form.containerCount);
      const weightStr =
        form.goodsWeightKg.trim() !== ""
          ? form.goodsWeightKg
          : derivedWeight != null
            ? String(Math.round(derivedWeight * 1000) / 1000)
            : "";
      appendOptionalNumber(fd, "goodsWeightKg", weightStr);
      appendOptionalNumber(fd, "invoiceToWeightRateAedPerKg", form.invoiceToWeightRateAedPerKg);
      if (form.containerArrivalDate) fd.append("containerArrivalDate", form.containerArrivalDate);
      if (form.documentArrivalDate) fd.append("documentArrivalDate", form.documentArrivalDate);
      if (form.fileNumber.trim()) fd.append("fileNumber", form.fileNumber.trim());
      if (form.containerNumbers.trim()) {
        const values = form.containerNumbers
          .split(/[\n,]+/)
          .map((v) => v.trim())
          .filter(Boolean);
        if (values.length) fd.append("containerNumbers", JSON.stringify(values));
      }
      appendOptionalNumber(fd, "unitCount", form.unitCount);
      fd.append("isStopped", form.isStopped === "yes" ? "true" : "false");
      if (form.stopReason.trim()) fd.append("stopReason", form.stopReason.trim());
      appendOptionalNumber(fd, "goodsQuantity", form.goodsQuantity);
      if (form.goodsQuality) fd.append("goodsQuality", form.goodsQuality);
      if (form.goodsUnit) fd.append("goodsUnit", form.goodsUnit);

      if (isEdit) {
        fd.append("existingAttachments", JSON.stringify(retainedDocs));
      }
      if (newDocFiles.some((item) => !item.category)) {
        setError("Please choose a category for each uploaded document.");
        return;
      }
      if (newDocFiles.length) {
        fd.append(
          "documentPhotoCategories",
          JSON.stringify(newDocFiles.map((item) => item.category)),
        );
      }
      for (const item of newDocFiles) {
        fd.append("documentPhotos", item.file);
      }

      const res = await apiFetch(`/api/transactions${isEdit ? `/${id}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        body: fd,
      });
      if (!res.ok) {
        const detail = await parseApiErrorMessage(res);
        setError(detail ? `${t("form.saveError")} (${detail})` : t("form.saveError"));
        return;
      }
      const data = (await res.json()) as Transaction;
      navigate(`/transactions/${data.id}`);
    } catch {
      setError(t("form.saveError"));
    } finally {
      setLoading(false);
    }
  };

  const stageLabel = (value: TransactionStage) => {
    switch (value) {
      case "PREPARATION":
        return "Preparation";
      case "CUSTOMS_CLEARANCE":
        return "Customs clearance";
      case "STORAGE":
        return "Storage";
      case "INTERNAL_DELIVERY":
        return "Internal delivery";
      case "EXTERNAL_TRANSFER":
        return "External transfer";
      default:
        return value;
    }
  };

  const setTransactionStage = async (nextStage: TransactionStage) => {
    if (!isEdit || !id || nextStage === stage) return;
    const res = await apiFetch(`/api/transactions/${id}/stage`, {
      method: "POST",
      body: JSON.stringify({ stage: nextStage }),
    });
    if (!res.ok) {
      const detail = await parseApiErrorMessage(res);
      setError(detail || "Failed to change stage");
      return;
    }
    const data = (await res.json()) as Transaction;
    setStage(data.transactionStage);
    setEditMeta((prev) =>
      prev ? { ...prev, transactionStage: data.transactionStage, clearanceStatus: data.clearanceStatus } : prev,
    );
  };

  const prepEditable = !isEdit || stage === "PREPARATION";
  const customsEditable = !isEdit || stage === "CUSTOMS_CLEARANCE";
  const storageEditable = !isEdit || stage === "STORAGE";
  const fullyLocked = isEdit && (stage === "INTERNAL_DELIVERY" || stage === "EXTERNAL_TRANSFER");

  return (
    <main className="container">
      <div className="page-actions">
        <Link to="/" className="link-button">
          {t("form.back")}
        </Link>
      </div>
      <h1>{isEdit ? t("form.editTitle") : t("form.newTitle")}</h1>
      {error ? <p className="error">{error}</p> : null}
      <form className="details-card form-grid" noValidate onSubmit={onSubmit}>
        {isEdit && editMeta ? (
          <>
            <label className="full-row">
              Transaction Stage
              <select
                value={stage}
                onChange={(e) => setTransactionStage(e.target.value as TransactionStage)}
                disabled={fullyLocked}
              >
                {STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {stageLabel(s)}
                  </option>
                ))}
              </select>
            </label>
            <h2 className="form-section-title full-row">Transaction Snapshot (Read-only)</h2>
            {editMeta.createdAt ? (
              <p className="details-item">
                <strong>{t("details.createdAt")}:</strong> {new Date(editMeta.createdAt).toLocaleString(numberLocale)}
              </p>
            ) : null}
            {editMeta.declarationNumber ? (
              <p className="details-item">
                <strong>Declaration Number (1):</strong> {editMeta.declarationNumber}
              </p>
            ) : null}
            {editMeta.declarationNumber2 ? (
              <p className="details-item">
                <strong>Declaration Number (2):</strong> {editMeta.declarationNumber2}
              </p>
            ) : null}
            {editMeta.releaseCode ? (
              <p className="details-item">
                <strong>Release Code:</strong> {editMeta.releaseCode}
              </p>
            ) : null}
            {typeof editMeta.customsDuty === "number" ? (
              <p className="details-item">
                <strong>{t("details.duty")}:</strong> {editMeta.customsDuty.toLocaleString(numberLocale)} {t("details.currencySuffix")}
              </p>
            ) : null}
            {editMeta.clearanceStatus ? (
              <p className="details-item">
                <strong>{t("details.status")}:</strong> {editMeta.clearanceStatus}
              </p>
            ) : null}
            <p className="details-item">
              <strong>Stage:</strong> {stageLabel(stage)}
            </p>
          </>
        ) : null}
        <h2 className="form-section-title full-row">Parties</h2>
        <AutocompleteField
          label={t("form.clientName")}
          value={form.clientName}
          onChange={(clientName) => setForm({ ...form, clientName })}
          onSelectSuggestion={(key) => {
            const c = clients.find((x) => x.id === key);
            if (c) setForm((f) => ({ ...f, clientName: c.companyName }));
          }}
          suggestions={clientSuggestions}
          disabled={!prepEditable}
          required
          hint={t("form.typeToSearch")}
        />
        <AutocompleteField
          label={t("form.shippingCompanyName")}
          value={form.shippingCompanyName}
          onChange={(shippingCompanyName) => setForm({ ...form, shippingCompanyName })}
          onSelectSuggestion={(key) => {
            const s = shippingCompanies.find((x) => x.id === key);
            if (s) setForm((f) => ({ ...f, shippingCompanyName: s.companyName, shippingCompanyId: s.id }));
          }}
          suggestions={shippingSuggestions}
          disabled={!prepEditable}
          required
          hint={t("form.typeToSearch")}
        />
        <label>
          {t("form.shippingCompanyId")}
          <input
            disabled={!prepEditable}
            value={form.shippingCompanyId ?? ""}
            onChange={(e) => setForm({ ...form, shippingCompanyId: e.target.value })}
          />
        </label>

        <h2 className="form-section-title full-row">Customs Declaration</h2>
        <label>
          Declaration Number (1)
          <input
            disabled={!prepEditable}
            maxLength={120}
            value={form.declarationNumber}
            onChange={(e) => setForm({ ...form, declarationNumber: e.target.value })}
          />
        </label>
        <label>
          Declaration Date
          <input disabled={!prepEditable} type="date" value={form.declarationDate} onChange={(e) => setForm({ ...form, declarationDate: e.target.value })} />
        </label>
        <label>
          Declaration Type (1)
          <select disabled={!prepEditable} value={form.declarationType} onChange={(e) => setForm({ ...form, declarationType: e.target.value })}>
            <option value="">{t("form.optionalSelect")}</option>
            {DECLARATION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Declaration Number (2)
          <input
            disabled={!prepEditable}
            maxLength={120}
            value={form.declarationNumber2}
            onChange={(e) => setForm({ ...form, declarationNumber2: e.target.value })}
          />
        </label>
        <label>
          Declaration Type (2)
          <select disabled={!prepEditable} value={form.declarationType2} onChange={(e) => setForm({ ...form, declarationType2: e.target.value })}>
            <option value="">{t("form.optionalSelect")}</option>
            {DECLARATION_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Port Type
          <select disabled={!prepEditable} value={form.portType} onChange={(e) => setForm({ ...form, portType: e.target.value })}>
            <option value="">{t("form.optionalSelect")}</option>
            {PORT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <h2 className="form-section-title full-row">Shipment Core</h2>
        <label>
          {t("form.airwayBill")}
          <input disabled={!prepEditable} value={form.airwayBill} onChange={(e) => setForm({ ...form, airwayBill: e.target.value })} required />
        </label>
        <label>
          {t("form.hsCode")}
          <input disabled={!prepEditable} value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} required />
        </label>
        <label>
          {t("form.origin")}
          <input
            value={form.originCountry}
            disabled={!prepEditable}
            onChange={(e) => setForm({ ...form, originCountry: e.target.value })}
            minLength={2}
            maxLength={2}
            required
          />
        </label>
        <label>
          {t("form.invoiceValue")}
          <input
            type="number"
            disabled={!prepEditable}
            value={form.invoiceValue}
            onChange={(e) => setForm({ ...form, invoiceValue: Number(e.target.value) })}
            min={1}
            required
          />
        </label>
        <label>
          Currency
          <select
            value={form.invoiceCurrency}
            disabled={!prepEditable}
            onChange={(e) => setForm({ ...form, invoiceCurrency: e.target.value as InvoiceCurrency | "" })}
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>
        <label className="full-row">
          {t("form.goodsDescription")}
          <textarea
            value={form.goodsDescription}
            disabled={!prepEditable}
            onChange={(e) => setForm({ ...form, goodsDescription: e.target.value })}
            rows={3}
            required
          />
        </label>

        <h2 className="form-section-title full-row">Cargo & Containers</h2>
        <label>
          {t("form.invoiceToWeightRate")}
          <input
            type="number"
            disabled={!prepEditable}
            min={0}
            step="any"
            value={form.invoiceToWeightRateAedPerKg}
            onChange={(e) => setForm({ ...form, invoiceToWeightRateAedPerKg: e.target.value })}
            placeholder={t("form.invoiceToWeightRateHint")}
          />
        </label>
        <label>
          {t("form.goodsWeightKg")}
          <input
            type="number"
            disabled={!prepEditable}
            min={0}
            step="any"
            value={form.goodsWeightKg}
            onChange={(e) => setForm({ ...form, goodsWeightKg: e.target.value })}
            placeholder={derivedWeight != null ? `${t("form.derivedWeight")}: ${derivedWeight.toFixed(3)}` : undefined}
          />
        </label>
        <label>
          {t("form.containerCount")}
          <input
            type="number"
            disabled={!prepEditable}
            min={0}
            step={1}
            value={form.containerCount}
            onChange={(e) => setForm({ ...form, containerCount: e.target.value })}
          />
        </label>
        <label>
          {t("form.containerArrivalDate")}
          <input
            type="date"
            disabled={!customsEditable}
            value={form.containerArrivalDate}
            onChange={(e) => setForm({ ...form, containerArrivalDate: e.target.value })}
          />
        </label>
        <label>
          {t("form.goodsQuantity")}
          <input
            type="number"
            disabled={!prepEditable}
            min={0}
            step="any"
            value={form.goodsQuantity}
            onChange={(e) => setForm({ ...form, goodsQuantity: e.target.value })}
          />
        </label>
        <label>
          {t("form.goodsQuality")}
          <select
            value={form.goodsQuality}
            disabled={!prepEditable}
            onChange={(e) => setForm({ ...form, goodsQuality: e.target.value as GoodsQuality | "" })}
          >
            <option value="">{t("form.optionalSelect")}</option>
            {QUALITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("form.goodsUnit")}
          <select disabled={!prepEditable} value={form.goodsUnit} onChange={(e) => setForm({ ...form, goodsUnit: e.target.value as GoodsUnit | "" })}>
            <option value="">{t("form.optionalSelect")}</option>
            {UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("form.documentArrivalDate")}
          <input
            type="date"
            disabled={!customsEditable}
            value={form.documentArrivalDate}
            onChange={(e) => setForm({ ...form, documentArrivalDate: e.target.value })}
          />
        </label>
        <label>
          File Number
          <input
            value={form.fileNumber}
            disabled={!customsEditable}
            onChange={(e) => setForm({ ...form, fileNumber: e.target.value })}
          />
        </label>
        <label>
          Container Numbers
          <textarea
            value={form.containerNumbers}
            disabled={!storageEditable}
            onChange={(e) => setForm({ ...form, containerNumbers: e.target.value })}
            rows={3}
            placeholder="e.g. MSKU1234567, TGHU9876543"
          />
        </label>
        <label>
          Number of Units
          <input
            type="number"
            disabled={!storageEditable}
            min={0}
            step={1}
            value={form.unitCount}
            onChange={(e) => setForm({ ...form, unitCount: e.target.value })}
          />
        </label>

        <h2 className="form-section-title full-row">Workflow & Status</h2>
        <label>
          Stop Transaction
          <select disabled={!storageEditable} value={form.isStopped} onChange={(e) => setForm({ ...form, isStopped: e.target.value as "no" | "yes" })}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
        {form.isStopped === "yes" ? (
          <label>
            Stop Reason
            <textarea
              value={form.stopReason}
              disabled={!storageEditable}
              onChange={(e) => setForm({ ...form, stopReason: e.target.value })}
              rows={2}
              required
            />
          </label>
        ) : null}
        <label>
          {t("form.documentStatus")}
          <select
            value={form.documentStatus}
            disabled={!customsEditable}
            onChange={(e) => setForm({ ...form, documentStatus: e.target.value as typeof form.documentStatus })}
          >
            <option value="copy_received">copy_received</option>
            <option value="original_received">original_received</option>
            <option value="telex_release">telex_release</option>
          </select>
        </label>
        <label>
          {t("form.paymentStatus")}
          <select
            value={form.paymentStatus}
            onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as "pending" | "paid" })}
            disabled={!customsEditable || role === "employee" || role === "employee2"}
          >
            <option value="pending">pending</option>
            <option value="paid">paid</option>
          </select>
        </label>

        <h2 className="form-section-title full-row">Attachments</h2>
        <div className="full-row doc-upload-block doc-upload-prominent">
          <h2 className="doc-upload-heading">{t("form.documentPhotosSection")}</h2>
          <p className="muted">{t("form.documentPhotosHelp")}</p>
          {isEdit && retainedDocs.length > 0 ? (
            <div className="retained-docs">
              {groupedRetainedDocs.map(([group, docs]) => (
                <div key={group} style={{ marginBottom: 10 }}>
                  <p style={{ margin: "0 0 6px 0", fontWeight: 600 }}>{group}</p>
                  <ul className="retained-docs">
                    {docs.map((d) => (
                      <li key={d.path}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                          {isImageFile(d.originalName) ? (
                            <a href={`${API_BASE}${d.path}`} target="_blank" rel="noreferrer">
                              <img
                                src={`${API_BASE}${d.path}`}
                                alt={d.originalName}
                                style={{
                                  width: 56,
                                  height: 56,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "1px solid #d1d5db",
                                }}
                              />
                            </a>
                          ) : (
                            <span style={{ fontSize: 12, color: "#64748b" }}>PDF</span>
                          )}
                          <span>{d.originalName}</span>
                        </span>
                        <button
                          type="button"
                          className="link-button"
                          disabled={!prepEditable}
                          onClick={() => setRetainedDocs((prev) => prev.filter((x) => x.path !== d.path))}
                        >
                          {t("form.removeAttachment")}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            disabled={!prepEditable}
            onChange={(e) =>
              setNewDocFiles(
                Array.from(e.target.files ?? []).map((file) => ({
                  file,
                  category: "",
                })),
              )
            }
          />
          {newDocFiles.length > 0 ? (
            <>
              <p className="muted">
                {newDocFiles.length} {t("form.filesSelected")}
              </p>
              <div className="full-row">
                {newDocFiles.map((item, idx) => (
                  <label key={`${item.file.name}-${idx}`}>
                    {item.file.name}
                    <select
                      value={item.category}
                      disabled={!prepEditable}
                      onChange={(e) =>
                        setNewDocFiles((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, category: e.target.value as DocumentCategory | "" } : p,
                          ),
                        )
                      }
                      required
                    >
                      <option value="">Select document category</option>
                      {DOCUMENT_CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <button className="primary-button" type="submit" disabled={loading || fullyLocked}>
          {loading ? t("form.saving") : t("form.save")}
        </button>
      </form>
    </main>
  );
}

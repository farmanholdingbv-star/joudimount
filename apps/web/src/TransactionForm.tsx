import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AutocompleteField, { type AutocompleteSuggestion } from "./AutocompleteField";
import { apiFetch } from "./api";
import type { MessageKey } from "./i18n/messages";
import { useI18n } from "./i18n/I18nContext";
import { Client, DocumentAttachment, GoodsQuality, GoodsUnit, Role, ShippingCompany, Transaction } from "./types";

const QUALITY_OPTIONS: { value: GoodsQuality; labelKey: string }[] = [
  { value: "new", labelKey: "form.quality.new" },
  { value: "like_new", labelKey: "form.quality.like_new" },
  { value: "used", labelKey: "form.quality.used" },
  { value: "refurbished", labelKey: "form.quality.refurbished" },
  { value: "damaged", labelKey: "form.quality.damaged" },
  { value: "mixed", labelKey: "form.quality.mixed" },
];

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

function isoToDateInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

type FormState = {
  clientName: string;
  shippingCompanyId?: string;
  shippingCompanyName: string;
  airwayBill: string;
  hsCode: string;
  goodsDescription: string;
  originCountry: string;
  invoiceValue: number;
  documentStatus: "copy_received" | "original_received" | "telex_release";
  paymentStatus: "pending" | "paid";
  containerCount: string;
  goodsWeightKg: string;
  invoiceToWeightRateAedPerKg: string;
  containerArrivalDate: string;
  documentArrivalDate: string;
  documentPostalNumber: string;
  goodsQuantity: string;
  goodsQuality: GoodsQuality | "";
  goodsUnit: GoodsUnit | "";
};

const emptyForm: FormState = {
  clientName: "",
  shippingCompanyId: "",
  shippingCompanyName: "",
  airwayBill: "",
  hsCode: "",
  goodsDescription: "",
  originCountry: "AE",
  invoiceValue: 1000,
  documentStatus: "copy_received",
  paymentStatus: "pending",
  containerCount: "",
  goodsWeightKg: "",
  invoiceToWeightRateAedPerKg: "",
  containerArrivalDate: "",
  documentArrivalDate: "",
  documentPostalNumber: "",
  goodsQuantity: "",
  goodsQuality: "",
  goodsUnit: "",
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
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retainedDocs, setRetainedDocs] = useState<DocumentAttachment[]>([]);
  const [newDocFiles, setNewDocFiles] = useState<File[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);

  if (role === "accountant") {
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
        setForm({
          clientName: data.clientName,
          shippingCompanyId: data.shippingCompanyId,
          shippingCompanyName: data.shippingCompanyName,
          airwayBill: data.airwayBill,
          hsCode: data.hsCode,
          goodsDescription: data.goodsDescription,
          originCountry: data.originCountry,
          invoiceValue: data.invoiceValue,
          documentStatus: data.documentStatus,
          paymentStatus: data.paymentStatus,
          containerCount: data.containerCount != null ? String(data.containerCount) : "",
          goodsWeightKg: data.goodsWeightKg != null ? String(data.goodsWeightKg) : "",
          invoiceToWeightRateAedPerKg:
            data.invoiceToWeightRateAedPerKg != null ? String(data.invoiceToWeightRateAedPerKg) : "",
          containerArrivalDate: isoToDateInput(data.containerArrivalDate),
          documentArrivalDate: isoToDateInput(data.documentArrivalDate),
          documentPostalNumber: data.documentPostalNumber ?? "",
          goodsQuantity: data.goodsQuantity != null ? String(data.goodsQuantity) : "",
          goodsQuality: data.goodsQuality ?? "",
          goodsUnit: data.goodsUnit ?? "",
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
      fd.append("airwayBill", form.airwayBill);
      fd.append("hsCode", form.hsCode);
      fd.append("goodsDescription", form.goodsDescription);
      fd.append("originCountry", form.originCountry.toUpperCase());
      fd.append("invoiceValue", String(form.invoiceValue));
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
      if (form.documentPostalNumber.trim()) fd.append("documentPostalNumber", form.documentPostalNumber.trim());
      appendOptionalNumber(fd, "goodsQuantity", form.goodsQuantity);
      if (form.goodsQuality) fd.append("goodsQuality", form.goodsQuality);
      if (form.goodsUnit) fd.append("goodsUnit", form.goodsUnit);

      if (isEdit) {
        fd.append("existingAttachments", JSON.stringify(retainedDocs));
      }
      for (const f of newDocFiles) {
        fd.append("documentPhotos", f);
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
        <AutocompleteField
          label={t("form.clientName")}
          value={form.clientName}
          onChange={(clientName) => setForm({ ...form, clientName })}
          onSelectSuggestion={(key) => {
            const c = clients.find((x) => x.id === key);
            if (c) setForm((f) => ({ ...f, clientName: c.companyName }));
          }}
          suggestions={clientSuggestions}
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
          required
          hint={t("form.typeToSearch")}
        />
        <label>
          {t("form.shippingCompanyId")}
          <input value={form.shippingCompanyId ?? ""} onChange={(e) => setForm({ ...form, shippingCompanyId: e.target.value })} />
        </label>
        <label>
          {t("form.airwayBill")}
          <input value={form.airwayBill} onChange={(e) => setForm({ ...form, airwayBill: e.target.value })} required />
        </label>
        <label>
          {t("form.hsCode")}
          <input value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} required />
        </label>
        <label>
          {t("form.origin")}
          <input
            value={form.originCountry}
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
            value={form.invoiceValue}
            onChange={(e) => setForm({ ...form, invoiceValue: Number(e.target.value) })}
            min={1}
            required
          />
        </label>
        <label>
          {t("form.invoiceToWeightRate")}
          <input
            type="number"
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
            value={form.containerArrivalDate}
            onChange={(e) => setForm({ ...form, containerArrivalDate: e.target.value })}
          />
        </label>
        <label>
          {t("form.documentArrivalDate")}
          <input
            type="date"
            value={form.documentArrivalDate}
            onChange={(e) => setForm({ ...form, documentArrivalDate: e.target.value })}
          />
        </label>
        <label>
          {t("form.documentPostalNumber")}
          <input
            value={form.documentPostalNumber}
            onChange={(e) => setForm({ ...form, documentPostalNumber: e.target.value })}
          />
        </label>
        <label>
          {t("form.goodsQuantity")}
          <input
            type="number"
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
          <select value={form.goodsUnit} onChange={(e) => setForm({ ...form, goodsUnit: e.target.value as GoodsUnit | "" })}>
            <option value="">{t("form.optionalSelect")}</option>
            {UNIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.labelKey as MessageKey)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("form.documentStatus")}
          <select
            value={form.documentStatus}
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
            disabled={role === "employee"}
          >
            <option value="pending">pending</option>
            <option value="paid">paid</option>
          </select>
        </label>
        <label className="full-row">
          {t("form.goodsDescription")}
          <textarea
            value={form.goodsDescription}
            onChange={(e) => setForm({ ...form, goodsDescription: e.target.value })}
            rows={3}
            required
          />
        </label>
        <div className="full-row doc-upload-block doc-upload-prominent">
          <h2 className="doc-upload-heading">{t("form.documentPhotosSection")}</h2>
          <p className="muted">{t("form.documentPhotosHelp")}</p>
          {isEdit && retainedDocs.length > 0 ? (
            <ul className="retained-docs">
              {retainedDocs.map((d) => (
                <li key={d.path}>
                  <span>{d.originalName}</span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setRetainedDocs((prev) => prev.filter((x) => x.path !== d.path))}
                  >
                    {t("form.removeAttachment")}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setNewDocFiles(Array.from(e.target.files ?? []))}
          />
          {newDocFiles.length > 0 ? (
            <p className="muted">
              {newDocFiles.length} {t("form.filesSelected")}
            </p>
          ) : null}
        </div>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? t("form.saving") : t("form.save")}
        </button>
      </form>
    </main>
  );
}

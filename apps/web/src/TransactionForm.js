import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AutocompleteField from "./AutocompleteField";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
const UNIT_OPTIONS = [
    { value: "kg", labelKey: "form.unit.kg" },
    { value: "ton", labelKey: "form.unit.ton" },
    { value: "piece", labelKey: "form.unit.piece" },
    { value: "carton", labelKey: "form.unit.carton" },
    { value: "pallet", labelKey: "form.unit.pallet" },
    { value: "cbm", labelKey: "form.unit.cbm" },
    { value: "liter", labelKey: "form.unit.liter" },
    { value: "set", labelKey: "form.unit.set" },
];
const QUALITY_OPTIONS = [
    { value: "new", labelKey: "form.quality.new" },
    { value: "like_new", labelKey: "form.quality.like_new" },
    { value: "used", labelKey: "form.quality.used" },
    { value: "refurbished", labelKey: "form.quality.refurbished" },
    { value: "damaged", labelKey: "form.quality.damaged" },
    { value: "mixed", labelKey: "form.quality.mixed" },
];
const CURRENCY_OPTIONS = ["AED", "USD", "EUR", "SAR"];
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
];
const PORT_TYPE_OPTIONS = ["Seaports", "Free Zones", "Mainland"];
const DOCUMENT_CATEGORY_OPTIONS = [
    { value: "bill_of_lading", label: "Bill of Lading" },
    { value: "certificate_of_origin", label: "Certificate of Origin" },
    { value: "invoice", label: "Invoice" },
    { value: "packing_list", label: "Packing List" },
];
const STAGE_OPTIONS = [
    "PREPARATION",
    "CUSTOMS_CLEARANCE",
    "STORAGE",
    "INTERNAL_DELIVERY",
    "EXTERNAL_TRANSFER",
];
function isoToDateInput(iso) {
    if (!iso)
        return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "";
    return d.toISOString().slice(0, 10);
}
const emptyForm = {
    clientName: "",
    shippingCompanyId: "",
    shippingCompanyName: "",
    declarationNumber: "",
    declarationDate: "",
    declarationType: "",
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
function appendOptionalNumber(fd, key, raw) {
    const t = raw.trim();
    if (t === "")
        return;
    const n = Number(t);
    if (!Number.isFinite(n))
        return;
    fd.append(key, String(n));
}
async function parseApiErrorMessage(res) {
    const text = await res.text();
    const status = res.status;
    try {
        const j = JSON.parse(text);
        const e = j.error;
        if (e == null)
            return text.trim() ? `HTTP ${status}: ${text.trim().slice(0, 400)}` : `HTTP ${status}`;
        if (typeof e === "string")
            return e;
        if (typeof e === "object" && e !== null)
            return JSON.stringify(e);
        return String(e);
    }
    catch {
        return text.trim() ? `HTTP ${status}: ${text.trim().slice(0, 400)}` : `HTTP ${status}`;
    }
}
export default function TransactionForm({ role }) {
    const { t, numberLocale } = useI18n();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [retainedDocs, setRetainedDocs] = useState([]);
    const [newDocFiles, setNewDocFiles] = useState([]);
    const [clients, setClients] = useState([]);
    const [shippingCompanies, setShippingCompanies] = useState([]);
    const [editMeta, setEditMeta] = useState(null);
    const [stage, setStage] = useState("PREPARATION");
    if (role === "accountant") {
        return (_jsxs("main", { className: "container", children: [_jsx("h1", { children: t("form.accessLimitedTitle") }), _jsx("p", { children: t("form.accessLimitedBody") }), _jsx(Link, { to: "/", className: "link-button", children: t("form.back") })] }));
    }
    useEffect(() => {
        apiFetch("/api/clients")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setClients(Array.isArray(data) ? data : []))
            .catch(() => setClients([]));
        apiFetch("/api/shipping-companies")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setShippingCompanies(Array.isArray(data) ? data : []))
            .catch(() => setShippingCompanies([]));
    }, []);
    useEffect(() => {
        if (!isEdit || !id)
            return;
        apiFetch(`/api/transactions/${id}`)
            .then((res) => {
            if (!res.ok)
                throw new Error("not-found");
            return res.json();
        })
            .then((data) => {
            setEditMeta({
                declarationNumber: data.declarationNumber,
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
                declarationDate: isoToDateInput(data.declarationDate),
                declarationType: data.declarationType ?? "",
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
                invoiceToWeightRateAedPerKg: data.invoiceToWeightRateAedPerKg != null ? String(data.invoiceToWeightRateAedPerKg) : "",
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
        if (!Number.isFinite(inv) || !Number.isFinite(rate) || rate <= 0)
            return null;
        return inv / rate;
    }, [form.invoiceValue, form.invoiceToWeightRateAedPerKg]);
    const clientSuggestions = useMemo(() => {
        const q = form.clientName.trim().toLowerCase();
        if (q.length < 1)
            return [];
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
    const shippingSuggestions = useMemo(() => {
        const q = form.shippingCompanyName.trim().toLowerCase();
        if (q.length < 1)
            return [];
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
    const onSubmit = async (event) => {
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
            if (form.shippingCompanyId?.trim())
                fd.append("shippingCompanyId", form.shippingCompanyId.trim());
            if (form.declarationNumber.trim())
                fd.append("declarationNumber", form.declarationNumber.trim());
            if (form.declarationDate)
                fd.append("declarationDate", form.declarationDate);
            if (form.declarationType.trim())
                fd.append("declarationType", form.declarationType.trim());
            if (form.portType.trim())
                fd.append("portType", form.portType.trim());
            fd.append("airwayBill", form.airwayBill);
            fd.append("hsCode", form.hsCode);
            fd.append("goodsDescription", form.goodsDescription);
            fd.append("originCountry", form.originCountry.toUpperCase());
            fd.append("invoiceValue", String(form.invoiceValue));
            if (form.invoiceCurrency)
                fd.append("invoiceCurrency", form.invoiceCurrency);
            fd.append("documentStatus", form.documentStatus);
            if (role !== "employee")
                fd.append("paymentStatus", form.paymentStatus);
            appendOptionalNumber(fd, "containerCount", form.containerCount);
            const weightStr = form.goodsWeightKg.trim() !== ""
                ? form.goodsWeightKg
                : derivedWeight != null
                    ? String(Math.round(derivedWeight * 1000) / 1000)
                    : "";
            appendOptionalNumber(fd, "goodsWeightKg", weightStr);
            appendOptionalNumber(fd, "invoiceToWeightRateAedPerKg", form.invoiceToWeightRateAedPerKg);
            if (form.containerArrivalDate)
                fd.append("containerArrivalDate", form.containerArrivalDate);
            if (form.documentArrivalDate)
                fd.append("documentArrivalDate", form.documentArrivalDate);
            if (form.fileNumber.trim())
                fd.append("fileNumber", form.fileNumber.trim());
            if (form.containerNumbers.trim()) {
                const values = form.containerNumbers
                    .split(/[\n,]+/)
                    .map((v) => v.trim())
                    .filter(Boolean);
                if (values.length)
                    fd.append("containerNumbers", JSON.stringify(values));
            }
            appendOptionalNumber(fd, "unitCount", form.unitCount);
            fd.append("isStopped", form.isStopped === "yes" ? "true" : "false");
            if (form.stopReason.trim())
                fd.append("stopReason", form.stopReason.trim());
            appendOptionalNumber(fd, "goodsQuantity", form.goodsQuantity);
            if (form.goodsQuality)
                fd.append("goodsQuality", form.goodsQuality);
            if (form.goodsUnit)
                fd.append("goodsUnit", form.goodsUnit);
            if (isEdit) {
                fd.append("existingAttachments", JSON.stringify(retainedDocs));
            }
            if (newDocFiles.some((item) => !item.category)) {
                setError("Please choose a category for each uploaded document.");
                return;
            }
            if (newDocFiles.length) {
                fd.append("documentPhotoCategories", JSON.stringify(newDocFiles.map((item) => item.category)));
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
            const data = (await res.json());
            navigate(`/transactions/${data.id}`);
        }
        catch {
            setError(t("form.saveError"));
        }
        finally {
            setLoading(false);
        }
    };
    const stageLabel = (value) => {
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
    const setTransactionStage = async (nextStage) => {
        if (!isEdit || !id || nextStage === stage)
            return;
        const res = await apiFetch(`/api/transactions/${id}/stage`, {
            method: "POST",
            body: JSON.stringify({ stage: nextStage }),
        });
        if (!res.ok) {
            const detail = await parseApiErrorMessage(res);
            setError(detail || "Failed to change stage");
            return;
        }
        const data = (await res.json());
        setStage(data.transactionStage);
        setEditMeta((prev) => prev ? { ...prev, transactionStage: data.transactionStage, clearanceStatus: data.clearanceStatus } : prev);
    };
    const prepEditable = !isEdit || stage === "PREPARATION";
    const customsEditable = !isEdit || stage === "CUSTOMS_CLEARANCE";
    const storageEditable = !isEdit || stage === "STORAGE";
    const fullyLocked = isEdit && (stage === "INTERNAL_DELIVERY" || stage === "EXTERNAL_TRANSFER");
    return (_jsxs("main", { className: "container", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: "/", className: "link-button", children: t("form.back") }) }), _jsx("h1", { children: isEdit ? t("form.editTitle") : t("form.newTitle") }), error ? _jsx("p", { className: "error", children: error }) : null, _jsxs("form", { className: "details-card form-grid", noValidate: true, onSubmit: onSubmit, children: [isEdit && editMeta ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "full-row", children: ["Transaction Stage", _jsx("select", { value: stage, onChange: (e) => setTransactionStage(e.target.value), disabled: fullyLocked, children: STAGE_OPTIONS.map((s) => (_jsx("option", { value: s, children: stageLabel(s) }, s))) })] }), _jsx("h2", { className: "form-section-title full-row", children: "Transaction Snapshot (Read-only)" }), editMeta.createdAt ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.createdAt"), ":"] }), " ", new Date(editMeta.createdAt).toLocaleString(numberLocale)] })) : null, editMeta.declarationNumber ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Declaration Number:" }), " ", editMeta.declarationNumber] })) : null, editMeta.releaseCode ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Release Code:" }), " ", editMeta.releaseCode] })) : null, typeof editMeta.customsDuty === "number" ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.duty"), ":"] }), " ", editMeta.customsDuty.toLocaleString(numberLocale), " ", t("details.currencySuffix")] })) : null, editMeta.clearanceStatus ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.status"), ":"] }), " ", editMeta.clearanceStatus] })) : null, _jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Stage:" }), " ", stageLabel(stage)] })] })) : null, _jsx("h2", { className: "form-section-title full-row", children: "Parties" }), _jsx(AutocompleteField, { label: t("form.clientName"), value: form.clientName, onChange: (clientName) => setForm({ ...form, clientName }), onSelectSuggestion: (key) => {
                            const c = clients.find((x) => x.id === key);
                            if (c)
                                setForm((f) => ({ ...f, clientName: c.companyName }));
                        }, suggestions: clientSuggestions, disabled: !prepEditable, required: true, hint: t("form.typeToSearch") }), _jsx(AutocompleteField, { label: t("form.shippingCompanyName"), value: form.shippingCompanyName, onChange: (shippingCompanyName) => setForm({ ...form, shippingCompanyName }), onSelectSuggestion: (key) => {
                            const s = shippingCompanies.find((x) => x.id === key);
                            if (s)
                                setForm((f) => ({ ...f, shippingCompanyName: s.companyName, shippingCompanyId: s.id }));
                        }, suggestions: shippingSuggestions, disabled: !prepEditable, required: true, hint: t("form.typeToSearch") }), _jsxs("label", { children: [t("form.shippingCompanyId"), _jsx("input", { disabled: !prepEditable, value: form.shippingCompanyId ?? "", onChange: (e) => setForm({ ...form, shippingCompanyId: e.target.value }) })] }), _jsx("h2", { className: "form-section-title full-row", children: "Customs Declaration" }), _jsxs("label", { children: ["Declaration Number", _jsx("input", { disabled: !prepEditable, value: form.declarationNumber, onChange: (e) => setForm({ ...form, declarationNumber: e.target.value }) })] }), _jsxs("label", { children: ["Declaration Date", _jsx("input", { disabled: !prepEditable, type: "date", value: form.declarationDate, onChange: (e) => setForm({ ...form, declarationDate: e.target.value }) })] }), _jsxs("label", { children: ["Declaration Type", _jsxs("select", { disabled: !prepEditable, value: form.declarationType, onChange: (e) => setForm({ ...form, declarationType: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), DECLARATION_TYPE_OPTIONS.map((option) => (_jsx("option", { value: option, children: option }, option)))] })] }), _jsxs("label", { children: ["Port Type", _jsxs("select", { disabled: !prepEditable, value: form.portType, onChange: (e) => setForm({ ...form, portType: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), PORT_TYPE_OPTIONS.map((option) => (_jsx("option", { value: option, children: option }, option)))] })] }), _jsx("h2", { className: "form-section-title full-row", children: "Shipment Core" }), _jsxs("label", { children: [t("form.airwayBill"), _jsx("input", { disabled: !prepEditable, value: form.airwayBill, onChange: (e) => setForm({ ...form, airwayBill: e.target.value }), required: true })] }), _jsxs("label", { children: [t("form.hsCode"), _jsx("input", { disabled: !prepEditable, value: form.hsCode, onChange: (e) => setForm({ ...form, hsCode: e.target.value }), required: true })] }), _jsxs("label", { children: [t("form.origin"), _jsx("input", { value: form.originCountry, disabled: !prepEditable, onChange: (e) => setForm({ ...form, originCountry: e.target.value }), minLength: 2, maxLength: 2, required: true })] }), _jsxs("label", { children: [t("form.invoiceValue"), _jsx("input", { type: "number", disabled: !prepEditable, value: form.invoiceValue, onChange: (e) => setForm({ ...form, invoiceValue: Number(e.target.value) }), min: 1, required: true })] }), _jsxs("label", { children: ["Currency", _jsx("select", { value: form.invoiceCurrency, disabled: !prepEditable, onChange: (e) => setForm({ ...form, invoiceCurrency: e.target.value }), children: CURRENCY_OPTIONS.map((currency) => (_jsx("option", { value: currency, children: currency }, currency))) })] }), _jsxs("label", { className: "full-row", children: [t("form.goodsDescription"), _jsx("textarea", { value: form.goodsDescription, disabled: !prepEditable, onChange: (e) => setForm({ ...form, goodsDescription: e.target.value }), rows: 3, required: true })] }), _jsx("h2", { className: "form-section-title full-row", children: "Cargo & Containers" }), _jsxs("label", { children: [t("form.invoiceToWeightRate"), _jsx("input", { type: "number", disabled: !prepEditable, min: 0, step: "any", value: form.invoiceToWeightRateAedPerKg, onChange: (e) => setForm({ ...form, invoiceToWeightRateAedPerKg: e.target.value }), placeholder: t("form.invoiceToWeightRateHint") })] }), _jsxs("label", { children: [t("form.goodsWeightKg"), _jsx("input", { type: "number", disabled: !prepEditable, min: 0, step: "any", value: form.goodsWeightKg, onChange: (e) => setForm({ ...form, goodsWeightKg: e.target.value }), placeholder: derivedWeight != null ? `${t("form.derivedWeight")}: ${derivedWeight.toFixed(3)}` : undefined })] }), _jsxs("label", { children: [t("form.containerCount"), _jsx("input", { type: "number", disabled: !prepEditable, min: 0, step: 1, value: form.containerCount, onChange: (e) => setForm({ ...form, containerCount: e.target.value }) })] }), _jsxs("label", { children: [t("form.containerArrivalDate"), _jsx("input", { type: "date", disabled: !customsEditable, value: form.containerArrivalDate, onChange: (e) => setForm({ ...form, containerArrivalDate: e.target.value }) })] }), _jsxs("label", { children: [t("form.goodsQuantity"), _jsx("input", { type: "number", disabled: !prepEditable, min: 0, step: "any", value: form.goodsQuantity, onChange: (e) => setForm({ ...form, goodsQuantity: e.target.value }) })] }), _jsxs("label", { children: [t("form.goodsQuality"), _jsxs("select", { value: form.goodsQuality, disabled: !prepEditable, onChange: (e) => setForm({ ...form, goodsQuality: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), QUALITY_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value)))] })] }), _jsxs("label", { children: [t("form.goodsUnit"), _jsxs("select", { disabled: !prepEditable, value: form.goodsUnit, onChange: (e) => setForm({ ...form, goodsUnit: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), UNIT_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value)))] })] }), _jsxs("label", { children: [t("form.documentArrivalDate"), _jsx("input", { type: "date", disabled: !customsEditable, value: form.documentArrivalDate, onChange: (e) => setForm({ ...form, documentArrivalDate: e.target.value }) })] }), _jsxs("label", { children: ["File Number", _jsx("input", { value: form.fileNumber, disabled: !customsEditable, onChange: (e) => setForm({ ...form, fileNumber: e.target.value }) })] }), _jsxs("label", { children: ["Container Numbers", _jsx("textarea", { value: form.containerNumbers, disabled: !storageEditable, onChange: (e) => setForm({ ...form, containerNumbers: e.target.value }), rows: 3, placeholder: "e.g. MSKU1234567, TGHU9876543" })] }), _jsxs("label", { children: ["Number of Units", _jsx("input", { type: "number", disabled: !storageEditable, min: 0, step: 1, value: form.unitCount, onChange: (e) => setForm({ ...form, unitCount: e.target.value }) })] }), _jsx("h2", { className: "form-section-title full-row", children: "Workflow & Status" }), _jsxs("label", { children: ["Stop Transaction", _jsxs("select", { disabled: !storageEditable, value: form.isStopped, onChange: (e) => setForm({ ...form, isStopped: e.target.value }), children: [_jsx("option", { value: "no", children: "No" }), _jsx("option", { value: "yes", children: "Yes" })] })] }), form.isStopped === "yes" ? (_jsxs("label", { children: ["Stop Reason", _jsx("textarea", { value: form.stopReason, disabled: !storageEditable, onChange: (e) => setForm({ ...form, stopReason: e.target.value }), rows: 2, required: true })] })) : null, _jsxs("label", { children: [t("form.documentStatus"), _jsxs("select", { value: form.documentStatus, disabled: !customsEditable, onChange: (e) => setForm({ ...form, documentStatus: e.target.value }), children: [_jsx("option", { value: "copy_received", children: "copy_received" }), _jsx("option", { value: "original_received", children: "original_received" }), _jsx("option", { value: "telex_release", children: "telex_release" })] })] }), _jsxs("label", { children: [t("form.paymentStatus"), _jsxs("select", { value: form.paymentStatus, onChange: (e) => setForm({ ...form, paymentStatus: e.target.value }), disabled: !customsEditable || role === "employee", children: [_jsx("option", { value: "pending", children: "pending" }), _jsx("option", { value: "paid", children: "paid" })] })] }), _jsx("h2", { className: "form-section-title full-row", children: "Attachments" }), _jsxs("div", { className: "full-row doc-upload-block doc-upload-prominent", children: [_jsx("h2", { className: "doc-upload-heading", children: t("form.documentPhotosSection") }), _jsx("p", { className: "muted", children: t("form.documentPhotosHelp") }), isEdit && retainedDocs.length > 0 ? (_jsx("ul", { className: "retained-docs", children: retainedDocs.map((d) => (_jsxs("li", { children: [_jsxs("span", { children: [d.originalName, d.category ? ` (${DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === d.category)?.label ?? d.category})` : ""] }), _jsx("button", { type: "button", className: "link-button", disabled: !prepEditable, onClick: () => setRetainedDocs((prev) => prev.filter((x) => x.path !== d.path)), children: t("form.removeAttachment") })] }, d.path))) })) : null, _jsx("input", { type: "file", accept: "image/*,application/pdf", multiple: true, disabled: !prepEditable, onChange: (e) => setNewDocFiles(Array.from(e.target.files ?? []).map((file) => ({
                                    file,
                                    category: "",
                                }))) }), newDocFiles.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "muted", children: [newDocFiles.length, " ", t("form.filesSelected")] }), _jsx("div", { className: "full-row", children: newDocFiles.map((item, idx) => (_jsxs("label", { children: [item.file.name, _jsxs("select", { value: item.category, disabled: !prepEditable, onChange: (e) => setNewDocFiles((prev) => prev.map((p, i) => i === idx ? { ...p, category: e.target.value } : p)), required: true, children: [_jsx("option", { value: "", children: "Select document category" }), DOCUMENT_CATEGORY_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] })] }, `${item.file.name}-${idx}`))) })] })) : null] }), _jsx("button", { className: "primary-button", type: "submit", disabled: loading || fullyLocked, children: loading ? t("form.saving") : t("form.save") })] })] }));
}

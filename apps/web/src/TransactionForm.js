import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { transactionListPath } from "./paths";
import AutocompleteField from "./AutocompleteField";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { API_BASE, } from "./types";
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
const DECLARATION_TYPE_OPTIONS_BY_MODULE = {
    transactions: [
        { value: "Import", labelKey: "form.declarationType.import" },
        { value: "Import to Free Zone", labelKey: "form.declarationType.import_free_zone" },
        { value: "Import for Re-Export", labelKey: "form.declarationType.import_re_export" },
        { value: "Temporary Import", labelKey: "form.declarationType.temporary_import" },
        { value: "Transitin", labelKey: "form.declarationType.transitin" },
        { value: "Transitin from GCC", labelKey: "form.declarationType.transitin_gcc" },
    ],
    transfers: [{ value: "Transfer", labelKey: "form.declarationType.transfer" }],
    exports: [
        { value: "Export", labelKey: "form.declarationType.export" },
        { value: "Transit out", labelKey: "form.declarationType.transit_out" },
        { value: "Export to GCC", labelKey: "form.declarationType.export_gcc" },
    ],
};
const PORT_TYPE_OPTIONS = [
    { value: "Seaports", labelKey: "form.portType.seaports" },
    { value: "Free Zones", labelKey: "form.portType.free_zones" },
    { value: "Mainland", labelKey: "form.portType.mainland" },
];
const DOCUMENT_CATEGORY_OPTIONS = [
    { value: "bill_of_lading", labelKey: "docCategory.bill_of_lading" },
    { value: "certificate_of_origin", labelKey: "docCategory.certificate_of_origin" },
    { value: "invoice", labelKey: "docCategory.invoice" },
    { value: "packing_list", labelKey: "docCategory.packing_list" },
];
const STAGE_OPTIONS = [
    "PREPARATION",
    "CUSTOMS_CLEARANCE",
    "TRANSPORTATION",
    "STORAGE",
];
function isoToDateInput(iso) {
    if (!iso)
        return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "";
    return d.toISOString().slice(0, 10);
}
function isImageFile(name) {
    return /\.(png|jpe?g|gif|webp)$/i.test(name);
}
function categoryLabel(category, t) {
    if (!category)
        return t ? t("docCategory.uncategorized") : "Uncategorized";
    const key = DOCUMENT_CATEGORY_OPTIONS.find((o) => o.value === category)?.labelKey;
    return key && t ? t(key) : category;
}
const emptyForm = {
    clientName: "",
    shippingCompanyId: "",
    shippingCompanyName: "",
    declarationNumber: "",
    declarationNumber2: "",
    declarationDate: "",
    orderDate: "",
    declarationType: "",
    declarationType2: "",
    portType: "",
    containerSize: "",
    portOfLading: "",
    portOfDischarge: "",
    destination: "",
    transportationTo: "",
    trachNo: "",
    transportationCompany: "",
    transportationFrom: "",
    transportationToLocation: "",
    tripCharge: "",
    waitingCharge: "",
    maccrikCharge: "",
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
    unitNumber: "",
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
export default function TransactionForm({ role, module = "transactions", }) {
    const { t, numberLocale } = useI18n();
    const navigate = useNavigate();
    const { id: routeId } = useParams();
    /** Treat `/transactions/new` style id as create, not edit (Boolean("new") is truthy). */
    const isEdit = Boolean(routeId && routeId !== "new");
    const [form, setForm] = useState(emptyForm);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [retainedDocs, setRetainedDocs] = useState([]);
    const [newDocFiles, setNewDocFiles] = useState([]);
    const [clients, setClients] = useState([]);
    const [shippingCompanies, setShippingCompanies] = useState([]);
    const [editMeta, setEditMeta] = useState(null);
    const [stage, setStage] = useState("PREPARATION");
    if ((role === "accountant" || role === "employee2") && !isEdit) {
        return (_jsxs("main", { className: "container py-2", children: [_jsx("h1", { className: "display-6 fw-bold mb-2", children: t("form.accessLimitedTitle") }), _jsx("p", { children: t("form.accessLimitedBody") }), _jsx(Link, { to: "/", className: "btn btn-outline-secondary btn-sm", children: t("form.back") })] }));
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
        if (!isEdit || !routeId)
            return;
        apiFetch(`/api/${module}/${routeId}`)
            .then((res) => {
            if (!res.ok)
                throw new Error("not-found");
            return res.json();
        })
            .then((data) => {
            setEditMeta({
                declarationNumber: data.declarationNumber,
                declarationNumber2: data.declarationNumber2,
                releaseCode: data.releaseCode,
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
                orderDate: isoToDateInput(data.orderDate),
                declarationType: data.declarationType ?? "",
                declarationType2: data.declarationType2 ?? "",
                portType: data.portType ?? "",
                containerSize: data.containerSize ?? "",
                portOfLading: data.portOfLading ?? "",
                portOfDischarge: data.portOfDischarge ?? "",
                destination: data.destination ?? "",
                transportationTo: data.transportationTo ?? "",
                trachNo: data.trachNo ?? "",
                transportationCompany: data.transportationCompany ?? "",
                transportationFrom: data.transportationFrom ?? "",
                transportationToLocation: data.transportationToLocation ?? "",
                tripCharge: data.tripCharge != null ? String(data.tripCharge) : "",
                waitingCharge: data.waitingCharge != null ? String(data.waitingCharge) : "",
                maccrikCharge: data.maccrikCharge != null ? String(data.maccrikCharge) : "",
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
                unitNumber: data.unitNumber != null ? String(data.unitNumber) : "",
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
    }, [routeId, isEdit, t, module]);
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
    const groupedRetainedDocs = useMemo(() => {
        const groups = new Map();
        for (const d of retainedDocs) {
            const key = categoryLabel(d.category, t);
            const arr = groups.get(key) ?? [];
            arr.push(d);
            groups.set(key, arr);
        }
        return Array.from(groups.entries());
    }, [retainedDocs]);
    const onSubmit = async (event) => {
        event.preventDefault();
        const formEl = event.currentTarget;
        // Without noValidate on <form>, invalid fields block the submit event entirely — React never runs this handler ("nothing happens").
        if (!formEl.checkValidity()) {
            setError(t("form.validationError"));
            formEl.reportValidity();
            return;
        }
        setError("");
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append("clientName", form.clientName);
            const effectiveShippingCompanyName = module === "transactions"
                ? form.shippingCompanyName
                : form.destination.trim() || form.portOfDischarge.trim() || "N/A";
            const effectiveAirwayBill = module === "transactions" ? form.airwayBill : form.portOfLading.trim() || "N/A";
            const effectiveInvoiceValue = module === "transactions" ? Number(form.invoiceValue) : Math.max(1, Number(form.invoiceValue) || 1);
            fd.append("shippingCompanyName", effectiveShippingCompanyName);
            if (form.shippingCompanyId?.trim())
                fd.append("shippingCompanyId", form.shippingCompanyId.trim());
            if (form.declarationNumber.trim())
                fd.append("declarationNumber", form.declarationNumber.trim());
            if (form.declarationNumber2.trim())
                fd.append("declarationNumber2", form.declarationNumber2.trim());
            if (form.declarationDate)
                fd.append("declarationDate", form.declarationDate);
            if (form.orderDate)
                fd.append("orderDate", form.orderDate);
            if (form.declarationType.trim())
                fd.append("declarationType", form.declarationType.trim());
            if (form.declarationType2.trim())
                fd.append("declarationType2", form.declarationType2.trim());
            if (form.portType.trim())
                fd.append("portType", form.portType.trim());
            if (form.containerSize.trim())
                fd.append("containerSize", form.containerSize.trim());
            if (form.portOfLading.trim())
                fd.append("portOfLading", form.portOfLading.trim());
            if (form.portOfDischarge.trim())
                fd.append("portOfDischarge", form.portOfDischarge.trim());
            if (form.destination.trim())
                fd.append("destination", form.destination.trim());
            if (form.transportationTo.trim())
                fd.append("transportationTo", form.transportationTo.trim());
            if (form.trachNo.trim())
                fd.append("trachNo", form.trachNo.trim());
            if (form.transportationCompany.trim())
                fd.append("transportationCompany", form.transportationCompany.trim());
            if (form.transportationFrom.trim())
                fd.append("transportationFrom", form.transportationFrom.trim());
            if (form.transportationToLocation.trim())
                fd.append("transportationToLocation", form.transportationToLocation.trim());
            appendOptionalNumber(fd, "tripCharge", form.tripCharge);
            appendOptionalNumber(fd, "waitingCharge", form.waitingCharge);
            appendOptionalNumber(fd, "maccrikCharge", form.maccrikCharge);
            fd.append("airwayBill", effectiveAirwayBill);
            fd.append("hsCode", form.hsCode);
            fd.append("goodsDescription", form.goodsDescription);
            fd.append("originCountry", form.originCountry.toUpperCase());
            fd.append("invoiceValue", String(effectiveInvoiceValue));
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
            appendOptionalNumber(fd, "unitNumber", form.unitNumber);
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
                setError(t("form.categoryRequiredError"));
                return;
            }
            if (newDocFiles.length) {
                fd.append("documentPhotoCategories", JSON.stringify(newDocFiles.map((item) => item.category)));
            }
            for (const item of newDocFiles) {
                fd.append("documentPhotos", item.file);
            }
            const res = await apiFetch(`/api/${module}${isEdit ? `/${routeId}` : ""}`, {
                method: isEdit ? "PUT" : "POST",
                body: fd,
            });
            if (!res.ok) {
                const detail = await parseApiErrorMessage(res);
                setError(detail ? `${t("form.saveError")} (${detail})` : t("form.saveError"));
                return;
            }
            const data = (await res.json());
            navigate(`${transactionListPath(module)}/${data.id}`);
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
                return t("stage.PREPARATION");
            case "CUSTOMS_CLEARANCE":
                return t("stage.CUSTOMS_CLEARANCE");
            case "TRANSPORTATION":
                return t("stage.TRANSPORTATION");
            case "STORAGE":
                return t("stage.STORAGE");
            default:
                return value;
        }
    };
    const setTransactionStage = async (nextStage) => {
        if (!isEdit || !routeId || nextStage === stage)
            return;
        const res = await apiFetch(`/api/${module}/${routeId}/stage`, {
            method: "POST",
            body: JSON.stringify({ stage: nextStage }),
        });
        if (!res.ok) {
            const detail = await parseApiErrorMessage(res);
            setError(detail || t("form.stageChangeError"));
            return;
        }
        const data = (await res.json());
        setStage(data.transactionStage);
        setEditMeta((prev) => prev ? { ...prev, transactionStage: data.transactionStage, clearanceStatus: data.clearanceStatus } : prev);
    };
    const prepEditable = !isEdit || stage === "PREPARATION" || stage === "CUSTOMS_CLEARANCE";
    const customsEditable = !isEdit || stage === "PREPARATION" || stage === "CUSTOMS_CLEARANCE";
    const storageEditable = !isEdit || stage === "PREPARATION" || stage === "STORAGE";
    /** Imports & transfers in Storage: only warehouse fields stay editable (API-enforced). */
    const storageOnlyImportTransfer = isEdit && stage === "STORAGE" && (module === "transactions" || module === "transfers");
    const prepEditableEffective = prepEditable && !storageOnlyImportTransfer;
    const customsEditableEffective = customsEditable && !storageOnlyImportTransfer;
    const legacyStorageEditable = storageEditable && !storageOnlyImportTransfer;
    const fullyLocked = storageOnlyImportTransfer;
    /** Stage can move forward or back; only manager and employee2 may call the API. */
    const canSetStage = role === "manager" || role === "employee2";
    /** Customs Declaration + file number: hidden for new transactions and in Preparation; visible from Customs clearance onward when editing. */
    const showCustomsDeclarationSection = isEdit && stage !== "PREPARATION";
    const isTransferOrExport = module === "transfers" || module === "exports";
    const declarationTypeOptions = DECLARATION_TYPE_OPTIONS_BY_MODULE[module];
    const moduleStageOptions = module === "exports" ? ["PREPARATION", "CUSTOMS_CLEARANCE", "TRANSPORTATION"] : STAGE_OPTIONS;
    if (isTransferOrExport) {
        const transferWarehouseOnly = isEdit && stage === "STORAGE" && module === "transfers";
        return (_jsxs("main", { className: "container py-2", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: `/${module}`, className: "btn btn-outline-secondary btn-sm", children: t("form.back") }) }), _jsx("h1", { className: "display-6 fw-bold mb-3", children: module === "transfers"
                        ? isEdit
                            ? t("transfer.form.editTitle")
                            : t("transfer.form.newTitle")
                        : isEdit
                            ? t("export.form.editTitle")
                            : t("export.form.newTitle") }), error ? _jsx("p", { className: "error alert alert-danger", children: error }) : null, _jsx("form", { className: "card shadow-sm mb-4", noValidate: true, onSubmit: onSubmit, children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row g-3", children: [isEdit ? (_jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("form.stage"), _jsx("select", { className: "form-select mt-1", value: stage, onChange: (e) => setTransactionStage(e.target.value), disabled: !canSetStage, children: moduleStageOptions.map((s) => (_jsx("option", { value: s, children: stageLabel(s) }, s))) })] })) : null, transferWarehouseOnly && routeId ? (_jsxs("div", { className: "col-12", children: [_jsx("p", { className: "muted", role: "status", children: t("form.storage.readOnlyHint") }), _jsx(Link, { to: `/${module}/${routeId}/storage`, className: "btn btn-primary btn-sm", style: { display: "inline-block", marginTop: 8 }, children: t("form.storage.openDedicatedPage") })] })) : null, _jsx(AutocompleteField, { label: t("form.clientName"), value: form.clientName, onChange: (clientName) => setForm({ ...form, clientName }), onSelectSuggestion: (key) => {
                                        const c = clients.find((x) => x.id === key);
                                        if (c)
                                            setForm((f) => ({ ...f, clientName: c.companyName }));
                                    }, suggestions: clientSuggestions, disabled: !prepEditableEffective, required: true, hint: t("form.typeToSearch") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.orderDate"), _jsx("input", { className: "form-control mt-1", type: "date", disabled: transferWarehouseOnly, value: form.orderDate, onChange: (e) => setForm({ ...form, orderDate: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.containerCount"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: 1, disabled: transferWarehouseOnly, value: form.containerCount, onChange: (e) => setForm({ ...form, containerCount: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.containerSize"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.containerSize, onChange: (e) => setForm({ ...form, containerSize: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.portOfLading"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.portOfLading, onChange: (e) => setForm({ ...form, portOfLading: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.portOfDischarge"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.portOfDischarge, onChange: (e) => setForm({ ...form, portOfDischarge: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.destination"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.destination, onChange: (e) => setForm({ ...form, destination: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsWeightKg"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", disabled: transferWarehouseOnly, value: form.goodsWeightKg, onChange: (e) => setForm({ ...form, goodsWeightKg: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.origin"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.originCountry, onChange: (e) => setForm({ ...form, originCountry: e.target.value }), minLength: 2, maxLength: 2, required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.unitNumber"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: 1, disabled: transferWarehouseOnly, value: form.unitNumber, onChange: (e) => setForm({ ...form, unitNumber: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("form.goodsDescription"), _jsx("textarea", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.goodsDescription, onChange: (e) => setForm({ ...form, goodsDescription: e.target.value }), rows: 3, required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsUnit"), _jsxs("select", { className: "form-select mt-1", disabled: transferWarehouseOnly, value: form.goodsUnit, onChange: (e) => setForm({ ...form, goodsUnit: e.target.value }), required: true, children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), UNIT_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value)))] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.stopTransaction"), _jsxs("select", { className: "form-select mt-1", disabled: transferWarehouseOnly, value: form.isStopped, onChange: (e) => setForm({ ...form, isStopped: e.target.value }), children: [_jsx("option", { value: "no", children: t("form.no") }), _jsx("option", { value: "yes", children: t("form.yes") })] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.hsCode"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.hsCode, onChange: (e) => setForm({ ...form, hsCode: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsQuality"), _jsxs("select", { className: "form-select mt-1", disabled: transferWarehouseOnly, value: form.goodsQuality, onChange: (e) => setForm({ ...form, goodsQuality: e.target.value }), required: true, children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), QUALITY_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value)))] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsQuantity"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", disabled: transferWarehouseOnly, value: form.goodsQuantity, onChange: (e) => setForm({ ...form, goodsQuantity: e.target.value }), required: true })] }), showCustomsDeclarationSection ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.customsDeclarationSection") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.fileNumber"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.fileNumber, onChange: (e) => setForm({ ...form, fileNumber: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationNumber1"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.declarationNumber, onChange: (e) => setForm({ ...form, declarationNumber: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationNumber2"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.declarationNumber2, onChange: (e) => setForm({ ...form, declarationNumber2: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationDate"), _jsx("input", { className: "form-control mt-1", type: "date", disabled: transferWarehouseOnly, value: form.declarationDate, onChange: (e) => setForm({ ...form, declarationDate: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationType1"), _jsxs("select", { className: "form-select mt-1", disabled: transferWarehouseOnly, value: form.declarationType, onChange: (e) => setForm({ ...form, declarationType: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), declarationTypeOptions.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationType2"), _jsxs("select", { className: "form-select mt-1", disabled: transferWarehouseOnly, value: form.declarationType2, onChange: (e) => setForm({ ...form, declarationType2: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), declarationTypeOptions.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.portType"), _jsxs("select", { className: "form-select mt-1", disabled: transferWarehouseOnly, value: form.portType, onChange: (e) => setForm({ ...form, portType: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), PORT_TYPE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] })] })) : null, isEdit && (stage === "TRANSPORTATION" || stage === "STORAGE") ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("transportation.sectionTitle") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.toUpper"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.transportationTo, onChange: (e) => setForm({ ...form, transportationTo: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.trachNo"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.trachNo, onChange: (e) => setForm({ ...form, trachNo: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.company"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.transportationCompany, onChange: (e) => setForm({ ...form, transportationCompany: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.from"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.transportationFrom, onChange: (e) => setForm({ ...form, transportationFrom: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.to"), _jsx("input", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.transportationToLocation, onChange: (e) => setForm({ ...form, transportationToLocation: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.tripCharge"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", disabled: transferWarehouseOnly, value: form.tripCharge, onChange: (e) => setForm({ ...form, tripCharge: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.waitingCharge"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", disabled: transferWarehouseOnly, value: form.waitingCharge, onChange: (e) => setForm({ ...form, waitingCharge: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("transportation.maccrikCharge"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", disabled: transferWarehouseOnly, value: form.maccrikCharge, onChange: (e) => setForm({ ...form, maccrikCharge: e.target.value }) })] })] })) : null, form.isStopped === "yes" ? (_jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("form.stopReason"), _jsx("textarea", { className: "form-control mt-1", disabled: transferWarehouseOnly, value: form.stopReason, onChange: (e) => setForm({ ...form, stopReason: e.target.value }), rows: 2, required: true })] })) : null, _jsxs("div", { className: "col-12 doc-upload-block doc-upload-prominent", children: [_jsx("h2", { className: "doc-upload-heading", children: t("form.documentPhotosSection") }), _jsx("p", { className: "muted", children: t("form.documentPhotosHelp") }), _jsx("input", { className: "form-control mt-1", type: "file", accept: "image/*,application/pdf", multiple: true, disabled: transferWarehouseOnly, onChange: (e) => setNewDocFiles(Array.from(e.target.files ?? []).map((file) => ({
                                                file,
                                                category: "",
                                            }))) }), newDocFiles.length > 0 ? (_jsx("div", { className: "col-12", children: newDocFiles.map((item, idx) => (_jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [item.file.name, _jsxs("select", { className: "form-select mt-1", value: item.category, disabled: transferWarehouseOnly, onChange: (e) => setNewDocFiles((prev) => prev.map((p, i) => (i === idx ? { ...p, category: e.target.value } : p))), required: true, children: [_jsx("option", { value: "", children: t("form.selectDocumentCategory") }), DOCUMENT_CATEGORY_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] }, `${item.file.name}-${idx}`))) })) : null] }), _jsx("div", { className: "col-12", children: _jsx("button", { className: "btn btn-primary", type: "submit", disabled: loading || transferWarehouseOnly, children: loading ? t("form.saving") : t("form.save") }) })] }) }) })] }));
    }
    return (_jsxs("main", { className: "container py-2", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: transactionListPath(module), className: "btn btn-outline-secondary btn-sm", children: t("form.back") }) }), _jsx("h1", { className: "display-6 fw-bold mb-3", children: module === "transactions"
                    ? isEdit
                        ? t("form.editTitle")
                        : t("form.newTitle")
                    : module === "transfers"
                        ? isEdit
                            ? t("transfer.form.editTitle")
                            : t("transfer.form.newTitle")
                        : isEdit
                            ? t("export.form.editTitle")
                            : t("export.form.newTitle") }), error ? _jsx("p", { className: "error alert alert-danger", children: error }) : null, _jsx("form", { className: "card shadow-sm mb-4", noValidate: true, onSubmit: onSubmit, children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row g-3", children: [isEdit && editMeta ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("form.stage"), _jsx("select", { className: "form-select mt-1", value: stage, onChange: (e) => setTransactionStage(e.target.value), disabled: !canSetStage, children: moduleStageOptions.map((s) => (_jsx("option", { value: s, children: stageLabel(s) }, s))) })] }), _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.snapshotReadOnly") }), editMeta.createdAt ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.createdAt"), ":"] }), " ", new Date(editMeta.createdAt).toLocaleString(numberLocale)] })) : null, editMeta.declarationNumber ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationNumber1"), ":"] }), " ", editMeta.declarationNumber] })) : null, editMeta.declarationNumber2 ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationNumber2"), ":"] }), " ", editMeta.declarationNumber2] })) : null, editMeta.releaseCode ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.releaseCode"), ":"] }), " ", editMeta.releaseCode] })) : null, editMeta.clearanceStatus ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.status"), ":"] }), " ", editMeta.clearanceStatus] })) : null, _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.stage"), ":"] }), " ", stageLabel(stage)] }), storageOnlyImportTransfer && routeId ? (_jsxs("div", { className: "details-item col-12", children: [_jsx("p", { className: "muted", role: "status", children: t("form.storage.readOnlyHint") }), _jsx(Link, { to: `/${module}/${routeId}/storage`, className: "btn btn-primary btn-sm", style: { display: "inline-block", marginTop: 8 }, children: t("form.storage.openDedicatedPage") })] })) : null] })) : null, showCustomsDeclarationSection ? (_jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.fileNumber"), _jsx("input", { className: "form-control mt-1", value: form.fileNumber, disabled: !customsEditableEffective, onChange: (e) => setForm({ ...form, fileNumber: e.target.value }) })] })) : null, _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.partiesSection") }), _jsx(AutocompleteField, { label: t("form.clientName"), value: form.clientName, onChange: (clientName) => setForm({ ...form, clientName }), onSelectSuggestion: (key) => {
                                    const c = clients.find((x) => x.id === key);
                                    if (c)
                                        setForm((f) => ({ ...f, clientName: c.companyName }));
                                }, suggestions: clientSuggestions, disabled: !prepEditableEffective, required: true, hint: t("form.typeToSearch") }), _jsx(AutocompleteField, { label: t("form.shippingCompanyName"), value: form.shippingCompanyName, onChange: (shippingCompanyName) => setForm({ ...form, shippingCompanyName }), onSelectSuggestion: (key) => {
                                    const s = shippingCompanies.find((x) => x.id === key);
                                    if (s)
                                        setForm((f) => ({ ...f, shippingCompanyName: s.companyName, shippingCompanyId: s.id }));
                                }, suggestions: shippingSuggestions, disabled: !prepEditableEffective, required: true, hint: t("form.typeToSearch") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.shippingCompanyId"), _jsx("input", { className: "form-control mt-1", disabled: !prepEditableEffective, value: form.shippingCompanyId ?? "", onChange: (e) => setForm({ ...form, shippingCompanyId: e.target.value }) })] }), showCustomsDeclarationSection ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.customsDeclarationSection") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationNumber1"), _jsx("input", { className: "form-control mt-1", disabled: !customsEditableEffective, maxLength: 120, value: form.declarationNumber, onChange: (e) => setForm({ ...form, declarationNumber: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationDate"), _jsx("input", { className: "form-control mt-1", disabled: !customsEditableEffective, type: "date", value: form.declarationDate, onChange: (e) => setForm({ ...form, declarationDate: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationType1"), _jsxs("select", { className: "form-select mt-1", disabled: !customsEditableEffective, value: form.declarationType, onChange: (e) => setForm({ ...form, declarationType: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), declarationTypeOptions.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationNumber2"), _jsx("input", { className: "form-control mt-1", disabled: !customsEditableEffective, maxLength: 120, value: form.declarationNumber2, onChange: (e) => setForm({ ...form, declarationNumber2: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.declarationType2"), _jsxs("select", { className: "form-select mt-1", disabled: !customsEditableEffective, value: form.declarationType2, onChange: (e) => setForm({ ...form, declarationType2: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), declarationTypeOptions.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.portType"), _jsxs("select", { className: "form-select mt-1", disabled: !customsEditableEffective, value: form.portType, onChange: (e) => setForm({ ...form, portType: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), PORT_TYPE_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] })] })) : null, _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.shipmentCoreSection") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.airwayBill"), _jsx("input", { className: "form-control mt-1", disabled: !prepEditableEffective, value: form.airwayBill, onChange: (e) => setForm({ ...form, airwayBill: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.hsCode"), _jsx("input", { className: "form-control mt-1", disabled: !prepEditableEffective, value: form.hsCode, onChange: (e) => setForm({ ...form, hsCode: e.target.value }), required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.origin"), _jsx("input", { className: "form-control mt-1", value: form.originCountry, disabled: !prepEditableEffective, onChange: (e) => setForm({ ...form, originCountry: e.target.value }), minLength: 2, maxLength: 2, required: true })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.currency"), _jsx("select", { className: "form-select mt-1", value: form.invoiceCurrency, disabled: !prepEditableEffective, onChange: (e) => setForm({ ...form, invoiceCurrency: e.target.value }), children: CURRENCY_OPTIONS.map((currency) => (_jsx("option", { value: currency, children: currency }, currency))) })] }), _jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("form.goodsDescription"), _jsx("textarea", { className: "form-control mt-1", value: form.goodsDescription, disabled: !prepEditableEffective, onChange: (e) => setForm({ ...form, goodsDescription: e.target.value }), rows: 3, required: true })] }), !isEdit ? (_jsx(_Fragment, { children: _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.numberOfUnits"), _jsx("input", { className: "form-control mt-1", type: "number", disabled: !legacyStorageEditable, min: 0, step: 1, value: form.unitCount, onChange: (e) => setForm({ ...form, unitCount: e.target.value }) })] }) })) : null, _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.cargoContainersSection") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsWeightKg"), _jsx("input", { className: "form-control mt-1", type: "number", disabled: !prepEditableEffective, min: 0, step: "any", value: form.goodsWeightKg, onChange: (e) => setForm({ ...form, goodsWeightKg: e.target.value }), placeholder: derivedWeight != null ? `${t("form.derivedWeight")}: ${derivedWeight.toFixed(3)}` : undefined })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.containerCount"), _jsx("input", { className: "form-control mt-1", type: "number", disabled: !prepEditableEffective, min: 0, step: 1, value: form.containerCount, onChange: (e) => setForm({ ...form, containerCount: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.containerArrivalDate"), _jsx("input", { className: "form-control mt-1", type: "date", disabled: !customsEditableEffective, value: form.containerArrivalDate, onChange: (e) => setForm({ ...form, containerArrivalDate: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsQuantity"), _jsx("input", { className: "form-control mt-1", type: "number", disabled: !prepEditableEffective, min: 0, step: "any", value: form.goodsQuantity, onChange: (e) => setForm({ ...form, goodsQuantity: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsQuality"), _jsxs("select", { className: "form-select mt-1", value: form.goodsQuality, disabled: !prepEditableEffective, onChange: (e) => setForm({ ...form, goodsQuality: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), QUALITY_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value)))] })] }), isEdit ? (_jsxs(_Fragment, { children: [_jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.goodsUnit"), _jsxs("select", { className: "form-select mt-1", disabled: !prepEditableEffective, value: form.goodsUnit, onChange: (e) => setForm({ ...form, goodsUnit: e.target.value }), children: [_jsx("option", { value: "", children: t("form.optionalSelect") }), UNIT_OPTIONS.map((o) => (_jsx("option", { value: o.value, children: t(o.labelKey) }, o.value)))] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.numberOfUnits"), _jsx("input", { className: "form-control mt-1", type: "number", disabled: !legacyStorageEditable, min: 0, step: 1, value: form.unitCount, onChange: (e) => setForm({ ...form, unitCount: e.target.value }) })] })] })) : null, _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.documentArrivalDate"), _jsx("input", { className: "form-control mt-1", type: "date", disabled: !customsEditableEffective, value: form.documentArrivalDate, onChange: (e) => setForm({ ...form, documentArrivalDate: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.containerNumbers"), _jsx("textarea", { className: "form-control mt-1", value: form.containerNumbers, disabled: !legacyStorageEditable, onChange: (e) => setForm({ ...form, containerNumbers: e.target.value }), rows: 3, placeholder: t("form.containerNumbersPlaceholder") })] }), _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.workflowStatusSection") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.stopTransaction"), _jsxs("select", { className: "form-select mt-1", disabled: !legacyStorageEditable, value: form.isStopped, onChange: (e) => setForm({ ...form, isStopped: e.target.value }), children: [_jsx("option", { value: "no", children: t("form.no") }), _jsx("option", { value: "yes", children: t("form.yes") })] })] }), form.isStopped === "yes" ? (_jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.stopReason"), _jsx("textarea", { className: "form-control mt-1", value: form.stopReason, disabled: !legacyStorageEditable, onChange: (e) => setForm({ ...form, stopReason: e.target.value }), rows: 2, required: true })] })) : null, _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.documentStatus"), _jsxs("select", { className: "form-select mt-1", value: form.documentStatus, disabled: !customsEditableEffective, onChange: (e) => setForm({ ...form, documentStatus: e.target.value }), children: [_jsx("option", { value: "copy_received", children: t("form.documentStatus.copy_received") }), _jsx("option", { value: "original_received", children: t("form.documentStatus.original_received") }), _jsx("option", { value: "telex_release", children: t("form.documentStatus.telex_release") })] })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.paymentStatus"), _jsxs("select", { className: "form-select mt-1", value: form.paymentStatus, onChange: (e) => setForm({ ...form, paymentStatus: e.target.value }), disabled: !customsEditableEffective || role === "employee" || role === "employee2", children: [_jsx("option", { value: "pending", children: t("form.paymentStatus.pending") }), _jsx("option", { value: "paid", children: t("form.paymentStatus.paid") })] })] }), _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("form.attachmentsSection") }), _jsxs("div", { className: "col-12 doc-upload-block doc-upload-prominent", children: [_jsx("h2", { className: "doc-upload-heading", children: t("form.documentPhotosSection") }), _jsx("p", { className: "muted", children: t("form.documentPhotosHelp") }), isEdit && retainedDocs.length > 0 ? (_jsx("div", { className: "retained-docs", children: groupedRetainedDocs.map(([group, docs]) => (_jsxs("div", { style: { marginBottom: 10 }, children: [_jsx("p", { style: { margin: "0 0 6px 0", fontWeight: 600 }, children: group }), _jsx("ul", { className: "retained-docs", children: docs.map((d) => (_jsxs("li", { children: [_jsxs("span", { style: { display: "inline-flex", alignItems: "center", gap: 8 }, children: [isImageFile(d.originalName) ? (_jsx("a", { href: `${API_BASE}${d.path}`, target: "_blank", rel: "noreferrer", children: _jsx("img", { src: `${API_BASE}${d.path}`, alt: d.originalName, style: {
                                                                                width: 56,
                                                                                height: 56,
                                                                                objectFit: "cover",
                                                                                borderRadius: 8,
                                                                                border: "1px solid #d1d5db",
                                                                            } }) })) : (_jsx("span", { style: { fontSize: 12, color: "#64748b" }, children: "PDF" })), _jsx("span", { children: d.originalName })] }), _jsx("button", { type: "button", className: "btn btn-link btn-sm p-0", disabled: !prepEditableEffective, onClick: () => setRetainedDocs((prev) => prev.filter((x) => x.path !== d.path)), children: t("form.removeAttachment") })] }, d.path))) })] }, group))) })) : null, _jsx("input", { className: "form-control mt-1", type: "file", accept: "image/*,application/pdf", multiple: true, disabled: !prepEditableEffective, onChange: (e) => setNewDocFiles(Array.from(e.target.files ?? []).map((file) => ({
                                            file,
                                            category: "",
                                        }))) }), newDocFiles.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("p", { className: "muted", children: [newDocFiles.length, " ", t("form.filesSelected")] }), _jsx("div", { className: "col-12", children: newDocFiles.map((item, idx) => (_jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [item.file.name, _jsxs("select", { className: "form-select mt-1", value: item.category, disabled: !prepEditableEffective, onChange: (e) => setNewDocFiles((prev) => prev.map((p, i) => i === idx ? { ...p, category: e.target.value } : p)), required: true, children: [_jsx("option", { value: "", children: t("form.selectDocumentCategory") }), DOCUMENT_CATEGORY_OPTIONS.map((option) => (_jsx("option", { value: option.value, children: t(option.labelKey) }, option.value)))] })] }, `${item.file.name}-${idx}`))) })] })) : null] }), fullyLocked ? (_jsx("p", { className: "muted col-12", role: "status", children: t("form.saveLockedHint") })) : null, _jsx("div", { className: "col-12", children: _jsx("button", { className: "btn btn-primary", type: "submit", disabled: loading || fullyLocked, children: loading ? t("form.saving") : t("form.save") }) })] }) }) })] }));
}

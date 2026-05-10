import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { transactionListPath } from "./paths";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
function isoToDateInput(iso) {
    if (!iso)
        return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return "";
    return d.toISOString().slice(0, 10);
}
function numToStr(n) {
    return n != null && Number.isFinite(n) ? String(n) : "";
}
function mapTxToForm(tx) {
    return {
        storageSubStage: tx.storageSubStage ?? "INPUT",
        storageInputEntryDate: isoToDateInput(tx.storageInputEntryDate ?? tx.storageEntryDate),
        storageInputWorkersWages: numToStr(tx.storageInputWorkersWages ?? tx.storageWorkersWages),
        storageInputWorkersCompany: tx.storageInputWorkersCompany ?? tx.storageWorkersCompany ?? "",
        storageInputStoreName: tx.storageInputStoreName ?? tx.storageStoreName ?? "",
        storageInputVolumeCbm: numToStr(tx.storageInputVolumeCbm ?? tx.storageSizeCbm),
        storageInputLoadingEquipmentFare: numToStr(tx.storageInputLoadingEquipmentFare),
        storageExitEntryDate: isoToDateInput(tx.storageExitEntryDate ?? tx.storageEntryDate),
        storageExitWorkersWages: numToStr(tx.storageExitWorkersWages ?? tx.storageWorkersWages),
        storageExitWorkersCompany: tx.storageExitWorkersCompany ?? tx.storageWorkersCompany ?? "",
        storageExitStoreName: tx.storageExitStoreName ?? tx.storageStoreName ?? "",
        storageExitVolumeCbm: numToStr(tx.storageExitVolumeCbm ?? tx.storageSizeCbm),
        storageExitLoadingEquipmentFare: numToStr(tx.storageExitLoadingEquipmentFare),
        storageExitFreightVehicleNumbers: tx.storageExitFreightVehicleNumbers ?? tx.storageFreightVehicleNumbers ?? "",
        storageExitCrossPackaging: tx.storageExitCrossPackaging ?? tx.storageCrossPackaging ?? "",
        storageExitUnity: tx.storageExitUnity ?? tx.storageUnity ?? "",
        storageSealReplaceContainers: tx.storageSealReplaceContainers ?? "",
        storageSealSwitchDate: isoToDateInput(tx.storageSealSwitchDate),
        storageSealEntryContainerNumbers: tx.storageSealEntryContainerNumbers ?? "",
        storageSealUnitCount: numToStr(tx.storageSealUnitCount),
        storageSealWorkersCompany: tx.storageSealWorkersCompany ?? "",
        storageSealWorkersWages: numToStr(tx.storageSealWorkersWages),
    };
}
function appendOptionalNumber(payload, key, raw) {
    const t = raw.trim();
    if (t === "")
        return;
    const n = Number(t);
    if (!Number.isFinite(n))
        return;
    payload[key] = n;
}
function buildPayload(form, existingIsStopped) {
    const payload = { storageSubStage: form.storageSubStage };
    if (typeof existingIsStopped === "boolean")
        payload.isStopped = existingIsStopped;
    const dates = [
        ["storageInputEntryDate", form.storageInputEntryDate],
        ["storageExitEntryDate", form.storageExitEntryDate],
        ["storageSealSwitchDate", form.storageSealSwitchDate],
    ];
    for (const [key, v] of dates) {
        const t = v.trim();
        if (t)
            payload[key] = t;
    }
    const strings = [
        ["storageInputWorkersCompany", form.storageInputWorkersCompany],
        ["storageInputStoreName", form.storageInputStoreName],
        ["storageExitWorkersCompany", form.storageExitWorkersCompany],
        ["storageExitStoreName", form.storageExitStoreName],
        ["storageExitFreightVehicleNumbers", form.storageExitFreightVehicleNumbers],
        ["storageExitCrossPackaging", form.storageExitCrossPackaging],
        ["storageExitUnity", form.storageExitUnity],
        ["storageSealReplaceContainers", form.storageSealReplaceContainers],
        ["storageSealEntryContainerNumbers", form.storageSealEntryContainerNumbers],
        ["storageSealWorkersCompany", form.storageSealWorkersCompany],
    ];
    for (const [key, v] of strings) {
        const t = v.trim();
        if (t)
            payload[key] = t;
    }
    appendOptionalNumber(payload, "storageInputWorkersWages", form.storageInputWorkersWages);
    appendOptionalNumber(payload, "storageInputVolumeCbm", form.storageInputVolumeCbm);
    appendOptionalNumber(payload, "storageInputLoadingEquipmentFare", form.storageInputLoadingEquipmentFare);
    appendOptionalNumber(payload, "storageExitWorkersWages", form.storageExitWorkersWages);
    appendOptionalNumber(payload, "storageExitVolumeCbm", form.storageExitVolumeCbm);
    appendOptionalNumber(payload, "storageExitLoadingEquipmentFare", form.storageExitLoadingEquipmentFare);
    appendOptionalNumber(payload, "storageSealUnitCount", form.storageSealUnitCount);
    appendOptionalNumber(payload, "storageSealWorkersWages", form.storageSealWorkersWages);
    return payload;
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
export default function TransactionStoragePage({ role, module, }) {
    const { t, numberLocale } = useI18n();
    const { id } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [form, setForm] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const backHref = transactionListPath(module);
    const detailHref = `/${module}/${id}`;
    const canEdit = role !== "accountant";
    useEffect(() => {
        if (!id)
            return;
        setError("");
        apiFetch(`/api/${module}/${id}`)
            .then((res) => {
            if (!res.ok)
                throw new Error("not-found");
            return res.json();
        })
            .then((data) => {
            setTransaction(data);
            setForm(mapTxToForm(data));
        })
            .catch(() => setError(t("form.loadError")));
    }, [id, module, t]);
    const titleSuffix = useMemo(() => {
        if (!transaction)
            return "";
        return transaction.declarationNumber ? ` · ${transaction.declarationNumber}` : "";
    }, [transaction]);
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!id || !form || !canEdit)
            return;
        setError("");
        setLoading(true);
        try {
            const payload = buildPayload(form, transaction?.isStopped);
            const res = await apiFetch(`/api/${module}/${id}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const detail = await parseApiErrorMessage(res);
                setError(detail ? `${t("form.saveError")} (${detail})` : t("form.saveError"));
                return;
            }
            const data = (await res.json());
            setTransaction(data);
            setForm(mapTxToForm(data));
        }
        catch {
            setError(t("form.saveError"));
        }
        finally {
            setLoading(false);
        }
    };
    if (!id) {
        return (_jsxs("main", { className: "container py-2", children: [_jsx("p", { className: "error alert alert-danger", children: t("notFound.title") }), _jsx(Link, { to: backHref, className: "btn btn-outline-secondary btn-sm", children: t("form.back") })] }));
    }
    return (_jsxs("main", { className: "container py-2", children: [_jsxs("div", { className: "page-actions d-flex flex-wrap gap-2 align-items-center", children: [_jsx(Link, { to: detailHref, className: "btn btn-outline-secondary btn-sm", children: t("storagePage.backToRecord") }), _jsx(Link, { to: backHref, className: "btn btn-outline-secondary btn-sm", children: t("form.back") })] }), _jsxs("h1", { children: [t("storagePage.title"), titleSuffix] }), error ? _jsx("p", { className: "error alert alert-danger", children: error }) : null, !transaction || !form ? _jsx("p", { children: t("details.loading") }) : null, transaction && transaction.transactionStage !== "STORAGE" ? (_jsx("p", { className: "muted", role: "status", children: t("storagePage.wrongStage") })) : null, transaction && transaction.transactionStage === "STORAGE" && form ? (_jsx("form", { className: "card shadow-sm mb-4", onSubmit: onSubmit, children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row g-3", children: [_jsxs("p", { className: "details-item col-12", children: [_jsxs("strong", { children: [t("details.client"), ":"] }), " ", transaction.clientName] }), _jsxs("p", { className: "details-item col-12", children: [_jsxs("strong", { children: [t("details.createdAt"), ":"] }), " ", new Date(transaction.createdAt).toLocaleString(numberLocale)] }), _jsx("div", { className: "col-12 d-flex flex-wrap gap-2", children: ["INPUT", "OUTPUT", "SEAL"].map((tab) => (_jsx("button", { type: "button", className: form.storageSubStage === tab ? "btn btn-primary btn-sm" : "btn btn-outline-secondary btn-sm", onClick: () => setForm({ ...form, storageSubStage: tab }), children: tab === "INPUT"
                                        ? t("storagePage.subStage.input")
                                        : tab === "OUTPUT"
                                            ? t("storagePage.subStage.output")
                                            : t("storagePage.subStage.seal") }, tab))) }), form.storageSubStage === "INPUT" ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("storagePage.section.input") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.entryDate"), _jsx("input", { className: "form-control mt-1", type: "date", value: form.storageInputEntryDate, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageInputEntryDate: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.workersWages"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", value: form.storageInputWorkersWages, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageInputWorkersWages: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.workersCompany"), _jsx("input", { className: "form-control mt-1", value: form.storageInputWorkersCompany, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageInputWorkersCompany: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.storeName"), _jsx("input", { className: "form-control mt-1", value: form.storageInputStoreName, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageInputStoreName: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.sizeCbm"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", value: form.storageInputVolumeCbm, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageInputVolumeCbm: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("storagePage.loadingEquipmentFare"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", value: form.storageInputLoadingEquipmentFare, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageInputLoadingEquipmentFare: e.target.value }) })] })] })) : null, form.storageSubStage === "OUTPUT" ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("storagePage.section.exit") }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.entryDate"), _jsx("input", { className: "form-control mt-1", type: "date", value: form.storageExitEntryDate, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitEntryDate: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.workersWages"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", value: form.storageExitWorkersWages, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitWorkersWages: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.workersCompany"), _jsx("input", { className: "form-control mt-1", value: form.storageExitWorkersCompany, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitWorkersCompany: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.storeName"), _jsx("input", { className: "form-control mt-1", value: form.storageExitStoreName, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitStoreName: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.sizeCbm"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", value: form.storageExitVolumeCbm, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitVolumeCbm: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("storagePage.loadingEquipmentFare"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", value: form.storageExitLoadingEquipmentFare, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitLoadingEquipmentFare: e.target.value }) })] }), _jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("form.storage.freightVehicleNumbers"), _jsx("textarea", { className: "form-control mt-1", value: form.storageExitFreightVehicleNumbers, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitFreightVehicleNumbers: e.target.value }), rows: 2 })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.crossPackaging"), _jsx("input", { className: "form-control mt-1", value: form.storageExitCrossPackaging, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitCrossPackaging: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.unity"), _jsx("input", { className: "form-control mt-1", value: form.storageExitUnity, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageExitUnity: e.target.value }) })] })] })) : null, form.storageSubStage === "SEAL" ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-3 mb-0", children: t("storagePage.section.seal") }), _jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("storagePage.replaceContainers"), _jsx("textarea", { className: "form-control mt-1", value: form.storageSealReplaceContainers, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageSealReplaceContainers: e.target.value }), rows: 2 })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("storagePage.switchDate"), _jsx("input", { className: "form-control mt-1", type: "date", value: form.storageSealSwitchDate, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageSealSwitchDate: e.target.value }) })] }), _jsxs("label", { className: "col-12 form-label w-100 mb-0", children: [t("storagePage.entryContainerNumbers"), _jsx("textarea", { className: "form-control mt-1", value: form.storageSealEntryContainerNumbers, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageSealEntryContainerNumbers: e.target.value }), rows: 2 })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("storagePage.unitCount"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: 1, value: form.storageSealUnitCount, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageSealUnitCount: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.workersCompany"), _jsx("input", { className: "form-control mt-1", value: form.storageSealWorkersCompany, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageSealWorkersCompany: e.target.value }) })] }), _jsxs("label", { className: "col-12 col-md-6 form-label w-100 mb-0", children: [t("form.storage.workersWages"), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, step: "any", value: form.storageSealWorkersWages, disabled: !canEdit, onChange: (e) => setForm({ ...form, storageSealWorkersWages: e.target.value }) })] })] })) : null, !canEdit ? (_jsx("p", { className: "muted col-12", role: "status", children: t("storagePage.accountantReadOnly") })) : null, _jsx("div", { className: "col-12", children: _jsx("button", { className: "btn btn-primary", type: "submit", disabled: loading || !canEdit, children: loading ? t("form.saving") : t("form.save") }) })] }) }) })) : null] }));
}

import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
import ShippingPaperModal from "./ShippingPaperModal";
import { API_BASE } from "./types";
const DOCUMENT_CATEGORY_LABELS = {
    bill_of_lading: "docCategory.bill_of_lading",
    certificate_of_origin: "docCategory.certificate_of_origin",
    invoice: "docCategory.invoice",
    packing_list: "docCategory.packing_list",
};
function categoryLabel(category, t) {
    if (!category)
        return t("docCategory.uncategorized");
    const key = DOCUMENT_CATEGORY_LABELS[category];
    return key ? t(key) : category;
}
function stageLabel(stage, t) {
    switch (stage) {
        case "PREPARATION":
            return t("stage.PREPARATION");
        case "CUSTOMS_CLEARANCE":
            return t("stage.CUSTOMS_CLEARANCE");
        case "TRANSPORTATION":
            return t("stage.TRANSPORTATION");
        case "STORAGE":
            return t("stage.STORAGE");
        default:
            return stage || t("stage.PREPARATION");
    }
}
function declarationTypeLabel(value, t) {
    const map = {
        Import: "form.declarationType.import",
        "Import to Free Zone": "form.declarationType.import_free_zone",
        "Import for Re-Export": "form.declarationType.import_re_export",
        "Temporary Import": "form.declarationType.temporary_import",
        Transfer: "form.declarationType.transfer",
        Export: "form.declarationType.export",
        "Transit out": "form.declarationType.transit_out",
        "Export to GCC": "form.declarationType.export_gcc",
        Transitin: "form.declarationType.transitin",
        "Transitin from GCC": "form.declarationType.transitin_gcc",
    };
    if (!value)
        return "";
    const key = map[value];
    return key ? t(key) : value;
}
function portTypeLabel(value, t) {
    const map = {
        Seaports: "form.portType.seaports",
        "Free Zones": "form.portType.free_zones",
        Mainland: "form.portType.mainland",
    };
    if (!value)
        return "";
    const key = map[value];
    return key ? t(key) : value;
}
export default function TransactionDetails({ role, module = "transactions", }) {
    const { t, numberLocale } = useI18n();
    const navigate = useNavigate();
    const { id } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [shippingPaperOpen, setShippingPaperOpen] = useState(false);
    const groupedAttachments = (transaction?.documentAttachments ?? []).reduce((acc, item) => {
        const key = categoryLabel(item.category, t);
        if (!acc[key])
            acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});
    const showCustomsDeclarationSection = transaction?.transactionStage !== "PREPARATION";
    useEffect(() => {
        if (!id)
            return;
        apiFetch(`/api/${module}/${id}`)
            .then((res) => {
            if (!res.ok)
                throw new Error("not-found");
            return res.json();
        })
            .then((data) => setTransaction(data))
            .catch(() => setError(t("details.loadError")));
    }, [id, t, module]);
    const onDelete = async () => {
        if (!id)
            return;
        if (!window.confirm(t("details.deleteConfirm")))
            return;
        setDeleting(true);
        try {
            const res = await apiFetch(`/api/${module}/${id}`, { method: "DELETE" });
            if (!res.ok)
                throw new Error("delete-failed");
            navigate(`/${module === "transactions" ? "" : module}`.replace(/\/$/, "") || "/");
        }
        catch {
            setError(t("details.deleteError"));
        }
        finally {
            setDeleting(false);
        }
    };
    const onAccountingAction = async (action) => {
        if (!id)
            return;
        setProcessing(true);
        setError("");
        try {
            const res = await apiFetch(`/api/${module}/${id}/${action}`, { method: "POST" });
            if (!res.ok) {
                const payload = (await res.json().catch(() => null));
                throw new Error(payload?.error ?? "failed");
            }
            const data = await res.json();
            setTransaction(data);
        }
        catch (eventError) {
            const message = eventError instanceof Error ? eventError.message : "";
            setError(message && message !== "failed" ? message : t("details.actionError"));
        }
        finally {
            setProcessing(false);
        }
    };
    return (_jsxs("main", { className: "container py-2", children: [_jsxs("div", { className: "page-actions", children: [_jsx(Link, { to: `/${module === "transactions" ? "" : module}`.replace(/\/$/, "") || "/", className: "btn btn-outline-secondary btn-sm", children: t("details.back") }), id ? (_jsxs(_Fragment, { children: [" | ", role !== "accountant" ? (_jsxs(_Fragment, { children: [_jsx(Link, { to: `/${module}/${id}/edit`, className: "btn btn-outline-primary btn-sm", children: t("details.edit") }), " | ", _jsx("button", { className: "btn btn-outline-danger btn-sm", onClick: onDelete, disabled: deleting, children: deleting ? t("details.deleting") : t("details.delete") })] })) : null, role === "manager" || role === "accountant" ? (_jsxs(_Fragment, { children: [" | ", _jsx("button", { className: "btn btn-primary btn-sm", onClick: () => onAccountingAction("pay"), disabled: processing || transaction?.paymentStatus === "paid", children: t("details.markPaid") }), " ", _jsx("button", { className: "btn btn-primary btn-sm", onClick: () => onAccountingAction("release"), disabled: processing ||
                                            transaction?.paymentStatus !== "paid" ||
                                            (transaction?.documentStatus !== "original_received" && transaction?.documentStatus !== "telex_release"), children: t("details.release") })] })) : null, transaction ? (_jsxs(_Fragment, { children: [" | ", _jsx("button", { type: "button", className: "btn btn-primary btn-sm", onClick: () => setShippingPaperOpen(true), children: t("details.shippingPaperButton") })] })) : null] })) : null] }), _jsx("h1", { className: "display-6 fw-bold mb-3", children: module === "transactions"
                    ? t("details.title")
                    : module === "transfers"
                        ? t("transfer.details.title")
                        : t("export.details.title") }), error ? _jsx("p", { className: "error alert alert-danger", children: error }) : null, !transaction && !error ? _jsx("p", { children: t("details.loading") }) : null, transaction && (_jsx("section", { className: "details-card card shadow-sm", children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row row-cols-1 row-cols-md-2 g-3", children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-2 mb-0", children: t("form.snapshotReadOnly") }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.createdAt"), ":"] }), " ", new Date(transaction.createdAt).toLocaleString(numberLocale)] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationNumber1"), ":"] }), " ", transaction.declarationNumber] }), transaction.declarationNumber2 ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationNumber2"), ":"] }), " ", transaction.declarationNumber2] })) : null, _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.status"), ":"] }), " ", transaction.clearanceStatus] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.stage"), ":"] }), " ", stageLabel(transaction.transactionStage, t)] }), transaction.transactionStage === "STORAGE" && (module === "transactions" || module === "transfers") ? (_jsx("p", { className: "details-item col-12", children: _jsx(Link, { className: "btn btn-primary btn-sm", style: { display: "inline-block" }, to: `/${module}/${transaction.id}/storage`, children: t("details.linkStorage") }) })) : null, transaction.releaseCode ? (_jsxs("p", { className: "details-item col-12", children: [_jsxs("strong", { children: [t("details.releaseCode"), ":"] }), " ", transaction.releaseCode] })) : null, _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-2 mb-0", children: t("form.partiesSection") }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.client"), ":"] }), " ", transaction.clientName] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.shippingCompany"), ":"] }), " ", transaction.shippingCompanyName] }), transaction.shippingCompanyId ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.shippingCompanyId"), ":"] }), " ", transaction.shippingCompanyId] })) : null, showCustomsDeclarationSection ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-2 mb-0", children: t("form.customsDeclarationSection") }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationNumber1"), ":"] }), " ", transaction.declarationNumber] }), transaction.declarationNumber2 ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationNumber2"), ":"] }), " ", transaction.declarationNumber2] })) : null, transaction.declarationDate ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationDate"), ":"] }), " ", new Date(transaction.declarationDate).toLocaleString(numberLocale)] })) : null, transaction.declarationType ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationType1"), ":"] }), " ", declarationTypeLabel(transaction.declarationType, t)] })) : null, transaction.declarationType2 ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.declarationType2"), ":"] }), " ", declarationTypeLabel(transaction.declarationType2, t)] })) : null, transaction.portType ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.portType"), ":"] }), " ", portTypeLabel(transaction.portType, t)] })) : null] })) : null, _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-2 mb-0", children: t("form.shipmentCoreSection") }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.airwayBill"), ":"] }), " ", transaction.airwayBill] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.hsCode"), ":"] }), " ", transaction.hsCode] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goods"), ":"] }), " ", transaction.goodsDescription] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.origin"), ":"] }), " ", transaction.originCountry] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.invoiceValue"), ":"] }), " ", transaction.invoiceValue.toLocaleString(numberLocale), " ", transaction.invoiceCurrency ?? t("details.currencySuffix")] }), _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-2 mb-0", children: t("form.cargoContainersSection") }), transaction.containerCount != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.containerCount"), ":"] }), " ", transaction.containerCount] })) : null, transaction.goodsWeightKg != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goodsWeightKg"), ":"] }), " ", transaction.goodsWeightKg.toLocaleString(numberLocale)] })) : null, transaction.invoiceToWeightRateAedPerKg != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.invoiceToWeightRate"), ":"] }), " ", transaction.invoiceToWeightRateAedPerKg.toLocaleString(numberLocale)] })) : null, transaction.containerArrivalDate ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.containerArrivalDate"), ":"] }), " ", new Date(transaction.containerArrivalDate).toLocaleString(numberLocale)] })) : null, transaction.documentArrivalDate ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.documentArrivalDate"), ":"] }), " ", new Date(transaction.documentArrivalDate).toLocaleString(numberLocale)] })) : null, showCustomsDeclarationSection && transaction.fileNumber ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.fileNumber"), ":"] }), " ", transaction.fileNumber] })) : null, transaction.containerNumbers && transaction.containerNumbers.length > 0 ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.containerNumbers"), ":"] }), " ", transaction.containerNumbers.join(", ")] })) : null, transaction.unitCount != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.numberOfUnits"), ":"] }), " ", transaction.unitCount] })) : null, (transaction.transportationTo ||
                                transaction.trachNo ||
                                transaction.transportationCompany ||
                                transaction.transportationFrom ||
                                transaction.transportationToLocation ||
                                transaction.tripCharge != null ||
                                transaction.waitingCharge != null ||
                                transaction.maccrikCharge != null) ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-2 mb-0", children: t("transportation.sectionTitle") }), transaction.transportationTo ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.toUpper"), ":"] }), " ", transaction.transportationTo] })) : null, transaction.trachNo ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.trachNo"), ":"] }), " ", transaction.trachNo] })) : null, transaction.transportationCompany ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.company"), ":"] }), " ", transaction.transportationCompany] })) : null, transaction.transportationFrom ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.from"), ":"] }), " ", transaction.transportationFrom] })) : null, transaction.transportationToLocation ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.to"), ":"] }), " ", transaction.transportationToLocation] })) : null, transaction.tripCharge != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.tripCharge"), ":"] }), " ", transaction.tripCharge.toLocaleString(numberLocale)] })) : null, transaction.waitingCharge != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.waitingCharge"), ":"] }), " ", transaction.waitingCharge.toLocaleString(numberLocale)] })) : null, transaction.maccrikCharge != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("transportation.maccrikCharge"), ":"] }), " ", transaction.maccrikCharge.toLocaleString(numberLocale)] })) : null] })) : null, _jsx("h2", { className: "form-section-title col-12 h5 border-bottom pb-2 mt-2 mb-0", children: t("form.workflowStatusSection") }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.document"), ":"] }), " ", transaction.documentStatus] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.payment"), ":"] }), " ", transaction.paymentStatus] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.stopTransaction"), ":"] }), " ", transaction.isStopped ? t("form.yes") : t("form.no")] }), transaction.isStopped && transaction.stopReason ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.stopReason"), ":"] }), " ", transaction.stopReason] })) : null, transaction.goodsQuantity != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goodsQuantity"), ":"] }), " ", transaction.goodsQuantity.toLocaleString(numberLocale)] })) : null, transaction.goodsQuality ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goodsQuality"), ":"] }), " ", t(`form.quality.${transaction.goodsQuality}`)] })) : null, transaction.goodsUnit ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goodsUnit"), ":"] }), " ", t(`form.unit.${transaction.goodsUnit}`)] })) : null, transaction.documentAttachments && transaction.documentAttachments.length > 0 ? (_jsxs("div", { className: "details-item col-12", children: [_jsx("p", { children: _jsx("strong", { children: t("details.documentPhotos") }) }), Object.entries(groupedAttachments).map(([group, items]) => (_jsxs("div", { style: { marginBottom: 12 }, children: [_jsx("p", { style: { margin: "0 0 6px 0", fontWeight: 600 }, children: group }), _jsx("ul", { className: "attachment-grid", children: items.map((a) => {
                                                    const href = `${API_BASE}${a.path}`;
                                                    const isImg = /\.(png|jpe?g|gif|webp)$/i.test(a.originalName);
                                                    return (_jsxs("li", { className: "attachment-tile", children: [isImg ? (_jsx("a", { href: href, target: "_blank", rel: "noreferrer", children: _jsx("img", { src: href, alt: "", className: "attachment-thumb" }) })) : null, _jsxs("a", { href: href, target: "_blank", rel: "noreferrer", children: [a.originalName, " (", t("details.openAttachment"), ")"] })] }, a.path));
                                                }) })] }, group)))] })) : null] }) }) })), _jsx(ShippingPaperModal, { open: shippingPaperOpen, transaction: transaction, onClose: () => setShippingPaperOpen(false) })] }));
}

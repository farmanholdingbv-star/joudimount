import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
import ShippingPaperModal from "./ShippingPaperModal";
import { API_BASE } from "./types";
export default function TransactionDetails({ role }) {
    const { t, numberLocale } = useI18n();
    const navigate = useNavigate();
    const { id } = useParams();
    const [transaction, setTransaction] = useState(null);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [shippingPaperOpen, setShippingPaperOpen] = useState(false);
    useEffect(() => {
        if (!id)
            return;
        apiFetch(`/api/transactions/${id}`)
            .then((res) => {
            if (!res.ok)
                throw new Error("not-found");
            return res.json();
        })
            .then((data) => setTransaction(data))
            .catch(() => setError(t("details.loadError")));
    }, [id, t]);
    const onDelete = async () => {
        if (!id)
            return;
        if (!window.confirm(t("details.deleteConfirm")))
            return;
        setDeleting(true);
        try {
            const res = await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
            if (!res.ok)
                throw new Error("delete-failed");
            navigate("/");
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
            const res = await apiFetch(`/api/transactions/${id}/${action}`, { method: "POST" });
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
    return (_jsxs("main", { className: "container", children: [_jsxs("div", { className: "page-actions", children: [_jsx(Link, { to: "/", className: "link-button", children: t("details.back") }), id ? (_jsxs(_Fragment, { children: [" | ", role !== "accountant" ? (_jsxs(_Fragment, { children: [_jsx(Link, { to: `/transactions/${id}/edit`, className: "link-button", children: t("details.edit") }), " | ", _jsx("button", { className: "danger-button", onClick: onDelete, disabled: deleting, children: deleting ? t("details.deleting") : t("details.delete") })] })) : null, role === "manager" || role === "accountant" ? (_jsxs(_Fragment, { children: [" | ", _jsx("button", { className: "primary-button", onClick: () => onAccountingAction("pay"), disabled: processing || transaction?.paymentStatus === "paid", children: t("details.markPaid") }), " ", _jsx("button", { className: "primary-button", onClick: () => onAccountingAction("release"), disabled: processing ||
                                            transaction?.paymentStatus !== "paid" ||
                                            (transaction?.documentStatus !== "original_received" && transaction?.documentStatus !== "telex_release"), children: t("details.release") })] })) : null, transaction ? (_jsxs(_Fragment, { children: [" | ", _jsx("button", { type: "button", className: "primary-button", onClick: () => setShippingPaperOpen(true), children: t("details.shippingPaperButton") })] })) : null] })) : null] }), _jsx("h1", { children: t("details.title") }), error ? _jsx("p", { className: "error", children: error }) : null, !transaction && !error ? _jsx("p", { children: t("details.loading") }) : null, transaction && (_jsx("section", { className: "details-card", children: _jsxs("div", { className: "details-grid", children: [_jsx("h2", { className: "form-section-title full-row", children: "Transaction Snapshot (Read-only)" }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.createdAt"), ":"] }), " ", new Date(transaction.createdAt).toLocaleString(numberLocale)] }), _jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Declaration Number:" }), " ", transaction.declarationNumber] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.duty"), ":"] }), " ", transaction.customsDuty.toLocaleString(numberLocale), " ", t("details.currencySuffix")] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.status"), ":"] }), " ", transaction.clearanceStatus] }), transaction.releaseCode ? (_jsxs("p", { className: "details-item full-row", children: [_jsxs("strong", { children: [t("details.releaseCode"), ":"] }), " ", transaction.releaseCode] })) : null, _jsx("h2", { className: "form-section-title full-row", children: "Parties" }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.client"), ":"] }), " ", transaction.clientName] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.shippingCompany"), ":"] }), " ", transaction.shippingCompanyName] }), transaction.shippingCompanyId ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.shippingCompanyId"), ":"] }), " ", transaction.shippingCompanyId] })) : null, _jsx("h2", { className: "form-section-title full-row", children: "Customs Declaration" }), _jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Declaration Number:" }), " ", transaction.declarationNumber] }), transaction.declarationDate ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Declaration Date:" }), " ", new Date(transaction.declarationDate).toLocaleString(numberLocale)] })) : null, transaction.declarationType ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Declaration Type:" }), " ", transaction.declarationType] })) : null, transaction.portType ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Port Type:" }), " ", transaction.portType] })) : null, _jsx("h2", { className: "form-section-title full-row", children: "Shipment Core" }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.airwayBill"), ":"] }), " ", transaction.airwayBill] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.hsCode"), ":"] }), " ", transaction.hsCode] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goods"), ":"] }), " ", transaction.goodsDescription] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.origin"), ":"] }), " ", transaction.originCountry] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("form.invoiceValue"), ":"] }), " ", transaction.invoiceValue.toLocaleString(numberLocale), " ", t("details.currencySuffix")] }), _jsx("h2", { className: "form-section-title full-row", children: "Cargo & Containers" }), transaction.containerCount != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.containerCount"), ":"] }), " ", transaction.containerCount] })) : null, transaction.goodsWeightKg != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goodsWeightKg"), ":"] }), " ", transaction.goodsWeightKg.toLocaleString(numberLocale)] })) : null, transaction.invoiceToWeightRateAedPerKg != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.invoiceToWeightRate"), ":"] }), " ", transaction.invoiceToWeightRateAedPerKg.toLocaleString(numberLocale)] })) : null, transaction.containerArrivalDate ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.containerArrivalDate"), ":"] }), " ", new Date(transaction.containerArrivalDate).toLocaleString(numberLocale)] })) : null, transaction.documentArrivalDate ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.documentArrivalDate"), ":"] }), " ", new Date(transaction.documentArrivalDate).toLocaleString(numberLocale)] })) : null, transaction.fileNumber ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "File Number:" }), " ", transaction.fileNumber] })) : null, transaction.containerNumbers && transaction.containerNumbers.length > 0 ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Container Numbers:" }), " ", transaction.containerNumbers.join(", ")] })) : null, transaction.unitCount != null ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Number of Units:" }), " ", transaction.unitCount] })) : null, _jsx("h2", { className: "form-section-title full-row", children: "Workflow & Status" }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.document"), ":"] }), " ", transaction.documentStatus] }), _jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.payment"), ":"] }), " ", transaction.paymentStatus] }), _jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Stopped:" }), " ", transaction.isStopped ? "Yes" : "No"] }), transaction.isStopped && transaction.stopReason ? (_jsxs("p", { className: "details-item", children: [_jsx("strong", { children: "Stop Reason:" }), " ", transaction.stopReason] })) : null, transaction.goodsQuantity != null ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goodsQuantity"), ":"] }), " ", transaction.goodsQuantity.toLocaleString(numberLocale)] })) : null, transaction.goodsUnit ? (_jsxs("p", { className: "details-item", children: [_jsxs("strong", { children: [t("details.goodsUnit"), ":"] }), " ", t(`form.unit.${transaction.goodsUnit}`)] })) : null, transaction.documentAttachments && transaction.documentAttachments.length > 0 ? (_jsxs("div", { className: "details-item full-row", children: [_jsx("p", { children: _jsx("strong", { children: t("details.documentPhotos") }) }), _jsx("ul", { className: "attachment-grid", children: transaction.documentAttachments.map((a) => {
                                        const href = `${API_BASE}${a.path}`;
                                        const isImg = /\.(png|jpe?g|gif|webp)$/i.test(a.originalName);
                                        return (_jsxs("li", { className: "attachment-tile", children: [isImg ? (_jsx("a", { href: href, target: "_blank", rel: "noreferrer", children: _jsx("img", { src: href, alt: "", className: "attachment-thumb" }) })) : null, _jsxs("a", { href: href, target: "_blank", rel: "noreferrer", children: [a.originalName, " (", t("details.openAttachment"), ")"] })] }, a.path));
                                    }) })] })) : null] }) })), _jsx(ShippingPaperModal, { open: shippingPaperOpen, transaction: transaction, onClose: () => setShippingPaperOpen(false) })] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useI18n } from "./i18n/I18nContext";
function buildInitialPaper(tx, numberLocale) {
    const weight = tx.goodsWeightKg != null ? tx.goodsWeightKg.toLocaleString(numberLocale) : "";
    const qty = tx.goodsQuantity != null ? tx.goodsQuantity.toLocaleString(numberLocale) : "";
    return {
        toCompany: tx.shippingCompanyName,
        client: tx.clientName,
        declaration: tx.declarationNumber,
        airwayBill: tx.airwayBill,
        hsCode: tx.hsCode,
        goods: tx.goodsDescription,
        origin: tx.originCountry,
        invoiceValue: `${tx.invoiceValue.toLocaleString(numberLocale)}`,
        releaseCode: tx.releaseCode ?? "",
        weight,
        quantity: qty,
        notes: "",
    };
}
export default function ShippingPaperModal({ open, transaction, onClose, }) {
    const { t, numberLocale } = useI18n();
    const [paper, setPaper] = useState(null);
    useEffect(() => {
        if (open && transaction) {
            setPaper(buildInitialPaper(transaction, numberLocale));
        }
        else if (!open) {
            setPaper(null);
        }
    }, [open, transaction, numberLocale]);
    useEffect(() => {
        if (!open) {
            document.body.classList.remove("shipping-paper-printing");
            return;
        }
        const onBeforePrint = () => {
            document.body.classList.add("shipping-paper-printing");
        };
        const onAfterPrint = () => {
            document.body.classList.remove("shipping-paper-printing");
        };
        window.addEventListener("beforeprint", onBeforePrint);
        window.addEventListener("afterprint", onAfterPrint);
        return () => {
            window.removeEventListener("beforeprint", onBeforePrint);
            window.removeEventListener("afterprint", onAfterPrint);
            document.body.classList.remove("shipping-paper-printing");
        };
    }, [open]);
    if (!open || !transaction)
        return null;
    const effectivePaper = paper ?? buildInitialPaper(transaction, numberLocale);
    const setField = (field, value) => {
        setPaper((p) => {
            const base = p ?? buildInitialPaper(transaction, numberLocale);
            return { ...base, [field]: value };
        });
    };
    const handlePrint = () => {
        document.body.classList.add("shipping-paper-printing");
        window.print();
    };
    const label = (key) => t(key);
    return (_jsxs("div", { className: "shipping-paper-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "shipping-paper-title", children: [_jsx("div", { className: "shipping-paper-modal-backdrop no-print", onClick: onClose }), _jsxs("div", { className: "shipping-paper-modal-panel", children: [_jsxs("div", { className: "shipping-paper-modal-actions no-print", children: [_jsx("h2", { id: "shipping-paper-title", children: t("details.shippingPaperTitle") }), _jsxs("div", { className: "shipping-paper-modal-buttons", children: [_jsx("button", { type: "button", className: "primary-button", onClick: handlePrint, children: t("details.shippingPaperPrint") }), _jsx("button", { type: "button", className: "link-button", onClick: onClose, children: t("details.shippingPaperClose") })] })] }), _jsx("div", { className: "shipping-print-target", children: _jsxs("div", { className: "shipping-print-sheet", children: [_jsxs("header", { className: "shipping-print-header", children: [_jsx("h3", { children: t("details.shippingPaperHeading") }), _jsx("p", { className: "shipping-print-sub muted", children: t("details.shippingPaperSub") })] }), _jsxs("div", { className: "shipping-print-grid", children: [_jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.shippingPaperTo") }), _jsx("input", { value: effectivePaper.toCompany, onChange: (e) => setField("toCompany", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.shippingPaperFrom") }), _jsx("input", { value: effectivePaper.client, onChange: (e) => setField("client", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.declaration") }), _jsx("input", { value: effectivePaper.declaration, onChange: (e) => setField("declaration", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.airwayBill") }), _jsx("input", { value: effectivePaper.airwayBill, onChange: (e) => setField("airwayBill", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.hsCode") }), _jsx("input", { value: effectivePaper.hsCode, onChange: (e) => setField("hsCode", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.origin") }), _jsx("input", { value: effectivePaper.origin, onChange: (e) => setField("origin", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.invoiceValue") }), _jsx("input", { value: effectivePaper.invoiceValue, onChange: (e) => setField("invoiceValue", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.releaseCode") }), _jsx("input", { value: effectivePaper.releaseCode, onChange: (e) => setField("releaseCode", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.goodsWeightKg") }), _jsx("input", { value: effectivePaper.weight, onChange: (e) => setField("weight", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.goodsQuantity") }), _jsx("input", { value: effectivePaper.quantity, onChange: (e) => setField("quantity", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label full", children: [_jsx("span", { children: label("details.goods") }), _jsx("textarea", { value: effectivePaper.goods, onChange: (e) => setField("goods", e.target.value), className: "shipping-print-textarea", rows: 4 })] }), _jsxs("label", { className: "shipping-print-label full", children: [_jsx("span", { children: label("details.shippingPaperNotes") }), _jsx("textarea", { value: effectivePaper.notes, onChange: (e) => setField("notes", e.target.value), className: "shipping-print-textarea", rows: 3, placeholder: t("details.shippingPaperNotesPlaceholder") })] })] })] }) })] })] }));
}

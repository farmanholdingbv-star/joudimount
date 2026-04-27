import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
function buildInitialPaper(tx) {
    return {
        toCompany: tx.shippingCompanyName,
        client: tx.clientName,
        airwayBill: tx.airwayBill,
        message: "",
    };
}
export default function ShippingPaperModal({ open, transaction, onClose, }) {
    const { t } = useI18n();
    const [paper, setPaper] = useState(null);
    useEffect(() => {
        if (!open || !transaction) {
            setPaper(null);
            return;
        }
        setPaper(buildInitialPaper(transaction));
        let cancelled = false;
        (async () => {
            let template = "";
            try {
                const res = await apiFetch("/api/shipping-companies");
                if (res.ok) {
                    const list = (await res.json());
                    const match = transaction.shippingCompanyId
                        ? list.find((c) => c.id === transaction.shippingCompanyId)
                        : list.find((c) => c.companyName?.trim() === transaction.shippingCompanyName?.trim());
                    template = (match?.dispatchFormTemplate ?? "").trim();
                }
            }
            catch {
                /* ignore */
            }
            if (cancelled || !template)
                return;
            setPaper((p) => {
                const base = p ?? buildInitialPaper(transaction);
                if (base.message.trim() !== "")
                    return base;
                return { ...base, message: template };
            });
        })();
        return () => {
            cancelled = true;
        };
    }, [open, transaction]);
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
    const effectivePaper = paper ?? buildInitialPaper(transaction);
    const setField = (field, value) => {
        setPaper((p) => {
            const base = p ?? buildInitialPaper(transaction);
            return { ...base, [field]: value };
        });
    };
    const handlePrint = () => {
        document.body.classList.add("shipping-paper-printing");
        window.print();
    };
    const label = (key) => t(key);
    return (_jsxs("div", { className: "shipping-paper-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "shipping-paper-title", children: [_jsx("div", { className: "shipping-paper-modal-backdrop no-print", onClick: onClose }), _jsxs("div", { className: "shipping-paper-modal-panel", children: [_jsxs("div", { className: "shipping-paper-modal-actions no-print", children: [_jsx("h2", { id: "shipping-paper-title", children: t("details.shippingPaperTitle") }), _jsxs("div", { className: "shipping-paper-modal-buttons", children: [_jsx("button", { type: "button", className: "primary-button", onClick: handlePrint, children: t("details.shippingPaperPrint") }), _jsx("button", { type: "button", className: "link-button", onClick: onClose, children: t("details.shippingPaperClose") })] })] }), _jsx("div", { className: "shipping-print-target", children: _jsxs("div", { className: "shipping-print-sheet", children: [_jsxs("header", { className: "shipping-print-header", children: [_jsx("h3", { children: t("details.shippingPaperHeading") }), _jsx("p", { className: "shipping-print-sub muted", children: t("details.shippingPaperSub") })] }), _jsxs("div", { className: "shipping-print-grid", children: [_jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.shippingPaperTo") }), _jsx("input", { value: effectivePaper.toCompany, onChange: (e) => setField("toCompany", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.shippingPaperFrom") }), _jsx("input", { value: effectivePaper.client, onChange: (e) => setField("client", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label", children: [_jsx("span", { children: label("details.airwayBill") }), _jsx("input", { value: effectivePaper.airwayBill, onChange: (e) => setField("airwayBill", e.target.value), className: "shipping-print-input" })] }), _jsxs("label", { className: "shipping-print-label full", children: [_jsx("span", { children: label("details.shippingPaperMessage") }), _jsx("textarea", { value: effectivePaper.message, onChange: (e) => setField("message", e.target.value), className: "shipping-print-textarea", rows: 8, placeholder: t("details.shippingPaperMessagePlaceholder") })] })] })] }) })] })] }));
}

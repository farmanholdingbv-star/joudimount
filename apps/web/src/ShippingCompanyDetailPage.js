import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
export default function ShippingCompanyDetailPage() {
    const { id } = useParams();
    const { t } = useI18n();
    const [item, setItem] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        if (!id)
            return;
        apiFetch(`/api/shipping-companies/${id}`)
            .then((res) => {
            if (res.status === 404)
                throw new Error("not-found");
            if (!res.ok)
                throw new Error("failed");
            return res.json();
        })
            .then((data) => setItem(data))
            .catch(() => setError(t("shipping.detailLoadError")));
    }, [id, t]);
    return (_jsxs("main", { className: "container", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: "/shipping-companies", className: "btn btn-outline-secondary btn-sm", children: t("shipping.back") }) }), _jsx("h1", { children: t("shipping.detailTitle") }), error ? _jsx("p", { className: "error", children: error }) : null, !item && !error ? _jsx("p", { children: t("details.loading") }) : null, item ? (_jsx("section", { className: "details-card card shadow-sm", children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row row-cols-1 row-cols-md-2 g-3", children: [_jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("shipping.companyName"), ":"] }), " ", item.companyName] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("shipping.code"), ":"] }), " ", item.code] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("shipping.contactName"), ":"] }), " ", item.contactName ?? "—"] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("shipping.phone"), ":"] }), " ", item.phone ?? "—"] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("shipping.email"), ":"] }), " ", item.email ?? "—"] }), _jsxs("p", { className: "details-item col-12 mb-0", children: [_jsxs("strong", { children: [t("shipping.dispatchFormTemplate"), ":"] }), _jsx("br", {}), _jsx("span", { style: { whiteSpace: "pre-wrap" }, children: item.dispatchFormTemplate?.trim() ? item.dispatchFormTemplate : "—" })] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("shipping.location"), ":"] }), " ", item.latitude != null && item.longitude != null ? (_jsx("a", { href: `https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}&zoom=14`, target: "_blank", rel: "noreferrer", children: t("shipping.viewOnMap") })) : ("—")] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("shipping.status"), ":"] }), " ", _jsx("span", { className: "status-badge", children: item.status === "active" ? t("shipping.active") : t("shipping.inactive") })] })] }) }) })) : null] }));
}

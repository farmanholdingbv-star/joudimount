import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
export default function ClientDetailPage() {
    const { id } = useParams();
    const { t, numberLocale } = useI18n();
    const [client, setClient] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        if (!id)
            return;
        apiFetch(`/api/clients/${id}`)
            .then((res) => {
            if (res.status === 404)
                throw new Error("not-found");
            if (!res.ok)
                throw new Error("failed");
            return res.json();
        })
            .then((data) => setClient(data))
            .catch(() => setError(t("clients.detailLoadError")));
    }, [id, t]);
    return (_jsxs("main", { className: "container", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: "/clients", className: "btn btn-outline-secondary btn-sm", children: t("clients.back") }) }), _jsx("h1", { children: t("clients.detailTitle") }), error ? _jsx("p", { className: "error", children: error }) : null, !client && !error ? _jsx("p", { children: t("details.loading") }) : null, client ? (_jsx("section", { className: "details-card card shadow-sm", children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row row-cols-1 row-cols-md-2 g-3", children: [_jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("clients.companyName"), ":"] }), " ", client.companyName] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("clients.trn"), ":"] }), " ", client.trn] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("clients.immigrationCode"), ":"] }), " ", client.immigrationCode ?? "—"] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("clients.clientEmail"), ":"] }), " ", client.email ?? "—"] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("clients.country"), ":"] }), " ", client.country ?? "—"] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("clients.creditLimit"), ":"] }), " ", client.creditLimit.toLocaleString(numberLocale)] }), _jsxs("p", { className: "details-item mb-0", children: [_jsxs("strong", { children: [t("clients.status"), ":"] }), " ", _jsx("span", { className: "status-badge", children: client.status === "active" ? t("clients.active") : t("clients.suspended") })] })] }) }) })) : null] }));
}

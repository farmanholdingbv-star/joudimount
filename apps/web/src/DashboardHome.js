import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
import { transactionListPath } from "./paths";
function roleLabel(role, t) {
    if (role === "manager")
        return t("role.manager");
    if (role === "employee")
        return t("role.employee");
    if (role === "employee2")
        return t("app.roleEmployee2");
    return t("role.accountant");
}
export const DASHBOARD_MODULES = [
    { id: "transactions", route: "/transactions", titleKey: "app.title", descKey: "dashboard.transactionsDesc" },
    { id: "transfers", route: "/transfers", titleKey: "transfer.app.title", descKey: "dashboard.transfersDesc" },
    { id: "exports", route: "/exports", titleKey: "export.app.title", descKey: "dashboard.exportsDesc" },
];
export function DashboardSidebar({ highlight, user, role, onLogout, addModule, }) {
    const { t } = useI18n();
    const itemClass = (key) => `list-group-item list-group-item-action sidebar-link${highlight === key ? " active" : ""}`;
    return (_jsxs("aside", { className: "sidebar-panel card shadow-sm border-0", children: [_jsxs("div", { className: "sidebar-user", children: [_jsx("span", { className: "muted", children: t("app.loggedInAs") }), _jsx("strong", { children: user.name }), _jsx("span", { className: "muted", children: roleLabel(role, t) })] }), _jsxs("nav", { className: "sidebar-links list-group", children: [_jsx(Link, { to: "/", className: itemClass("home"), children: t("nav.home") }), _jsx(Link, { to: "/transactions", className: itemClass("transactions"), children: t("nav.imports") }), _jsx(Link, { to: "/transfers", className: itemClass("transfers"), children: t("nav.transfers") }), _jsx(Link, { to: "/exports", className: itemClass("exports"), children: t("nav.exports") }), _jsx(Link, { to: "/employees", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.employeeSection") }), _jsx(Link, { to: "/clients", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.clients") }), _jsx(Link, { to: "/shipping-companies", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.shippingCompanies") })] }), role === "manager" || role === "employee" ? (_jsx(Link, { to: `/${addModule}/new`, className: "btn btn-primary sidebar-cta", children: t((addModule === "transactions"
                    ? "nav.addTransaction"
                    : addModule === "transfers"
                        ? "nav.addTransfer"
                        : "nav.addExport")) })) : null, _jsx("button", { type: "button", className: "btn btn-outline-danger sidebar-logout", onClick: onLogout, children: t("nav.logout") })] }));
}
export function DashboardHome({ user, role, onLogout, }) {
    const { t, numberLocale } = useI18n();
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [counts, setCounts] = useState({
        transactions: 0,
        transfers: 0,
        exports: 0,
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");
        const limit = 40;
        Promise.all([
            apiFetch(`/api/transactions?limit=${limit}`)
                .then((res) => res.json())
                .then((data) => (Array.isArray(data) ? data : [])),
            apiFetch(`/api/transfers?limit=${limit}`)
                .then((res) => res.json())
                .then((data) => (Array.isArray(data) ? data : [])),
            apiFetch(`/api/exports?limit=${limit}`)
                .then((res) => res.json())
                .then((data) => (Array.isArray(data) ? data : [])),
        ])
            .then(([importsList, transfersList, exportsList]) => {
            if (cancelled)
                return;
            setCounts({
                transactions: importsList.length,
                transfers: transfersList.length,
                exports: exportsList.length,
            });
            const merged = [
                ...importsList.map((tx) => ({ module: "transactions", tx })),
                ...transfersList.map((tx) => ({ module: "transfers", tx })),
                ...exportsList.map((tx) => ({ module: "exports", tx })),
            ];
            merged.sort((a, b) => new Date(b.tx.createdAt).getTime() - new Date(a.tx.createdAt).getTime());
            setRows(merged.slice(0, 80));
        })
            .catch(() => {
            if (!cancelled)
                setError(t("home.loadError"));
        })
            .finally(() => {
            if (!cancelled)
                setLoading(false);
        });
        return () => {
            cancelled = true;
        };
    }, [t]);
    const moduleLabel = (m) => m === "transactions" ? "app.title" : m === "transfers" ? "transfer.app.title" : "export.app.title";
    return (_jsxs("main", { className: "dashboard-page py-3 px-2 px-md-3", children: [_jsxs("div", { className: "dashboard-page-header mx-auto mb-3 px-1", children: [_jsx("h1", { className: "display-6 fw-bold mb-1 text-body", children: t("home.title") }), _jsx("p", { className: "section-subtitle mb-0", children: t("home.tagline") })] }), _jsxs("div", { className: "dashboard-shell mx-auto", children: [error ? _jsx("p", { className: "error alert alert-danger mb-3", children: error }) : null, _jsxs("section", { className: "dashboard-top-tools card shadow-sm border-0 mb-3 p-3 p-md-4", children: [_jsx("h2", { className: "h6 small text-uppercase text-secondary fw-semibold mb-3 dashboard-tools-heading", children: t("home.modulesHeading") }), _jsx("div", { className: "module-cards dashboard-top-module-cards", children: DASHBOARD_MODULES.map((item) => (_jsxs(Link, { to: item.route, className: "module-card card text-decoration-none", children: [_jsx("span", { className: "module-card-title", children: t(item.titleKey) }), _jsx("span", { className: "module-card-desc", children: t(item.descKey) }), _jsxs("span", { className: "small text-primary mt-1", children: [t("home.openFullList"), " \u2192"] })] }, item.id))) }), _jsx("p", { className: "small text-secondary mt-3 mb-0", children: t("home.snapshotHint") }), _jsxs("div", { className: "row g-2 mt-3", children: [_jsx("div", { className: "col-md-4", children: _jsxs("div", { className: "border rounded-3 px-3 py-2 bg-body-secondary bg-opacity-25", children: [_jsx("div", { className: "small text-secondary", children: t("app.title") }), _jsx("div", { className: "fs-5 fw-semibold", children: loading ? "…" : counts.transactions })] }) }), _jsx("div", { className: "col-md-4", children: _jsxs("div", { className: "border rounded-3 px-3 py-2 bg-body-secondary bg-opacity-25", children: [_jsx("div", { className: "small text-secondary", children: t("transfer.app.title") }), _jsx("div", { className: "fs-5 fw-semibold", children: loading ? "…" : counts.transfers })] }) }), _jsx("div", { className: "col-md-4", children: _jsxs("div", { className: "border rounded-3 px-3 py-2 bg-body-secondary bg-opacity-25", children: [_jsx("div", { className: "small text-secondary", children: t("export.app.title") }), _jsx("div", { className: "fs-5 fw-semibold", children: loading ? "…" : counts.exports })] }) })] })] }), _jsxs("div", { className: "dashboard-layout-split", children: [_jsx(DashboardSidebar, { highlight: "home", user: user, role: role, onLogout: onLogout, addModule: "transactions" }), _jsxs("section", { className: "dashboard-list-column card shadow-sm border-0", children: [_jsxs("div", { className: "dashboard-list-toolbar d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-body-tertiary", children: [_jsx("span", { className: "small fw-semibold text-secondary text-truncate me-2", children: t("home.activityHeading") }), _jsx("span", { className: "badge rounded-pill text-bg-primary", children: loading ? "…" : rows.length })] }), _jsx("div", { className: "dashboard-table-scroll", children: _jsxs("table", { className: "table table-hover align-middle mb-0 sticky-table-head", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t("home.col.module") }), _jsx("th", { children: t("list.col.client") }), _jsx("th", { children: t("list.col.declaration") }), _jsx("th", { children: t("list.col.status") }), _jsx("th", { children: t("list.col.createdAt") })] }) }), _jsxs("tbody", { children: [!loading &&
                                                            rows.map(({ module, tx }) => (_jsxs("tr", { className: "clickable-row", onClick: () => navigate(`${transactionListPath(module)}/${tx.id}`), children: [_jsx("td", { children: _jsx("span", { className: "badge rounded-pill text-bg-light border", children: t(moduleLabel(module)) }) }), _jsx("td", { children: tx.clientName }), _jsx("td", { className: "small text-break", children: tx.declarationNumber }), _jsx("td", { children: _jsxs("span", { className: "badge rounded-pill text-bg-light border status-badge-pill", children: [t(`stage.${tx.transactionStage ?? "PREPARATION"}`), " \u00B7 ", tx.clearanceStatus] }) }), _jsx("td", { className: "text-nowrap small", children: new Date(tx.createdAt).toLocaleString(numberLocale) })] }, `${module}-${tx.id}`))), loading && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "text-center text-muted py-5", children: t("home.loading") }) })), !loading && !rows.length && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "text-center text-muted py-5", children: t("home.empty") }) }))] })] }) })] })] })] })] }));
}

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import TransactionDetails from "./TransactionDetails";
import TransactionForm from "./TransactionForm";
import TransactionStoragePage from "./TransactionStoragePage";
import ClientsPage from "./ClientsPage";
import ClientDetailPage from "./ClientDetailPage";
import ShippingCompaniesPage from "./ShippingCompaniesPage";
import ShippingCompanyDetailPage from "./ShippingCompanyDetailPage";
import EmployeeSection from "./EmployeeSection";
import Login from "./Login";
import LanguageSwitcher from "./LanguageSwitcher";
import { apiFetch, getCurrentUser, logout } from "./api";
import { useI18n } from "./i18n/I18nContext";
function roleLabel(role, t) {
    if (role === "manager")
        return t("role.manager");
    if (role === "employee")
        return t("role.employee");
    if (role === "employee2")
        return t("app.roleEmployee2");
    return t("role.accountant");
}
const MODULES = [
    { id: "transactions", route: "/", titleKey: "app.title", descKey: "dashboard.transactionsDesc" },
    { id: "transfers", route: "/transfers", titleKey: "transfer.app.title", descKey: "dashboard.transfersDesc" },
    { id: "exports", route: "/exports", titleKey: "export.app.title", descKey: "dashboard.exportsDesc" },
];
function TransactionsList({ role, user, onLogout, module = "transactions", }) {
    const { t, numberLocale } = useI18n();
    const [transactions, setTransactions] = useState([]);
    const [error, setError] = useState("");
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [stageFilter, setStageFilter] = useState("all");
    const [page, setPage] = useState(1);
    const navigate = useNavigate();
    const pageSize = 30;
    useEffect(() => {
        apiFetch(`/api/${module}`)
            .then((res) => res.json())
            .then((data) => setTransactions(data))
            .catch(() => setError(t(module === "transactions" ? "list.loadError" : (module === "transfers" ? "transfer.list.loadError" : "export.list.loadError"))));
    }, [role, t, module]);
    const filteredTransactions = transactions.filter((tx) => {
        const q = query.trim().toLowerCase();
        const matchesQuery = !q ||
            tx.clientName.toLowerCase().includes(q) ||
            tx.shippingCompanyName.toLowerCase().includes(q) ||
            tx.declarationNumber.toLowerCase().includes(q) ||
            (tx.declarationNumber2 ?? "").toLowerCase().includes(q) ||
            tx.airwayBill.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || tx.clearanceStatus === statusFilter;
        const matchesStage = stageFilter === "all" || (tx.transactionStage ?? "PREPARATION") === stageFilter;
        return matchesQuery && matchesStatus && matchesStage;
    });
    useEffect(() => {
        setPage(1);
    }, [query, statusFilter, stageFilter]);
    const statusOptions = Array.from(new Set(transactions.map((tx) => tx.clearanceStatus)));
    const stageOptions = Array.from(new Set(transactions.map((tx) => tx.transactionStage ?? "PREPARATION")));
    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const pagedTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const moduleTitle = t((module === "transactions" ? "app.title" : module === "transfers" ? "transfer.app.title" : "export.app.title"));
    const moduleTagline = t((module === "transactions" ? "app.tagline" : module === "transfers" ? "transfer.app.tagline" : "export.app.tagline"));
    return (_jsxs("main", { className: "dashboard-page py-3 px-2 px-md-3", children: [_jsxs("div", { className: "dashboard-page-header mx-auto mb-3 px-1", children: [_jsx("h1", { className: "display-6 fw-bold mb-1 text-body", children: moduleTitle }), _jsx("p", { className: "section-subtitle mb-0", children: moduleTagline })] }), _jsxs("div", { className: "dashboard-shell mx-auto", children: [error ? _jsx("p", { className: "error alert alert-danger mb-3", children: error }) : null, _jsxs("section", { className: "dashboard-top-tools card shadow-sm border-0 mb-3 p-3 p-md-4", children: [_jsx("h2", { className: "h6 small text-uppercase text-secondary fw-semibold mb-3 dashboard-tools-heading", children: t("dashboard.toolsHeading") }), _jsx("div", { className: "module-cards dashboard-top-module-cards", children: MODULES.map((item) => (_jsxs(Link, { to: item.route, className: `module-card card text-decoration-none ${module === item.id ? "module-card-active" : ""}`, children: [_jsx("span", { className: "module-card-title", children: t(item.titleKey) }), _jsx("span", { className: "module-card-desc", children: t(item.descKey) })] }, item.id))) }), _jsx("hr", { className: "my-3 text-secondary opacity-25" }), _jsxs("div", { className: "row g-2 g-lg-3", children: [_jsxs("div", { className: "col-12 col-lg-6", children: [_jsx("label", { className: "form-label small text-secondary mb-1 d-none d-md-block", children: t("list.searchPlaceholder") }), _jsx("input", { className: "form-control", type: "text", value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("list.searchPlaceholder") })] }), _jsxs("div", { className: "col-12 col-md-6 col-lg-3", children: [_jsx("label", { className: "form-label small text-secondary mb-1 d-none d-md-block", children: t("list.filterAllStatuses") }), _jsxs("select", { className: "form-select", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: t("list.filterAllStatuses") }), statusOptions.map((status) => (_jsx("option", { value: status, children: status }, status)))] })] }), _jsxs("div", { className: "col-12 col-md-6 col-lg-3", children: [_jsx("label", { className: "form-label small text-secondary mb-1 d-none d-md-block", children: t("list.filterAllStages") }), _jsxs("select", { className: "form-select", value: stageFilter, onChange: (e) => setStageFilter(e.target.value), children: [_jsx("option", { value: "all", children: t("list.filterAllStages") }), stageOptions.map((stage) => (_jsx("option", { value: stage, children: t(`stage.${stage}`) }, stage)))] })] })] })] }), _jsxs("div", { className: "dashboard-layout-split", children: [_jsxs("aside", { className: "sidebar-panel card shadow-sm border-0", children: [_jsxs("div", { className: "sidebar-user", children: [_jsx("span", { className: "muted", children: t("app.loggedInAs") }), _jsx("strong", { children: user.name }), _jsx("span", { className: "muted", children: roleLabel(role, t) })] }), _jsxs("nav", { className: "sidebar-links list-group", children: [_jsx(Link, { to: "/employees", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.employeeSection") }), _jsx(Link, { to: "/clients", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.clients") }), _jsx(Link, { to: "/shipping-companies", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.shippingCompanies") }), _jsx(Link, { to: "/transfers", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.transfers") }), _jsx(Link, { to: "/exports", className: "list-group-item list-group-item-action sidebar-link", children: t("nav.exports") })] }), role === "manager" || role === "employee" ? (_jsx(Link, { to: `/${module}/new`, className: "btn btn-primary sidebar-cta", children: t((module === "transactions" ? "nav.addTransaction" : module === "transfers" ? "nav.addTransfer" : "nav.addExport")) })) : null, _jsx("button", { className: "btn btn-outline-danger sidebar-logout", onClick: onLogout, children: t("nav.logout") })] }), _jsxs("section", { className: "dashboard-list-column card shadow-sm border-0", children: [_jsxs("div", { className: "dashboard-list-toolbar d-flex align-items-center justify-content-between px-3 py-2 border-bottom bg-body-tertiary", children: [_jsx("span", { className: "small fw-semibold text-secondary text-truncate me-2", children: moduleTitle }), _jsx("span", { className: "badge rounded-pill text-bg-primary", children: filteredTransactions.length })] }), _jsx("div", { className: "dashboard-table-scroll", children: _jsxs("table", { className: "table table-hover align-middle mb-0 sticky-table-head", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t("list.col.client") }), _jsx("th", { children: t("list.col.shippingCompany") }), _jsx("th", { children: t("list.col.status") }), _jsx("th", { children: t("list.col.storage") }), _jsx("th", { children: t("list.col.createdAt") })] }) }), _jsxs("tbody", { children: [pagedTransactions.map((tx) => (_jsxs("tr", { className: "clickable-row", onClick: () => navigate(`/${module}/${tx.id}`), children: [_jsx("td", { children: tx.clientName }), _jsx("td", { children: tx.shippingCompanyName }), _jsx("td", { children: _jsxs("span", { className: "badge rounded-pill text-bg-light border status-badge-pill", children: [t(`stage.${tx.transactionStage ?? "PREPARATION"}`), " \u00B7 ", tx.clearanceStatus] }) }), _jsx("td", { onClick: (e) => e.stopPropagation(), children: tx.transactionStage === "STORAGE" && (module === "transactions" || module === "transfers") ? (_jsx(Link, { to: `/${module}/${tx.id}/storage`, className: "btn btn-sm btn-outline-primary", children: t("storagePage.openCard") })) : ("—") }), _jsx("td", { className: "text-nowrap small", children: new Date(tx.createdAt).toLocaleString(numberLocale) })] }, tx.id))), !filteredTransactions.length && (_jsx("tr", { children: _jsx("td", { colSpan: 5, className: "text-center text-muted py-5", children: t("list.noResults") }) }))] })] }) }), filteredTransactions.length > 0 ? (_jsx("div", { className: "dashboard-list-footer border-top px-3 py-2 bg-body-tertiary", children: _jsxs("div", { className: "d-flex flex-wrap gap-2 align-items-center justify-content-center", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-primary", onClick: () => setPage(currentPage - 1), disabled: currentPage === 1, children: t("list.paginationPrev") }), Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (_jsx("button", { type: "button", className: p === currentPage ? "btn btn-sm btn-primary" : "btn btn-sm btn-outline-secondary", onClick: () => setPage(p), children: p }, p))), _jsx("button", { type: "button", className: "btn btn-sm btn-primary", onClick: () => setPage(currentPage + 1), disabled: currentPage === totalPages, children: t("list.paginationNext") })] }) })) : null] })] })] })] }));
}
export default function App() {
    const [user, setUser] = useState(getCurrentUser());
    useEffect(() => {
        const onLogoutEvent = () => setUser(null);
        window.addEventListener("auth:logout", onLogoutEvent);
        return () => window.removeEventListener("auth:logout", onLogoutEvent);
    }, []);
    const handleLogout = async () => {
        await logout();
        setUser(null);
    };
    return (_jsxs(_Fragment, { children: [_jsx("header", { className: "app-header container py-3", children: _jsxs("div", { className: "d-flex align-items-center justify-content-between flex-wrap gap-3", children: [_jsx("img", { src: "/logo.png", alt: "Project logo", width: 66, height: 66, className: "app-logo flex-shrink-0" }), _jsxs("div", { className: "d-flex align-items-center flex-wrap gap-3 justify-content-end ms-auto", children: [_jsx("div", { className: "app-header-user-wrap min-w-0", children: user ? _jsx("span", { className: "app-header-user badge text-bg-light border", children: user.name }) : null }), _jsx(LanguageSwitcher, {})] })] }) }), !user ? (_jsx(Login, { onLogin: setUser })) : (_jsx(AuthenticatedRoutes, { user: user, onLogout: handleLogout }))] }));
}
function NotFoundPage() {
    const { t } = useI18n();
    return (_jsxs("main", { className: "container", children: [_jsx("h1", { className: "display-6 fw-bold mb-3", children: t("notFound.title") }), _jsx(Link, { to: "/", className: "btn btn-outline-primary", children: t("notFound.dashboard") })] }));
}
function AuthenticatedRoutes({ user, onLogout }) {
    const role = user.role;
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(TransactionsList, { role: role, user: user, onLogout: onLogout, module: "transactions" }) }), _jsx(Route, { path: "/transfers", element: _jsx(TransactionsList, { role: role, user: user, onLogout: onLogout, module: "transfers" }) }), _jsx(Route, { path: "/exports", element: _jsx(TransactionsList, { role: role, user: user, onLogout: onLogout, module: "exports" }) }), _jsx(Route, { path: "/employees", element: _jsx(EmployeeSection, { role: role }) }), _jsx(Route, { path: "/clients", element: _jsx(ClientsPage, { role: role }) }), _jsx(Route, { path: "/clients/:id", element: _jsx(ClientDetailPage, {}) }), _jsx(Route, { path: "/shipping-companies", element: _jsx(ShippingCompaniesPage, { role: role }) }), _jsx(Route, { path: "/shipping-companies/:id", element: _jsx(ShippingCompanyDetailPage, {}) }), _jsx(Route, { path: "/transactions/new", element: _jsx(TransactionForm, { role: role, module: "transactions" }) }), _jsx(Route, { path: "/transactions/:id/edit", element: _jsx(TransactionForm, { role: role, module: "transactions" }) }), _jsx(Route, { path: "/transactions/:id", element: _jsx(TransactionDetails, { role: role, module: "transactions" }) }), _jsx(Route, { path: "/transactions/:id/storage", element: _jsx(TransactionStoragePage, { role: role, module: "transactions" }) }), _jsx(Route, { path: "/transfers/new", element: _jsx(TransactionForm, { role: role, module: "transfers" }) }), _jsx(Route, { path: "/transfers/:id/edit", element: _jsx(TransactionForm, { role: role, module: "transfers" }) }), _jsx(Route, { path: "/transfers/:id", element: _jsx(TransactionDetails, { role: role, module: "transfers" }) }), _jsx(Route, { path: "/transfers/:id/storage", element: _jsx(TransactionStoragePage, { role: role, module: "transfers" }) }), _jsx(Route, { path: "/exports/new", element: _jsx(TransactionForm, { role: role, module: "exports" }) }), _jsx(Route, { path: "/exports/:id/edit", element: _jsx(TransactionForm, { role: role, module: "exports" }) }), _jsx(Route, { path: "/exports/:id", element: _jsx(TransactionDetails, { role: role, module: "exports" }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }));
}

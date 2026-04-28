import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import TransactionDetails from "./TransactionDetails";
import TransactionForm from "./TransactionForm";
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
    return (_jsxs("main", { className: "container", children: [_jsx("h1", { children: t((module === "transactions" ? "app.title" : module === "transfers" ? "transfer.app.title" : "export.app.title")) }), _jsx("p", { className: "section-subtitle", children: t((module === "transactions" ? "app.tagline" : module === "transfers" ? "transfer.app.tagline" : "export.app.tagline")) }), _jsxs("div", { className: "menu-bar", children: [_jsxs("div", { className: "menu-row", children: [_jsxs("span", { children: [t("app.loggedInAs"), ": ", user.name, " (", roleLabel(role, t), ")"] }), _jsxs("div", { className: "menu-links", children: [_jsx(Link, { to: "/employees", className: "link-button", children: t("nav.employeeSection") }), _jsx(Link, { to: "/clients", className: "link-button", children: t("nav.clients") }), _jsx(Link, { to: "/shipping-companies", className: "link-button", children: t("nav.shippingCompanies") }), _jsx(Link, { to: "/transfers", className: "link-button", children: t("nav.transfers") }), _jsx(Link, { to: "/exports", className: "link-button", children: t("nav.exports") }), role === "manager" || role === "employee" ? (_jsx(Link, { to: `/${module}/new`, className: "primary-button", children: t((module === "transactions" ? "nav.addTransaction" : module === "transfers" ? "nav.addTransfer" : "nav.addExport")) })) : null, _jsx("button", { className: "danger-button", onClick: onLogout, children: t("nav.logout") })] })] }), _jsx("div", { className: "module-cards", children: MODULES.map((item) => (_jsxs(Link, { to: item.route, className: `module-card ${module === item.id ? "module-card-active" : ""}`, children: [_jsx("span", { className: "module-card-title", children: t(item.titleKey) }), _jsx("span", { className: "module-card-desc", children: t(item.descKey) })] }, item.id))) }), _jsxs("div", { className: "filter-row", children: [_jsx("input", { className: "filter-input", type: "text", value: query, onChange: (e) => setQuery(e.target.value), placeholder: t("list.searchPlaceholder") }), _jsxs("select", { className: "filter-select", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "all", children: t("list.filterAllStatuses") }), statusOptions.map((status) => (_jsx("option", { value: status, children: status }, status)))] }), _jsxs("select", { className: "filter-select", value: stageFilter, onChange: (e) => setStageFilter(e.target.value), children: [_jsx("option", { value: "all", children: t("list.filterAllStages") }), stageOptions.map((stage) => (_jsx("option", { value: stage, children: t(`stage.${stage}`) }, stage)))] })] })] }), error ? _jsx("p", { className: "error", children: error }) : null, _jsx("div", { className: "table-wrap", children: _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t("list.col.client") }), _jsx("th", { children: t("list.col.shippingCompany") }), _jsx("th", { children: t("list.col.status") }), _jsx("th", { children: t("list.col.createdAt") })] }) }), _jsxs("tbody", { children: [pagedTransactions.map((tx) => (_jsxs("tr", { className: "clickable-row", onClick: () => navigate(`/${module}/${tx.id}`), children: [_jsx("td", { children: tx.clientName }), _jsx("td", { children: tx.shippingCompanyName }), _jsx("td", { children: _jsxs("span", { className: "status-badge", children: [t(`stage.${tx.transactionStage ?? "PREPARATION"}`), " \u2022 ", tx.clearanceStatus] }) }), _jsx("td", { children: new Date(tx.createdAt).toLocaleString(numberLocale) })] }, tx.id))), !filteredTransactions.length && (_jsx("tr", { children: _jsx("td", { colSpan: 4, children: t("list.noResults") }) }))] })] }) }), filteredTransactions.length > 0 && (_jsxs("div", { className: "page-actions", children: [_jsx("button", { type: "button", className: "primary-button", onClick: () => setPage(currentPage - 1), disabled: currentPage === 1, children: t("list.paginationPrev") }), Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (_jsx("button", { type: "button", className: p === currentPage ? "primary-button" : "link-button", onClick: () => setPage(p), children: p }, p))), _jsx("button", { type: "button", className: "primary-button", onClick: () => setPage(currentPage + 1), disabled: currentPage === totalPages, children: t("list.paginationNext") })] }))] }));
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
    return (_jsxs(_Fragment, { children: [_jsxs("header", { className: "app-header", children: [_jsx("img", { src: "/logo.png", alt: "Project logo", width: 66, height: 66, className: "app-logo" }), _jsx("div", { className: "app-header-user-wrap", children: user ? _jsx("span", { className: "app-header-user", children: user.name }) : null }), _jsx(LanguageSwitcher, {})] }), !user ? (_jsx(Login, { onLogin: setUser })) : (_jsx(AuthenticatedRoutes, { user: user, onLogout: handleLogout }))] }));
}
function NotFoundPage() {
    const { t } = useI18n();
    return (_jsxs("main", { className: "container", children: [_jsx("h1", { children: t("notFound.title") }), _jsx(Link, { to: "/", className: "link-button", children: t("notFound.dashboard") })] }));
}
function AuthenticatedRoutes({ user, onLogout }) {
    const role = user.role;
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(TransactionsList, { role: role, user: user, onLogout: onLogout, module: "transactions" }) }), _jsx(Route, { path: "/transfers", element: _jsx(TransactionsList, { role: role, user: user, onLogout: onLogout, module: "transfers" }) }), _jsx(Route, { path: "/exports", element: _jsx(TransactionsList, { role: role, user: user, onLogout: onLogout, module: "exports" }) }), _jsx(Route, { path: "/employees", element: _jsx(EmployeeSection, { role: role }) }), _jsx(Route, { path: "/clients", element: _jsx(ClientsPage, { role: role }) }), _jsx(Route, { path: "/clients/:id", element: _jsx(ClientDetailPage, {}) }), _jsx(Route, { path: "/shipping-companies", element: _jsx(ShippingCompaniesPage, { role: role }) }), _jsx(Route, { path: "/shipping-companies/:id", element: _jsx(ShippingCompanyDetailPage, {}) }), _jsx(Route, { path: "/transactions/new", element: _jsx(TransactionForm, { role: role, module: "transactions" }) }), _jsx(Route, { path: "/transactions/:id/edit", element: _jsx(TransactionForm, { role: role, module: "transactions" }) }), _jsx(Route, { path: "/transactions/:id", element: _jsx(TransactionDetails, { role: role, module: "transactions" }) }), _jsx(Route, { path: "/transfers/new", element: _jsx(TransactionForm, { role: role, module: "transfers" }) }), _jsx(Route, { path: "/transfers/:id/edit", element: _jsx(TransactionForm, { role: role, module: "transfers" }) }), _jsx(Route, { path: "/transfers/:id", element: _jsx(TransactionDetails, { role: role, module: "transfers" }) }), _jsx(Route, { path: "/exports/new", element: _jsx(TransactionForm, { role: role, module: "exports" }) }), _jsx(Route, { path: "/exports/:id/edit", element: _jsx(TransactionForm, { role: role, module: "exports" }) }), _jsx(Route, { path: "/exports/:id", element: _jsx(TransactionDetails, { role: role, module: "exports" }) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }));
}

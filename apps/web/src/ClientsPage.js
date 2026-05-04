import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "./api";
import { useI18n } from "./i18n/I18nContext";
const emptyClient = {
    companyName: "",
    trn: "",
    immigrationCode: "",
    email: "",
    country: "",
    creditLimit: 0,
    status: "active",
};
export default function ClientsPage({ role }) {
    const { t, numberLocale } = useI18n();
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [form, setForm] = useState(emptyClient);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const isManager = role === "manager";
    async function loadClients() {
        const res = await apiFetch("/api/clients");
        if (!res.ok)
            throw new Error("failed");
        const data = (await res.json());
        setClients(data);
    }
    useEffect(() => {
        loadClients().catch(() => setError(t("clients.loadError")));
    }, [t]);
    const onSubmit = async (event) => {
        event.preventDefault();
        if (!isManager)
            return;
        setError("");
        const path = editingId ? `/api/clients/${editingId}` : "/api/clients";
        const method = editingId ? "PUT" : "POST";
        const res = await apiFetch(path, {
            method,
            body: JSON.stringify({
                ...form,
                creditLimit: Number(form.creditLimit),
            }),
        });
        if (!res.ok) {
            setError(t("clients.saveError"));
            return;
        }
        setForm(emptyClient);
        setEditingId(null);
        await loadClients();
    };
    const onEdit = (client) => {
        setEditingId(client.id);
        setForm({
            companyName: client.companyName,
            trn: client.trn,
            immigrationCode: client.immigrationCode ?? "",
            email: client.email ?? "",
            country: client.country ?? "",
            creditLimit: client.creditLimit,
            status: client.status,
        });
    };
    const onDelete = async (id) => {
        if (!isManager)
            return;
        if (!window.confirm(t("clients.deleteConfirm")))
            return;
        const res = await apiFetch(`/api/clients/${id}`, { method: "DELETE" });
        if (!res.ok) {
            setError(t("clients.deleteError"));
            return;
        }
        await loadClients();
    };
    return (_jsxs("main", { className: "container py-2", children: [_jsx("div", { className: "page-actions", children: _jsx(Link, { to: "/", className: "btn btn-outline-secondary btn-sm", children: t("clients.back") }) }), _jsx("h1", { className: "display-6 fw-bold", children: t("clients.title") }), _jsx("p", { className: "section-subtitle", children: t("clients.managerOnly") }), !isManager ? _jsx("p", { className: "muted", children: t("clients.managerOnly") }) : null, error ? _jsx("p", { className: "error alert alert-danger", children: error }) : null, isManager ? (_jsx("form", { className: "card shadow-sm mb-4", onSubmit: onSubmit, children: _jsx("div", { className: "card-body", children: _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("clients.companyName") }), _jsx("input", { className: "form-control mt-1", value: form.companyName, onChange: (e) => setForm({ ...form, companyName: e.target.value }), required: true })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("clients.trn") }), _jsx("input", { className: "form-control mt-1", value: form.trn, onChange: (e) => setForm({ ...form, trn: e.target.value }), required: true })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("clients.immigrationCode") }), _jsx("input", { className: "form-control mt-1", value: form.immigrationCode, onChange: (e) => setForm({ ...form, immigrationCode: e.target.value }) })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("clients.clientEmail") }), _jsx("input", { className: "form-control mt-1", type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }) })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("clients.country") }), _jsx("input", { className: "form-control mt-1", value: form.country, onChange: (e) => setForm({ ...form, country: e.target.value }) })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("clients.creditLimit") }), _jsx("input", { className: "form-control mt-1", type: "number", min: 0, value: form.creditLimit, onChange: (e) => setForm({ ...form, creditLimit: Number(e.target.value) }), required: true })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label mb-0", children: t("clients.status") }), _jsxs("select", { className: "form-select mt-1", value: form.status, onChange: (e) => setForm({ ...form, status: e.target.value }), children: [_jsx("option", { value: "active", children: t("clients.active") }), _jsx("option", { value: "suspended", children: t("clients.suspended") })] })] }), _jsx("div", { className: "col-12", children: _jsx("button", { className: "btn btn-primary", type: "submit", children: editingId ? t("clients.update") : t("clients.create") }) })] }) }) })) : null, _jsx("div", { className: "table-wrap card shadow-sm", children: _jsxs("table", { className: "table table-hover align-middle mb-0", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: t("clients.companyName") }), _jsx("th", { children: t("clients.trn") }), _jsx("th", { children: t("clients.immigrationCode") }), _jsx("th", { children: t("clients.clientEmail") }), _jsx("th", { children: t("clients.country") }), _jsx("th", { children: t("clients.creditLimit") }), _jsx("th", { children: t("clients.status") }), isManager ? _jsx("th", { children: t("clients.actions") }) : null] }) }), _jsxs("tbody", { children: [clients.map((client) => (_jsxs("tr", { className: "clickable-row", onClick: () => navigate(`/clients/${client.id}`), children: [_jsx("td", { children: client.companyName }), _jsx("td", { children: client.trn }), _jsx("td", { children: client.immigrationCode ?? "-" }), _jsx("td", { children: client.email ?? "-" }), _jsx("td", { children: client.country ?? "-" }), _jsx("td", { children: client.creditLimit.toLocaleString(numberLocale) }), _jsx("td", { children: _jsx("span", { className: "status-badge", children: client.status }) }), isManager ? (_jsxs("td", { onClick: (e) => e.stopPropagation(), children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-primary", onClick: () => onEdit(client), children: t("clients.edit") }), " ", _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", onClick: () => onDelete(client.id), children: t("clients.delete") })] })) : null] }, client.id))), !clients.length && (_jsx("tr", { children: _jsx("td", { colSpan: isManager ? 8 : 7, children: t("clients.empty") }) }))] })] }) })] }));
}
